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
        const target = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
        const range = request.headers.get("range");
        const upstream = await fetch(target, {
          headers: {
            "user-agent": "Mozilla/5.0",
            ...(range ? { range } : {}),
          },
        });
        if (!upstream.ok || !upstream.body) {
          return new Response(`upstream ${upstream.status}`, { status: 502 });
        }
        const ct = upstream.headers.get("content-type") || "application/octet-stream";
        const headers: Record<string, string> = {
          "content-type": ct,
          // Drive IDs are content-addressed → safe to cache aggressively
          "cache-control": "public, max-age=31536000, immutable",
          "access-control-allow-origin": "*",
          "access-control-expose-headers": "content-length, content-range, accept-ranges",
          "accept-ranges": "bytes",
        };
        const len = upstream.headers.get("content-length");
        const cr = upstream.headers.get("content-range");
        if (len) headers["content-length"] = len;
        if (cr) headers["content-range"] = cr;
        return new Response(upstream.body, {
          status: upstream.status,
          headers,
        });
      },
    },
  },
});