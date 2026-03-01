
-- ============================================================
-- AUDITORIA COMPLETA RLS MULTIEMPRESA
-- Recriar TODAS as policies como PERMISSIVE
-- ============================================================

-- 1. LOCATIONS
DROP POLICY IF EXISTS "Users can delete own empresa locations" ON public.locations;
DROP POLICY IF EXISTS "Users can insert own empresa locations" ON public.locations;
DROP POLICY IF EXISTS "Users can read own empresa locations" ON public.locations;
DROP POLICY IF EXISTS "Users can update own empresa locations" ON public.locations;
DROP POLICY IF EXISTS "Isolamento por empresa locations" ON public.locations;

CREATE POLICY "Isolamento por empresa locations"
  ON public.locations FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 2. EXTINGUISHERS
DROP POLICY IF EXISTS "Users can delete own empresa extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can insert own empresa extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can read own empresa extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can update own empresa extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Isolamento por empresa extinguishers" ON public.extinguishers;

CREATE POLICY "Isolamento por empresa extinguishers"
  ON public.extinguishers FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 3. ALARMS
DROP POLICY IF EXISTS "Users can delete own empresa alarms" ON public.alarms;
DROP POLICY IF EXISTS "Users can insert own empresa alarms" ON public.alarms;
DROP POLICY IF EXISTS "Users can read own empresa alarms" ON public.alarms;
DROP POLICY IF EXISTS "Users can update own empresa alarms" ON public.alarms;
DROP POLICY IF EXISTS "Isolamento por empresa alarms" ON public.alarms;

CREATE POLICY "Isolamento por empresa alarms"
  ON public.alarms FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 4. HYDRANTS
DROP POLICY IF EXISTS "Users can delete own empresa hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Users can insert own empresa hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Users can read own empresa hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Users can update own empresa hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Isolamento por empresa hydrants" ON public.hydrants;

CREATE POLICY "Isolamento por empresa hydrants"
  ON public.hydrants FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 5. LIGHTING
DROP POLICY IF EXISTS "Users can delete own empresa lighting" ON public.lighting;
DROP POLICY IF EXISTS "Users can insert own empresa lighting" ON public.lighting;
DROP POLICY IF EXISTS "Users can read own empresa lighting" ON public.lighting;
DROP POLICY IF EXISTS "Users can update own empresa lighting" ON public.lighting;
DROP POLICY IF EXISTS "Isolamento por empresa lighting" ON public.lighting;

CREATE POLICY "Isolamento por empresa lighting"
  ON public.lighting FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 6. FLOORPLANS
DROP POLICY IF EXISTS "Users can delete own empresa floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Users can insert own empresa floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Users can read own empresa floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Users can update own empresa floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Isolamento por empresa floorplans" ON public.floorplans;

CREATE POLICY "Isolamento por empresa floorplans"
  ON public.floorplans FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 7. EMPRESAS - limpar duplicatas e manter apenas o necessário
DROP POLICY IF EXISTS "Anon can read empresas for login" ON public.empresas;
DROP POLICY IF EXISTS "Users can read their own empresa" ON public.empresas;
DROP POLICY IF EXISTS "Master can delete empresas" ON public.empresas;
DROP POLICY IF EXISTS "Master can insert empresas" ON public.empresas;
DROP POLICY IF EXISTS "Master can update empresas" ON public.empresas;
DROP POLICY IF EXISTS "Public read empresa by domain" ON public.empresas;
DROP POLICY IF EXISTS "Master manage empresas" ON public.empresas;

-- Anon + authenticated can read (for domain identification and after login)
CREATE POLICY "Public read empresa by domain"
  ON public.empresas FOR SELECT TO anon, authenticated
  USING (true);

-- Master can manage empresas
CREATE POLICY "Master manage empresas"
  ON public.empresas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- 8. EMPRESA_MODULOS
DROP POLICY IF EXISTS "Master can manage all empresa_modulos" ON public.empresa_modulos;
DROP POLICY IF EXISTS "Users can read own empresa modulos" ON public.empresa_modulos;
DROP POLICY IF EXISTS "Isolamento empresa_modulos" ON public.empresa_modulos;
DROP POLICY IF EXISTS "Master manage empresa_modulos" ON public.empresa_modulos;

CREATE POLICY "Isolamento empresa_modulos"
  ON public.empresa_modulos FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Master manage empresa_modulos"
  ON public.empresa_modulos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- 9. PROFILES
DROP POLICY IF EXISTS "Admins can read empresa profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Isolamento profiles read" ON public.profiles;
DROP POLICY IF EXISTS "Profile self update" ON public.profiles;

-- User reads own profile
CREATE POLICY "Profile self read"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admin reads all profiles from same empresa
CREATE POLICY "Admin read empresa profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()));

-- Master reads all profiles
CREATE POLICY "Master read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role));

-- User updates own profile
CREATE POLICY "Profile self update"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 10. USER_ROLES
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Roles self read" ON public.user_roles;
DROP POLICY IF EXISTS "Admin manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Master manage roles" ON public.user_roles;

-- User reads own roles
CREATE POLICY "Roles self read"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin manages roles in same empresa
CREATE POLICY "Admin manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()));

-- Master manages all roles
CREATE POLICY "Master manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));
