
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'contractor');
CREATE TYPE public.application_status AS ENUM ('draft','submitted','under_review','more_info_required','approved','rejected','suspended');
CREATE TYPE public.document_kind AS ENUM ('logo','insurance','qualification','other');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto create profile + default contractor role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'contractor');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Contractor applications
CREATE TABLE public.contractor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  main_area TEXT,
  description TEXT,
  website TEXT,
  facebook TEXT,
  logo_path TEXT,
  insurance_status TEXT,
  insurance_evidence_path TEXT,
  qualifications TEXT,
  references_text TEXT,
  agreed_rules BOOLEAN NOT NULL DEFAULT false,
  confirmed_accurate BOOLEAN NOT NULL DEFAULT false,
  status application_status NOT NULL DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  decision_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.contractor_applications TO authenticated;
GRANT SELECT ON public.contractor_applications TO anon;
GRANT ALL ON public.contractor_applications TO service_role;
ALTER TABLE public.contractor_applications ENABLE ROW LEVEL SECURITY;

-- Owner can read/insert/update own row but cannot set decision statuses
CREATE POLICY "owner select" ON public.contractor_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "public read approved" ON public.contractor_applications FOR SELECT TO anon
  USING (status = 'approved');
CREATE POLICY "owner insert" ON public.contractor_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status IN ('draft','submitted'));
CREATE POLICY "owner update non-decision" ON public.contractor_applications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND status IN ('draft','submitted','more_info_required')
  );
CREATE POLICY "admin update any" ON public.contractor_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_apps_updated BEFORE UPDATE ON public.contractor_applications
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Services
CREATE TABLE public.contractor_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  service TEXT NOT NULL
);
GRANT SELECT, INSERT, DELETE ON public.contractor_services TO authenticated;
GRANT SELECT ON public.contractor_services TO anon;
GRANT ALL ON public.contractor_services TO service_role;
ALTER TABLE public.contractor_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "svc select" ON public.contractor_services FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "svc select public" ON public.contractor_services FOR SELECT TO anon
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.status='approved'));
CREATE POLICY "svc insert own" ON public.contractor_services FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "svc delete own" ON public.contractor_services FOR DELETE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));

-- Areas
CREATE TABLE public.contractor_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  area TEXT NOT NULL
);
GRANT SELECT, INSERT, DELETE ON public.contractor_areas TO authenticated;
GRANT SELECT ON public.contractor_areas TO anon;
GRANT ALL ON public.contractor_areas TO service_role;
ALTER TABLE public.contractor_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ar select" ON public.contractor_areas FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "ar select public" ON public.contractor_areas FOR SELECT TO anon
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.status='approved'));
CREATE POLICY "ar insert own" ON public.contractor_areas FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "ar delete own" ON public.contractor_areas FOR DELETE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));

-- Documents (private)
CREATE TABLE public.contractor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  kind document_kind NOT NULL,
  path TEXT NOT NULL,
  original_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.contractor_documents TO authenticated;
GRANT ALL ON public.contractor_documents TO service_role;
ALTER TABLE public.contractor_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc select own or admin" ON public.contractor_documents FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "doc insert own" ON public.contractor_documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "doc delete own" ON public.contractor_documents FOR DELETE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));

-- Gallery (public when approved)
CREATE TABLE public.contractor_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.contractor_gallery TO authenticated;
GRANT SELECT ON public.contractor_gallery TO anon;
GRANT ALL ON public.contractor_gallery TO service_role;
ALTER TABLE public.contractor_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gal select" ON public.contractor_gallery FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "gal select public" ON public.contractor_gallery FOR SELECT TO anon
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.status='approved'));
CREATE POLICY "gal insert own" ON public.contractor_gallery FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "gal delete own" ON public.contractor_gallery FOR DELETE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));

-- Admin notes (admin only)
CREATE TABLE public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notes TO authenticated;
GRANT ALL ON public.admin_notes TO service_role;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes admin all" ON public.admin_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') AND admin_id = auth.uid());

-- Status history
CREATE TABLE public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  status application_status NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.application_status_history TO authenticated;
GRANT ALL ON public.application_status_history TO service_role;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hist select" ON public.application_status_history FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "hist insert self" ON public.application_status_history FOR INSERT TO authenticated
  WITH CHECK (
    (changed_by = auth.uid())
    AND (
      public.has_role(auth.uid(),'admin')
      OR EXISTS(SELECT 1 FROM public.contractor_applications a WHERE a.id = application_id AND a.user_id = auth.uid() AND status IN ('draft','submitted','more_info_required'))
    )
  );
