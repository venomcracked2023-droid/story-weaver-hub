import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const { data: comics } = await supabase
          .from("comics")
          .select("id,updated_at")
          .order("updated_at", { ascending: false })
          .limit(1000);
        const { data: chapters } = await supabase
          .from("chapters")
          .select("id,comic_id,created_at")
          .order("created_at", { ascending: false })
          .limit(5000);

        const urls: string[] = [
          `<url><loc>${origin}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
          `<url><loc>${origin}/featured</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
        ];
        for (const c of comics ?? []) {
          urls.push(
            `<url><loc>${origin}/comic/${c.id}</loc><lastmod>${new Date(c.updated_at).toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`
          );
        }
        for (const ch of chapters ?? []) {
          urls.push(
            `<url><loc>${origin}/read/${ch.comic_id}/${ch.id}</loc><lastmod>${new Date(ch.created_at).toISOString()}</lastmod><priority>0.6</priority></url>`
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