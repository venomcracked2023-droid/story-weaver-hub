import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { driveImageUrl, extractDriveId, getOgImageUrl } from "@/lib/drive";
import { enhanceComicMetadata } from "@/lib/comics-store";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, List } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommentSection } from "@/components/CommentSection";
import { AgeWarning } from "@/components/AgeWarning";
import { isMatureComic } from "@/lib/content-rating";
import { SITE_URL, formatTitle, formatDesc } from "@/lib/seo";
import { slugifyGenre } from "@/lib/slug";

const PdfReader = lazy(() =>
  import("@/components/PdfReader").then((module) => ({ default: module.PdfReader })),
);

function chapterSummary(comicTitle: string, chapterTitle: string, description?: string, genres: string[] = []) {
  const base = (description ?? "").trim();
  const genreText = genres.length ? ` Thuộc thể loại ${genres.join(", ")}.` : "";
  return base
    ? `Đọc ${chapterTitle} của ${comicTitle} trên Lcucumber. ${base}${genreText}`
    : `Đọc ${chapterTitle} của ${comicTitle} online miễn phí trên Lcucumber với trải nghiệm webtoon cuộn dọc mượt trên mọi thiết bị.${genreText}`;
}

export const Route = createFileRoute("/truyen/$slug/$chapter")({
  component: Reader,
  loader: async ({ params }) => {
    const { data: comicRaw } = await supabase
      .from("comics")
      .select("id,title,cover_id,slug,genres,description")
      .eq("slug", params.slug)
      .maybeSingle();
    if (!comicRaw) {
      throw notFound();
    }
    const comic = enhanceComicMetadata(comicRaw);
    const { data: siblings } = await supabase
      .from("chapters")
      .select("id,title,slug,pages,created_at,order_index")
      .eq("comic_id", comic.id)
      .order("order_index", { ascending: true });
    const list = (siblings ?? []) as Array<{
      id: string; title: string; slug: string; pages: string[] | null; created_at: string; order_index: number;
    }>;
    const idx = list.findIndex((c) => c.slug === params.chapter);
    const chapter = idx >= 0 ? list[idx] : null;
    if (!chapter) {
      throw notFound();
    }
    const prevSlug = idx > 0 ? list[idx - 1].slug : null;
    const nextSlug = idx >= 0 && idx < list.length - 1 ? list[idx + 1].slug : null;
    return {
      comic: {
        id: comic.id,
        title: comic.title ?? "",
        slug: comic.slug ?? params.slug,
        coverId: comic.cover_id ?? "",
        genres: (comic.genres ?? []) as string[],
        description: comic.description ?? "",
      },
      chapter: chapter
        ? {
            id: chapter.id,
            title: chapter.title,
            slug: chapter.slug,
            pages: (chapter.pages ?? []) as string[],
            createdAt: chapter.created_at,
          }
        : null,
      prevSlug,
      nextSlug,
      chapters: list.map((c) => ({ id: c.id, slug: c.slug, title: c.title })),
    };
  },
  head: ({ loaderData, params }) => {
    const ct = loaderData?.comic?.title;
    const ch = loaderData?.chapter?.title;
    const coverId = loaderData?.comic?.coverId;
    if (!ct || !ch) return { meta: [{ title: "Đang đọc — Lcucumber" }] };
    const rawTitle = `${ch} - ${ct} | Lcucumber`;
    const title = formatTitle(rawTitle, 60);
    const summary = chapterSummary(ct, ch, loaderData?.comic?.description, loaderData?.comic?.genres);
    const desc = formatDesc(summary, 160);
    const url = `${SITE_URL}/truyen/${params.slug}/${params.chapter}`;
    const comicUrl = `${SITE_URL}/truyen/${params.slug}`;
    const img = getOgImageUrl(coverId);
    const prevUrl = loaderData?.prevSlug ? `${comicUrl}/${loaderData.prevSlug}` : null;
    const nextUrl = loaderData?.nextSlug ? `${comicUrl}/${loaderData.nextSlug}` : null;
    const pdfId = loaderData?.chapter?.pages?.length === 1 ? extractDriveId(loaderData.chapter.pages[0]) ?? loaderData.chapter.pages[0] : null;
    const pdfUrl = pdfId ? `${SITE_URL}/api/drive-file?id=${encodeURIComponent(pdfId)}` : null;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: img },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: `Bìa ${ct}` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "vi", href: url },
        { rel: "alternate", hrefLang: "x-default", href: url },
        ...(prevUrl ? [{ rel: "prev", href: prevUrl }] : []),
        ...(nextUrl ? [{ rel: "next", href: nextUrl }] : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: ct, item: comicUrl },
              { "@type": "ListItem", position: 3, name: ch, item: url },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["Chapter", "ComicIssue", "PublicationIssue"],
            "@id": url,
            name: `${ch} — ${ct}`,
            headline: `${ch} — ${ct}`,
            description: desc,
            url,
            mainEntityOfPage: url,
            isPartOf: {
              "@type": ["ComicSeries", "Book"],
              name: ct,
              url: comicUrl,
            },
            datePublished: loaderData.chapter?.createdAt ?? undefined,
            inLanguage: "vi-VN",
            associatedMedia: pdfUrl
              ? {
                  "@type": "MediaObject",
                  encodingFormat: "application/pdf",
                  contentUrl: pdfUrl,
                  name: `${ch} — ${ct}`,
                }
              : undefined,
            publisher: {
              "@type": "Organization",
              name: "Lcucumber",
              url: SITE_URL,
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/og-default.jpg`,
              },
            },
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
  const { slug, chapter: chapterSlug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const navigate = useNavigate();
  type ChapterNav = { id: string; slug: string; title: string };
  const comic = loaderData?.comic ?? null;
  const chapter = loaderData?.chapter ?? null;
  const chapters: ChapterNav[] = loaderData?.chapters ?? [];
  const idx = chapters.findIndex((c: ChapterNav) => c.slug === chapterSlug);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [hideUI, setHideUI] = useState(false);
  const [pdfFailed, setPdfFailed] = useState(false);
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
    if (typeof window !== "undefined") window.scrollTo(0, 0);
    setPdfFailed(false);
  }, [chapterSlug]);

  if (!comic || !chapter) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-10 text-center">
        <p className="text-muted-foreground mb-4">Không tìm thấy chương truyện này.</p>
        <Link to="/" className="text-primary underline">Về trang chủ</Link>
      </div>
    );
  }

  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;
  const first = chapters[0];
  const last = chapters[chapters.length - 1];
  const total = chapters.length;
  const progress = total > 0 ? ((idx + 1) / total) * 100 : 0;
  const summary = chapterSummary(comic.title, chapter.title, comic.description, comic.genres);

  const singleId =
    chapter.pages.length === 1
      ? extractDriveId(chapter.pages[0]) ?? chapter.pages[0]
      : null;

  const goToChapter = (chSlug: string) =>
    navigate({
      to: "/truyen/$slug/$chapter",
      params: { slug: comic.slug, chapter: chSlug },
    });

  const Footer = () => (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-6">
      <nav aria-label="Điều hướng chương" className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/truyen/$slug"
          params={{ slug: comic.slug }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Mục lục {comic.title}
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {prev && (
            <Link
              to="/truyen/$slug/$chapter"
              params={{ slug: comic.slug, chapter: prev.slug }}
              rel="prev"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 transition hover:border-primary/60 hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" /> {prev.title}
            </Link>
          )}
          {next && (
            <Link
              to="/truyen/$slug/$chapter"
              params={{ slug: comic.slug, chapter: next.slug }}
              rel="next"
              className="inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1.5 font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
            >
              Đọc chương sau: {next.title} <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </nav>

      {comic.genres.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border/70 bg-card/50 p-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Khám phá thể loại của truyện:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {comic.genres.map((g: string) => (
                <Link
                  key={g}
                  to="/genre/$slug"
                  params={{ slug: slugifyGenre(g) }}
                  className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary transition hover:bg-primary/20 hover:scale-105"
                >
                  {g}
                </Link>
              ))}
              <Link
                to="/the-loai"
                className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                Tất cả thể loại →
              </Link>
            </div>
          </div>
        </div>
      )}

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
          onClick={() => first && goToChapter(first.slug)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary/60 hover:bg-secondary hover:text-foreground disabled:opacity-30"
          aria-label="Chương đầu"
          title="Chương đầu"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          disabled={!prev}
          onClick={() => prev && goToChapter(prev.slug)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm transition hover:border-primary/60 hover:bg-secondary disabled:opacity-30"
          aria-label="Chương trước"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        <div className="relative min-w-0 flex-1">
          <List className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={chapter.slug}
            onChange={(e) => goToChapter(e.target.value)}
            className="w-full appearance-none truncate rounded-full border border-border bg-background py-2 pl-9 pr-8 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            aria-label="Chuyển chương nhanh"
          >
            {chapters.map((ch: ChapterNav, i: number) => (
              <option key={ch.id} value={ch.slug}>
                {i + 1}. {ch.title}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
        </div>

        <button
          disabled={!next}
          onClick={() => next && goToChapter(next.slug)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-brand px-3 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          aria-label="Chương sau"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          disabled={!next}
          onClick={() => last && goToChapter(last.slug)}
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
            to="/truyen/$slug"
            params={{ slug: comic.slug }}
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

      <h1 className="sr-only">{`${chapter.title} — ${comic.title}`}</h1>
      <section className="sr-only" aria-label="Tóm tắt chương cho SEO">
        <h2>{chapter.title} — {comic.title}</h2>
        <p>{summary}</p>
        <nav aria-label="Breadcrumb chương">
          <a href="/">Trang chủ</a> / <a href={`/truyen/${comic.slug}`}>{comic.title}</a> / <span>{chapter.title}</span>
        </nav>
        <nav aria-label="Liên kết chương liên quan">
          {prev && <a href={`/truyen/${comic.slug}/${prev.slug}`} rel="prev">Chương trước: {prev.title}</a>}
          {next && <a href={`/truyen/${comic.slug}/${next.slug}`} rel="next">Chương sau: {next.title}</a>}
        </nav>
      </section>

      {isMatureComic(comic.genres) && (
        <div className="mx-auto max-w-3xl px-4 pt-16">
          <AgeWarning comicTitle={comic.title} />
        </div>
      )}

      {chapter.pages.length === 0 ? (
        <main className="mx-auto max-w-3xl pt-14">
          <div className="p-10 text-center text-muted-foreground">
            Chương này chưa có trang nào.
          </div>
          <Footer />
        </main>
      ) : singleId && !pdfFailed ? (
        <>
          <noscript>
            <div className="mx-auto max-w-3xl px-4 pt-16">
              <nav aria-label="Breadcrumb">
                <a href="/">Trang chủ</a> ›{" "}
                <a href={`/truyen/${comic.slug}`}>{comic.title}</a> › {chapter.title}
              </nav>
              <h2>{chapter.title} — {comic.title}</h2>
              <p>{summary}</p>
              <p>
                <a href={`/api/drive-file?id=${singleId}`}>Tải chương dạng PDF</a>
              </p>
              <ul>
                {prev && (
                  <li>
                    <a href={`/truyen/${comic.slug}/${prev.slug}`} rel="prev">
                      ← {prev.title}
                    </a>
                  </li>
                )}
                {next && (
                  <li>
                    <a href={`/truyen/${comic.slug}/${next.slug}`} rel="next">
                      {next.title} →
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </noscript>
          {mounted ? (
            <Suspense fallback={<main className="mx-auto max-w-3xl px-4 pt-24 text-center text-muted-foreground">Đang tải trình đọc…</main>}>
              <PdfReader
                fileUrl={`/api/drive-file?id=${singleId}`}
                Footer={Footer}
                onFail={() => setPdfFailed(true)}
              />
            </Suspense>
          ) : (
            <main className="mx-auto max-w-3xl px-4 pt-24 text-center text-muted-foreground">
              <p className="sr-only">{summary}</p>
              Đang tải trình đọc…
              <Footer />
            </main>
          )}
        </>
      ) : (
        <main className="mx-auto max-w-3xl pt-14">
          {chapter.pages.map((id: string, i: number) => (
            <img
              key={`${id}-${i}`}
              src={driveImageUrl(id, 1200)}
              alt={`${comic.title} — ${chapter.title} — trang ${i + 1}`}
              loading={i < 2 ? "eager" : "lazy"}
              decoding="async"
              className="block w-full min-h-[60vh] bg-secondary/40 object-contain"
            />
          ))}
          <Footer />
        </main>
      )}
      <StickyNav />
    </div>
  );
}