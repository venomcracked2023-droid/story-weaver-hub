import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/admin-applications")({
  component: Page,
  head: () => {
    const title = "Duyệt cộng tác viên — Lcucumber";
    const desc = "Trang admin Lcucumber để xem, duyệt hoặc từ chối đơn ứng tuyển cộng tác viên đăng truyện trên nền tảng.";
    const url = `${SITE_URL}/admin-applications`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "noindex,nofollow" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "vi", href: url },
        { rel: "alternate", hrefLang: "x-default", href: url },
      ],
    };
  },
});

type App = {
  id: string;
  user_id: string;
  pen_name: string;
  reason: string;
  sample_link: string | null;
  status: string;
  created_at: string;
};

function Page() {
  const { isAdmin, loading } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string | null; email: string | null }>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("contributor_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setApps((data ?? []) as App[]);
    const ids = Array.from(new Set((data ?? []).map((a: any) => a.user_id)));
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id, display_name, email").in("id", ids);
      const map: Record<string, any> = {};
      for (const row of p ?? []) map[row.id] = { display_name: row.display_name, email: row.email };
      setProfiles(map);
    }
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  async function review(id: string, status: "approved" | "rejected") {
    setBusy(true);
    const { error } = await supabase
      .from("contributor_applications")
      .update({ status })
      .eq("id", id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "Đã duyệt" : "Đã từ chối");
    load();
  }

  if (loading) {
    return <div className="min-h-screen"><SiteHeader /><main className="p-10 text-center text-muted-foreground">Đang tải…</main></div>;
  }
  if (!isAdmin) {
    return <div className="min-h-screen"><SiteHeader /><main className="p-10 text-center">Chỉ admin truy cập được trang này.</main></div>;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Đơn ứng tuyển cộng tác viên</h1>
        <div className="mt-6 space-y-3">
          {apps.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Chưa có đơn nào.</div>
          )}
          {apps.map((a) => {
            const p = profiles[a.user_id];
            return (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold">{a.pen_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p?.display_name ?? "—"} · {p?.email ?? a.user_id.slice(0, 8)}
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{a.reason}</p>
                    {a.sample_link && (
                      <a href={a.sample_link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary hover:underline">
                        {a.sample_link}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full border border-border px-2.5 py-0.5 text-xs ${a.status === "approved" ? "text-primary" : a.status === "rejected" ? "text-destructive" : ""}`}>
                      {a.status === "pending" ? "Chờ duyệt" : a.status === "approved" ? "Đã duyệt" : "Từ chối"}
                    </span>
                    {a.status === "pending" && (
                      <div className="flex gap-2">
                        <button disabled={busy} onClick={() => review(a.id, "approved")} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90 disabled:opacity-50">
                          <Check className="h-3.5 w-3.5" /> Duyệt
                        </button>
                        <button disabled={busy} onClick={() => review(a.id, "rejected")} className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50">
                          <X className="h-3.5 w-3.5" /> Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
