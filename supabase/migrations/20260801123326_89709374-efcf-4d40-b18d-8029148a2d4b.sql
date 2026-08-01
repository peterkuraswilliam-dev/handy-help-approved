REVOKE EXECUTE ON FUNCTION public.suspend_contractor(uuid, text, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.restore_contractor(uuid, text, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.suspend_contractor(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_contractor(uuid, text, text, text) TO authenticated;