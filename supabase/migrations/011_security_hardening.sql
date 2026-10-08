-- ========================================================
-- 011_security_hardening.sql
-- RED TEAM FIXES: Bazaning barcha zaifliklarini yopish
-- ========================================================

-- [VULN-03]: CUSTOMERS JADVALINI ANON FOYDALANUVCHILARDAN BUTUNLAY YOPISH
drop policy if exists "allow bot select customers" on public.customers;
drop policy if exists "allow bot insert customers" on public.customers;
drop policy if exists "allow all for anon on customers" on public.customers;
drop policy if exists "cashier all customers" on public.customers;
drop policy if exists "cashier full access customers" on public.customers;
drop policy if exists "anon insert own customer only" on public.customers;

-- Kassirlar (Dashboard) to'liq kirishi mumkin
create policy "cashier full access customers" on public.customers
  for all to authenticated
  using (true)
  with check (true);

-- Bot yoki mijoz anonim holda jadvalni SELECT qilolmaydi (o'g'irlab ketolmaydi)
-- Faqat yangi ro'yxatdan o'tishda o'z qatorini kiritishi mumkin:
create policy "anon insert own customer only" on public.customers
  for insert to anon
  with check (telegram_id is not null and telegram_id <> 0);

-- [VULN-02]: BUYURTMANI BEKOR QILISHDAGI MANTIQIY ZAIFLIKNI YOPISH
-- Mijoz buyurtmani faqat "new" holatida VA berilganidan keyin ko'pi bilan 90 soniya ichida bekor qila oladi.
-- Oshpaz pishirishni boshlagandan so'ng bekor qilish uchun kafega qo'ng'iroq qilishi shart!
create or replace function public.cancel_my_order(p_order_id bigint, p_telegram_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated boolean := false;
  v_created_at timestamptz;
  v_status text;
begin
  select created_at, status into v_created_at, v_status
  from public.orders
  where id = p_order_id and telegram_id = p_telegram_id;

  if not found then
    raise exception 'Buyurtma topilmadi yoki sizga tegishli emas';
  end if;

  if v_status <> 'new' then
    raise exception 'Buyurtma allaqachon qabul qilingan yoki tayyorlanmoqda. Bekor qilish uchun kafe bilan bog''laning.';
  end if;

  -- 90 soniyadan oshgan bo'lsa, avtomat bekor qilinmaydi
  if v_created_at < now() - interval '90 seconds' then
    raise exception 'Buyurtma berilganiga 90 soniyadan oshdi. Taom tayyorlanishga tushgan, iltimos kafe bilan bog''laning.';
  end if;

  update public.orders
  set status = 'cancelled', cancel_reason = 'Mijoz tomonidan dastlabki vaqtda bekor qilindi'
  where id = p_order_id and telegram_id = p_telegram_id and status = 'new';

  return true;
end;
$$;
grant execute on function public.cancel_my_order(bigint, bigint) to anon, authenticated;

-- [RATE LIMITING]: SPAM BUYURTMALARGA QARSHI HIMOYA
-- 1 daqiqada 5 tadan ortiq buyurtma berish taqiqlanadi
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
