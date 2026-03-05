
-- =============================================
-- COMPLETE RLS RESET: Drop ALL policies and recreate as PERMISSIVE
-- =============================================

-- DROP ALL existing policies on ALL tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- =============================================
-- EMPRESAS - public select, master manages
-- =============================================
CREATE POLICY "empresas_select_all" ON public.empresas
  AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "empresas_master_all" ON public.empresas
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- =============================================
-- PROFILES
-- =============================================
CREATE POLICY "profiles_self_select" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_self_update" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_select" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "profiles_master_all" ON public.profiles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- =============================================
-- USER_ROLES
-- =============================================
CREATE POLICY "roles_self_select" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "roles_admin_all" ON public.user_roles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "roles_master_all" ON public.user_roles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- =============================================
-- EMPRESA_MODULOS
-- =============================================
CREATE POLICY "modulos_select" ON public.empresa_modulos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "modulos_master_all" ON public.empresa_modulos
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- =============================================
-- LOCATIONS - PERMISSIVE for authenticated users of same empresa
-- =============================================
CREATE POLICY "locations_select" ON public.locations
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "locations_insert" ON public.locations
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "locations_update" ON public.locations
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "locations_delete" ON public.locations
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "locations_master_all" ON public.locations
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- =============================================
-- EXTINGUISHERS
-- =============================================
CREATE POLICY "extinguishers_select" ON public.extinguishers
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "extinguishers_insert" ON public.extinguishers
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "extinguishers_update" ON public.extinguishers
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "extinguishers_delete" ON public.extinguishers
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "extinguishers_master_all" ON public.extinguishers
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- =============================================
-- ALARMS
-- =============================================
CREATE POLICY "alarms_select" ON public.alarms
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "alarms_insert" ON public.alarms
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "alarms_update" ON public.alarms
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "alarms_delete" ON public.alarms
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "alarms_master_all" ON public.alarms
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- =============================================
-- HYDRANTS
-- =============================================
CREATE POLICY "hydrants_select" ON public.hydrants
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "hydrants_insert" ON public.hydrants
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "hydrants_update" ON public.hydrants
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "hydrants_delete" ON public.hydrants
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "hydrants_master_all" ON public.hydrants
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- =============================================
-- LIGHTING
-- =============================================
CREATE POLICY "lighting_select" ON public.lighting
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "lighting_insert" ON public.lighting
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "lighting_update" ON public.lighting
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "lighting_delete" ON public.lighting
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "lighting_master_all" ON public.lighting
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));

-- =============================================
-- FLOORPLANS
-- =============================================
CREATE POLICY "floorplans_select" ON public.floorplans
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "floorplans_insert" ON public.floorplans
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "floorplans_update" ON public.floorplans
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "floorplans_delete" ON public.floorplans
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "floorplans_master_all" ON public.floorplans
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master'::app_role));
