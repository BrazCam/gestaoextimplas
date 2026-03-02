
-- ============================================
-- FIX: Convert ALL restrictive policies to PERMISSIVE
-- Root cause: RESTRICTIVE policies cannot grant access,
-- they can only narrow it. Without a PERMISSIVE policy, all access is denied.
-- ============================================

-- LOCATIONS
DROP POLICY IF EXISTS "Isolamento por empresa locations" ON public.locations;
CREATE POLICY "Isolamento por empresa locations" ON public.locations
  FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- EXTINGUISHERS
DROP POLICY IF EXISTS "Isolamento por empresa extinguishers" ON public.extinguishers;
CREATE POLICY "Isolamento por empresa extinguishers" ON public.extinguishers
  FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- HYDRANTS
DROP POLICY IF EXISTS "Isolamento por empresa hydrants" ON public.hydrants;
CREATE POLICY "Isolamento por empresa hydrants" ON public.hydrants
  FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- ALARMS
DROP POLICY IF EXISTS "Isolamento por empresa alarms" ON public.alarms;
CREATE POLICY "Isolamento por empresa alarms" ON public.alarms
  FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- LIGHTING
DROP POLICY IF EXISTS "Isolamento por empresa lighting" ON public.lighting;
CREATE POLICY "Isolamento por empresa lighting" ON public.lighting
  FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- FLOORPLANS
DROP POLICY IF EXISTS "Isolamento por empresa floorplans" ON public.floorplans;
CREATE POLICY "Isolamento por empresa floorplans" ON public.floorplans
  FOR ALL TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- EMPRESAS: public read must be PERMISSIVE
DROP POLICY IF EXISTS "Public read empresa by domain" ON public.empresas;
CREATE POLICY "Public read empresa by domain" ON public.empresas
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Master manage empresas" ON public.empresas;
CREATE POLICY "Master manage empresas" ON public.empresas
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- PROFILES
DROP POLICY IF EXISTS "Profile self read" ON public.profiles;
CREATE POLICY "Profile self read" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admin read empresa profiles" ON public.profiles;
CREATE POLICY "Admin read empresa profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()));

DROP POLICY IF EXISTS "Master read all profiles" ON public.profiles;
CREATE POLICY "Master read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role));

DROP POLICY IF EXISTS "Profile self update" ON public.profiles;
CREATE POLICY "Profile self update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- USER_ROLES
DROP POLICY IF EXISTS "Roles self read" ON public.user_roles;
CREATE POLICY "Roles self read" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin manage roles" ON public.user_roles;
CREATE POLICY "Admin manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()));

DROP POLICY IF EXISTS "Master manage roles" ON public.user_roles;
CREATE POLICY "Master manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- EMPRESA_MODULOS
DROP POLICY IF EXISTS "Isolamento empresa_modulos" ON public.empresa_modulos;
CREATE POLICY "Isolamento empresa_modulos" ON public.empresa_modulos
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));

DROP POLICY IF EXISTS "Master manage empresa_modulos" ON public.empresa_modulos;
CREATE POLICY "Master manage empresa_modulos" ON public.empresa_modulos
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));
