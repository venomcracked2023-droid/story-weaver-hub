import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ComicCover } from "@/components/ComicCover";
import { fetchComicsData, useComics } from "@/lib/comics-store";
import { fuzzyScoreVi } from "@/lib/fuzzy-search";
import { BookOpen, Library, Sparkles, Star } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: (s: Record<string, unknown>): { q?: string } => {
    const q = typeof s.q === "string" ? s.q.trim() : undefined;
    return q ? { q } : {};
  },
  loader: async () => {
    const comics = await fetchComicsData();
    return { comics };
  },
  head: () => {
    const title = "Lcucumber — Đọc Webtoon cuộn dọc miễn phí";
    const desc =
      "Lcucumber là nền tảng đọc webtoon cuộn dọc miễn phí: manhwa, manhua, manga Việt hoá, cập nhật chương mới mỗi ngày, đọc mượt trên mọi thiết bị.";
    const url = `${SITE_URL}/`;
    const img = `${SITE_URL}/og-default.jpg`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:image", content: img },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "Lcucumber — Đọc Webtoon cuộn dọc miễn phí" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "vi", href: url },
        { rel: "alternate", hrefLang: "x-default", href: url },
      ],
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
  const loaderData = Route.useLoaderData();
  const comics = useComics(loaderData?.comics);
  const { q } = Route.useSearch();
  const term = (q ?? "").trim();

  const [selectedGenre, setSelectedGenre] = useState<string>("");

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    for (const c of comics) {
      for (const g of c.genres ?? []) {
        if (g.trim()) set.add(g.trim());
      }
    }
    return Array.from(set);
  }, [comics]);

  const filtered = useMemo(() => {
    let list = comics;
    if (selectedGenre) {
      list = list.filter((c) => (c.genres ?? []).includes(selectedGenre));
    }
    if (!term) return list;
    const scored = list
      .map((c) => {
        const titleScore = fuzzyScoreVi(term, c.title);
        const authorScore = fuzzyScoreVi(term, c.author ?? "");
        const genreScores = (c.genres ?? [])
          .map((g) => fuzzyScoreVi(term, g))
          .filter((s): s is number => s !== null);
        const descScore = fuzzyScoreVi(term, c.description ?? "");
        const candidates = [
          titleScore,
          authorScore !== null ? authorScore + 2 : null,
          genreScores.length ? Math.min(...genreScores) + 1 : null,
          descScore !== null ? descScore + 4 : null,
        ].filter((s): s is number => s !== null);
        if (candidates.length === 0) return null;
        return { comic: c, score: Math.min(...candidates), tiebreak: c.title.length };
      })
      .filter((x): x is { comic: typeof comics[number]; score: number; tiebreak: number } => x !== null)
      .sort((a, b) => a.score - b.score || a.tiebreak - b.tiebreak);
    return scored.map((s) => s.comic);
  }, [comics, term, selectedGenre]);

  // "Nổi bật" = các truyện vừa có chương mới nhất (tự động, không cần admin chọn).
  const featured = useMemo(() => {
    return [...comics]
      .filter((c) => c.chapters.length > 0)
      .map((c) => ({
        comic: c,
        lastChapterAt: Math.max(...c.chapters.map((ch) => ch.createdAt)),
      }))
      .sort((a, b) => b.lastChapterAt - a.lastChapterAt)
      .slice(0, 12)
      .map((x) => x.comic);
  }, [comics]);

  const totalChapters = useMemo(() => comics.reduce((s, c) => s + c.chapters.length, 0), [comics]);

  const [libraryPage, setLibraryPage] = useState(1);
  const libraryPerPage = 16;

  // Reset to page 1 when search query or genre filter changes
  useEffect(() => {
    setLibraryPage(1);
  }, [term, selectedGenre]);

  const libraryTotalPages = Math.max(1, Math.ceil(filtered.length / libraryPerPage));

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
        {/* Hero Banner */}
        <section className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-secondary to-card px-6 py-9 sm:px-12 sm:py-12 shadow-xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/25 blur-3xl animate-pulse-glow" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          <img
            src={cucumberLogo}
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-6 top-6 hidden h-28 w-28 opacity-90 drop-shadow-[0_10px_30px_oklch(0.72_0.19_142_/_0.45)] animate-float-slow md:block"
          />
          <div className="relative max-w-2xl animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/50 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Webtoon cuộn dọc — Đọc mượt không quảng cáo
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Lcucumber — Đọc Webtoon cuộn dọc miễn phí
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Nền tảng đọc truyện tranh bản quyền và Việt hóa chất lượng cao: Manhwa, Manhua, BL, Hành động, Drama. Trải nghiệm cuộn dọc liền mạch trên mọi thiết bị.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#library"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95"
              >
                <Library className="h-4 w-4" /> Khám phá thư viện
              </a>
              <Link
                to="/featured"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-5 py-3 text-sm font-medium backdrop-blur transition hover:border-primary/60 hover:bg-secondary"
              >
                <Star className="h-4 w-4 text-primary" /> Truyện nổi bật
              </Link>
              <Link
                to="/cong-dong"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-5 py-3 text-sm font-medium backdrop-blur transition hover:border-primary/60 hover:bg-secondary"
              >
                Cộng đồng độc giả
              </Link>
            </div>

            <dl className="mt-6 grid max-w-md grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl border border-border/80 bg-background/50 p-3 backdrop-blur">
                <dt className="text-xs font-medium text-muted-foreground">Tổng truyện</dt>
                <dd className="mt-0.5 text-xl font-extrabold text-foreground tabular-nums">{comics.length}</dd>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background/50 p-3 backdrop-blur">
                <dt className="text-xs font-medium text-muted-foreground">Tổng chương</dt>
                <dd className="mt-0.5 text-xl font-extrabold text-foreground tabular-nums">{totalChapters}</dd>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background/50 p-3 backdrop-blur">
                <dt className="text-xs font-medium text-muted-foreground">Thể loại</dt>
                <dd className="mt-0.5 text-xl font-extrabold text-primary tabular-nums">{allGenres.length || 5}+</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Featured Marquee */}
        {featured.length > 0 && (
          <section className="mt-14 animate-fade-in-up">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                  <Star className="h-5 w-5 fill-primary text-primary drop-shadow-[0_0_10px_oklch(0.72_0.19_142_/_0.6)]" />
                  Truyện nổi bật tuyển chọn
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Các bộ truyện được cập nhật chương mới và đón đọc nhiều nhất</p>
              </div>
              <Link
                to="/featured"
                className="group inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                Xem tất cả ({featured.length})
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <div
              className="featured-marquee group/marquee relative overflow-hidden"
              style={{ ["--marquee-duration" as string]: `${Math.max(20, featured.length * 4)}s` }}
            >
              <div className="featured-marquee-track flex w-max gap-4">
                {[...featured, ...featured].map((c, i) => (
                  <Link
                    key={`${c.id}-${i}`}
                    to="/truyen/$slug"
                    params={{ slug: c.slug }}
                    aria-hidden={i >= featured.length ? true : undefined}
                    tabIndex={i >= featured.length ? -1 : 0}
                    className="group flex w-[160px] shrink-0 flex-col gap-2 sm:w-[180px]"
                  >
                    <div className="hover-lift relative aspect-[3/4] overflow-hidden rounded-xl border border-primary/40 bg-card shadow-lg shadow-primary/10 group-hover:border-primary">
                      <ComicCover id={c.coverId} title={c.title} priority={i < 4} className="transition duration-500 group-hover:scale-110" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card/90 via-card/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-glow backdrop-blur">
                        <Star className="h-3 w-3 fill-current" /> Hot
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
            </div>
          </section>
        )}

        {/* Why Choose Lcucumber (Value Proposition) */}
        <section className="mt-14 rounded-3xl border border-border/80 bg-card/40 p-6 md:p-8 backdrop-blur">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Trải nghiệm khác biệt
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Tại sao nên đọc truyện tại Lcucumber?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Chúng tôi tập trung tối đa vào trải nghiệm đọc mượt mà và tôn trọng sự gắn kết của cộng đồng.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background/60 p-5 transition hover:border-primary/50">
              <div className="text-2xl">📱</div>
              <h3 className="mt-3 text-base font-semibold">Cuộn Dọc Vô Tận</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Tối ưu hóa từng khung hình chuẩn Webtoon di động, đọc liền mạch không giật lag.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-5 transition hover:border-primary/50">
              <div className="text-2xl">⚡</div>
              <h3 className="mt-3 text-base font-semibold">Cập Nhật Siêu Tốc</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Chương mới được cập nhật liên tục mỗi ngày từ các dịch giả và tác giả uy tín.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-5 transition hover:border-primary/50">
              <div className="text-2xl">🛡️</div>
              <h3 className="mt-3 text-base font-semibold">Không Pop-up Phiền Phức</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Đọc trọn vẹn từng chương truyện mà không bị che khuất bởi các quảng cáo rác độc hại.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-5 transition hover:border-primary/50">
              <div className="text-2xl">💬</div>
              <h3 className="mt-3 text-base font-semibold">Tương Tác Đa Chiều</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Bình luận trực tiếp dưới mỗi chương truyện, giao lưu cùng cộng đồng độc giả đam mê.
              </p>
            </div>
          </div>
        </section>

        {/* Main Library & Genre Filters */}
        <section id="library" className="mt-14 scroll-mt-24">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <Library className="h-5 w-5 text-primary" />
                {term ? `Kết quả cho "${q}"` : selectedGenre ? `Truyện thể loại "${selectedGenre}"` : "Thư viện truyện"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Hiển thị {filtered.length}/{comics.length} tác phẩm
              </p>
            </div>

            {/* Genre Filter Chips */}
            {allGenres.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedGenre("")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    !selectedGenre
                      ? "bg-primary text-primary-foreground shadow"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tất cả
                </button>
                {allGenres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGenre(selectedGenre === g ? "" : g)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      selectedGenre === g
                        ? "bg-primary text-primary-foreground shadow"
                        : "border border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>

          {comics.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 text-primary/60" />
              <p>Chưa có truyện nào trong thư viện.</p>
              <Link to="/admin" rel="nofollow" className="text-primary underline-offset-4 hover:underline">Vào Quản lý để thêm</Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 text-primary/60" />
              <p>Không tìm thấy truyện nào khớp với bộ lọc hiện tại.</p>
              <button
                type="button"
                onClick={() => setSelectedGenre("")}
                className="text-xs font-medium text-primary underline"
              >
                Đặt lại bộ lọc thể loại
              </button>
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
                      {c.chapters.length === 0 && (
                        <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/80 px-2 py-0.5 text-[10px] font-semibold text-amber-300 shadow backdrop-blur">
                          Sắp ra mắt
                        </span>
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div>
                      <h3 className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary">{c.title}</h3>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {c.chapters.length > 0 ? `${c.chapters.length} chương` : "Sắp ra mắt"} · {c.author || "Ẩn danh"}
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
