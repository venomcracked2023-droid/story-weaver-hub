import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ComicCover } from "@/components/ComicCover";
import { useComics, useComicsLoaded } from "@/lib/comics-store";
import { ChevronRight, Layers } from "lucide-react";

export const Route = createFileRoute("/comic/$comicId")({
  component: ComicPage,
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Không tìm thấy truyện</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">Về trang chủ</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-destructive">{error.message}</div>
  ),
});

function ComicPage() {
  const { comicId } = Route.useParams();
  const comics = useComics();
  const loaded = useComicsLoaded();
  const comic = comics.find((c) => c.id === comicId);
  if (!loaded) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Đang tải…</div>
      </div>
    );
  }
  if (!comic) throw notFound();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8">
        <div className="grid gap-8 md:grid-cols-[240px_1fr]">
          <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card md:max-w-[240px]">
            <ComicCover id={comic.coverId} title={comic.title} />
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              {comic.genres.map((g) => (
                <span key={g} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                  {g}
                </span>
              ))}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{comic.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tác giả: {comic.author || "Ẩn danh"}</p>
            <p className="mt-5 leading-relaxed text-foreground/90">{comic.description}</p>
            {comic.chapters.length > 0 && (
              <Link
                to="/read/$comicId/$chapterId"
                params={{ comicId: comic.id, chapterId: comic.chapters[0].id }}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Đọc từ đầu <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <section className="mt-12">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Danh sách chương</h2>
            <span className="text-sm text-muted-foreground">({comic.chapters.length})</span>
          </div>
          {comic.chapters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Chưa có chương nào. Vào <Link to="/admin" className="text-primary underline">Quản lý</Link> để thêm.
            </div>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {comic.chapters.map((ch, i) => (
                <li key={ch.id}>
                  <Link
                    to="/read/$comicId/$chapterId"
                    params={{ comicId: comic.id, chapterId: ch.id }}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-secondary"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums">#{i + 1}</span>
                      <span className="font-medium">{ch.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{ch.pages.length} trang</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}