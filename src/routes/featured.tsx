import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ComicCover } from "@/components/ComicCover";
import { useComics } from "@/lib/comics-store";
import { Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { fuzzyScoreVi } from "@/lib/fuzzy-search";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/featured")({
  component: FeaturedPage,
  head: () => {
    const title = "Truyện nổi bật — Lcucumber";
    const desc = "Danh sách webtoon nổi bật được Lcucumber tuyển chọn — đọc cuộn dọc miễn phí.";
    const url = `${SITE_URL}/featured`;
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

function FeaturedPage() {
  const comics = useComics();
  const featured = comics.filter((c) => c.featured);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return featured;
    // Tên truyện là tín hiệu chính: giữ nguyên điểm.
    // Tác giả là tín hiệu phụ: cộng phạt để luôn xếp sau khớp tên tương đương,
    // và chỉ giữ khi khớp khá sát (tránh tác giả trùng kéo lệch kết quả).
    const AUTHOR_PENALTY = 5;
    const AUTHOR_MAX = 3; // chỉ chấp nhận khớp tác giả ở mức "chứa chuỗi/token"
    const scored = featured
      .map((c) => {
        const titleScore = fuzzyScoreVi(q, c.title);
        const rawAuthor = fuzzyScoreVi(q, c.author ?? "");
        const authorScore =
          rawAuthor !== null && rawAuthor <= AUTHOR_MAX
            ? rawAuthor + AUTHOR_PENALTY
            : null;
        const candidates = [titleScore, authorScore].filter(
          (s): s is number => s !== null,
        );
        if (candidates.length === 0) return null;
        return {
          comic: c,
          score: Math.min(...candidates),
          // tie-breaker: tên ngắn hơn → khớp gọn hơn → ưu tiên trước.
          tiebreak: c.title.length,
        };
      })
      .filter(
        (x): x is { comic: typeof featured[number]; score: number; tiebreak: number } =>
          x !== null,
      )
      .sort((a, b) => a.score - b.score || a.tiebreak - b.tiebreak);
    return scored.map((s) => s.comic);
  }, [featured, query]);

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Truyện nổi bật — Lcucumber",
    url: `${SITE_URL}/featured`,
    inLanguage: "vi-VN",
    isPartOf: { "@type": "WebSite", name: "Lcucumber", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: filtered.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: filtered.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/comic/${c.id}`,
        name: c.title,
      })),
    },
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <Star className="h-6 w-6 fill-primary text-primary" />
              Truyện nổi bật
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tuyển chọn những tác phẩm đáng đọc nhất trên Lcucumber.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm truyện (không cần đúng dấu)…"
                aria-label="Tìm truyện nổi bật"
                className="w-full min-w-[220px] rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 sm:w-72"
              />
            </div>
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {filtered.length}/{featured.length}
            </span>
          </div>
        </header>

        {featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Chưa có truyện nổi bật. Vào{" "}
            <Link to="/admin" className="text-primary underline">Quản lý</Link> để đánh dấu.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Không tìm thấy truyện nào khớp với "{query}".
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((c, i) => (
              <Link
                key={c.id}
                to="/comic/$comicId"
                params={{ comicId: c.id }}
                className="group flex flex-col gap-2 animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i, 12) * 50}ms` }}
              >
                <div className="hover-lift relative aspect-[3/4] overflow-hidden rounded-xl border border-primary/40 bg-card shadow-lg shadow-primary/10 group-hover:border-primary">
                  <ComicCover id={c.coverId} title={c.title} className="transition duration-500 group-hover:scale-110" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card/90 via-card/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-glow backdrop-blur">
                    <Star className="h-3 w-3 fill-current" /> Nổi bật
                  </span>
                </div>
                <div>
                  <h2 className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary">{c.title}</h2>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {c.chapters.length} chương · {c.author || "Ẩn danh"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}