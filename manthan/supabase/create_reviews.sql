CREATE TABLE IF NOT EXISTS public.teacher_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL,
  question_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_reviews_teacher_id ON public.teacher_reviews(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_student_id ON public.teacher_reviews(student_id);

CREATE TABLE IF NOT EXISTS public.teacher_stats (
  teacher_id uuid PRIMARY KEY,
  total_stars bigint DEFAULT 0,
  total_reviews bigint DEFAULT 0,
  average_rating numeric(3,2) GENERATED ALWAYS AS (
    CASE WHEN total_reviews = 0 THEN 0 ELSE (total_stars::numeric / total_reviews::numeric) END
  ) STORED
);

ALTER TABLE public.teacher_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on teacher_stats" ON public.teacher_stats FOR SELECT USING (true);


CREATE OR REPLACE FUNCTION update_teacher_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.teacher_stats (teacher_id, total_stars, total_reviews)
    VALUES (NEW.teacher_id, NEW.rating, 1)
    ON CONFLICT (teacher_id)
    DO UPDATE SET 
      total_stars = public.teacher_stats.total_stars + NEW.rating,
      total_reviews = public.teacher_stats.total_reviews + 1;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.teacher_stats
    SET 
      total_stars = public.teacher_stats.total_stars - OLD.rating + NEW.rating
    WHERE teacher_id = NEW.teacher_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.teacher_stats
    SET 
      total_stars = public.teacher_stats.total_stars - OLD.rating,
      total_reviews = public.teacher_stats.total_reviews - 1
    WHERE teacher_id = OLD.teacher_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_teacher_stats ON public.teacher_reviews;
CREATE TRIGGER trigger_update_teacher_stats
AFTER INSERT OR UPDATE OR DELETE ON public.teacher_reviews
FOR EACH ROW EXECUTE FUNCTION update_teacher_stats();