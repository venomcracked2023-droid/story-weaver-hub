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
        const upstream = await fetch(target, {
          headers: { "user-agent": "Mozilla/5.0" },
        });
        if (!upstream.ok || !upstream.body) {
          return new Response(`upstream ${upstream.status}`, { status: 502 });
        }
        const ct = upstream.headers.get("content-type") || "application/octet-stream";
        return new Response(upstream.body, {
          headers: {
            "content-type": ct,
            "cache-control": "public, max-age=3600",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});