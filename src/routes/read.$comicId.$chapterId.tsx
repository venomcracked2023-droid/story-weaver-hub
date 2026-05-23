import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useComics, useComicsLoaded } from "@/lib/comics-store";
import { driveImageUrl, driveImageFallbackUrl, extractDriveId } from "@/lib/drive";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, List } from "lucide-react";
import { useEffect, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { PdfReader } from "@/components/PdfReader";
import { supabase } from "@/integrations/supabase/client";
import { CommentSection } from "@/components/CommentSection";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/read/$comicId/$chapterId")({
  component: Reader,
  ssr: false,
  loader: async ({ params }) => {
    const [{ data: comic }, { data: chapter }] = await Promise.all([
      supabase.from("comics").select("title,cover_id").eq("id", params.comicId).maybeSingle(),
      supabase.from("chapters").select("title").eq("id", params.chapterId).maybeSingle(),
    ]);
    return {
      comicTitle: comic?.title ?? null,
      coverId: comic?.cover_id ?? null,
      chapterTitle: chapter?.title ?? null,
    };
  },
  head: ({ loaderData, params }) => {
    const ct = loaderData?.comicTitle;
    const ch = loaderData?.chapterTitle;
    const coverId = loaderData?.coverId;
    if (!ct || !ch) return { meta: [{ title: "Đang đọc — Lcucumber" }] };
    const title = `${ch} — ${ct} | Lcucumber`;
    const desc = `Đọc ${ch} của ${ct} online cuộn dọc miễn phí trên Lcucumber.`;
    const url = `${SITE_URL}/read/${params.comicId}/${params.chapterId}`;
    const img = coverId ? driveImageUrl(coverId, 1200) : `${SITE_URL}/og-default.jpg`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: img },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
        { property: "article:section", content: ct },
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
              {
                "@type": "ListItem",
                position: 2,
                name: ct,
                item: `${SITE_URL}/comic/${params.comicId}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: ch,
                item: url,
              },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="p-10 text-center">
      Không tìm thấy chương. <Link to="/" className="text-primary underline">Về trang chủ</Link>
    </div>
  ),
  errorComponent: ({ error }) => <div className="p-10 text-destructive">{error.message}</div>,
});

function Reader() {
  const { comicId, chapterId } = Route.useParams();
  const navigate = useNavigate();
  const comics = useComics();
  const loaded = useComicsLoaded();
  const comic = comics.find((c) => c.id === comicId);
  const idx = comic?.chapters.findIndex((c) => c.id === chapterId) ?? -1;
  const chapter = comic && idx >= 0 ? comic.chapters[idx] : null;

  const [hideUI, setHideUI] = useState(false);
  const [pdfFailed, setPdfFailed] = useState(false);
  const [imgWidth, setImgWidth] = useState<number>(900);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      // pick a width close to actual display * DPR, but capped to keep
      // mobile networks happy (smaller image = faster + fewer timeouts).
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const target = Math.min(Math.ceil(w * dpr), 1200);
      // bucket so we don't request many different sizes
      const buckets = [480, 720, 900, 1080, 1200];
      setImgWidth(buckets.find((b) => b >= target) ?? 1200);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      setHideUI(y > 200 && y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setPdfFailed(false);
  }, [chapterId]);

  if (!loaded) {
    return <div className="p-10 text-center text-muted-foreground">Đang tải…</div>;
  }
  if (!comic || !chapter) throw notFound();

  const prev = idx > 0 ? comic.chapters[idx - 1] : null;
  const next = idx < comic.chapters.length - 1 ? comic.chapters[idx + 1] : null;
  const first = comic.chapters[0];
  const last = comic.chapters[comic.chapters.length - 1];
  const total = comic.chapters.length;
  const progress = total > 0 ? ((idx + 1) / total) * 100 : 0;

  const singleId =
    chapter.pages.length === 1
      ? extractDriveId(chapter.pages[0]) ?? chapter.pages[0]
      : null;

  const goToChapter = (id: string) =>
    navigate({
      to: "/read/$comicId/$chapterId",
      params: { comicId: comic.id, chapterId: id },
    });

  const Footer = () => (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-6">
      <Link
        to="/comic/$comicId"
        params={{ comicId: comic.id }}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại mục lục truyện
      </Link>
      <div className="mt-6">
        <CommentSection comicId={comic.id} chapterId={chapter.id} />
      </div>
    </div>
  );

  const StickyNav = () => (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50"
      aria-label="Điều hướng chương"
    >
      <div className="h-1 w-full bg-secondary">
        <div
          className="h-full bg-gradient-brand transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2 sm:px-4">
        <span className="hidden shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary sm:inline-flex">
          {idx + 1}<span className="text-primary/60">/{total}</span>
        </span>
        <button
          disabled={!prev}
          onClick={() => first && goToChapter(first.id)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary/60 hover:bg-secondary hover:text-foreground disabled:opacity-30"
          aria-label="Chương đầu"
          title="Chương đầu"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          disabled={!prev}
          onClick={() => prev && goToChapter(prev.id)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm transition hover:border-primary/60 hover:bg-secondary disabled:opacity-30"
          aria-label="Chương trước"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        <div className="relative min-w-0 flex-1">
          <List className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={chapter.id}
            onChange={(e) => goToChapter(e.target.value)}
            className="w-full appearance-none truncate rounded-full border border-border bg-background py-2 pl-9 pr-8 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            aria-label="Chuyển chương nhanh"
          >
            {comic.chapters.map((ch, i) => (
              <option key={ch.id} value={ch.id}>
                {i + 1}. {ch.title}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
        </div>

        <button
          disabled={!next}
          onClick={() => next && goToChapter(next.id)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-brand px-3 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          aria-label="Chương sau"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          disabled={!next}
          onClick={() => last && goToChapter(last.id)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary/60 hover:bg-secondary hover:text-foreground disabled:opacity-30"
          aria-label="Chương cuối"
          title="Chương cuối"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header
        className={
          "fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 transition-transform " +
          (hideUI ? "-translate-y-full" : "translate-y-0")
        }
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link
            to="/comic/$comicId"
            params={{ comicId: comic.id }}
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="line-clamp-1 underline-offset-4 group-hover:font-extrabold group-hover:underline group-hover:decoration-primary/60">
              {comic.title}
            </span>
          </Link>
          <span className="text-xs font-bold text-foreground">{chapter.title}</span>
        </div>
      </header>

      {chapter.pages.length === 0 ? (
        <main className="mx-auto max-w-3xl pt-14">
          <div className="p-10 text-center text-muted-foreground">
            Chương này chưa có trang nào.
          </div>
          <Footer />
        </main>
      ) : singleId && !pdfFailed ? (
        <PdfReader
          fileUrl={`/api/drive-file?id=${singleId}`}
          Footer={Footer}
          onFail={() => setPdfFailed(true)}
        />
      ) : (
        <Virtuoso
          useWindowScroll
          data={chapter.pages}
          increaseViewportBy={{ top: 1500, bottom: 2000 }}
          components={{
            Header: () => <div className="h-14" />,
            Footer,
          }}
          itemContent={(i, id) => (
            <div className="mx-auto max-w-3xl">
              <img
                src={driveImageUrl(id, imgWidth)}
                alt={`Trang ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="block w-full min-h-[60vh] bg-secondary/40 object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = "1";
                    img.src = driveImageFallbackUrl(id, imgWidth);
                  } else if (img.dataset.fallback === "1") {
                    img.dataset.fallback = "2";
                    // last resort: uc?export=view
                    const did = extractDriveId(id) ?? id;
                    img.src = `https://drive.google.com/uc?export=view&id=${did}`;
                  } else {
                    img.style.opacity = "0.3";
                  }
                }}
              />
            </div>
          )}
        />
      )}
      <StickyNav />
    </div>
  );
}