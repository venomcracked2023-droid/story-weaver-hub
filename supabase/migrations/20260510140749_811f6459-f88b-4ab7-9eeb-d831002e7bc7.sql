
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.comics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null default '',
  description text not null default '',
  cover_id text not null default '',
  genres text[] not null default '{}',
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  comic_id uuid not null references public.comics(id) on delete cascade,
  title text not null,
  pages text[] not null default '{}',
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index on public.chapters(comic_id, order_index);

alter table public.comics enable row level security;
alter table public.chapters enable row level security;

create policy "Comics viewable by everyone" on public.comics for select using (true);
create policy "Contributors can create comics" on public.comics for insert
  with check (auth.uid() = created_by and (public.has_role(auth.uid(),'contributor') or public.has_role(auth.uid(),'admin')));
create policy "Owner or admin can update comics" on public.comics for update
  using (auth.uid() = created_by or public.has_role(auth.uid(),'admin'));
create policy "Owner or admin can delete comics" on public.comics for delete
  using (auth.uid() = created_by or public.has_role(auth.uid(),'admin'));

create policy "Chapters viewable by everyone" on public.chapters for select using (true);
create policy "Owner or admin can insert chapters" on public.chapters for insert
  with check (exists (select 1 from public.comics c where c.id = comic_id and (c.created_by = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "Owner or admin can update chapters" on public.chapters for update
  using (exists (select 1 from public.comics c where c.id = comic_id and (c.created_by = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "Owner or admin can delete chapters" on public.chapters for delete
  using (exists (select 1 from public.comics c where c.id = comic_id and (c.created_by = auth.uid() or public.has_role(auth.uid(),'admin'))));

create trigger comics_updated_at before update on public.comics
  for each row execute function public.update_updated_at_column();
