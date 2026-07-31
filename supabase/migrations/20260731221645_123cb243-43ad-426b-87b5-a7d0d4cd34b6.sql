ALTER TABLE public.application_info_requests
  ADD COLUMN IF NOT EXISTS response_message text,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

CREATE POLICY "info req contractor respond"
ON public.application_info_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contractor_applications a
    WHERE a.id = application_info_requests.application_id
      AND a.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contractor_applications a
    WHERE a.id = application_info_requests.application_id
      AND a.user_id = auth.uid()
  )
);