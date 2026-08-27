import { SITE_URL } from "./seo";

// Known local covers mapping
const LOCAL_COVERS: Record<string, string> = {
  "1L0n1l52DNr9sXG0lpkJl3WD3jEMaff3X": "/assets/covers/shutline.jpg",
  "shutline": "/assets/covers/shutline.jpg",
};

// Helpers for embedding Google Drive images or self-hosted assets.
// Accepts a raw File ID, asset path or any common Drive URL and returns the File ID or asset path.
export function extractDriveId(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;
  if (LOCAL_COVERS[s] || s.startsWith("/")) {
    return s;
  }

  // Check for Google Drive URLs FIRST before checking general HTTP
  const drivePatterns = [
    /\/file\/d\/([A-Za-z0-9_-]+)/i,
    /\/d\/([A-Za-z0-9_-]+)/i,
    /[?&]id=([A-Za-z0-9_-]+)/i,
    /uc\?id=([A-Za-z0-9_-]+)/i,
    /thumbnail\?id=([A-Za-z0-9_-]+)/i,
    /lh3\.googleusercontent\.com\/d\/([A-Za-z0-9_-]+)/i,
    /open\?id=([A-Za-z0-9_-]+)/i,
    /document\/d\/([A-Za-z0-9_-]+)/i,
  ];

  for (const r of drivePatterns) {
    const m = s.match(r);
    if (m && m[1]) return m[1];
  }

  // If it's a raw Drive ID (alphanumeric, -, _, length 15-60)
  if (/^[A-Za-z0-9_-]{15,60}$/.test(s)) {
    return s;
  }

  // Non-drive external direct image URL
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }

  return s;
}

export function driveImageUrl(idOrUrl: string, width = 1600): string {
  if (!idOrUrl) return "";
  const s = idOrUrl.trim();
  if (LOCAL_COVERS[s]) return LOCAL_COVERS[s];
  if (s.startsWith("/")) return s;

  const id = extractDriveId(s) ?? s;
  if (LOCAL_COVERS[id]) return LOCAL_COVERS[id];
  if (id.startsWith("/")) return id;

  // If it's a full URL
  if (id.startsWith("http://") || id.startsWith("https://")) {
    if (id.includes("drive.google.com") || id.includes("docs.google.com") || id.includes("googleusercontent.com")) {
      const extracted = extractDriveId(id);
      if (extracted && !extracted.startsWith("http")) {
        return `https://lh3.googleusercontent.com/d/${extracted}=w${width}`;
      }
    }
    return id;
  }

  return `https://lh3.googleusercontent.com/d/${id}=w${width}`;
}

export function getOgImageUrl(idOrUrl?: string): string {
  if (!idOrUrl) return `${SITE_URL}/og-default.jpg`;
  const s = idOrUrl.trim();
  if (LOCAL_COVERS[s]) return `${SITE_URL}${LOCAL_COVERS[s]}`;
  if (s.startsWith("/")) return `${SITE_URL}${s}`;

  const clean = extractDriveId(s);
  if (!clean) return `${SITE_URL}/og-default.jpg`;
  if (LOCAL_COVERS[clean]) return `${SITE_URL}${LOCAL_COVERS[clean]}`;
  if (clean.startsWith("/")) return `${SITE_URL}${clean}`;

  // Non-drive external direct image URL
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    if (
      !clean.includes("drive.google.com") &&
      !clean.includes("docs.google.com") &&
      !clean.includes("googleusercontent.com")
    ) {
      return clean;
    }
  }

  const driveId = /^[A-Za-z0-9_-]{10,60}$/.test(clean) ? clean : (extractDriveId(clean) ?? clean);
  return `${SITE_URL}/api/og-image?id=${encodeURIComponent(driveId)}`;
}

export function parseDriveIds(text: string): string[] {
  return text
    .split(/\r?\n|,|;/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => extractDriveId(l) ?? l);
}