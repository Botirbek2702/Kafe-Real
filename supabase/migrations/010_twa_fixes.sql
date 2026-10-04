-- 010_twa_fixes.sql
-- Mini app uchun: buyurtmalarim, bekor qilish, tushunarli xatolar, ish vaqti,
-- tayyor bo'lish vaqti, bekor qilinganda qoldiqni qaytarish, mijozlar ma'lumotini yopish.

-- ============ 1. Sozlamalar ============
-- Ish vaqti (Toshkent vaqti). O'zgartirish kerak bo'lsa shu yerda.
create or replace function public.kafe_is_open() returns boolean
language sql stable as $$
  select (now() at time zone 'Asia/Tashkent')::time between time '10:00' and time '23:00';
$$;

-- "18:00" yoki "13:00 da" kabi matndan vaqtni ajratib, hali yetib kelmaganini tekshiradi
create or replace function public.kafe_not_ready_yet(p_ready_time text) returns boolean
language plpgsql stable as $$
declare m text[];
begin
  if p_ready_time is null then return false; end if;
  m := regexp_match(p_ready_time, '(\d{1,2})[:.](\d{2})');
  if m is null then return false; end if;
  return (now() at time zone 'Asia/Tashkent')::time < make_time(m[1]::int, m[2]::int, 0);
end;
$$;

-- ============ 2. order_items: variant va qo'shimchalarni alohida saqlash (tahrirlash uchun) ============
alter table public.order_items add column if not exists variant text;
alter table public.order_items add column if not exists addons jsonb;

-- ============ 3. create_order (yangi versiya) ============
create or replace function public.create_order(
  p_telegram_id   bigint,
  p_customer_name text,
  p_phone         text,
  p_address       text,
  p_comment       text,
  p_order_type    text,
  p_items         jsonb
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id bigint;
  v_total    integer := 0;
  v_item     jsonb;
  v_product  public.products%rowtype;
  v_qty      integer;
  v_variant_name text;
  v_addons   jsonb;
  v_final_price integer;
  v_final_name  text;
  v_var      jsonb;
  v_addon    jsonb;
  v_sel      text;
  v_pname    text;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Savatcha bo''sh';
  end if;

  if not public.kafe_is_open() then
    raise exception 'Kafe hozir yopiq. Buyurtmalar 10:00 dan 23:00 gacha qabul qilinadi';
  end if;

  insert into public.orders (telegram_id, customer_name, phone, address, comment, order_type)
  values (p_telegram_id, p_customer_name, p_phone, p_address, p_comment, coalesce(p_order_type, 'delivery'))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item->>'quantity')::int, 1), 1);
    v_variant_name := nullif(v_item->>'variant', '');
    v_addons := v_item->'addons';

    select * into v_product from public.products
     where id = (v_item->>'product_id')::bigint for update;

    if not found then
      raise exception 'Savatdagi bir taom menyudan olib tashlangan. Savatni yangilang';
    end if;
    if not v_product.is_available then
      raise exception '"%" hozircha mavjud emas', v_product.name;
    end if;
    if public.kafe_not_ready_yet(v_product.ready_time) then
      raise exception '"%" hali tayyor emas (% da chiqadi)', v_product.name, v_product.ready_time;
    end if;

    if v_product.stock is not null then
      if v_product.stock < v_qty then
        if v_product.stock <= 0 then
          raise exception '"%" tugab qoldi', v_product.name;
        end if;
        raise exception '"%" dan faqat % ta qoldi', v_product.name, v_product.stock;
      end if;
      update public.products
         set stock = stock - v_qty,
             is_available = case when stock - v_qty <= 0 then false else is_available end
       where id = v_product.id;
    end if;

    v_final_price := v_product.price;
    v_final_name  := v_product.name;

    if v_variant_name is not null and jsonb_typeof(v_product.variants) = 'array' then
      for v_var in select * from jsonb_array_elements(v_product.variants) loop
        if v_var->>'name' = v_variant_name then
          v_final_price := (v_var->>'price')::int;
          v_final_name  := v_product.name || ' (' || v_variant_name || ')';
          exit;
        end if;
      end loop;
    end if;

    if jsonb_typeof(v_addons) = 'array' and jsonb_array_length(v_addons) > 0
       and jsonb_typeof(v_product.addons) = 'array' then
      for v_sel in select * from jsonb_array_elements_text(v_addons) loop
        for v_addon in select * from jsonb_array_elements(v_product.addons) loop
          if v_addon->>'name' = v_sel then
            v_final_price := v_final_price + (v_addon->>'price')::int;
            v_final_name  := v_final_name || ' + ' || v_sel;
            exit;
          end if;
        end loop;
      end loop;
    else
      v_addons := null;
    end if;

    insert into public.order_items (order_id, product_id, name, price, quantity, variant, addons)
    values (v_order_id, v_product.id, v_final_name, v_final_price, v_qty, v_variant_name, v_addons);

    v_total := v_total + v_final_price * v_qty;
  end loop;

  update public.orders set total_price = v_total where id = v_order_id;
  return v_order_id;
end;
$$;
grant execute on function public.create_order(bigint, text, text, text, text, text, jsonb) to anon, authenticated;

-- ============ 4. Mijozning buyurtmalari ============
create or replace function public.get_my_orders(p_telegram_id bigint)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(jsonb_agg(o order by o.created_at desc), '[]'::jsonb)
  from (
    select ord.id, ord.status, ord.total_price, ord.created_at, ord.order_type,
           ord.cancel_reason,
           (select coalesce(jsonb_agg(jsonb_build_object(
                     'product_id', oi.product_id, 'name', oi.name, 'price', oi.price,
                     'quantity', oi.quantity, 'variant', oi.variant, 'addons', oi.addons)), '[]'::jsonb)
              from public.order_items oi where oi.order_id = ord.id) as order_items
    from public.orders ord
    where ord.telegram_id = p_telegram_id
      and p_telegram_id <> 0
    order by ord.created_at desc
    limit 30
  ) o;
$$;
grant execute on function public.get_my_orders(bigint) to anon, authenticated;

-- ============ 5. Mijoz o'z buyurtmasini bekor qilishi (faqat "new" holatida) ============
create or replace function public.cancel_my_order(p_order_id bigint, p_telegram_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
     set status = 'cancelled', cancel_reason = 'Mijoz o''zi bekor qildi'
   where id = p_order_id and telegram_id = p_telegram_id and status = 'new';
  if not found then
    raise exception 'Buyurtmani bekor qilib bo''lmaydi: u allaqachon qabul qilingan';
  end if;
  return true;
end;
$$;
grant execute on function public.cancel_my_order(bigint, bigint) to anon, authenticated;

-- ============ 6. Bekor qilinganda qoldiqni (stock) qaytarish ============
create or replace function public.restore_stock_on_cancel() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.products p
       set stock = p.stock + x.qty,
           is_available = case when p.stock <= 0 then true else p.is_available end
      from (select product_id, sum(quantity) qty from public.order_items
             where order_id = new.id group by product_id) x
     where p.id = x.product_id and p.stock is not null;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_restore_stock on public.orders;
create trigger trg_restore_stock after update of status on public.orders
  for each row execute function public.restore_stock_on_cancel();

-- ============ 7. Mijozlar jadvalini yopish ============
drop policy if exists "allow all for anon on customers" on public.customers;
drop policy if exists "cashier all customers" on public.customers;
create policy "cashier all customers" on public.customers
  for all to authenticated using (true) with check (true);

-- Mini app faqat o'z profilini oladi
create or replace function public.get_customer_profile(p_telegram_id bigint)
returns table(full_name text, phone text)
language sql security definer set search_path = public stable as $$
  select c.full_name, c.phone from public.customers c where c.telegram_id = p_telegram_id and p_telegram_id <> 0;
$$;
grant execute on function public.get_customer_profile(bigint) to anon, authenticated;
