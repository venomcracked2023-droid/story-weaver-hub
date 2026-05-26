import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { slugifyGenre } from "@/lib/slug";
import { inferChangeFreq } from "@/lib/sitemap-freq";

export const Route = createFileRoute("/sitemap-genre/$slug.xml")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const origin = new URL(request.url).origin;
        // `[.]xml` là literal đã escape, nên tên param thực sự là "slug".
        const p = params as Record<string, string>;
        const raw = p.slug ?? p["slug.xml"] ?? "";
        const target = raw.replace(/\.xml$/, "");

        const { data: comics } = await supabase
          .from("comics")
          .select("id,updated_at,genres")
          .order("updated_at", { ascending: false })
          .limit(2000);

        const matched = (comics ?? []).filter((c) =>
          ((c.genres ?? []) as string[]).some((g) => slugifyGenre(g) === target),
        );
        const ids = matched.map((c) => c.id as string);

        let chapters: Array<{ id: string; comic_id: string; created_at: string }> = [];
        if (ids.length) {
          const { data } = await supabase
            .from("chapters")
            .select("id,comic_id,created_at")
            .in("comic_id", ids)
            .order("created_at", { ascending: false })
            .limit(5000);
          chapters = (data ?? []) as typeof chapters;
        }

        const iso = (v: string | number | Date) => new Date(v).toISOString();
        const maxIso = (a?: string, b?: string) =>
          !a ? b : !b ? a : new Date(a) > new Date(b) ? a : b;

        // lastmod truyện = max(comic.updated_at, chương mới nhất thuộc truyện đó).
        // changefreq suy theo nhịp đăng trung bình của từng truyện.
        const latestChapterByComic = new Map<string, string>();
        const chapterTsByComic = new Map<string, number[]>();
        for (const ch of chapters) {
          latestChapterByComic.set(
            ch.comic_id,
            maxIso(latestChapterByComic.get(ch.comic_id), iso(ch.created_at)) as string,
          );
          (chapterTsByComic.get(ch.comic_id) ?? chapterTsByComic.set(ch.comic_id, []).get(ch.comic_id)!)
            .push(new Date(ch.created_at).getTime());
        }
        const freqByComic = new Map<string, string>();
        for (const [id, ts] of chapterTsByComic) freqByComic.set(id, inferChangeFreq(ts));

        const urls: string[] = [];
        for (const c of matched) {
          const lastmod = maxIso(iso(c.updated_at as string), latestChapterByComic.get(c.id as string))!;
          const freq = freqByComic.get(c.id as string) ?? "monthly";
          urls.push(
            `<url><loc>${origin}/comic/${c.id}</loc><lastmod>${lastmod}</lastmod><changefreq>${freq}</changefreq><priority>0.8</priority></url>`,
          );
        }
        for (const ch of chapters) {
          const freq = freqByComic.get(ch.comic_id) ?? "monthly";
          urls.push(
            `<url><loc>${origin}/read/${ch.comic_id}/${ch.id}</loc><lastmod>${iso(ch.created_at)}</lastmod><changefreq>${freq}</changefreq><priority>0.6</priority></url>`,
          );
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, {
          status: matched.length ? 200 : 404,
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=900",
          },
        });
      },
    },
  },
});
