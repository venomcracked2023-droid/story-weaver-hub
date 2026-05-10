import { driveImageUrl } from "@/lib/drive";

export function ComicCover({ id, title, className }: { id?: string; title: string; className?: string }) {
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
      alt={title}
      loading="lazy"
      className={"h-full w-full object-cover " + (className ?? "")}
    />
  );
}