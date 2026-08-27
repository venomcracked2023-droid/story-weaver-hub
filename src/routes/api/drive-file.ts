import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/drive-file")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id || !/^[A-Za-z0-9_-]{10,}$/.test(id)) {
          return new Response("invalid id", { status: 400 });
        }

        const range = request.headers.get("range");
        const upstreamCandidates = [
          `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
          `https://lh3.googleusercontent.com/d/${id}=w1600`,
          `https://drive.google.com/thumbnail?id=${id}&sz=w1600`,
          `https://docs.google.com/uc?export=download&id=${id}`,
        ];

        for (const target of upstreamCandidates) {
          try {
            const upstream = await fetch(target, {
              headers: {
                "user-agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                ...(range ? { range } : {}),
              },
            });

            if (!upstream.ok || !upstream.body) continue;

            const ct = upstream.headers.get("content-type") || "";
            // Reject HTML error pages
            if (ct.includes("text/html") && !target.includes("export=download")) {
              continue;
            }

            const inferredCt = ct || "application/octet-stream";
            const headers: Record<string, string> = {
              "content-type": inferredCt,
              "cache-control": "public, max-age=31536000, immutable",
              "access-control-allow-origin": "*",
              "access-control-expose-headers": "content-length, content-range, accept-ranges",
              "accept-ranges": "bytes",
              "content-disposition": "inline",
            };

            const len = upstream.headers.get("content-length");
            const cr = upstream.headers.get("content-range");
            if (len) headers["content-length"] = len;
            if (cr) headers["content-range"] = cr;

            return new Response(upstream.body, {
              status: upstream.status,
              headers,
            });
          } catch {
            // Try next candidate
          }
        }

        return new Response("upstream unavailable", { status: 502 });
      },
    },
  },
});