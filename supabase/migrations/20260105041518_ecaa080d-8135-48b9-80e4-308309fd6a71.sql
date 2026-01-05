-- Criar tabela de locais para realocação
CREATE TABLE public.locations (
    id text NOT NULL PRIMARY KEY,
    nome text NOT NULL,
    setor text,
    sede text DEFAULT 'Matriz',
    created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para locais (acesso público para este sistema interno)
CREATE POLICY "Allow public read locations" 
ON public.locations FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert locations" 
ON public.locations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update locations" 
ON public.locations FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete locations" 
ON public.locations FOR DELETE 
USING (true);

-- Adicionar campo codigoBarras à tabela extinguishers
ALTER TABLE public.extinguishers ADD COLUMN IF NOT EXISTS "codigoBarras" text;

-- Adicionar campo locationId às tabelas de equipamentos
ALTER TABLE public.extinguishers ADD COLUMN IF NOT EXISTS "locationId" text;
ALTER TABLE public.alarms ADD COLUMN IF NOT EXISTS "locationId" text;
ALTER TABLE public.hydrants ADD COLUMN IF NOT EXISTS "locationId" text;
ALTER TABLE public.lighting ADD COLUMN IF NOT EXISTS "locationId" text;

-- Inserir alguns locais iniciais de exemplo
INSERT INTO public.locations (id, nome, setor, sede) VALUES
('LOC-001', 'Corredor Administrativo', 'Bloco A', 'Matriz'),
('LOC-002', 'Sala de Servidores', 'TI', 'Matriz'),
('LOC-003', 'Portaria Principal', 'Acesso', 'Matriz'),
('LOC-004', 'Corredor Térreo', 'Geral', 'Matriz');