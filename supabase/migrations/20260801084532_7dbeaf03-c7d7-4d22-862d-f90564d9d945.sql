-- Public work photo selection
ALTER TABLE public.contractor_gallery
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE TABLE public.contractor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden','suspended')),
  business_name text,
  main_area text,
  approval_date timestamptz,
  public_description text,
  services text[] NOT NULL DEFAULT '{}',
  areas text[] NOT NULL DEFAULT '{}',
  website text,
  facebook text,
  phone text,
  email text,
  phone_public boolean NOT NULL DEFAULT false,
  email_public boolean NOT NULL DEFAULT false,
  insurance_status text,
  qualifications text,
  logo_path text,
  featured_photo_id uuid REFERENCES public.contractor_gallery(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.contractor_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.contractor_profiles TO authenticated;
GRANT ALL ON public.contractor_profiles TO service_role;

ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active profiles are publicly readable"
  ON public.contractor_profiles FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Contractors can read their own profile"
  ON public.contractor_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON public.contractor_profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Contractors can update their own profile"
  ON public.contractor_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all profiles"
  ON public.contractor_profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create profiles"
  ON public.contractor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER contractor_profiles_touch
  BEFORE UPDATE ON public.contractor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Contractors may only change their public presentation fields
CREATE OR REPLACE FUNCTION public.guard_contractor_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.application_id := OLD.application_id;
  NEW.user_id := OLD.user_id;
  NEW.slug := OLD.slug;
  NEW.status := OLD.status;
  NEW.business_name := OLD.business_name;
  NEW.main_area := OLD.main_area;
  NEW.approval_date := OLD.approval_date;
  NEW.services := OLD.services;
  NEW.areas := OLD.areas;
  NEW.phone := OLD.phone;
  NEW.email := OLD.email;
  NEW.insurance_status := OLD.insurance_status;
  NEW.qualifications := OLD.qualifications;
  NEW.logo_path := OLD.logo_path;

  RETURN NEW;
END;
$$;

CREATE TRIGGER contractor_profiles_guard
  BEFORE UPDATE ON public.contractor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_contractor_profile_fields();

-- Public photo access for active profiles
CREATE POLICY "Public work photos of active profiles are readable"
  ON public.contractor_gallery FOR SELECT
  TO anon, authenticated
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM public.contractor_profiles p
      WHERE p.application_id = contractor_gallery.application_id
        AND p.status = 'active'
    )
  );

CREATE POLICY "Contractors can toggle public flag on own photos"
  ON public.contractor_gallery FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contractor_applications a
    WHERE a.id = contractor_gallery.application_id AND a.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contractor_applications a
    WHERE a.id = contractor_gallery.application_id AND a.user_id = auth.uid()
  ));

-- Slug generation
CREATE OR REPLACE FUNCTION public.generate_contractor_slug(_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 1;
BEGIN
  base := lower(coalesce(nullif(trim(_name), ''), 'contractor'));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  IF base = '' THEN base := 'contractor'; END IF;
  base := left(base, 60);
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.contractor_profiles WHERE slug = candidate) LOOP
    n := n + 1;
    candidate := base || '-' || n::text;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Create or reactivate a public profile for an approved application (admins only)
CREATE OR REPLACE FUNCTION public.activate_contractor_profile(_application_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app public.contractor_applications%ROWTYPE;
  existing public.contractor_profiles%ROWTYPE;
  new_id uuid;
  svc text[];
  ars text[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can activate contractor profiles';
  END IF;

  SELECT * INTO app FROM public.contractor_applications WHERE id = _application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF app.status <> 'approved' THEN RAISE EXCEPTION 'Only approved applications can have a public profile'; END IF;

  SELECT array_agg(service ORDER BY service) INTO svc FROM public.contractor_services WHERE application_id = _application_id;
  SELECT array_agg(area ORDER BY area) INTO ars FROM public.contractor_areas WHERE application_id = _application_id;

  SELECT * INTO existing FROM public.contractor_profiles WHERE application_id = _application_id;

  IF FOUND THEN
    UPDATE public.contractor_profiles SET
      status = 'active',
      business_name = app.business_name,
      main_area = app.main_area,
      approval_date = coalesce(app.approved_at, existing.approval_date, now()),
      services = coalesce(svc, '{}'),
      areas = coalesce(ars, '{}'),
      phone = app.phone,
      email = app.email,
      insurance_status = app.insurance_status,
      qualifications = app.qualifications,
      logo_path = app.logo_path,
      public_description = coalesce(existing.public_description, app.description)
    WHERE id = existing.id
    RETURNING id INTO new_id;
  ELSE
    INSERT INTO public.contractor_profiles (
      application_id, user_id, slug, status, business_name, main_area, approval_date,
      public_description, services, areas, website, facebook, phone, email,
      insurance_status, qualifications, logo_path
    ) VALUES (
      _application_id, app.user_id, public.generate_contractor_slug(app.business_name), 'active',
      app.business_name, app.main_area, coalesce(app.approved_at, now()),
      app.description, coalesce(svc, '{}'), coalesce(ars, '{}'), app.website, app.facebook,
      app.phone, app.email, app.insurance_status, app.qualifications, app.logo_path
    )
    RETURNING id INTO new_id;
  END IF;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_contractor_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_contractor_slug(text) TO authenticated;