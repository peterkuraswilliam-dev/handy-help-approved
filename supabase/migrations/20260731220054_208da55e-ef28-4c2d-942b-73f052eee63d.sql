CREATE TABLE public.application_info_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  message text NOT NULL,
  requested_sections text[] NOT NULL DEFAULT '{}',
  requested_documents text[] NOT NULL DEFAULT '{}',
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  due_date date,
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.application_info_requests TO authenticated;
GRANT ALL ON public.application_info_requests TO service_role;

ALTER TABLE public.application_info_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "info req admin insert" ON public.application_info_requests
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND requested_by = auth.uid());

CREATE POLICY "info req select" ON public.application_info_requests
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.contractor_applications a
      WHERE a.id = application_info_requests.application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "info req admin update" ON public.application_info_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_application_info_requests
  BEFORE UPDATE ON public.application_info_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_info_requests_application ON public.application_info_requests(application_id, requested_at DESC);