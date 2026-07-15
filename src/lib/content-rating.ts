// Xác định truyện thuộc nhóm nội dung trưởng thành (18+) dựa trên genres/tags.
// Dùng chung cho banner cảnh báo và metadata SEO nếu cần mở rộng.
const MATURE_TAGS = [
  "18+",
  "r18",
  "r-18",
  "adult",
  "mature",
  "nsfw",
  "smut",
  "hentai",
  "ecchi",
  "yaoi",
  "yuri",
  "bl",
  "gl",
  "boys love",
  "girls love",
];

export function isMatureComic(genres: readonly string[] | null | undefined): boolean {
  if (!genres?.length) return false;
  return genres.some((g) => {
    const norm = g.trim().toLowerCase();
    return MATURE_TAGS.some((t) => norm === t || norm.includes(t));
  });
}

// Ngưỡng tuổi hiển thị. Đổi ở đây nếu muốn nâng lên 18+.
export const MIN_AGE = 18;