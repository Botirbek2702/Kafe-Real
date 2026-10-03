-- 004_variants.sql

alter table public.products
add column if not exists variants jsonb default null;
-- variants array of { "name": "...", "price": ... }

-- Update create_order to support variants
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
  v_final_price integer;
  v_final_name text;
  v_var      jsonb;
  v_variant_found boolean;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Savatcha bo''sh';
  end if;

  insert into public.orders (telegram_id, customer_name, phone, address, comment, order_type)
  values (p_telegram_id, p_customer_name, p_phone, p_address, p_comment, coalesce(p_order_type, 'delivery'))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    v_variant_name := v_item->>'variant'; -- ixtiyoriy

    select * into v_product from public.products
     where id = (v_item->>'product_id')::bigint and is_available = true;

    if not found then
      raise exception 'Mahsulot topilmadi yoki tugagan: %', v_item->>'product_id';
    end if;

    v_final_price := v_product.price;
    v_final_name := v_product.name;

    -- Agar variant tanlangan bo'lsa va mahsulotda variantlar mavjud bo'lsa
    if v_variant_name is not null and v_product.variants is not null then
      v_variant_found := false;
      for v_var in select * from jsonb_array_elements(v_product.variants) loop
        if v_var->>'name' = v_variant_name then
          v_final_price := (v_var->>'price')::int;
          v_final_name := v_product.name || ' (' || v_variant_name || ')';
          v_variant_found := true;
          exit;
        end if;
      end loop;
      
      if not v_variant_found then
        raise exception 'Bunday porsiya (variant) topilmadi: %', v_variant_name;
      end if;
    end if;

    insert into public.order_items (order_id, product_id, name, price, quantity)
    values (v_order_id, v_product.id, v_final_name, v_final_price, v_qty);

    v_total := v_total + (v_final_price * v_qty);
  end loop;

  update public.orders set total_price = v_total where id = v_order_id;
  return v_order_id;
end;
$$;
