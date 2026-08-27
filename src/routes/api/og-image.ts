import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

const LOCAL_COVERS: Record<string, string> = {
  "1L0n1l52DNr9sXG0lpkJl3WD3jEMaff3X": "/assets/covers/shutline.jpg",
  shutline: "/assets/covers/shutline.jpg",
};

function extractDriveId(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;
  if (LOCAL_COVERS[s] || s.startsWith("/")) return s;

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

  if (/^[A-Za-z0-9_-]{10,60}$/.test(s)) {
    return s;
  }

  return s;
}

export const Route = createFileRoute("/api/og-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = url.origin && !url.origin.includes("localhost") ? url.origin : SITE_URL;
        const rawId = url.searchParams.get("id") || "";
        const clean = extractDriveId(rawId);

        const serveFallback = async () => {
          try {
            const fallbackRes = await fetch(`${origin}/og-default.jpg`);
            if (fallbackRes.ok && fallbackRes.body) {
              return new Response(fallbackRes.body, {
                status: 200,
                headers: {
                  "content-type": "image/jpeg",
                  "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
                  "access-control-allow-origin": "*",
                },
              });
            }
          } catch {
            // fallback if fetch fails
          }
          return Response.redirect(`${origin}/og-default.jpg`, 302);
        };

        if (!clean) {
          return serveFallback();
        }

        // Local mapped cover
        const localPath = LOCAL_COVERS[clean] || (clean.startsWith("/") ? clean : null);
        if (localPath) {
          try {
            const res = await fetch(`${origin}${localPath}`);
            if (res.ok && res.body) {
              const ct = res.headers.get("content-type") || "image/jpeg";
              return new Response(res.body, {
                status: 200,
                headers: {
                  "content-type": ct,
                  "cache-control": "public, max-age=31536000, immutable",
                  "access-control-allow-origin": "*",
                  "content-disposition": "inline",
                },
              });
            }
          } catch {
            // fallback
          }
          return Response.redirect(`${origin}${localPath}`, 302);
        }

        // Non-Drive external URL
        if (clean.startsWith("http://") || clean.startsWith("https://")) {
          if (
            !clean.includes("drive.google.com") &&
            !clean.includes("docs.google.com") &&
            !clean.includes("googleusercontent.com")
          ) {
            return Response.redirect(clean, 302);
          }
        }

        const driveId = /^[A-Za-z0-9_-]{10,60}$/.test(clean) ? clean : extractDriveId(clean);
        if (!driveId || driveId.startsWith("http")) {
          return serveFallback();
        }

        // Multi-tier upstream fetching for Google Drive images
        const upstreamCandidates = [
          `https://lh3.googleusercontent.com/d/${driveId}=w1200`,
          `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`,
          `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`,
          `https://docs.google.com/uc?export=download&id=${driveId}`,
        ];

        for (const candidate of upstreamCandidates) {
          try {
            const upstream = await fetch(candidate, {
              headers: {
                "user-agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
              },
            });

            if (!upstream.ok || !upstream.body) continue;

            const contentType = upstream.headers.get("content-type") || "";
            // Reject HTML error/login pages returned by Google
            if (contentType.includes("text/html") || contentType.includes("application/json")) {
              continue;
            }

            const inferredType = contentType.startsWith("image/") ? contentType : "image/jpeg";
            const headers: Record<string, string> = {
              "content-type": inferredType,
              "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
              "access-control-allow-origin": "*",
              "content-disposition": "inline",
              "x-content-type-options": "nosniff",
            };

            const len = upstream.headers.get("content-length");
            if (len && parseInt(len, 10) > 500) {
              headers["content-length"] = len;
            }

            return new Response(upstream.body, {
              status: 200,
              headers,
            });
          } catch {
            // Try next candidate
          }
        }

        // If all upstream candidates fail, serve fallback
        return serveFallback();
      },
    },
  },
});
