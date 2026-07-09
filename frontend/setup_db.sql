-- Tabela de Perfis (usuários)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  cpf text unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para perfis
alter table public.profiles enable row level security;
create policy "Usuários podem ler seus próprios perfis" on public.profiles for select using (auth.uid() = id);
create policy "Usuários podem atualizar seus próprios perfis" on public.profiles for update using (auth.uid() = id);

-- Trigger para criar perfil automaticamente (opcional, pode ser feito via código)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, cpf)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'cpf');
  return new;
end;
$$ language plpgsql security definer;

-- Associar a trigger caso não exista
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tabela da Grade Diária
create table if not exists public.daily_schedule (
  id serial primary key,
  schedule_date date unique not null,
  total_duration_seconds integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Itens da Grade
create table if not exists public.schedule_items (
  id serial primary key,
  daily_schedule_id integer references public.daily_schedule on delete cascade not null,
  video_url text not null,
  title text not null,
  cover_url text,
  start_time_seconds integer not null, -- Segundos a partir da meia-noite (0 a 86399)
  duration_seconds integer not null,
  sort_order integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Catálogo de Filmes / VOD
create table if not exists public.movies_catalog (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  cover_url text not null,
  video_url text not null,
  duration_seconds integer,
  category text, -- Filme, Série, etc
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Permitir leitura pública (RLS)
alter table public.daily_schedule enable row level security;
create policy "Leitura publica da grade diaria" on public.daily_schedule for select using (true);
create policy "Admin pode tudo grade" on public.daily_schedule using (true);

alter table public.schedule_items enable row level security;
create policy "Leitura publica dos itens da grade" on public.schedule_items for select using (true);
create policy "Admin pode tudo itens" on public.schedule_items using (true);

alter table public.movies_catalog enable row level security;
create policy "Leitura publica dos filmes" on public.movies_catalog for select using (true);
create policy "Admin pode tudo filmes" on public.movies_catalog using (true);

-- Assegurar que a tabela broadcast_control possui os campos necessários (já deve existir, mas para garantir)
create table if not exists public.broadcast_control (
  id integer primary key default 1,
  is_live boolean default false,
  live_url text,
  watermark_url text,
  active_banner text,
  active_poll_question text,
  active_poll_options text[]
);
