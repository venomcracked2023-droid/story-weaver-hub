import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ComicCover } from "@/components/ComicCover";
import { useComics } from "@/lib/comics-store";
import { BookOpen, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Lcucumber — Đọc Webtoon cuộn dọc" },
      { name: "description", content: "Khám phá webtoon mới, đọc cuộn dọc mượt mà. Ảnh nhúng từ Google Drive." },
    ],
  }),
});

function Index() {
  const comics = useComics();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-secondary to-card px-6 py-14 sm:px-12 sm:py-20 mt-6">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Webtoon — cuộn dọc, đọc liền mạch
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              Truyện hay, <span className="text-primary">cuộn không ngừng.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Tải ảnh chương lên Google Drive, dán File ID vào trang quản lý — Lcucumber sẽ tự nhúng và hiển thị đẹp như app webtoon thật.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/admin" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                <BookOpen className="h-4 w-4" /> Bắt đầu đăng truyện
              </Link>
              <a href="#library" className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary">
                Xem thư viện
              </a>
            </div>
          </div>
        </section>

        <section id="library" className="mt-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Thư viện truyện</h2>
            <span className="text-sm text-muted-foreground">{comics.length} tác phẩm</span>
          </div>

          {comics.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Chưa có truyện. Vào <Link to="/admin" className="text-primary underline">Quản lý</Link> để thêm.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {comics.map((c) => (
                <Link
                  key={c.id}
                  to="/comic/$comicId"
                  params={{ comicId: c.id }}
                  className="group flex flex-col gap-2"
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-xl border border-border bg-card transition group-hover:border-primary/60 group-hover:shadow-lg group-hover:shadow-primary/10">
                    <ComicCover id={c.coverId} title={c.title} className="transition group-hover:scale-105" />
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
        </section>
      </main>
    </div>
  );
}
