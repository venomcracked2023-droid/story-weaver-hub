import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { inferChangeFreq } from "@/lib/sitemap-freq";
import { slugifyGenre } from "@/lib/slug";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const { data: comics } = await supabase
          .from("comics")
          .select("id,slug,updated_at,genres")
          .order("updated_at", { ascending: false })
          .limit(1000);
        const { data: chapters } = await supabase
          .from("chapters")
          .select("id,comic_id,created_at,order_index")
          .order("created_at", { ascending: false })
          .limit(5000);

        const iso = (v: string | number | Date) => new Date(v).toISOString();
        const maxIso = (a?: string, b?: string) =>
          !a ? b : !b ? a : new Date(a) > new Date(b) ? a : b;

        const slugById = new Map<string, string>();
        for (const c of comics ?? []) slugById.set(c.id, (c as { slug: string }).slug);

        const latestChapterByComic = new Map<string, string>();
        const chapterTsByComic = new Map<string, number[]>();
        let globalLatest: string | undefined;
        for (const ch of chapters ?? []) {
          const ts = iso(ch.created_at);
          latestChapterByComic.set(
            ch.comic_id,
            maxIso(latestChapterByComic.get(ch.comic_id), ts) as string,
          );
          (chapterTsByComic.get(ch.comic_id) ?? chapterTsByComic.set(ch.comic_id, []).get(ch.comic_id)!)
            .push(new Date(ch.created_at).getTime());
          globalLatest = maxIso(globalLatest, ts);
        }
        for (const c of comics ?? []) {
          globalLatest = maxIso(globalLatest, iso(c.updated_at));
        }
        const siteLastmod = globalLatest ?? iso(Date.now());
        const freqByComic = new Map<string, string>();
        for (const [id, ts] of chapterTsByComic) freqByComic.set(id, inferChangeFreq(ts));

        const urls: string[] = [
          `<url><loc>${origin}/</loc><lastmod>${siteLastmod}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
          `<url><loc>${origin}/featured</loc><lastmod>${siteLastmod}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`,
          `<url><loc>${origin}/latest</loc><lastmod>${siteLastmod}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`,
        ];
        // Trang duyệt theo thể loại — gom slug duy nhất từ tất cả truyện.
        const genreLastmod = new Map<string, string>();
        for (const c of comics ?? []) {
          for (const g of ((c as { genres?: string[] }).genres ?? [])) {
            const slug = slugifyGenre(g);
            if (!slug) continue;
            const prev = genreLastmod.get(slug);
            const ts = iso(c.updated_at);
            if (!prev || new Date(ts) > new Date(prev)) genreLastmod.set(slug, ts);
          }
        }
        for (const [slug, lastmod] of genreLastmod) {
          urls.push(
            `<url><loc>${origin}/the-loai/${slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
          );
        }
        for (const c of comics ?? []) {
          const lastmod = maxIso(iso(c.updated_at), latestChapterByComic.get(c.id))!;
          const freq = freqByComic.get(c.id) ?? "monthly";
          const cslug = (c as { slug: string }).slug;
          if (!cslug) continue;
          urls.push(
            `<url><loc>${origin}/truyen/${cslug}</loc><lastmod>${lastmod}</lastmod><changefreq>${freq}</changefreq><priority>0.8</priority></url>`,
          );
        }
        for (const ch of chapters ?? []) {
          const freq = freqByComic.get(ch.comic_id) ?? "monthly";
          const cslug = slugById.get(ch.comic_id);
          if (!cslug) continue;
          const num = ((ch as { order_index: number }).order_index ?? 0) + 1;
          urls.push(
            `<url><loc>${origin}/truyen/${cslug}/chuong-${num}</loc><lastmod>${iso(ch.created_at)}</lastmod><changefreq>${freq}</changefreq><priority>0.6</priority></url>`,
          );
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
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