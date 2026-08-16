import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { inferChangeFreq } from "@/lib/sitemap-freq";
import { slugifyGenre } from "@/lib/slug";
import { SITE_URL } from "@/lib/seo";
import { xmlEscape } from "@/lib/xml";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const origin = SITE_URL;
        const { data: comics } = await supabase
          .from("comics")
          .select("id,slug,updated_at,genres")
          .order("updated_at", { ascending: false })
          .limit(2000);
        // Dùng 1 sitemap duy nhất: trang tĩnh + thể loại + truyện + chương.
        // Với vài chục/trăm truyện thì 1 file là đủ và đơn giản nhất.
        const { data: chapters } = await supabase
          .from("chapters")
          .select("comic_id,slug,created_at")
          .order("created_at", { ascending: false })
          .limit(5000);

        const iso = (v: string | number | Date) => new Date(v).toISOString();
        const maxIso = (a?: string, b?: string) =>
          !a ? b : !b ? a : new Date(a) > new Date(b) ? a : b;

        // lastmod chương = thời điểm tạo chương (bảng chapters chưa có updated_at).
        // lastmod truyện = max(comic.updated_at, chương mới nhất thuộc truyện đó).
        // changefreq theo nhịp đăng trung bình của từng truyện.
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
        const freqByComic = new Map<string, "hourly" | "daily" | "weekly" | "monthly" | "yearly">();
        for (const [id, ts] of chapterTsByComic) {
          const freq = inferChangeFreq(ts) as any;
          freqByComic.set(id, freq);
        }

        const urls: string[] = [
          `<url><loc>${origin}/</loc><lastmod>${siteLastmod}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
          `<url><loc>${origin}/featured</loc><lastmod>${siteLastmod}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`,
          `<url><loc>${origin}/latest</loc><lastmod>${siteLastmod}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`,
          `<url><loc>${origin}/the-loai</loc><lastmod>${siteLastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
          `<url><loc>${origin}/gioi-thieu</loc><changefreq>yearly</changefreq><priority>0.4</priority></url>`,
          `<url><loc>${origin}/lien-he</loc><changefreq>yearly</changefreq><priority>0.4</priority></url>`,
          `<url><loc>${origin}/dieu-khoan</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>`,
          `<url><loc>${origin}/dmca</loc><changefreq>yearly</changefreq><priority>0.4</priority></url>`,
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
            `<url><loc>${origin}/genre/${xmlEscape(slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
          );
        }
        for (const c of comics ?? []) {
          if (!(c as any).slug) continue;
          const lastmod = maxIso(iso(c.updated_at), latestChapterByComic.get(c.id))!;
          const freq = freqByComic.get(c.id) ?? "monthly";
          urls.push(
            `<url><loc>${origin}/truyen/${xmlEscape((c as any).slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>${freq}</changefreq><priority>0.8</priority></url>`,
          );
        }

        // URL từng chương — gộp luôn vào sitemap chính.
        const slugByComicId = new Map<string, string>();
        for (const c of comics ?? []) {
          if ((c as any).slug) slugByComicId.set(c.id as string, (c as any).slug as string);
        }
        for (const ch of chapters ?? []) {
          const comicSlug = slugByComicId.get(ch.comic_id as string);
          if (!comicSlug || !(ch as any).slug) continue;
          const freq = freqByComic.get(ch.comic_id as string) ?? "monthly";
          urls.push(
            `<url><loc>${origin}/truyen/${xmlEscape(comicSlug)}/${xmlEscape((ch as any).slug)}</loc><lastmod>${iso(ch.created_at)}</lastmod><changefreq>${freq}</changefreq><priority>0.7</priority></url>`,
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