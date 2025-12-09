import { useState, useMemo, useRef } from 'react';
import {
  Settings, LogOut, Flame, Bell, Droplets, Lightbulb, Zap, Filter,
  PlusCircle, Edit3, Trash2, X, Save, PackagePlus, Building2, Camera,
  Image as ImageIcon, FileDown, FileSpreadsheet, FileUp, Cpu, QrCode,
  SearchCode, RefreshCcw, ClipboardCheck, Search
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { RealQRScanner } from './RealQRScanner';
import { compressImage } from '@/utils/imageCompression';
import { Extinguisher, Alarm, Hydrant, Lighting } from '@/types';

interface AdminDashboardProps {
  extinguishers: Extinguisher[];
  alarms: Alarm[];
  hydrants: Hydrant[];
  lighting: Lighting[];
  onUpdate: (type: string, id: string, item: any) => void;
  onAdd: (type: string, item: any) => void;
  onDelete: (type: string, id: string) => void;
  onLogout: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

export const AdminDashboard = ({
  extinguishers, alarms, hydrants, lighting,
  onUpdate, onAdd, onDelete, onLogout, notify
}: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('extinguishers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [selectedSede, setSelectedSede] = useState('Todas');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [feedSearch, setFeedSearch] = useState('');
  const [feedItem, setFeedItem] = useState<any>(null);
  const [feedType, setFeedType] = useState<string | null>(null);
  const [isFeedScanning, setIsFeedScanning] = useState(false);

  const uniqueSedes = useMemo(() => {
    const allItems = [...extinguishers, ...alarms, ...hydrants, ...lighting];
    const sedes = new Set(allItems.map(i => i.sede).filter(Boolean));
    return ['Todas', ...Array.from(sedes).sort()];
  }, [extinguishers, alarms, hydrants, lighting]);

  const currentData = useMemo(() => {
    let data: any[] = [];
    switch (activeTab) {
      case 'alarm': data = alarms; break;
      case 'hydrant': data = hydrants; break;
      case 'lighting': data = lighting; break;
      default: data = extinguishers;
    }
    return selectedSede === 'Todas' ? data : data.filter(i => i.sede === selectedSede);
  }, [activeTab, extinguishers, alarms, hydrants, lighting, selectedSede]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setFormData((prev: any) => ({ ...prev, fotoLocal: compressedBase64 }));
        notify("Foto processada e comprimida com sucesso.", "success");
      } catch (error) {
        notify("Erro ao processar imagem.", "error");
      }
    }
  };

  const handleExportAll = () => {
    const header = "ID,Local,Tipo,Marca,Status\n";
    const rows = [...extinguishers, ...alarms, ...hydrants, ...lighting]
      .map(e => `${e.id},${(e as any).local || (e as any).localizacao},${(e as any).tipo || 'N/A'},${(e as any).marca || (e as any).fabricante || 'N/A'},${e.status}`)
      .join("\n");

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventario_Geral_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    notify("Inventário exportado com sucesso!", "success");
    setIsSettingsOpen(false);
  };

  const handleExportDetailed = () => {
    const header = "ID,Sede,Local,Ultima Recarga,Teste Hidro,Status,Ultima Vistoria\n";
    const rows = [...extinguishers, ...hydrants]
      .map(e => {
        const recarga = (e as any).ultimaManutencao || (e as any).ultimoTesteHidro || 'N/A';
        const hidro = (e as any).testeHidrostatico || (e as any).proximoTesteHidro || 'N/A';
        const vistoria = (e as any).ultimaVistoria || 'N/A';
        return `${e.id},${e.sede},${(e as any).local || (e as any).localizacao},${recarga},${hidro},${e.status},${vistoria}`;
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_Gerencial_Detalhado_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    notify("Relatório Gerencial exportado!", "success");
    setIsSettingsOpen(false);
  };

  const handleImportReport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAI(true);
    notify("IA Iniciada: Analisando documento...", "info");

    setTimeout(() => {
      const mockFoundId = 'EXT-002';
      const today = new Date().toISOString().split('T')[0];
      const nextHydro = new Date();
      nextHydro.setFullYear(nextHydro.getFullYear() + 5);

      const targetItem = extinguishers.find(ex => ex.id === mockFoundId);

      if (targetItem) {
        const updatedItem = {
          ...targetItem,
          status: 'ok',
          ultimaManutencao: today,
          testeHidrostatico: nextHydro.toISOString().split('T')[0],
          proximaManutencao: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          historico: [
            ...(targetItem.historico || []),
            {
              data: today,
              descricao: 'Processamento Automático de Relatório (IA)',
              tipo: 'manutencao',
              tecnico: 'IA System Bot',
              pecas: ['Recarga', 'Teste Hidrostático', 'Etiqueta Inteligente']
            }
          ]
        };

        onUpdate('extinguishers', mockFoundId, updatedItem);
        notify(`Relatório Processado! ${mockFoundId} atualizado automaticamente pela IA.`, "success");
      } else {
        notify("A IA não conseguiu identificar equipamentos compatíveis no relatório.", "error");
      }

      setIsProcessingAI(false);
      setIsSettingsOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 3000);
  };

  const handleFeedSearch = (term: string) => {
    const searchTerm = term ? String(term).trim().toLowerCase() : '';

    let found: any = extinguishers.find(e =>
      e.id.toLowerCase() === searchTerm ||
      (e.numeroCilindro && e.numeroCilindro.toLowerCase() === searchTerm)
    );
    let type = 'extinguishers';

    if (!found) {
      found = hydrants.find(h => h.id.toLowerCase() === searchTerm);
      type = 'hydrant';
    }

    if (found) {
      setFeedItem(found);
      setFeedType(type);
      setFeedSearch('');
      setIsFeedScanning(false);
      notify("Equipamento localizado!", "success");
    } else {
      setFeedItem(null);
      setFeedType(null);
      if (searchTerm) notify("Equipamento não encontrado. Verifique o ID ou Cilindro.", "error");
    }
  };

  const handleQuickUpdate = (action: string) => {
    if (!feedItem || !feedType) return;

    const today = new Date().toISOString().split('T')[0];
    const newItem = { ...feedItem };
    let logDesc = '';

    if (action === 'recarga') {
      newItem.ultimaManutencao = today;
      const nextDate = new Date();
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      newItem.proximaManutencao = nextDate.toISOString().split('T')[0];
      logDesc = 'Recarga Realizada (Alimentação Rápida)';
    } else if (action === 'hidro') {
      const isMangueira = feedType === 'hydrant';
      if (isMangueira) newItem.ultimoTesteHidro = today;
      else newItem.testeHidrostatico = today;

      const nextDate = new Date();
      nextDate.setFullYear(nextDate.getFullYear() + 5);

      if (isMangueira) newItem.proximoTesteHidro = nextDate.toISOString().split('T')[0];
      else newItem.testeHidrostatico = nextDate.toISOString().split('T')[0];

      logDesc = 'Teste Hidrostático Realizado';
    } else if (action === 'vistoria') {
      newItem.ultimaVistoria = today;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      newItem.proximaVistoria = nextDate.toISOString().split('T')[0];
      logDesc = 'Vistoria Mensal (Rápida)';
    }

    newItem.status = 'ok';
    if (!newItem.historico) newItem.historico = [];
    newItem.historico.push({
      data: today,
      descricao: logDesc,
      tipo: action === 'vistoria' ? 'vistoria' : 'manutencao',
      tecnico: 'Admin (Painel)',
      pecas: action === 'recarga' ? ['Selo Inmetro', 'Anel'] : [],
    });

    onUpdate(feedType, newItem.id, newItem);
    setFeedItem(newItem);
    notify(`Sucesso: ${logDesc}`, "success");
  };

  const generateNextId = () => {
    let prefix = '';
    let list: any[] = [];

    if (activeTab === 'extinguishers') { prefix = 'EXT-'; list = extinguishers; }
    else if (activeTab === 'alarm') { prefix = 'AL-'; list = alarms; }
    else if (activeTab === 'hydrant') { prefix = 'MANG-'; list = hydrants; }
    else if (activeTab === 'lighting') { prefix = 'LUZ-'; list = lighting; }

    const numbers = list.map(item => {
      const match = item.id.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });

    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = (max + 1).toString().padStart(3, '0');
    return `${prefix}${nextNum}`;
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    const nextId = generateNextId();

    if (activeTab === 'extinguishers') {
      setFormData({
        id: nextId, sede: 'Matriz', marca: '', tipo: 'Pó Químico ABC',
        capacidade: '4kg', localizacao: '', fabricacao: new Date().getFullYear().toString(),
        numeroCilindro: '',
        ultimaManutencao: new Date().toISOString().split('T')[0],
        testeHidrostatico: '',
        ultimaVistoria: '',
        status: 'ok', clientId: 'cli_001',
        fotoLocal: null
      });
    } else if (activeTab === 'alarm') {
      setFormData({
        id: nextId, sede: 'Matriz', local: '', tipo: 'Detector de Fumaça',
        marca: '', anoFabricacao: '', status: 'ativo',
        ultimoTeste: new Date().toISOString().split('T')[0], obs: '',
        fotoLocal: null
      });
    } else if (activeTab === 'hydrant') {
      setFormData({
        id: nextId, sede: 'Matriz', local: '', fabricante: '',
        anoFabricacao: new Date().getFullYear().toString(),
        polegada: '1.1/2', tipo: 'Tipo 1', comprimento: '15m',
        ultimoTesteHidro: '', proximoTesteHidro: '',
        ultimaVistoria: '', proximaVistoria: '', status: 'ok',
        fotoLocal: null
      });
    } else if (activeTab === 'lighting') {
      setFormData({
        id: nextId, sede: 'Matriz', local: '', tipo: 'Bloco Autônomo',
        anoFabricacao: '', autonomia: '2h', bateria: 'ok', status: 'ok',
        fotoLocal: null
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    let editData = { ...item };
    if (activeTab === 'extinguishers' && item.historico) {
      const lastVistoria = item.historico.find((log: any) => log.tipo === 'vistoria');
      if (lastVistoria) {
        editData.ultimaVistoria = new Date(lastVistoria.data).toISOString().split('T')[0];
      }
    }
    setFormData(editData);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.id || (!formData.local && !formData.localizacao)) {
      notify("Preencha os campos obrigatórios (ID e Local).", "error");
      return;
    }

    let itemToSave: any = {};

    // Define allowed fields per table type to avoid sending wrong columns
    const allowedFields: Record<string, string[]> = {
      extinguishers: [
        'id', 'sede', 'localizacao', 'tipo', 'capacidade', 'marca', 'fabricacao',
        'numeroCilindro', 'ultimaManutencao', 'proximaManutencao', 'testeHidrostatico',
        'ultimaVistoria', 'proximaVistoria', 'status', 'clientId', 'fotoLocal', 'historico'
      ],
      alarm: [
        'id', 'sede', 'local', 'tipo', 'marca', 'anoFabricacao', 'status',
        'ultimoTeste', 'ultimaVistoria', 'proximaVistoria', 'obs', 'fotoLocal', 'historico'
      ],
      hydrant: [
        'id', 'sede', 'local', 'fabricante', 'anoFabricacao', 'polegada', 'tipo',
        'comprimento', 'ultimoTesteHidro', 'proximoTesteHidro', 'ultimaVistoria',
        'proximaVistoria', 'status', 'fotoLocal', 'historico'
      ],
      lighting: [
        'id', 'sede', 'local', 'tipo', 'anoFabricacao', 'autonomia', 'bateria',
        'status', 'ultimaVistoria', 'proximaVistoria', 'teste', 'fotoLocal', 'historico'
      ]
    };

    // Only include allowed fields for the current table type
    const allowed = allowedFields[activeTab] || [];
    allowed.forEach(field => {
      if (formData[field] !== undefined) {
        itemToSave[field] = formData[field];
      }
    });

    // Convert empty strings to null for date fields to avoid PostgreSQL errors
    const dateFields = [
      'ultimaManutencao', 'proximaManutencao', 'testeHidrostatico', 
      'ultimaVistoria', 'proximaVistoria', 'ultimoTeste',
      'ultimoTesteHidro', 'proximoTesteHidro', 'teste'
    ];
    
    dateFields.forEach(field => {
      if (itemToSave[field] === '' || itemToSave[field] === undefined) {
        itemToSave[field] = null;
      }
    });

    if (activeTab === 'extinguishers') {
      if (formData.ultimaManutencao) {
        const dataManut = new Date(formData.ultimaManutencao);
        const dataVenc = new Date(dataManut);
        dataVenc.setFullYear(dataVenc.getFullYear() + 1);
        itemToSave.proximaManutencao = dataVenc.toISOString().split('T')[0];
      }

      if (!editingId && !itemToSave.historico) itemToSave.historico = [];
      if (formData.ultimaVistoria && !editingId) {
        itemToSave.historico.push({
          data: formData.ultimaVistoria,
          descricao: 'Vistoria Inicial (Sistema)',
          tipo: 'vistoria',
          tecnico: 'Admin',
          pecas: [],
          detalhes: { observacao: 'Registro importado na criação' }
        });
      }
      delete itemToSave.ultimaVistoria;
    }

    if (editingId) {
      onUpdate(activeTab, editingId, itemToSave);
      notify("Item atualizado com sucesso!", "success");
    } else {
      onAdd(activeTab, itemToSave);
      notify("Item adicionado com sucesso!", "success");
    }
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {isProcessingAI && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <Cpu className="w-16 h-16 animate-pulse text-blue-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">IA Analisando Documento...</h2>
          <p className="text-gray-400 text-sm">Identificando cilindros e validando datas de teste.</p>
          <div className="w-64 h-2 bg-gray-700 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse"></div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
            <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {editingId ? <Edit3 className="w-6 h-6" /> : <PackagePlus className="w-6 h-6" />}
                {editingId ? 'Editar' : 'Adicionar'} {activeTab === 'extinguishers' ? 'Extintor' : activeTab === 'alarm' ? 'Alarme' : activeTab === 'hydrant' ? 'Mangueira' : 'Iluminação'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID (Código)</label>
                  <input className="w-full border p-2 rounded" value={formData.id || ''} onChange={e => setFormData({ ...formData, id: e.target.value })} disabled={!!editingId} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sede</label>
                  <input className="w-full border p-2 rounded" value={formData.sede || ''} onChange={e => setFormData({ ...formData, sede: e.target.value })} />
                </div>
              </div>

              <div className="mt-2 border-t border-gray-100 pt-4 pb-2">
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2 text-purple-600" /> Foto do Local
                </h3>

                {formData.fotoLocal ? (
                  <div className="relative w-full h-40">
                    <img src={formData.fotoLocal} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    <button
                      onClick={(e) => { e.preventDefault(); setFormData({ ...formData, fotoLocal: null }); }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 z-20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="flex flex-col items-center justify-center border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-8 h-8 text-blue-500 mb-2" />
                      <span className="text-xs font-bold text-blue-600">Usar Câmera</span>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>

                    <div
                      className="flex flex-col items-center justify-center border-2 border-dashed border-purple-200 bg-purple-50 rounded-lg p-4 cursor-pointer hover:bg-purple-100 transition-colors"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      <ImageIcon className="w-8 h-8 text-purple-500 mb-2" />
                      <span className="text-xs font-bold text-purple-600">Abrir Galeria</span>
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                  </div>
                )}
              </div>

              {activeTab === 'extinguishers' && (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Local</label>
                      <input className="w-full border p-2 rounded" value={formData.localizacao || ''} onChange={e => setFormData({ ...formData, localizacao: e.target.value })} placeholder="Ex: Hall 1º Andar" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nº Cilindro</label>
                      <input className="w-full border p-2 rounded" value={formData.numeroCilindro || ''} onChange={e => setFormData({ ...formData, numeroCilindro: e.target.value })} placeholder="Ex: 12345-AB" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marca</label>
                      <input className="w-full border p-2 rounded" value={formData.marca || ''} onChange={e => setFormData({ ...formData, marca: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                      <select className="w-full border p-2 rounded" value={formData.tipo || ''} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                        <option>Pó Químico ABC</option><option>CO2</option><option>Água</option><option>AP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Capacidade</label>
                      <select className="w-full border p-2 rounded" value={formData.capacidade || ''} onChange={e => setFormData({ ...formData, capacidade: e.target.value })}>
                        <option>4kg</option><option>6kg</option><option>8kg</option><option>12kg</option><option>10L</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ano Fabricação</label>
                      <input type="number" className="w-full border p-2 rounded" value={formData.fabricacao || ''} onChange={e => setFormData({ ...formData, fabricacao: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                      <select className="w-full border p-2 rounded font-bold uppercase" value={formData.status || ''} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="ok">OK</option><option value="vencido">Vencido</option><option value="proximo">Próximo</option><option value="manutencao">Manutenção</option>
                      </select>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">Datas de Manutenção</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Última Recarga (N2)</label>
                        <input type="date" className="w-full border p-2 rounded" value={formData.ultimaManutencao || ''} onChange={e => setFormData({ ...formData, ultimaManutencao: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hidrostático (N3)</label>
                        <input type="date" className="w-full border p-2 rounded" value={formData.testeHidrostatico || ''} onChange={e => setFormData({ ...formData, testeHidrostatico: e.target.value })} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Última Vistoria (Opcional)</label>
                      <input type="date" className="w-full border p-2 rounded" value={formData.ultimaVistoria || ''} onChange={e => setFormData({ ...formData, ultimaVistoria: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'alarm' && (
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Local</label>
                    <input className="w-full border p-2 rounded" value={formData.local || ''} onChange={e => setFormData({ ...formData, local: e.target.value })} placeholder="Ex: Recepção Principal" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                      <select className="w-full border p-2 rounded" value={formData.tipo || ''} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                        <option>Detector de Fumaça</option><option>Acionador Manual</option><option>Sirene</option><option>Central</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                      <select className="w-full border p-2 rounded font-bold uppercase" value={formData.status || ''} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="ativo">Ativo</option><option value="falha">Falha</option><option value="inativo">Inativo</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marca (Opcional)</label>
                      <input className="w-full border p-2 rounded" value={formData.marca || ''} onChange={e => setFormData({ ...formData, marca: e.target.value })} placeholder="Ex: Intelbras" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ano Fabricação (Opcional)</label>
                      <input type="number" className="w-full border p-2 rounded" value={formData.anoFabricacao || ''} onChange={e => setFormData({ ...formData, anoFabricacao: e.target.value })} placeholder="Ex: 2023" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'hydrant' && (
                <div className="col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Local</label>
                    <input className="w-full border p-2 rounded" value={formData.local || ''} onChange={e => setFormData({ ...formData, local: e.target.value })} placeholder="Ex: Corredor Principal" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fabricante</label>
                      <input className="w-full border p-2 rounded" value={formData.fabricante || ''} onChange={e => setFormData({ ...formData, fabricante: e.target.value })} placeholder="Ex: Resil" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ano Fabricação</label>
                      <input type="number" className="w-full border p-2 rounded" value={formData.anoFabricacao || ''} onChange={e => setFormData({ ...formData, anoFabricacao: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Polegada</label>
                      <select className="w-full border p-2 rounded" value={formData.polegada || ''} onChange={e => setFormData({ ...formData, polegada: e.target.value })}>
                        <option value="1.1/2">1.1/2"</option><option value="2.1/2">2.1/2"</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                      <select className="w-full border p-2 rounded" value={formData.tipo || ''} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                        <option value="Tipo 1">Tipo 1</option><option value="Tipo 2">Tipo 2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tamanho</label>
                      <select className="w-full border p-2 rounded" value={formData.comprimento || ''} onChange={e => setFormData({ ...formData, comprimento: e.target.value })}>
                        <option value="15m">15m</option><option value="20m">20m</option><option value="30m">30m</option>
                      </select>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">Teste Hidrostático</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Último Teste</label>
                        <input type="date" className="w-full border p-2 rounded" value={formData.ultimoTesteHidro || ''} onChange={e => setFormData({ ...formData, ultimoTesteHidro: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Próximo Teste</label>
                        <input type="date" className="w-full border p-2 rounded" value={formData.proximoTesteHidro || ''} onChange={e => setFormData({ ...formData, proximoTesteHidro: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                    <select className="w-full border p-2 rounded font-bold uppercase" value={formData.status || ''} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="ok">OK</option><option value="vencido">Vencido</option><option value="proximo">Próximo</option><option value="irregular">Irregular</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'lighting' && (
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Local</label>
                    <input className="w-full border p-2 rounded" value={formData.local || ''} onChange={e => setFormData({ ...formData, local: e.target.value })} placeholder="Ex: Escada de Emergência" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                      <select className="w-full border p-2 rounded" value={formData.tipo || ''} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                        <option>Bloco Autônomo</option><option>30 LEDs</option><option>Balizamento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ano Fabricação (Opcional)</label>
                      <input type="number" className="w-full border p-2 rounded" value={formData.anoFabricacao || ''} onChange={e => setFormData({ ...formData, anoFabricacao: e.target.value })} placeholder="Ex: 2023" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bateria</label>
                      <select className="w-full border p-2 rounded" value={formData.bateria || ''} onChange={e => setFormData({ ...formData, bateria: e.target.value })}>
                        <option value="ok">OK</option><option value="falha">Falha</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={handleSave} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-green-700 mt-4 flex justify-center items-center gap-2">
                <Save className="w-5 h-5" /> {editingId ? 'Salvar Alterações' : 'Adicionar ao Sistema'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isFeedScanning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden relative">
            <button onClick={() => setIsFeedScanning(false)} className="absolute top-2 right-2 z-10 bg-white/50 rounded-full p-1">
              <X />
            </button>
            <div className="p-4 bg-slate-900 text-white text-center">
              <h3 className="font-bold">Escanear para Alimentar</h3>
            </div>
            <div className="bg-gray-900 rounded-lg border-2 border-red-500 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
              <RealQRScanner onScanSuccess={handleFeedSearch} />
            </div>
          </div>
        </div>
      )}

      <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-lg relative">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-red-500" />
          <div>
            <h1 className="font-bold text-lg leading-tight">Painel Administrativo</h1>
            <p className="text-xs text-slate-400">Gerenciamento Geral</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              title="Ferramentas e Relatórios"
            >
              <Settings className="w-5 h-5" />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-slide-up text-gray-800">
                <div className="p-3 bg-gray-50 border-b border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase">Exportação e Dados</h4>
                </div>
                <div className="p-2 space-y-1">
                  <button onClick={handleExportAll} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded-lg flex items-center gap-2 text-gray-700">
                    <FileDown className="w-4 h-4 text-blue-500" /> Exportar Todos Equipamentos
                  </button>
                  <button onClick={handleExportDetailed} className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 rounded-lg flex items-center gap-2 text-gray-700">
                    <FileSpreadsheet className="w-4 h-4 text-green-500" /> Exportar Relatório Gerencial
                  </button>
                </div>
                <div className="p-3 bg-gray-50 border-t border-b border-gray-100 mt-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase">Importação Inteligente</h4>
                </div>
                <div className="p-2">
                  <label className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 rounded-lg flex items-center gap-2 text-gray-700 cursor-pointer">
                    <FileUp className="w-4 h-4 text-purple-500" />
                    <span>Importar Relatório Recarga (IA)</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.csv,.xlsx"
                      onChange={handleImportReport}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-white/20 mx-1"></div>
          <button onClick={onLogout} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto">
        {activeTab !== 'feeding' && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-xs font-bold text-gray-400 uppercase mr-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filtrar Sede:
            </span>
            {uniqueSedes.map(sede => (
              <button
                key={sede}
                onClick={() => setSelectedSede(sede)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${selectedSede === sede ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
              >
                {sede}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { id: 'extinguishers', icon: Flame, label: 'Extintores' },
            { id: 'alarm', icon: Bell, label: 'Alarme' },
            { id: 'hydrant', icon: Droplets, label: 'Mangueiras' },
            { id: 'lighting', icon: Lightbulb, label: 'Iluminação' },
            { id: 'feeding', icon: Zap, label: 'Alimentação', highlight: true }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFeedItem(null); }}
              className={`flex items-center justify-center p-3 rounded-lg border font-bold transition-all ${activeTab === tab.id ? ((tab as any).highlight ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-800 text-white border-slate-800') : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
              <tab.icon className="w-5 h-5 mr-2" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'feeding' ? (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-md border-t-4 border-orange-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-orange-500" /> Alimentação de Equipamento
              </h2>

              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                  <SearchCode className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-lg"
                    placeholder="Digite o Nº do Cilindro ou ID..."
                    value={feedSearch}
                    onChange={e => setFeedSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFeedSearch(feedSearch)}
                  />
                </div>
                <button onClick={() => handleFeedSearch(feedSearch)} className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-700">
                  Buscar
                </button>
                <button onClick={() => setIsFeedScanning(true)} className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 flex items-center justify-center">
                  <QrCode className="w-5 h-5 mr-2" /> Escanear QR
                </button>
              </div>

              {feedItem && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 animate-slide-up">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase mb-2 inline-block">
                        {feedType === 'hydrant' ? 'Mangueira' : 'Extintor'}
                      </span>
                      <h3 className="text-3xl font-black text-gray-800">{feedItem.id}</h3>
                      <p className="text-gray-500 text-lg">{feedItem.local || feedItem.localizacao}</p>
                      {feedItem.numeroCilindro && <p className="text-sm font-mono text-gray-400 mt-1">Cilindro: {feedItem.numeroCilindro}</p>}
                    </div>
                    <StatusBadge status={feedItem.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded border">
                      <p className="text-xs font-bold text-gray-400 uppercase">Última Recarga/Nível 2</p>
                      <p className="text-lg font-bold">{feedItem.ultimaManutencao ? new Date(feedItem.ultimaManutencao).toLocaleDateString('pt-BR') : '---'}</p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <p className="text-xs font-bold text-gray-400 uppercase">Último Hidrostático/Nível 3</p>
                      <p className="text-lg font-bold">
                        {feedItem.testeHidrostatico ? new Date(feedItem.testeHidrostatico).toLocaleDateString('pt-BR') :
                          (feedItem.ultimoTesteHidro ? new Date(feedItem.ultimoTesteHidro).toLocaleDateString('pt-BR') : '---')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleQuickUpdate('recarga')}
                      className="flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm md:text-base shadow-md hover:shadow-lg transition-all"
                    >
                      <RefreshCcw className="w-6 h-6" /> Atualizar Recarga (N2)
                    </button>
                    <button
                      onClick={() => handleQuickUpdate('hidro')}
                      className="flex flex-col items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold text-sm md:text-base shadow-md hover:shadow-lg transition-all"
                    >
                      <Droplets className="w-6 h-6" /> Atualizar Hidrostático (N3)
                    </button>
                    <button
                      onClick={() => handleQuickUpdate('vistoria')}
                      className="flex flex-col items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-sm md:text-base shadow-md hover:shadow-lg transition-all"
                    >
                      <ClipboardCheck className="w-6 h-6" /> Vistoria Mensal (N1)
                    </button>
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-4">As atualizações geram logs automáticos e redefinem o status para OK.</p>
                </div>
              )}

              {!feedItem && !feedSearch && (
                <div className="text-center py-10 text-gray-400">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Utilize a busca ou scanner para localizar o equipamento e realizar a alimentação.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Gestão de {activeTab} {selectedSede !== 'Todas' && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-gray-500 ml-2">({selectedSede})</span>}
              </h3>
              <button onClick={handleOpenAdd} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Adicionar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Local</th>
                    <th className="px-4 py-3">Tipo/Info</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-gray-700">{item.id}</td>
                      <td className="px-4 py-3">{(item as any).local || (item as any).localizacao}</td>
                      <td className="px-4 py-3 text-gray-600">{(item as any).polegada ? `${(item as any).polegada}" - ${(item as any).comprimento}` : (item as any).tipo}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" title="Editar">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { if (window.confirm(`Excluir ${item.id}?`)) onDelete(activeTab, item.id); }} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
