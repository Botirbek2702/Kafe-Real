-- 005_marketing.sql

create table if not exists public.broadcast_messages (
  id          bigint generated always as identity primary key,
  message     text not null,
  image_url   text,
  status      text not null default 'pending', -- pending, sending, completed
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

alter table public.broadcast_messages enable row level security;

-- Faqat Kassir/Admin (authenticated) yozishi va o'qishi mumkin
create policy "allow all for auth on broadcast" on public.broadcast_messages for all to authenticated using (true) with check (true);

-- Realtime orqali bot tutib olishi uchun
alter publication supabase_realtime add table public.broadcast_messages;
