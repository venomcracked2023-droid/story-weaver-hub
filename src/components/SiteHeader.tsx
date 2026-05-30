import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogIn, LogOut, Search, Settings, UserPlus, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import cucumberLogo from "@/assets/cucumber-logo.png";

export function SiteHeader() {
  const { user, isContributor, isAdmin, profile, signOut } = useAuth();
  const navigate = useNavigate();
  // Đồng bộ ô tìm kiếm với ?q= trên URL.
  const search = useRouterState({ select: (s) => s.location.search as { q?: string } });
  const [q, setQ] = useState(search?.q ?? "");
  useEffect(() => {
    setQ(search?.q ?? "");
  }, [search?.q]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    navigate({ to: "/", search: term ? { q: term } : {}, hash: "library" });
  }

  const navClass =
    "nav-link inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground";
  const activeClass =
    "nav-link inline-flex items-center gap-1.5 rounded-md px-3 py-2 font-medium text-foreground";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="group flex items-center gap-2">
          <span className="relative">
            <span className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-lg transition group-hover:bg-primary/50" />
            <img
              src={cucumberLogo}
              alt="Logo Lcucumber"
              width={32}
              height={32}
              className="h-8 w-8 object-contain transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110"
            />
          </span>
          <span className="text-lg font-bold tracking-tight text-gradient-brand">Lcucumber</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">/ Webtoon</span>
        </Link>

        <form
          onSubmit={submitSearch}
          role="search"
          className="mx-3 hidden min-w-0 flex-1 items-center gap-1 rounded-full border border-border bg-background/40 px-3 py-1.5 backdrop-blur transition focus-within:border-primary/60 focus-within:bg-background/70 sm:flex sm:max-w-sm"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm truyện, tác giả, thể loại…"
            aria-label="Tìm kiếm truyện"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                navigate({ to: "/", search: {} });
              }}
              aria-label="Xoá tìm kiếm"
              className="rounded-full p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        <nav className="flex items-center gap-0.5 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className={navClass}
            activeProps={{ className: activeClass }}
          >
            Khám phá
          </Link>

          {isContributor && (
            <Link to="/admin" className={navClass} activeProps={{ className: activeClass }}>
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Quản lý</span>
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin-applications" className={navClass} activeProps={{ className: activeClass }}>
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Duyệt CTV</span>
            </Link>
          )}

          {user && !isContributor && (
            <Link to="/apply" className={navClass} activeProps={{ className: activeClass }}>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Ứng tuyển</span>
            </Link>
          )}

          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <span className="hidden max-w-[140px] truncate text-xs text-muted-foreground sm:inline">
                {profile?.display_name ?? user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
