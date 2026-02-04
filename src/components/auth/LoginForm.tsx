import { useState } from 'react';
import { ShieldCheck, Bot, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { SafetyBot } from '@/components/SafetyBot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface LoginFormProps {
  onSuccess?: () => void;
  onScanMode?: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

export const LoginForm = ({ onSuccess, onScanMode, notify }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  
  const { signIn } = useAuth();
  const { empresa } = useEmpresa();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        notify(error.message || 'Credenciais inválidas', 'error');
      } else {
        if (rememberMe) {
          localStorage.setItem('fs_email', email);
        } else {
          localStorage.removeItem('fs_email');
        }
        notify('Login realizado com sucesso!', 'success');
        onSuccess?.();
      }
    } catch (err) {
      notify('Erro ao fazer login', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved email on mount
  useState(() => {
    const savedEmail = localStorage.getItem('fs_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  });

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="bg-gradient-to-r from-red-700 to-red-900 p-10 text-center flex flex-col items-center">
          <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <p className="text-red-200 text-sm font-bold tracking-[0.2em] uppercase mb-1">
            {empresa?.nome || 'Sistema Extimplas'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-black text-white leading-tight">
              GESTÃO<br />EXTIMPLAS
            </h1>
            <button
              onClick={() => setIsBotOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
              title="Assistente de Segurança"
            >
              <Bot className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="remember-me"
                className="text-sm text-gray-600 cursor-pointer"
              >
                Lembrar meu email
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Acessar Sistema'
              )}
            </Button>
          </form>

          {onScanMode && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-xs text-gray-400 mb-4">
                Acesso Público / Visitante
              </p>
              <Button
                variant="outline"
                onClick={onScanMode}
                className="w-full border-dashed"
              >
                Ler QR Code (Consulta)
              </Button>
            </div>
          )}
        </div>
      </div>

      <SafetyBot isOpen={isBotOpen} onOpenChange={setIsBotOpen} showFloatingButton={false} />
    </div>
  );
};
