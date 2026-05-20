import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { inferChangeFreq } from "@/lib/sitemap-freq";
import { slugifyGenre } from "@/lib/slug";
import { driveImageUrl } from "@/lib/drive";

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const { data: comics } = await supabase
          .from("comics")
          .select("id,title,updated_at,genres,cover_id")
          .order("updated_at", { ascending: false })
          .limit(1000);
        const { data: chapters } = await supabase
          .from("chapters")
          .select("id,comic_id,title,pages,created_at")
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
            `<url><loc>${origin}/genre/${slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
          );
        }
        const coverByComic = new Map<string, { url: string; title: string }>();
        for (const c of comics ?? []) {
          const lastmod = maxIso(iso(c.updated_at), latestChapterByComic.get(c.id))!;
          const freq = freqByComic.get(c.id) ?? "monthly";
          const coverId = (c as { cover_id?: string }).cover_id;
          const title = (c as { title?: string }).title ?? "";
          let imageTag = "";
          if (coverId) {
            const url = driveImageUrl(coverId, 1200);
            coverByComic.set(c.id, { url, title });
            imageTag = `<image:image><image:loc>${xmlEscape(url)}</image:loc><image:title>${xmlEscape(title)}</image:title></image:image>`;
          }
          urls.push(
            `<url><loc>${origin}/comic/${c.id}</loc><lastmod>${lastmod}</lastmod><changefreq>${freq}</changefreq><priority>0.8</priority>${imageTag}</url>`,
          );
        }
        for (const ch of chapters ?? []) {
          const freq = freqByComic.get(ch.comic_id) ?? "monthly";
          const pages = ((ch as { pages?: string[] }).pages ?? []).slice(0, 20);
          const cover = coverByComic.get(ch.comic_id);
          const chTitle = (ch as { title?: string }).title ?? "";
          const imgs: string[] = [];
          if (cover) {
            imgs.push(
              `<image:image><image:loc>${xmlEscape(cover.url)}</image:loc><image:title>${xmlEscape(cover.title)}</image:title></image:image>`,
            );
          }
          for (const p of pages) {
            const url = driveImageUrl(p, 1600);
            imgs.push(
              `<image:image><image:loc>${xmlEscape(url)}</image:loc><image:title>${xmlEscape(chTitle)}</image:title></image:image>`,
            );
          }
          urls.push(
            `<url><loc>${origin}/read/${ch.comic_id}/${ch.id}</loc><lastmod>${iso(ch.created_at)}</lastmod><changefreq>${freq}</changefreq><priority>0.6</priority>${imgs.join("")}</url>`,
          );
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>`;
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