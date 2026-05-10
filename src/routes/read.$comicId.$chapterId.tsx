import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useComics, useComicsLoaded } from "@/lib/comics-store";
import { driveImageUrl } from "@/lib/drive";
import { ArrowLeft, ChevronLeft, ChevronRight, List } from "lucide-react";
import { useEffect, useState } from "react";
import { Virtuoso } from "react-virtuoso";

export const Route = createFileRoute("/read/$comicId/$chapterId")({
  component: Reader,
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
  }, [chapterId]);

  if (!loaded) {
    return <div className="p-10 text-center text-muted-foreground">Đang tải…</div>;
  }
  if (!comic || !chapter) throw notFound();

  const prev = idx > 0 ? comic.chapters[idx - 1] : null;
  const next = idx < comic.chapters.length - 1 ? comic.chapters[idx + 1] : null;

  const Footer = () => (
    <nav className="mx-auto flex max-w-3xl items-center justify-between gap-2 p-6">
      <button
        disabled={!prev}
        onClick={() =>
          prev &&
          navigate({
            to: "/read/$comicId/$chapterId",
            params: { comicId: comic.id, chapterId: prev.id },
          })
        }
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-secondary"
      >
        <ChevronLeft className="h-4 w-4" /> Trước
      </button>
      <Link
        to="/comic/$comicId"
        params={{ comicId: comic.id }}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
      >
        <List className="h-4 w-4" /> Mục lục
      </Link>
      <button
        disabled={!next}
        onClick={() =>
          next &&
          navigate({
            to: "/read/$comicId/$chapterId",
            params: { comicId: comic.id, chapterId: next.id },
          })
        }
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40 hover:opacity-90"
      >
        Sau <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header
        className={
          "fixed inset-x-0 top-0 z-40 border-b border-border bg-background/85 backdrop-blur transition-transform " +
          (hideUI ? "-translate-y-full" : "translate-y-0")
        }
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link
            to="/comic/$comicId"
            params={{ comicId: comic.id }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="line-clamp-1">{comic.title}</span>
          </Link>
          <span className="text-xs text-muted-foreground">{chapter.title}</span>
        </div>
      </header>

      {chapter.pages.length === 0 ? (
        <main className="mx-auto max-w-3xl pt-14">
          <div className="p-10 text-center text-muted-foreground">
            Chương này chưa có trang nào.
          </div>
          <Footer />
        </main>
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
                src={driveImageUrl(id, 1200)}
                alt={`Trang ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="block w-full min-h-[60vh] bg-secondary/40 object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = "1";
                    const m = img.src.match(/[?&]id=([A-Za-z0-9_-]+)/);
                    if (m) img.src = `https://lh3.googleusercontent.com/d/${m[1]}=w1200`;
                  } else {
                    img.style.opacity = "0.3";
                  }
                }}
              />
            </div>
          )}
        />
      )}
    </div>
  );
}