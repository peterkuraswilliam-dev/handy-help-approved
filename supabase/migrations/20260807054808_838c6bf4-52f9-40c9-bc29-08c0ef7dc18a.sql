-- 1. Remove anonymous access to raw application data (public site reads contractor_profiles instead)
DROP POLICY IF EXISTS "public read approved" ON public.contractor_applications;
DROP POLICY IF EXISTS "svc select public" ON public.contractor_services;
DROP POLICY IF EXISTS "ar select public" ON public.contractor_areas;
DROP POLICY IF EXISTS "gal select public" ON public.contractor_gallery;

-- 2. Status transition protection for contractors
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

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Contractors may only submit (or resubmit) from an editable state.
    IF NOT (OLD.status IN ('draft','more_info_required') AND NEW.status = 'submitted') THEN
      RAISE EXCEPTION 'This status change is not allowed';
    END IF;
  END IF;

  -- Decided applications are read-only for contractors.
  IF OLD.status IN ('approved','rejected','suspended','under_review')
     AND NEW.status = OLD.status
     AND NEW.status IN ('approved','rejected','suspended') THEN
    NULL; -- profile-side edits are handled on contractor_profiles
  END IF;

  NEW.user_id := OLD.user_id;
  NEW.approved_at := OLD.approved_at;
  NEW.rejected_at := OLD.rejected_at;
  NEW.decided_at := OLD.decided_at;
  NEW.decided_by := OLD.decided_by;
  NEW.decision_reason := OLD.decision_reason;
  NEW.contractor_decision_message := OLD.contractor_decision_message;

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

-- 3. History rows: contractors may only record a submission
DROP POLICY IF EXISTS "hist insert self" ON public.application_status_history;
CREATE POLICY "hist insert self" ON public.application_status_history
FOR INSERT TO authenticated
WITH CHECK (
  changed_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      status = 'submitted'
      AND EXISTS (
        SELECT 1 FROM public.contractor_applications a
        WHERE a.id = application_id AND a.user_id = auth.uid()
      )
    )
  )
);

-- 4. Notifications: recipients may only change read state
CREATE OR REPLACE FUNCTION public.guard_notification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.recipient_id := OLD.recipient_id;
  NEW.application_id := OLD.application_id;
  NEW.notification_type := OLD.notification_type;
  NEW.audience := OLD.audience;
  NEW.title := OLD.title;
  NEW.message := OLD.message;
  NEW.action_url := OLD.action_url;
  NEW.dedupe_key := OLD.dedupe_key;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notifications_guard ON public.notifications;
CREATE TRIGGER notifications_guard
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.guard_notification_fields();