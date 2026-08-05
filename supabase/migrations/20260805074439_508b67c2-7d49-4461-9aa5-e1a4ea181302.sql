ALTER TABLE public.contractor_profiles ADD COLUMN IF NOT EXISTS insurance_expiry_date date;

CREATE OR REPLACE FUNCTION public.guard_contractor_profile_fields()
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
  NEW.insurance_expiry_date := OLD.insurance_expiry_date;
  NEW.qualifications := OLD.qualifications;
  NEW.logo_path := OLD.logo_path;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_contractor_profile(_application_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      insurance_expiry_date = app.insurance_expiry_date,
      qualifications = app.qualifications,
      logo_path = app.logo_path,
      public_description = coalesce(existing.public_description, app.description)
    WHERE id = existing.id
    RETURNING id INTO new_id;
  ELSE
    INSERT INTO public.contractor_profiles (
      application_id, user_id, slug, status, business_name, main_area, approval_date,
      public_description, services, areas, website, facebook, phone, email,
      insurance_status, insurance_expiry_date, qualifications, logo_path
    ) VALUES (
      _application_id, app.user_id, public.generate_contractor_slug(app.business_name), 'active',
      app.business_name, app.main_area, coalesce(app.approved_at, now()),
      app.description, coalesce(svc, '{}'), coalesce(ars, '{}'), app.website, app.facebook,
      app.phone, app.email, app.insurance_status, app.insurance_expiry_date, app.qualifications, app.logo_path
    )
    RETURNING id INTO new_id;
  END IF;

  RETURN new_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_contractor_profile_fields() FROM PUBLIC, anon, authenticated;