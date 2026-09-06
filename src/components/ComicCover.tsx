import { useEffect, useState } from "react";
import { driveImageUrl, extractDriveId } from "@/lib/drive";
import { BookOpen, Sparkles } from "lucide-react";

export function ComicCover({
  id,
  title,
  className,
  priority = false,
  alt,
  genres,
  chapterCount,
}: {
  id?: string;
  title: string;
  className?: string;
  priority?: boolean;
  alt?: string;
  genres?: string[];
  chapterCount?: number;
}) {
  const computedAlt =
    alt ??
    `Bìa truyện ${title}${
      genres && genres.length ? ` — thể loại ${genres.slice(0, 2).join(", ")}` : ""
    }${chapterCount ? ` ${chapterCount} chương` : ""}`;

  const cleanId = id ? extractDriveId(id) ?? id : "";
  const primaryUrl = cleanId ? driveImageUrl(cleanId, 600) : "";
  const [currentSrc, setCurrentSrc] = useState(primaryUrl);
  const [retryCount, setRetryCount] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCurrentSrc(primaryUrl);
    setRetryCount(0);
    setFailed(false);
    setLoaded(false);
  }, [primaryUrl]);

  const handleError = () => {
    if (retryCount === 0 && cleanId) {
      // Retry 1: Google thumbnail endpoint
      setRetryCount(1);
      if (cleanId.startsWith("http") || cleanId.startsWith("/")) {
        setCurrentSrc(cleanId);
      } else {
        setCurrentSrc(`https://drive.google.com/thumbnail?id=${cleanId}&sz=w600`);
      }
    } else if (retryCount === 1 && cleanId && !cleanId.startsWith("http") && !cleanId.startsWith("/")) {
      // Retry 2: Server-side cached proxy endpoint
      setRetryCount(2);
      setCurrentSrc(`/api/og-image?id=${encodeURIComponent(cleanId)}`);
    } else {
      // Tier 4: Permanent graceful fallback card
      setFailed(true);
    }
  };

  if (!id || failed || !currentSrc) {
    return (
      <div
        className={
          "relative flex h-full w-full flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-emerald-950/70 via-card to-secondary/90 p-3.5 text-center text-foreground select-none " +
          (className ?? "")
        }
        role="img"
        aria-label={computedAlt}
      >
        <div className="flex w-full items-center justify-between opacity-60">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Lcucumber</span>
        </div>
        <div className="flex flex-col items-center justify-center my-auto">
          <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="line-clamp-2 text-xs font-bold leading-snug tracking-tight text-foreground/90 px-1">
            {title}
          </span>
        </div>
        {genres && genres.length > 0 ? (
          <span className="line-clamp-1 rounded-full bg-background/50 px-2 py-0.5 text-[9px] font-medium text-muted-foreground backdrop-blur">
            {genres.slice(0, 2).join(" • ")}
          </span>
        ) : (
          <span className="text-[9px] text-muted-foreground">Webtoon</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-card/60">
      {/* Skeleton Shimmer while loading */}
      {!loaded && !failed && (
        <div
          className="absolute inset-0 z-0 animate-pulse bg-gradient-to-br from-secondary/80 via-card/60 to-secondary/80"
          aria-hidden="true"
        />
      )}
      <img
        src={currentSrc}
        alt={computedAlt}
        width={600}
        height={800}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={
          `relative z-10 h-full w-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          } ` + (className ?? "")
        }
      />
    </div>
  );
}
