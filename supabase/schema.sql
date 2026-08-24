-- ==============================================================================
-- STORY WEAVER HUB / LCUCUMBER - SUPABASE DATABASE SCHEMA (ALL-IN-ONE)
-- Chạy toàn bộ file này trong mục "SQL Editor" trên bảng điều khiển Supabase của bạn.
-- ==============================================================================

-- 1. Bật Extensions cần thiết
create extension if not exists unaccent;
create extension if not exists "uuid-ossp";

-- 2. Khởi tạo Enum quyền người dùng
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'contributor', 'user');
  end if;
end $$;

-- 3. Hàm tiện ích tự động cập nhật thời gian
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4. Hàm chuyển đổi slug tiếng Việt không dấu (SEO-friendly)
create or replace function public.slugify_vn(input text) returns text
language sql immutable set search_path = public as $$
  select trim(both '-' from regexp_replace(
    lower(unaccent(translate(coalesce(input, ''), 'đĐ', 'dD'))),
    '[^a-z0-9]+', '-', 'g'
  ))
$$;

-- 5. Bảng Profiles (Hồ sơ người dùng)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 6. Bảng User Roles (Phân quyền người dùng)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- Hàm kiểm tra quyền người dùng (Security Definer)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- 7. Bảng Đơn ứng tuyển Cộng tác viên (Contributor Applications)
create table if not exists public.contributor_applications (
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

-- 8. Trigger tự động tạo Profile và phân quyền khi có người dùng đăng ký mới
-- Người đăng ký đầu tiên trên hệ thống sẽ tự động được cấp quyền Admin + Contributor!
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
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    email = excluded.email;

  select not exists (select 1 from public.user_roles where role = 'admin') into _is_first;

  if _is_first then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
    insert into public.user_roles (user_id, role) values (new.id, 'contributor') on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger tự động nâng cấp quyền Contributor khi đơn ứng tuyển được duyệt
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

-- 9. Bảng Truyện (Comics)
create table if not exists public.comics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null default '',
  author text not null default '',
  description text not null default '',
  cover_id text not null default '',
  genres text[] not null default '{}',
  featured boolean not null default false,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.comics enable row level security;
create unique index if not exists comics_slug_unique on public.comics(slug);
create index if not exists idx_comics_featured on public.comics (featured) where featured = true;

drop trigger if exists comics_updated_at on public.comics;
create trigger comics_updated_at
  before update on public.comics
  for each row execute function public.update_updated_at_column();

-- Trigger tự tạo slug truyện tự động
create or replace function public.set_comic_slug() returns trigger
language plpgsql set search_path = public as $$
declare base text; cand text; i int := 1;
begin
  if NEW.slug is null or NEW.slug = ''
     or (TG_OP = 'UPDATE' and NEW.title is distinct from OLD.title and NEW.slug = OLD.slug) then
    base := nullif(public.slugify_vn(NEW.title), '');
    if base is null then base := 'truyen'; end if;
    cand := base;
    while exists (select 1 from public.comics where slug = cand and id <> NEW.id) loop
      i := i + 1;
      cand := base || '-' || i;
    end loop;
    NEW.slug := cand;
  end if;
  return NEW;
end$$;

drop trigger if exists trg_set_comic_slug on public.comics;
create trigger trg_set_comic_slug
  before insert or update on public.comics
  for each row execute function public.set_comic_slug();

-- 10. Bảng Chương truyện (Chapters)
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  comic_id uuid not null references public.comics(id) on delete cascade,
  title text not null,
  slug text not null default '',
  pages text[] not null default '{}',
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.chapters enable row level security;
create index if not exists idx_chapters_comic_order on public.chapters(comic_id, order_index);
create unique index if not exists chapters_comic_slug_unique on public.chapters(comic_id, slug);

-- Trigger tự tạo slug chương truyện tự động
create or replace function public.set_chapter_slug() returns trigger
language plpgsql set search_path = public as $$
declare base text; cand text; i int := 1;
begin
  if NEW.slug is null or NEW.slug = ''
     or (TG_OP = 'UPDATE'
         and (NEW.title is distinct from OLD.title or NEW.order_index is distinct from OLD.order_index)
         and NEW.slug = OLD.slug) then
    base := 'chuong-' || (coalesce(NEW.order_index, 0) + 1);
    if nullif(public.slugify_vn(NEW.title), '') is not null then
      base := base || '-' || public.slugify_vn(NEW.title);
    end if;
    cand := base;
    while exists (select 1 from public.chapters where comic_id = NEW.comic_id and slug = cand and id <> NEW.id) loop
      i := i + 1;
      cand := base || '-' || i;
    end loop;
    NEW.slug := cand;
  end if;
  return NEW;
end$$;

drop trigger if exists trg_set_chapter_slug on public.chapters;
create trigger trg_set_chapter_slug
  before insert or update on public.chapters
  for each row execute function public.set_chapter_slug();

-- 11. Bảng Bình luận (Comments)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  comic_id uuid not null,
  chapter_id uuid,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_comments_comic on public.comments(comic_id, created_at desc);
create index if not exists idx_comments_chapter on public.comments(chapter_id, created_at desc);
create index if not exists idx_comments_user on public.comments(user_id);
alter table public.comments enable row level security;

drop trigger if exists update_comments_updated_at on public.comments;
create trigger update_comments_updated_at
  before update on public.comments
  for each row execute function public.update_updated_at_column();

create or replace function public.validate_comment()
returns trigger language plpgsql set search_path = public as $$
begin
  if length(btrim(new.content)) < 1 then
    raise exception 'Bình luận không được trống';
  end if;
  if length(new.content) > 2000 then
    raise exception 'Bình luận tối đa 2000 ký tự';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_comment_trg on public.comments;
create trigger validate_comment_trg
  before insert or update on public.comments
  for each row execute function public.validate_comment();

-- 12. Bảng Đánh giá sao (Ratings)
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  comic_id uuid not null,
  score smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, comic_id)
);
create index if not exists idx_ratings_comic on public.ratings(comic_id);
alter table public.ratings enable row level security;

drop trigger if exists update_ratings_updated_at on public.ratings;
create trigger update_ratings_updated_at
  before update on public.ratings
  for each row execute function public.update_updated_at_column();

create or replace function public.validate_rating()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.score < 1 or new.score > 5 then
    raise exception 'Điểm đánh giá phải từ 1 đến 5';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_rating_trg on public.ratings;
create trigger validate_rating_trg
  before insert or update on public.ratings
  for each row execute function public.validate_rating();

-- 13. View thông tin công khai (Ẩn email chống lộ PII)
create or replace view public.public_profiles as
  select id, display_name, avatar_url
  from public.profiles;

alter view public.public_profiles owner to postgres;
grant select on public.public_profiles to anon, authenticated;

-- 14. CHÍNH SÁCH BẢO MẬT (Row Level Security Policies)

-- Profiles
drop policy if exists "Profiles selectable by owner or admin" on public.profiles;
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles selectable by owner or admin"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- User Roles
drop policy if exists "Users can view own roles" on public.user_roles;
drop policy if exists "Anyone can view roles" on public.user_roles;
create policy "Users can view own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Only admins can insert roles" on public.user_roles;
create policy "Only admins can insert roles"
  on public.user_roles for insert with check (public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Only admins can delete roles" on public.user_roles;
create policy "Only admins can delete roles"
  on public.user_roles for delete using (public.has_role(auth.uid(), 'admin'::app_role));

-- Contributor Applications
drop policy if exists "Users can view own application" on public.contributor_applications;
create policy "Users can view own application"
  on public.contributor_applications for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all applications" on public.contributor_applications;
create policy "Admins can view all applications"
  on public.contributor_applications for select using (public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Users can insert own application" on public.contributor_applications;
create policy "Users can insert own application"
  on public.contributor_applications for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own pending application" on public.contributor_applications;
create policy "Users can update own pending application"
  on public.contributor_applications for update using (auth.uid() = user_id and status = 'pending');

drop policy if exists "Admins can update any application" on public.contributor_applications;
create policy "Admins can update any application"
  on public.contributor_applications for update using (public.has_role(auth.uid(), 'admin'::app_role));

-- Comics
drop policy if exists "Comics viewable by everyone" on public.comics;
create policy "Comics viewable by everyone" on public.comics for select using (true);

drop policy if exists "Contributors can create comics" on public.comics;
create policy "Contributors can create comics" on public.comics for insert
  with check (auth.uid() = created_by and (public.has_role(auth.uid(), 'contributor'::app_role) or public.has_role(auth.uid(), 'admin'::app_role)));

drop policy if exists "Owner or admin can update comics" on public.comics;
create policy "Owner or admin can update comics" on public.comics for update
  using (auth.uid() = created_by or public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Owner or admin can delete comics" on public.comics;
create policy "Owner or admin can delete comics" on public.comics for delete
  using (auth.uid() = created_by or public.has_role(auth.uid(), 'admin'::app_role));

-- Chapters
drop policy if exists "Chapters viewable by everyone" on public.chapters;
create policy "Chapters viewable by everyone" on public.chapters for select using (true);

drop policy if exists "Contributors can insert chapters" on public.chapters;
drop policy if exists "Owner or admin can insert chapters" on public.chapters;
create policy "Contributors can insert chapters" on public.chapters for insert to authenticated
  with check (
    public.has_role(auth.uid(), 'admin'::app_role) or public.has_role(auth.uid(), 'contributor'::app_role)
    or exists (select 1 from public.comics c where c.id = chapters.comic_id and c.created_by = auth.uid())
  );

drop policy if exists "Contributors can update chapters" on public.chapters;
drop policy if exists "Owner or admin can update chapters" on public.chapters;
create policy "Contributors can update chapters" on public.chapters for update to authenticated
  using (
    public.has_role(auth.uid(), 'admin'::app_role) or public.has_role(auth.uid(), 'contributor'::app_role)
    or exists (select 1 from public.comics c where c.id = chapters.comic_id and c.created_by = auth.uid())
  );

drop policy if exists "Owner or admin can delete chapters" on public.chapters;
create policy "Owner or admin can delete chapters" on public.chapters for delete to authenticated
  using (
    public.has_role(auth.uid(), 'admin'::app_role)
    or exists (select 1 from public.comics c where c.id = chapters.comic_id and c.created_by = auth.uid())
  );

-- Comments
drop policy if exists "Comments viewable by everyone" on public.comments;
create policy "Comments viewable by everyone" on public.comments for select using (true);

drop policy if exists "Auth users can insert own comment" on public.comments;
create policy "Auth users can insert own comment" on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "Owner or admin can update comment" on public.comments;
create policy "Owner or admin can update comment" on public.comments for update
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Owner or admin can delete comment" on public.comments;
create policy "Owner or admin can delete comment" on public.comments for delete
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::app_role));

-- Ratings
drop policy if exists "Ratings viewable by everyone" on public.ratings;
create policy "Ratings viewable by everyone" on public.ratings for select using (true);

drop policy if exists "Auth users can insert own rating" on public.ratings;
create policy "Auth users can insert own rating" on public.ratings for insert with check (auth.uid() = user_id);

drop policy if exists "Owner can update own rating" on public.ratings;
create policy "Owner can update own rating" on public.ratings for update using (auth.uid() = user_id);

drop policy if exists "Owner or admin can delete rating" on public.ratings;
create policy "Owner or admin can delete rating" on public.ratings for delete
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::app_role));

-- 15. Phân quyền thực thi hàm (Function Security)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_application_approved() from public, anon, authenticated;
revoke execute on function public.validate_rating() from public, anon, authenticated;
revoke execute on function public.validate_comment() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public;
revoke execute on function public.has_role(uuid, public.app_role) from anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- 16. Kích hoạt Realtime cho bảng bình luận (Comments)
alter table public.comments replica identity full;
do $$
begin
  begin
    alter publication supabase_realtime add table public.comments;
  exception when duplicate_object then null;
  end;
end $$;
