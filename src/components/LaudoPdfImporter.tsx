import { useState } from 'react';
import { SearchCode, X, Zap, FileText, RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Extinguisher } from '@/types';

interface LaudoPdfImporterProps {
  extinguishers: Extinguisher[];
  onUpdate: (type: string, id: string, item: any) => void;
  onAdd: (type: string, item: any) => void;
  onClose: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

interface ExtractedData {
  numero_cilindro_ou_recipiente: string;
  ano_ultimo_th_ou_reteste: string;
  tipo_extintor: string;
  marca_fabricante: string;
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const LaudoPdfImporter = ({ 
  extinguishers, 
  onUpdate, 
  onAdd, 
  onClose, 
  notify 
}: LaudoPdfImporterProps) => {
  const [fileName, setFileName] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [jsonOutput, setJsonOutput] = useState('Nenhum dado extraído ainda.');
  const [status, setStatus] = useState({ message: 'Aguardando upload do PDF.', type: 'info' });
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractionComplete, setIsExtractionComplete] = useState(false);
  const [extractedText, setExtractedText] = useState('');

  const displayStatus = (message: string, type: string) => {
    setStatus({ message, type });
    if (type === 'error' || type === 'success' || type === 'warning') {
      notify(message, type as any);
    }
  };

  const getNextExtinguisherId = (): string => {
    const numbers = extinguishers.map(item => {
      const match = item.id.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `EXT-${String(max + 1).padStart(3, '0')}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setRawContent('Carregando arquivo...');
    setJsonOutput('Nenhum dado extraído ainda.');
    setIsExtractionComplete(false);
    setIsLoading(true);
    displayStatus(`Arquivo ${file.name} carregado. Extraindo texto...`, 'info');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = arrayBufferToBase64(arrayBuffer);
      
      // Extract text from PDF using AI
      const { data, error } = await supabase.functions.invoke('process-pdf-laudo', {
        body: { 
          pdfBase64: base64Data, 
          mimeType: file.type,
          action: 'extract_text'
        }
      });

      if (error) throw error;

      if (data.content) {
        setRawContent(data.content);
        setExtractedText(data.content);
        displayStatus('Texto extraído com sucesso. Clique em "Extrair Dados" para estruturar.', 'success');
      } else {
        throw new Error('Nenhum texto extraído do PDF');
      }
    } catch (error) {
      console.error("Erro ao processar PDF:", error);
      displayStatus('Erro ao ler o arquivo. Certifique-se de que é um PDF válido.', 'error');
      setRawContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const generateStructuredData = async () => {
    if (!extractedText) {
      displayStatus('Nenhum texto para analisar.', 'warning');
      return;
    }

    setIsLoading(true);
    displayStatus('Analisando a tabela e extraindo dados estruturados (JSON)...', 'info');
    setJsonOutput("Analisando dados...");

    try {
      const { data, error } = await supabase.functions.invoke('process-pdf-laudo', {
        body: { 
          pdfBase64: extractedText,
          action: 'extract_json'
        }
      });

      if (error) throw error;

      let jsonData: ExtractedData[] = [];
      
      // Try to parse the JSON from the response
      const content = data.content || '';
      
      // Find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Não foi possível extrair dados JSON do laudo');
      }

      const prettyJson = JSON.stringify(jsonData, null, 2);
      setJsonOutput(prettyJson);

      // Process and feed the data
      processExtractedData(jsonData);

    } catch (error) {
      console.error("Erro ao estruturar dados:", error);
      displayStatus('Erro ao estruturar dados. Tente novamente.', 'error');
      setJsonOutput('Erro ao processar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const processExtractedData = (dataArray: ExtractedData[]) => {
    if (!dataArray || dataArray.length === 0) {
      displayStatus("Nenhum dado de extintor válido foi extraído.", "warning");
      return;
    }

    let updatedCount = 0;
    let addedCount = 0;
    let nextId = getNextExtinguisherId();
    const today = new Date().toISOString().split('T')[0];

    dataArray.forEach(item => {
      const numeroCilindro = item.numero_cilindro_ou_recipiente?.trim();
      const anoTH = item.ano_ultimo_th_ou_reteste?.trim();
      const tipo = item.tipo_extintor?.trim() || 'Pó Químico ABC';
      const marca = item.marca_fabricante?.trim() || 'Desconhecido';

      if (!numeroCilindro) return;

      const existingExtinguisher = extinguishers.find(e => e.numeroCilindro === numeroCilindro);

      // Calculate TH date
      let thDate = today;
      if (anoTH) {
        const year = parseInt(anoTH, 10);
        if (!isNaN(year) && year > 2000) {
          thDate = `${year}-01-01`;
        }
      }

      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const proximaManutencao = nextYear.toISOString().split('T')[0];

      if (existingExtinguisher) {
        // Update existing extinguisher
        const updatedItem = {
          ...existingExtinguisher,
          testeHidrostatico: thDate,
          ultimaManutencao: today,
          proximaManutencao,
          status: 'ok',
          tipo: existingExtinguisher.tipo || tipo,
          marca: existingExtinguisher.marca || marca,
          historico: [
            ...(existingExtinguisher.historico || []),
            {
              data: today,
              descricao: `Dados de T.H. e Recarga importados do Laudo PDF. Ano TH: ${anoTH || 'N/A'}`,
              tipo: 'manutencao',
              tecnico: 'Sistema IA',
            }
          ]
        };

        onUpdate('extinguishers', existingExtinguisher.id, updatedItem);
        updatedCount++;
      } else {
        // Create new extinguisher
        const newExtinguisher = {
          id: nextId,
          clientId: 'cli_001',
          sede: 'Matriz',
          marca,
          tipo,
          capacidade: '4kg',
          localizacao: 'A definir (Importado via Laudo)',
          fabricacao: new Date().getFullYear().toString(),
          numeroCilindro,
          ultimaManutencao: today,
          proximaManutencao,
          testeHidrostatico: thDate,
          status: 'ok',
          historico: [{
            data: today,
            descricao: `Novo extintor adicionado via Laudo PDF (Nº Cilindro: ${numeroCilindro}). Ano T.H.: ${anoTH || 'N/A'}`,
            tipo: 'cadastro',
            tecnico: 'Sistema IA',
          }],
        };

        onAdd('extinguishers', newExtinguisher);
        
        // Prepare next ID
        const maxIdMatch = nextId.match(/EXT-(\d+)/);
        if (maxIdMatch) {
          const nextNum = parseInt(maxIdMatch[1], 10) + 1;
          nextId = `EXT-${String(nextNum).padStart(3, '0')}`;
        }
        addedCount++;
      }
    });

    const finalMessage = `Importação concluída: ${updatedCount} extintores atualizados e ${addedCount} novos extintores adicionados.`;
    displayStatus(finalMessage, "success");
    setIsExtractionComplete(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh]">
        <div className="bg-red-700 text-white p-6 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <SearchCode className="w-6 h-6"/> Importar Laudo PDF com IA
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">1. Arquivo PDF</label>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileUpload} 
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              {fileName && <p className="mt-1 text-xs text-gray-500 truncate">Carregado: {fileName}</p>}
            </div>
            <div className="md:w-1/3">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">2. Processamento</label>
              <button
                onClick={generateStructuredData}
                disabled={isLoading || !rawContent || isExtractionComplete}
                className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-5 w-5 border-4 border-white border-t-transparent rounded-full mr-2"></span>
                    Processando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" /> Extrair Dados
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className={`p-3 rounded-lg text-sm font-medium ${
            status.type === 'info' ? 'bg-blue-100 text-blue-800' : 
            status.type === 'success' ? 'bg-green-100 text-green-800' : 
            status.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status.message}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Conteúdo Bruto (OCR)</h3>
              <div className="flex-grow overflow-y-auto bg-gray-50 border border-gray-300 p-4 rounded-lg text-xs text-gray-800 whitespace-pre-wrap font-mono h-48 lg:h-64">
                {rawContent || 'Aguardando texto do PDF...'}
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Dados Estruturados (JSON)</h3>
              <textarea
                value={jsonOutput}
                readOnly
                className="flex-grow overflow-y-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs resize-none shadow-inner border border-gray-700 h-48 lg:h-64"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button 
            onClick={onClose} 
            className="w-full bg-slate-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-slate-300"
          >
            {isExtractionComplete ? 'Fechar e Continuar no Painel' : 'Cancelar Importação'}
          </button>
        </div>
      </div>
    </div>
  );
};
