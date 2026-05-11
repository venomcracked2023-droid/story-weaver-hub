ALTER TABLE public.comments REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;