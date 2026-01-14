import { useState, useEffect } from 'react';
import { ShieldCheck, QrCode } from 'lucide-react';
import { User, MOCK_USERS } from '@/types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onScanMode: () => void;
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

export const LoginScreen = ({ onLogin, onScanMode, notify }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('fs_email');
    const savedPass = localStorage.getItem('fs_pass');
    if (savedEmail && savedPass) {
      setEmail(savedEmail);
      setPassword(savedPass);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (rememberMe) {
      localStorage.setItem('fs_email', email);
      localStorage.setItem('fs_pass', password);
    } else {
      localStorage.removeItem('fs_email');
      localStorage.removeItem('fs_pass');
    }

    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      notify("Credenciais inválidas! Tente: admin@demo.com, cliente@demo.com ou tec@demo.com (Senha: 123)", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="bg-gradient-to-r from-red-700 to-red-900 p-10 text-center flex flex-col items-center">
          <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <p className="text-red-200 text-sm font-bold tracking-[0.2em] uppercase mb-1">Sistema Extimplas</p>
          <h1 className="text-4xl font-black text-white leading-tight">GESTAO<br />EXTIMPLAS</h1>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: admin@demo.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer">
                Salvar login e senha no dispositivo
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-500/30 transition-all transform hover:scale-[1.02]"
            >
              Acessar Sistema
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400 mb-4">Acesso Público / Visitante</p>
            <button
              onClick={onScanMode}
              className="w-full flex justify-center items-center py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              <QrCode className="w-5 h-5 mr-2" /> Ler QR Code (Consulta)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
