import { driveImageUrl } from "@/lib/drive";

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
  if (!id) {
    return (
      <div
        className={
          "flex items-center justify-center bg-gradient-to-br from-secondary to-muted text-muted-foreground " +
          (className ?? "")
        }
        role="img"
        aria-label={computedAlt}
      >
        <span className="px-3 text-center text-sm font-medium">{title}</span>
      </div>
    );
  }
  return (
    <img
      src={driveImageUrl(id, 600)}
      alt={computedAlt}
      width={600}
      height={800}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      className={"h-full w-full object-cover " + (className ?? "")}
    />
  );
}