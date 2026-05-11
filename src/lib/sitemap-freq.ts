export type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

/**
 * Suy ra <changefreq> từ khoảng cách trung bình giữa các lần đăng chương.
 * Nếu chỉ có 1 chương, dùng tuổi của chương đó so với hiện tại.
 */
export function inferChangeFreq(
  chapterTimestamps: number[],
  now: number = Date.now(),
): ChangeFreq {
  if (!chapterTimestamps.length) return "monthly";
  const sorted = [...chapterTimestamps].sort((a, b) => b - a);
  let avgMs: number;
  if (sorted.length >= 2) {
    const gaps: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++) gaps.push(sorted[i] - sorted[i + 1]);
    avgMs = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  } else {
    avgMs = Math.max(now - sorted[0], 0);
  }
  const day = 86_400_000;
  if (avgMs < day / 2) return "hourly";
  if (avgMs < day * 2) return "daily";
  if (avgMs < day * 10) return "weekly";
  if (avgMs < day * 45) return "monthly";
  return "yearly";
}
