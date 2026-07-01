DROP POLICY IF EXISTS "Owner or admin can insert chapters" ON public.chapters;
DROP POLICY IF EXISTS "Owner or admin can update chapters" ON public.chapters;
DROP POLICY IF EXISTS "Owner or admin can delete chapters" ON public.chapters;

CREATE POLICY "Contributors can insert chapters" ON public.chapters
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'contributor')
  OR EXISTS (SELECT 1 FROM comics c WHERE c.id = chapters.comic_id AND c.created_by = auth.uid())
);

CREATE POLICY "Contributors can update chapters" ON public.chapters
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'contributor')
  OR EXISTS (SELECT 1 FROM comics c WHERE c.id = chapters.comic_id AND c.created_by = auth.uid())
);

CREATE POLICY "Owner or admin can delete chapters" ON public.chapters
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM comics c WHERE c.id = chapters.comic_id AND c.created_by = auth.uid())
);