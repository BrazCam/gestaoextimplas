
-- =============================================
-- AUDITORIA COMPLETA: Recriar TODAS as policies como PERMISSIVE
-- O problema: todas estavam RESTRICTIVE (que só restringe, nunca concede acesso)
-- =============================================

-- 1. LOCATIONS - Drop e recriar como PERMISSIVE
DROP POLICY IF EXISTS "Isolamento por empresa locations" ON public.locations;
CREATE POLICY "Isolamento por empresa locations" ON public.locations
AS PERMISSIVE
FOR ALL TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 2. EXTINGUISHERS
DROP POLICY IF EXISTS "Isolamento por empresa extinguishers" ON public.extinguishers;
CREATE POLICY "Isolamento por empresa extinguishers" ON public.extinguishers
AS PERMISSIVE
FOR ALL TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 3. ALARMS
DROP POLICY IF EXISTS "Isolamento por empresa alarms" ON public.alarms;
CREATE POLICY "Isolamento por empresa alarms" ON public.alarms
AS PERMISSIVE
FOR ALL TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 4. HYDRANTS
DROP POLICY IF EXISTS "Isolamento por empresa hydrants" ON public.hydrants;
CREATE POLICY "Isolamento por empresa hydrants" ON public.hydrants
AS PERMISSIVE
FOR ALL TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 5. LIGHTING
DROP POLICY IF EXISTS "Isolamento por empresa lighting" ON public.lighting;
CREATE POLICY "Isolamento por empresa lighting" ON public.lighting
AS PERMISSIVE
FOR ALL TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 6. FLOORPLANS
DROP POLICY IF EXISTS "Isolamento por empresa floorplans" ON public.floorplans;
CREATE POLICY "Isolamento por empresa floorplans" ON public.floorplans
AS PERMISSIVE
FOR ALL TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

-- 7. EMPRESAS - leitura pública + master gerencia
DROP POLICY IF EXISTS "Public read empresa by domain" ON public.empresas;
CREATE POLICY "Public read empresa by domain" ON public.empresas
AS PERMISSIVE
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Master manage empresas" ON public.empresas;
CREATE POLICY "Master manage empresas" ON public.empresas
AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- 8. EMPRESA_MODULOS
DROP POLICY IF EXISTS "Isolamento empresa_modulos" ON public.empresa_modulos;
CREATE POLICY "Isolamento empresa_modulos" ON public.empresa_modulos
AS PERMISSIVE
FOR SELECT TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

DROP POLICY IF EXISTS "Master manage empresa_modulos" ON public.empresa_modulos;
CREATE POLICY "Master manage empresa_modulos" ON public.empresa_modulos
AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- 9. PROFILES
DROP POLICY IF EXISTS "Profile self read" ON public.profiles;
CREATE POLICY "Profile self read" ON public.profiles
AS PERMISSIVE
FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Admin read empresa profiles" ON public.profiles;
CREATE POLICY "Admin read empresa profiles" ON public.profiles
AS PERMISSIVE
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()));

DROP POLICY IF EXISTS "Master read all profiles" ON public.profiles;
CREATE POLICY "Master read all profiles" ON public.profiles
AS PERMISSIVE
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'master'::app_role));

DROP POLICY IF EXISTS "Profile self update" ON public.profiles;
CREATE POLICY "Profile self update" ON public.profiles
AS PERMISSIVE
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 10. USER_ROLES
DROP POLICY IF EXISTS "Roles self read" ON public.user_roles;
CREATE POLICY "Roles self read" ON public.user_roles
AS PERMISSIVE
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin manage roles" ON public.user_roles;
CREATE POLICY "Admin manage roles" ON public.user_roles
AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()));

DROP POLICY IF EXISTS "Master manage roles" ON public.user_roles;
CREATE POLICY "Master manage roles" ON public.user_roles
AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));
