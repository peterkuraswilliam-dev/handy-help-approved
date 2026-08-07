CREATE OR REPLACE FUNCTION public.guard_info_request_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.application_id := OLD.application_id;
  NEW.message := OLD.message;
  NEW.requested_sections := OLD.requested_sections;
  NEW.requested_documents := OLD.requested_documents;
  NEW.requested_by := OLD.requested_by;
  NEW.requested_at := OLD.requested_at;
  NEW.due_date := OLD.due_date;
  NEW.closed_at := OLD.closed_at;

  -- Contractors may only move an open request to 'responded'.
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'open' AND NEW.status = 'responded') THEN
    NEW.status := OLD.status;
  END IF;

  IF NEW.status <> 'responded' THEN
    NEW.completed_at := OLD.completed_at;
  END IF;

  RETURN NEW;
END;
$function$;