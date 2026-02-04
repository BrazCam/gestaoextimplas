import { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, CheckCircle, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SetupAdminProps {
  onComplete: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

interface Empresa {
  id: string;
  nome: string;
  dominio: string;
}

export const SetupAdmin = ({ onComplete, notify }: SetupAdminProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    checkSetupStatus();
    fetchEmpresas();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Try to call setup-admin with empty body to check status
      const { data, error } = await supabase.functions.invoke('setup-admin', {
        body: { email: '', password: '', empresaId: '' }
      });
      
      // If error says "Setup already completed", then we're done
      if (error?.message?.includes('Setup already completed') || 
          data?.error?.includes('Setup already completed')) {
        setSetupComplete(true);
        setTimeout(onComplete, 1500);
      }
    } catch (err) {
      // Ignore errors during check
    } finally {
      setIsCheckingSetup(false);
    }
  };

  const fetchEmpresas = async () => {
    const { data } = await supabase
      .from('empresas')
      .select('id, nome, dominio')
      .eq('status', 'ativo');
    
    if (data) {
      setEmpresas(data);
      if (data.length === 1) {
        setEmpresaId(data[0].id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !empresaId) {
      notify('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    if (password.length < 6) {
      notify('A senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('setup-admin', {
        body: { email, password, empresaId, nome: nome || email.split('@')[0] }
      });

      if (error) {
        notify(error.message || 'Erro ao criar admin', 'error');
        return;
      }

      if (data?.error) {
        notify(data.error, 'error');
        return;
      }

      notify('Administrador criado com sucesso!', 'success');
      setSetupComplete(true);
      setTimeout(onComplete, 2000);
    } catch (err) {
      notify('Erro ao criar administrador', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p>Verificando configuração...</p>
      </div>
    );
  }

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Setup Completo!</h2>
        <p className="text-gray-400">Redirecionando para o login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-10 text-center flex flex-col items-center">
          <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <UserPlus className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-white">
            Configuração Inicial
          </h1>
          <p className="text-green-100 text-sm mt-2">
            Crie o primeiro administrador do sistema
          </p>
        </div>

        <div className="p-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Primeiro acesso!</strong><br />
              Configure o administrador principal para gerenciar usuários e permissões.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {empresas.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="empresa" className="text-xs font-bold text-gray-500 uppercase">
                  Empresa
                </Label>
                <Select value={empresaId} onValueChange={setEmpresaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nome} ({emp.dominio})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome" className="text-xs font-bold text-gray-500 uppercase">
                Nome
              </Label>
              <Input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do administrador"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase">
                Senha *
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Administrador'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
