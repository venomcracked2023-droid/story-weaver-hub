import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { inferChangeFreq } from "@/lib/sitemap-freq";

export const Route = createFileRoute("/sitemap-comic/$id.xml")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const origin = new URL(request.url).origin;
        const p = params as Record<string, string>;
        const raw = p.id ?? p["id.xml"] ?? "";
        const comicId = raw.replace(/\.xml$/, "");

        const { data: comic } = await supabase
          .from("comics")
          .select("id,updated_at")
          .eq("id", comicId)
          .maybeSingle();

        if (!comic) {
          return new Response("Not found", { status: 404 });
        }

        const { data: chapters } = await supabase
          .from("chapters")
          .select("id,created_at")
          .eq("comic_id", comicId)
          .order("created_at", { ascending: false })
          .limit(5000);

        const iso = (v: string | number | Date) => new Date(v).toISOString();
        const ts = (chapters ?? []).map((c) => new Date(c.created_at).getTime());
        const freq = inferChangeFreq(ts);
        const latestChapter = (chapters ?? [])[0]?.created_at as string | undefined;
        const comicLastmod = latestChapter
          ? (new Date(latestChapter) > new Date(comic.updated_at as string)
              ? iso(latestChapter)
              : iso(comic.updated_at as string))
          : iso(comic.updated_at as string);

        const urls: string[] = [
          `<url><loc>${origin}/comic/${comicId}</loc><lastmod>${comicLastmod}</lastmod><changefreq>${freq}</changefreq><priority>0.8</priority></url>`,
        ];
        for (const ch of chapters ?? []) {
          urls.push(
            `<url><loc>${origin}/read/${comicId}/${ch.id}</loc><lastmod>${iso(ch.created_at)}</lastmod><changefreq>${freq}</changefreq><priority>0.7</priority></url>`,
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