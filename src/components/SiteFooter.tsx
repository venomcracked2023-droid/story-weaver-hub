import { Link } from "@tanstack/react-router";
import { Facebook, Github, Heart, Mail, Star } from "lucide-react";
import cucumberLogo from "@/assets/cucumber-logo.png";
import { SITE_LOGO, SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/lib/seo";
import { useComics } from "@/lib/comics-store";

type FooterLink = {
  label: string;
  /** Tiêu đề mô tả cho thuộc tính title (ngữ cảnh thêm cho crawler & screen reader). */
  desc: string;
  to?: string;
  href?: string;
  external?: boolean;
  /** Tham số động cho route TanStack (vd. comicId). */
  params?: Record<string, string>;
};

const navGroups: Array<{ title: string; ariaLabel: string; links: FooterLink[] }> = [
  {
    title: "Khám phá",
    ariaLabel: "Liên kết khám phá nội dung",
    links: [
      { label: "Trang chủ", to: "/", desc: "Lcucumber — Webtoon cuộn dọc" },
      { label: "Truyện nổi bật", to: "/featured", desc: "Danh sách truyện được tuyển chọn" },
      { label: "Mới cập nhật", href: "/#latest", desc: "Truyện và chương mới cập nhật gần đây" },
    ],
  },
  {
    title: "Cộng đồng",
    ariaLabel: "Liên kết cộng đồng và tài khoản",
    links: [
      { label: "Ứng tuyển CTV", to: "/apply", desc: "Trở thành cộng tác viên đăng truyện" },
      { label: "Đăng nhập", to: "/login", desc: "Đăng nhập tài khoản Lcucumber" },
    ],
  },
  {
    title: "Hỗ trợ",
    ariaLabel: "Liên kết hỗ trợ và pháp lý",
    links: [
      { label: "Liên hệ", href: "mailto:hello@lcucumber.com", desc: "Gửi email cho đội Lcucumber" },
      { label: "Báo lỗi", href: "mailto:hello@lcucumber.com?subject=Báo lỗi", desc: "Báo lỗi nội dung hoặc kỹ thuật" },
    ],
  },
];

function socialMeta(url: string): { Icon: typeof Facebook; name: string } {
  if (url.includes("facebook")) return { Icon: Facebook, name: "Facebook" };
  if (url.includes("github")) return { Icon: Github, name: "GitHub" };
  return { Icon: Mail, name: "Liên hệ" };
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const comics = useComics();

  // Mục lục: 6 truyện mới nhất → link tới trang chi tiết (chính là mục lục chương).
  const tocLinks: FooterLink[] = comics.slice(0, 6).map((c) => ({
    label: c.title,
    to: "/comic/$comicId",
    params: { comicId: c.id },
    desc: `Mục lục ${c.chapters.length} chương — ${c.title}${c.author ? ` · ${c.author}` : ""}`,
  }));

  // Thể loại duy nhất → trỏ về /featured để crawler khám phá.
  const genreLinks: FooterLink[] = Array.from(
    new Set(comics.flatMap((c) => c.genres).filter(Boolean)),
  )
    .slice(0, 8)
    .map((g) => ({
      label: g,
      to: "/featured",
      desc: `Truyện thể loại ${g} trên ${SITE_NAME}`,
    }));

  const dynamicGroups: Array<{ title: string; ariaLabel: string; links: FooterLink[] }> = [];
  if (tocLinks.length) {
    dynamicGroups.push({
      title: "Mục lục truyện",
      ariaLabel: "Mục lục truyện mới cập nhật",
      links: tocLinks,
    });
  }
  if (genreLinks.length) {
    dynamicGroups.push({
      title: "Thể loại",
      ariaLabel: "Truyện theo thể loại",
      links: genreLinks,
    });
  }
  const allGroups = [...navGroups, ...dynamicGroups];

  // JSON-LD chuẩn schema.org. Quy tắc chuẩn hoá URL để khử trùng:
  //  1. Tuyệt đối hoá theo SITE_URL; chỉ giữ http/https.
  //  2. Loại mailto, fragment (#...), và các tài nguyên non-page (.xml/.txt).
  //  3. Scheme + host chuyển về chữ thường, bỏ cổng mặc định (80/443).
  //  4. Bỏ trailing slash thừa (trừ root "/").
  //  5. Sort query params theo alphabet, loại tham số rỗng.
  //  6. Khoá dedupe = chuỗi chuẩn hoá; URL hiển thị = phiên bản chuẩn hoá đó.
  const normalizeUrl = (raw: string): string | null => {
    try {
      const u = new URL(raw, SITE_URL);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      if (/\.(xml|txt)$/i.test(u.pathname)) return null;

      u.protocol = u.protocol.toLowerCase();
      u.hostname = u.hostname.toLowerCase();
      if (
        (u.protocol === "http:" && u.port === "80") ||
        (u.protocol === "https:" && u.port === "443")
      ) {
        u.port = "";
      }
      u.hash = "";

      if (u.pathname.length > 1) {
        u.pathname = u.pathname.replace(/\/+$/, "");
      }

      const params = Array.from(u.searchParams.entries())
        .filter(([, v]) => v !== "")
        .sort(([a], [b]) => a.localeCompare(b));
      u.search = "";
      const sorted = new URLSearchParams(params).toString();
      if (sorted) u.search = `?${sorted}`;

      return u.toString();
    } catch {
      return null;
    }
  };

  type NavEntry = { name: string; url: string; description?: string };
  const seen = new Set<string>();
  const navItems: NavEntry[] = [];
  const pushNav = (raw: string, name: string, description?: string) => {
    const url = normalizeUrl(raw);
    if (!url || !name || seen.has(url)) return;
    seen.add(url);
    navItems.push(description ? { name, url, description } : { name, url });
  };

  for (const g of navGroups) {
    for (const l of g.links) pushNav(l.to ?? l.href ?? "", l.label, l.desc);
  }
  for (const l of tocLinks) {
    pushNav(`/comic/${l.params?.comicId ?? ""}`, l.label, l.desc);
  }
  for (const l of genreLinks) pushNav("/featured", l.label, l.desc);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WPFooter",
        name: `${SITE_NAME} footer`,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
      },
      {
        "@type": "ItemList",
        name: `${SITE_NAME} — Điều hướng chân trang`,
        numberOfItems: navItems.length,
        itemListElement: navItems.map((n, i) => ({
          "@type": "SiteNavigationElement",
          position: i + 1,
          name: n.name,
          url: n.url,
          ...(n.description ? { description: n.description } : {}),
        })),
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: SITE_LOGO,
        sameAs: SOCIAL_LINKS,
      },
    ],
  };

  return (
    <footer
      className="relative mt-20 border-t border-border bg-card/40"
      role="contentinfo"
      aria-labelledby="site-footer-heading"
    >
      <h2 id="site-footer-heading" className="sr-only">
        Chân trang {SITE_NAME}
      </h2>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <Link
              to="/"
              className="group inline-flex items-center gap-2"
              title={`${SITE_NAME} — Trang chủ`}
              aria-label={`${SITE_NAME} — Về trang chủ`}
            >
              <img
                src={cucumberLogo}
                alt={`Logo ${SITE_NAME} — webtoon cuộn dọc`}
                width={32}
                height={32}
                className="h-8 w-8 object-contain transition group-hover:rotate-[-8deg]"
                loading="lazy"
                decoding="async"
              />
              <span className="text-lg font-bold tracking-tight text-gradient-brand">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Đọc webtoon cuộn dọc, mượt như lướt sóng — xanh như dưa leo.
            </p>

            {SOCIAL_LINKS.length > 0 && (
              <ul
                className="mt-5 flex items-center gap-2"
                aria-label={`${SITE_NAME} trên mạng xã hội`}
              >
                {SOCIAL_LINKS.map((url) => {
                  const { Icon, name } = socialMeta(url);
                  return (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="me noopener noreferrer"
                        aria-label={`${SITE_NAME} trên ${name} (mở tab mới)`}
                        title={`${SITE_NAME} trên ${name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/40 text-muted-foreground transition hover:border-primary hover:text-primary"
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" focusable="false" />
                        <span className="sr-only">{name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {allGroups.map((g) => (
            <nav key={g.title} aria-label={g.ariaLabel}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                {g.title}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {g.links.map((l) =>
                  l.to ? (
                    <li key={l.label}>
                      <Link
                        to={l.to as any}
                        params={l.params as any}
                        title={l.desc}
                        className="text-muted-foreground transition hover:text-primary"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        title={l.desc}
                        rel={l.href?.startsWith("mailto:") ? "nofollow" : undefined}
                        className="text-muted-foreground transition hover:text-primary"
                      >
                        {l.label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            <small>
              © <time dateTime={String(year)}>{year}</time>{" "}
              <span itemProp="name">{SITE_NAME}</span>. Mọi quyền được bảo lưu.
            </small>
          </p>
          <p className="inline-flex items-center gap-1.5">
            Made with{" "}
            <Heart
              className="h-3.5 w-3.5 fill-primary text-primary"
              aria-hidden="true"
              focusable="false"
            />{" "}
            by team{" "}
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Star
                className="h-3 w-3 fill-primary text-primary"
                aria-hidden="true"
                focusable="false"
              />{" "}
              {SITE_NAME}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}