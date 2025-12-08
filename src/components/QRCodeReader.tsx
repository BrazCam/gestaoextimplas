import { useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { RealQRScanner } from './RealQRScanner';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { Extinguisher, Alarm, Hydrant, Lighting } from '@/types';

interface QRCodeReaderProps {
  onBack: () => void;
  data: {
    extinguishers: Extinguisher[];
    alarms: Alarm[];
    hydrants: Hydrant[];
    lighting: Lighting[];
  };
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

export const QRCodeReader = ({ onBack, data, notify }: QRCodeReaderProps) => {
  const [manualCode, setManualCode] = useState('');
  const [foundItem, setFoundItem] = useState<any>(null);

  const handleScan = (code: string) => {
    const searchTerm = code ? String(code).trim().toLowerCase() : '';
    const allItems = [...data.extinguishers, ...data.alarms, ...data.hydrants, ...data.lighting];
    const found = allItems.find(i => i.id.toLowerCase() === searchTerm);

    if (found) {
      setFoundItem(found);
      notify("Equipamento encontrado!", "success");
    } else {
      notify(`Código ${code} não encontrado.`, "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <EquipmentDetailModal item={foundItem} onClose={() => setFoundItem(null)} />

      <div className="bg-slate-800 text-white p-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="font-bold text-lg">Consulta Pública</h1>
          <p className="text-xs text-slate-400">Escaneie o QR Code do equipamento</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4">
        <div className="bg-gray-900 rounded-lg border-2 border-red-500 relative overflow-hidden flex-1 max-h-[50vh] shadow-inner flex flex-col items-center justify-center">
          <RealQRScanner onScanSuccess={handleScan} />
        </div>

        <div className="mt-6">
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase">Ou digite o código</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>
          <div className="flex gap-2">
            <input
              className="border-2 border-slate-700 bg-slate-800 text-white p-4 w-full rounded-xl focus:border-red-500 focus:outline-none text-lg placeholder-slate-500"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="Ex: EXT-001"
            />
            <button onClick={() => handleScan(manualCode)} className="bg-red-600 text-white px-6 rounded-xl font-bold shadow-md hover:bg-red-700">
              <Search className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
