import { useState, useRef, useMemo } from 'react';
import { ArrowLeft, CheckCircle, Map as MapIcon, MapPin, AlertTriangle, Save, Undo } from 'lucide-react';
import { Extinguisher, Hydrant, Alarm, Lighting, Location } from '@/types';

interface FloorPlan {
  id: string;
  name: string;
  sede: string;
  image: string;
}

interface PendingChange {
  locationId: string;
  floorplanid: string;
  coordx: number;
  coordy: number;
}

interface FloorPlanEditorProps {
  floorPlans: FloorPlan[];
  extinguishers: Extinguisher[];
  hydrants: Hydrant[];
  alarms: Alarm[];
  lighting: Lighting[];
  locations: Location[];
  onUpdate: (type: string, id: string, item: any) => void;
  onUpdateLocation: (id: string, location: Location) => Promise<boolean> | boolean;
  onClose: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

export const FloorPlanEditor = ({
  floorPlans,
  extinguishers,
  hydrants,
  alarms,
  lighting,
  locations,
  onUpdate,
  onUpdateLocation,
  onClose,
  notify
}: FloorPlanEditorProps) => {
  const [selectedMapId, setSelectedMapId] = useState(floorPlans[0]?.id || '');
  const [selectedItemForPlacement, setSelectedItemForPlacement] = useState<any>(null);
  const [selectedItemType, setSelectedItemType] = useState<'equipment' | 'location'>('location');
  const [hoveredLocation, setHoveredLocation] = useState<Location | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const mapImageRef = useRef<HTMLImageElement>(null);

  // Combine all equipment items
  const allEquipmentItems = useMemo(() => {
    return [
      ...extinguishers.map(i => ({ ...i, itemType: 'extinguishers' })),
      ...hydrants.map(i => ({ ...i, itemType: 'hydrant' })),
      ...alarms.map(i => ({ ...i, itemType: 'alarm' })),
      ...lighting.map(i => ({ ...i, itemType: 'lighting' }))
    ];
  }, [extinguishers, hydrants, alarms, lighting]);

  // Get locations for current map (including pending changes)
  const mapLocations = useMemo(() => {
    if (!selectedMapId) return [];
    
    // Get saved locations for this map
    const savedLocations = locations.filter(loc => loc.floorplanid === selectedMapId);
    
    // Add pending locations for this map
    const pendingForThisMap = pendingChanges.filter(p => p.floorplanid === selectedMapId);
    const pendingLocationIds = pendingForThisMap.map(p => p.locationId);
    
    // Merge: for locations with pending changes, use pending coords
    const mergedLocations = savedLocations.map(loc => {
      const pending = pendingForThisMap.find(p => p.locationId === loc.id);
      if (pending) {
        return { ...loc, coordx: pending.coordx, coordy: pending.coordy };
      }
      return loc;
    });
    
    // Add locations that have pending changes but aren't in savedLocations
    pendingForThisMap.forEach(pending => {
      if (!savedLocations.find(loc => loc.id === pending.locationId)) {
        const originalLoc = locations.find(loc => loc.id === pending.locationId);
        if (originalLoc) {
          mergedLocations.push({ ...originalLoc, coordx: pending.coordx, coordy: pending.coordy, floorplanid: pending.floorplanid });
        }
      }
    });
    
    return mergedLocations;
  }, [selectedMapId, locations, pendingChanges]);

  // Sort locations: available (no equipment) first in green, then allocated in gray
  const sortedLocations = useMemo(() => {
    const locationsWithStatus = locations.map(loc => {
      // Check if any equipment is linked to this location
      const linkedEquipment = allEquipmentItems.find(item => 
        (item as any).locationId === loc.id
      );
      
      // Check if this location has pending changes
      const hasPendingChange = pendingChanges.some(p => p.locationId === loc.id);
      
      return {
        ...loc,
        hasEquipment: !!linkedEquipment,
        linkedEquipment: linkedEquipment,
        hasPendingChange
      };
    });

    // Sort: available first, then allocated
    return locationsWithStatus.sort((a, b) => {
      if (a.hasEquipment && !b.hasEquipment) return 1;
      if (!a.hasEquipment && b.hasEquipment) return -1;
      return 0;
    });
  }, [locations, allEquipmentItems, pendingChanges]);

  // Get equipment linked to a location
  const getLinkedEquipment = (locationId: string) => {
    return allEquipmentItems.find(item => (item as any).locationId === locationId);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedItemForPlacement || !mapImageRef.current) return;

    const rect = mapImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (selectedItemType === 'location') {
      // Add to pending changes instead of saving immediately
      const newPending: PendingChange = {
        locationId: selectedItemForPlacement.id,
        floorplanid: selectedMapId,
        coordx: x,
        coordy: y
      };
      
      // Remove existing pending change for this location if exists
      setPendingChanges(prev => {
        const filtered = prev.filter(p => p.locationId !== selectedItemForPlacement.id);
        return [...filtered, newPending];
      });
      
      notify("Ponto adicionado. Clique em 'Salvar' para confirmar.", "info");
    } else {
      // Update equipment with coordinates
      const updatedItem = {
        ...selectedItemForPlacement,
        floorPlanId: selectedMapId,
        coordX: x,
        coordY: y
      };
      onUpdate(selectedItemForPlacement.itemType, selectedItemForPlacement.id, updatedItem);
      notify("Ponto de equipamento definido!", "success");
    }

    setSelectedItemForPlacement(null);
  };

  const handleSaveAll = async () => {
    if (pendingChanges.length === 0) {
      notify("Nenhuma alteração pendente para salvar.", "info");
      return;
    }

    const changesToSave = [...pendingChanges];
    const failed: PendingChange[] = [];
    let savedCount = 0;

    for (const pending of changesToSave) {
      const originalLocation = locations.find(loc => loc.id === pending.locationId);
      if (!originalLocation) {
        failed.push(pending);
        continue;
      }

      const updatedLocation: Location = {
        id: originalLocation.id,
        nome: originalLocation.nome,
        setor: originalLocation.setor,
        sede: originalLocation.sede,
        exigencia: originalLocation.exigencia,
        floorplanid: pending.floorplanid,
        coordx: pending.coordx,
        coordy: pending.coordy
      };

      const ok = await Promise.resolve(onUpdateLocation(originalLocation.id, updatedLocation));
      if (ok === false) {
        failed.push(pending);
        continue;
      }

      savedCount++;
    }

    if (failed.length === 0) {
      setPendingChanges([]);
      notify(`${savedCount} ponto(s) salvo(s) com sucesso!`, "success");
      return;
    }

    setPendingChanges(failed);
    notify(`Salvei ${savedCount} ponto(s). ${failed.length} falhou(aram) — tente novamente.`, "warning");
  };

  const handleClearPending = () => {
    setPendingChanges([]);
    notify("Alterações pendentes descartadas.", "info");
  };

  const getEquipmentIcon = (itemType: string) => {
    switch (itemType) {
      case 'extinguishers': return '🧯';
      case 'hydrant': return '🚿';
      case 'alarm': return '🔔';
      case 'lighting': return '💡';
      default: return '📍';
    }
  };

  const selectedPlan = floorPlans.find(p => p.id === selectedMapId);

  // Check if a location has pending changes
  const hasPendingChange = (locationId: string) => {
    return pendingChanges.some(p => p.locationId === locationId);
  };

  // Get pending coords for a location
  const getPendingCoords = (locationId: string) => {
    return pendingChanges.find(p => p.locationId === locationId);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      <div className="bg-slate-800 p-4 flex items-center gap-4">
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <MapIcon className="w-6 h-6 text-orange-500" />
        <h1 className="text-white font-bold">Editor Visual de Pontos - Locais</h1>
        
        <select
          value={selectedMapId}
          onChange={(e) => setSelectedMapId(e.target.value)}
          className="ml-4 bg-slate-700 text-white border border-slate-600 p-2 rounded-lg text-sm"
        >
          {floorPlans.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {pendingChanges.length > 0 && (
            <>
              <span className="text-yellow-400 text-sm">
                {pendingChanges.length} alteração(ões) pendente(s)
              </span>
              <button
                onClick={handleClearPending}
                className="flex items-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm"
              >
                <Undo className="w-4 h-4" />
                Descartar
              </button>
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold"
              >
                <Save className="w-4 h-4" />
                Salvar Tudo
              </button>
            </>
          )}
        </div>
      </div>

      <div className="text-center py-2 bg-slate-700 text-slate-300 text-sm">
        {selectedItemForPlacement 
          ? `Clique no mapa para posicionar "${selectedItemForPlacement.nome || selectedItemForPlacement.id}"` 
          : "Selecione um local na lista e clique no mapa para posicionar"}
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
                style={{ maxHeight: '80vh' }}
              />
              
              {/* Render saved location points */}
              {mapLocations.map((loc: Location) => {
                if (loc.coordx === undefined || loc.coordy === undefined) return null;
                const linkedEquipment = getLinkedEquipment(loc.id);
                const hasEquipment = !!linkedEquipment;
                const isPending = hasPendingChange(loc.id);
                
                return (
                  <div
                    key={loc.id}
                    className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 transition-transform shadow-lg ${
                      isPending 
                        ? 'bg-yellow-500 border-yellow-300 animate-pulse' 
                        : hasEquipment 
                          ? 'bg-gray-400 border-gray-600' 
                          : 'bg-green-500 border-green-700'
                    }`}
                    style={{ left: `${loc.coordx}%`, top: `${loc.coordy}%` }}
                    onMouseEnter={() => setHoveredLocation(loc)}
                    onMouseLeave={() => setHoveredLocation(null)}
                  >
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                );
              })}

              {/* Tooltip for hovered location */}
              {hoveredLocation && hoveredLocation.coordx !== undefined && (
                <div 
                  className="absolute bg-white rounded-lg shadow-xl p-3 z-20 pointer-events-none min-w-[200px]"
                  style={{ 
                    left: `${hoveredLocation.coordx}%`, 
                    top: `${(hoveredLocation.coordy || 0) + 5}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <p className="font-bold text-gray-800">{hoveredLocation.nome}</p>
                  <p className="text-xs text-gray-500">{hoveredLocation.setor} - {hoveredLocation.sede}</p>
                  {hasPendingChange(hoveredLocation.id) && (
                    <p className="text-xs text-yellow-600 mt-1 font-bold">⚠️ Não salvo</p>
                  )}
                  {hoveredLocation.exigencia && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Exigência: {hoveredLocation.exigencia}
                    </p>
                  )}
                  {getLinkedEquipment(hoveredLocation.id) && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-bold text-green-700">
                        {getEquipmentIcon((getLinkedEquipment(hoveredLocation.id) as any)?.itemType)} 
                        {' '}{getLinkedEquipment(hoveredLocation.id)?.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(getLinkedEquipment(hoveredLocation.id) as any)?.tipo}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Nenhuma planta cadastrada
            </div>
          )}
        </div>

        {/* Locations List */}
        <div className="w-96 bg-slate-800 border-l border-slate-700 overflow-y-auto p-4">
          <h3 className="text-white font-bold mb-4">Locais Disponíveis</h3>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-400">Disponível</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-slate-400">Ocupado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-slate-400">Pendente</span>
            </div>
          </div>

          <div className="space-y-2">
            {sortedLocations.map((loc: any) => {
              const pending = getPendingCoords(loc.id);
              const isOnCurrentMap = loc.floorplanid === selectedMapId || (pending && pending.floorplanid === selectedMapId);
              
              return (
                <div
                  key={loc.id}
                  onClick={() => {
                    setSelectedItemForPlacement(loc);
                    setSelectedItemType('location');
                  }}
                  className={`p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                    selectedItemForPlacement?.id === loc.id 
                      ? 'bg-purple-600 text-white border-purple-400' 
                      : loc.hasPendingChange
                        ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50'
                        : loc.hasEquipment
                          ? 'bg-slate-700 text-slate-400 border-slate-600'
                          : 'bg-green-900/30 text-green-300 border-green-700/50 hover:bg-green-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-4 h-4 ${
                        loc.hasPendingChange 
                          ? 'text-yellow-400' 
                          : loc.hasEquipment 
                            ? 'text-gray-400' 
                            : 'text-green-400'
                      }`} />
                      <span className="font-bold">{loc.nome}</span>
                    </div>
                    {isOnCurrentMap && (loc.coordx !== undefined || pending) && (
                      <CheckCircle className={`w-4 h-4 ${loc.hasPendingChange ? 'text-yellow-400' : 'text-green-500'}`} />
                    )}
                  </div>
                  <p className="text-xs opacity-70 mt-1">{loc.setor} - {loc.sede}</p>
                  {loc.exigencia && (
                    <p className="text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {loc.exigencia}
                    </p>
                  )}
                  {loc.hasPendingChange && (
                    <p className="text-xs mt-1 text-yellow-400 font-bold">⚠️ Não salvo</p>
                  )}
                  {loc.linkedEquipment && (
                    <div className="mt-2 pt-2 border-t border-slate-600">
                      <p className="text-xs">
                        {getEquipmentIcon(loc.linkedEquipment.itemType)} {loc.linkedEquipment.id}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};