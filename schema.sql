-- 1. Tabla de Perfiles Principales
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    outfit_mode TEXT NOT NULL CHECK (outfit_mode IN ('ÉL', 'ELLA')), 
    profile_name TEXT NOT NULL, 
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dueños ven sus user_profiles" ON public.user_profiles FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Lectura publica profiles" ON public.user_profiles FOR SELECT USING (is_public = true);
CREATE POLICY "Insertar profiles a dueños" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Mutación profiles a dueños" ON public.user_profiles FOR ALL USING (auth.uid() = owner_id);

-- 2. Tabla de Datos de Medidas (sizes_data)
CREATE TABLE IF NOT EXISTS public.sizes_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Relacion directa
    category TEXT NOT NULL, -- CASUAL, FORMAL, SPORT...
    zone TEXT NOT NULL, 
    item_id TEXT NOT NULL,
    brand TEXT,
    size_value TEXT,
    image_urls TEXT[] DEFAULT '{}',
    extra_details JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sizes_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura sizes_data dueños" ON public.sizes_data FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Mutacion sizes_data dueños" ON public.sizes_data FOR ALL USING (auth.uid() = owner_id);

-- 3. Storage Bucket (saizu-gallery)
INSERT INTO storage.buckets (id, name, public) VALUES ('saizu-gallery', 'saizu-gallery', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Lectura publica bucket" ON storage.objects FOR SELECT USING (bucket_id = 'saizu-gallery');
CREATE POLICY "Inserción a bucket a auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'saizu-gallery' AND auth.role() = 'authenticated');
