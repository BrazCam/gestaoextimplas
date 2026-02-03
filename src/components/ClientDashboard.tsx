import { useState, useMemo } from 'react';
import {
  LayoutDashboard, LogOut, Flame, Bell, Droplets, Lightbulb, Activity,
  ClipboardList, ScanLine, Eye, AlertTriangle, CheckCircle, AlertOctagon,
  FileDown, X, MapPin, Map as MapIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { StatusBadge } from './StatusBadge';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { RealQRScanner } from './RealQRScanner';
import { ReportsSection } from './ReportsSection';
import { User, Extinguisher, Alarm, Hydrant, Lighting, Location } from '@/types';

interface FloorPlan {
  id: string;
  name: string;
  sede: string;
  image: string;
}

interface ClientDashboardProps {
  user: User;
  extinguishers: Extinguisher[];
  alarms: Alarm[];
  hydrants: Hydrant[];
  lighting: Lighting[];
  locations: Location[];
  floorPlans: FloorPlan[];
  onLogout: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

export const ClientDashboard = ({
  user, extinguishers, alarms, hydrants, lighting, locations, floorPlans, onLogout, notify
}: ClientDashboardProps) => {
  const [selectedSede, setSelectedSede] = useState('Todas');
  const [activeTab, setActiveTab] = useState('stats');
  const [modalItem, setModalItem] = useState<any>(null);
  const [viewReport, setViewReport] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState(floorPlans[0]?.id || '');
  const [hoveredLocation, setHoveredLocation] = useState<Location | null>(null);

  const rawData = useMemo(() => {
    switch (activeTab) {
      case 'alarm': return alarms;
      case 'hydrant': return hydrants;
      case 'lighting': return lighting;
      default: return extinguishers;
    }
  }, [activeTab, extinguishers, alarms, hydrants, lighting]);

  const currentData = useMemo(() => {
    return selectedSede === 'Todas' ? rawData : rawData.filter(e => e.sede === selectedSede);
  }, [rawData, selectedSede]);

  // Status calculation helpers
  const getStatusColor = (item: any, type: string) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    let dateToCheck: Date | null = null;

    if (type === 'extinguisher') {
      if (item.proximaManutencao) dateToCheck = new Date(item.proximaManutencao);
      else if (item.ultimaManutencao) {
        dateToCheck = new Date(item.ultimaManutencao);
        dateToCheck.setFullYear(dateToCheck.getFullYear() + 1);
      }
    } else if (type === 'hydrant') {
      if (item.proximoTesteHidro) dateToCheck = new Date(item.proximoTesteHidro);
      else if (item.ultimoTesteHidro) {
        dateToCheck = new Date(item.ultimoTesteHidro);
        dateToCheck.setFullYear(dateToCheck.getFullYear() + 5);
      }
    } else {
      if (item.proximaVistoria) dateToCheck = new Date(item.proximaVistoria);
    }

    if (item.status === 'vencido' || item.status === 'irregular' || item.status === 'manutencao') {
      return 'red';
    }

    if (!dateToCheck) return 'green';

    if (dateToCheck < now) return 'red';
    if (dateToCheck >= thisMonth && dateToCheck < nextMonth) return 'yellow';
    return 'green';
  };

  // Enhanced annual stats with color coding
  const annualStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const filterBySede = (list: any[]) => selectedSede === 'Todas' ? list : list.filter(i => i.sede === selectedSede);

    const extList = filterBySede(extinguishers);
    const hydList = filterBySede(hydrants);
    const lightList = filterBySede(lighting);
    const alarmList = filterBySede(alarms);

    // Extinguishers
    let extOk = 0, extExpiring = 0, extExpired = 0;
    extList.forEach(e => {
      const color = getStatusColor(e, 'extinguisher');
      if (color === 'green') extOk++;
      else if (color === 'yellow') extExpiring++;
      else extExpired++;
    });

    // Hydrants
    let hydOk = 0, hydExpiring = 0, hydExpired = 0;
    hydList.forEach(h => {
      const color = getStatusColor(h, 'hydrant');
      if (color === 'green') hydOk++;
      else if (color === 'yellow') hydExpiring++;
      else hydExpired++;
    });

    // Lighting
    let lightOk = 0, lightExpiring = 0, lightExpired = 0;
    lightList.forEach(l => {
      const color = getStatusColor(l, 'lighting');
      if (color === 'green') lightOk++;
      else if (color === 'yellow') lightExpiring++;
      else lightExpired++;
    });

    // Alarms
    let alarmOk = 0, alarmExpiring = 0, alarmExpired = 0;
    alarmList.forEach(a => {
      const color = getStatusColor(a, 'alarm');
      if (color === 'green') alarmOk++;
      else if (color === 'yellow') alarmExpiring++;
      else alarmExpired++;
    });

    return {
      ext: { total: extList.length, ok: extOk, expiring: extExpiring, expired: extExpired },
      hyd: { total: hydList.length, ok: hydOk, expiring: hydExpiring, expired: hydExpired },
      light: { total: lightList.length, ok: lightOk, expiring: lightExpiring, expired: lightExpired },
      alarm: { total: alarmList.length, ok: alarmOk, expiring: alarmExpiring, expired: alarmExpired }
    };
  }, [extinguishers, hydrants, lighting, alarms, selectedSede]);

  const detailedStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let total = 0, done = 0, pending = 0;
    const monthlyData = Array(12).fill(0);
    let dateField = '';

    if (activeTab === 'extinguishers') {
      total = annualStats.ext.total;
      done = annualStats.ext.ok;
      pending = annualStats.ext.expired + annualStats.ext.expiring;
      dateField = 'ultimaManutencao';
    } else if (activeTab === 'hydrant') {
      total = annualStats.hyd.total;
      done = annualStats.hyd.ok;
      pending = annualStats.hyd.expired + annualStats.hyd.expiring;
      dateField = 'ultimoTesteHidro';
    }

    if (dateField) {
      const list = selectedSede === 'Todas' ? (activeTab === 'extinguishers' ? extinguishers : hydrants) : (activeTab === 'extinguishers' ? extinguishers : hydrants).filter(i => i.sede === selectedSede);
      list.forEach((item: any) => {
        if (item[dateField]) {
          const d = new Date(item[dateField]);
          if (d.getFullYear() === currentYear) {
            monthlyData[d.getMonth()]++;
          }
        }
      });
    }

    const pieData = [{ name: 'Realizado', value: done, color: '#22c55e' }, { name: 'Pendente', value: pending, color: '#ef4444' }];
    const barData = monthlyData.map((count, index) => ({ name: new Date(currentYear, index, 1).toLocaleString('pt-BR', { month: 'short' }), Realizados: count }));

    return { pieData, barData, total, done, pending };
  }, [activeTab, annualStats, extinguishers, hydrants, selectedSede]);

  const allNonConformities = useMemo(() => {
    const list: any[] = [];
    const filterSede = (arr: any[]) => selectedSede === 'Todas' ? arr : arr.filter(i => i.sede === selectedSede);

    const extractNonConformity = (items: any[], typeName: string) => {
      items.forEach(item => {
        if (item.status === 'vencido' || item.status === 'irregular' || item.status === 'manutencao') {
          let lastVistoria = null;
          if (item.historico && item.historico.length > 0) {
            const vistorias = item.historico.filter((h: any) => h.tipo === 'vistoria');
            if (vistorias.length > 0) lastVistoria = vistorias[vistorias.length - 1];
          }
          let description = 'Vencido / Irregular';
          let observacao = '';
          let fotos: string[] = [];
          
          if (lastVistoria && lastVistoria.details) {
            if (lastVistoria.details.observacao) {
              observacao = lastVistoria.details.observacao;
              description = lastVistoria.details.observacao;
            }
            if (lastVistoria.details.fotos && Array.isArray(lastVistoria.details.fotos)) {
              fotos = lastVistoria.details.fotos;
            }
          } else if (item.obs) { 
            description = item.obs;
            observacao = item.obs;
          }

          list.push({
            system: typeName,
            id: item.id,
            local: item.local || item.localizacao,
            desc: description,
            observacao,
            fotos,
            date: lastVistoria ? lastVistoria.data : new Date().toISOString(),
            tecnico: lastVistoria?.tecnico || 'N/A'
          });
        }
      });
    };

    extractNonConformity(filterSede(extinguishers), 'Extintor');
    extractNonConformity(filterSede(alarms), 'Alarme');
    extractNonConformity(filterSede(hydrants), 'Mangueira');
    extractNonConformity(filterSede(lighting), 'Iluminação');
    return list;
  }, [extinguishers, alarms, hydrants, lighting, selectedSede]);

  // Map data
  const allEquipmentItems = useMemo(() => {
    return [
      ...extinguishers.map(i => ({ ...i, itemType: 'extinguisher' })),
      ...hydrants.map(i => ({ ...i, itemType: 'hydrant' })),
      ...alarms.map(i => ({ ...i, itemType: 'alarm' })),
      ...lighting.map(i => ({ ...i, itemType: 'lighting' }))
    ];
  }, [extinguishers, hydrants, alarms, lighting]);

  const mapLocations = useMemo(() => {
    // IMPORTANT: floorPlans may contain "" (empty string) as a valid id in legacy data.
    // So we must not treat empty string as "no selection".
    const planExists = floorPlans.some(p => p.id === selectedMapId);
    if (!planExists) return [];
    // Show locations that match the floorplan OR have coords but no floorplanid assigned (legacy data)
    return locations.filter(loc => {
      const hasCoords = loc.coordx !== undefined && loc.coordx !== null && loc.coordy !== undefined && loc.coordy !== null;
      const matchesFloorplan = loc.floorplanid === selectedMapId;
      const noFloorplanAssigned = !loc.floorplanid || loc.floorplanid === '';
      return hasCoords && (matchesFloorplan || noFloorplanAssigned);
    });
  }, [selectedMapId, locations, floorPlans]);

  const getLinkedEquipment = (locationId: string) => {
    return allEquipmentItems.find(item => (item as any).locationId === locationId);
  };

  const getEquipmentIcon = (itemType: string) => {
    switch (itemType) {
      case 'extinguisher': return '🧯';
      case 'hydrant': return '🚿';
      case 'alarm': return '🔔';
      case 'lighting': return '💡';
      default: return '📍';
    }
  };

  const getLocationStatusColor = (location: Location) => {
    const equipment = getLinkedEquipment(location.id);
    if (!equipment) return 'bg-gray-400 border-gray-600';
    
    const color = getStatusColor(equipment, (equipment as any).itemType);
    if (color === 'green') return 'bg-green-500 border-green-700';
    if (color === 'yellow') return 'bg-yellow-500 border-yellow-700';
    return 'bg-red-500 border-red-700';
  };

  const handleExportPDF = () => window.print();

  const handleClientScan = (code: string) => {
    const allItems = [...extinguishers, ...alarms, ...hydrants, ...lighting];
    const found = allItems.find(i => i.id === code);
    if (found) {
      setIsScanning(false);
      setModalItem(found);
    } else {
      notify(`Item ${code} não encontrado.`, "error");
    }
  };

  const selectedPlan = floorPlans.find(p => p.id === selectedMapId);

  return (
    <div className="min-h-screen bg-slate-100">
      <EquipmentDetailModal item={modalItem} onClose={() => setModalItem(null)} />

      {viewReport && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="bg-orange-600 text-white p-4 flex justify-between items-center sticky top-0">
              <h3 className="font-bold text-lg flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Detalhes da Ocorrência</h3>
              <button onClick={() => setViewReport(null)} className="hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Equipamento</span>
                <p className="font-bold text-gray-800 text-lg">{viewReport.system} - {viewReport.id}</p>
                <p className="text-gray-500 text-sm">{viewReport.local}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Data do Apontamento</span>
                <p className="font-mono text-gray-700">{new Date(viewReport.date).toLocaleDateString('pt-BR')} às {new Date(viewReport.date).toLocaleTimeString('pt-BR')}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Técnico Responsável</span>
                <p className="text-gray-700 font-medium">{viewReport.tecnico}</p>
              </div>
              
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Observação / Falha</span>
                <div className="bg-red-50 text-red-800 p-3 rounded border border-red-100 mt-1 text-sm font-medium">
                  {viewReport.observacao || viewReport.desc || 'Sem observações registradas'}
                </div>
              </div>

              {viewReport.fotos && viewReport.fotos.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-2">Fotos da Vistoria ({viewReport.fotos.length})</span>
                  <div className="grid grid-cols-3 gap-2">
                    {viewReport.fotos.map((foto: string, idx: number) => (
                      <a 
                        key={idx} 
                        href={foto} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
                      >
                        <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setViewReport(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg mt-2">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-sm bg-white rounded-xl overflow-hidden relative">
            <button onClick={() => setIsScanning(false)} className="absolute top-2 right-2 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="p-4 bg-slate-900 text-white text-center"><h3 className="font-bold text-lg">Escanear</h3></div>
            <div className="bg-gray-900 rounded-lg border-2 border-red-500 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
              <RealQRScanner onScanSuccess={handleClientScan} />
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center">
          <div className="bg-red-600 p-3 rounded-lg mr-4 shadow-sm"><LayoutDashboard className="text-white w-6 h-6" /></div>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
            <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">Painel do Cliente</span>
            <div className="hidden md:block h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-800 uppercase tracking-tighter leading-none">{user.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsScanning(true)} className="bg-slate-800 text-white px-3 py-2 rounded-lg flex items-center hover:bg-slate-700 transition-colors shadow-sm">
            <ScanLine className="w-5 h-5 mr-2" /> Scan
          </button>
          <select value={selectedSede} onChange={(e) => setSelectedSede(e.target.value)} className="text-sm bg-slate-100 border-none rounded py-1">
            <option>Todas</option>
            <option>Matriz</option>
            <option>Filial Sul</option>
          </select>
          <button onClick={onLogout}><LogOut className="w-5 h-5 text-gray-400 hover:text-red-600" /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
          {[
            { id: 'stats', icon: Activity, label: 'Estatísticas' },
            { id: 'extinguishers', icon: Flame, label: 'Extintores' },
            { id: 'hydrant', icon: Droplets, label: 'Mangueiras' },
            { id: 'lighting', icon: Lightbulb, label: 'Iluminação' },
            { id: 'alarm', icon: Bell, label: 'Alarmes' },
            { id: 'map', icon: MapIcon, label: 'Mapa' },
            { id: 'reports', icon: ClipboardList, label: 'Relatórios' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              <tab.icon className="w-6 h-6 mb-2" /><span className="text-xs font-bold text-center">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Extintores Card */}
              <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500">
                <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-gray-700">Extintores</h3><Flame className="w-5 h-5 text-red-500" /></div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span> <span className="font-bold">{annualStats.ext.total}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Em Dia</span> <span className="font-bold text-green-600">{annualStats.ext.ok}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-yellow-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Vence esse Mês</span> <span className="font-bold text-yellow-600">{annualStats.ext.expiring}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-red-600 flex items-center gap-1"><AlertOctagon className="w-3 h-3"/> Vencido</span> <span className="font-bold text-red-600">{annualStats.ext.expired}</span></div>
                </div>
              </div>
              
              {/* Mangueiras Card */}
              <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-gray-700">Mangueiras</h3><Droplets className="w-5 h-5 text-blue-500" /></div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span> <span className="font-bold">{annualStats.hyd.total}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Em Dia</span> <span className="font-bold text-green-600">{annualStats.hyd.ok}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-yellow-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Vence esse Mês</span> <span className="font-bold text-yellow-600">{annualStats.hyd.expiring}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-red-600 flex items-center gap-1"><AlertOctagon className="w-3 h-3"/> Vencido</span> <span className="font-bold text-red-600">{annualStats.hyd.expired}</span></div>
                </div>
              </div>
              
              {/* Iluminação Card */}
              <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-yellow-500">
                <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-gray-700">Iluminação</h3><Lightbulb className="w-5 h-5 text-yellow-500" /></div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span> <span className="font-bold">{annualStats.light.total}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Em Dia</span> <span className="font-bold text-green-600">{annualStats.light.ok}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-yellow-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Vence esse Mês</span> <span className="font-bold text-yellow-600">{annualStats.light.expiring}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-red-600 flex items-center gap-1"><AlertOctagon className="w-3 h-3"/> Vencido</span> <span className="font-bold text-red-600">{annualStats.light.expired}</span></div>
                </div>
              </div>
              
              {/* Alarmes Card */}
              <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-500">
                <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-gray-700">Alarmes</h3><Bell className="w-5 h-5 text-orange-500" /></div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span> <span className="font-bold">{annualStats.alarm.total}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Em Dia</span> <span className="font-bold text-green-600">{annualStats.alarm.ok}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-yellow-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Vence esse Mês</span> <span className="font-bold text-yellow-600">{annualStats.alarm.expiring}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-red-600 flex items-center gap-1"><AlertOctagon className="w-3 h-3"/> Vencido</span> <span className="font-bold text-red-600">{annualStats.alarm.expired}</span></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2"><Flame className="w-5 h-5 mr-2 text-red-600" /> Detalhamento: Extintores (Recarga Anual)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={[{ name: 'Em Dia', value: annualStats.ext.ok, color: '#22c55e' }, { name: 'Vence esse Mês', value: annualStats.ext.expiring, color: '#eab308' }, { name: 'Vencido', value: annualStats.ext.expired, color: '#ef4444' }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {[{ name: 'Em Dia', value: annualStats.ext.ok, color: '#22c55e' }, { name: 'Vence esse Mês', value: annualStats.ext.expiring, color: '#eab308' }, { name: 'Vencido', value: annualStats.ext.expired, color: '#ef4444' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-gray-800">{annualStats.ext.total > 0 ? Math.round((annualStats.ext.ok / annualStats.ext.total) * 100) : 0}%</span>
                      <p className="text-xs text-gray-500">Em Dia</p>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 h-64">
                  <p className="text-sm font-bold text-gray-500 mb-2 text-center">Recargas Realizadas por Mês</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      const currentYear = new Date().getFullYear();
                      const monthly = Array(12).fill(0);
                      (selectedSede === 'Todas' ? extinguishers : extinguishers.filter(i => i.sede === selectedSede)).forEach(i => {
                        if (i.ultimaManutencao && new Date(i.ultimaManutencao).getFullYear() === currentYear) {
                          monthly[new Date(i.ultimaManutencao).getMonth()]++;
                        }
                      });
                      return monthly.map((c, i) => ({ name: new Date(currentYear, i, 1).toLocaleString('pt-BR', { month: 'short' }), Qtd: c }));
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#f3f4f6' }} />
                      <Bar dataKey="Qtd" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2"><Droplets className="w-5 h-5 mr-2 text-blue-600" /> Detalhamento: Mangueiras (Teste Hidrostático)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={[{ name: 'Em Dia', value: annualStats.hyd.ok, color: '#22c55e' }, { name: 'Vence esse Mês', value: annualStats.hyd.expiring, color: '#eab308' }, { name: 'Vencido', value: annualStats.hyd.expired, color: '#ef4444' }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {[{ name: 'Em Dia', value: annualStats.hyd.ok, color: '#22c55e' }, { name: 'Vence esse Mês', value: annualStats.hyd.expiring, color: '#eab308' }, { name: 'Vencido', value: annualStats.hyd.expired, color: '#ef4444' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-gray-800">{annualStats.hyd.total > 0 ? Math.round((annualStats.hyd.ok / annualStats.hyd.total) * 100) : 0}%</span>
                      <p className="text-xs text-gray-500">Em Dia</p>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 h-64">
                  <p className="text-sm font-bold text-gray-500 mb-2 text-center">Testes Realizados por Mês</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      const currentYear = new Date().getFullYear();
                      const monthly = Array(12).fill(0);
                      (selectedSede === 'Todas' ? hydrants : hydrants.filter(i => i.sede === selectedSede)).forEach(i => {
                        if (i.ultimoTesteHidro && new Date(i.ultimoTesteHidro).getFullYear() === currentYear) {
                          monthly[new Date(i.ultimoTesteHidro).getMonth()]++;
                        }
                      });
                      return monthly.map((c, i) => ({ name: new Date(currentYear, i, 1).toLocaleString('pt-BR', { month: 'short' }), Qtd: c }));
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#f3f4f6' }} />
                      <Bar dataKey="Qtd" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Equipment Map Tab */}
        {activeTab === 'map' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <MapIcon className="w-5 h-5 mr-2 text-blue-600" /> Mapa de Equipamentos
                </h3>
                <select
                  value={selectedMapId}
                  onChange={(e) => setSelectedMapId(e.target.value)}
                  className="bg-slate-100 border-none rounded-lg p-2 text-sm"
                >
                  {floorPlans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.sede}</option>
                  ))}
                </select>
              </div>

              {/* Legend */}
              <div className="flex gap-6 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Em Dia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600">vence esse mes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">Vencido</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                  <span className="text-gray-600">Sem Equipamento</span>
                </div>
              </div>

              {selectedPlan ? (
                <div className="relative inline-block w-full">
                  <img
                    src={selectedPlan.image}
                    alt={selectedPlan.name}
                    className="w-full h-auto rounded-lg"
                    style={{ maxHeight: '60vh' }}
                  />
                  
                  {/* Render location points */}
                  {mapLocations.map((loc: Location) => {
                    const linkedEquipment = getLinkedEquipment(loc.id);
                    const colorClass = getLocationStatusColor(loc);
                    
                    return (
                      <div
                        key={loc.id}
                        className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 transition-transform shadow-lg ${colorClass}`}
                        style={{ left: `${loc.coordx}%`, top: `${loc.coordy}%` }}
                        onMouseEnter={() => setHoveredLocation(loc)}
                        onMouseLeave={() => setHoveredLocation(null)}
                        onClick={() => {
                          if (linkedEquipment) setModalItem(linkedEquipment);
                        }}
                      >
                        {linkedEquipment ? (
                          <span>{getEquipmentIcon((linkedEquipment as any).itemType)}</span>
                        ) : (
                          <MapPin className="w-4 h-4 text-white" />
                        )}
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
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <MapIcon className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg">Nenhuma planta cadastrada</p>
                  <p className="text-sm">Entre em contato com o administrador</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab !== 'reports' && activeTab !== 'stats' && activeTab !== 'map' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-blue-500"><p className="text-gray-500 text-sm font-medium">Total</p><p className="text-3xl font-bold text-gray-800 mt-2">{currentData.length}</p></div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-green-500"><p className="text-gray-500 text-sm font-medium">Operante / OK</p><p className="text-3xl font-bold text-green-600 mt-2">{currentData.filter(i => i.status === 'ok' || i.status === 'ativo').length}</p></div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-red-500"><p className="text-gray-500 text-sm font-medium">Manutenção / Crítico</p><p className="text-3xl font-bold text-red-600 mt-2">{currentData.filter(i => i.status !== 'ok' && i.status !== 'ativo').length}</p></div>
            </div>

            {(activeTab === 'extinguishers' || activeTab === 'hydrant') && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Panorama Mensal</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={detailedStats.barData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                        <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Realizados" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 w-full text-left">Conformidade</h3>
                  <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={detailedStats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {detailedStats.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                      <div className="text-center">
                        <span className="text-3xl font-bold text-gray-800">{detailedStats.total > 0 ? Math.round((detailedStats.done / detailedStats.total) * 100) : 0}%</span>
                        <p className="text-xs text-gray-500">Conformidade</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-800">Inventário</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-gray-500">
                    <tr><th className="p-4">ID</th><th className="p-4">Local</th><th className="p-4">Detalhes</th><th className="p-4">Status</th><th className="p-4 text-center">Ação</th></tr>
                  </thead>
                  <tbody>
                    {currentData.map(item => (
                      <tr key={item.id} className="border-t hover:bg-slate-50">
                        <td className="p-4 font-bold">{item.id}</td>
                        <td className="p-4">{(item as any).local || (item as any).localizacao}</td>
                        <td className="p-4 text-gray-500">{(item as any).tipo || ((item as any).polegada ? `${(item as any).polegada}" - ${(item as any).comprimento}` : '')}</td>
                        <td className="p-4"><StatusBadge status={item.status} /></td>
                        <td className="p-4 text-center">
                          <button onClick={() => setModalItem(item)} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center mx-auto" title="Ver Detalhes Completos">
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <ReportsSection 
            extinguishers={extinguishers}
            hydrants={hydrants}
            alarms={alarms}
            lighting={lighting}
            notify={notify}
          />
        )}
      </main>
    </div>
  );
};