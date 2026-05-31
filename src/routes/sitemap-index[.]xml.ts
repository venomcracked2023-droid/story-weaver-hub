import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { slugifyGenre } from "@/lib/slug";
import { SITE_URL } from "@/lib/seo";
import { xmlEscape } from "@/lib/xml";

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

        // Lấy thời điểm chương mới nhất cho mỗi truyện để tính lastmod chính xác
        // cho sitemap-comic — giúp Google biết chính xác truyện nào vừa có chương mới.
        const comicIds = (comics ?? []).map((c) => c.id as string);
        const latestChapterByComic = new Map<string, string>();
        if (comicIds.length) {
          const { data: chapters } = await supabase
            .from("chapters")
            .select("comic_id,created_at")
            .in("comic_id", comicIds)
            .order("created_at", { ascending: false })
            .limit(5000);
          for (const ch of chapters ?? []) {
            const prev = latestChapterByComic.get(ch.comic_id as string);
            const cur = ch.created_at as string;
            if (!prev || new Date(cur) > new Date(prev)) {
              latestChapterByComic.set(ch.comic_id as string, cur);
            }
          }
        }

        // Gom thể loại + lastmod mới nhất theo từng thể loại.
        const lastmodByGenre = new Map<string, string>();
        const maxIso = (a?: string, b?: string) =>
          !a ? b : !b ? a : new Date(a) > new Date(b) ? a : b;
        for (const c of comics ?? []) {
          const ts = maxIso(c.updated_at as string, latestChapterByComic.get(c.id as string)) as string;
          for (const g of (c.genres ?? []) as string[]) {
            const slug = slugifyGenre(g);
            if (!slug) continue;
            const prev = lastmodByGenre.get(slug);
            if (!prev || new Date(ts) > new Date(prev)) {
              lastmodByGenre.set(slug, ts);
            }
          }
        }

        const nowIso = new Date().toISOString();
        const sitemaps: string[] = [
          `<sitemap><loc>${origin}/sitemap.xml</loc><lastmod>${nowIso}</lastmod></sitemap>`,
        ];
        for (const [slug, lastmod] of lastmodByGenre) {
          sitemaps.push(
            `<sitemap><loc>${origin}/sitemap-genre/${xmlEscape(slug)}.xml</loc><lastmod>${new Date(lastmod).toISOString()}</lastmod></sitemap>`,
          );
        }
        // Sitemap riêng cho từng truyện — chứa toàn bộ chương để Google crawl nhanh.
        for (const c of comics ?? []) {
          if (!c.slug) continue;
          const lastmod = maxIso(c.updated_at as string, latestChapterByComic.get(c.id as string)) as string;
          sitemaps.push(
            `<sitemap><loc>${origin}/sitemap-comic/${xmlEscape(c.slug)}.xml</loc><lastmod>${new Date(lastmod).toISOString()}</lastmod></sitemap>`,
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
