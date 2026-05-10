import { Link } from "@tanstack/react-router";
import { BookOpen, LogIn, LogOut, Settings, UserPlus, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user, isContributor, isAdmin, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">InkScroll</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">/ Webtoon</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-foreground bg-secondary" }}
          >
            Khám phá
          </Link>

          {isContributor && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-foreground bg-secondary" }}
            >
              <Settings className="h-4 w-4" />
              Quản lý
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin-applications"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-foreground bg-secondary" }}
            >
              <ShieldCheck className="h-4 w-4" />
              Duyệt CTV
            </Link>
          )}

          {user && !isContributor && (
            <Link
              to="/apply"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-foreground bg-secondary" }}
            >
              <UserPlus className="h-4 w-4" />
              Ứng tuyển
            </Link>
          )}

          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {profile?.display_name ?? user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
