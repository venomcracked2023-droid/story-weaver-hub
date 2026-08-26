import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/apply")({
  component: ApplyPage,
  head: () => {
    const title = "Ứng tuyển cộng tác viên — Lcucumber";
    const desc = "Gửi đơn ứng tuyển cộng tác viên Lcucumber để đăng truyện lên nền tảng: bút danh, lý do tham gia và link mẫu để duyệt.";
    const url = `${SITE_URL}/apply`;
    return {
      meta: [
      { title },
      {
        name: "description",
        content: desc,
      },
      { property: "og:title", content: title },
      {
        property: "og:description",
        content: desc,
      },
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

type Application = {
  id: string;
  status: string;
  pen_name: string;
  reason: string;
  sample_link: string | null;
  created_at: string;
};

function ApplyPage() {
  const { user, loading, isContributor, refresh } = useAuth();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [fetching, setFetching] = useState(true);
  const [penName, setPenName] = useState("");
  const [reason, setReason] = useState("");
  const [sample, setSample] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("contributor_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setApp(data as Application | null);
        setFetching(false);
      });
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("contributor_applications")
        .insert({
          user_id: user.id,
          pen_name: penName,
          reason,
          sample_link: sample || null,
        })
        .select("*")
        .single();
      if (error) throw error;
      setApp(data as Application);
      toast.success("Đã gửi đơn. Chờ admin duyệt.");
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Lỗi");
    } finally {
      setBusy(false);
    }
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">Đang tải…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Ứng tuyển cộng tác viên</h1>
        <p className="mt-2 text-muted-foreground">
          Trở thành cộng tác viên để đăng truyện lên Lcucumber. Admin sẽ duyệt đơn của bạn.
        </p>

        {isContributor && (
          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
            ✅ Bạn đã là cộng tác viên.{" "}
            <Link to="/admin" className="text-primary underline">Đến trang quản lý</Link>
          </div>
        )}

        {app && (
          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <div className="text-sm text-muted-foreground">Đơn gần nhất</div>
            <div className="mt-1 font-semibold">{app.pen_name}</div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
              Trạng thái:{" "}
              <span
                className={
                  app.status === "approved"
                    ? "text-primary"
                    : app.status === "rejected"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }
              >
                {app.status === "pending" ? "Chờ duyệt" : app.status === "approved" ? "Đã duyệt" : "Từ chối"}
              </span>
            </div>
          </div>
        )}

        {!isContributor && (!app || app.status === "rejected") && (
          <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5">
            <div>
              <label htmlFor="apply-pen-name" className="text-sm font-medium">Bút danh</label>
              <input
                id="apply-pen-name"
                required
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                className="input mt-1 w-full"
                placeholder="VD: Hắc Vũ"
              />
            </div>
            <div>
              <label htmlFor="apply-reason" className="text-sm font-medium">Lý do tham gia</label>
              <textarea
                id="apply-reason"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="input mt-1 w-full"
                placeholder="Giới thiệu bản thân & lý do bạn muốn đăng truyện…"
              />
            </div>
            <div>
              <label htmlFor="apply-sample" className="text-sm font-medium">Link mẫu (tuỳ chọn)</label>
              <input
                id="apply-sample"
                value={sample}
                onChange={(e) => setSample(e.target.value)}
                className="input mt-1 w-full"
                placeholder="Link Drive/Behance/Pixiv…"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Gửi đơn
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
