-- =========================================================
-- 002_storage_and_menu.sql
-- 1) Ovqat rasmlari uchun "menu" ombori (Storage bucket)
-- 2) Test menyuni o'chirib, haqiqiy kategoriyalarni qo'shish
-- Supabase -> SQL Editor da ishga tushiring
-- =========================================================

-- 1. Rasm ombori (hamma ko'ra oladi, faqat kassir yuklay oladi)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu', 'menu', true, 2097152, array['image/webp','image/png','image/jpeg'])
on conflict (id) do nothing;

create policy "menu images public read"
  on storage.objects for select
  using (bucket_id = 'menu');

create policy "menu images cashier insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu');

create policy "menu images cashier update"
  on storage.objects for update to authenticated
  using (bucket_id = 'menu');

create policy "menu images cashier delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu');

-- 2. Mahsulot nomi takrorlanmasin (skript upsert qilishi uchun kerak)
alter table public.products add constraint products_name_key unique (name);

-- 3. Test menyuni tozalash (hali buyurtmalar yo'q)
delete from public.products;
delete from public.categories;

insert into public.categories (name, sort_order) values
  ('Shashliklar', 1),
  ('Issiq taomlar', 2),
  ('Tovuq taomlari', 3),
  ('Baraklar', 4);
