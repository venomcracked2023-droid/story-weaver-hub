import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ComicCover } from "@/components/ComicCover";
import { useComics } from "@/lib/comics-store";
import { BookOpen, Library, Sparkles, Star } from "lucide-react";
import cucumberLogo from "@/assets/cucumber-logo.png";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => {
    const title = "Lcucumber — Đọc Webtoon cuộn dọc miễn phí";
    const desc =
      "Khám phá kho webtoon đa dạng tại Lcucumber: đọc cuộn dọc mượt mà, cập nhật chương mới mỗi ngày, miễn phí trên mọi thiết bị.";
    const url = `${SITE_URL}/`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
});

function PaginationControls({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;

  const getPages = () => {
    const pages: (number | "...")[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(total);
      }
    }
    return pages;
  };

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-40"
      >
        Trước
      </button>
      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              p === current
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground hover:bg-secondary"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-40"
      >
        Tiếp
      </button>
    </div>
  );
}

function Index() {
  const comics = useComics();
  const { q } = Route.useSearch();
  const term = (q ?? "").trim().toLowerCase();
  const filtered = term
    ? comics.filter((c) =>
        [c.title, c.author, ...(c.genres ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
    : comics;
  const featured = comics.filter((c) => c.featured);
  const totalChapters = comics.reduce((s, c) => s + c.chapters.length, 0);

  const [featuredPage, setFeaturedPage] = useState(1);
  const [libraryPage, setLibraryPage] = useState(1);

  const featuredPerPage = 8;
  const libraryPerPage = 16;

  // Reset to page 1 when search query changes
  useEffect(() => {
    setFeaturedPage(1);
    setLibraryPage(1);
  }, [term]);

  const featuredTotalPages = Math.max(1, Math.ceil(featured.length / featuredPerPage));
  const libraryTotalPages = Math.max(1, Math.ceil(filtered.length / libraryPerPage));

  const featuredSlice = featured.slice(
    (featuredPage - 1) * featuredPerPage,
    featuredPage * featuredPerPage,
  );
  const filteredSlice = filtered.slice(
    (libraryPage - 1) * libraryPerPage,
    libraryPage * libraryPerPage,
  );

  const libraryJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Lcucumber — Thư viện truyện",
    url: `${SITE_URL}/`,
    inLanguage: "vi-VN",
    isPartOf: { "@type": "WebSite", name: "Lcucumber", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: filtered.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: filtered.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/truyen/${c.slug}`,
        name: c.title,
      })),
    },
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(libraryJsonLd) }}
      />
      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-secondary to-card px-6 py-9 sm:px-12 sm:py-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/25 blur-3xl animate-pulse-glow" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          <img
            src={cucumberLogo}
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-6 top-6 hidden h-28 w-28 opacity-90 drop-shadow-[0_10px_30px_oklch(0.72_0.19_142_/_0.45)] animate-float-slow md:block"
          />
          <div className="relative max-w-2xl animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Webtoon — cuộn dọc, đọc liền mạch
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Lcucumber — Đọc Webtoon cuộn dọc miễn phí
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Khám phá thế giới webtoon cùng Lcucumber — mượt như lướt sóng, xanh như dưa leo.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#library"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95"
              >
                <Library className="h-4 w-4" /> Vào thư viện
              </a>
              <Link
                to="/featured"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-5 py-2.5 text-sm backdrop-blur transition hover:border-primary/60 hover:bg-secondary"
              >
                <Star className="h-4 w-4 text-primary" /> Truyện nổi bật
              </Link>
            </div>

            <dl className="mt-5 grid max-w-md grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-border bg-background/40 px-3 py-2 backdrop-blur">
                <dt className="text-xs text-muted-foreground">Truyện</dt>
                <dd className="mt-0.5 text-lg font-bold text-foreground tabular-nums">{comics.length}</dd>
              </div>
              <div className="rounded-xl border border-border bg-background/40 px-3 py-2 backdrop-blur">
                <dt className="text-xs text-muted-foreground">Chương</dt>
                <dd className="mt-0.5 text-lg font-bold text-foreground tabular-nums">{totalChapters}</dd>
              </div>
              <div className="rounded-xl border border-border bg-background/40 px-3 py-2 backdrop-blur">
                <dt className="text-xs text-muted-foreground">Nổi bật</dt>
                <dd className="mt-0.5 text-lg font-bold text-primary tabular-nums">{featured.length}</dd>
              </div>
            </dl>
          </div>
        </section>

        {featured.length > 0 && (
          <section className="mt-14 animate-fade-in-up">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <Star className="h-5 w-5 fill-primary text-primary drop-shadow-[0_0_10px_oklch(0.72_0.19_142_/_0.6)]" />
                Truyện nổi bật
              </h2>
              <Link
                to="/featured"
                className="group inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                Xem tất cả ({featured.length})
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {featuredSlice.map((c, i) => (
                <Link
                  key={c.id}
                  to="/truyen/$slug"
                  params={{ slug: c.slug }}
                  className="group flex flex-col gap-2 animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="hover-lift relative aspect-[3/4] overflow-hidden rounded-xl border border-primary/40 bg-card shadow-lg shadow-primary/10 group-hover:border-primary">
                    <ComicCover id={c.coverId} title={c.title} priority={featuredPage === 1 && i < 4} className="transition duration-500 group-hover:scale-110" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card/90 via-card/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-glow backdrop-blur">
                      <Star className="h-3 w-3 fill-current" /> Nổi bật
                    </span>
                  </div>
                  <div>
                    <h3 className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary">{c.title}</h3>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {c.chapters.length} chương · {c.author || "Ẩn danh"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <PaginationControls current={featuredPage} total={featuredTotalPages} onChange={setFeaturedPage} />
          </section>
        )}

        <section id="library" className="mt-14 scroll-mt-24">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Library className="h-5 w-5 text-primary" />
              {term ? `Kết quả cho "${q}"` : "Thư viện truyện"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filtered.length}/{comics.length} tác phẩm
            </span>
          </div>

          {comics.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 text-primary/60" />
              <p>Chưa có truyện nào trong thư viện.</p>
              <Link to="/admin" className="text-primary underline-offset-4 hover:underline">Vào Quản lý để thêm</Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 text-primary/60" />
              <p>Không tìm thấy truyện nào khớp với "{q}".</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredSlice.map((c, i) => (
                  <Link
                    key={c.id}
                    to="/truyen/$slug"
                    params={{ slug: c.slug }}
                    className="group flex flex-col gap-2 animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                  >
                    <div className="hover-lift relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-card group-hover:border-primary/60">
                      <ComicCover id={c.coverId} title={c.title} priority={libraryPage === 1 && i < 4 && featured.length === 0} className="transition duration-500 group-hover:scale-110" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div>
                      <h3 className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary">{c.title}</h3>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {c.chapters.length} chương · {c.author || "Ẩn danh"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <PaginationControls current={libraryPage} total={libraryTotalPages} onChange={setLibraryPage} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
