import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    const fetchEmpresaByDomain = async () => {
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
          // Try partial match (subdomain)
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
    };

    fetchEmpresaByDomain();
  }, []);

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
