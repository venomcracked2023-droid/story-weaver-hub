import { driveImageUrl } from "@/lib/drive";

export function ComicCover({
  id,
  title,
  className,
  priority = false,
}: {
  id?: string;
  title: string;
  className?: string;
  priority?: boolean;
}) {
  if (!id) {
    return (
      <div
        className={
          "flex items-center justify-center bg-gradient-to-br from-secondary to-muted text-muted-foreground " +
          (className ?? "")
        }
      >
        <span className="px-3 text-center text-sm font-medium">{title}</span>
      </div>
    );
  }
  return (
    <img
      src={driveImageUrl(id, 600)}
      alt={`Bìa truyện ${title}`}
      width={600}
      height={800}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      className={"h-full w-full object-cover " + (className ?? "")}
    />
  );
}