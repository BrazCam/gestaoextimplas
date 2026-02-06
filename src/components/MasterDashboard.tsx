import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Edit, Trash2, LogOut, Settings, KeyRound } from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
  dominio: string;
  status: string;
  created_at: string;
}

interface EmpresaModulo {
  id: string;
  empresa_id: string;
  modulo: string;
  ativo: boolean;
}

const MODULOS_DISPONIVEIS = [
  { id: 'extintores', nome: 'Extintores' },
  { id: 'hidrantes', nome: 'Hidrantes' },
  { id: 'alarmes', nome: 'Alarmes' },
  { id: 'iluminacao', nome: 'Iluminação' },
  { id: 'locais', nome: 'Locais' },
  { id: 'plantas', nome: 'Plantas' },
  { id: 'relatorios', nome: 'Relatórios' },
];

export const MasterDashboard = () => {
  const { signOut, profile, session } = useAuth();
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaModulos, setEmpresaModulos] = useState<Record<string, EmpresaModulo[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isModulosDialogOpen, setIsModulosDialogOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [formData, setFormData] = useState({ nome: '', dominio: '', status: 'ativo' });
  const [selectedModulos, setSelectedModulos] = useState<string[]>([]);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('123456');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nome');

    if (error) {
      toast({ title: 'Erro ao carregar empresas', variant: 'destructive' });
    } else {
      setEmpresas(data || []);
      // Fetch modulos for each empresa
      for (const empresa of data || []) {
        await fetchEmpresaModulos(empresa.id);
      }
    }
    setIsLoading(false);
  };

  const fetchEmpresaModulos = async (empresaId: string) => {
    const { data } = await supabase
      .from('empresa_modulos')
      .select('*')
      .eq('empresa_id', empresaId);

    setEmpresaModulos(prev => ({
      ...prev,
      [empresaId]: data || []
    }));
  };

  const handleSaveEmpresa = async () => {
    if (!formData.nome || !formData.dominio) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    if (selectedEmpresa) {
      // Update
      const { error } = await supabase
        .from('empresas')
        .update({ nome: formData.nome, dominio: formData.dominio, status: formData.status })
        .eq('id', selectedEmpresa.id);

      if (error) {
        toast({ title: 'Erro ao atualizar empresa', variant: 'destructive' });
      } else {
        toast({ title: 'Empresa atualizada com sucesso' });
        fetchEmpresas();
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('empresas')
        .insert({ nome: formData.nome, dominio: formData.dominio, status: formData.status });

      if (error) {
        toast({ title: 'Erro ao criar empresa', variant: 'destructive' });
      } else {
        toast({ title: 'Empresa criada com sucesso' });
        fetchEmpresas();
      }
    }

    setIsDialogOpen(false);
    setFormData({ nome: '', dominio: '', status: 'ativo' });
    setSelectedEmpresa(null);
  };

  const handleDeleteEmpresa = async (empresa: Empresa) => {
    if (!confirm(`Excluir empresa "${empresa.nome}"? Esta ação não pode ser desfeita.`)) return;

    const { error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', empresa.id);

    if (error) {
      toast({ title: 'Erro ao excluir empresa', variant: 'destructive' });
    } else {
      toast({ title: 'Empresa excluída com sucesso' });
      fetchEmpresas();
    }
  };

  const handleEditEmpresa = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setFormData({ nome: empresa.nome, dominio: empresa.dominio, status: empresa.status });
    setIsDialogOpen(true);
  };

  const handleOpenModulos = async (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    const modulos = empresaModulos[empresa.id] || [];
    setSelectedModulos(modulos.filter(m => m.ativo).map(m => m.modulo));
    setIsModulosDialogOpen(true);
  };

  const handleSaveModulos = async () => {
    if (!selectedEmpresa) return;

    // Delete existing modulos
    await supabase
      .from('empresa_modulos')
      .delete()
      .eq('empresa_id', selectedEmpresa.id);

    // Insert selected modulos
    if (selectedModulos.length > 0) {
      const { error } = await supabase
        .from('empresa_modulos')
        .insert(
          selectedModulos.map(modulo => ({
            empresa_id: selectedEmpresa.id,
            modulo,
            ativo: true
          }))
        );

      if (error) {
        toast({ title: 'Erro ao salvar módulos', variant: 'destructive' });
        return;
      }
    }

    toast({ title: 'Módulos atualizados com sucesso' });
    await fetchEmpresaModulos(selectedEmpresa.id);
    setIsModulosDialogOpen(false);
  };

  const toggleModulo = (modulo: string) => {
    setSelectedModulos(prev =>
      prev.includes(modulo)
        ? prev.filter(m => m !== modulo)
        : [...prev, modulo]
    );
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !resetPassword) {
      toast({ title: 'Informe email e nova senha', variant: 'destructive' });
      return;
    }

    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          email: resetEmail,
          newPassword: resetPassword,
          forcePasswordChange: true,
        },
      });

      const message = (error as any)?.message || (data as any)?.error;
      if (message) {
        toast({ title: 'Erro ao redefinir senha', description: message, variant: 'destructive' });
        return;
      }

      toast({
        title: 'Senha redefinida com sucesso',
        description: 'O usuário precisará trocar a senha no próximo login.',
      });
      setIsResetDialogOpen(false);
      setResetEmail('');
      setResetPassword('123456');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Painel Master</h1>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <KeyRound className="w-4 h-4 mr-2" />
                  Redefinir senha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Redefinir senha de usuário</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Email do usuário</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="admin@kuhn.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resetPassword">Nova senha</Label>
                    <Input
                      id="resetPassword"
                      type="text"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="123456"
                    />
                    <p className="text-sm text-muted-foreground">
                      Após redefinir, o usuário será obrigado a trocar a senha no próximo login.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleResetPassword} disabled={isResetting}>
                      {isResetting ? 'Redefinindo...' : 'Redefinir'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Empresas Cadastradas
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setSelectedEmpresa(null); setFormData({ nome: '', dominio: '', status: 'ativo' }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Empresa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedEmpresa ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dominio">Domínio</Label>
                    <Input
                      id="dominio"
                      value={formData.dominio}
                      onChange={e => setFormData(prev => ({ ...prev, dominio: e.target.value }))}
                      placeholder="exemplo.com"
                    />
                  </div>
                  <Button onClick={handleSaveEmpresa} className="w-full">
                    {selectedEmpresa ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : empresas.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma empresa cadastrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Domínio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Módulos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresas.map(empresa => (
                    <TableRow key={empresa.id}>
                      <TableCell className="font-medium">{empresa.nome}</TableCell>
                      <TableCell>{empresa.dominio}</TableCell>
                      <TableCell>
                        <Badge variant={empresa.status === 'ativo' ? 'default' : 'secondary'}>
                          {empresa.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(empresaModulos[empresa.id] || [])
                            .filter(m => m.ativo)
                            .map(m => (
                              <Badge key={m.id} variant="outline" className="text-xs">
                                {MODULOS_DISPONIVEIS.find(mod => mod.id === m.modulo)?.nome || m.modulo}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenModulos(empresa)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditEmpresa(empresa)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteEmpresa(empresa)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modulos Dialog */}
        <Dialog open={isModulosDialogOpen} onOpenChange={setIsModulosDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Módulos - {selectedEmpresa?.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {MODULOS_DISPONIVEIS.map(modulo => (
                <div key={modulo.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={modulo.id}
                    checked={selectedModulos.includes(modulo.id)}
                    onCheckedChange={() => toggleModulo(modulo.id)}
                  />
                  <Label htmlFor={modulo.id}>{modulo.nome}</Label>
                </div>
              ))}
              <Button onClick={handleSaveModulos} className="w-full">
                Salvar Módulos
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
