-- Script de Atualização (Denúncias 2.0)

-- 1. Adicionando as novas colunas na tabela principal
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS protocol_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0;

-- 2. Tabela de comentários sociais
CREATE TABLE IF NOT EXISTS public.report_comments (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES public.reports(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
