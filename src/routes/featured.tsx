import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ComicCover } from "@/components/ComicCover";
import { useComics } from "@/lib/comics-store";
import { Search, Star } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/featured")({
  component: FeaturedPage,
  head: () => ({
    meta: [
      { title: "Truyện nổi bật — Lcucumber" },
      { name: "description", content: "Danh sách toàn bộ truyện được đánh dấu nổi bật trên Lcucumber." },
      { property: "og:title", content: "Truyện nổi bật — Lcucumber" },
      { property: "og:description", content: "Khám phá những webtoon nổi bật được tuyển chọn." },
    ],
  }),
});

function FeaturedPage() {
  const comics = useComics();
  const featured = comics.filter((c) => c.featured);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return featured;
    return featured.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.author ?? "").toLowerCase().includes(q),
    );
  }, [featured, query]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
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
                placeholder="Tìm theo tên truyện…"
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
            {filtered.map((c) => (
              <Link
                key={c.id}
                to="/comic/$comicId"
                params={{ comicId: c.id }}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-primary/40 bg-card shadow-lg shadow-primary/10 transition group-hover:border-primary group-hover:shadow-primary/30">
                  <ComicCover id={c.coverId} title={c.title} className="transition group-hover:scale-105" />
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground backdrop-blur">
                    <Star className="h-3 w-3 fill-current" /> Nổi bật
                  </span>
                </div>
                <div>
                  <h3 className="line-clamp-1 text-sm font-semibold">{c.title}</h3>
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