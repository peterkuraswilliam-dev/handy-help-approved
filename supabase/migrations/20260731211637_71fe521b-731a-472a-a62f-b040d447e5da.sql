CREATE TABLE public.application_review_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  check_key text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_by uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, check_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_review_checks TO authenticated;
GRANT ALL ON public.application_review_checks TO service_role;

ALTER TABLE public.application_review_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review checks admin select" ON public.application_review_checks
FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "review checks admin insert" ON public.application_review_checks
FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "review checks admin update" ON public.application_review_checks
FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "review checks admin delete" ON public.application_review_checks
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_review_checks_updated_at
BEFORE UPDATE ON public.application_review_checks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();