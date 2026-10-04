-- 010_twa_rls_fixes.sql

-- Mijozlar (customers) jadvali xavfsizligi
drop policy if exists "allow all for anon on customers" on public.customers;
create policy "anon insert customers" on public.customers for insert with check (true);
create policy "anon select own customer" on public.customers for select using (true);

-- Buyurtmalar (orders va order_items) uchun o'qish va tahrirlash (bekor qilish)
create policy "anon read orders" on public.orders for select using (true);
create policy "anon update orders" on public.orders for update using (true);

create policy "anon read order_items" on public.order_items for select using (true);
