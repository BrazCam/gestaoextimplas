import { useState } from 'react';
import { ArrowLeft, MapPin, Package, CheckCircle, RefreshCw, LogOut, Search, QrCode, X, ScanLine, AlertTriangle, FileText } from 'lucide-react';
import { RealQRScanner } from '@/components/RealQRScanner';
import { Extinguisher, Location, HistoryLog } from '@/types';

interface RelocateModeProps {
  locations: Location[];
  extinguishers: Extinguisher[];
  onRelocate: (type: string, extinguisherId: string, targetLocation: Location, observacao?: string, ignorouExigencia?: boolean) => Promise<void>;
  onLogout: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

type Step = 'start' | 'scan-loc' | 'scan-item' | 'mismatch-warning' | 'confirm-override' | 'observation' | 'success';

// Map equipment types to location requirements
const getEquipmentRequirement = (ext: Extinguisher): string => {
  const tipo = ext.tipo?.toLowerCase() || '';
  if (tipo.includes('pó') && tipo.includes('bc')) return 'Extintor Pó BC';
  if (tipo.includes('pó') && tipo.includes('abc')) return 'Extintor Pó ABC';
  if (tipo.includes('água') || tipo.includes('agua')) return 'Extintor Água';
  if (tipo.includes('co2')) return 'Extintor CO2';
  if (tipo.includes('esp') || tipo.includes('mecânica') || tipo.includes('mecanica')) return 'Extintor ESP Mecânica';
  return 'Extintor Pó ABC'; // Default
};

export const RelocateMode = ({ locations, extinguishers, onRelocate, onLogout, notify }: RelocateModeProps) => {
  const [step, setStep] = useState<Step>('start');
  const [targetLocation, setTargetLocation] = useState<Location | null>(null);
  const [movedItem, setMovedItem] = useState<Extinguisher | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [observacao, setObservacao] = useState('');
  const [pendingItem, setPendingItem] = useState<Extinguisher | null>(null);

  const handleScanLocation = (code: string) => {
    const scanCode = code ? String(code).trim() : '';
    const loc = locations.find(l => 
      l.id === scanCode || 
      l.id.toLowerCase() === scanCode.toLowerCase() ||
      l.nome.toLowerCase() === scanCode.toLowerCase()
    );
    
    if (loc) {
      setTargetLocation(loc);
      setStep('scan-item');
      setManualCode('');
      notify(`Local identificado: ${loc.nome}`, 'success');
    } else {
      notify(`Local não encontrado para o código: ${scanCode}`, 'error');
    }
  };

  const handleScanItem = (code: string) => {
    const scanCode = code ? String(code).trim() : '';
    const ext = extinguishers.find(e => 
      e.id.toLowerCase() === scanCode.toLowerCase() || 
      (e.codigoBarras && e.codigoBarras === scanCode) ||
      (e.numeroCilindro && e.numeroCilindro === scanCode)
    );
    
    if (ext && targetLocation) {
      // Check if equipment matches location requirement
      if (targetLocation.exigencia) {
        const equipmentType = getEquipmentRequirement(ext);
        if (equipmentType !== targetLocation.exigencia) {
          setPendingItem(ext);
          setStep('mismatch-warning');
          return;
        }
      }
      
      // No mismatch, proceed with relocation
      completeRelocation(ext);
    } else {
      notify(`Extintor não encontrado para o código: ${scanCode}`, 'error');
    }
  };

  const completeRelocation = async (ext: Extinguisher, obs?: string, ignorouExigencia?: boolean) => {
    if (!targetLocation) return;
    
    try {
      await onRelocate('extinguishers', ext.id, targetLocation, obs, ignorouExigencia);
      setMovedItem(ext);
      setStep('success');
      notify('Equipamento vinculado com sucesso!', 'success');
    } catch (error) {
      notify('Erro ao realizar realocação', 'error');
    }
  };

  const handleContinueWithMismatch = () => {
    setStep('confirm-override');
  };

  const handleConfirmOverride = () => {
    setStep('observation');
  };

  const handleFinalConfirm = () => {
    if (pendingItem && targetLocation) {
      completeRelocation(pendingItem, observacao || undefined, true);
      setObservacao('');
      setPendingItem(null);
    }
  };

  const resetProcess = () => {
    setStep('start');
    setTargetLocation(null);
    setMovedItem(null);
    setManualCode('');
    setObservacao('');
    setPendingItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-purple-800 text-white p-4 flex justify-between items-center shadow-md relative z-10">
        <h2 className="font-bold flex items-center gap-2"><RefreshCw className="w-5 h-5" /> Realocação de Ativos</h2>
        <button onClick={onLogout}><LogOut className="w-5 h-5 opacity-80 hover:text-red-300 transition-colors"/></button>
      </div>

      <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full">
        
        {step === 'start' && (
          <div className="flex flex-col items-center justify-center flex-1 space-y-6 animate-fade-in">
            <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 text-center">Modo Realocação</h2>
            <p className="text-gray-500 text-center text-sm">Vincule equipamentos a novos locais escaneando os QR Codes.</p>
            <button 
              onClick={() => setStep('scan-loc')} 
              className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5"/> Iniciar Realocação
            </button>
            <div className="bg-white rounded-xl p-4 border border-gray-200 text-sm text-gray-600 w-full">
              <h3 className="font-bold mb-2 text-gray-700">Fluxo:</h3>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Escaneie o <strong>QR Code do Local</strong> de destino.</li>
                <li>Escaneie o <strong>QR Code / Código de Barras do Extintor</strong>.</li>
                <li>Confirme a realocação.</li>
              </ol>
            </div>
          </div>
        )}

        {step === 'scan-loc' && (
          <div className="flex-1 flex flex-col space-y-4 animate-fade-in pt-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                <MapPin className="w-3 h-3"/> Passo 1: Escanear Local de Destino
              </span>
            </div>

            <div className="bg-black rounded-xl border-4 border-purple-500 relative overflow-hidden flex items-center justify-center flex-grow min-h-[300px]">
              <RealQRScanner onScanSuccess={handleScanLocation} />
            </div>

            <p className="text-center text-gray-500 text-xs">Aponte para o QR Code do <strong>local fixo</strong> (parede, pilar).</p>

            <div className="border-t pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Ou digite o ID manualmente:</p>
              <div className="flex gap-2">
                <input 
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                  placeholder="Ex: LOC-001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
                <button 
                  onClick={() => handleScanLocation(manualCode)} 
                  className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold"
                >
                  <Search className="w-5 h-5"/>
                </button>
              </div>
            </div>

            <button 
              onClick={resetProcess} 
              className="w-full py-3 bg-gray-200 text-gray-600 rounded-lg font-bold mt-4"
            >
              Cancelar
            </button>
          </div>
        )}

        {step === 'scan-item' && (
          <div className="flex-1 flex flex-col space-y-4 animate-fade-in pt-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                <Package className="w-3 h-3"/> Passo 2: Escanear Extintor
              </span>
            </div>
            
            <div className="bg-purple-100 text-purple-800 p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="w-5 h-5 text-green-600"/>
              <span>Destino: <strong>{targetLocation?.nome}</strong> ({targetLocation?.setor || targetLocation?.id})</span>
            </div>

            {targetLocation?.exigencia && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertTriangle className="w-5 h-5 text-yellow-600"/>
                <span>Exigência do local: <strong>{targetLocation.exigencia}</strong></span>
              </div>
            )}

            <div className="bg-black rounded-xl border-4 border-green-500 relative overflow-hidden flex items-center justify-center flex-grow min-h-[300px]">
              <RealQRScanner onScanSuccess={handleScanItem} />
            </div>

            <p className="text-center text-gray-500 text-xs">
              Aponte para o <strong>QR Code</strong> ou <strong>Código de Barras</strong> do <strong>extintor</strong>.
            </p>

            <div className="border-t pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Ou digite o Nº Cilindro / ID:</p>
              <div className="flex gap-2">
                <input 
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                  placeholder="Ex: EXT-001 ou CIL-283940"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
                <button 
                  onClick={() => handleScanItem(manualCode)} 
                  className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold"
                >
                  <Search className="w-5 h-5"/>
                </button>
              </div>
            </div>

            <button 
              onClick={resetProcess} 
              className="w-full py-3 bg-gray-200 text-gray-600 rounded-lg font-bold mt-4"
            >
              Cancelar
            </button>
          </div>
        )}

        {step === 'mismatch-warning' && pendingItem && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-fade-in">
            <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-14 h-14 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 text-center">Atenção!</h2>
            
            <div className="bg-white rounded-xl p-6 shadow-md border border-orange-200 w-full text-center">
              <p className="text-gray-700 mb-4">O equipamento <strong>não corresponde</strong> à exigência do local.</p>
              
              <div className="bg-orange-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Exigência do Local:</span>
                  <span className="font-bold text-orange-700">{targetLocation?.exigencia}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Tipo do Equipamento:</span>
                  <span className="font-bold text-gray-700">{pendingItem.tipo}</span>
                </div>
              </div>

              <p className="text-sm text-gray-500">Deseja continuar mesmo assim?</p>
            </div>

            <div className="w-full space-y-3">
              <button 
                onClick={resetProcess} 
                className="w-full py-4 bg-gray-200 text-gray-700 rounded-xl font-bold"
              >
                Voltar
              </button>
              <button 
                onClick={handleContinueWithMismatch} 
                className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-colors"
              >
                Continuar a Troca
              </button>
            </div>
          </div>
        )}

        {step === 'confirm-override' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-fade-in">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-14 h-14 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 text-center">Confirmar Substituição</h2>
            
            <div className="bg-white rounded-xl p-6 shadow-md border border-red-200 w-full text-center">
              <p className="text-gray-700 mb-4">
                Você está prestes a vincular um equipamento que <strong>não corresponde</strong> à exigência do local.
              </p>
              <p className="text-sm text-red-600 font-medium">
                Esta ação será registrada no relatório.
              </p>
            </div>

            <div className="w-full space-y-3">
              <button 
                onClick={resetProcess} 
                className="w-full py-4 bg-gray-200 text-gray-700 rounded-xl font-bold"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmOverride} 
                className="w-full py-4 bg-red-500 text-white rounded-xl font-bold shadow-lg hover:bg-red-600 transition-colors"
              >
                Sim, desejo substituir mesmo assim
              </button>
            </div>
          </div>
        )}

        {step === 'observation' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <FileText className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 text-center">Observação (Opcional)</h2>
            
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 w-full">
              <p className="text-sm text-gray-500 mb-4">Descreva o motivo da substituição com equipamento diferente da exigência:</p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[120px] resize-none"
                placeholder="Ex: Equipamento em manutenção, substituição temporária..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <div className="w-full space-y-3">
              <button 
                onClick={resetProcess} 
                className="w-full py-4 bg-gray-200 text-gray-700 rounded-xl font-bold"
              >
                Cancelar
              </button>
              <button 
                onClick={handleFinalConfirm} 
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5"/> Confirmar Realocação
              </button>
            </div>
          </div>
        )}

        {step === 'success' && movedItem && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-fade-in">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800">Realocação Concluída!</h2>
            
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 w-full text-center">
              <p className="text-gray-500 text-sm">Extintor</p>
              <p className="text-3xl font-black text-gray-800">{movedItem.id}</p>
              {movedItem.numeroCilindro && (
                <p className="text-xs text-gray-400 font-mono mt-1">Cilindro: {movedItem.numeroCilindro}</p>
              )}
              <div className="flex items-center justify-center gap-2 text-lg text-green-700 font-semibold mt-4 border-t pt-4">
                <MapPin className="w-5 h-5" />
                <span>{targetLocation?.nome}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{targetLocation?.setor} - {targetLocation?.sede}</p>
            </div>

            <button 
              onClick={resetProcess} 
              className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <ScanLine className="w-5 h-5"/> Realocar Outro Equipamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
};