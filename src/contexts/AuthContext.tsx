import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'cliente' | 'tec' | 'reloc' | 'gestao' | 'master';

export interface Profile {
  id: string;
  empresa_id: string;
  email: string;
  nome: string | null;
  forcar_troca_senha: boolean;
}

export interface Empresa {
  id: string;
  nome: string;
  dominio: string;
  status: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  empresa_id: string;
}

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  empresa: Empresa | null;
  roles: AppRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  forcarTrocaSenha: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, empresaId: string, nome?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  hasRole: (role: AppRole) => boolean;
  getPrimaryRole: () => AppRole | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get empresa by current domain
  const getEmpresaByDomain = async () => {
    const domain = window.location.hostname;
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('dominio', domain)
      .single();
    
    if (error) {
      console.error('Error fetching empresa by domain:', error);
      // Try to get any empresa as fallback for development
      const { data: fallbackData } = await supabase
        .from('empresas')
        .select('*')
        .limit(1)
        .single();
      return fallbackData as Empresa | null;
    }
    return data as Empresa;
  };

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile;
  };

  // Fetch user roles
  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
    return (data || []).map(r => r.role as AppRole);
  };

  // Fetch empresa by ID
  const fetchEmpresa = async (empresaId: string) => {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();
    
    if (error) {
      console.error('Error fetching empresa:', error);
      return null;
    }
    return data as Empresa;
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    const profileData = await fetchProfile(user.id);
    if (profileData) {
      setProfile(profileData);
      const empresaData = await fetchEmpresa(profileData.empresa_id);
      setEmpresa(empresaData);
    }
    
    const userRoles = await fetchRoles(user.id);
    setRoles(userRoles);
  };

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid race conditions with Supabase
          setTimeout(async () => {
            const profileData = await fetchProfile(currentSession.user.id);
            if (profileData) {
              setProfile(profileData);
              const empresaData = await fetchEmpresa(profileData.empresa_id);
              setEmpresa(empresaData);
            }
            
            const userRoles = await fetchRoles(currentSession.user.id);
            setRoles(userRoles);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setEmpresa(null);
          setRoles([]);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!existingSession) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, empresaId: string, nome?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          empresa_id: empresaId,
          nome: nome || email.split('@')[0],
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setEmpresa(null);
    setRoles([]);
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (!error && profile) {
      // Update profile to set forcar_troca_senha to false
      await supabase
        .from('profiles')
        .update({ forcar_troca_senha: false })
        .eq('id', profile.id);
      
      // Refresh profile
      await refreshProfile();
    }

    return { error: error ? new Error(error.message) : null };
  };

  const hasRole = (role: AppRole) => {
    return roles.includes(role);
  };

  const getPrimaryRole = (): AppRole | null => {
    // Priority order for roles - master is highest
    const priority: AppRole[] = ['master', 'admin', 'gestao', 'cliente', 'tec', 'reloc'];
    for (const role of priority) {
      if (roles.includes(role)) return role;
    }
    return null;
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    empresa,
    roles,
    isLoading,
    isAuthenticated: !!session,
    forcarTrocaSenha: profile?.forcar_troca_senha ?? false,
    signIn,
    signUp,
    signOut,
    updatePassword,
    hasRole,
    getPrimaryRole,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
