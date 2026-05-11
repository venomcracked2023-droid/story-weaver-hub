
-- Bảng bình luận: gắn với truyện, tuỳ chọn gắn vào chương cụ thể
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comic_id uuid NOT NULL,
  chapter_id uuid,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_comic ON public.comments(comic_id, created_at DESC);
CREATE INDEX idx_comments_chapter ON public.comments(chapter_id, created_at DESC);
CREATE INDEX idx_comments_user ON public.comments(user_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Auth users can insert own comment"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner or admin can update comment"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner or admin can delete comment"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validate độ dài nội dung (dùng trigger thay cho CHECK để dễ chỉnh sau)
CREATE OR REPLACE FUNCTION public.validate_comment()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF length(btrim(NEW.content)) < 1 THEN
    RAISE EXCEPTION 'Bình luận không được trống';
  END IF;
  IF length(NEW.content) > 2000 THEN
    RAISE EXCEPTION 'Bình luận tối đa 2000 ký tự';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_comment_trg
BEFORE INSERT OR UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.validate_comment();

-- Bảng đánh giá: mỗi user 1 rating / truyện
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comic_id uuid NOT NULL,
  score smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, comic_id)
);

CREATE INDEX idx_ratings_comic ON public.ratings(comic_id);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings viewable by everyone"
  ON public.ratings FOR SELECT USING (true);

CREATE POLICY "Auth users can insert own rating"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own rating"
  ON public.ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner or admin can delete rating"
  ON public.ratings FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_ratings_updated_at
BEFORE UPDATE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_rating()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.score < 1 OR NEW.score > 5 THEN
    RAISE EXCEPTION 'Điểm đánh giá phải từ 1 đến 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_rating_trg
BEFORE INSERT OR UPDATE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.validate_rating();
