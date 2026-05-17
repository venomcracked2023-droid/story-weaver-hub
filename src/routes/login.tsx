import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { LogIn, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => {
    const title = "Đăng nhập — Lcucumber";
    const desc =
      "Đăng nhập hoặc tạo tài khoản Lcucumber để theo dõi truyện yêu thích, bình luận và đăng webtoon mới.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "noindex,follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
    };
  },
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthError, setOauthError] = useState<null | {
    provider: string;
    message: string;
    status?: number | string;
    code?: string;
    authorizeUrl?: string;
    supabaseUrl?: string;
    raw?: unknown;
  }>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  // Capture OAuth errors returned via redirect (?error=...&error_description=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const err = qs.get("error") || hash.get("error");
    const desc = qs.get("error_description") || hash.get("error_description");
    const code = qs.get("error_code") || hash.get("error_code");
    if (err || desc) {
      setOauthError({
        provider: "google",
        message: decodeURIComponent(desc || err || "Unknown OAuth error"),
        code: code || err || undefined,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Đã tạo tài khoản. Kiểm tra email để xác thực.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Đăng nhập thành công");
        navigate({ to: "/" });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Lỗi");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setOauthError(null);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const redirectTo = window.location.origin + "/login";
    const authorizeUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        toast.error(error.message ?? "Lỗi Google đăng nhập");
        setOauthError({
          provider: "google",
          message: error.message ?? "Unknown error",
          status: (error as any).status,
          code: (error as any).code ?? (error as any).name,
          authorizeUrl,
          supabaseUrl,
          raw: error,
        });
        setBusy(false);
      }
      // On success, Supabase redirects the browser to Google.
    } catch (e: any) {
      toast.error(e?.message ?? "Lỗi Google đăng nhập");
      setOauthError({
        provider: "google",
        message: e?.message ?? String(e),
        status: e?.status,
        code: e?.code ?? e?.name,
        authorizeUrl,
        supabaseUrl,
        raw: e,
      });
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Đăng nhập để đọc, theo dõi và đăng truyện."
              : "Tham gia Lcucumber trong vài giây."}
          </p>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5 16.3 4.5 9.7 8.7 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-5.1c-2 1.4-4.4 2.1-6.9 2.1-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.2 16.2 43.5 24 43.5z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6 5.1c-.4.4 6.3-4.6 6.3-14.5 0-1.2-.1-2.3-.4-3.5z"/>
            </svg>
            Tiếp tục với Google
          </button>

          {oauthError && (
            <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Google OAuth lỗi
              </div>
              <dl className="space-y-1 font-mono leading-relaxed text-foreground">
                <div><span className="text-muted-foreground">provider:</span> {oauthError.provider}</div>
                <div><span className="text-muted-foreground">message:</span> {oauthError.message}</div>
                {oauthError.code && <div><span className="text-muted-foreground">code:</span> {String(oauthError.code)}</div>}
                {oauthError.status !== undefined && <div><span className="text-muted-foreground">status:</span> {String(oauthError.status)}</div>}
                {oauthError.supabaseUrl && <div className="break-all"><span className="text-muted-foreground">supabaseUrl:</span> {oauthError.supabaseUrl}</div>}
                {oauthError.authorizeUrl && (
                  <div className="break-all">
                    <span className="text-muted-foreground">authorizeUrl:</span>{" "}
                    <a href={oauthError.authorizeUrl} target="_blank" rel="noreferrer" className="underline">
                      {oauthError.authorizeUrl}
                    </a>
                  </div>
                )}
                <div className="break-all"><span className="text-muted-foreground">callback (Google phải có):</span> {oauthError.supabaseUrl}/auth/v1/callback</div>
              </dl>
              <button
                type="button"
                onClick={() => {
                  const text = JSON.stringify(oauthError, null, 2);
                  navigator.clipboard?.writeText(text);
                  toast.success("Đã copy chi tiết lỗi");
                }}
                className="mt-2 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground hover:bg-secondary"
              >
                Copy chi tiết
              </button>
            </div>
          )}

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> hoặc <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên hiển thị"
                aria-label="Tên hiển thị"
                className="input w-full"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              className="input w-full"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              aria-label="Mật khẩu"
              className="input w-full"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary hover:underline"
            >
              {mode === "signin" ? "Đăng ký" : "Đăng nhập"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Muốn đăng truyện?{" "}
          <Link to="/apply" className="text-primary hover:underline">
            Ứng tuyển cộng tác viên
          </Link>
        </p>
      </main>
    </div>
  );
}
