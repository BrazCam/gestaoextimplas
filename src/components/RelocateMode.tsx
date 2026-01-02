import { useState } from 'react';
import { ArrowLeft, MapPin, Package, CheckCircle, RefreshCw } from 'lucide-react';
import { RealQRScanner } from '@/components/RealQRScanner';
import { Extinguisher } from '@/types';

interface RelocateModeProps {
  extinguishers: Extinguisher[];
  onRelocate: (extinguisherId: string, newLocation: string) => Promise<void>;
  onLogout: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

type Step = 'menu' | 'scan-location' | 'scan-extinguisher' | 'confirm';

export const RelocateMode = ({ extinguishers, onRelocate, onLogout, notify }: RelocateModeProps) => {
  const [step, setStep] = useState<Step>('menu');
  const [scannedLocation, setScannedLocation] = useState<string>('');
  const [scannedExtinguisher, setScannedExtinguisher] = useState<Extinguisher | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLocationScan = (code: string) => {
    setScannedLocation(code);
    notify(`Local identificado: ${code}`, 'success');
    setStep('scan-extinguisher');
  };

  const handleExtinguisherScan = (code: string) => {
    const ext = extinguishers.find(
      e => e.id === code || 
           e.id.includes(code) || 
           e.numeroCilindro === code ||
           code.includes(e.id)
    );

    if (ext) {
      setScannedExtinguisher(ext);
      notify(`Extintor ${ext.id} identificado!`, 'success');
      setStep('confirm');
    } else {
      notify('Extintor não encontrado no sistema.', 'error');
    }
  };

  const handleConfirmRelocate = async () => {
    if (!scannedExtinguisher || !scannedLocation) return;

    setIsProcessing(true);
    try {
      await onRelocate(scannedExtinguisher.id, scannedLocation);
      notify(`Extintor ${scannedExtinguisher.id} realocado para ${scannedLocation}!`, 'success');
      // Reset for next relocation
      setScannedLocation('');
      setScannedExtinguisher(null);
      setStep('menu');
    } catch (error) {
      notify('Erro ao realocar extintor.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcess = () => {
    setScannedLocation('');
    setScannedExtinguisher(null);
    setStep('menu');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={step === 'menu' ? onLogout : resetProcess}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Modo Realocação</h1>
            <p className="text-purple-200 text-sm">Realocar extintores para novos locais</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Menu inicial */}
        {step === 'menu' && (
          <div className="mt-8 space-y-6">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-12 h-12 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Realocar Extintor</h2>
              <p className="text-gray-400">Escaneie primeiro o local de destino, depois o extintor</p>
            </div>

            <button
              onClick={() => setStep('scan-location')}
              className="w-full py-6 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
            >
              <MapPin className="w-6 h-6" />
              <span className="text-lg">Iniciar Realocação</span>
            </button>

            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3">Como funciona:</h3>
              <ol className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Escaneie o QR Code do <strong>local de destino</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Escaneie o QR Code do <strong>extintor</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Confirme a realocação</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Scan Location */}
        {step === 'scan-location' && (
          <div className="mt-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-purple-600/20 text-purple-300 px-4 py-2 rounded-full mb-4">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Passo 1: Escanear Local</span>
              </div>
              <p className="text-gray-400">Aponte a câmera para o QR Code do local de destino</p>
            </div>

            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
              <RealQRScanner onScanSuccess={handleLocationScan} />
            </div>

            <button
              onClick={resetProcess}
              className="w-full mt-4 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Scan Extinguisher */}
        {step === 'scan-extinguisher' && (
          <div className="mt-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-green-600/20 text-green-300 px-4 py-2 rounded-full mb-4">
                <Package className="w-4 h-4" />
                <span className="font-medium">Passo 2: Escanear Extintor</span>
              </div>
              <p className="text-gray-400">Aponte a câmera para o QR Code do extintor</p>
            </div>

            <div className="bg-slate-800 rounded-xl p-3 mb-4 border border-green-600/30">
              <p className="text-sm text-gray-400">Local de destino:</p>
              <p className="text-white font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                {scannedLocation}
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
              <RealQRScanner onScanSuccess={handleExtinguisherScan} />
            </div>

            <button
              onClick={resetProcess}
              className="w-full mt-4 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Confirm */}
        {step === 'confirm' && scannedExtinguisher && (
          <div className="mt-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full mb-4">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Passo 3: Confirmar Realocação</span>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-4">
              {/* Local destino */}
              <div className="bg-green-600/10 rounded-lg p-3 border border-green-600/30">
                <p className="text-sm text-gray-400 mb-1">Novo Local</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-400" />
                  {scannedLocation}
                </p>
              </div>

              {/* Extintor */}
              <div className="bg-purple-600/10 rounded-lg p-3 border border-purple-600/30">
                <p className="text-sm text-gray-400 mb-2">Extintor a ser realocado</p>
                <div className="space-y-1">
                  <p className="text-white font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-400" />
                    {scannedExtinguisher.id}
                  </p>
                  <div className="text-sm text-gray-300 space-y-1 ml-7">
                    <p><span className="text-gray-500">Tipo:</span> {scannedExtinguisher.tipo}</p>
                    <p><span className="text-gray-500">Capacidade:</span> {scannedExtinguisher.capacidade}</p>
                    <p><span className="text-gray-500">Nº Cilindro:</span> {scannedExtinguisher.numeroCilindro || '-'}</p>
                    <p><span className="text-gray-500">Local atual:</span> {scannedExtinguisher.localizacao || 'Não definido'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleConfirmRelocate}
                disabled={isProcessing}
                className="w-full py-4 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Confirmar Realocação</span>
                  </>
                )}
              </button>

              <button
                onClick={resetProcess}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
