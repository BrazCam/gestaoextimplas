
-- ============================================================
-- RESET COMPLETO: Apagar TODAS as policies e recriar do zero
-- ============================================================

-- 1. REMOVER TODAS AS POLICIES EXISTENTES DE TODAS AS TABELAS

-- locations
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'locations' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.locations', r.policyname);
  END LOOP;
END $$;

-- extinguishers
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'extinguishers' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.extinguishers', r.policyname);
  END LOOP;
END $$;

-- alarms
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'alarms' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.alarms', r.policyname);
  END LOOP;
END $$;

-- hydrants
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'hydrants' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.hydrants', r.policyname);
  END LOOP;
END $$;

-- lighting
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'lighting' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.lighting', r.policyname);
  END LOOP;
END $$;

-- floorplans
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'floorplans' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.floorplans', r.policyname);
  END LOOP;
END $$;

-- empresas
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'empresas' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.empresas', r.policyname);
  END LOOP;
END $$;

-- profiles
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

-- user_roles
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', r.policyname);
  END LOOP;
END $$;

-- empresa_modulos
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'empresa_modulos' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.empresa_modulos', r.policyname);
  END LOOP;
END $$;

-- 2. RECRIAR FUNÇÕES AUXILIARES (garantir que existem e estão corretas)

CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT empresa_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_empresa_by_domain(_dominio text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id FROM public.empresas WHERE dominio = _dominio LIMIT 1
$$;

-- 3. GARANTIR RLS ATIVADO EM TODAS AS TABELAS

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extinguishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lighting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floorplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_modulos ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLICIES PERMISSIVE - EMPRESAS (leitura pública para identificar domínio)

CREATE POLICY "p_empresas_public_select" ON public.empresas
  AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "p_empresas_master_all" ON public.empresas
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- 5. CRIAR POLICIES PERMISSIVE - PROFILES

CREATE POLICY "p_profiles_self_select" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "p_profiles_self_update" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "p_profiles_admin_select" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND empresa_id = public.get_user_empresa_id(auth.uid())
  );

CREATE POLICY "p_profiles_master_all" ON public.profiles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- 6. CRIAR POLICIES PERMISSIVE - USER_ROLES

CREATE POLICY "p_roles_self_select" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "p_roles_admin_all" ON public.user_roles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND empresa_id = public.get_user_empresa_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND empresa_id = public.get_user_empresa_id(auth.uid())
  );

CREATE POLICY "p_roles_master_all" ON public.user_roles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- 7. CRIAR POLICIES PERMISSIVE - EMPRESA_MODULOS

CREATE POLICY "p_modulos_select" ON public.empresa_modulos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_modulos_master_all" ON public.empresa_modulos
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- 8. CRIAR POLICIES PERMISSIVE - LOCATIONS

CREATE POLICY "p_locations_select" ON public.locations
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_locations_insert" ON public.locations
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_locations_update" ON public.locations
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_locations_delete" ON public.locations
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_locations_master_all" ON public.locations
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- 9. CRIAR POLICIES PERMISSIVE - EXTINGUISHERS

CREATE POLICY "p_extinguishers_select" ON public.extinguishers
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_extinguishers_insert" ON public.extinguishers
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_extinguishers_update" ON public.extinguishers
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_extinguishers_delete" ON public.extinguishers
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_extinguishers_master_all" ON public.extinguishers
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- 10. CRIAR POLICIES PERMISSIVE - ALARMS

CREATE POLICY "p_alarms_select" ON public.alarms
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_alarms_insert" ON public.alarms
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_alarms_update" ON public.alarms
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_alarms_delete" ON public.alarms
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_alarms_master_all" ON public.alarms
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- 11. CRIAR POLICIES PERMISSIVE - HYDRANTS

CREATE POLICY "p_hydrants_select" ON public.hydrants
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_hydrants_insert" ON public.hydrants
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_hydrants_update" ON public.hydrants
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_hydrants_delete" ON public.hydrants
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_hydrants_master_all" ON public.hydrants
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- 12. CRIAR POLICIES PERMISSIVE - LIGHTING

CREATE POLICY "p_lighting_select" ON public.lighting
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_lighting_insert" ON public.lighting
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_lighting_update" ON public.lighting
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_lighting_delete" ON public.lighting
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_lighting_master_all" ON public.lighting
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- 13. CRIAR POLICIES PERMISSIVE - FLOORPLANS

CREATE POLICY "p_floorplans_select" ON public.floorplans
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_floorplans_insert" ON public.floorplans
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_floorplans_update" ON public.floorplans
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_floorplans_delete" ON public.floorplans
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "p_floorplans_master_all" ON public.floorplans
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));
