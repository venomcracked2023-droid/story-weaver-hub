
-- Slug utilities + auto-generated slugs for comics & chapters
create extension if not exists unaccent;

create or replace function public.slugify_vn(input text) returns text
language sql immutable set search_path = public as $$
  select trim(both '-' from regexp_replace(
    lower(unaccent(translate(coalesce(input,''), 'đĐ', 'dD'))),
    '[^a-z0-9]+', '-', 'g'
  ))
$$;

-- Comics: backfill + trigger
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

-- Backfill existing rows
do $$
declare r record; base text; cand text; i int;
begin
  for r in select id, title from public.comics where slug is null or slug = '' order by created_at loop
    base := nullif(public.slugify_vn(r.title), '');
    if base is null then base := 'truyen'; end if;
    cand := base; i := 1;
    while exists (select 1 from public.comics where slug = cand and id <> r.id) loop
      i := i + 1;
      cand := base || '-' || i;
    end loop;
    update public.comics set slug = cand where id = r.id;
  end loop;
end$$;

create unique index if not exists comics_slug_unique on public.comics(slug);

-- Chapters: add slug column, trigger, backfill
alter table public.chapters add column if not exists slug text not null default '';

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

do $$
declare r record; base text; cand text; i int;
begin
  for r in select id, comic_id, title, order_index from public.chapters where slug is null or slug = '' order by comic_id, order_index loop
    base := 'chuong-' || (coalesce(r.order_index, 0) + 1);
    if nullif(public.slugify_vn(r.title), '') is not null then
      base := base || '-' || public.slugify_vn(r.title);
    end if;
    cand := base; i := 1;
    while exists (select 1 from public.chapters where comic_id = r.comic_id and slug = cand and id <> r.id) loop
      i := i + 1;
      cand := base || '-' || i;
    end loop;
    update public.chapters set slug = cand where id = r.id;
  end loop;
end$$;

create unique index if not exists chapters_comic_slug_unique on public.chapters(comic_id, slug);
