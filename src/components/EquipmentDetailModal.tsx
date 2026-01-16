import { X, FileText, Wrench, ClipboardCheck, Image as ImageIcon } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface EquipmentDetailModalProps {
  item: any;
  onClose: () => void;
  typeLabel?: string;
}

export const EquipmentDetailModal = ({ item, onClose, typeLabel = "Equipamento" }: EquipmentDetailModalProps) => {
  if (!item) return null;

  const getModalDetails = (i: any) => {
    const dates = {
      manutencaoNivel2: 'N/A',
      manutencaoNivel3: 'N/A',
      ultimaVistoria: 'Nunca realizada',
      proximaVistoria: 'Pendente'
    };

    if (i.ultimaManutencao) dates.manutencaoNivel2 = new Date(i.ultimaManutencao).toLocaleDateString('pt-BR');
    if (i.testeHidrostatico) dates.manutencaoNivel3 = new Date(i.testeHidrostatico).toLocaleDateString('pt-BR');
    if (i.ultimoTesteHidro) dates.manutencaoNivel3 = new Date(i.ultimoTesteHidro).toLocaleDateString('pt-BR');
    if (i.ultimaVistoria) dates.ultimaVistoria = new Date(i.ultimaVistoria).toLocaleDateString('pt-BR');
    if (i.proximaVistoria) dates.proximaVistoria = new Date(i.proximaVistoria).toLocaleDateString('pt-BR');

    if (i.historico && i.historico.length > 0) {
      const logs = i.historico.filter((log: any) => log.tipo === 'vistoria');
      if (logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        const d = new Date(lastLog.data);
        dates.ultimaVistoria = d.toLocaleDateString('pt-BR');
        const next = new Date(d);
        next.setDate(d.getDate() + 30);
        dates.proximaVistoria = next.toLocaleDateString('pt-BR');
      }
    }
    return dates;
  };

  const details = getModalDetails(item);
  const isMangueira = item.id?.startsWith('MANG') || item.polegada;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-900 text-white p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10">
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold">{typeLabel}</h2>
          </div>
          <p className="text-white/60 font-mono text-sm">{item.id} - {item.localizacao || item.local}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {item.numeroCilindro && (
              <div className="inline-block bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                <p className="text-orange-400 font-mono text-sm font-bold flex items-center gap-2">
                  <span className="text-xs text-white/50 uppercase font-normal">Cilindro:</span> {item.numeroCilindro}
                </p>
              </div>
            )}
            {item.codigoBarras && (
              <div className="inline-block bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                <p className="text-blue-400 font-mono text-sm font-bold flex items-center gap-2">
                  <span className="text-xs text-white/50 uppercase font-normal">Cód. Barras:</span> {item.codigoBarras}
                </p>
              </div>
            )}
          </div>
        </div>

        {item.fotoLocal && (
          <div className="w-full h-48 sm:h-64 bg-gray-100 relative">
            <img src={item.fotoLocal} alt="Local do Equipamento" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white text-xs font-bold flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Foto do Local
              </p>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-xs text-gray-400 font-bold block">Marca/Fab</span>
              {item.marca || item.fabricante || 'N/A'}
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-xs text-gray-400 font-bold block">Ano</span>
              {item.anoFabricacao || item.fabricacao || 'N/A'}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
              <Wrench className="w-4 h-4 mr-2 text-blue-600" />
              {isMangueira ? 'Testes Técnicos' : 'Manutenções'}
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              {isMangueira ? (
                <>
                  <div>
                    <p className="text-gray-500">Último Hidrostático</p>
                    <p className="font-medium text-gray-900">{details.manutencaoNivel3}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Próximo Hidrostático</p>
                    <p className="font-medium text-gray-900">{item.proximoTesteHidro ? new Date(item.proximoTesteHidro).toLocaleDateString('pt-BR') : '---'}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-gray-500">Nível 2 (Recarga)</p>
                    <p className="font-medium text-gray-900">{details.manutencaoNivel2}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Nível 3 (Hidrostático)</p>
                    <p className="font-medium text-gray-900">{details.manutencaoNivel3}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
              <ClipboardCheck className="w-4 h-4 mr-2 text-green-600" /> Vistorias
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <p className="text-gray-500">Última Vistoria</p>
                <p className="font-medium text-gray-900">{details.ultimaVistoria}</p>
              </div>
              <div>
                <p className="text-gray-500">Próxima Vistoria</p>
                <p className="font-medium text-gray-900">{details.proximaVistoria}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl mt-4">
            <span className="text-sm font-medium text-gray-500">Status Atual:</span>
            <StatusBadge status={item.status} />
          </div>
        </div>
      </div>
    </div>
  );
};
