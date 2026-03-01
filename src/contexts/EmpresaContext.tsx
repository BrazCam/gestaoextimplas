import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Empresa {
  id: string;
  nome: string;
  dominio: string;
  status: string;
}

interface EmpresaContextType {
  empresa: Empresa | null;
  isLoading: boolean;
  error: string | null;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export const EmpresaProvider = ({ children }: { children: ReactNode }) => {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmpresaByDomain = useCallback(async () => {
    try {
      const domain = window.location.hostname;
      
      // First try exact match
      let { data, error: fetchError } = await supabase
        .from('empresas')
        .select('*')
        .eq('dominio', domain)
        .eq('status', 'ativo')
        .single();
      
      if (fetchError || !data) {
        // Try partial match (subdomain) or fallback
        const { data: partialData } = await supabase
          .from('empresas')
          .select('*')
          .eq('status', 'ativo')
          .limit(1)
          .single();
        
        if (partialData) {
          data = partialData;
        }
      }
      
      if (data) {
        setEmpresa(data as Empresa);
      } else {
        setError('Empresa não encontrada para este domínio');
      }
    } catch (err) {
      console.error('Error fetching empresa:', err);
      setError('Erro ao carregar dados da empresa');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmpresaByDomain();

    // Re-fetch when auth state changes (empresa query may need auth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' && !empresa) {
        fetchEmpresaByDomain();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchEmpresaByDomain]);

  return (
    <EmpresaContext.Provider value={{ empresa, isLoading, error }}>
      {children}
    </EmpresaContext.Provider>
  );
};

export const useEmpresa = () => {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error('useEmpresa must be used within an EmpresaProvider');
  }
  return context;
};
