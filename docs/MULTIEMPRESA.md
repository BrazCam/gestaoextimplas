# Sistema Multiempresa - Documentação de Integração

## Visão Geral

O sistema agora suporta múltiplas empresas (multi-tenant) com:
- Autenticação por email/senha via Supabase Auth
- Identificação da empresa pelo domínio
- Controle de abas e permissões por função (role)
- Isolamento completo de dados entre empresas

## Estrutura do Banco de Dados

### Novas Tabelas

1. **empresas** - Cadastro de empresas
   - `id` (UUID): Identificador único
   - `nome` (TEXT): Nome da empresa
   - `dominio` (TEXT, UNIQUE): Domínio de acesso (ex: empresa.app.com)
   - `status` (TEXT): 'ativo' ou 'inativo'

2. **profiles** - Perfis de usuários (vinculado a auth.users)
   - `id` (UUID): FK para auth.users
   - `empresa_id` (UUID): FK para empresas
   - `email` (TEXT): Email do usuário
   - `nome` (TEXT): Nome do usuário
   - `forcar_troca_senha` (BOOLEAN): Se deve forçar troca no primeiro login

3. **user_roles** - Funções dos usuários
   - `user_id` (UUID): FK para auth.users
   - `role` (app_role): Enum com valores: 'admin', 'cliente', 'tec', 'reloc', 'gestao'
   - `empresa_id` (UUID): FK para empresas

### Alterações em Tabelas Existentes

Todas as tabelas principais receberam a coluna `empresa_id`:
- extinguishers
- alarms
- hydrants
- lighting
- locations
- floorplans

## Roles e Abas

| Role | Email Padrão | Aba |
|------|--------------|-----|
| admin | admin@dominio.com | Painel Administrativo |
| cliente | cliente@dominio.com | Dashboard do Cliente |
| tec | tec@dominio.com | Modo Vistoria |
| reloc | reloc@dominio.com | Realocação |
| gestao | gestao@dominio.com | Dashboard Corporativo |

## Edge Functions

1. **setup-admin** - Criar primeiro admin (apenas se não existir nenhum)
2. **create-user** - Criar novos usuários (apenas admin)
3. **list-users** - Listar usuários da empresa (apenas admin)
4. **update-role** - Adicionar/remover roles (apenas admin)

## Fluxo de Autenticação

1. Usuário acessa o domínio da empresa
2. Sistema identifica a empresa pelo domínio
3. Exibe tela de login
4. Autentica usuário via Supabase Auth
5. Se `forcar_troca_senha = true`, exibe tela de troca de senha
6. Redireciona para a aba correspondente ao role
7. Carrega apenas dados da empresa do usuário (via RLS)

## Políticas de Segurança (RLS)

- Cada tabela possui políticas que filtram por `empresa_id`
- Usuários só podem ver/editar dados da própria empresa
- Admins podem gerenciar roles de usuários da mesma empresa
- Função `get_user_empresa_id()` evita recursão em políticas

## Como Configurar uma Nova Empresa

1. Inserir registro na tabela `empresas` com o domínio
2. Acessar a tela de setup (primeira vez sem admin)
3. Criar o primeiro administrador
4. Admin pode então criar outros usuários via aba "Usuários"

## Componentes React

### Novos Contextos
- `AuthContext` - Gerencia autenticação e estado do usuário
- `EmpresaContext` - Gerencia empresa atual baseada no domínio

### Novos Componentes
- `LoginForm` - Formulário de login com Supabase Auth
- `ChangePasswordForm` - Formulário de troca de senha obrigatória
- `ProtectedRoute` - Wrapper para rotas que requerem autenticação
- `SetupAdmin` - Tela de configuração inicial
- `UserManagement` - Gestão de usuários (admin)

## Migração de Dados Existentes

Dados existentes (sem `empresa_id`) continuarão acessíveis temporariamente.
Para vincular dados antigos a uma empresa, execute:

```sql
UPDATE extinguishers SET empresa_id = 'UUID_DA_EMPRESA' WHERE empresa_id IS NULL;
UPDATE alarms SET empresa_id = 'UUID_DA_EMPRESA' WHERE empresa_id IS NULL;
UPDATE hydrants SET empresa_id = 'UUID_DA_EMPRESA' WHERE empresa_id IS NULL;
UPDATE lighting SET empresa_id = 'UUID_DA_EMPRESA' WHERE empresa_id IS NULL;
UPDATE locations SET empresa_id = 'UUID_DA_EMPRESA' WHERE empresa_id IS NULL;
UPDATE floorplans SET empresa_id = 'UUID_DA_EMPRESA' WHERE empresa_id IS NULL;
```
