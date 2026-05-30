import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { slugifyGenre } from "@/lib/slug";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/sitemap-index.xml")({
  server: {
    handlers: {
      GET: async () => {
        const origin = SITE_URL;
        const { data: comics } = await supabase
          .from("comics")
          .select("id,slug,genres,updated_at")
          .order("updated_at", { ascending: false })
          .limit(2000);

        // Gom thể loại + lastmod mới nhất theo từng thể loại.
        const lastmodByGenre = new Map<string, string>();
        for (const c of comics ?? []) {
          const ts = c.updated_at as string;
          for (const g of (c.genres ?? []) as string[]) {
            const slug = slugifyGenre(g);
            if (!slug) continue;
            const prev = lastmodByGenre.get(slug);
            if (!prev || new Date(ts) > new Date(prev)) {
              lastmodByGenre.set(slug, ts);
            }
          }
        }

        const sitemaps: string[] = [
          `<sitemap><loc>${origin}/sitemap.xml</loc></sitemap>`,
        ];
        for (const [slug, lastmod] of lastmodByGenre) {
          sitemaps.push(
            `<sitemap><loc>${origin}/sitemap-genre/${slug}.xml</loc><lastmod>${new Date(lastmod).toISOString()}</lastmod></sitemap>`,
          );
        }
        // Sitemap riêng cho từng truyện — chứa toàn bộ chương để Google crawl nhanh.
        for (const c of comics ?? []) {
          if (!c.slug) continue;
          sitemaps.push(
            `<sitemap><loc>${origin}/sitemap-comic/${c.slug}.xml</loc><lastmod>${new Date(c.updated_at as string).toISOString()}</lastmod></sitemap>`,
          );
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps.join("\n")}\n</sitemapindex>`;
        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=900",
          },
        });
      },
    },
  },
});
