
-- Allow anon users to read empresas (needed for login domain identification)
CREATE POLICY "Anon can read empresas for login" ON public.empresas FOR SELECT TO anon USING (true);
