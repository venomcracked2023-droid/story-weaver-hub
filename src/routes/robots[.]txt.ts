import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const origin = SITE_URL;
        // Host directive theo chuẩn không có scheme.
        const host = origin.replace(/^https?:\/\//, "");
        const body = [
          "# robots.txt — Lcucumber",
          "# Content-Signal for AI Search & Google AI Overviews",
          "Content-Signal: search=yes,ai-train=yes,use=immediate",
          "",
          "User-agent: Googlebot",
          "Content-Signal: search=yes,ai-train=yes,use=immediate",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /admin-applications",
          "Disallow: /apply",
          "Disallow: /login",
          "Disallow: /api/",
          "",
          "User-agent: Googlebot-Image",
          "Allow: /",
          "",
          "User-agent: Bingbot",
          "Content-Signal: search=yes,ai-train=yes,use=immediate",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /admin-applications",
          "Disallow: /apply",
          "Disallow: /login",
          "Disallow: /api/",
          "",
          "User-agent: Google-Extended",
          "Content-Signal: search=yes,ai-train=yes,use=immediate",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /admin-applications",
          "Disallow: /apply",
          "Disallow: /login",
          "Disallow: /api/",
          "",
          "User-agent: PerplexityBot",
          "Content-Signal: search=yes,ai-train=yes,use=immediate",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /admin-applications",
          "Disallow: /apply",
          "Disallow: /login",
          "Disallow: /api/",
          "",
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /admin-applications",
          "Disallow: /apply",
          "Disallow: /login",
          "Disallow: /api/",
          "",
          `Host: ${host}`,
          `Sitemap: ${origin}/sitemap.xml`,
          `Sitemap: ${origin}/sitemap-index.xml`,
          "",
        ].join("\n");
        return new Response(body, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});