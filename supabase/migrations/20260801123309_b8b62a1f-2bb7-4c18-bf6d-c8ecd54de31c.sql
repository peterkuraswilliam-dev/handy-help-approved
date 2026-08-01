CREATE TABLE public.contractor_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.contractor_profiles(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('suspend','restore')),
  previous_status text,
  new_status text NOT NULL,
  reason text NOT NULL,
  public_message text,
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.contractor_status_events TO authenticated;
GRANT ALL ON public.contractor_status_events TO service_role;

ALTER TABLE public.contractor_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all status events"
ON public.contractor_status_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Contractors can view their own status events"
ON public.contractor_status_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.contractor_applications a
  WHERE a.id = contractor_status_events.application_id AND a.user_id = auth.uid()
));

CREATE POLICY "Admins can create status events"
ON public.contractor_status_events FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

CREATE TRIGGER touch_contractor_status_events
BEFORE UPDATE ON public.contractor_status_events
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_contractor_status_events_app ON public.contractor_status_events(application_id, created_at DESC);

-- Suspend an approved contractor
CREATE OR REPLACE FUNCTION public.suspend_contractor(
  _application_id uuid,
  _reason text,
  _contractor_message text,
  _admin_note text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  app public.contractor_applications%ROWTYPE;
  prof public.contractor_profiles%ROWTYPE;
  event_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can suspend contractors';
  END IF;
  IF coalesce(trim(_reason), '') = '' THEN
    RAISE EXCEPTION 'A suspension reason is required';
  END IF;
  IF coalesce(trim(_contractor_message), '') = '' THEN
    RAISE EXCEPTION 'A contractor-facing message is required';
  END IF;

  SELECT * INTO app FROM public.contractor_applications WHERE id = _application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF app.status <> 'approved' THEN RAISE EXCEPTION 'Only approved contractors can be suspended'; END IF;

  SELECT * INTO prof FROM public.contractor_profiles WHERE application_id = _application_id;

  UPDATE public.contractor_applications
  SET status = 'suspended',
      decided_by = auth.uid(),
      decided_at = now(),
      decision_reason = _reason,
      contractor_decision_message = _contractor_message
  WHERE id = _application_id;

  IF prof.id IS NOT NULL THEN
    UPDATE public.contractor_profiles SET status = 'suspended' WHERE id = prof.id;
  END IF;

  INSERT INTO public.application_status_history (application_id, status, reason, changed_by)
  VALUES (_application_id, 'suspended', _contractor_message, auth.uid());

  INSERT INTO public.contractor_status_events (
    application_id, profile_id, action, previous_status, new_status, reason, public_message, admin_id
  ) VALUES (
    _application_id, prof.id, 'suspend', 'approved', 'suspended', _reason, _contractor_message, auth.uid()
  ) RETURNING id INTO event_id;

  IF coalesce(trim(_admin_note), '') <> '' THEN
    INSERT INTO public.admin_notes (application_id, admin_id, note)
    VALUES (_application_id, auth.uid(), '[Suspension note] ' || _admin_note);
  END IF;

  RETURN event_id;
END;
$$;

-- Restore a suspended contractor
CREATE OR REPLACE FUNCTION public.restore_contractor(
  _application_id uuid,
  _reason text,
  _contractor_message text DEFAULT NULL,
  _admin_note text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  app public.contractor_applications%ROWTYPE;
  prof public.contractor_profiles%ROWTYPE;
  event_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can restore contractors';
  END IF;
  IF coalesce(trim(_reason), '') = '' THEN
    RAISE EXCEPTION 'A restoration reason is required';
  END IF;

  SELECT * INTO app FROM public.contractor_applications WHERE id = _application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF app.status <> 'suspended' THEN RAISE EXCEPTION 'Only suspended contractors can be restored'; END IF;

  SELECT * INTO prof FROM public.contractor_profiles WHERE application_id = _application_id;

  UPDATE public.contractor_applications
  SET status = 'approved',
      decided_by = auth.uid(),
      decided_at = now(),
      decision_reason = _reason,
      contractor_decision_message = _contractor_message
  WHERE id = _application_id;

  IF prof.id IS NOT NULL THEN
    UPDATE public.contractor_profiles SET status = 'active' WHERE id = prof.id;
  ELSE
    PERFORM public.activate_contractor_profile(_application_id);
    SELECT * INTO prof FROM public.contractor_profiles WHERE application_id = _application_id;
  END IF;

  INSERT INTO public.application_status_history (application_id, status, reason, changed_by)
  VALUES (_application_id, 'approved', coalesce(_contractor_message, 'Approved Contractor profile restored'), auth.uid());

  INSERT INTO public.contractor_status_events (
    application_id, profile_id, action, previous_status, new_status, reason, public_message, admin_id
  ) VALUES (
    _application_id, prof.id, 'restore', 'suspended', 'approved', _reason, _contractor_message, auth.uid()
  ) RETURNING id INTO event_id;

  IF coalesce(trim(_admin_note), '') <> '' THEN
    INSERT INTO public.admin_notes (application_id, admin_id, note)
    VALUES (_application_id, auth.uid(), '[Restoration note] ' || _admin_note);
  END IF;

  RETURN event_id;
END;
$$;