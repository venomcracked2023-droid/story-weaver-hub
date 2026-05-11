ALTER TABLE public.comics ADD COLUMN featured boolean NOT NULL DEFAULT false;
CREATE INDEX idx_comics_featured ON public.comics (featured) WHERE featured = true;