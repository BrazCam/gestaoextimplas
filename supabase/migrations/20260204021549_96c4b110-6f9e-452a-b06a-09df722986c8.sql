-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'cliente', 'tec', 'reloc', 'gestao');

-- 2. Create empresas (companies) table
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  dominio TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Empresas policies - allow read for authenticated users
CREATE POLICY "Users can read their own empresa"
  ON public.empresas FOR SELECT
  TO authenticated
  USING (true);

-- 3. Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  nome TEXT,
  forcar_troca_senha BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- 4. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, empresa_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Create function to get user's empresa_id
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

-- 7. Create function to get empresa by domain
CREATE OR REPLACE FUNCTION public.get_empresa_by_domain(_dominio TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.empresas
  WHERE dominio = _dominio
  LIMIT 1
$$;

-- 8. Add empresa_id to existing tables
ALTER TABLE public.extinguishers ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.alarms ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.hydrants ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.lighting ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.floorplans ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- 9. Create RLS policies for existing tables to filter by empresa_id
-- Drop existing policies first (they are currently public access)

-- Extinguishers
DROP POLICY IF EXISTS "Allow public read extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Allow public insert extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Allow public update extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Allow public delete extinguishers" ON public.extinguishers;

CREATE POLICY "Users can read own empresa extinguishers"
  ON public.extinguishers FOR SELECT
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can insert own empresa extinguishers"
  ON public.extinguishers FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa extinguishers"
  ON public.extinguishers FOR UPDATE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can delete own empresa extinguishers"
  ON public.extinguishers FOR DELETE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

-- Alarms
DROP POLICY IF EXISTS "Allow public read alarms" ON public.alarms;
DROP POLICY IF EXISTS "Allow public insert alarms" ON public.alarms;
DROP POLICY IF EXISTS "Allow public update alarms" ON public.alarms;
DROP POLICY IF EXISTS "Allow public delete alarms" ON public.alarms;

CREATE POLICY "Users can read own empresa alarms"
  ON public.alarms FOR SELECT
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can insert own empresa alarms"
  ON public.alarms FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa alarms"
  ON public.alarms FOR UPDATE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can delete own empresa alarms"
  ON public.alarms FOR DELETE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

-- Hydrants
DROP POLICY IF EXISTS "Allow public read hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Allow public insert hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Allow public update hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Allow public delete hydrants" ON public.hydrants;

CREATE POLICY "Users can read own empresa hydrants"
  ON public.hydrants FOR SELECT
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can insert own empresa hydrants"
  ON public.hydrants FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa hydrants"
  ON public.hydrants FOR UPDATE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can delete own empresa hydrants"
  ON public.hydrants FOR DELETE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

-- Lighting
DROP POLICY IF EXISTS "Allow public read lighting" ON public.lighting;
DROP POLICY IF EXISTS "Allow public insert lighting" ON public.lighting;
DROP POLICY IF EXISTS "Allow public update lighting" ON public.lighting;
DROP POLICY IF EXISTS "Allow public delete lighting" ON public.lighting;

CREATE POLICY "Users can read own empresa lighting"
  ON public.lighting FOR SELECT
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can insert own empresa lighting"
  ON public.lighting FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa lighting"
  ON public.lighting FOR UPDATE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can delete own empresa lighting"
  ON public.lighting FOR DELETE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

-- Locations
DROP POLICY IF EXISTS "Allow public read locations" ON public.locations;
DROP POLICY IF EXISTS "Allow public insert locations" ON public.locations;
DROP POLICY IF EXISTS "Allow public update locations" ON public.locations;
DROP POLICY IF EXISTS "Allow public delete locations" ON public.locations;

CREATE POLICY "Users can read own empresa locations"
  ON public.locations FOR SELECT
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can insert own empresa locations"
  ON public.locations FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa locations"
  ON public.locations FOR UPDATE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can delete own empresa locations"
  ON public.locations FOR DELETE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

-- Floorplans
DROP POLICY IF EXISTS "Allow public read floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Allow public insert floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Allow public update floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Allow public delete floorplans" ON public.floorplans;

CREATE POLICY "Users can read own empresa floorplans"
  ON public.floorplans FOR SELECT
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can insert own empresa floorplans"
  ON public.floorplans FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa floorplans"
  ON public.floorplans FOR UPDATE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

CREATE POLICY "Users can delete own empresa floorplans"
  ON public.floorplans FOR DELETE
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) OR empresa_id IS NULL);

-- 10. Admin policies - allow admins to manage user_roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 11. Allow admins to read all profiles in their empresa
CREATE POLICY "Admins can read empresa profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    AND empresa_id = public.get_user_empresa_id(auth.uid())
  );

-- 12. Create trigger for profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, empresa_id, email, nome, forcar_troca_senha)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'empresa_id')::UUID,
      (SELECT id FROM public.empresas LIMIT 1)
    ),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    true
  );
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Insert a default empresa for testing
INSERT INTO public.empresas (id, nome, dominio, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Empresa Demo',
  'localhost',
  'ativo'
) ON CONFLICT (dominio) DO NOTHING;

-- Also add for preview domain
INSERT INTO public.empresas (id, nome, dominio, status)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'Gestão Extimplas',
  'id-preview--18279758-8bdd-459d-ae02-7a9aa2f25a18.lovable.app',
  'ativo'
) ON CONFLICT (dominio) DO NOTHING;

INSERT INTO public.empresas (id, nome, dominio, status)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'Gestão Extimplas Prod',
  'gestaoextimplas.lovable.app',
  'ativo'
) ON CONFLICT (dominio) DO NOTHING;