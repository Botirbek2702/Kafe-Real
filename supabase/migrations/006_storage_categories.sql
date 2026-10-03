-- 006_storage_categories.sql

-- Kategoriya qo'shish imkoniyati (agar RLS bo'lsa)
create policy "cashier insert categories" on public.categories for insert to authenticated with check (true);
create policy "cashier update categories" on public.categories for update to authenticated using (true) with check (true);
create policy "cashier delete categories" on public.categories for delete to authenticated using (true);

-- Rasmlar uchun Storage Bucket
insert into storage.buckets (id, name, public) 
values ('menu', 'menu', true)
on conflict (id) do nothing;

create policy "Public Access to menu bucket" 
on storage.objects for select 
using ( bucket_id = 'menu' );

create policy "Authenticated users can upload" 
on storage.objects for insert 
to authenticated 
with check ( bucket_id = 'menu' );

create policy "Authenticated users can update" 
on storage.objects for update 
to authenticated 
using ( bucket_id = 'menu' );

create policy "Authenticated users can delete" 
on storage.objects for delete 
to authenticated 
using ( bucket_id = 'menu' );
