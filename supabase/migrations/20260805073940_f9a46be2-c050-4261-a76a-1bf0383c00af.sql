CREATE OR REPLACE FUNCTION public.guard_application_decision_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Contractors may only reset insurance verification back to awaiting review.
  IF NEW.insurance_expiry_date IS DISTINCT FROM OLD.insurance_expiry_date
     OR NEW.insurance_provider IS DISTINCT FROM OLD.insurance_provider
     OR NEW.insurance_policy_type IS DISTINCT FROM OLD.insurance_policy_type
     OR NEW.insurance_verification_state = 'awaiting_review' THEN
    NEW.insurance_verification_state := 'awaiting_review';
    NEW.insurance_verified_at := NULL;
    NEW.insurance_verified_by := NULL;
  ELSE
    NEW.insurance_verification_state := OLD.insurance_verification_state;
    NEW.insurance_verified_at := OLD.insurance_verified_at;
    NEW.insurance_verified_by := OLD.insurance_verified_by;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_application_decision_fields() FROM PUBLIC, anon, authenticated;