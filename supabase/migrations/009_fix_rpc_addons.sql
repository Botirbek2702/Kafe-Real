-- 009_fix_rpc_addons.sql
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
  v_addons jsonb;
  v_final_price integer;
  v_final_name text;
  v_var      jsonb;
  v_addon    jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) != 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Savatcha bo''sh';
  end if;

  insert into public.orders (telegram_id, customer_name, phone, address, comment, order_type)
  values (p_telegram_id, p_customer_name, p_phone, p_address, p_comment, coalesce(p_order_type, 'delivery'))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    v_variant_name := v_item->>'variant';
    v_addons := v_item->'addons';

    select * into v_product from public.products
     where id = (v_item->>'product_id')::bigint and is_available = true for update;

    if not found then
      raise exception 'Mahsulot topilmadi yoki tugagan: %', v_item->>'product_id';
    end if;

    if v_product.stock is not null then
      if v_product.stock < v_qty then
        raise exception '% taomidan faqat % ta qolgan', v_product.name, v_product.stock;
      end if;
      
      update public.products 
      set stock = stock - v_qty,
          is_available = case when (stock - v_qty) <= 0 then false else is_available end
      where id = v_product.id;
    end if;

    v_final_price := v_product.price;
    v_final_name := v_product.name;

    if v_variant_name is not null and jsonb_typeof(v_product.variants) = 'array' then
      for v_var in select * from jsonb_array_elements(v_product.variants) loop
        if v_var->>'name' = v_variant_name then
          v_final_price := (v_var->>'price')::int;
          v_final_name := v_product.name || ' (' || v_variant_name || ')';
          exit;
        end if;
      end loop;
    end if;

    if jsonb_typeof(v_addons) = 'array' and jsonb_array_length(v_addons) > 0 and jsonb_typeof(v_product.addons) = 'array' then
       declare
         v_selected_addon text;
       begin
         for v_selected_addon in select * from jsonb_array_elements_text(v_addons) loop
            for v_addon in select * from jsonb_array_elements(v_product.addons) loop
               if v_addon->>'name' = v_selected_addon then
                  v_final_price := v_final_price + (v_addon->>'price')::int;
                  v_final_name := v_final_name || ' + ' || v_selected_addon;
                  exit;
               end if;
            end loop;
         end loop;
       end;
    end if;

    insert into public.order_items (order_id, product_id, name, price, quantity)
    values (v_order_id, v_product.id, v_final_name, v_final_price, v_qty);

    v_total := v_total + (v_final_price * v_qty);
  end loop;

  update public.orders set total_price = v_total where id = v_order_id;
  return v_order_id;
end;
$$;
