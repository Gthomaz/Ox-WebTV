-- Criar o Bucket 'videos' se não existir
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do update set public = true;

-- Permitir leitura pública dos arquivos
create policy "Public Access to Videos"
on storage.objects for select
using ( bucket_id = 'videos' );

-- Permitir uploads anonimos/autenticados (Ajustar em produção para autenticados)
create policy "Anyone can upload videos"
on storage.objects for insert
with check ( bucket_id = 'videos' );

create policy "Anyone can update their videos"
on storage.objects for update
using ( bucket_id = 'videos' );

create policy "Anyone can delete their videos"
on storage.objects for delete
using ( bucket_id = 'videos' );
