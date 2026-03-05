import { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { Toast } from '@/components/Toast';
import { LoginForm, ChangePasswordForm } from '@/components/auth';
import { AdminDashboard } from '@/components/AdminDashboard';
import { InspectionMode } from '@/components/InspectionMode';
import { ClientDashboard } from '@/components/ClientDashboard';
import { QRCodeReader } from '@/components/QRCodeReader';
import { MaristaDashboard } from '@/components/MaristaDashboard';
import { RelocateMode } from '@/components/RelocateMode';
import { CorporateDashboard } from '@/components/CorporateDashboard';
import { MasterDashboard } from '@/components/MasterDashboard';
import { SafetyBot } from '@/components/SafetyBot';
import { Extinguisher, Alarm, Hydrant, Lighting, HistoryLog, Location, User } from '@/types';

interface FloorPlan {
  id: string;
  name: string;
  sede: string;
  image: string;
}

type ViewType = 'login' | 'change-password' | 'admin-dashboard' | 'inspection-mode' | 'client-dashboard' | 'public-scan' | 'marista-dashboard' | 'relocate-mode' | 'corporate-dashboard' | 'master-dashboard';

// Map new roles to old role names for compatibility with existing components
const mapRoleToLegacy = (role: AppRole): User['role'] => {
  switch (role) {
    case 'admin': return 'admin';
    case 'cliente': return 'client';
    case 'tec': return 'tech';
    case 'reloc': return 'relocate';
    case 'gestao': return 'marista';
    default: return 'client';
  }
};

const Index = () => {
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    profile, 
    empresa: authEmpresa,
    roles, 
    getPrimaryRole, 
    forcarTrocaSenha,
    signOut 
  } = useAuth();
  const { empresa: empresaCtx, isLoading: empresaLoading } = useEmpresa();
  
  // CRITICAL: Use empresa from AuthContext (user's profile) for data operations
  // EmpresaContext is based on domain and may not match the user's actual empresa
  const empresa = authEmpresa || empresaCtx;
  
  const [view, setView] = useState<ViewType>('login');
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [hydrants, setHydrants] = useState<Hydrant[]>([]);
  const [lighting, setLighting] = useState<Lighting[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'info' | 'warning' } | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Create a legacy user object for compatibility with existing components
  const legacyUser: User | null = useMemo(() => {
    if (!profile) return null;
    const primaryRole = getPrimaryRole();
    return {
      id: profile.id,
      name: profile.nome || profile.email.split('@')[0],
      email: profile.email,
      password: '', // Not used in new auth
      role: mapRoleToLegacy(primaryRole || 'cliente'),
    };
  }, [profile, getPrimaryRole]);

  // Determine initial view based on auth state and role (only on first load)
  const [viewInitialized, setViewInitialized] = useState(false);
  
  useEffect(() => {
    if (authLoading || empresaLoading || viewInitialized) return;
    
    if (!isAuthenticated) {
      setView('login');
      return;
    }
    
    if (forcarTrocaSenha) {
      setView('change-password');
      return;
    }
    
    const primaryRole = getPrimaryRole();
    if (primaryRole) {
      setViewInitialized(true);
      switch (primaryRole) {
        case 'master':
          setView('master-dashboard');
          break;
        case 'admin':
          setView('admin-dashboard');
          break;
        case 'tec':
          setView('inspection-mode');
          break;
        case 'gestao':
          setView('corporate-dashboard');
          break;
        case 'reloc':
          setView('relocate-mode');
          break;
        case 'cliente':
        default:
          setView('client-dashboard');
          break;
      }
    }
  }, [isAuthenticated, authLoading, empresaLoading, forcarTrocaSenha, getPrimaryRole, viewInitialized]);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && !forcarTrocaSenha) {
      fetchData();
    }
  }, [isAuthenticated, forcarTrocaSenha]);

  const fetchData = async () => {
    setIsDataLoading(true);
    try {
      const [extRes, alarmsRes, hydRes, lightRes, locRes, floorRes] = await Promise.all([
        supabase.from('extinguishers').select('*'),
        supabase.from('alarms').select('*'),
        supabase.from('hydrants').select('*'),
        supabase.from('lighting').select('*'),
        supabase.from('locations').select('*'),
        supabase.from('floorplans').select('*')
      ]);

      if (extRes.data) setExtinguishers(extRes.data as unknown as Extinguisher[]);
      if (alarmsRes.data) setAlarms(alarmsRes.data as unknown as Alarm[]);
      if (hydRes.data) setHydrants(hydRes.data as unknown as Hydrant[]);
      if (lightRes.data) setLighting(lightRes.data as unknown as Lighting[]);
      if (locRes.data) setLocations(locRes.data as unknown as Location[]);
      if (floorRes.data) {
        setFloorPlans(floorRes.data.map((fp: any) => ({
          id: fp.id,
          name: fp.name,
          sede: fp.sede,
          image: fp.image_url
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsDataLoading(false);
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
    
    // Add empresa_id if we have empresa context
    if (empresa?.id) {
      cleanItem.empresa_id = empresa.id;
    }
    
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

  const handleAddFloorPlan = async (plan: FloorPlan) => {
    let imageUrl = plan.image;
    if (plan.image && plan.image.startsWith('data:')) {
      const base64Data = plan.image.split(',')[1];
      const fileName = `${plan.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('floorplans')
        .upload(fileName, Buffer.from(base64Data, 'base64'), {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (uploadError) {
        notify("Erro ao fazer upload da imagem: " + uploadError.message, "error");
        return;
      }
      
      const { data: urlData } = supabase.storage.from('floorplans').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const insertData: any = {
      id: plan.id,
      name: plan.name,
      sede: plan.sede,
      image_url: imageUrl
    };
    
    if (empresa?.id) {
      insertData.empresa_id = empresa.id;
    }

    const { error } = await supabase.from('floorplans').insert([insertData]);

    if (error) {
      notify("Erro ao adicionar planta: " + error.message, "error");
    } else {
      notify("Planta adicionada com sucesso!", "success");
      fetchData();
    }
  };

  const handleDeleteFloorPlan = async (id: string) => {
    const { error } = await supabase.from('floorplans').delete().eq('id', id);
    if (error) {
      notify("Erro ao remover planta: " + error.message, "error");
    } else {
      notify("Planta removida!", "success");
      fetchData();
    }
  };

  const handleUpdateFloorPlan = async (plan: FloorPlan) => {
    let imageUrl = plan.image;
    if (plan.image && plan.image.startsWith('data:')) {
      const base64Data = plan.image.split(',')[1];
      const fileName = `${plan.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('floorplans')
        .upload(fileName, Buffer.from(base64Data, 'base64'), {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (uploadError) {
        notify("Erro ao fazer upload da imagem: " + uploadError.message, "error");
        return;
      }
      
      const { data: urlData } = supabase.storage.from('floorplans').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('floorplans').update({
      name: plan.name,
      sede: plan.sede,
      image_url: imageUrl
    } as any).eq('id', plan.id);

    if (error) {
      notify("Erro ao atualizar planta: " + error.message, "error");
    } else {
      notify("Planta atualizada!", "success");
      fetchData();
    }
  };

  const handleAddLocation = async (location: Location) => {
    const insertData: any = { ...location };
    if (empresa?.id) {
      insertData.empresa_id = empresa.id;
    }
    
    const { error } = await supabase.from('locations').insert([insertData] as any);
    if (error) {
      notify("Erro ao adicionar local: " + error.message, "error");
    } else {
      notify("Local adicionado com sucesso!", "success");
      fetchData();
    }
  };

  const handleUpdateLocation = async (id: string, location: Location): Promise<boolean> => {
    const { error } = await supabase.from('locations').update(location as any).eq('id', id);
    if (error) {
      console.error('Erro ao atualizar local:', error);
      notify("Erro ao atualizar local: " + error.message, "error");
      return false;
    }

    notify("Local atualizado com sucesso!", "success");
    await fetchData();
    return true;
  };

  const handleDeleteLocation = async (id: string) => {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) {
      notify("Erro ao remover local: " + error.message, "error");
    } else {
      notify("Local removido!", "success");
      fetchData();
    }
  };

  const handleRelocate = async (type: string, extinguisherId: string, targetLocation: Location, observacao?: string, ignorouExigencia?: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    const ext = extinguishers.find(e => e.id === extinguisherId);
    if (!ext) throw new Error('Extintor não encontrado');

    const currentHistory = ext.historico || [];
    let descricao = `Realocado de "${ext.localizacao || 'Não definido'}" para "${targetLocation.nome}" (${targetLocation.id})`;
    
    if (ignorouExigencia) {
      descricao += ` [ATENÇÃO: Exigência do local não atendida - ${targetLocation.exigencia || 'N/A'}]`;
    }

    const logEntry: HistoryLog = {
      data: today,
      descricao,
      tipo: 'Realocação',
      tecnico: legacyUser?.name || 'Operador',
      details: ignorouExigencia ? {
        ignorouExigencia: true,
        exigenciaLocal: targetLocation.exigencia,
        tipoEquipamento: ext.tipo,
        observacao: observacao || 'Sem observação'
      } : undefined
    };

    const { error } = await supabase.from('extinguishers').update({
      localizacao: targetLocation.nome,
      locationId: targetLocation.id,
      historico: [...currentHistory, logEntry] as any
    }).eq('id', extinguisherId);

    if (error) throw error;
    await fetchData();
  };

  const handleLogout = async () => {
    await signOut();
    setViewInitialized(false);
    setView('login');
  };

  // Loading state
  if (authLoading || empresaLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p>Carregando...</p>
      </div>
    );
  }

  // Data loading state
  if (isDataLoading && isAuthenticated && !forcarTrocaSenha && view !== 'login' && view !== 'change-password') {
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
        <LoginForm
          onSuccess={() => {}}
          onScanMode={() => setView('public-scan')}
          notify={notify}
        />
      )}

      {view === 'change-password' && (
        <ChangePasswordForm
          onSuccess={() => {
            const primaryRole = getPrimaryRole();
            if (primaryRole === 'master') setView('master-dashboard');
            else if (primaryRole === 'admin') setView('admin-dashboard');
            else if (primaryRole === 'tec') setView('inspection-mode');
            else if (primaryRole === 'gestao') setView('corporate-dashboard');
            else if (primaryRole === 'reloc') setView('relocate-mode');
            else setView('client-dashboard');
          }}
          notify={notify}
        />
      )}

      {view === 'master-dashboard' && roles.includes('master') && (
        <MasterDashboard />
      )}

      {view === 'admin-dashboard' && legacyUser && roles.includes('admin') && (
        <AdminDashboard
          extinguishers={extinguishers}
          alarms={alarms}
          hydrants={hydrants}
          lighting={lighting}
          locations={locations}
          floorPlans={floorPlans}
          onUpdate={handleUpdate}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onAddLocation={handleAddLocation}
          onUpdateLocation={handleUpdateLocation}
          onDeleteLocation={handleDeleteLocation}
          onAddFloorPlan={handleAddFloorPlan}
          onDeleteFloorPlan={handleDeleteFloorPlan}
          onUpdateFloorPlan={handleUpdateFloorPlan}
          onLogout={handleLogout}
          notify={notify}
        />
      )}

      {view === 'inspection-mode' && legacyUser && roles.includes('tec') && (
        <InspectionMode
          extinguishers={extinguishers}
          alarms={alarms}
          hydrants={hydrants}
          lighting={lighting}
          onAddInspection={handleAddInspection}
          onLogout={handleLogout}
          notify={notify}
        />
      )}

      {view === 'client-dashboard' && legacyUser && roles.includes('cliente') && (
        <ClientDashboard
          user={legacyUser}
          extinguishers={extinguishers}
          alarms={alarms}
          hydrants={hydrants}
          lighting={lighting}
          locations={locations}
          floorPlans={floorPlans}
          onLogout={handleLogout}
          notify={notify}
        />
      )}

      {view === 'corporate-dashboard' && legacyUser && roles.includes('gestao') && (
        <CorporateDashboard
          extinguishers={extinguishers}
          hydrants={hydrants}
          alarms={alarms}
          lighting={lighting}
          floorPlans={floorPlans}
          onLogout={handleLogout}
        />
      )}

      {view === 'relocate-mode' && legacyUser && roles.includes('reloc') && (
        <RelocateMode
          locations={locations}
          extinguishers={extinguishers}
          onRelocate={handleRelocate}
          onLogout={handleLogout}
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

      {/* SafetyBot - Visible on authenticated views except change-password */}
      {isAuthenticated && view !== 'login' && view !== 'public-scan' && view !== 'change-password' && <SafetyBot />}
    </div>
  );
};

export default Index;
