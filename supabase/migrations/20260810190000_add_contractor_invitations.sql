-- Invitation-only contractor access.
-- Raw invitation tokens are returned once and are never persisted.

CREATE TABLE public.contractor_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id),
  reservation_id uuid,
  reserved_at timestamptz,
  CONSTRAINT contractor_invitations_email_normalised
    CHECK (email = lower(btrim(email)) AND email <> ''),
  CONSTRAINT contractor_invitations_expiry_after_creation
    CHECK (expires_at > created_at),
  CONSTRAINT contractor_invitations_acceptance_complete
    CHECK ((accepted_at IS NULL) = (accepted_by IS NULL)),
  CONSTRAINT contractor_invitations_not_accepted_and_revoked
    CHECK (accepted_at IS NULL OR revoked_at IS NULL),
  CONSTRAINT contractor_invitations_revocation_complete
    CHECK ((revoked_at IS NULL) = (revoked_by IS NULL)),
  CONSTRAINT contractor_invitations_reservation_complete
    CHECK ((reservation_id IS NULL) = (reserved_at IS NULL))
);

CREATE INDEX contractor_invitations_created_by_state_idx
  ON public.contractor_invitations (created_by, created_at DESC);
CREATE INDEX contractor_invitations_email_idx
  ON public.contractor_invitations (email);
CREATE INDEX contractor_invitations_pending_expiry_idx
  ON public.contractor_invitations (expires_at)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.contractor_invitations ENABLE ROW LEVEL SECURITY;
GRANT SELECT (
  id, email, created_by, created_at, expires_at,
  revoked_at, revoked_by, accepted_at, accepted_by
) ON public.contractor_invitations TO authenticated;
GRANT ALL ON public.contractor_invitations TO service_role;

CREATE POLICY "admins can read contractor invitations"
  ON public.contractor_invitations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.create_contractor_invitation(_email text)
RETURNS TABLE (
  id uuid,
  email text,
  token text,
  created_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _normalised_email text := lower(btrim(_email));
  _token text;
  _row public.contractor_invitations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorised';
  END IF;
  IF _normalised_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR length(_normalised_email) > 255 THEN
    RAISE EXCEPTION 'invalid email';
  END IF;

  -- Serialise creation per admin so the 20-pending limit cannot race.
  PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));

  IF (
    SELECT count(*)
    FROM public.contractor_invitations i
    WHERE i.created_by = auth.uid()
      AND i.accepted_at IS NULL
      AND i.revoked_at IS NULL
      AND i.expires_at > now()
  ) >= 20 THEN
    RAISE EXCEPTION 'pending invitation limit reached';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.contractor_invitations i
    WHERE i.email = _normalised_email
      AND i.accepted_at IS NULL
      AND i.revoked_at IS NULL
      AND i.expires_at > now()
  ) THEN
    RAISE EXCEPTION 'active invitation already exists';
  END IF;

  _token := encode(gen_random_bytes(32), 'hex');
  INSERT INTO public.contractor_invitations (email, token_hash, created_by)
  VALUES (_normalised_email, encode(digest(_token, 'sha256'), 'hex'), auth.uid())
  RETURNING * INTO _row;

  RETURN QUERY SELECT _row.id, _row.email, _token, _row.created_at, _row.expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_contractor_invitation(_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorised';
  END IF;

  UPDATE public.contractor_invitations
  SET revoked_at = now(), revoked_by = auth.uid(),
      reservation_id = NULL, reserved_at = NULL
  WHERE id = _invitation_id
    AND accepted_at IS NULL
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation cannot be revoked';
  END IF;
END;
$$;

-- Used only by the server-side account creation flow with the service-role client.
CREATE OR REPLACE FUNCTION public.reserve_contractor_invitation(
  _token text,
  _email text,
  _reservation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _invitation_id uuid;
  _normalised_email text := lower(btrim(_email));
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'not authorised';
  END IF;

  UPDATE public.contractor_invitations
  SET reservation_id = _reservation_id, reserved_at = now()
  WHERE token_hash = encode(digest(_token, 'sha256'), 'hex')
    AND email = _normalised_email
    AND accepted_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > now()
    AND (reservation_id IS NULL OR reserved_at < now() - interval '10 minutes')
  RETURNING id INTO _invitation_id;

  IF _invitation_id IS NULL THEN
    RAISE EXCEPTION 'invitation is invalid';
  END IF;
  RETURN _invitation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_contractor_invitation(
  _invitation_id uuid,
  _reservation_id uuid,
  _user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'not authorised';
  END IF;

  UPDATE public.contractor_invitations
  SET accepted_at = now(), accepted_by = _user_id,
      reservation_id = NULL, reserved_at = NULL
  WHERE id = _invitation_id
    AND reservation_id = _reservation_id
    AND accepted_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation is invalid';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'contractor')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_contractor_invitation(
  _invitation_id uuid,
  _reservation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'not authorised';
  END IF;
  UPDATE public.contractor_invitations
  SET reservation_id = NULL, reserved_at = NULL
  WHERE id = _invitation_id
    AND reservation_id = _reservation_id
    AND accepted_at IS NULL;
END;
$$;

-- Matching existing users can consume an invitation atomically.
CREATE OR REPLACE FUNCTION public.accept_contractor_invitation(_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authorised';
  END IF;
  SELECT lower(email) INTO _email FROM auth.users WHERE id = auth.uid();

  UPDATE public.contractor_invitations
  SET accepted_at = now(), accepted_by = auth.uid(),
      reservation_id = NULL, reserved_at = NULL
  WHERE token_hash = encode(digest(_token, 'sha256'), 'hex')
    AND email = _email
    AND accepted_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > now()
    AND reservation_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation is invalid';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'contractor')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.create_contractor_invitation(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_contractor_invitation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_contractor_invitation(text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_contractor_invitation(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_contractor_invitation(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_contractor_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_contractor_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_contractor_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_contractor_invitation(text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_contractor_invitation(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_contractor_invitation(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_contractor_invitation(text) TO authenticated;

-- New auth users no longer receive contractor access automatically. The trusted
-- invitation flow grants the role only after successful invitation consumption.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation_id uuid;
  _reservation_id uuid;
BEGIN
  BEGIN
    _invitation_id := (NEW.raw_app_meta_data->>'contractor_invitation_id')::uuid;
    _reservation_id := (NEW.raw_app_meta_data->>'contractor_invitation_reservation_id')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'valid contractor invitation required';
  END;

  IF _invitation_id IS NULL OR _reservation_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.contractor_invitations i
    WHERE i.id = _invitation_id
      AND i.reservation_id = _reservation_id
      AND i.email = lower(NEW.email)
      AND i.accepted_at IS NULL
      AND i.revoked_at IS NULL
      AND i.expires_at > now()
      AND i.reserved_at >= now() - interval '10 minutes'
  ) THEN
    RAISE EXCEPTION 'valid contractor invitation required';
  END IF;

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "owner insert" ON public.contractor_applications;
CREATE POLICY "owner insert" ON public.contractor_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.has_role(auth.uid(), 'contractor')
    AND status IN ('draft', 'submitted')
  );

DROP POLICY IF EXISTS "owner update non-decision" ON public.contractor_applications;
CREATE POLICY "owner update non-decision" ON public.contractor_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'contractor'))
  WITH CHECK (
    user_id = auth.uid()
    AND public.has_role(auth.uid(), 'contractor')
    AND status IN ('draft', 'submitted', 'more_info_required')
  );

COMMENT ON TABLE public.contractor_invitations IS
  'Email-bound, seven-day, single-use invitations. Only SHA-256 token digests are stored.';
