import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ComicCover } from "@/components/ComicCover";
import { enhanceComicMetadata, fetchComicsData, loadComics, useComics, useComicsLoaded } from "@/lib/comics-store";
import { supabase } from "@/integrations/supabase/client";
import { driveImageUrl, getOgImageUrl, parseDriveIds } from "@/lib/drive";
import { BookOpen, ChevronRight, Layers, MessageCircle, Plus, User, X } from "lucide-react";
import { CommentSection } from "@/components/CommentSection";
import { RatingWidget } from "@/components/RatingWidget";
import { AgeWarning } from "@/components/AgeWarning";
import { isMatureComic } from "@/lib/content-rating";
import { SITE_URL, formatTitle, formatDesc } from "@/lib/seo";
import { slugifyGenre } from "@/lib/slug";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/truyen/$slug/")({
  component: ComicPage,
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("comics")
      .select("id,title,author,description,cover_id,genres,slug,created_at,updated_at")
      .eq("slug", params.slug)
      .maybeSingle();
    if (!data) {
      throw notFound();
    }
    let chapters: { id: string; slug: string; title: string; pages: string[]; created_at: string | null }[] = [];
    if (data?.id) {
      const { data: chs } = await supabase
        .from("chapters")
        .select("id,slug,title,pages,created_at,order_index")
        .eq("comic_id", data.id)
        .order("order_index", { ascending: true });
      chapters = (chs ?? []).map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        pages: c.pages ?? [],
        created_at: c.created_at,
      }));
    }
    const meta = data ? enhanceComicMetadata(data) : null;
    const allComics = await fetchComicsData();
    return { meta, chapters, allComics };
  },
  head: ({ loaderData, params }) => {
    const url = `${SITE_URL}/truyen/${params.slug}`;
    const m = loaderData?.meta;
    if (!m) {
      return {
        meta: [{ title: "Truyện — Lcucumber" }],
        links: [
          { rel: "canonical", href: url },
          { rel: "alternate", hrefLang: "vi", href: url },
          { rel: "alternate", hrefLang: "x-default", href: url },
        ],
      };
    }
    const chapters = loaderData?.chapters ?? [];
    const chapterCount = chapters.length;
    const genresText = Array.isArray(m.genres) && m.genres.length ? ` (${m.genres.join(", ")})` : "";
    const primaryGenre =
      Array.isArray(m.genres) && m.genres.length ? ` ${m.genres[0]}` : "";
    const rawTitle = `${m.title} — Webtoon${primaryGenre} | Lcucumber`;
    const title = formatTitle(rawTitle, 60);
    const baseDesc = m.description
      ? m.description
      : `Đọc webtoon ${m.title}${genresText} cuộn dọc miễn phí trên Lcucumber. ${chapterCount} chương${m.author ? `, tác giả ${m.author}` : ""}, cập nhật liên tục.`;
    const desc = formatDesc(baseDesc, 160);
    const img = getOgImageUrl(m.cover_id ?? undefined);
    const firstChapter = chapters[0];
    const lastChapter = chapters[chapters.length - 1];
    const startDate = chapters.length
      ? chapters[0].created_at ?? undefined
      : (m as { created_at?: string | null }).created_at ?? undefined;
    const dateModified = (m as { updated_at?: string | null }).updated_at ?? (m as { created_at?: string | null }).created_at ?? undefined;

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "books.book" },
        { property: "og:image", content: img },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:alt", content: `Bìa truyện ${m.title}` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
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
            "@type": ["ComicSeries", "Book", "CreativeWorkSeries"],
            "@id": url,
            name: m.title,
            alternateName: m.title,
            headline: m.title,
            author: m.author ? { "@type": "Person", name: m.author } : undefined,
            creator: m.author ? { "@type": "Person", name: m.author } : undefined,
            description: desc,
            image: img,
            thumbnailUrl: img,
            genre: m.genres,
            keywords: (m.genres ?? []).join(", "),
            url,
            mainEntityOfPage: url,
            inLanguage: "vi-VN",
            isFamilyFriendly: !isMatureComic(m.genres),
            workExample: {
              "@type": "Book",
              bookFormat: "https://schema.org/EBook",
              inLanguage: "vi-VN",
              url,
            },
            numberOfEpisodes: chapterCount,
            datePublished: startDate,
            dateModified,
            publisher: {
              "@type": "Organization",
              name: "Lcucumber",
              url: SITE_URL,
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/og-default.jpg`,
              },
            },
            startEpisode: firstChapter
              ? { "@type": "ComicIssue", name: firstChapter.title, url: `${url}/${firstChapter.slug}` }
              : undefined,
            endEpisode: lastChapter
              ? { "@type": "ComicIssue", name: lastChapter.title, url: `${url}/${lastChapter.slug}` }
              : undefined,
            hasPart: chapters.slice(0, 50).map((ch, i) => ({
              "@type": "ComicIssue",
              position: i + 1,
              name: ch.title,
              url: `${url}/${ch.slug}`,
              datePublished: ch.created_at ?? undefined,
              isPartOf: { "@type": "ComicSeries", "@id": url, name: m.title },
            })),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: m.title, item: url },
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
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const comics = useComics(loaderData?.allComics);
  const loaded = useComicsLoaded();
  const comicFromStore = comics.find((c) => c.slug === slug);
  const comic = comicFromStore || (loaderData?.meta ? {
    id: loaderData.meta.id,
    slug: (loaderData.meta as any).slug || slug,
    title: loaderData.meta.title,
    author: loaderData.meta.author ?? "",
    description: loaderData.meta.description ?? "",
    coverId: loaderData.meta.cover_id ?? "",
    genres: (loaderData.meta.genres ?? []) as string[],
    chapters: (loaderData.chapters ?? []).map((ch) => ({
      id: ch.id,
      slug: ch.slug,
      title: ch.title,
      pages: ch.pages ?? [],
      createdAt: ch.created_at ? new Date(ch.created_at).getTime() : Date.now(),
    })),
    createdAt: loaderData.meta.created_at ? new Date(loaderData.meta.created_at).getTime() : Date.now(),
    featured: (loaderData.meta as any).featured ?? false,
  } : null);

  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});
  const [comicCount, setComicCount] = useState(0);
  const { isContributor } = useAuth();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    if (!comic) return;
    let active = true;
    const comicId = comic.id;
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
  }, [comic]);

  if (!comic) {
    if (!loaded && !loaderData?.meta) {
      return (
        <div className="min-h-screen">
          <SiteHeader />
          <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Đang tải…</div>
        </div>
      );
    }
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Không tìm thấy truyện</h1>
          <p className="mt-2 text-sm text-muted-foreground">Truyện này không tồn tại hoặc đã bị gỡ bỏ.</p>
          <Link to="/" className="mt-4 inline-block text-primary underline">Về trang chủ</Link>
        </div>
      </div>
    );
  }

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
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="transition hover:text-primary">Trang chủ</Link>
            <span className="text-border">/</span>
            <span className="line-clamp-1 text-foreground/80">{comic.title}</span>
          </nav>
          <div className="grid gap-8 md:grid-cols-[240px_1fr]">
            <div className="hover-lift mx-auto aspect-[3/4] w-full max-w-[240px] overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-glow">
              <ComicCover
                id={comic.coverId}
                title={comic.title}
                genres={comic.genres}
                chapterCount={comic.chapters.length}
              />
            </div>
            <div className="animate-fade-in-up">
              {isMatureComic(comic.genres) && <AgeWarning comicTitle={comic.title} />}
              <div className="flex flex-wrap gap-2">
                {comic.genres.map((g) => (
                  <Link
                    key={g}
                    to="/genre/$slug"
                    params={{ slug: slugifyGenre(g) }}
                    className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20 hover:scale-105"
                  >
                    {g}
                  </Link>
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
              <div className="mt-5 space-y-3 leading-relaxed text-foreground/90">
                <p className="whitespace-pre-line">
                  {comic.description ||
                    `Đọc truyện tranh ${comic.title} thể loại ${comic.genres?.join(", ") || "webtoon"} bản dịch chất lượng cao, cập nhật chương mới nhất miễn phí trên Lcucumber.`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Trọn bộ {comic.chapters.length} chương manhwa, manhua, webtoon Việt hóa đọc trực tuyến mượt mà, cuộn dọc không giới hạn trên mọi thiết bị.
                </p>
              </div>
              <RatingWidget comicId={comic.id} />
              {comic.chapters.length > 0 && (
                <Link
                  to="/truyen/$slug/$chapter"
                  params={{ slug: comic.slug, chapter: comic.chapters[0].slug }}
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
            <div className="ml-auto flex items-center gap-2">
              {isContributor && (
                <button
                  onClick={() => setQuickAddOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm chương
                </button>
              )}
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur">
                <MessageCircle className="h-3.5 w-3.5" />
                {Object.values(chapterCounts).reduce((a, b) => a + b, 0) + comicCount}
              </span>
            </div>
          </div>
          {comic.chapters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Chưa có chương nào. Vào <Link to="/admin" rel="nofollow" className="text-primary underline">Quản lý</Link> để thêm.
            </div>
          ) : (
            <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-background/40 backdrop-blur">
              {comic.chapters.map((ch, i) => (
                <li key={ch.id} className="group">
                  <Link
                    to="/truyen/$slug/$chapter"
                    params={{ slug: comic.slug, chapter: ch.slug }}
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

        {(() => {
          const genreSet = new Set(comic.genres.map((g) => g.toLowerCase().trim()));
          const related = comics
            .filter((c) => c.id !== comic.id && (
              (c.author && comic.author && c.author.toLowerCase().trim() === comic.author.toLowerCase().trim()) ||
              c.genres.some((g) => genreSet.has(g.toLowerCase().trim()))
            ))
            .slice(0, 6);
          if (related.length > 0) {
            return (
              <section className="mt-10 rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Truyện cùng thể loại & Đề xuất</h2>
                  <Link to="/the-loai" className="text-xs font-medium text-primary hover:underline">
                    Xem tất cả thể loại →
                  </Link>
                </div>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                  {related.map((r) => (
                    <li key={r.id}>
                      <Link
                        to="/truyen/$slug"
                        params={{ slug: r.slug }}
                        className="hover-lift block group"
                        title={r.title}
                      >
                        <div className="aspect-[3/4] overflow-hidden rounded-xl border border-border bg-card group-hover:border-primary/60">
                          <ComicCover
                            id={r.coverId}
                            title={r.title}
                            genres={r.genres}
                            chapterCount={r.chapters.length}
                          />
                        </div>
                        <span className="mt-2 line-clamp-2 block text-xs font-semibold transition-colors group-hover:text-primary">
                          {r.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          return (
            <section className="mt-10 rounded-2xl border border-border/80 bg-card/60 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Khám phá các thể loại liên quan</h2>
                  <p className="text-xs text-muted-foreground">Đọc thêm các bộ webtoon khác thuộc thể loại bạn yêu thích</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {comic.genres.map((g) => (
                    <Link
                      key={g}
                      to="/genre/$slug"
                      params={{ slug: slugifyGenre(g) }}
                      className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
                    >
                      {g}
                    </Link>
                  ))}
                  <Link
                    to="/the-loai"
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground transition hover:border-primary/60"
                  >
                    Xem tất cả thể loại →
                  </Link>
                </div>
              </div>
            </section>
          );
        })()}

        <CommentSection comicId={comic.id} />
      </main>
      {isContributor && quickAddOpen && (
        <QuickAddChapter
          comicId={comic.id}
          defaultOrder={comic.chapters.length}
          defaultTitle={`Chương ${comic.chapters.length + 1}`}
          onClose={() => setQuickAddOpen(false)}
        />
      )}
    </div>
  );
}

function QuickAddChapter({
  comicId,
  defaultOrder,
  defaultTitle,
  onClose,
}: {
  comicId: string;
  defaultOrder: number;
  defaultTitle: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [pagesText, setPagesText] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const pages = parseDriveIds(pagesText);
    if (!title.trim()) return toast.error("Nhập tiêu đề chương");
    setSaving(true);
    const { error } = await supabase.from("chapters").insert({
      comic_id: comicId,
      title: title.trim(),
      pages,
      order_index: defaultOrder,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Đã thêm chương");
    await loadComics();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-semibold">Thêm chương nhanh</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Đóng">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Tiêu đề</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Trang (mỗi dòng 1 File ID hoặc link Drive)
            </span>
            <textarea
              value={pagesText}
              onChange={(e) => setPagesText(e.target.value)}
              rows={8}
              placeholder="1AbC...&#10;https://drive.google.com/file/d/..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {parseDriveIds(pagesText).length} trang
            </p>
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border bg-background/40 px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary">
            Huỷ
          </button>
          <button
            onClick={submit}
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> {saving ? "Đang lưu…" : "Lưu chương"}
          </button>
        </footer>
      </div>
    </div>
  );
}