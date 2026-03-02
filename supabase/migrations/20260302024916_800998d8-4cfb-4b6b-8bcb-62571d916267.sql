
-- =============================================
-- FIX: Recriar TODAS as policies como PERMISSIVE
-- com SELECT/INSERT/UPDATE/DELETE separados
-- =============================================

-- ============ LOCATIONS ============
DROP POLICY IF EXISTS "Isolamento por empresa locations" ON public.locations;
DROP POLICY IF EXISTS "locations_select" ON public.locations;
DROP POLICY IF EXISTS "locations_insert" ON public.locations;
DROP POLICY IF EXISTS "locations_update" ON public.locations;
DROP POLICY IF EXISTS "locations_delete" ON public.locations;
DROP POLICY IF EXISTS "master_locations" ON public.locations;

CREATE POLICY "locations_select" ON public.locations AS PERMISSIVE
FOR SELECT TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "locations_insert" ON public.locations AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "locations_update" ON public.locations AS PERMISSIVE
FOR UPDATE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "locations_delete" ON public.locations AS PERMISSIVE
FOR DELETE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "master_locations" ON public.locations AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- ============ EXTINGUISHERS ============
DROP POLICY IF EXISTS "Isolamento por empresa extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "extinguishers_select" ON public.extinguishers;
DROP POLICY IF EXISTS "extinguishers_insert" ON public.extinguishers;
DROP POLICY IF EXISTS "extinguishers_update" ON public.extinguishers;
DROP POLICY IF EXISTS "extinguishers_delete" ON public.extinguishers;
DROP POLICY IF EXISTS "master_extinguishers" ON public.extinguishers;

CREATE POLICY "extinguishers_select" ON public.extinguishers AS PERMISSIVE
FOR SELECT TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "extinguishers_insert" ON public.extinguishers AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "extinguishers_update" ON public.extinguishers AS PERMISSIVE
FOR UPDATE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "extinguishers_delete" ON public.extinguishers AS PERMISSIVE
FOR DELETE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "master_extinguishers" ON public.extinguishers AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- ============ ALARMS ============
DROP POLICY IF EXISTS "Isolamento por empresa alarms" ON public.alarms;
DROP POLICY IF EXISTS "alarms_select" ON public.alarms;
DROP POLICY IF EXISTS "alarms_insert" ON public.alarms;
DROP POLICY IF EXISTS "alarms_update" ON public.alarms;
DROP POLICY IF EXISTS "alarms_delete" ON public.alarms;
DROP POLICY IF EXISTS "master_alarms" ON public.alarms;

CREATE POLICY "alarms_select" ON public.alarms AS PERMISSIVE
FOR SELECT TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "alarms_insert" ON public.alarms AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "alarms_update" ON public.alarms AS PERMISSIVE
FOR UPDATE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "alarms_delete" ON public.alarms AS PERMISSIVE
FOR DELETE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "master_alarms" ON public.alarms AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- ============ HYDRANTS ============
DROP POLICY IF EXISTS "Isolamento por empresa hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "hydrants_select" ON public.hydrants;
DROP POLICY IF EXISTS "hydrants_insert" ON public.hydrants;
DROP POLICY IF EXISTS "hydrants_update" ON public.hydrants;
DROP POLICY IF EXISTS "hydrants_delete" ON public.hydrants;
DROP POLICY IF EXISTS "master_hydrants" ON public.hydrants;

CREATE POLICY "hydrants_select" ON public.hydrants AS PERMISSIVE
FOR SELECT TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "hydrants_insert" ON public.hydrants AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "hydrants_update" ON public.hydrants AS PERMISSIVE
FOR UPDATE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "hydrants_delete" ON public.hydrants AS PERMISSIVE
FOR DELETE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "master_hydrants" ON public.hydrants AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- ============ LIGHTING ============
DROP POLICY IF EXISTS "Isolamento por empresa lighting" ON public.lighting;
DROP POLICY IF EXISTS "lighting_select" ON public.lighting;
DROP POLICY IF EXISTS "lighting_insert" ON public.lighting;
DROP POLICY IF EXISTS "lighting_update" ON public.lighting;
DROP POLICY IF EXISTS "lighting_delete" ON public.lighting;
DROP POLICY IF EXISTS "master_lighting" ON public.lighting;

CREATE POLICY "lighting_select" ON public.lighting AS PERMISSIVE
FOR SELECT TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "lighting_insert" ON public.lighting AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "lighting_update" ON public.lighting AS PERMISSIVE
FOR UPDATE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "lighting_delete" ON public.lighting AS PERMISSIVE
FOR DELETE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "master_lighting" ON public.lighting AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- ============ FLOORPLANS ============
DROP POLICY IF EXISTS "Isolamento por empresa floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "floorplans_select" ON public.floorplans;
DROP POLICY IF EXISTS "floorplans_insert" ON public.floorplans;
DROP POLICY IF EXISTS "floorplans_update" ON public.floorplans;
DROP POLICY IF EXISTS "floorplans_delete" ON public.floorplans;
DROP POLICY IF EXISTS "master_floorplans" ON public.floorplans;

CREATE POLICY "floorplans_select" ON public.floorplans AS PERMISSIVE
FOR SELECT TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "floorplans_insert" ON public.floorplans AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "floorplans_update" ON public.floorplans AS PERMISSIVE
FOR UPDATE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "floorplans_delete" ON public.floorplans AS PERMISSIVE
FOR DELETE TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "master_floorplans" ON public.floorplans AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- ============ EMPRESAS ============
DROP POLICY IF EXISTS "Public read empresa by domain" ON public.empresas;
DROP POLICY IF EXISTS "Master manage empresas" ON public.empresas;
DROP POLICY IF EXISTS "empresas_public_read" ON public.empresas;
DROP POLICY IF EXISTS "empresas_master" ON public.empresas;

CREATE POLICY "empresas_public_read" ON public.empresas AS PERMISSIVE
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "empresas_master" ON public.empresas AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Profile self read" ON public.profiles;
DROP POLICY IF EXISTS "Admin read empresa profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profile self update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_master" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;

CREATE POLICY "profiles_self_read" ON public.profiles AS PERMISSIVE
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_admin_read" ON public.profiles AS PERMISSIVE
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "profiles_master" ON public.profiles AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "profiles_self_update" ON public.profiles AS PERMISSIVE
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============ USER_ROLES ============
DROP POLICY IF EXISTS "Roles self read" ON public.user_roles;
DROP POLICY IF EXISTS "Admin manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Master manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "roles_self_read" ON public.user_roles;
DROP POLICY IF EXISTS "roles_admin_manage" ON public.user_roles;
DROP POLICY IF EXISTS "roles_master" ON public.user_roles;

CREATE POLICY "roles_self_read" ON public.user_roles AS PERMISSIVE
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "roles_admin_manage" ON public.user_roles AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "roles_master" ON public.user_roles AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- ============ EMPRESA_MODULOS ============
DROP POLICY IF EXISTS "Isolamento empresa_modulos" ON public.empresa_modulos;
DROP POLICY IF EXISTS "Master manage empresa_modulos" ON public.empresa_modulos;
DROP POLICY IF EXISTS "empresa_modulos_read" ON public.empresa_modulos;
DROP POLICY IF EXISTS "empresa_modulos_master" ON public.empresa_modulos;

CREATE POLICY "empresa_modulos_read" ON public.empresa_modulos AS PERMISSIVE
FOR SELECT TO authenticated
USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "empresa_modulos_master" ON public.empresa_modulos AS PERMISSIVE
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));
