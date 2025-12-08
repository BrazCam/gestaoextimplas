import { useState, useMemo } from 'react';
import {
  ClipboardCheck, LogOut, Flame, Bell, Droplets, Lightbulb, ListFilter,
  CheckSquare, ArrowLeft, QrCode, Search, MapPin, Edit3, CheckCircle, X
} from 'lucide-react';
import { RealQRScanner } from './RealQRScanner';
import { Extinguisher, Alarm, Hydrant, Lighting, HistoryLog } from '@/types';

interface InspectionModeProps {
  extinguishers: Extinguisher[];
  alarms: Alarm[];
  hydrants: Hydrant[];
  lighting: Lighting[];
  onAddInspection: (type: string, id: string, logEntry: HistoryLog, newStatus: string) => void;
  onLogout: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

export const InspectionMode = ({
  extinguishers, alarms, hydrants, lighting,
  onAddInspection, onLogout, notify
}: InspectionModeProps) => {
  const [step, setStep] = useState<'dashboard' | 'scan' | 'form' | 'success'>('dashboard');
  const [activeTab, setActiveTab] = useState<'pending' | 'inspected'>('pending');
  const [manualId, setManualId] = useState('');
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<any>({});
  const [selectedSede, setSelectedSede] = useState('Todas');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { pendingList, inspectedList, allData } = useMemo(() => {
    const normalize = (list: any[], type: string) => list.map(i => ({ ...i, type, unifiedLocal: i.local || i.localizacao }));

    const all = [
      ...normalize(extinguishers, 'extinguisher'),
      ...normalize(alarms, 'alarm'),
      ...normalize(hydrants, 'hydrant'),
      ...normalize(lighting, 'lighting')
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const p: any[] = [], i: any[] = [];

    all.forEach(item => {
      let isPending = false;

      if (!item.proximaVistoria) {
        isPending = true;
      } else {
        const nextDate = new Date(item.proximaVistoria);
        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 15) isPending = true;
      }

      if (['vencido', 'irregular', 'falha', 'atencao'].includes(item.status)) isPending = true;

      if (isPending) p.push(item);
      else i.push(item);
    });

    p.sort((a, b) => (a.proximaVistoria || '0000') > (b.proximaVistoria || '0000') ? 1 : -1);
    i.sort((a, b) => (b.ultimaVistoria || '0000') > (a.ultimaVistoria || '0000') ? 1 : -1);

    return { pendingList: p, inspectedList: i, allData: all };
  }, [extinguishers, alarms, hydrants, lighting]);

  const uniqueSedes = useMemo(() => {
    const sedes = new Set(allData.map(i => i.sede).filter(Boolean));
    return ['Todas', ...Array.from(sedes).sort()];
  }, [allData]);

  const groupedData = useMemo(() => {
    const currentList = activeTab === 'pending' ? pendingList : inspectedList;
    const filteredBySede = selectedSede === 'Todas' ? currentList : currentList.filter(i => i.sede === selectedSede);
    const groups: Record<string, any[]> = { extinguisher: [], hydrant: [], lighting: [], alarm: [] };
    filteredBySede.forEach(item => { if (groups[item.type]) groups[item.type].push(item); });
    return groups;
  }, [activeTab, pendingList, inspectedList, selectedSede]);

  const typeConfig: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
    extinguisher: { label: 'Extintores', icon: Flame, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    hydrant: { label: 'Mangueiras', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    lighting: { label: 'Luz Emergência', icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    alarm: { label: 'Alarmes', icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
  };

  const handleScan = (code: string) => {
    const searchTerm = code ? String(code).trim().toLowerCase() : '';

    let found: any = null; let type: string | null = null;
    found = extinguishers.find(i => i.id.toLowerCase() === searchTerm); if (found) type = 'extinguisher';
    if (!found) { found = alarms.find(i => i.id.toLowerCase() === searchTerm); if (found) type = 'alarm'; }
    if (!found) { found = hydrants.find(i => i.id.toLowerCase() === searchTerm); if (found) type = 'hydrant'; }
    if (!found) { found = lighting.find(i => i.id.toLowerCase() === searchTerm); if (found) type = 'lighting'; }

    if (found) {
      setScannedItem(found);
      setDetectedType(type);
      setStep('form');
      if (type === 'extinguisher') setChecklist({ manometro: null, lacre: null, mangueira: null, sinalizacao: null, acesso: null, observacao: '' });
      else setChecklist({ item1: null, item2: null, observacao: '' });
    } else {
      if (manualId !== '' || code) notify(`Código: ${code || manualId} não encontrado.`, "warning");
    }
  };

  const handleSelectFromList = (item: any) => {
    setScannedItem(item);
    setDetectedType(item.type);
    setStep('form');
    if (item.type === 'extinguisher') setChecklist({ manometro: null, lacre: null, mangueira: null, sinalizacao: null, acesso: null, observacao: '' });
    else setChecklist({ item1: null, item2: null, observacao: '' });
  };

  const handleFinishInspection = () => {
    const hasFailure = Object.entries(checklist).some(([key, val]) => key !== 'observacao' && val === false);
    const finalStatus = hasFailure ? 'irregular' : 'ok';
    const logEntry: HistoryLog = {
      data: new Date().toISOString(),
      descricao: hasFailure ? 'Vistoria - Irregularidade Detectada' : 'Vistoria - OK',
      tipo: 'vistoria',
      tecnico: 'Técnico de Campo',
      details: checklist
    };
    onAddInspection(detectedType!, scannedItem.id, logEntry, finalStatus);
    setStep('success');
  };

  const ChecklistItem = ({ label, field }: { label: string; field: string }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
      <p className="font-bold text-gray-800 mb-3">{label}</p>
      <div className="flex gap-2">
        <button onClick={() => setChecklist({ ...checklist, [field]: true })} className={`flex-1 py-2 rounded-md font-medium text-sm border ${checklist[field] === true ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
          SIM (Conforme)
        </button>
        <button onClick={() => setChecklist({ ...checklist, [field]: false })} className={`flex-1 py-2 rounded-md font-medium text-sm border ${checklist[field] === false ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
          NÃO
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-blue-800 text-white p-4 flex justify-between items-center shadow-md relative z-10">
        <h2 className="font-bold flex items-center gap-2"><ClipboardCheck /> Vistoria Universal</h2>
        <button onClick={onLogout}><LogOut className="w-5 h-5 opacity-80 hover:text-red-300 transition-colors" /></button>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {step === 'dashboard' && (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="flex bg-white shadow-sm p-1 mx-4 mt-4 rounded-xl border border-gray-200">
              <button
                onClick={() => { setActiveTab('pending'); setSelectedType(null); }}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'pending' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <ListFilter className="w-4 h-4" /> Pendentes
              </button>
              <button
                onClick={() => { setActiveTab('inspected'); setSelectedType(null); }}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'inspected' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <CheckSquare className="w-4 h-4" /> Vistoriados
              </button>
            </div>

            <div className="mt-4 px-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {uniqueSedes.map(sede => (
                  <button
                    key={sede}
                    onClick={() => { setSelectedSede(sede); setSelectedType(null); }}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${selectedSede === sede ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200'}`}
                  >
                    {sede}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
              {selectedType === null ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(groupedData).map(([type, items]) => {
                    const config = typeConfig[type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 bg-white shadow-sm ${config.border}`}
                      >
                        <div className={`p-3 rounded-full mb-3 ${config.bg}`}>
                          <Icon className={`w-8 h-8 ${config.color}`} />
                        </div>
                        <span className="text-sm font-bold text-gray-600 uppercase mb-1">{config.label}</span>
                        <span className="text-2xl font-black text-gray-800">{items.length}</span>
                        <span className="text-[10px] text-gray-400 font-medium mt-1">
                          {activeTab === 'pending' ? 'Pendentes' : 'Vistoriados'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="animate-slide-up">
                  <button
                    onClick={() => setSelectedType(null)}
                    className="mb-4 flex items-center text-sm font-bold text-gray-500 hover:text-blue-600"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Categorias
                  </button>

                  <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border bg-white shadow-sm ${typeConfig[selectedType].border}`}>
                    <div className={`p-1.5 rounded-full ${typeConfig[selectedType].bg}`}>
                      {(() => { const Icon = typeConfig[selectedType].icon; return <Icon className={`w-4 h-4 ${typeConfig[selectedType].color}`} />; })()}
                    </div>
                    <h3 className="font-bold text-gray-700 flex-1">{typeConfig[selectedType].label}</h3>
                    <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-md text-gray-500">
                      {groupedData[selectedType].length} itens
                    </span>
                  </div>

                  {groupedData[selectedType].length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <p>Nenhum item nesta categoria.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupedData[selectedType].map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectFromList(item)}
                          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors active:scale-[0.99]"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-800 text-lg">{item.id}</span>
                              {activeTab === 'pending' && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.status === 'ok' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                  {item.status === 'ok' ? 'A Vencer' : item.status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-gray-500 text-sm mb-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {item.unifiedLocal}
                            </div>
                            <p className="text-xs text-gray-400">
                              {activeTab === 'pending'
                                ? `Vence: ${item.proximaVistoria ? new Date(item.proximaVistoria).toLocaleDateString('pt-BR') : 'Sem data'}`
                                : `Vistoria: ${item.ultimaVistoria ? new Date(item.ultimaVistoria).toLocaleDateString('pt-BR') : 'N/A'}`
                              }
                            </p>
                          </div>
                          <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                            {activeTab === 'pending' ? <Edit3 className="w-5 h-5" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
              <div className="max-w-7xl mx-auto flex justify-center pointer-events-auto">
                <button
                  onClick={() => setStep('scan')}
                  className="bg-blue-800 text-white w-full max-w-sm py-4 rounded-xl font-bold shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 transform active:scale-95 transition-all hover:bg-blue-700"
                >
                  <QrCode className="w-6 h-6" /> ESCANEAR QR CODE
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'scan' && (
          <div className="w-full h-full flex flex-col p-4 animate-fade-in">
            <div className="flex items-center mb-4">
              <button onClick={() => setStep('dashboard')} className="p-2 -ml-2 text-gray-600 hover:text-blue-800">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h3 className="font-bold text-gray-700 ml-2">Identificar Equipamento</h3>
            </div>
            <div className="bg-gray-900 rounded-lg border-2 border-red-500 relative overflow-hidden flex-1 max-h-[50vh] shadow-inner flex flex-col items-center justify-center">
              <RealQRScanner onScanSuccess={handleScan} />
            </div>

            <div className="mt-6">
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Ou digite o código</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <div className="flex gap-2">
                <input
                  className="border-2 border-gray-200 p-4 w-full rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                  value={manualId}
                  onChange={e => setManualId(e.target.value)}
                  placeholder="Ex: EXT-001"
                />
                <button onClick={() => handleScan(manualId)} className="bg-blue-600 text-white px-6 rounded-xl font-bold shadow-md hover:bg-blue-700">
                  <Search className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="w-full max-w-md mx-auto p-4 pb-20 animate-slide-up overflow-y-auto">
            <button onClick={() => { setStep('dashboard'); setScannedItem(null); setManualId(''); }} className="mb-6 flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium">
              <ArrowLeft className="w-5 h-5 mr-1" /> Cancelar Vistoria
            </button>

            <div className="bg-white border-l-4 border-blue-500 shadow-sm p-5 rounded-r-xl mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-gray-800 text-2xl">{scannedItem.id}</h3>
                  <p className="text-blue-600 font-medium">{scannedItem.type === 'extinguisher' ? 'Extintor' : scannedItem.type === 'hydrant' ? 'Mangueira' : scannedItem.type === 'alarm' ? 'Alarme' : 'Iluminação'}</p>
                </div>
                <div className="bg-gray-100 p-2 rounded-lg"><MapPin className="w-6 h-6 text-gray-500" /></div>
              </div>
              <p className="text-gray-500 text-sm mt-2">{scannedItem.unifiedLocal}</p>
            </div>

            <div className="space-y-1">
              {detectedType === 'extinguisher' && (
                <>
                  <ChecklistItem label="1. Manômetro com pressão adequada?" field="manometro" />
                  <ChecklistItem label="2. Lacre íntegro?" field="lacre" />
                  <ChecklistItem label="3. Mangueira em bom estado?" field="mangueira" />
                  <ChecklistItem label="4. Sinalização visível?" field="sinalizacao" />
                  <ChecklistItem label="5. Acesso livre?" field="acesso" />
                </>
              )}
              {detectedType !== 'extinguisher' && (
                <>
                  <ChecklistItem label="1. O equipamento está funcional?" field="item1" />
                  <ChecklistItem label="2. O acesso está livre?" field="item2" />
                </>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 mt-4 shadow-sm">
              <label className="font-bold text-gray-800 mb-2 block flex items-center gap-2"><Edit3 className="w-4 h-4" /> Observações</label>
              <textarea
                className="w-full border-2 border-gray-100 p-3 rounded-lg bg-gray-50 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                rows={3}
                placeholder="Alguma avaria ou detalhe importante?"
                value={checklist.observacao}
                onChange={e => setChecklist({ ...checklist, observacao: e.target.value })}
              />
            </div>

            <button onClick={handleFinishInspection} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg mt-6 text-lg hover:bg-green-700 transform active:scale-95 transition-all">
              Concluir Vistoria
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">Vistoria Registrada!</h2>
            <p className="text-gray-500 mb-8">O equipamento foi atualizado e movido para a lista de vistoriados.</p>
            <button onClick={() => { setStep('dashboard'); setManualId(''); }} className="bg-blue-800 text-white px-8 py-4 rounded-xl font-bold w-full max-w-xs hover:bg-blue-900 transition-colors shadow-lg">
              Voltar ao Painel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
