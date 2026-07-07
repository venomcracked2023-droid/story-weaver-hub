import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useComics } from "@/lib/comics-store";
import { Tag } from "lucide-react";
import { useMemo } from "react";
import { SITE_URL } from "@/lib/seo";
import { slugifyGenre } from "@/lib/slug";

export const Route = createFileRoute("/the-loai")({
  component: GenresHubPage,
  head: () => {
    const title = "Thể loại truyện — Lcucumber";
    const desc =
      "Khám phá tất cả thể loại webtoon, manhwa, manhua trên Lcucumber — chọn thể loại yêu thích và đọc cuộn dọc miễn phí.";
    const url = `${SITE_URL}/the-loai`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Thể loại", item: url },
            ],
          }),
        },
      ],
    };
  },
});

function GenresHubPage() {
  const comics = useComics();

  const genres = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; count: number }>();
    for (const c of comics) {
      for (const g of c.genres ?? []) {
        const slug = slugifyGenre(g);
        if (!slug) continue;
        const existing = map.get(slug);
        if (existing) existing.count += 1;
        else map.set(slug, { name: g, slug, count: 1 });
      }
    }
    return [...map.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"),
    );
  }, [comics]);

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Thể loại truyện — Lcucumber",
    url: `${SITE_URL}/the-loai`,
    inLanguage: "vi-VN",
    isPartOf: { "@type": "WebSite", name: "Lcucumber", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: genres.length,
      itemListElement: genres.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/genre/${g.slug}`,
        name: g.name,
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
            <Tag className="h-6 w-6 text-primary" />
            Thể loại truyện
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {genres.length} thể loại · Chọn một thể loại để xem toàn bộ truyện.
          </p>
        </header>

        {genres.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Chưa có thể loại nào.{" "}
            <Link to="/" className="text-primary underline">Về trang chủ</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {genres.map((g, i) => (
              <Link
                key={g.slug}
                to="/genre/$slug"
                params={{ slug: g.slug }}
                className="hover-lift group flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/60 animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
              >
                <span className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary">
                  {g.name}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {g.count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}