import { useState, useMemo } from 'react';
import {
  LogOut,
  Calendar,
  Flame,
  ClipboardList,
  FileDown,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { User, Extinguisher, Hydrant } from '@/types';
import { StatusBadge } from './StatusBadge';
import { EquipmentDetailModal } from './EquipmentDetailModal';

interface MaristaDashboardProps {
  user: User;
  extinguishers: Extinguisher[];
  hydrants: Hydrant[];
  onLogout: () => void;
  notify: (message: string, type: 'error' | 'success' | 'info' | 'warning') => void;
}

export const MaristaDashboard = ({ user, extinguishers, hydrants, onLogout, notify }: MaristaDashboardProps) => {
  const [selectedSede, setSelectedSede] = useState('Todas');
  const [modalItem, setModalItem] = useState<Extinguisher | Hydrant | null>(null);
  const [showNonConformityModal, setShowNonConformityModal] = useState(false);
  const today = useMemo(() => new Date(), []);
  const thirtyDaysFromNow = useMemo(() => new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), [today]);

  const calculateStatus = (dueDateStr?: string) => {
    if (!dueDateStr) return 'ok';
    
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);
    const todayCopy = new Date(today);
    todayCopy.setHours(0, 0, 0, 0);
    const thirtyDaysCopy = new Date(thirtyDaysFromNow);
    thirtyDaysCopy.setHours(0, 0, 0, 0);

    if (dueDate < todayCopy) {
      return 'vencido';
    } else if (dueDate <= thirtyDaysCopy) {
      return 'proximo';
    } else {
      return 'ok';
    }
  };

  const applyCalculatedStatus = <T extends { proximaManutencao?: string; proximoTesteHidro?: string; status: string }>(item: T) => {
    const dueDateStr = (item as any).proximaManutencao || (item as any).proximoTesteHidro;
    const calculatedStatus = calculateStatus(dueDateStr);
    return { ...item, status: calculatedStatus, calculatedStatus };
  };

  const filteredExtinguishers = useMemo(() => {
    const filtered = selectedSede === 'Todas' ? extinguishers : extinguishers.filter(e => e.sede === selectedSede);
    return filtered.map(applyCalculatedStatus);
  }, [extinguishers, selectedSede, today, thirtyDaysFromNow]);

  const filteredHydrants = useMemo(() => {
    const filtered = selectedSede === 'Todas' ? hydrants : hydrants.filter(h => h.sede === selectedSede);
    return filtered.map(applyCalculatedStatus);
  }, [hydrants, selectedSede, today, thirtyDaysFromNow]);

  const stats = useMemo(() => {
    const totalEquipments = filteredExtinguishers.length + filteredHydrants.length;
    let maintenanceDue = 0;
    let totalOverdue = 0;
    
    [...filteredExtinguishers, ...filteredHydrants].forEach((item: any) => {
      if (item.calculatedStatus === 'vencido' || item.status === 'irregular') {
        totalOverdue++;
      } else if (item.calculatedStatus === 'proximo') {
        maintenanceDue++;
      }
    });
    
    let inCompliance = totalEquipments - totalOverdue - maintenanceDue;
    inCompliance = inCompliance < 0 ? 0 : inCompliance;

    return {
      totalEquipments,
      maintenanceDue,
      totalOverdue,
      inCompliance,
    };
  }, [filteredExtinguishers, filteredHydrants]);

  const extPieData = useMemo(() => {
    let inDay = 0;
    let dueThisMonth = 0;
    let overdue = 0;

    filteredExtinguishers.forEach((e: any) => {
      if (e.calculatedStatus === 'vencido' || e.status === 'irregular') {
        overdue++;
      } else if (e.calculatedStatus === 'proximo') {
        dueThisMonth++;
      } else {
        inDay++;
      }
    });

    return [
      { name: 'Em Dia', value: inDay, color: '#10b981' },
      { name: 'Vence Este Mês', value: dueThisMonth, color: '#f59e0b' },
      { name: 'Vencidos/Irregular', value: overdue, color: '#ef4444' }
    ];
  }, [filteredExtinguishers]);

  const scheduleBarData = useMemo(() => {
    const currentYear = today.getFullYear();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyData = monthNames.map(name => ({ name, Extintores: 0, Mangueiras: 0 }));

    filteredExtinguishers.forEach(e => {
      if (e.proximaManutencao) {
        const date = new Date(e.proximaManutencao);
        if (date.getFullYear() === currentYear) {
          monthlyData[date.getMonth()].Extintores++;
        }
      }
    });

    filteredHydrants.forEach(h => {
      if (h.proximoTesteHidro) {
        const date = new Date(h.proximoTesteHidro);
        if (date.getFullYear() === currentYear) {
          monthlyData[date.getMonth()].Mangueiras++;
        }
      }
    });
    
    return monthlyData;
  }, [filteredExtinguishers, filteredHydrants, today]);

  const equipmentInventory = useMemo(() => {
    const ext = filteredExtinguishers.map(e => ({
      id: e.id,
      tipo: e.tipo || 'N/A',
      local: `${e.sede || ''} / ${e.localizacao || ''}`,
      vencimento: e.proximaManutencao,
      testeHidro: e.testeHidrostatico,
      status: (e as any).calculatedStatus || e.status,
      isExtinguisher: true,
      fullItem: e
    }));
    const hyd = filteredHydrants.map(h => ({
      id: h.id,
      tipo: h.tipo || 'N/A',
      local: `${h.sede || ''} / ${h.local || ''}`,
      vencimento: h.proximoTesteHidro,
      testeHidro: h.ultimoTesteHidro,
      status: (h as any).calculatedStatus || h.status,
      isExtinguisher: false,
      fullItem: h
    }));
    return [...ext, ...hyd].sort((a, b) => a.id.localeCompare(b.id));
  }, [filteredExtinguishers, filteredHydrants]);

  const availableSedes = useMemo(() => {
    const allSedes = new Set([
      ...extinguishers.map(e => e.sede).filter(Boolean),
      ...hydrants.map(h => h.sede).filter(Boolean)
    ]);
    return ['Todas', ...Array.from(allSedes).sort()];
  }, [extinguishers, hydrants]);

  // Non-conformity items (overdue or irregular)
  const nonConformityItems = useMemo(() => {
    const items: Array<{
      id: string;
      tipo: string;
      local: string;
      status: string;
      vencimento?: string;
      observacao?: string;
      fotos?: string[];
    }> = [];

    [...filteredExtinguishers, ...filteredHydrants].forEach((item: any) => {
      if (item.calculatedStatus === 'vencido' || item.status === 'irregular') {
        const isExt = 'localizacao' in item;
        const lastVistoria = item.historico?.find((h: any) => h.tipo === 'vistoria');
        
        items.push({
          id: item.id,
          tipo: item.tipo || 'N/A',
          local: `${item.sede || ''} / ${isExt ? item.localizacao : item.local || ''}`,
          status: item.calculatedStatus || item.status,
          vencimento: isExt ? item.proximaManutencao : item.proximoTesteHidro,
          observacao: lastVistoria?.details?.observacao,
          fotos: lastVistoria?.details?.fotos,
        });
      }
    });

    return items;
  }, [filteredExtinguishers, filteredHydrants]);

  return (
    <div className="min-h-screen bg-gray-50">
      {modalItem && (
        <EquipmentDetailModal 
          item={modalItem} 
          onClose={() => setModalItem(null)} 
          typeLabel="Detalhes do Equipamento" 
        />
      )}

      {/* Modal de Não Conformidade */}
      {showNonConformityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-red-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Relatório de Não Conformidade ({nonConformityItems.length})
              </h3>
              <button onClick={() => setShowNonConformityModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {nonConformityItems.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhuma não conformidade encontrada.</p>
              ) : (
                <div className="space-y-4">
                  {nonConformityItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-mono font-bold text-gray-800">{item.id}</span>
                          <span className="text-sm text-gray-500 ml-2">- {item.tipo}</span>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-sm text-gray-600 mb-1"><strong>Local:</strong> {item.local}</p>
                      {item.vencimento && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Vencimento:</strong> {new Date(item.vencimento).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {item.observacao && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-sm text-gray-700"><strong>Observação:</strong> {item.observacao}</p>
                        </div>
                      )}
                      {item.fotos && item.fotos.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Fotos da Vistoria:</p>
                          <div className="flex gap-2 flex-wrap">
                            {item.fotos.map((foto, idx) => (
                              <img
                                key={idx}
                                src={foto}
                                alt={`Foto ${idx + 1}`}
                                className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                onClick={() => window.open(foto, '_blank')}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-3 rounded-lg mr-2 shadow-sm">
            <Flame className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none">Dashboard Marista</h1>
          
          <button
            onClick={() => setShowNonConformityModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors border border-red-200"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Relatórios</span>
            {nonConformityItems.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                {nonConformityItems.length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-gray-600 hidden sm:block">Olá, {user.name.split(' ')[0]}</p>
          
          <select 
            value={selectedSede} 
            onChange={(e) => setSelectedSede(e.target.value)} 
            className="text-sm bg-slate-100 border border-gray-300 rounded-lg py-2 px-3 focus:ring-red-500 focus:border-red-500"
          >
            {availableSedes.map(sede => (
              <option key={sede} value={sede}>{sede}</option>
            ))}
          </select>

          <button onClick={onLogout}>
            <LogOut className="w-5 h-5 text-gray-400 hover:text-red-600" />
          </button>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto p-6">
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-md border-b-4 border-slate-300">
            <p className="text-gray-500 text-sm font-medium">Total de Equipamentos</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalEquipments}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border-b-4 border-green-500">
            <p className="text-gray-500 text-sm font-medium">Em Dia / OK</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.inCompliance}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border-b-4 border-yellow-500">
            <p className="text-gray-500 text-sm font-medium">Vence Este Mês</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.maintenanceDue}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border-b-4 border-red-500">
            <p className="text-gray-500 text-sm font-medium">Vencidos / Irregular</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalOverdue}</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Gráfico de Pizza */}
          <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-1 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <Flame className="w-5 h-5 mr-2 text-red-600"/> Status Atual dos Extintores
            </h3>
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={extPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                  >
                    {extPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} itens`, props.payload.name]} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    formatter={(value, entry: any) => (
                      <span className="text-gray-600 text-sm">{entry.payload.name} ({entry.payload.value})</span>
                    )} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Gráfico de Barras */}
          <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600"/> Cronograma Anual de Vencimentos
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scheduleBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Legend wrapperStyle={{paddingTop: '10px'}} />
                  <Bar dataKey="Extintores" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Mangueiras" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Inventário */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-slate-600" /> Inventário de Equipamentos ({selectedSede})
            </h3>
            <button 
              onClick={() => window.print()} 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <FileDown className="w-4 h-4" /> Exportar Relatório
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">ID / Tipo</th>
                  <th className="px-4 py-3">Localização</th>
                  <th className="px-4 py-3">Vencimento (Recarga/T.H.)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {equipmentInventory.map(item => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-700">
                      {item.id} - <span className="text-xs font-normal text-gray-500">{item.tipo}</span>
                    </td>
                    <td className="px-4 py-3">{item.local}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.vencimento ? new Date(item.vencimento).toLocaleDateString('pt-BR') : 'N/A'}
                      <span className="block text-xs text-gray-500">
                        {item.isExtinguisher ? '(Recarga)' : '(T. Hidrostático)'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => setModalItem(item.fullItem)} 
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center mx-auto" 
                        title="Ver Detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
