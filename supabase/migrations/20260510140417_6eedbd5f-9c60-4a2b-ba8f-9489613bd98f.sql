
-- 1. App roles enum
create type public.app_role as enum ('admin', 'contributor', 'user');

-- 2. Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- 3. User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Anyone can view roles"
  on public.user_roles for select using (true);

create policy "Only admins can insert roles"
  on public.user_roles for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete roles"
  on public.user_roles for delete
  using (public.has_role(auth.uid(), 'admin'));

-- 4. Contributor applications
create table public.contributor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pen_name text not null,
  reason text not null,
  sample_link text,
  status text not null default 'pending', -- pending | approved | rejected
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id)
);
alter table public.contributor_applications enable row level security;

create policy "Users can view own application"
  on public.contributor_applications for select
  using (auth.uid() = user_id);

create policy "Admins can view all applications"
  on public.contributor_applications for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Users can insert own application"
  on public.contributor_applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pending application"
  on public.contributor_applications for update
  using (auth.uid() = user_id and status = 'pending');

create policy "Admins can update any application"
  on public.contributor_applications for update
  using (public.has_role(auth.uid(), 'admin'));

-- 5. Trigger: create profile + assign role on signup. First user becomes admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  _is_first boolean;
begin
  insert into public.profiles (id, display_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );

  select not exists (select 1 from public.user_roles where role = 'admin') into _is_first;

  if _is_first then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
    insert into public.user_roles (user_id, role) values (new.id, 'contributor');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Trigger: when application approved, grant contributor role
create or replace function public.handle_application_approved()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    insert into public.user_roles (user_id, role)
    values (new.user_id, 'contributor')
    on conflict do nothing;
    new.reviewed_at := now();
  end if;
  if new.status = 'rejected' and (old.status is distinct from 'rejected') then
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_application_status_change on public.contributor_applications;
create trigger on_application_status_change
  before update on public.contributor_applications
  for each row execute function public.handle_application_approved();
