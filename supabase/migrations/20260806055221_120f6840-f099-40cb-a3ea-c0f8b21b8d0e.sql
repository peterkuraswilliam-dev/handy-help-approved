
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  audience text NOT NULL DEFAULT 'contractor',
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  dedupe_key text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX notifications_dedupe_idx ON public.notifications (recipient_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX notifications_recipient_idx ON public.notifications (recipient_id, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

CREATE TRIGGER notifications_touch BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Helpers -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_user(
  _recipient uuid, _application uuid, _type text, _audience text,
  _title text, _message text, _action_url text, _dedupe text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _recipient IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (recipient_id, application_id, notification_type, audience, title, message, action_url, dedupe_key)
  VALUES (_recipient, _application, _type, _audience, _title, _message, _action_url, _dedupe)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admins(
  _application uuid, _type text, _title text, _message text, _action_url text, _dedupe text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    PERFORM public.notify_user(r.user_id, _application, _type, 'admin', _title, _message, _action_url, _dedupe);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.app_display_name(_app public.contractor_applications)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT coalesce(nullif(trim(_app.business_name), ''), nullif(trim(_app.contact_name), ''), 'A contractor');
$$;

-- Application lifecycle ------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_application_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins(
    NEW.id, 'application',
    public.app_display_name(NEW) || ' started an application',
    'A contractor has started a new application.',
    '/admin/applications/' || NEW.id::text,
    'app-created:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_application_created AFTER INSERT ON public.contractor_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_application_created();

CREATE OR REPLACE FUNCTION public.notify_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nm text := public.app_display_name(NEW);
        url text := '/admin/applications/' || NEW.id::text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'submitted' THEN
      IF OLD.status IN ('more_info_required','under_review') THEN
        PERFORM public.notify_admins(NEW.id, 'application', nm || ' resubmitted their application',
          'The application has been updated and resubmitted for review.', url,
          'app-resubmit:' || NEW.id::text || ':' || extract(epoch from now())::bigint::text);
      ELSE
        PERFORM public.notify_admins(NEW.id, 'application', nm || ' submitted an application',
          'A contractor application has been submitted for review.', url,
          'app-submit:' || NEW.id::text);
      END IF;
    ELSIF NEW.status = 'under_review' THEN
      PERFORM public.notify_user(NEW.user_id, NEW.id, 'application', 'contractor',
        'Your application is under review',
        'We are reviewing your application now. We will be in touch if we need anything else.',
        '/dashboard', 'under-review:' || NEW.id::text || ':' || extract(epoch from now())::bigint::text);
    ELSIF NEW.status = 'approved' THEN
      PERFORM public.notify_user(NEW.user_id, NEW.id, 'approval', 'contractor',
        'Your application has been approved',
        'Congratulations — you are now an Approved Contractor. Your public profile is live.',
        '/dashboard', 'approved:' || NEW.id::text || ':' || extract(epoch from now())::bigint::text);
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.notify_user(NEW.user_id, NEW.id, 'rejection', 'contractor',
        'Your application was not approved',
        coalesce(nullif(trim(NEW.contractor_decision_message), ''), 'Your application has not been approved at this time. Please review your dashboard for details.'),
        '/dashboard', 'rejected:' || NEW.id::text || ':' || extract(epoch from now())::bigint::text);
    ELSIF NEW.status = 'suspended' THEN
      PERFORM public.notify_user(NEW.user_id, NEW.id, 'suspension', 'contractor',
        'Your profile has been suspended',
        coalesce(nullif(trim(NEW.contractor_decision_message), ''), 'Your Approved Contractor profile is currently suspended.'),
        '/dashboard', 'suspended:' || NEW.id::text || ':' || extract(epoch from now())::bigint::text);
    END IF;

    IF NEW.status = 'approved' AND OLD.status = 'suspended' THEN
      PERFORM public.notify_user(NEW.user_id, NEW.id, 'profile', 'contractor',
        'Your profile has been restored',
        'Your Approved Contractor profile is live again.',
        '/dashboard', 'restored:' || NEW.id::text || ':' || extract(epoch from now())::bigint::text);
    END IF;
  END IF;

  -- Insurance details submitted for review
  IF NEW.insurance_verification_state = 'awaiting_review'
     AND (OLD.insurance_verification_state IS DISTINCT FROM 'awaiting_review'
          OR NEW.insurance_expiry_date IS DISTINCT FROM OLD.insurance_expiry_date) THEN
    PERFORM public.notify_admins(NEW.id, 'insurance', nm || ' submitted insurance for review',
      'Updated insurance details are awaiting verification.', url,
      'ins-review:' || NEW.id::text || ':' || extract(epoch from now())::bigint::text);
  END IF;

  IF NEW.insurance_verification_state = 'verified' AND OLD.insurance_verification_state IS DISTINCT FROM 'verified' THEN
    PERFORM public.notify_user(NEW.user_id, NEW.id, 'insurance', 'contractor',
      'Your insurance document has been verified',
      'Thank you — your public liability insurance has been checked and verified.',
      '/dashboard', 'ins-verified:' || NEW.id::text || ':' || extract(epoch from now())::bigint::text);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_application_status AFTER UPDATE ON public.contractor_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_application_status();

-- Information requests --------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_info_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE app public.contractor_applications%ROWTYPE;
BEGIN
  SELECT * INTO app FROM public.contractor_applications WHERE id = NEW.application_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_user(app.user_id, app.id, 'information_request', 'contractor',
      'We need more information about your application',
      NEW.message, '/dashboard', 'info-req:' || NEW.id::text);
  ELSIF NEW.responded_at IS DISTINCT FROM OLD.responded_at AND NEW.responded_at IS NOT NULL THEN
    PERFORM public.notify_admins(app.id, 'information_request',
      public.app_display_name(app) || ' updated the requested information',
      'The contractor has responded to an information request.',
      '/admin/applications/' || app.id::text,
      'info-resp:' || NEW.id::text || ':' || extract(epoch from NEW.responded_at)::bigint::text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_info_request_insert AFTER INSERT ON public.application_info_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_info_request();

CREATE TRIGGER notify_info_request_update AFTER UPDATE ON public.application_info_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_info_request();

-- Documents --------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_document_uploaded()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE app public.contractor_applications%ROWTYPE;
BEGIN
  SELECT * INTO app FROM public.contractor_applications WHERE id = NEW.application_id;
  IF app.user_id = auth.uid() THEN
    PERFORM public.notify_admins(app.id, 'document',
      public.app_display_name(app) || ' uploaded a document',
      'A new or replacement ' || NEW.kind::text || ' document has been uploaded.',
      '/admin/applications/' || app.id::text,
      'doc:' || NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_document_uploaded AFTER INSERT ON public.contractor_documents
FOR EACH ROW EXECUTE FUNCTION public.notify_document_uploaded();

CREATE OR REPLACE FUNCTION public.notify_document_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE app public.contractor_applications%ROWTYPE;
BEGIN
  IF NEW.verification_state IS DISTINCT FROM OLD.verification_state THEN
    SELECT * INTO app FROM public.contractor_applications WHERE id = NEW.application_id;
    IF NEW.verification_state = 'rejected' THEN
      PERFORM public.notify_user(app.user_id, app.id, 'document', 'contractor',
        'A document needs replacing',
        'One of your uploaded documents could not be accepted. Please upload a replacement.',
        '/dashboard', 'doc-reject:' || NEW.id::text || ':' || extract(epoch from now())::bigint::text);
    ELSIF NEW.verification_state = 'verified' AND NEW.kind = 'insurance' THEN
      PERFORM public.notify_user(app.user_id, app.id, 'insurance', 'contractor',
        'Your insurance document has been verified',
        'Thank you — your insurance document has been checked and verified.',
        '/dashboard', 'doc-ins-verified:' || NEW.id::text);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_document_verification AFTER UPDATE ON public.contractor_documents
FOR EACH ROW EXECUTE FUNCTION public.notify_document_verification();

-- Insurance expiry sweep --------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_insurance_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.contractor_applications%ROWTYPE; d int; nm text; url text;
BEGIN
  FOR a IN
    SELECT * FROM public.contractor_applications
    WHERE insurance_expiry_date IS NOT NULL
      AND status IN ('approved','suspended','submitted','under_review','more_info_required')
  LOOP
    d := a.insurance_expiry_date - current_date;
    nm := public.app_display_name(a);
    url := '/admin/applications/' || a.id::text;
    IF d < 0 THEN
      PERFORM public.notify_user(a.user_id, a.id, 'insurance', 'contractor',
        'Your insurance has expired',
        'Your public liability insurance expired on ' || to_char(a.insurance_expiry_date, 'DD Mon YYYY') || '. Please upload up-to-date cover.',
        '/dashboard', 'ins-expired:' || a.id::text || ':' || a.insurance_expiry_date::text);
      PERFORM public.notify_admins(a.id, 'insurance', nm || ' has expired insurance',
        'Cover expired on ' || to_char(a.insurance_expiry_date, 'DD Mon YYYY') || '.', url,
        'ins-expired:' || a.id::text || ':' || a.insurance_expiry_date::text);
    ELSIF d <= 30 THEN
      PERFORM public.notify_user(a.user_id, a.id, 'insurance', 'contractor',
        'Your insurance is expiring soon',
        'Your public liability insurance expires on ' || to_char(a.insurance_expiry_date, 'DD Mon YYYY') || '. Please upload renewed cover.',
        '/dashboard', 'ins-soon:' || a.id::text || ':' || a.insurance_expiry_date::text);
      PERFORM public.notify_admins(a.id, 'insurance', nm || ' has insurance expiring soon',
        'Cover expires on ' || to_char(a.insurance_expiry_date, 'DD Mon YYYY') || '.', url,
        'ins-soon:' || a.id::text || ':' || a.insurance_expiry_date::text);
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_insurance_notifications() TO authenticated;
