ALTER TABLE public.application_review_checks
  ADD COLUMN IF NOT EXISTS review_state text NOT NULL DEFAULT 'not_reviewed',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS issue_note text;

ALTER TABLE public.application_review_checks
  DROP CONSTRAINT IF EXISTS application_review_checks_review_state_check;

ALTER TABLE public.application_review_checks
  ADD CONSTRAINT application_review_checks_review_state_check
  CHECK (review_state IN ('not_reviewed','checked','needs_info','not_applicable'));

UPDATE public.application_review_checks
SET review_state = 'checked',
    reviewed_by = COALESCE(reviewed_by, completed_by),
    reviewed_at = COALESCE(reviewed_at, completed_at)
WHERE completed = true AND review_state = 'not_reviewed';

CREATE UNIQUE INDEX IF NOT EXISTS application_review_checks_app_key_idx
  ON public.application_review_checks (application_id, check_key);