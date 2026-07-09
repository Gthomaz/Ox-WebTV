-- Tabelas para o módulo OX TV Denuncias

-- 1. Reports (Denúncias)
CREATE TABLE IF NOT EXISTS public.reports (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status TEXT DEFAULT 'Pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Report Media (Fotos e vídeos)
CREATE TABLE IF NOT EXISTS public.report_media (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES public.reports(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Report Notes (Anotações internas das autoridades)
CREATE TABLE IF NOT EXISTS public.report_notes (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES public.reports(id) ON DELETE CASCADE,
    user_id INTEGER,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
