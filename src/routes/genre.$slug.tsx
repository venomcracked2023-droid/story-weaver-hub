import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ComicCover } from "@/components/ComicCover";
import { useComics } from "@/lib/comics-store";
import { Tag } from "lucide-react";
import { useMemo } from "react";
import { SITE_URL } from "@/lib/seo";
import { slugifyGenre } from "@/lib/slug";

export const Route = createFileRoute("/genre/$slug")({
  component: GenrePage,
  head: ({ params }) => {
    const slug = params.slug;
    const title = `Thể loại "${slug}" — Lcucumber`;
    const desc = `Tổng hợp các truyện thuộc thể loại ${slug} trên Lcucumber — đọc cuộn dọc miễn phí.`;
    const url = `${SITE_URL}/genre/${slug}`;
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
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: `Thể loại ${slug}`, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Không tìm thấy thể loại</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">
          Về trang chủ
        </Link>
      </main>
    </div>
  ),
});

function GenrePage() {
  const { slug } = Route.useParams();
  const comics = useComics();

  // Tên thể loại hiển thị: lấy biến thể có dấu đầu tiên khớp slug.
  const { matched, displayName } = useMemo(() => {
    const list = comics.filter((c) =>
      (c.genres ?? []).some((g) => slugifyGenre(g) === slug),
    );
    const display =
      list
        .flatMap((c) => c.genres ?? [])
        .find((g) => slugifyGenre(g) === slug) ?? slug;
    return { matched: list, displayName: display };
  }, [comics, slug]);

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Thể loại ${displayName} — Lcucumber`,
    url: `${SITE_URL}/genre/${slug}`,
    inLanguage: "vi-VN",
    isPartOf: { "@type": "WebSite", name: "Lcucumber", url: SITE_URL },
    about: { "@type": "Thing", name: displayName },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: matched.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: matched.map((c, i) => ({
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <header className="mb-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Tag className="h-6 w-6 text-primary" />
            Thể loại: <span className="text-gradient-brand">{displayName}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {matched.length} truyện thuộc thể loại "{displayName}".
          </p>
        </header>

        {matched.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Chưa có truyện nào thuộc thể loại này.{" "}
            <Link to="/" className="text-primary underline">Về thư viện</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {matched.map((c, i) => (
              <Link
                key={c.id}
                to="/truyen/$slug"
                params={{ slug: c.slug }}
                className="group flex flex-col gap-2 animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                <div className="hover-lift relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-card group-hover:border-primary/60">
                  <ComicCover id={c.coverId} title={c.title} className="transition duration-500 group-hover:scale-110" />
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