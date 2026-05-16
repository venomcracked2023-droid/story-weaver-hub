CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE public.comics ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.set_comic_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  i int := 2;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := lower(public.unaccent(coalesce(NEW.title, '')));
    base := replace(base, 'đ', 'd');
    base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
    base := regexp_replace(base, '^-+|-+$', '', 'g');
    IF base = '' OR base IS NULL THEN base := 'truyen'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.comics WHERE slug = candidate AND id <> NEW.id) LOOP
      candidate := base || '-' || i;
      i := i + 1;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_comic_slug ON public.comics;
CREATE TRIGGER trg_set_comic_slug
BEFORE INSERT OR UPDATE ON public.comics
FOR EACH ROW EXECUTE FUNCTION public.set_comic_slug();

-- Backfill slug cho các truyện đã có
DO $$
DECLARE
  r record;
  base text;
  candidate text;
  i int;
BEGIN
  FOR r IN SELECT id, title FROM public.comics WHERE slug IS NULL OR slug = '' ORDER BY created_at LOOP
    base := lower(public.unaccent(coalesce(r.title, '')));
    base := replace(base, 'đ', 'd');
    base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
    base := regexp_replace(base, '^-+|-+$', '', 'g');
    IF base = '' OR base IS NULL THEN base := 'truyen'; END IF;
    candidate := base;
    i := 2;
    WHILE EXISTS (SELECT 1 FROM public.comics WHERE slug = candidate) LOOP
      candidate := base || '-' || i;
      i := i + 1;
    END LOOP;
    UPDATE public.comics SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE public.comics ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS comics_slug_unique ON public.comics (slug);