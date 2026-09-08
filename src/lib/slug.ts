/**
 * Bảng ánh xạ các slug thể loại tương đồng/trùng nghĩa về 1 slug chuẩn duy nhất (Canonical Genre Slug).
 * Giúp giải quyết duplicate content và tập trung authority SEO.
 */
export const GENRE_CANONICAL_MAP: Record<string, string> = {
  // Boys' Love / Đam mỹ
  "boy-love": "bl",
  "boylove": "bl",
  "boys-love": "bl",
  "boyslove": "bl",
  "boy": "bl",
  "dam-my": "bl",
  "dammy": "bl",
  "danmei": "bl",
  "yaoi": "bl",
  "shounen-ai": "bl",

  // 18+ / Adult / Mature
  "19": "18",
  "19-": "18",
  "adult": "18",
  "r18": "18",
  "mature": "18",
  "truong-thanh": "18",

  // Việt hoá
  "viethoa": "viet-hoa",

  // Hành động / Action
  "action": "hanh-dong",

  // Lãng mạn / Romance / Ngôn tình
  "lang-man": "romance",
  "ngon-tinh": "romance",

  // Hài hước / Comedy
  "hai-huoc": "comedy",
  "hai": "comedy",

  // Huyền ảo / Fantasy
  "huyen-ao": "fantasy",
  "huyen-huyen": "fantasy",

  // Hoàn thành / Complete
  "complete": "hoan-thanh",
  "completed": "hoan-thanh",
  "full": "hoan-thanh",

  // Xuyên không / Isekai
  "isekai": "xuyen-khong",

  // Hệ thống / System
  "system": "he-thong",
};

/**
 * Chuyển tên thể loại thành slug an toàn cho URL (loại dấu tiếng Việt)
 * và chuẩn hoá về canonical slug nếu nằm trong danh mục alias.
 */
export function slugifyGenre(input: string): string {
  const raw = (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return GENRE_CANONICAL_MAP[raw] ?? raw;
}

/**
 * Lấy slug chuẩn đại diện cho một slug thể loại bất kỳ.
 */
export function getCanonicalGenreSlug(slug: string): string {
  const clean = (slug || "").toLowerCase().trim();
  return GENRE_CANONICAL_MAP[clean] ?? clean;
}
