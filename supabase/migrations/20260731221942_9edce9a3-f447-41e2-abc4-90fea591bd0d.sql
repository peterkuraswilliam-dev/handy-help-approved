ALTER TABLE public.contractor_applications
  ADD COLUMN IF NOT EXISTS decided_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS contractor_decision_message text;

CREATE OR REPLACE FUNCTION public.guard_application_decision_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('approved','rejected','suspended','under_review') THEN
    RAISE EXCEPTION 'Only administrators can set this application status';
  END IF;

  NEW.approved_at := OLD.approved_at;
  NEW.rejected_at := OLD.rejected_at;
  NEW.decided_at := OLD.decided_at;
  NEW.decided_by := OLD.decided_by;
  NEW.decision_reason := OLD.decision_reason;
  NEW.contractor_decision_message := OLD.contractor_decision_message;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_application_decision_fields ON public.contractor_applications;
CREATE TRIGGER guard_application_decision_fields
BEFORE UPDATE ON public.contractor_applications
FOR EACH ROW EXECUTE FUNCTION public.guard_application_decision_fields();