import { Link } from "@tanstack/react-router";
import { Facebook, Github, Heart, Mail, Star } from "lucide-react";
import cucumberLogo from "@/assets/cucumber-logo.png";
import { SITE_NAME, SOCIAL_LINKS } from "@/lib/seo";

const navGroups: Array<{
  title: string;
  links: Array<{ label: string; to?: string; href?: string }>;
}> = [
  {
    title: "Khám phá",
    links: [
      { label: "Trang chủ", to: "/" },
      { label: "Truyện nổi bật", to: "/featured" },
    ],
  },
  {
    title: "Cộng đồng",
    links: [
      { label: "Ứng tuyển CTV", to: "/apply" },
      { label: "Đăng nhập", to: "/login" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Liên hệ", href: "mailto:hello@lcucumber.com" },
      { label: "Báo lỗi", href: "mailto:hello@lcucumber.com?subject=Báo lỗi" },
    ],
  },
];

function iconFor(url: string) {
  if (url.includes("facebook")) return Facebook;
  if (url.includes("github")) return Github;
  return Mail;
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-20 border-t border-border bg-card/40">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link to="/" className="group inline-flex items-center gap-2">
              <img
                src={cucumberLogo}
                alt={SITE_NAME}
                width={32}
                height={32}
                className="h-8 w-8 object-contain transition group-hover:rotate-[-8deg]"
              />
              <span className="text-lg font-bold tracking-tight text-gradient-brand">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Đọc webtoon cuộn dọc, mượt như lướt sóng — xanh như dưa leo.
            </p>

            {SOCIAL_LINKS.length > 0 && (
              <div className="mt-5 flex items-center gap-2">
                {SOCIAL_LINKS.map((url) => {
                  const Icon = iconFor(url);
                  return (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Mạng xã hội"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/40 text-muted-foreground transition hover:border-primary hover:text-primary"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {navGroups.map((g) => (
            <div key={g.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                {g.title}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {g.links.map((l) =>
                  l.to ? (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="text-muted-foreground transition hover:text-primary"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-muted-foreground transition hover:text-primary"
                      >
                        {l.label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {year} {SITE_NAME}. Mọi quyền được bảo lưu.
          </p>
          <p className="inline-flex items-center gap-1.5">
            Made with <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> by team{" "}
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Star className="h-3 w-3 fill-primary text-primary" /> {SITE_NAME}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}