import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ComicCover } from "@/components/ComicCover";
import { useComics } from "@/lib/comics-store";
import { Clock } from "lucide-react";
import { useMemo } from "react";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/latest")({
  component: LatestPage,
  head: () => {
    const title = "Truyện mới cập nhật — Lcucumber";
    const desc =
      "Danh sách truyện vừa cập nhật chương mới nhất trên Lcucumber — đọc cuộn dọc miễn phí.";
    const url = `${SITE_URL}/latest`;
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

function LatestPage() {
  const comics = useComics();
  // Sắp xếp theo thời điểm chương mới nhất (fallback createdAt nếu chưa có chương).
  const latest = useMemo(() => {
    return [...comics]
      .map((c) => {
        const lastChapterAt = c.chapters.reduce(
          (m, ch) => Math.max(m, ch.createdAt),
          0,
        );
        return { c, ts: lastChapterAt || c.createdAt };
      })
      .filter((x) => x.ts > 0)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 60)
      .map((x) => x.c);
  }, [comics]);

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Truyện mới cập nhật — Lcucumber",
    url: `${SITE_URL}/latest`,
    inLanguage: "vi-VN",
    isPartOf: { "@type": "WebSite", name: "Lcucumber", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: latest.length,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: latest.map((c, i) => ({
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
        <header className="mb-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Clock className="h-6 w-6 text-primary" />
            Mới cập nhật
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {latest.length} truyện vừa có chương mới trên Lcucumber.
          </p>
        </header>

        {latest.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Chưa có truyện nào.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {latest.map((c, i) => (
              <Link
                key={c.id}
                to="/comic/$comicId"
                params={{ comicId: c.id }}
                className="group flex flex-col gap-2 animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                <div className="hover-lift relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-card group-hover:border-primary/60">
                  <ComicCover id={c.coverId} title={c.title} className="transition duration-500 group-hover:scale-110" />
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
        )}
      </main>
    </div>
  );
}