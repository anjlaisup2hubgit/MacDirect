-- iMCQ schema for Supabase (Postgres). Run once on a fresh project in the SQL editor,
-- then run seed.sql. Row-level security decides who can read and write each table.

-- Tables ---------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  role         text not null default 'student' check (role in ('student', 'admin')),
  created_at   timestamptz not null default now()
);

create table public.societies (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  category    text not null,
  description text not null default '',
  building    text,
  contact     text,
  website     text
);

-- A user is a society leader when they have an approved row here.
create table public.society_leaders (
  id         bigint generated always as identity primary key,
  user_id    uuid   not null references public.profiles (id) on delete cascade,
  society_id bigint not null references public.societies (id) on delete cascade,
  status     text   not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (user_id, society_id)
);

create table public.follows (
  user_id    uuid   not null references public.profiles (id) on delete cascade,
  society_id bigint not null references public.societies (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, society_id)
);

-- society_id is null for campus-wide events, which only an admin can post.
create table public.events (
  id          bigint generated always as identity primary key,
  society_id  bigint references public.societies (id) on delete cascade,
  title       text not null,
  category    text not null,
  event_date  date not null,
  event_time  time,
  building    text,
  description text not null default '',
  created_by  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- A user's private agenda entries (the Add event plan popup).
create table public.event_plans (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  category    text not null,
  plan_date   date not null,
  plan_time   time,
  building    text,
  description text not null default '',
  created_at  timestamptz not null default now()
);

create index event_plans_user_idx on public.event_plans (user_id, plan_date);
create index events_date_idx on public.events (event_date);
create index events_society_idx on public.events (society_id);
create index follows_society_idx on public.follows (society_id);

-- Helpers --------------------------------------------------------------------
-- security definer so policies can check roles without tripping over RLS themselves.

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create function public.is_leader_of(sid bigint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.society_leaders
    where user_id = auth.uid() and society_id = sid and status = 'approved'
  );
$$;

-- Create a profile whenever someone signs up. display_name comes from the
-- sign-up metadata (options.data.display_name in supabase-js).
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row-level security ---------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.societies       enable row level security;
alter table public.society_leaders enable row level security;
alter table public.follows         enable row level security;
alter table public.events          enable row level security;
alter table public.event_plans     enable row level security;

-- profiles: read your own, edit only your display name (role is admin-set).
create policy "profiles read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- societies: public read, admin write.
create policy "societies public read" on public.societies
  for select to anon, authenticated using (true);
create policy "societies admin write" on public.societies
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- society_leaders: ask to lead a society (pending only), see your own requests,
-- and only an admin can approve, reject or remove.
create policy "leaders read own or admin" on public.society_leaders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "leaders request own pending" on public.society_leaders
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "leaders admin update" on public.society_leaders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "leaders admin delete" on public.society_leaders
  for delete to authenticated using (public.is_admin());

-- follows: each user manages only their own.
create policy "follows read own" on public.follows
  for select to authenticated using (user_id = auth.uid());
create policy "follows add own" on public.follows
  for insert to authenticated with check (user_id = auth.uid());
create policy "follows remove own" on public.follows
  for delete to authenticated using (user_id = auth.uid());

-- event_plans: private to each user.
create policy "plans read own" on public.event_plans
  for select to authenticated using (user_id = auth.uid());
create policy "plans add own" on public.event_plans
  for insert to authenticated with check (user_id = auth.uid());
create policy "plans remove own" on public.event_plans
  for delete to authenticated using (user_id = auth.uid());

-- events: public read; approved leaders manage their own society's events; admin manages all.
create policy "events public read" on public.events
  for select to anon, authenticated using (true);
create policy "events leader insert" on public.events
  for insert to authenticated with check (
    created_by = auth.uid()
    and ((society_id is not null and public.is_leader_of(society_id)) or public.is_admin())
  );
create policy "events leader update" on public.events
  for update to authenticated
  using ((society_id is not null and public.is_leader_of(society_id)) or public.is_admin())
  with check ((society_id is not null and public.is_leader_of(society_id)) or public.is_admin());
create policy "events leader delete" on public.events
  for delete to authenticated
  using ((society_id is not null and public.is_leader_of(society_id)) or public.is_admin());

-- Privileges -----------------------------------------------------------------
-- RLS filters rows; these grants decide which tables the API can touch at all.

grant select on public.societies, public.events to anon;
grant select, insert, update, delete on public.societies, public.events to authenticated;
grant select, insert, update, delete on public.society_leaders, public.follows to authenticated;
grant select, insert, delete on public.event_plans to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- Society cover images -------------------------------------------------------
-- One cover image per society, kept in a public Storage bucket. Safe to run again.
-- Files live at <society_id>/<random name>.<ext>; the first folder is the society.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('society-images', 'society-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create table if not exists public.society_images (
  society_id bigint primary key references public.societies (id) on delete cascade,
  path       text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.society_images enable row level security;

drop policy if exists "society images public read" on public.society_images;
create policy "society images public read" on public.society_images
  for select to anon, authenticated using (true);
drop policy if exists "society images leader insert" on public.society_images;
create policy "society images leader insert" on public.society_images
  for insert to authenticated with check (public.is_leader_of(society_id) or public.is_admin());
drop policy if exists "society images leader update" on public.society_images;
create policy "society images leader update" on public.society_images
  for update to authenticated
  using (public.is_leader_of(society_id) or public.is_admin())
  with check (public.is_leader_of(society_id) or public.is_admin());
drop policy if exists "society images leader delete" on public.society_images;
create policy "society images leader delete" on public.society_images
  for delete to authenticated using (public.is_leader_of(society_id) or public.is_admin());

grant select on public.society_images to anon;
grant select, insert, update, delete on public.society_images to authenticated;

-- Storage rules: a leader (or admin) can touch only files under their own society's folder.
-- The regex check stops a non-numeric folder name from causing a cast error.
drop policy if exists "society images storage read" on storage.objects;
create policy "society images storage read" on storage.objects
  for select to authenticated using (
    bucket_id = 'society-images'
    and (public.is_admin() or public.is_leader_of(
      case when (storage.foldername(name))[1] ~ '^[0-9]+$' then (storage.foldername(name))[1]::bigint end))
  );
drop policy if exists "society images storage insert" on storage.objects;
create policy "society images storage insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'society-images'
    and (public.is_admin() or public.is_leader_of(
      case when (storage.foldername(name))[1] ~ '^[0-9]+$' then (storage.foldername(name))[1]::bigint end))
  );
drop policy if exists "society images storage delete" on storage.objects;
create policy "society images storage delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'society-images'
    and (public.is_admin() or public.is_leader_of(
      case when (storage.foldername(name))[1] ~ '^[0-9]+$' then (storage.foldername(name))[1]::bigint end))
  );

-- Hashtags and event posters ---------------------------------------------------
-- Societies carry several hashtags (lower case, no #). Leaders may change only that column.
-- Event posters reuse the society-images bucket under <society_id>/events/, so the
-- Storage rules above already cover them. Safe to run again.
alter table public.societies add column if not exists hashtags text[] not null default '{}';
alter table public.events add column if not exists image_path text;

drop policy if exists "societies leader update" on public.societies;
create policy "societies leader update" on public.societies
  for update to authenticated
  using (public.is_leader_of(id)) with check (public.is_leader_of(id));
revoke update on public.societies from authenticated;
grant update (hashtags) on public.societies to authenticated;

-- Photos on private event plans: files live under <user id>/plans/ in the same bucket.
alter table public.event_plans add column if not exists image_path text;
drop policy if exists "plan images storage insert" on storage.objects;
create policy "plan images storage insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'society-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "plan images storage read" on storage.objects;
create policy "plan images storage read" on storage.objects
  for select to authenticated using (
    bucket_id = 'society-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "plan images storage delete" on storage.objects;
create policy "plan images storage delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'society-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Making yourself the first admin (SQL editor only, after signing up once):
--   update public.profiles set role = 'admin' where id = '<your auth.users id>';
-- Approving a leader request (the MVP "admin screen"):
--   update public.society_leaders set status = 'approved' where id = <request id>;
