import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchComicsData, useComics } from "@/lib/comics-store";
import { Tag, Sparkles, Compass } from "lucide-react";
import { useMemo } from "react";
import { SITE_URL } from "@/lib/seo";
import { slugifyGenre } from "@/lib/slug";

const GENRE_DESCRIPTIONS: Record<string, string> = {
  bl: "Tình cảm lãng mạn Boys' Love đặc sắc, cốt truyện sâu sắc và nét vẽ trau chuốt.",
  "hanh-dong": "Những pha hành động kịch tính, đánh đấm mãn nhãn và nhịp truyện dồn dập.",
  drama: "Xung đột tâm lý, cốt truyện bất ngờ, nhiều khúc mắc và kịch tính đến nghẹt thở.",
  manhwa: "Truyện tranh Hàn Quốc cuộn dọc chuẩn sắc màu, phong cách đồ hoạ thời thượng.",
  "18": "Tác phẩm dành cho lứa tuổi trưởng thành với các yếu tố tâm lý và tình cảm sâu sắc.",
  romance: "Chuyện tình lãng mạn ngọt ngào, rung động trái tim và cảm xúc chân thật.",
  comedy: "Tình huống hài hước, dí dỏm giúp giải tỏa căng thẳng sau những giờ làm việc.",
  fantasy: "Thế giới huyền ảo, ma thuật diệu kỳ cùng những chuyến phiêu lưu kỳ thú.",
};

export const Route = createFileRoute("/the-loai")({
  component: GenresHubPage,
  loader: async () => {
    const comics = await fetchComicsData();
    return { comics };
  },
  head: () => {
    const title = "Thể loại truyện — Lcucumber";
    const desc =
      "Khám phá tất cả thể loại webtoon, manhwa, manhua trên Lcucumber: BL, Hành động, Drama, Manhwa... — chọn thể loại yêu thích và đọc cuộn dọc miễn phí.";
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
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "vi", href: url },
        { rel: "alternate", hrefLang: "x-default", href: url },
      ],
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
  const loaderData = Route.useLoaderData();
  const comics = useComics(loaderData?.comics);

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
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" search={{ q: "" }} className="transition hover:text-primary">Trang chủ</Link>
          <span className="text-border">/</span>
          <span className="text-foreground/80">Thể loại truyện</span>
        </nav>

        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Compass className="h-3.5 w-3.5" />
            Khám phá theo sở thích
          </div>
          <h1 className="mt-3 flex items-center gap-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            <Tag className="h-7 w-7 text-primary" />
            Thể loại truyện Webtoon
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Tổng hợp {genres.length} thể loại truyện tranh phong phú. Chọn một thể loại để đắm chìm vào những bộ truyện hấp dẫn nhất.
          </p>
        </header>

        {genres.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Chưa có thể loại nào.{" "}
            <Link to="/" search={{ q: "" }} className="text-primary underline">Về trang chủ</Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Top Highlights Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {genres.map((g, i) => {
                const desc = GENRE_DESCRIPTIONS[g.slug] || `Khám phá các bộ truyện ${g.name} được bạn đọc yêu thích trên Lcucumber.`;
                return (
                  <Link
                    key={g.slug}
                    to="/genre/$slug"
                    params={{ slug: g.slug }}
                    className="hover-lift group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/60 hover:shadow-lg animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-lg font-bold transition-colors group-hover:text-primary">
                          <Sparkles className="h-4 w-4 text-primary" />
                          {g.name}
                        </span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {g.count} bộ truyện
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {desc}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                      <span>Xem danh sách truyện</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}