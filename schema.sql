-- RESET TOTAL (Borrador defensivo para empezar limpios)
DROP TABLE IF EXISTS public.sizes_data CASCADE;
DROP TABLE IF EXISTS public.outfit_profiles CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 1. Tabla de Perfiles Maestros (Auth y Selección de Género)
CREATE TABLE public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    outfit_mode TEXT NOT NULL CHECK (outfit_mode IN ('ÉL', 'ELLA')), 
    profile_name TEXT NOT NULL, 
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_owner UNIQUE(owner_id) -- Asegurarnos de 1 perfil maestro max por persona
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dueños ven sus user_profiles" ON public.user_profiles FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Lectura publica profiles" ON public.user_profiles FOR SELECT USING (is_public = true);
CREATE POLICY "Insertar profiles a dueños" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Mutación profiles a dueños" ON public.user_profiles FOR ALL USING (auth.uid() = owner_id);


-- 2. Tabla Secundaria: Perfiles de Ropa Dinámicos ("Elegante", "Verano", etc.)
CREATE TABLE public.outfit_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.outfit_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dueños ven sus outfit profiles" ON public.outfit_profiles FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Insertar outfit profiles a dueños" ON public.outfit_profiles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Mutación outfit profiles a dueños" ON public.outfit_profiles FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Eliminar outfit profiles a dueños" ON public.outfit_profiles FOR DELETE USING (auth.uid() = owner_id);


-- 3. Tabla Terciaria: Datos de Prendas vinculadas a un Outfit Profile
CREATE TABLE public.sizes_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.outfit_profiles(id) ON DELETE CASCADE,
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
CREATE POLICY "Eliminar sizes_data dueños" ON public.sizes_data FOR DELETE USING (auth.uid() = owner_id);


-- 4. Storage Bucket (saizu-gallery)
INSERT INTO storage.buckets (id, name, public) VALUES ('saizu-gallery', 'saizu-gallery', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Lectura publica bucket" ON storage.objects FOR SELECT USING (bucket_id = 'saizu-gallery');
CREATE POLICY "Inserción a bucket a auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'saizu-gallery' AND auth.role() = 'authenticated');
