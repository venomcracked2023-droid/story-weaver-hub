import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ComicCover } from "@/components/ComicCover";
import { useComics, useComicsLoaded } from "@/lib/comics-store";
import { supabase } from "@/integrations/supabase/client";
import { driveImageUrl } from "@/lib/drive";
import { BookOpen, ChevronRight, Layers, MessageCircle, User } from "lucide-react";
import { CommentSection } from "@/components/CommentSection";
import { RatingWidget } from "@/components/RatingWidget";

export const Route = createFileRoute("/comic/$comicId")({
  component: ComicPage,
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("comics")
      .select("title,author,description,cover_id,genres")
      .eq("id", params.comicId)
      .maybeSingle();
    return { meta: data };
  },
  head: ({ loaderData, params }) => {
    const m = loaderData?.meta;
    if (!m) {
      return { meta: [{ title: "Truyện — Lcucumber" }] };
    }
    const title = `${m.title}${m.author ? ` — ${m.author}` : ""} | Lcucumber`;
    const desc = (m.description || `Đọc ${m.title} online cuộn dọc miễn phí trên Lcucumber.`).slice(0, 160);
    const img = m.cover_id
      ? driveImageUrl(m.cover_id, 1200)
      : "https://lcucumber.com/og-default.jpg";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "book" },
    ];
    meta.push({ property: "og:image", content: img });
    meta.push({ name: "twitter:image", content: img });
    return {
      meta,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            name: m.title,
            author: m.author ? { "@type": "Person", name: m.author } : undefined,
            description: desc,
            image: img,
            genre: m.genres,
            url: `/comic/${params.comicId}`,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Trang chủ", item: "/" },
              {
                "@type": "ListItem",
                position: 2,
                name: m.title,
                item: `/comic/${params.comicId}`,
              },
            ],
          }),
        },
      ],
    };
  },
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
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});
  const [comicCount, setComicCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadCounts() {
      const { data, error } = await supabase
        .from("comments")
        .select("chapter_id")
        .eq("comic_id", comicId)
        .limit(5000);
      if (error || !active) return;
      const map: Record<string, number> = {};
      let general = 0;
      for (const row of data ?? []) {
        if (row.chapter_id) map[row.chapter_id] = (map[row.chapter_id] ?? 0) + 1;
        else general += 1;
      }
      setChapterCounts(map);
      setComicCount(general);
    }
    loadCounts();
    const ch = supabase
      .channel(`comments-counts-${comicId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `comic_id=eq.${comicId}` },
        () => loadCounts(),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [comicId]);

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
      <div className="relative isolate overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 -z-10 scale-110 opacity-30 blur-2xl"
          style={{
            backgroundImage: `url(${driveImageUrl(comic.coverId, 800)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/70 via-background/85 to-background" aria-hidden />
        <main className="mx-auto max-w-5xl px-4 pb-10 pt-10 sm:pt-14">
          <div className="grid gap-8 md:grid-cols-[240px_1fr]">
            <div className="hover-lift mx-auto aspect-[3/4] w-full max-w-[240px] overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-glow">
              <ComicCover id={comic.coverId} title={comic.title} />
            </div>
            <div className="animate-fade-in-up">
              <div className="flex flex-wrap gap-2">
                {comic.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {g}
                  </span>
                ))}
              </div>
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                {comic.title}
              </h1>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" /> {comic.author || "Ẩn danh"}
                <span className="mx-2 text-border">·</span>
                <BookOpen className="h-3.5 w-3.5" /> {comic.chapters.length} chương
              </p>
              <p className="mt-5 leading-relaxed text-foreground/90">{comic.description}</p>
              <RatingWidget comicId={comic.id} />
              {comic.chapters.length > 0 && (
                <Link
                  to="/read/$comicId/$chapterId"
                  params={{ comicId: comic.id, chapterId: comic.chapters[0].id }}
                  className="group mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95"
                >
                  Đọc từ đầu
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-20">
        <section className="mt-10 rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card to-secondary/40 p-5 shadow-glow ring-1 ring-primary/10 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary shadow-glow">
              <Layers className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <h2 className="text-2xl font-extrabold tracking-tight">Danh sách chương</h2>
              <span className="text-xs text-muted-foreground">
                {comic.chapters.length} chương · cập nhật liên tục
              </span>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur">
              <MessageCircle className="h-3.5 w-3.5" />
              {Object.values(chapterCounts).reduce((a, b) => a + b, 0) + comicCount}
            </span>
          </div>
          {comic.chapters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Chưa có chương nào. Vào <Link to="/admin" className="text-primary underline">Quản lý</Link> để thêm.
            </div>
          ) : (
            <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-background/40 backdrop-blur">
              {comic.chapters.map((ch, i) => (
                <li key={ch.id} className="group">
                  <Link
                    to="/read/$comicId/$chapterId"
                    params={{ comicId: comic.id, chapterId: ch.id }}
                    className="relative flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-primary/5"
                  >
                    <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-brand opacity-0 transition group-hover:opacity-100" />
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-xs font-bold text-muted-foreground tabular-nums shadow-sm transition group-hover:border-primary group-hover:bg-gradient-brand group-hover:text-primary-foreground group-hover:shadow-glow">
                        {i + 1}
                      </span>
                      <span className="font-semibold tracking-tight transition-colors group-hover:text-primary">
                        {ch.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2 py-0.5"
                        title="Số bình luận của chương"
                      >
                        <MessageCircle className="h-3 w-3" />
                        {chapterCounts[ch.id] ?? 0}
                      </span>
                      <span>{ch.pages.length} trang</span>
                      <ChevronRight className="h-4 w-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-primary" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <CommentSection comicId={comic.id} />
      </main>
    </div>
  );
}