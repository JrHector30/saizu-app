-- RESET TOTAL (Borrador defensivo para empezar limpios)
DROP TABLE IF EXISTS public.sizes_data CASCADE;
DROP TABLE IF EXISTS public.outfit_profiles CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 1. Tabla de Perfiles Maestros (Auth y Selección de Género)
CREATE TABLE public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    outfit_mode TEXT NOT NULL CHECK (outfit_mode IN ('ÉL', 'ELLA')), 
    profile_name TEXT NOT NULL, 
    is_public BOOLEAN DEFAULT false,
    saizu_id TEXT UNIQUE, -- Ej. SAI-A4B2
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_owner UNIQUE(owner_id)
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dueños ven sus user_profiles" ON public.user_profiles FOR SELECT USING (auth.uid() = owner_id);
-- Permitimos que otros puedan buscar user_profiles por saizu_id para enviar peticiones
CREATE POLICY "Visibilidad publica user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Insertar profiles a dueños" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Mutación profiles a dueños" ON public.user_profiles FOR ALL USING (auth.uid() = owner_id);

-- 2. Tabla de Amistades (Conexiones)
CREATE TABLE public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(requester_id, receiver_id) -- No duplicar peticiones entre los mismos dos
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven sus friendships" ON public.friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Usuarios pueden enviar requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Usuarios pueden aceptar/borrar" ON public.friendships FOR ALL USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- 3. Tabla Secundaria: Perfiles de Ropa Dinámicos
CREATE TABLE public.outfit_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.outfit_profiles ENABLE ROW LEVEL SECURITY;
-- Ver perfiles propios O perfiles de alguien con quien hay una amistad 'accepted'
CREATE POLICY "Ver outfit_profiles" ON public.outfit_profiles FOR SELECT USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM public.friendships f 
    WHERE f.status = 'accepted' AND 
    ((f.requester_id = auth.uid() AND f.receiver_id = outfit_profiles.owner_id) OR
     (f.receiver_id = auth.uid() AND f.requester_id = outfit_profiles.owner_id))
  )
);
CREATE POLICY "Insertar outfit profiles a dueños" ON public.outfit_profiles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Mutación outfit profiles a dueños" ON public.outfit_profiles FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Eliminar outfit profiles a dueños" ON public.outfit_profiles FOR DELETE USING (auth.uid() = owner_id);


-- 4. Tabla Terciaria: Datos de Prendas vinculadas a un Outfit Profile
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
-- Ver items propios O items de alguien con quien hay amistad 'accepted'
CREATE POLICY "Lectura sizes_data" ON public.sizes_data FOR SELECT USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM public.friendships f 
    WHERE f.status = 'accepted' AND 
    ((f.requester_id = auth.uid() AND f.receiver_id = sizes_data.owner_id) OR
     (f.receiver_id = auth.uid() AND f.requester_id = sizes_data.owner_id))
  )
);
CREATE POLICY "Mutacion sizes_data dueños" ON public.sizes_data FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Eliminar sizes_data dueños" ON public.sizes_data FOR DELETE USING (auth.uid() = owner_id);

-- 5. Configurar Realtime
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
CREATE PUBLICATION supabase_realtime FOR TABLE sizes_data, outfit_profiles, friendships;

-- 6. Storage Bucket (saizu-gallery)
INSERT INTO storage.buckets (id, name, public) VALUES ('saizu-gallery', 'saizu-gallery', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Lectura publica bucket" ON storage.objects FOR SELECT USING (bucket_id = 'saizu-gallery');
CREATE POLICY "Inserción a bucket a auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'saizu-gallery' AND auth.role() = 'authenticated');
