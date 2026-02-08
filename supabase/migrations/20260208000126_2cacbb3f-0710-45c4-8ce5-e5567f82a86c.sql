
-- Drop existing policies and recreate with strict empresa isolation

-- EXTINGUISHERS
DROP POLICY IF EXISTS "Users can read own empresa extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can insert own empresa extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can update own empresa extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can delete own empresa extinguishers" ON public.extinguishers;

CREATE POLICY "Users can read own empresa extinguishers" ON public.extinguishers
  FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can insert own empresa extinguishers" ON public.extinguishers
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa extinguishers" ON public.extinguishers
  FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can delete own empresa extinguishers" ON public.extinguishers
  FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()));

-- ALARMS
DROP POLICY IF EXISTS "Users can read own empresa alarms" ON public.alarms;
DROP POLICY IF EXISTS "Users can insert own empresa alarms" ON public.alarms;
DROP POLICY IF EXISTS "Users can update own empresa alarms" ON public.alarms;
DROP POLICY IF EXISTS "Users can delete own empresa alarms" ON public.alarms;

CREATE POLICY "Users can read own empresa alarms" ON public.alarms
  FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can insert own empresa alarms" ON public.alarms
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa alarms" ON public.alarms
  FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can delete own empresa alarms" ON public.alarms
  FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()));

-- HYDRANTS
DROP POLICY IF EXISTS "Users can read own empresa hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Users can insert own empresa hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Users can update own empresa hydrants" ON public.hydrants;
DROP POLICY IF EXISTS "Users can delete own empresa hydrants" ON public.hydrants;

CREATE POLICY "Users can read own empresa hydrants" ON public.hydrants
  FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can insert own empresa hydrants" ON public.hydrants
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa hydrants" ON public.hydrants
  FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can delete own empresa hydrants" ON public.hydrants
  FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()));

-- LIGHTING
DROP POLICY IF EXISTS "Users can read own empresa lighting" ON public.lighting;
DROP POLICY IF EXISTS "Users can insert own empresa lighting" ON public.lighting;
DROP POLICY IF EXISTS "Users can update own empresa lighting" ON public.lighting;
DROP POLICY IF EXISTS "Users can delete own empresa lighting" ON public.lighting;

CREATE POLICY "Users can read own empresa lighting" ON public.lighting
  FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can insert own empresa lighting" ON public.lighting
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa lighting" ON public.lighting
  FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can delete own empresa lighting" ON public.lighting
  FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()));

-- LOCATIONS
DROP POLICY IF EXISTS "Users can read own empresa locations" ON public.locations;
DROP POLICY IF EXISTS "Users can insert own empresa locations" ON public.locations;
DROP POLICY IF EXISTS "Users can update own empresa locations" ON public.locations;
DROP POLICY IF EXISTS "Users can delete own empresa locations" ON public.locations;

CREATE POLICY "Users can read own empresa locations" ON public.locations
  FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can insert own empresa locations" ON public.locations
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa locations" ON public.locations
  FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can delete own empresa locations" ON public.locations
  FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()));

-- FLOORPLANS
DROP POLICY IF EXISTS "Users can read own empresa floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Users can insert own empresa floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Users can update own empresa floorplans" ON public.floorplans;
DROP POLICY IF EXISTS "Users can delete own empresa floorplans" ON public.floorplans;

CREATE POLICY "Users can read own empresa floorplans" ON public.floorplans
  FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can insert own empresa floorplans" ON public.floorplans
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa floorplans" ON public.floorplans
  FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can delete own empresa floorplans" ON public.floorplans
  FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()));
