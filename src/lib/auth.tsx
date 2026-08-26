import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "contributor" | "user";

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  roles: Role[];
  profile: { display_name: string | null; avatar_url: string | null; email: string | null } | null;
  isAdmin: boolean;
  isContributor: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profile, setProfile] = useState<AuthState["profile"]>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserData(u: User) {
    const uid = u.id;
    const [{ data: rolesData }, { data: profileData }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("display_name, avatar_url, email").eq("id", uid).maybeSingle(),
    ]);
    setRoles((rolesData ?? []).map((r) => r.role as Role));
    setProfile(
      profileData ?? {
        display_name:
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          null,
        avatar_url:
          u.user_metadata?.avatar_url ||
          u.user_metadata?.picture ||
          null,
        email: u.email || null,
      },
    );
  }

  useEffect(() => {
    // Set up listener FIRST, then check session.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadUserData(s.user), 0);
      } else {
        setRoles([]);
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadUserData(data.session.user).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    loading,
    session,
    user: session?.user ?? null,
    roles,
    profile,
    isAdmin: roles.includes("admin"),
    isContributor: roles.includes("contributor") || roles.includes("admin"),
    refresh: async () => {
      if (session?.user) await loadUserData(session.user);
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}