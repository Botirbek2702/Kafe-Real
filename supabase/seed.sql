-- Test uchun namunaviy menyu
insert into public.categories (name, sort_order) values
  ('Milliy taomlar', 1),
  ('Salatlar', 2),
  ('Ichimliklar', 3);

insert into public.products (category_id, name, description, price) values
  (1, 'Osh', 'To''y oshi, 1 porsiya', 35000),
  (1, 'Lag''mon', 'Qo''l lag''mon', 30000),
  (1, 'Manti', '5 dona', 28000),
  (2, 'Achchiq-chuchuk', 'Pomidor va piyoz', 12000),
  (3, 'Choy', 'Ko''k choy, choynak', 5000),
  (3, 'Coca-Cola 1L', null, 12000);
