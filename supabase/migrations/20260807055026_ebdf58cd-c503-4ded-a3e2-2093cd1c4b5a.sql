DROP POLICY IF EXISTS "owner update non-decision" ON public.contractor_applications;
CREATE POLICY "owner update non-decision" ON public.contractor_applications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());