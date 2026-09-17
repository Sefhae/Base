-- BASE Entertainment — "Build Your Setup" admin schema
--
-- Run this ONCE in your Supabase project: Dashboard → SQL Editor → New query →
-- paste → Run. It is safe to run again; every statement is idempotent.
--
-- What it creates:
--   1. public.setup_items  — one row per uploaded 3D model, including the fixed
--                            position you choose for it in the admin panel.
--   2. storage bucket 'models' — holds the .glb files themselves.
--   3. Row Level Security so the public key can READ but never WRITE.

-- ---------------------------------------------------------------------------
-- 1. Catalog table
-- ---------------------------------------------------------------------------
create table if not exists public.setup_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Wedding',
  price integer not null default 0,
  -- Path of the .glb inside the 'models' storage bucket.
  model_path text not null,
  -- The fixed spot you choose in the admin panel. Customers cannot move it.
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  position_z double precision not null default 0,
  rotation_y double precision not null default 0,
  scale double precision not null default 1,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.setup_items enable row level security;

-- Public site: may read active items only.
drop policy if exists "public reads active setup items" on public.setup_items;
create policy "public reads active setup items"
  on public.setup_items for select
  using (is_active);

-- Admin (any signed-in user): full control.
drop policy if exists "signed in inserts setup items" on public.setup_items;
create policy "signed in inserts setup items"
  on public.setup_items for insert to authenticated
  with check (true);

drop policy if exists "signed in updates setup items" on public.setup_items;
create policy "signed in updates setup items"
  on public.setup_items for update to authenticated
  using (true) with check (true);

drop policy if exists "signed in deletes setup items" on public.setup_items;
create policy "signed in deletes setup items"
  on public.setup_items for delete to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 2. Storage bucket for the .glb files
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('models', 'models', true)
on conflict (id) do nothing;

drop policy if exists "public reads models" on storage.objects;
create policy "public reads models"
  on storage.objects for select
  using (bucket_id = 'models');

drop policy if exists "signed in uploads models" on storage.objects;
create policy "signed in uploads models"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'models');

drop policy if exists "signed in deletes models" on storage.objects;
create policy "signed in deletes models"
  on storage.objects for delete to authenticated
  using (bucket_id = 'models');

-- ---------------------------------------------------------------------------
-- 3. Create your admin login
-- ---------------------------------------------------------------------------
-- Do this in the dashboard, not here:
--   Authentication → Users → Add user → enter your email and a password,
--   and tick "Auto Confirm User".
-- Sign-ups are not exposed anywhere on the site, so that account is the only
-- way into /admin.
