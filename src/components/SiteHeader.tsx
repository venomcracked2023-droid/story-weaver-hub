import { Link } from "@tanstack/react-router";
import { BookOpen, Settings } from "lucide-react";

export function SiteHeader() {
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
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-foreground bg-secondary" }}
          >
            <Settings className="h-4 w-4" />
            Quản lý
          </Link>
        </nav>
      </div>
    </header>
  );
}