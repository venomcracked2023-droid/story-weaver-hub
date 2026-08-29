import { createFileRoute, redirect, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Reserved top-level paths that must not be treated as story slugs.
const RESERVED = new Set([
  "admin", "admin-applications", "apply", "dieu-khoan", "dmca",
  "featured", "gioi-thieu", "latest", "lien-he", "login", "privacy",
  "robots.txt", "sitemap.xml", "the-loai", "genre", "truyen", "api",
]);

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const slug = params.slug;
    if (!slug || RESERVED.has(slug)) throw notFound();
    const { data } = await supabase
      .from("comics")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (!data?.slug) throw notFound();
    throw redirect({
      to: "/truyen/$slug",
      params: { slug: data.slug },
      statusCode: 301,
    });
  },
  component: () => null,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-2">404 — Không tìm thấy</h1>
      <p className="text-muted-foreground">
        Trang bạn tìm không tồn tại. Vui lòng về trang chủ.
      </p>
    </div>
  ),
  errorComponent: () => (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-2">Có lỗi xảy ra</h1>
    </div>
  ),
});
