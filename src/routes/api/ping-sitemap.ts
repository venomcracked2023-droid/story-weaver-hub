import { createFileRoute } from "@tanstack/react-router";
import { pingIndexNow } from "@/lib/indexnow";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/api/ping-sitemap")({
  server: {
    handlers: {
      GET: async () => {
        const sitemapUrl = `${SITE_URL}/sitemap.xml`;
        const indexNowRes = await pingIndexNow([sitemapUrl, `${SITE_URL}/`, `${SITE_URL}/latest`]);

        return new Response(
          JSON.stringify({
            status: "ok",
            timestamp: new Date().toISOString(),
            sitemap: sitemapUrl,
            indexnow: indexNowRes,
          }),
          {
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          },
        );
      },
      POST: async ({ request }) => {
        let urls: string[] = [];
        try {
          const body = await request.json();
          if (Array.isArray(body?.urls)) {
            urls = body.urls;
          }
        } catch {
          // fallback to default
        }
        if (urls.length === 0) {
          urls = [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/`, `${SITE_URL}/latest`];
        }
        const indexNowRes = await pingIndexNow(urls);
        return new Response(
          JSON.stringify({
            status: "ok",
            timestamp: new Date().toISOString(),
            urlsPinged: urls.length,
            indexnow: indexNowRes,
          }),
          {
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          },
        );
      },
    },
  },
});
