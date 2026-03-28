create extension if not exists pgcrypto;

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day text not null check (day in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

drop policy if exists "Users can view own todos" on public.todos;
drop policy if exists "Users can insert own todos" on public.todos;
drop policy if exists "Users can update own todos" on public.todos;
drop policy if exists "Users can delete own todos" on public.todos;

create policy "Users can view own todos"
on public.todos
for select
using (auth.uid() = user_id);

create policy "Users can insert own todos"
on public.todos
for insert
with check (auth.uid() = user_id);

create policy "Users can update own todos"
on public.todos
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own todos"
on public.todos
for delete
using (auth.uid() = user_id);