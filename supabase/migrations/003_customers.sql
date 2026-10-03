-- 003_customers.sql

create table if not exists public.customers (
  telegram_id bigint primary key,
  full_name   text not null,
  phone       text not null,
  created_at  timestamptz not null default now()
);

alter table public.customers enable row level security;

-- Bot server (anonim/service) yoki admin o'qish/yozish imkoniga ega
create policy "allow all for anon on customers" on public.customers for all using (true) with check (true);
