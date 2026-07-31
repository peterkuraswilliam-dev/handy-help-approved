ALTER TABLE public.admin_notes ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS admin_notes_touch_updated_at ON public.admin_notes;
CREATE TRIGGER admin_notes_touch_updated_at
BEFORE UPDATE ON public.admin_notes
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS "notes admin all" ON public.admin_notes;

CREATE POLICY "notes admin select" ON public.admin_notes
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "notes admin insert" ON public.admin_notes
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

CREATE POLICY "notes author update" ON public.admin_notes
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

CREATE POLICY "notes author delete" ON public.admin_notes
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notes TO authenticated;
GRANT ALL ON public.admin_notes TO service_role;