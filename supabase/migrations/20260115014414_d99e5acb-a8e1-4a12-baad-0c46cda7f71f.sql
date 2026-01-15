-- Adicionar campo de exigência de equipamento na tabela locations
ALTER TABLE public.locations 
ADD COLUMN exigencia text NULL;

-- Adicionar campo de coordenadas na tabela locations para posicionamento no mapa
ALTER TABLE public.locations 
ADD COLUMN coordX numeric NULL,
ADD COLUMN coordY numeric NULL,
ADD COLUMN floorPlanId text NULL;