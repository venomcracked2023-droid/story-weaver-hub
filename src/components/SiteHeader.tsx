import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, Settings, UserPlus, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import cucumberLogo from "@/assets/cucumber-logo.png";

export function SiteHeader() {
  const { user, isContributor, isAdmin, profile, signOut } = useAuth();

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
              alt="Lcucumber"
              width={32}
              height={32}
              className="h-8 w-8 object-contain transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110"
            />
          </span>
          <span className="text-lg font-bold tracking-tight text-gradient-brand">Lcucumber</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">/ Webtoon</span>
        </Link>
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
