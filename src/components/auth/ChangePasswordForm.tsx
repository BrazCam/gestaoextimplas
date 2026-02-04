import { useState } from 'react';
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChangePasswordFormProps {
  onSuccess: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

export const ChangePasswordForm = ({ onSuccess, notify }: ChangePasswordFormProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { updatePassword, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      notify('A senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      notify('As senhas não coincidem', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        notify(error.message || 'Erro ao alterar senha', 'error');
      } else {
        notify('Senha alterada com sucesso!', 'success');
        onSuccess();
      }
    } catch (err) {
      notify('Erro ao alterar senha', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-10 text-center flex flex-col items-center">
          <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-white">
            Alterar Senha
          </h1>
          <p className="text-amber-100 text-sm mt-2">
            Por segurança, você precisa criar uma nova senha
          </p>
        </div>

        <div className="p-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              <strong>Primeiro acesso detectado!</strong><br />
              Olá, {profile?.nome || 'usuário'}. Para sua segurança, crie uma nova senha antes de continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs font-bold text-gray-500 uppercase">
                Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-bold text-gray-500 uppercase">
                Confirmar Senha
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Confirmar Nova Senha'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
