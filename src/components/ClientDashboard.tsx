import { useState, useMemo } from 'react';
import {
  LayoutDashboard, LogOut, Flame, Bell, Droplets, Lightbulb, Activity,
  ClipboardList, ScanLine, Eye, AlertTriangle, CheckCircle, AlertOctagon,
  FileDown, X, MapPin
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { StatusBadge } from './StatusBadge';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { RealQRScanner } from './RealQRScanner';
import { User, Extinguisher, Alarm, Hydrant, Lighting } from '@/types';

interface ClientDashboardProps {
  user: User;
  extinguishers: Extinguisher[];
  alarms: Alarm[];
  hydrants: Hydrant[];
  lighting: Lighting[];
  onLogout: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

export const ClientDashboard = ({
  user, extinguishers, alarms, hydrants, lighting, onLogout, notify
}: ClientDashboardProps) => {
  const [selectedSede, setSelectedSede] = useState('Todas');
  const [activeTab, setActiveTab] = useState('stats');
  const [modalItem, setModalItem] = useState<any>(null);
  const [viewReport, setViewReport] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

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

  const annualStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const filterBySede = (list: any[]) => selectedSede === 'Todas' ? list : list.filter(i => i.sede === selectedSede);

    const extList = filterBySede(extinguishers);
    const hydList = filterBySede(hydrants);
    const lightList = filterBySede(lighting);
    const alarmList = filterBySede(alarms);

    const extDone = extList.filter(e => e.ultimaManutencao && new Date(e.ultimaManutencao).getFullYear() === currentYear).length;
    const hydDone = hydList.filter(h => h.ultimoTesteHidro && new Date(h.ultimoTesteHidro).getFullYear() === currentYear).length;
    const lightDone = lightList.filter(l => l.teste && new Date(l.teste).getFullYear() === currentYear).length;
    const alarmDone = alarmList.filter(a => a.ultimoTeste && new Date(a.ultimoTeste).getFullYear() === currentYear).length;

    return {
      ext: { total: extList.length, done: extDone, pending: extList.length - extDone },
      hyd: { total: hydList.length, done: hydDone, pending: hydList.length - hydDone },
      light: { total: lightList.length, done: lightDone },
      alarm: { total: alarmList.length, done: alarmDone }
    };
  }, [extinguishers, hydrants, lighting, alarms, selectedSede]);

  const detailedStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let total = 0, done = 0, pending = 0;
    const monthlyData = Array(12).fill(0);
    let dateField = '';

    if (activeTab === 'extinguishers') {
      total = annualStats.ext.total;
      done = annualStats.ext.done;
      pending = annualStats.ext.pending;
      dateField = 'ultimaManutencao';
    } else if (activeTab === 'hydrant') {
      total = annualStats.hyd.total;
      done = annualStats.hyd.done;
      pending = annualStats.hyd.pending;
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

              {/* Seção de Fotos */}
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { id: 'stats', icon: Activity, label: 'Estatísticas' },
            { id: 'extinguishers', icon: Flame, label: 'Extintores' },
            { id: 'hydrant', icon: Droplets, label: 'Mangueiras' },
            { id: 'lighting', icon: Lightbulb, label: 'Iluminação' },
            { id: 'alarm', icon: Bell, label: 'Alarmes' },
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
              <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500">
                <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-gray-700">Extintores</h3><Flame className="w-5 h-5 text-red-500" /></div>
                <div className="space-y-1"><div className="flex justify-between text-sm"><span className="text-gray-500">Total</span> <span className="font-bold">{annualStats.ext.total}</span></div><div className="flex justify-between text-sm"><span className="text-green-600">Realizados</span> <span className="font-bold text-green-600">{annualStats.ext.done}</span></div></div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-gray-700">Mangueiras</h3><Droplets className="w-5 h-5 text-blue-500" /></div>
                <div className="space-y-1"><div className="flex justify-between text-sm"><span className="text-gray-500">Total</span> <span className="font-bold">{annualStats.hyd.total}</span></div><div className="flex justify-between text-sm"><span className="text-green-600">Testados</span> <span className="font-bold text-green-600">{annualStats.hyd.done}</span></div></div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-yellow-500">
                <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-gray-700">Iluminação</h3><Lightbulb className="w-5 h-5 text-yellow-500" /></div>
                <div className="space-y-1"><div className="flex justify-between text-sm"><span className="text-gray-500">Total</span> <span className="font-bold">{annualStats.light.total}</span></div><div className="flex justify-between text-sm"><span className="text-green-600">Vistorias</span> <span className="font-bold text-green-600">{annualStats.light.done}</span></div></div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-500">
                <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-gray-700">Alarmes</h3><Bell className="w-5 h-5 text-orange-500" /></div>
                <div className="space-y-1"><div className="flex justify-between text-sm"><span className="text-gray-500">Total</span> <span className="font-bold">{annualStats.alarm.total}</span></div><div className="flex justify-between text-sm"><span className="text-green-600">Vistorias</span> <span className="font-bold text-green-600">{annualStats.alarm.done}</span></div></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2"><Flame className="w-5 h-5 mr-2 text-red-600" /> Detalhamento: Extintores (Recarga Anual)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ name: 'Realizado', value: annualStats.ext.done, color: '#22c55e' }, { name: 'Pendente', value: annualStats.ext.pending, color: '#ef4444' }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {[{ name: 'Realizado', value: annualStats.ext.done, color: '#22c55e' }, { name: 'Pendente', value: annualStats.ext.pending, color: '#ef4444' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-gray-800">{annualStats.ext.total > 0 ? Math.round((annualStats.ext.done / annualStats.ext.total) * 100) : 0}%</span>
                      <p className="text-xs text-gray-500">Concluído</p>
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
                      <Pie data={[{ name: 'Realizado', value: annualStats.hyd.done, color: '#22c55e' }, { name: 'Pendente', value: annualStats.hyd.pending, color: '#3b82f6' }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {[{ name: 'Realizado', value: annualStats.hyd.done, color: '#22c55e' }, { name: 'Pendente', value: annualStats.hyd.pending, color: '#3b82f6' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-gray-800">{annualStats.hyd.total > 0 ? Math.round((annualStats.hyd.done / annualStats.hyd.total) * 100) : 0}%</span>
                      <p className="text-xs text-gray-500">Concluído</p>
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

        {activeTab !== 'reports' && activeTab !== 'stats' && (
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
          <div className="animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-orange-500 overflow-hidden min-h-[400px]">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center bg-orange-50 justify-between">
                <div className="flex items-center">
                  <AlertOctagon className="w-6 h-6 text-orange-600 mr-3" />
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Relatório Unificado de Não Conformidades</h3>
                    <p className="text-sm text-orange-800">Consolidado de todos os sistemas de segurança</p>
                  </div>
                </div>
                <button onClick={handleExportPDF} className="bg-white border border-orange-200 text-orange-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-orange-100 flex items-center gap-2">
                  <FileDown className="w-4 h-4" /> Exportar PDF
                </button>
              </div>
              {allNonConformities.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr><th className="px-6 py-3">Sistema</th><th className="px-6 py-3">Data Apontamento</th><th className="px-6 py-3">ID</th><th className="px-6 py-3">Localização</th><th className="px-6 py-3">Descrição da Irregularidade</th><th className="px-6 py-3 text-center">Ação</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allNonConformities.map((item, idx) => (
                        <tr key={idx} className="hover:bg-orange-50/30">
                          <td className="px-6 py-4 font-bold text-gray-700">{item.system}</td>
                          <td className="px-6 py-4 font-mono text-gray-600">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-4 font-bold text-gray-800">{item.id}</td>
                          <td className="px-6 py-4 text-gray-600">{item.local}</td>
                          <td className="px-6 py-4"><span className="bg-red-100 text-red-800 px-2 py-1 rounded border border-red-200 font-medium">{item.desc}</span></td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => setViewReport(item)} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition-colors" title="Ver Detalhes">
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="bg-green-100 p-4 rounded-full mb-4"><CheckCircle className="w-12 h-12 text-green-600" /></div>
                  <h3 className="text-xl font-bold text-gray-800">Tudo em ordem!</h3>
                  <p className="text-gray-500">Nenhuma não conformidade pendente em nenhum sistema.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
