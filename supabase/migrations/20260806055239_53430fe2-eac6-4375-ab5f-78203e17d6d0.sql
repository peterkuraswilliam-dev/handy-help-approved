
REVOKE ALL ON FUNCTION public.notify_user(uuid, uuid, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admins(uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_application_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_application_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_info_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_document_uploaded() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_document_verification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_insurance_notifications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_insurance_notifications() TO authenticated;
