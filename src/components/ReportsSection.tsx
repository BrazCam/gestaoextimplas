import { useState, useMemo } from 'react';
import { 
  AlertTriangle, ClipboardList, FileText, Printer, Camera, 
  ChevronDown, ChevronUp, Calendar, User, MapPin, Image as ImageIcon,
  Download, Filter, X
} from 'lucide-react';
import { Extinguisher, Hydrant, Alarm, Lighting, HistoryLog } from '@/types';

interface ReportsSectionProps {
  extinguishers: Extinguisher[];
  hydrants: Hydrant[];
  alarms: Alarm[];
  lighting: Lighting[];
  notify?: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

interface NonConformityItem {
  id: string;
  tipo: string;
  local: string;
  sede: string;
  status: string;
  issue: string;
  dueDate?: string;
  fotoLocal?: string;
  equipmentType: string;
}

interface ForcedRelocation {
  extinguisherId: string;
  tipo: string;
  data: string;
  tecnico: string;
  exigenciaLocal: string;
  observacao: string;
  localNome: string;
}

export const ReportsSection = ({ 
  extinguishers, 
  hydrants, 
  alarms, 
  lighting,
  notify 
}: ReportsSectionProps) => {
  const [activeReport, setActiveReport] = useState<'nonconformity' | 'forced' | 'photos'>('nonconformity');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [photoModal, setPhotoModal] = useState<string | null>(null);
  const [filterSede, setFilterSede] = useState('Todas');

  // Get unique sedes
  const uniqueSedes = useMemo(() => {
    const allItems = [...extinguishers, ...hydrants, ...alarms, ...lighting];
    const sedes = new Set(allItems.map(i => i.sede).filter(Boolean));
    return ['Todas', ...Array.from(sedes).sort()];
  }, [extinguishers, hydrants, alarms, lighting]);

  // Calculate non-conformity items
  const nonConformityItems = useMemo(() => {
    const items: NonConformityItem[] = [];
    const today = new Date();

    const checkItem = (item: any, type: string, dateField: string, label: string) => {
      if (filterSede !== 'Todas' && item.sede !== filterSede) return;
      
      const status = item.status?.toLowerCase();
      const isExpired = status === 'vencido' || status === 'irregular' || status === 'falha' || status === 'inativo';
      const isWarning = status === 'proximo' || status === 'atencao';
      
      // Check date-based expiry
      const dateValue = item[dateField];
      let dateExpired = false;
      let dateWarning = false;
      
      if (dateValue) {
        const dueDate = new Date(dateValue);
        const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        dateExpired = daysUntil < 0;
        dateWarning = daysUntil >= 0 && daysUntil <= 30;
      }

      if (isExpired || dateExpired) {
        items.push({
          id: item.id,
          tipo: item.tipo || type,
          local: item.localizacao || item.local || 'N/A',
          sede: item.sede || 'Matriz',
          status: item.status,
          issue: `${label} vencido`,
          dueDate: dateValue,
          fotoLocal: item.fotoLocal,
          equipmentType: type
        });
      } else if (isWarning || dateWarning) {
        items.push({
          id: item.id,
          tipo: item.tipo || type,
          local: item.localizacao || item.local || 'N/A',
          sede: item.sede || 'Matriz',
          status: item.status,
          issue: `${label} próximo do vencimento`,
          dueDate: dateValue,
          fotoLocal: item.fotoLocal,
          equipmentType: type
        });
      }
    };

    extinguishers.forEach(ext => {
      checkItem(ext, 'Extintor', 'proximaManutencao', 'Manutenção');
      if (ext.testeHidrostatico) {
        const hidroDate = new Date(ext.testeHidrostatico);
        const nextHidro = new Date(hidroDate);
        nextHidro.setFullYear(nextHidro.getFullYear() + 5);
        if (nextHidro < today) {
          if (filterSede === 'Todas' || ext.sede === filterSede) {
            items.push({
              id: ext.id,
              tipo: ext.tipo || 'Extintor',
              local: ext.localizacao || 'N/A',
              sede: ext.sede || 'Matriz',
              status: ext.status,
              issue: 'Teste hidrostático vencido',
              dueDate: nextHidro.toISOString(),
              fotoLocal: ext.fotoLocal,
              equipmentType: 'Extintor'
            });
          }
        }
      }
    });

    hydrants.forEach(hyd => checkItem(hyd, 'Mangueira', 'proximoTesteHidro', 'Teste Hidrostático'));
    alarms.forEach(alm => checkItem(alm, 'Alarme', 'proximaVistoria', 'Vistoria'));
    lighting.forEach(lit => checkItem(lit, 'Iluminação', 'proximaVistoria', 'Vistoria'));

    return items.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [extinguishers, hydrants, alarms, lighting, filterSede]);

  // Collect forced relocations
  const forcedRelocations = useMemo(() => {
    const relocations: ForcedRelocation[] = [];
    
    extinguishers.forEach(ext => {
      if (filterSede !== 'Todas' && ext.sede !== filterSede) return;
      
      if (ext.historico) {
        ext.historico.forEach((log: any) => {
          if (log.details?.ignorouExigencia) {
            relocations.push({
              extinguisherId: ext.id,
              tipo: ext.tipo || 'N/A',
              data: log.data,
              tecnico: log.tecnico,
              exigenciaLocal: log.details.exigenciaLocal || 'N/A',
              observacao: log.details.observacao || 'Sem observação',
              localNome: ext.localizacao || 'N/A'
            });
          }
        });
      }
    });

    return relocations.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [extinguishers, filterSede]);

  // Items with photos for photo report
  const itemsWithPhotos = useMemo(() => {
    const items: Array<{ id: string; tipo: string; local: string; sede: string; fotoLocal: string; status: string }> = [];
    
    const addIfHasPhoto = (item: any, tipo: string) => {
      if (filterSede !== 'Todas' && item.sede !== filterSede) return;
      
      if (item.fotoLocal) {
        items.push({
          id: item.id,
          tipo: item.tipo || tipo,
          local: item.localizacao || item.local || 'N/A',
          sede: item.sede || 'Matriz',
          fotoLocal: item.fotoLocal,
          status: item.status
        });
      }
    };

    extinguishers.forEach(ext => addIfHasPhoto(ext, 'Extintor'));
    hydrants.forEach(hyd => addIfHasPhoto(hyd, 'Mangueira'));
    alarms.forEach(alm => addIfHasPhoto(alm, 'Alarme'));
    lighting.forEach(lit => addIfHasPhoto(lit, 'Iluminação'));

    return items;
  }, [extinguishers, hydrants, alarms, lighting, filterSede]);

  const handlePrint = (reportType: string) => {
    const printContent = document.getElementById(`print-${reportType}`);
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notify?.('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.', 'error');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório - ${reportType === 'nonconformity' ? 'Não Conformidades' : reportType === 'forced' ? 'Trocas Forçadas' : 'Fotos'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e293b; border-bottom: 2px solid #e11d48; padding-bottom: 10px; }
            .item { border: 1px solid #e2e8f0; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .item-header { font-weight: bold; color: #1e293b; }
            .item-detail { color: #64748b; font-size: 14px; margin-top: 5px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .badge-warning { background: #fef3c7; color: #92400e; }
            .badge-error { background: #fee2e2; color: #991b1b; }
            .photo { max-width: 200px; max-height: 150px; margin-top: 10px; border-radius: 8px; }
            .timestamp { color: #94a3b8; font-size: 12px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>Relatório de ${reportType === 'nonconformity' ? 'Não Conformidades' : reportType === 'forced' ? 'Trocas Forçadas' : 'Equipamentos com Fotos'}</h1>
          <p class="timestamp">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
    notify?.('Relatório enviado para impressão!', 'success');
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'vencido' || s === 'irregular' || s === 'falha' || s === 'inativo') return 'bg-red-100 text-red-800';
    if (s === 'proximo' || s === 'atencao') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Photo Modal */}
      {photoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPhotoModal(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button 
              onClick={() => setPhotoModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img src={photoModal} alt="Foto do equipamento" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-md border-t-4 border-yellow-500">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <ClipboardList className="w-6 h-6 mr-2 text-yellow-500" /> Relatórios de Ocorrências
          </h2>
          
          {/* Sede Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterSede}
              onChange={(e) => setFilterSede(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            >
              {uniqueSedes.map(sede => (
                <option key={sede} value={sede}>{sede}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveReport('nonconformity')}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
              activeReport === 'nonconformity' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Não Conformidades
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeReport === 'nonconformity' ? 'bg-white/20' : 'bg-red-100 text-red-700'}`}>
              {nonConformityItems.length}
            </span>
          </button>
          <button
            onClick={() => setActiveReport('forced')}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
              activeReport === 'forced' 
                ? 'bg-orange-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Trocas Forçadas
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeReport === 'forced' ? 'bg-white/20' : 'bg-orange-100 text-orange-700'}`}>
              {forcedRelocations.length}
            </span>
          </button>
          <button
            onClick={() => setActiveReport('photos')}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
              activeReport === 'photos' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" /> Relatório com Fotos
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeReport === 'photos' ? 'bg-white/20' : 'bg-purple-100 text-purple-700'}`}>
              {itemsWithPhotos.length}
            </span>
          </button>
        </div>

        {/* Print Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => handlePrint(activeReport)}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir Relatório
          </button>
        </div>

        {/* Non-Conformity Report */}
        {activeReport === 'nonconformity' && (
          <div id="print-nonconformity">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Equipamentos com Não Conformidade
            </h3>
            
            {nonConformityItems.length === 0 ? (
              <div className="bg-green-50 rounded-xl p-8 text-center text-green-700 border border-green-200">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-bold">Nenhuma não conformidade encontrada!</p>
                <p className="text-sm mt-1">Todos os equipamentos estão em dia.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nonConformityItems.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="item bg-red-50 border border-red-200 rounded-lg p-4">
                    <div 
                      className="flex justify-between items-start cursor-pointer"
                      onClick={() => setExpandedItem(expandedItem === `nc-${idx}` ? null : `nc-${idx}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`badge px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(item.status)}`}>
                            {item.status?.toUpperCase()}
                          </span>
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">
                            {item.equipmentType}
                          </span>
                        </div>
                        <p className="item-header font-bold text-gray-800">
                          ID: <span className="font-mono">{item.id}</span>
                        </p>
                        <p className="item-detail text-sm text-gray-600">
                          <strong>Problema:</strong> {item.issue}
                        </p>
                        <p className="item-detail text-sm text-gray-500">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {item.local} - {item.sede}
                        </p>
                        {item.dueDate && (
                          <p className="item-detail text-sm text-red-600">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Vencimento: {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.fotoLocal && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPhotoModal(item.fotoLocal!); }}
                            className="text-purple-600 hover:text-purple-800 p-1"
                          >
                            <ImageIcon className="w-5 h-5" />
                          </button>
                        )}
                        {expandedItem === `nc-${idx}` ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                    
                    {expandedItem === `nc-${idx}` && item.fotoLocal && (
                      <div className="mt-4 pt-4 border-t border-red-200">
                        <img 
                          src={item.fotoLocal} 
                          alt="Foto do local" 
                          className="photo w-full max-w-md rounded-lg shadow-md cursor-pointer hover:opacity-90"
                          onClick={() => setPhotoModal(item.fotoLocal!)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Forced Relocations Report */}
        {activeReport === 'forced' && (
          <div id="print-forced">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Trocas com Exigência Ignorada
            </h3>
            
            {forcedRelocations.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma troca forçada registrada.</p>
                <p className="text-sm mt-1">Trocas forçadas ocorrem quando um equipamento é vinculado a um local com exigência diferente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {forcedRelocations.map((item, idx) => (
                  <div key={idx} className="item bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge bg-orange-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                            TROCA FORÇADA
                          </span>
                          <span className="text-sm text-gray-500">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(item.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="item-header font-bold text-gray-800">
                          Extintor: <span className="font-mono">{item.extinguisherId}</span>
                        </p>
                        <p className="item-detail text-sm text-gray-600">
                          Tipo: <strong>{item.tipo}</strong> → Local exige: <strong className="text-orange-700">{item.exigenciaLocal}</strong>
                        </p>
                        <p className="item-detail text-sm text-gray-500">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          Local atual: {item.localNome}
                        </p>
                        <p className="item-detail text-sm text-gray-500">
                          <User className="w-3 h-3 inline mr-1" />
                          Técnico: {item.tecnico}
                        </p>
                        {item.observacao && item.observacao !== 'Sem observação' && (
                          <div className="mt-2 bg-white rounded p-2 border border-orange-100">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Observação do Técnico:</p>
                            <p className="text-sm text-gray-700">{item.observacao}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Photo Report */}
        {activeReport === 'photos' && (
          <div id="print-photos">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-500" />
              Equipamentos com Registro Fotográfico
            </h3>
            
            {itemsWithPhotos.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
                <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum equipamento com foto registrada.</p>
                <p className="text-sm mt-1">Adicione fotos aos equipamentos para vê-los aqui.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itemsWithPhotos.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="item bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div 
                      className="h-48 bg-gray-100 cursor-pointer relative group"
                      onClick={() => setPhotoModal(item.fotoLocal)}
                    >
                      <img 
                        src={item.fotoLocal} 
                        alt={`Foto de ${item.id}`} 
                        className="photo w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800 font-mono text-sm">{item.id}</span>
                        <span className={`badge px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(item.status)}`}>
                          {item.status?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{item.tipo}</p>
                      <p className="text-xs text-gray-400">{item.local} - {item.sede}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};