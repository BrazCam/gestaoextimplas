-- Criar tabela de extintores
CREATE TABLE public.extinguishers (
    id TEXT PRIMARY KEY,
    sede TEXT DEFAULT 'Matriz',
    localizacao TEXT,
    tipo TEXT DEFAULT 'Pó Químico ABC',
    capacidade TEXT DEFAULT '4kg',
    marca TEXT,
    fabricacao TEXT,
    "numeroCilindro" TEXT,
    "ultimaManutencao" DATE,
    "proximaManutencao" DATE,
    "testeHidrostatico" DATE,
    "ultimaVistoria" DATE,
    "proximaVistoria" DATE,
    status TEXT DEFAULT 'ok',
    "clientId" TEXT DEFAULT 'cli_001',
    historico JSONB DEFAULT '[]'::jsonb,
    "fotoLocal" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de alarmes
CREATE TABLE public.alarms (
    id TEXT PRIMARY KEY,
    sede TEXT DEFAULT 'Matriz',
    local TEXT,
    tipo TEXT DEFAULT 'Detector de Fumaça',
    marca TEXT,
    "anoFabricacao" TEXT,
    status TEXT DEFAULT 'ativo',
    "ultimoTeste" DATE,
    obs TEXT,
    historico JSONB DEFAULT '[]'::jsonb,
    "fotoLocal" TEXT,
    "ultimaVistoria" DATE,
    "proximaVistoria" DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de mangueiras/hidrantes
CREATE TABLE public.hydrants (
    id TEXT PRIMARY KEY,
    sede TEXT DEFAULT 'Matriz',
    local TEXT,
    fabricante TEXT,
    "anoFabricacao" TEXT,
    polegada TEXT DEFAULT '1.1/2',
    tipo TEXT DEFAULT 'Tipo 1',
    comprimento TEXT DEFAULT '15m',
    "ultimoTesteHidro" DATE,
    "proximoTesteHidro" DATE,
    "ultimaVistoria" DATE,
    "proximaVistoria" DATE,
    status TEXT DEFAULT 'ok',
    historico JSONB DEFAULT '[]'::jsonb,
    "fotoLocal" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de iluminação de emergência
CREATE TABLE public.lighting (
    id TEXT PRIMARY KEY,
    sede TEXT DEFAULT 'Matriz',
    local TEXT,
    tipo TEXT DEFAULT 'Bloco Autônomo',
    "anoFabricacao" TEXT,
    autonomia TEXT DEFAULT '2h',
    bateria TEXT DEFAULT 'ok',
    status TEXT DEFAULT 'ok',
    teste DATE,
    historico JSONB DEFAULT '[]'::jsonb,
    "fotoLocal" TEXT,
    "ultimaVistoria" DATE,
    "proximaVistoria" DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (mas com políticas públicas para este sistema)
ALTER TABLE public.extinguishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lighting ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para leitura (sistema usa autenticação mock)
CREATE POLICY "Allow public read extinguishers" ON public.extinguishers FOR SELECT USING (true);
CREATE POLICY "Allow public insert extinguishers" ON public.extinguishers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update extinguishers" ON public.extinguishers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete extinguishers" ON public.extinguishers FOR DELETE USING (true);

CREATE POLICY "Allow public read alarms" ON public.alarms FOR SELECT USING (true);
CREATE POLICY "Allow public insert alarms" ON public.alarms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update alarms" ON public.alarms FOR UPDATE USING (true);
CREATE POLICY "Allow public delete alarms" ON public.alarms FOR DELETE USING (true);

CREATE POLICY "Allow public read hydrants" ON public.hydrants FOR SELECT USING (true);
CREATE POLICY "Allow public insert hydrants" ON public.hydrants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update hydrants" ON public.hydrants FOR UPDATE USING (true);
CREATE POLICY "Allow public delete hydrants" ON public.hydrants FOR DELETE USING (true);

CREATE POLICY "Allow public read lighting" ON public.lighting FOR SELECT USING (true);
CREATE POLICY "Allow public insert lighting" ON public.lighting FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update lighting" ON public.lighting FOR UPDATE USING (true);
CREATE POLICY "Allow public delete lighting" ON public.lighting FOR DELETE USING (true);