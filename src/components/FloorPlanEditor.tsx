import { useState, useRef, useMemo } from 'react';
import { ArrowLeft, CheckCircle, Map as MapIcon } from 'lucide-react';
import { Extinguisher, Hydrant, Alarm, Lighting } from '@/types';

interface FloorPlan {
  id: string;
  name: string;
  sede: string;
  image: string;
}

interface FloorPlanEditorProps {
  floorPlans: FloorPlan[];
  extinguishers: Extinguisher[];
  hydrants: Hydrant[];
  alarms: Alarm[];
  lighting: Lighting[];
  onUpdate: (type: string, id: string, item: any) => void;
  onClose: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

export const FloorPlanEditor = ({
  floorPlans,
  extinguishers,
  hydrants,
  alarms,
  lighting,
  onUpdate,
  onClose,
  notify
}: FloorPlanEditorProps) => {
  const [selectedMapId, setSelectedMapId] = useState(floorPlans[0]?.id || '');
  const [selectedItemForPlacement, setSelectedItemForPlacement] = useState<any>(null);
  const mapImageRef = useRef<HTMLImageElement>(null);

  const allItems = useMemo(() => {
    return [
      ...extinguishers.map(i => ({ ...i, itemType: 'extinguishers' })),
      ...hydrants.map(i => ({ ...i, itemType: 'hydrant' })),
      ...alarms.map(i => ({ ...i, itemType: 'alarm' })),
      ...lighting.map(i => ({ ...i, itemType: 'lighting' }))
    ];
  }, [extinguishers, hydrants, alarms, lighting]);

  const mapItems = useMemo(() => {
    if (!selectedMapId) return [];
    return allItems.filter((item: any) => item.floorPlanId === selectedMapId);
  }, [selectedMapId, allItems]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedItemForPlacement || !mapImageRef.current) return;

    const rect = mapImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const updatedItem = {
      ...selectedItemForPlacement,
      floorPlanId: selectedMapId,
      coordX: x,
      coordY: y
    };

    onUpdate(selectedItemForPlacement.itemType, selectedItemForPlacement.id, updatedItem);
    setSelectedItemForPlacement(null);
    notify("Ponto definido com sucesso!", "success");
  };

  const getItemColor = (item: any) => {
    if (item.status === 'vencido' || item.status === 'irregular' || item.status === 'falha') {
      return 'bg-red-500 border-red-700';
    }
    if (item.status === 'proximo' || item.status === 'atencao') {
      return 'bg-orange-500 border-orange-700';
    }
    return 'bg-green-500 border-green-700';
  };

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'extinguishers': return '🧯';
      case 'hydrant': return '🚿';
      case 'alarm': return '🔔';
      case 'lighting': return '💡';
      default: return '📍';
    }
  };

  const selectedPlan = floorPlans.find(p => p.id === selectedMapId);

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      <div className="bg-slate-800 p-4 flex items-center gap-4">
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <MapIcon className="w-6 h-6 text-orange-500" />
        <h1 className="text-white font-bold">Editor Visual de Pontos</h1>
        
        <select
          value={selectedMapId}
          onChange={(e) => setSelectedMapId(e.target.value)}
          className="ml-4 bg-slate-700 text-white border border-slate-600 p-2 rounded-lg text-sm"
        >
          {floorPlans.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <div className="ml-auto text-sm text-slate-400">
          {selectedItemForPlacement 
            ? `Clique no mapa para posicionar ${selectedItemForPlacement.id}` 
            : "Selecione um item na lista para posicionar"}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 p-4 overflow-auto">
          {selectedPlan ? (
            <div 
              className="relative inline-block cursor-crosshair"
              onClick={handleMapClick}
            >
              <img
                ref={mapImageRef}
                src={selectedPlan.image}
                alt="Editor"
                className="max-w-full h-auto block rounded-lg"
              />
              
              {/* Render placed items */}
              {mapItems.map((item: any) => {
                if (item.coordX === undefined || item.coordY === undefined) return null;
                return (
                  <div
                    key={item.id}
                    className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transform -translate-x-1/2 -translate-y-1/2 ${getItemColor(item)} cursor-pointer hover:scale-125 transition-transform shadow-lg`}
                    style={{ left: `${item.coordX}%`, top: `${item.coordY}%` }}
                    title={`${item.id} - ${item.local || item.localizacao}`}
                  >
                    {getItemIcon(item.itemType)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Nenhuma planta cadastrada
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 overflow-y-auto p-4">
          <h3 className="text-white font-bold mb-4">Itens Disponíveis</h3>
          <div className="space-y-2">
            {allItems.map((item: any) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemForPlacement(item)}
                className={`p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                  selectedItemForPlacement?.id === item.id 
                    ? 'bg-slate-700 text-white border-blue-500' 
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{getItemIcon(item.itemType)} {item.id}</span>
                  {item.floorPlanId === selectedMapId && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.local || item.localizacao}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
