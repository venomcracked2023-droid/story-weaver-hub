import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { slugifyGenre } from "@/lib/slug";

export const Route = createFileRoute("/sitemap-genre/$slug.xml")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const origin = new URL(request.url).origin;
        // TanStack đặt tên param là "slug.xml" do dấu chấm liền sau $slug.
        const raw = (params as Record<string, string>)["slug.xml"] ?? "";
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

        const urls: string[] = [];
        for (const c of matched) {
          urls.push(
            `<url><loc>${origin}/comic/${c.id}</loc><lastmod>${new Date(c.updated_at as string).toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`,
          );
        }
        for (const ch of chapters) {
          urls.push(
            `<url><loc>${origin}/read/${ch.comic_id}/${ch.id}</loc><lastmod>${new Date(ch.created_at).toISOString()}</lastmod><priority>0.6</priority></url>`,
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
