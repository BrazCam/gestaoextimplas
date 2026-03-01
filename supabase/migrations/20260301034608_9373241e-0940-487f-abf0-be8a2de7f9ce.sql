
-- Fix ALL RLS policies to be PERMISSIVE instead of RESTRICTIVE
-- This affects: locations, extinguishers, alarms, hydrants, lighting, floorplans, empresa_modulos, user_roles, empresas, profiles

-- ============ LOCATIONS ============
DROP POLICY IF EXISTS "Users can read own empresa locations" ON public.locations;
DROP POLICY IF EXISTS "Users can insert own empresa locations" ON public.locations;
DROP POLICY IF EXISTS "Users can update own empresa locations" ON public.locations;
DROP POLICY IF EXISTS "Users can delete own empresa locations" ON public.locations;

CREATE POLICY "Users can read own empresa locations" ON public.locations FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa locations" ON public.locations FOR INSERT TO authenticated WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa locations" ON public.locations FOR UPDATE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa locations" ON public.locations FOR DELETE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));

-- ============ EXTINGUISHERS ============
DROP POLICY IF EXISTS "Users can read own empresa extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can insert own empresa extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can update own empresa extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can delete own empresa extinguishers" ON public.extinguishers;

CREATE POLICY "Users can read own empresa extinguishers" ON public.extinguishers FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa extinguishers" ON public.extinguishers FOR INSERT TO authenticated WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa extinguishers" ON public.extinguishers FOR UPDATE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa extinguishers" ON public.extinguishers FOR DELETE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));

-- ============ ALARMS ============
DROP POLICY IF EXISTS "Users can read own empresa alarms" ON public.alarms;
DROP POLICY IF EXISTS "Users can insert own empresa alarms" ON public.alarms;
DROP POLICY IF EXISTS "Users can update own empresa alarms" ON public.alarms;
DROP POLICY IF EXISTS "Users can delete own empresa alarms" ON public.alarms;

CREATE POLICY "Users can read own empresa alarms" ON public.alarms FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa alarms" ON public.alarms FOR INSERT TO authenticated WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa alarms" ON public.alarms FOR UPDATE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa alarms" ON public.alarms FOR DELETE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));

-- ============ HYDRANTS ============
DROP POLICY IF EXISTS "Users can read own empresa hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Users can insert own empresa hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Users can update own empresa hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Users can delete own empresa hydrants" ON public.hydrants;

CREATE POLICY "Users can read own empresa hydrants" ON public.hydrants FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa hydrants" ON public.hydrants FOR INSERT TO authenticated WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa hydrants" ON public.hydrants FOR UPDATE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa hydrants" ON public.hydrants FOR DELETE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));

-- ============ LIGHTING ============
DROP POLICY IF EXISTS "Users can read own empresa lighting" ON public.lighting;
DROP POLICY IF EXISTS "Users can insert own empresa lighting" ON public.lighting;
DROP POLICY IF EXISTS "Users can update own empresa lighting" ON public.lighting;
DROP POLICY IF EXISTS "Users can delete own empresa lighting" ON public.lighting;

CREATE POLICY "Users can read own empresa lighting" ON public.lighting FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa lighting" ON public.lighting FOR INSERT TO authenticated WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa lighting" ON public.lighting FOR UPDATE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa lighting" ON public.lighting FOR DELETE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));

-- ============ FLOORPLANS ============
DROP POLICY IF EXISTS "Users can read own empresa floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Users can insert own empresa floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Users can update own empresa floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Users can delete own empresa floorplans" ON public.floorplans;

CREATE POLICY "Users can read own empresa floorplans" ON public.floorplans FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa floorplans" ON public.floorplans FOR INSERT TO authenticated WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa floorplans" ON public.floorplans FOR UPDATE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa floorplans" ON public.floorplans FOR DELETE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));

-- ============ EMPRESA_MODULOS ============
DROP POLICY IF EXISTS "Users can read own empresa modulos" ON public.empresa_modulos;
DROP POLICY IF EXISTS "Master can manage all empresa_modulos" ON public.empresa_modulos;

CREATE POLICY "Users can read own empresa modulos" ON public.empresa_modulos FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Master can manage all empresa_modulos" ON public.empresa_modulos FOR ALL TO authenticated USING (has_role(auth.uid(), 'master'::app_role));

-- ============ USER_ROLES ============
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ EMPRESAS ============
DROP POLICY IF EXISTS "Users can read their own empresa" ON public.empresas;
DROP POLICY IF EXISTS "Master can insert empresas" ON public.empresas;
DROP POLICY IF EXISTS "Master can update empresas" ON public.empresas;
DROP POLICY IF EXISTS "Master can delete empresas" ON public.empresas;

CREATE POLICY "Users can read their own empresa" ON public.empresas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Master can insert empresas" ON public.empresas FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "Master can update empresas" ON public.empresas FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "Master can delete empresas" ON public.empresas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'master'::app_role));

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read empresa profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can read empresa profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
