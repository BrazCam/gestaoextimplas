-- Create empresa_modulos table to track which modules each empresa has access to
CREATE TABLE public.empresa_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  modulo text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, modulo)
);

-- Enable RLS
ALTER TABLE public.empresa_modulos ENABLE ROW LEVEL SECURITY;

-- RLS policies for empresa_modulos
CREATE POLICY "Master can manage all empresa_modulos"
  ON public.empresa_modulos
  FOR ALL
  USING (has_role(auth.uid(), 'master'));

CREATE POLICY "Users can read own empresa modulos"
  ON public.empresa_modulos
  FOR SELECT
  USING (empresa_id = get_user_empresa_id(auth.uid()));

-- Update master user role from 'admin' to 'master'
UPDATE public.user_roles 
SET role = 'master' 
WHERE user_id = '35255651-72cc-4caf-83c0-60f3c87e96d8';

-- Add RLS policy for master to manage empresas
CREATE POLICY "Master can insert empresas"
  ON public.empresas
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'master'));

CREATE POLICY "Master can update empresas"
  ON public.empresas
  FOR UPDATE
  USING (has_role(auth.uid(), 'master'));

CREATE POLICY "Master can delete empresas"
  ON public.empresas
  FOR DELETE
  USING (has_role(auth.uid(), 'master'));