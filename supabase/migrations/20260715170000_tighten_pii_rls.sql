-- Tighten public read access to PII (profiles.email) and role assignments.
-- Introduce a public_profiles view for non-sensitive display data.

-- 1. profiles: restrict SELECT so email is never returned to strangers.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles selectable by owner or admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Public, non-sensitive projection used by comments & other public UI.
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, display_name, avatar_url
  FROM public.profiles;

ALTER VIEW public.public_profiles OWNER TO postgres;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. user_roles: no more public enumeration of who is admin/contributor.
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3. has_role: keep SECURITY DEFINER (needed by RLS), but stop exposing it
-- as a callable RPC to anonymous visitors.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
