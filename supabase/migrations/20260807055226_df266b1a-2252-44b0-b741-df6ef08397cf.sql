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
  NEW.status := OLD.status;
  NEW.completed_at := OLD.completed_at;
  NEW.closed_at := OLD.closed_at;

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.guard_info_request_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS info_requests_guard ON public.application_info_requests;
CREATE TRIGGER info_requests_guard
BEFORE UPDATE ON public.application_info_requests
FOR EACH ROW EXECUTE FUNCTION public.guard_info_request_fields();