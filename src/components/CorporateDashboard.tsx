import { useState, useMemo } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle, X, LogOut, Filter, 
  LayoutDashboard, Map as MapIcon, Calendar, Printer
} from 'lucide-react';
import { Extinguisher, Hydrant, Alarm, Lighting } from '@/types';

interface FloorPlan {
  id: string;
  name: string;
  sede: string;
  image: string;
}

interface CorporateDashboardProps {
  extinguishers: Extinguisher[];
  hydrants: Hydrant[];
  alarms: Alarm[];
  lighting: Lighting[];
  floorPlans: FloorPlan[];
  onLogout: () => void;
}

export const CorporateDashboard = ({
  extinguishers,
  hydrants,
  alarms,
  lighting,
  floorPlans,
  onLogout
}: CorporateDashboardProps) => {
  const [viewType, setViewType] = useState('all');
  const [selectedSede, setSelectedSede] = useState('Todas');
  const [showReport, setShowReport] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMapId, setSelectedMapId] = useState(floorPlans[0]?.id || '');
  const [mapViewMode, setMapViewMode] = useState('general');

  const uniqueSedes = useMemo(() => {
    const allItems = [...extinguishers, ...hydrants, ...(alarms || []), ...(lighting || [])];
    const sedes = new Set(allItems.map(i => i.sede).filter(Boolean));
    return ['Todas', ...Array.from(sedes).sort()];
  }, [extinguishers, hydrants, alarms, lighting]);

  const mapItems = useMemo(() => {
    if (!selectedMapId) return [];
    const all = [
      ...extinguishers.map(i => ({ ...i, type: 'ext' })),
      ...hydrants.map(i => ({ ...i, type: 'hyd' })),
      ...alarms.map(i => ({ ...i, type: 'ala' })),
      ...lighting.map(i => ({ ...i, type: 'lig' }))
    ];
    return all.filter((item: any) => item.floorPlanId === selectedMapId);
  }, [selectedMapId, extinguishers, hydrants, alarms, lighting]);

  const getItemColor = (item: any) => {
    const today = new Date();
    const checkDate = (dateStr: string | undefined, daysThreshold = 30) => {
      if (!dateStr) return 'unknown';
      const target = new Date(dateStr);
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'expired';
      if (diffDays <= daysThreshold) return 'soon';
      return 'ok';
    };

    let status = 'ok';

    if (mapViewMode === 'maintenance') {
      if (item.type === 'ext') {
        const s1 = checkDate(item.proximaManutencao, 30);
        const s2 = checkDate(item.testeHidrostatico, 30);
        if (s1 === 'expired' || s2 === 'expired') status = 'expired';
        else if (s1 === 'soon' || s2 === 'soon') status = 'soon';
      } else if (item.type === 'hyd') {
        const s = checkDate(item.proximoTesteHidro, 30);
        if (s === 'expired') status = 'expired';
        else if (s === 'soon') status = 'soon';
      } else {
        if (['falha', 'inativo', 'vencido'].includes(item.status)) status = 'expired';
      }
    } else if (mapViewMode === 'inspection') {
      const s = checkDate(item.proximaVistoria, 15);
      status = s;
      if (status === 'unknown' && ['vencido', 'irregular', 'falha'].includes(item.status)) status = 'expired';
    } else {
      if (['vencido', 'irregular', 'falha', 'inativo'].includes(item.status)) status = 'expired';
      else {
        const isSoon =
          checkDate(item.proximaManutencao) === 'soon' ||
          checkDate(item.proximoTesteHidro) === 'soon' ||
          checkDate(item.proximaVistoria) === 'soon' ||
          item.status === 'proximo' ||
          item.status === 'atencao';
        if (isSoon) status = 'soon';
      }
    }

    if (status === 'expired') return 'bg-red-500 border-red-700 animate-pulse';
    if (status === 'soon') return 'bg-orange-500 border-orange-700';
    return 'bg-green-500 border-green-700';
  };

  const { statusCounts, monthlyData, total, nonConformities } = useMemo(() => {
    let items: any[] = [];
    if (viewType === 'all' || viewType === 'extinguishers')
      items = [...items, ...extinguishers.map(i => ({ ...i, category: 'Extintor' }))];
    if (viewType === 'all' || viewType === 'hydrants')
      items = [...items, ...hydrants.map(i => ({ ...i, category: 'Mangueira' }))];
    if (viewType === 'all' && alarms)
      items = [...items, ...alarms.map(i => ({ ...i, category: 'Alarme' }))];
    if (viewType === 'all' && lighting)
      items = [...items, ...lighting.map(i => ({ ...i, category: 'Iluminação' }))];

    if (selectedSede !== 'Todas') {
      items = items.filter(i => i.sede === selectedSede);
    }

    const today = new Date();
    const currentYear = today.getFullYear();

    let statusCounts = { ok: 0, warning: 0, expired: 0 };
    let monthlyData = Array(12).fill(0).map((_, i) => ({
      name: new Date(currentYear, i, 1).toLocaleString('pt-BR', { month: 'short' }),
      Vencimentos: 0
    }));

    let ncList: any[] = [];

    items.forEach(item => {
      let expiryDateStr: string | null = null;
      if (item.category === 'Extintor') {
        const dates = [item.proximaManutencao, item.testeHidrostatico].filter(Boolean).map(d => new Date(d));
        if (dates.length > 0)
          expiryDateStr = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
      } else if (item.category === 'Mangueira') {
        expiryDateStr = item.proximoTesteHidro;
      }

      let isItemOk = true;
      if (expiryDateStr) {
        const expiryDate = new Date(expiryDateStr);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          statusCounts.expired++;
          isItemOk = false;
          ncList.push({ ...item, issue: 'Vencido', date: expiryDateStr });
        } else if (diffDays <= 30) {
          statusCounts.warning++;
          isItemOk = false;
        } else {
          statusCounts.ok++;
        }

        if (expiryDate.getFullYear() === currentYear) {
          const monthIdx = expiryDate.getMonth();
          monthlyData[monthIdx].Vencimentos++;
        }
      } else {
        if (['vencido', 'irregular', 'falha', 'atencao', 'manutencao'].includes(item.status)) {
          statusCounts.expired++;
          isItemOk = false;
          ncList.push({ ...item, issue: item.status });
        } else {
          statusCounts.ok++;
        }
      }
    });

    const maxMonthly = Math.max(...monthlyData.map(m => m.Vencimentos), 1);

    return { statusCounts, monthlyData, total: items.length, maxMonthly, nonConformities: ncList };
  }, [viewType, selectedSede, extinguishers, hydrants, alarms, lighting]);

  const selectedPlan = floorPlans.find(p => p.id === selectedMapId);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-red-600 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                <span className="font-bold">Relatório de Não Conformidades (Técnico)</span>
              </div>
              <button onClick={() => setShowReport(false)} className="hover:bg-white/20 p-1 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {nonConformities.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma não conformidade encontrada.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Data</th>
                      <th className="p-3 text-left">Item</th>
                      <th className="p-3 text-left">Local</th>
                      <th className="p-3 text-left">Problema</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonConformities.map((nc: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="p-3">{nc.date || '-'}</td>
                        <td className="p-3 font-bold">{nc.id}</td>
                        <td className="p-3">{nc.local || nc.localizacao}</td>
                        <td className="p-3 text-red-600">{nc.issue}</td>
                        <td className="p-3">{nc.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <Printer className="w-4 h-4" /> Imprimir Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="font-bold text-gray-800">Dashboard Corporativo</h1>
              <p className="text-xs text-gray-500">Grupo Marista - Visão Geral</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowReport(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> Relatório
            </button>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex border-t">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Indicadores
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`py-4 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'map' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <MapIcon className="w-4 h-4" /> Mapeamento de Planta
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="max-w-7xl mx-auto p-6">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex gap-2">
              {['all', 'extinguishers', 'hydrants'].map(type => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewType === type ? 'bg-slate-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                >
                  {type === 'all' ? 'Todos' : type === 'extinguishers' ? 'Extintores' : 'Mangueiras'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto bg-white px-3 py-2 rounded-lg">
              <Filter className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">Sede:</span>
              <select
                value={selectedSede}
                onChange={(e) => setSelectedSede(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 outline-none"
              >
                {uniqueSedes.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
              <p className="text-gray-500 text-sm">Em Dia</p>
              <p className="text-3xl font-bold text-green-600">{statusCounts.ok}</p>
              <CheckCircle className="w-8 h-8 text-green-200 mt-2" />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
              <p className="text-gray-500 text-sm">Vence este Mês</p>
              <p className="text-3xl font-bold text-orange-600">{statusCounts.warning}</p>
              <AlertTriangle className="w-8 h-8 text-orange-200 mt-2" />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-red-500">
              <p className="text-gray-500 text-sm">Vencidos</p>
              <p className="text-3xl font-bold text-red-600">{statusCounts.expired}</p>
              <X className="w-8 h-8 text-red-200 mt-2" />
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart Simulation */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-700 mb-4">Status de Vencimento</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{total}</p>
                      <p className="text-xs text-gray-500">Itens</p>
                    </div>
                  </div>
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                    {total > 0 && (
                      <>
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="#22c55e" strokeWidth="12"
                          strokeDasharray={`${(statusCounts.ok / total) * 251.2} 251.2`}
                        />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="#f97316" strokeWidth="12"
                          strokeDasharray={`${(statusCounts.warning / total) * 251.2} 251.2`}
                          strokeDashoffset={`-${(statusCounts.ok / total) * 251.2}`}
                        />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="#ef4444" strokeWidth="12"
                          strokeDasharray={`${(statusCounts.expired / total) * 251.2} 251.2`}
                          strokeDashoffset={`-${((statusCounts.ok + statusCounts.warning) / total) * 251.2}`}
                        />
                      </>
                    )}
                  </svg>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded" /> Em Dia</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded" /> Vence Mês</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded" /> Vencidos</div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-700">Cronograma de Vencimentos ({new Date().getFullYear()})</h3>
              </div>
              <div className="flex items-end gap-2 h-40">
                {monthlyData.map((month, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <p className="text-xs text-gray-600 mb-1">{month.Vencimentos > 0 ? month.Vencimentos : ''}</p>
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${Math.max((month.Vencimentos / Math.max(...monthlyData.map(m => m.Vencimentos), 1)) * 100, 4)}%` }}
                    />
                    <p className="text-xs text-gray-500 mt-1">{month.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'map' && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-orange-600" /> Mapa de Equipamentos
                </h3>
                <p className="text-xs text-gray-500">Visualização Georreferenciada</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={mapViewMode}
                  onChange={(e) => setMapViewMode(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2 font-bold"
                >
                  <option value="general">Visão Geral (Combinado)</option>
                  <option value="maintenance">Status Recarga/Hidro (N2/N3)</option>
                  <option value="inspection">Status Vistoria (Mensal)</option>
                </select>
                <select
                  value={selectedMapId}
                  onChange={(e) => setSelectedMapId(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2 font-bold"
                >
                  {floorPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name} - {plan.sede}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPlan ? (
              <div className="relative">
                <img
                  src={selectedPlan.image}
                  alt="Planta Baixa"
                  className="w-full h-auto rounded-lg"
                />
                {mapItems.map((item: any) => {
                  if (item.coordX === undefined || item.coordY === undefined) return null;
                  return (
                    <div
                      key={item.id}
                      className={`absolute w-6 h-6 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 ${getItemColor(item)}`}
                      style={{ left: `${item.coordX}%`, top: `${item.coordY}%` }}
                      title={item.id}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MapIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Nenhuma planta cadastrada</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
