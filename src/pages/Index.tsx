import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Toast } from '@/components/Toast';
import { LoginScreen } from '@/components/LoginScreen';
import { AdminDashboard } from '@/components/AdminDashboard';
import { InspectionMode } from '@/components/InspectionMode';
import { ClientDashboard } from '@/components/ClientDashboard';
import { QRCodeReader } from '@/components/QRCodeReader';
import { MaristaDashboard } from '@/components/MaristaDashboard';
import { RelocateMode } from '@/components/RelocateMode';
import { User, Extinguisher, Alarm, Hydrant, Lighting, HistoryLog } from '@/types';

type ViewType = 'login' | 'admin-dashboard' | 'inspection-mode' | 'client-dashboard' | 'public-scan' | 'marista-dashboard' | 'relocate-mode';

const Index = () => {
  const [view, setView] = useState<ViewType>('login');
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [hydrants, setHydrants] = useState<Hydrant[]>([]);
  const [lighting, setLighting] = useState<Lighting[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'info' | 'warning' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [extRes, alarmsRes, hydRes, lightRes] = await Promise.all([
        supabase.from('extinguishers').select('*'),
        supabase.from('alarms').select('*'),
        supabase.from('hydrants').select('*'),
        supabase.from('lighting').select('*')
      ]);

      if (extRes.data) setExtinguishers(extRes.data as unknown as Extinguisher[]);
      if (alarmsRes.data) setAlarms(alarmsRes.data as unknown as Alarm[]);
      if (hydRes.data) setHydrants(hydRes.data as unknown as Hydrant[]);
      if (lightRes.data) setLighting(lightRes.data as unknown as Lighting[]);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (message: string, type: 'error' | 'success' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type });
  };

  const getTableName = (type: string): 'extinguishers' | 'alarms' | 'hydrants' | 'lighting' => {
    switch (type) {
      case 'extinguishers': return 'extinguishers';
      case 'alarm': return 'alarms';
      case 'hydrant': return 'hydrants';
      case 'lighting': return 'lighting';
      default: return 'extinguishers';
    }
  };

  const cleanItemForTable = (tableName: string, item: any) => {
    const cleanItem = { ...item };
    
    // Remove fields that don't belong to certain tables
    if (tableName === 'extinguishers') {
      delete cleanItem.local;
      delete cleanItem.ultimoTesteHidro;
      delete cleanItem.proximoTesteHidro;
      delete cleanItem.fabricante;
      delete cleanItem.comprimento;
      delete cleanItem.polegada;
      delete cleanItem.autonomia;
      delete cleanItem.bateria;
      delete cleanItem.teste;
      delete cleanItem.ultimoTeste;
      delete cleanItem.obs;
      delete cleanItem.anoFabricacao;
    } else if (tableName === 'alarms') {
      delete cleanItem.localizacao;
      delete cleanItem.ultimoTesteHidro;
      delete cleanItem.proximoTesteHidro;
      delete cleanItem.fabricante;
      delete cleanItem.comprimento;
      delete cleanItem.polegada;
      delete cleanItem.autonomia;
      delete cleanItem.bateria;
      delete cleanItem.capacidade;
      delete cleanItem.numeroCilindro;
      delete cleanItem.testeHidrostatico;
      delete cleanItem.ultimaManutencao;
      delete cleanItem.proximaManutencao;
      delete cleanItem.fabricacao;
      delete cleanItem.clientId;
      delete cleanItem.teste;
    } else if (tableName === 'hydrants') {
      delete cleanItem.localizacao;
      delete cleanItem.autonomia;
      delete cleanItem.bateria;
      delete cleanItem.capacidade;
      delete cleanItem.numeroCilindro;
      delete cleanItem.testeHidrostatico;
      delete cleanItem.ultimaManutencao;
      delete cleanItem.proximaManutencao;
      delete cleanItem.fabricacao;
      delete cleanItem.clientId;
      delete cleanItem.ultimoTeste;
      delete cleanItem.obs;
      delete cleanItem.marca;
      delete cleanItem.teste;
    } else if (tableName === 'lighting') {
      delete cleanItem.localizacao;
      delete cleanItem.ultimoTesteHidro;
      delete cleanItem.proximoTesteHidro;
      delete cleanItem.fabricante;
      delete cleanItem.comprimento;
      delete cleanItem.polegada;
      delete cleanItem.capacidade;
      delete cleanItem.numeroCilindro;
      delete cleanItem.testeHidrostatico;
      delete cleanItem.ultimaManutencao;
      delete cleanItem.proximaManutencao;
      delete cleanItem.fabricacao;
      delete cleanItem.clientId;
      delete cleanItem.ultimoTeste;
      delete cleanItem.obs;
      delete cleanItem.marca;
    }
    
    return cleanItem;
  };

  const handleAdd = async (type: string, item: any) => {
    const tableName = getTableName(type);
    const cleanItem = cleanItemForTable(tableName, item);
    
    const { error } = await supabase.from(tableName).insert([cleanItem] as any);

    if (error) {
      notify("Erro ao salvar: " + error.message, "error");
    } else {
      notify("Salvo com sucesso!", "success");
      fetchData();
    }
  };

  const handleDelete = async (type: string, id: string) => {
    const tableName = getTableName(type);
    const { error } = await supabase.from(tableName).delete().eq('id', id);

    if (error) {
      notify("Erro ao remover", "error");
    } else {
      notify("Item removido.", "success");
      fetchData();
    }
  };

  const handleUpdate = async (type: string, id: string, newItem: any) => {
    const tableName = getTableName(type);
    const cleanItem = cleanItemForTable(tableName, newItem);
    const { error } = await supabase.from(tableName).update(cleanItem as any).eq('id', id);

    if (error) {
      notify("Erro ao atualizar", "error");
    } else {
      notify("Atualizado com sucesso", "success");
      fetchData();
    }
  };

  const handleAddInspection = async (type: string, id: string, logEntry: HistoryLog, newStatus: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);

    let tableName: 'extinguishers' | 'alarms' | 'hydrants' | 'lighting' = 'extinguishers';
    if (type === 'extinguisher') tableName = 'extinguishers';
    else if (type === 'alarm') tableName = 'alarms';
    else if (type === 'hydrant') tableName = 'hydrants';
    else if (type === 'lighting') tableName = 'lighting';

    const { data: currentData } = await supabase.from(tableName).select('historico').eq('id', id).single();
    const currentHistory = (currentData?.historico as unknown as HistoryLog[]) || [];
    const updatedHistory = [...currentHistory, logEntry];

    const updateData = {
      status: newStatus,
      ultimaVistoria: today,
      proximaVistoria: nextDate.toISOString().split('T')[0],
      historico: updatedHistory as any
    };

    const { error } = await supabase.from(tableName).update(updateData as any).eq('id', id);

    if (error) {
      notify("Erro ao salvar vistoria", "error");
    } else {
      notify("Vistoria sincronizada com sucesso!", "success");
      fetchData();
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') setView('admin-dashboard');
    else if (user.role === 'tech') setView('inspection-mode');
    else if (user.role === 'marista') setView('marista-dashboard');
    else if (user.role === 'relocate') setView('relocate-mode');
    else setView('client-dashboard');
  };

  const handleRelocate = async (extinguisherId: string, newLocation: string) => {
    const today = new Date().toISOString().split('T')[0];
    const ext = extinguishers.find(e => e.id === extinguisherId);
    if (!ext) throw new Error('Extintor não encontrado');

    const currentHistory = ext.historico || [];
    const logEntry: HistoryLog = {
      data: today,
      descricao: `Realocado de "${ext.localizacao || 'Não definido'}" para "${newLocation}"`,
      tipo: 'Realocação',
      tecnico: currentUser?.name || 'Operador'
    };

    const { error } = await supabase.from('extinguishers').update({
      localizacao: newLocation,
      historico: [...currentHistory, logEntry] as any
    }).eq('id', extinguisherId);

    if (error) throw error;
    await fetchData();
  };

  if (isLoading && view !== 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p>Conectando ao banco de dados...</p>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-900 relative">
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {view === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onScanMode={() => setView('public-scan')}
          notify={notify}
        />
      )}

      {view === 'admin-dashboard' && currentUser?.role === 'admin' && (
        <AdminDashboard
          extinguishers={extinguishers}
          alarms={alarms}
          hydrants={hydrants}
          lighting={lighting}
          onUpdate={handleUpdate}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onLogout={() => { setCurrentUser(null); setView('login'); }}
          notify={notify}
        />
      )}

      {view === 'inspection-mode' && currentUser?.role === 'tech' && (
        <InspectionMode
          extinguishers={extinguishers}
          alarms={alarms}
          hydrants={hydrants}
          lighting={lighting}
          onAddInspection={handleAddInspection}
          onLogout={() => { setCurrentUser(null); setView('login'); }}
          notify={notify}
        />
      )}

      {view === 'client-dashboard' && currentUser?.role === 'client' && (
        <ClientDashboard
          user={currentUser}
          extinguishers={extinguishers.filter(e => e.clientId === currentUser.id)}
          alarms={alarms}
          hydrants={hydrants}
          lighting={lighting}
          onLogout={() => { setCurrentUser(null); setView('login'); }}
          notify={notify}
        />
      )}

      {view === 'marista-dashboard' && currentUser?.role === 'marista' && (
        <MaristaDashboard
          user={currentUser}
          extinguishers={extinguishers}
          hydrants={hydrants}
          onLogout={() => { setCurrentUser(null); setView('login'); }}
          notify={notify}
        />
      )}

      {view === 'relocate-mode' && currentUser?.role === 'relocate' && (
        <RelocateMode
          extinguishers={extinguishers}
          onRelocate={handleRelocate}
          onLogout={() => { setCurrentUser(null); setView('login'); }}
          notify={notify}
        />
      )}

      {view === 'public-scan' && (
        <QRCodeReader
          onBack={() => setView('login')}
          data={{ extinguishers, alarms, hydrants, lighting }}
          notify={notify}
        />
      )}
    </div>
  );
};

export default Index;
