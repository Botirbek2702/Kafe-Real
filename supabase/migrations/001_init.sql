-- =========================================================
-- 001_init.sql — Boshlang'ich baza strukturasi
-- Buni Supabase Dashboard -> SQL Editor da ishga tushiring
-- =========================================================

-- 1. KATEGORIYALAR (Oshlar, Ichimliklar, Salatlar ...)
create table if not exists public.categories (
  id          bigint generated always as identity primary key,
  name        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- 2. MAHSULOTLAR (Menyu)
create table if not exists public.products (
  id            bigint generated always as identity primary key,
  category_id   bigint references public.categories(id) on delete set null,
  name          text not null,
  description   text,
  price         integer not null check (price >= 0),   -- so'mda
  image_url     text,
  is_available  boolean not null default true,         -- "Tugadi" tugmasi
  created_at    timestamptz not null default now()
);

-- 3. BUYURTMALAR
create table if not exists public.orders (
  id             bigint generated always as identity primary key,
  telegram_id    bigint not null,
  customer_name  text,
  phone          text,
  address        text,
  comment        text,
  order_type     text not null default 'delivery'
                 check (order_type in ('delivery','pickup')),
  status         text not null default 'new'
                 check (status in ('new','accepted','cooking','ready','delivered','cancelled')),
  total_price    integer not null default 0 check (total_price >= 0),
  created_at     timestamptz not null default now()
);

-- 4. BUYURTMA TARKIBI
create table if not exists public.order_items (
  id          bigint generated always as identity primary key,
  order_id    bigint not null references public.orders(id) on delete cascade,
  product_id  bigint not null references public.products(id),
  name        text not null,          -- buyurtma paytidagi nom
  price       integer not null,       -- buyurtma paytidagi narx (serverda olinadi)
  quantity    integer not null check (quantity > 0 and quantity <= 50)
);

create index if not exists orders_status_idx     on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- =========================================================
-- XAVFSIZLIK (RLS)
-- =========================================================
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Mijozlar (anon) menyuni faqat O'QIY oladi
create policy "menu read categories" on public.categories for select using (true);
create policy "menu read products"   on public.products   for select using (true);

-- Kassir (tizimga kirgan foydalanuvchi) hamma narsani boshqaradi
create policy "cashier all categories"  on public.categories  for all to authenticated using (true) with check (true);
create policy "cashier all products"    on public.products    for all to authenticated using (true) with check (true);
create policy "cashier all orders"      on public.orders      for all to authenticated using (true) with check (true);
create policy "cashier all order_items" on public.order_items for all to authenticated using (true) with check (true);

-- Eslatma: anon foydalanuvchi orders jadvaliga TO'G'RIDAN-TO'G'RI yoza olmaydi.
-- Buyurtma faqat quyidagi create_order() funksiyasi orqali yaratiladi.

-- =========================================================
-- BUYURTMA YARATISH FUNKSIYASI (narx SERVERDA hisoblanadi)
-- items: [{"product_id": 1, "quantity": 2}, ...]
-- =========================================================
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
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Savatcha bo''sh';
  end if;

  insert into public.orders (telegram_id, customer_name, phone, address, comment, order_type)
  values (p_telegram_id, p_customer_name, p_phone, p_address, p_comment, coalesce(p_order_type, 'delivery'))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;

    select * into v_product from public.products
     where id = (v_item->>'product_id')::bigint and is_available = true;

    if not found then
      raise exception 'Mahsulot topilmadi yoki tugagan: %', v_item->>'product_id';
    end if;

    insert into public.order_items (order_id, product_id, name, price, quantity)
    values (v_order_id, v_product.id, v_product.name, v_product.price, v_qty);

    v_total := v_total + v_product.price * v_qty;
  end loop;

  update public.orders set total_price = v_total where id = v_order_id;
  return v_order_id;
end;
$$;

grant execute on function public.create_order(bigint, text, text, text, text, text, jsonb) to anon, authenticated;

-- =========================================================
-- REALTIME (kassirga yangi buyurtma darhol yetib borishi uchun)
-- =========================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.products;
