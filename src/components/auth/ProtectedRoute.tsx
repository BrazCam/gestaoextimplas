import { ReactNode } from 'react';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { RefreshCw, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles,
  fallback 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, roles, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  // Check if user has any of the allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(role => roles.includes(role));
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
          <div className="bg-red-900/50 p-8 rounded-2xl text-center max-w-md">
            <ShieldX className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
            <p className="text-gray-300 mb-6">
              Você não tem permissão para acessar esta área.
            </p>
            <Button 
              variant="outline" 
              onClick={() => signOut()}
              className="border-red-400 text-red-400 hover:bg-red-400/10"
            >
              Voltar ao Login
            </Button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
