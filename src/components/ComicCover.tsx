import { useEffect, useState } from "react";
import { driveImageUrl, extractDriveId } from "@/lib/drive";
import { BookOpen } from "lucide-react";

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
      genres && genres.length ? ` — truyện ${genres.slice(0, 2).join(", ")}` : ""
    }${chapterCount ? ` ${chapterCount} chương` : ""}`;

  const cleanId = id ? extractDriveId(id) ?? id : "";
  const primaryUrl = cleanId ? driveImageUrl(cleanId, 600) : "";
  const [currentSrc, setCurrentSrc] = useState(primaryUrl);
  const [retryCount, setRetryCount] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(primaryUrl);
    setRetryCount(0);
    setFailed(false);
  }, [primaryUrl]);

  const handleError = () => {
    if (retryCount === 0 && cleanId) {
      // Retry with alternative Google usercontent format
      setRetryCount(1);
      if (cleanId.startsWith("http") || cleanId.startsWith("/")) {
        setCurrentSrc(cleanId);
      } else {
        setCurrentSrc(`https://lh3.googleusercontent.com/d/${cleanId}=w600`);
      }
    } else if (retryCount === 1 && cleanId && !cleanId.startsWith("http") && !cleanId.startsWith("/")) {
      // Retry with proxy endpoint
      setRetryCount(2);
      setCurrentSrc(`/api/drive-file?id=${encodeURIComponent(cleanId)}`);
    } else {
      setFailed(true);
    }
  };

  if (!id || failed || !currentSrc) {
    return (
      <div
        className={
          "relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950/60 via-card to-secondary/80 p-3 text-center text-foreground select-none " +
          (className ?? "")
        }
        role="img"
        aria-label={computedAlt}
      >
        <BookOpen className="mb-2 h-7 w-7 text-primary/70" />
        <span className="line-clamp-2 text-xs font-bold leading-tight tracking-tight">
          {title}
        </span>
        {genres && genres.length > 0 && (
          <span className="mt-1.5 line-clamp-1 text-[10px] text-muted-foreground font-medium">
            {genres.slice(0, 2).join(" • ")}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={computedAlt}
      width={600}
      height={800}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      onError={handleError}
      className={"h-full w-full object-cover transition-opacity duration-300 " + (className ?? "")}
    />
  );
}