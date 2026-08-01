ALTER TABLE public.contractor_documents
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS replaced_at timestamptz,
  ADD COLUMN IF NOT EXISTS replaced_by_document_id uuid REFERENCES public.contractor_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS info_request_id uuid REFERENCES public.application_info_requests(id) ON DELETE SET NULL;

CREATE POLICY "doc update own" ON public.contractor_documents
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contractor_applications a WHERE a.id = contractor_documents.application_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contractor_applications a WHERE a.id = contractor_documents.application_id AND a.user_id = auth.uid()));

ALTER TABLE public.application_info_requests
  ADD COLUMN IF NOT EXISTS resubmitted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.application_info_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.application_info_requests(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('section','document')),
  item_key text NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, item_type, item_key)
);

GRANT SELECT, INSERT, UPDATE ON public.application_info_request_items TO authenticated;
GRANT ALL ON public.application_info_request_items TO service_role;

ALTER TABLE public.application_info_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "req items select" ON public.application_info_request_items
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.contractor_applications a WHERE a.id = application_info_request_items.application_id AND a.user_id = auth.uid())
  );

CREATE POLICY "req items admin insert" ON public.application_info_request_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "req items admin update" ON public.application_info_request_items
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_info_request_items
  BEFORE UPDATE ON public.application_info_request_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();