import { SITE_URL } from "./seo";

// Known local covers mapping
const LOCAL_COVERS: Record<string, string> = {
  "1L0n1l52DNr9sXG0lpkJl3WD3jEMaff3X": "/assets/covers/shutline.jpg",
  "shutline": "/assets/covers/shutline.jpg",
};

// Helpers for embedding Google Drive images or self-hosted assets.
// Accepts a raw File ID, asset path or any common Drive URL and returns the File ID or asset path.
export function extractDriveId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (LOCAL_COVERS[s] || s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }
  // Already an ID (alphanum, _-, length ~20-60)
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return s;
  const patterns = [
    /\/file\/d\/([A-Za-z0-9_-]+)/,
    /[?&]id=([A-Za-z0-9_-]+)/,
    /\/d\/([A-Za-z0-9_-]+)/,
    /uc\?id=([A-Za-z0-9_-]+)/,
  ];
  for (const r of patterns) {
    const m = s.match(r);
    if (m) return m[1];
  }
  return null;
}

export function driveImageUrl(idOrUrl: string, width = 1600): string {
  if (!idOrUrl) return "";
  const s = idOrUrl.trim();
  if (LOCAL_COVERS[s]) return LOCAL_COVERS[s];
  if (s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }
  const id = extractDriveId(s) ?? s;
  if (LOCAL_COVERS[id]) return LOCAL_COVERS[id];
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;
}

export function getOgImageUrl(idOrUrl?: string): string {
  if (!idOrUrl) return `${SITE_URL}/og-default.jpg`;
  const resolved = driveImageUrl(idOrUrl, 1200);
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return resolved;
  }
  if (resolved.startsWith("/")) {
    return `${SITE_URL}${resolved}`;
  }
  return `${SITE_URL}/og-default.jpg`;
}

export function parseDriveIds(text: string): string[] {
  return text
    .split(/\s|,|;/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => extractDriveId(l) ?? l);
}