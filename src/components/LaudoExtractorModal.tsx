import { useState } from 'react';
import { SearchCode, X, Zap, FileUp, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LaudoExtractorModalProps {
  onClose: () => void;
  onDataExtracted: (data: any[]) => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

export const LaudoExtractorModal = ({ onClose, onDataExtracted, notify }: LaudoExtractorModalProps) => {
  const [fileName, setFileName] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [jsonOutput, setJsonOutput] = useState('Nenhum dado extraído ainda.');
  const [status, setStatus] = useState({ message: 'Aguardando upload do PDF.', type: 'info' });
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractionComplete, setIsExtractionComplete] = useState(false);
  const [uploadedFileBase64, setUploadedFileBase64] = useState<{ data: string; mimeType: string } | null>(null);

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const displayStatus = (message: string, type: string) => {
    setStatus({ message, type });
    if (type === 'error' || type === 'success' || type === 'warning') {
      notify(message, type as any);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setRawContent('Carregando arquivo...');
    setJsonOutput('Nenhum dado extraído ainda.');
    setUploadedFileBase64(null);
    setIsExtractionComplete(false);
    setIsLoading(true);
    displayStatus(`Arquivo ${file.name} carregado. Lendo...`, 'info');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = arrayBufferToBase64(e.target?.result as ArrayBuffer);
        setUploadedFileBase64({ data: base64Data, mimeType: file.type });
        await extractTextFromPdf(base64Data, file.type);
      } catch (error) {
        console.error("Erro ao ler o arquivo:", error);
        displayStatus('Erro ao ler o arquivo. Certifique-se de que é um PDF válido.', 'error');
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const extractTextFromPdf = async (base64Data: string, mimeType: string) => {
    displayStatus('Lendo e extraindo texto do PDF (OCR IA)...', 'info');

    try {
      const { data, error } = await supabase.functions.invoke('process-pdf-laudo', {
        body: { pdfBase64: base64Data, mimeType, action: 'extract_text' }
      });

      if (error) throw error;

      if (data?.content) {
        displayStatus('Texto extraído com sucesso. Pressione "Extrair Dados" para estruturar.', 'success');
        setRawContent(data.content);
        setIsLoading(false);
        return data.content;
      } else {
        throw new Error("Resposta da IA vazia.");
      }
    } catch (error: any) {
      console.error("Erro na extração de texto:", error);
      displayStatus(`Erro ao extrair texto do PDF: ${error.message}`, 'error');
      setRawContent(`ERRO: ${error.message}`);
      setIsLoading(false);
    }
    return null;
  };

  const generateStructuredData = async () => {
    if (!rawContent || rawContent.startsWith('ERRO')) {
      displayStatus('Nenhum texto válido para analisar. Faça o upload do PDF novamente.', 'warning');
      return;
    }

    setIsLoading(true);
    displayStatus('Analisando a tabela e extraindo dados estruturados (JSON)...', 'info');
    setJsonOutput("Analisando dados...");

    try {
      const { data, error } = await supabase.functions.invoke('process-pdf-laudo', {
        body: { pdfBase64: rawContent, mimeType: 'text/plain', action: 'extract_json' }
      });

      if (error) throw error;

      if (data?.content) {
        try {
          const parsedJson = JSON.parse(data.content);
          const prettyJson = JSON.stringify(parsedJson, null, 2);
          setJsonOutput(prettyJson);
          onDataExtracted(parsedJson);
          displayStatus('Extração JSON concluída. Pronto para importar!', 'success');
          setIsExtractionComplete(true);
        } catch (parseError) {
          setJsonOutput(data.content);
          displayStatus('Dados extraídos, mas formato JSON inválido.', 'warning');
        }
      } else {
        throw new Error("Resposta vazia da IA.");
      }
    } catch (error: any) {
      console.error("Erro na extração JSON:", error);
      displayStatus(`Erro ao estruturar dados: ${error.message}`, 'error');
      setJsonOutput(`ERRO: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <SearchCode className="w-6 h-6" />
            <span className="font-bold text-lg">Importar Laudo PDF com IA</span>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: File Upload */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="bg-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Arquivo PDF
            </h3>
            <label className="block w-full p-6 border-2 border-dashed border-slate-600 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileUp className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <p className="text-slate-400 text-sm">Clique para selecionar o PDF do laudo</p>
            </label>
            {fileName && (
              <p className="text-green-400 text-sm mt-2">✓ Carregado: {fileName}</p>
            )}
          </div>

          {/* Step 2: Processing */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="bg-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              Processamento
            </h3>
            <button
              onClick={generateStructuredData}
              disabled={isLoading || !rawContent || rawContent.startsWith('ERRO')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" /> Extrair Dados
                </>
              )}
            </button>
            <p className={`mt-3 text-sm ${status.type === 'error' ? 'text-red-400' : status.type === 'success' ? 'text-green-400' : 'text-slate-400'}`}>
              {status.message}
            </p>
          </div>

          {/* Raw Content */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-xl p-4">
              <h4 className="text-slate-300 font-bold mb-2 text-sm">Conteúdo Bruto (OCR)</h4>
              <div className="bg-slate-950 rounded-lg p-3 h-48 overflow-y-auto">
                <pre className="text-xs text-slate-400 whitespace-pre-wrap">
                  {rawContent || 'Aguardando texto do PDF...'}
                </pre>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4">
              <h4 className="text-slate-300 font-bold mb-2 text-sm">Dados Estruturados (JSON)</h4>
              <div className="bg-slate-950 rounded-lg p-3 h-48 overflow-y-auto">
                <pre className="text-xs text-green-400 whitespace-pre-wrap">
                  {jsonOutput}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg font-bold hover:bg-slate-600"
          >
            Cancelar Importação
          </button>
        </div>
      </div>
    </div>
  );
};
