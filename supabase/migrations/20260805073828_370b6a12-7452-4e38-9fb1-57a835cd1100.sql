REVOKE ALL ON FUNCTION public.guard_document_verification_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_application_decision_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_contractor_profile_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_contractor_slug(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.activate_contractor_profile(uuid) FROM PUBLIC, anon;