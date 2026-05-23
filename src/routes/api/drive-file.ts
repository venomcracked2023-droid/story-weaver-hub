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
        // Forward Range header so pdf.js can do partial requests
        // (cực kỳ quan trọng để PDF lớn tải nhanh trên mobile).
        const fwdHeaders: Record<string, string> = { "user-agent": "Mozilla/5.0" };
        const range = request.headers.get("range");
        if (range) fwdHeaders["range"] = range;
        const upstream = await fetch(target, { headers: fwdHeaders });
        if (!upstream.body || (upstream.status >= 400)) {
          return new Response(`upstream ${upstream.status}`, { status: 502 });
        }
        const ct = upstream.headers.get("content-type") || "application/octet-stream";
        const headers: Record<string, string> = {
          "content-type": ct,
          "cache-control": "public, max-age=86400, immutable",
          "access-control-allow-origin": "*",
          "accept-ranges": "bytes",
        };
        const cl = upstream.headers.get("content-length");
        if (cl) headers["content-length"] = cl;
        const cr = upstream.headers.get("content-range");
        if (cr) headers["content-range"] = cr;
        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});