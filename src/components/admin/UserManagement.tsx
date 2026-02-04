import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Loader2, X, Check, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  email: string;
  nome: string | null;
  empresa_id: string;
  forcar_troca_senha: boolean;
  roles: AppRole[];
}

interface UserManagementProps {
  notify: (message: string, type?: 'error' | 'success' | 'info' | 'warning') => void;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  cliente: 'Cliente',
  tec: 'Técnico',
  reloc: 'Realocação',
  gestao: 'Gestão',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800',
  cliente: 'bg-blue-100 text-blue-800',
  tec: 'bg-green-100 text-green-800',
  reloc: 'bg-purple-100 text-purple-800',
  gestao: 'bg-orange-100 text-orange-800',
};

export const UserManagement = ({ notify }: UserManagementProps) => {
  const { session, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // New user form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserNome, setNewUserNome] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123');
  const [newUserRole, setNewUserRole] = useState<AppRole>('cliente');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        notify('Erro ao carregar usuários: ' + error.message, 'error');
        return;
      }

      if (data?.users) {
        setUsers(data.users);
      }
    } catch (err) {
      notify('Erro ao carregar usuários', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserEmail || !newUserPassword) {
      notify('Email e senha são obrigatórios', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          email: newUserEmail,
          password: newUserPassword,
          empresaId: profile?.empresa_id,
          nome: newUserNome || newUserEmail.split('@')[0],
          role: newUserRole,
        },
      });

      if (error) {
        notify('Erro ao criar usuário: ' + error.message, 'error');
        return;
      }

      if (data?.error) {
        notify(data.error, 'error');
        return;
      }

      notify('Usuário criado com sucesso!', 'success');
      setIsCreateDialogOpen(false);
      setNewUserEmail('');
      setNewUserNome('');
      setNewUserPassword('123');
      setNewUserRole('cliente');
      fetchUsers();
    } catch (err) {
      notify('Erro ao criar usuário', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleRole = async (userId: string, role: AppRole, hasRole: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-role', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          userId,
          role,
          action: hasRole ? 'remove' : 'add',
        },
      });

      if (error || data?.error) {
        notify('Erro ao atualizar permissão', 'error');
        return;
      }

      notify(`Permissão ${hasRole ? 'removida' : 'adicionada'} com sucesso!`, 'success');
      fetchUsers();
    } catch (err) {
      notify('Erro ao atualizar permissão', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Gestão de Usuários</h2>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                O usuário receberá a senha inicial e deverá alterá-la no primeiro acesso.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="newNome">Nome</Label>
                <Input
                  id="newNome"
                  value={newUserNome}
                  onChange={(e) => setNewUserNome(e.target.value)}
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email *</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Senha Inicial</Label>
                <Input
                  id="newPassword"
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="123"
                />
                <p className="text-xs text-gray-500">Padrão: 123</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newRole">Função Principal</Label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <SelectItem key={role} value={role}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Usuário</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Email</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Permissões</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <span className="font-medium text-gray-800">
                    {user.nome || user.email.split('@')[0]}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-600">{user.email}</td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-1">
                    {(['admin', 'gestao', 'cliente', 'tec', 'reloc'] as AppRole[]).map((role) => {
                      const hasRole = user.roles.includes(role);
                      return (
                        <button
                          key={role}
                          onClick={() => handleToggleRole(user.id, role, hasRole)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                            hasRole 
                              ? ROLE_COLORS[role] 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={hasRole ? `Remover ${ROLE_LABELS[role]}` : `Adicionar ${ROLE_LABELS[role]}`}
                        >
                          {ROLE_LABELS[role]}
                          {hasRole && <Check className="w-3 h-3 inline ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="py-4 px-4">
                  {user.forcar_troca_senha ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Aguardando troca de senha
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Ativo
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum usuário encontrado
          </div>
        )}
      </div>
    </div>
  );
};
