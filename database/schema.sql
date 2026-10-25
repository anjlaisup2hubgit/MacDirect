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
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- Making yourself the first admin (SQL editor only, after signing up once):
--   update public.profiles set role = 'admin' where id = '<your auth.users id>';
-- Approving a leader request (the MVP "admin screen"):
--   update public.society_leaders set status = 'approved' where id = <request id>;
