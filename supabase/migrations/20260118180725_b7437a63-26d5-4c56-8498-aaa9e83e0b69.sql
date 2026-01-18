-- Create floorplans table to persist floor plans
CREATE TABLE public.floorplans (
  id text PRIMARY KEY,
  name text NOT NULL,
  sede text DEFAULT 'Matriz',
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.floorplans ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth)
CREATE POLICY "Allow public read floorplans" 
ON public.floorplans 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert floorplans" 
ON public.floorplans 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update floorplans" 
ON public.floorplans 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete floorplans" 
ON public.floorplans 
FOR DELETE 
USING (true);

-- Create storage bucket for floor plan images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('floorplans', 'floorplans', true);

-- Create storage policies for floor plan uploads
CREATE POLICY "Floor plan images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'floorplans');

CREATE POLICY "Anyone can upload floor plan images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'floorplans');

CREATE POLICY "Anyone can update floor plan images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'floorplans');

CREATE POLICY "Anyone can delete floor plan images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'floorplans');