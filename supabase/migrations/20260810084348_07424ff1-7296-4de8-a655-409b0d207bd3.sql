DO $$
DECLARE app_id uuid := '8e80ab48-3f45-4aa2-9640-dcb557576f7a';
BEGIN
  DELETE FROM public.notifications WHERE application_id = app_id;
  DELETE FROM public.contractor_status_events WHERE application_id = app_id;
  UPDATE public.contractor_profiles SET featured_photo_id = NULL WHERE application_id = app_id;
  DELETE FROM public.contractor_profiles WHERE application_id = app_id;
  DELETE FROM public.contractor_gallery WHERE application_id = app_id;
  UPDATE public.contractor_documents SET replaced_by_document_id = NULL WHERE application_id = app_id;
  DELETE FROM public.contractor_documents WHERE application_id = app_id;
  DELETE FROM public.application_info_request_items WHERE application_id = app_id;
  DELETE FROM public.application_info_requests WHERE application_id = app_id;
  DELETE FROM public.application_review_checks WHERE application_id = app_id;
  DELETE FROM public.application_status_history WHERE application_id = app_id;
  DELETE FROM public.admin_notes WHERE application_id = app_id;
  DELETE FROM public.contractor_services WHERE application_id = app_id;
  DELETE FROM public.contractor_areas WHERE application_id = app_id;
  DELETE FROM public.contractor_applications WHERE id = app_id;
END $$;