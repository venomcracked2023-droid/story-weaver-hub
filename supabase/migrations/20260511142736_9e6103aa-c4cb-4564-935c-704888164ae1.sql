-- Revoke public execute from SECURITY DEFINER functions; keep them usable by triggers/RLS (run as owner)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_application_approved() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_comment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;