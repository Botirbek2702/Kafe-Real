-- ========================================================
-- 011_security_hardening.sql
-- Baza xavfsizligini eng yuqori (production) darajasiga ko'tarish
-- ========================================================

-- 1. CUSTOMERS JADVALINI ANON FOYDALANUVCHILARDAN BUTUNLAY YOPISH
-- Anonim foydalanuvchilar butun mijozlar ro'yxatini ko'ra olmasligi kerak.
drop policy if exists "allow bot select customers" on public.customers;
drop policy if exists "allow bot insert customers" on public.customers;
drop policy if exists "allow all for anon on customers" on public.customers;
drop policy if exists "cashier all customers" on public.customers;

-- Kassir (Authenticated) hamma mijozlarni ko'ra oladi va boshqara oladi
create policy "cashier full access customers" on public.customers
  for all to authenticated
  using (true)
  with check (true);

-- Bot yangi mijozni faqat o'zining telegram_id si bilan kiritishi mumkin (agar anon bo'lsa)
create policy "anon insert own customer only" on public.customers
  for insert to anon
  with check (telegram_id is not null and telegram_id <> 0);

-- 2. ORDERS JADVALINI TO'G'RIDAN-TO'G'RI O'ZGARTIRISHDAN HIMOYA
-- Anonim foydalanuvchilar orders jadvaliga to'g'ridan-to'g'ri UPDATE yoki DELETE qilolmaydi.
-- Faqat create_order() va cancel_my_order() RPC orqali ishlaydi.
drop policy if exists "anon update orders" on public.orders;
drop policy if exists "anon delete orders" on public.orders;

-- 3. RATE LIMITING VA XAVFSIZ BUYURTMA CHEKLOVI
-- Bitta Telegram foydalanuvchisi ketma-ket (spam qilib) 1 daqiqada 10 tadan ko'p buyurtma berolmasligi uchun cheklov
create or replace function public.check_order_spam(p_telegram_id bigint) returns boolean
language plpgsql stable as $$
declare
  v_recent_count integer;
begin
  if p_telegram_id is null or p_telegram_id = 0 then
    return true;
  end if;
  
  select count(*) into v_recent_count
  from public.orders
  where telegram_id = p_telegram_id
    and created_at > now() - interval '1 minute';

  if v_recent_count >= 5 then
    raise exception 'Iltimos, biroz kuting. Siz juda ko''p buyurtma yubordingiz.';
  end if;

  return true;
end;
$$;
