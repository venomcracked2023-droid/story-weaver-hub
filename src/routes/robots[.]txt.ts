import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const origin = SITE_URL;
        const body = [
          "# robots.txt — Lcucumber",
          "",
          "User-agent: Googlebot",
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
          "Disallow: /*?*",
          "",
          "# Chặn các AI crawler tham lam (tiết kiệm băng thông)",
          "User-agent: GPTBot",
          "Disallow: /",
          "",
          "User-agent: CCBot",
          "Disallow: /",
          "",
          "User-agent: ClaudeBot",
          "Disallow: /",
          "",
          "User-agent: anthropic-ai",
          "Disallow: /",
          "",
          "User-agent: Google-Extended",
          "Disallow: /",
          "",
          "User-agent: PerplexityBot",
          "Disallow: /",
          "",
          `Host: ${origin}`,
          `Sitemap: ${origin}/sitemap.xml`,
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