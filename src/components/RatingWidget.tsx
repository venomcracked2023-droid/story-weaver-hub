import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function RatingWidget({ comicId }: { comicId: string }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Array<{ user_id: string; score: number }>>([]);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("ratings")
      .select("user_id,score")
      .eq("comic_id", comicId);
    setRows((data ?? []) as typeof rows);
  }
  useEffect(() => {
    load();
  }, [comicId]);

  const myScore = user ? rows.find((r) => r.user_id === user.id)?.score ?? 0 : 0;
  const avg = rows.length ? rows.reduce((s, r) => s + r.score, 0) / rows.length : 0;

  async function setScore(score: number) {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đánh giá");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("ratings")
      .upsert({ comic_id: comicId, user_id: user.id, score }, { onConflict: "user_id,comic_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Đã đánh giá ${score} sao`);
    load();
  }

  return (
    <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-border bg-card/40 px-3 py-1.5 backdrop-blur">
      <div className="flex items-center" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Đánh giá truyện">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = (hover || myScore) >= n;
          return (
            <button
              key={n}
              type="button"
              disabled={saving}
              onMouseEnter={() => setHover(n)}
              onClick={() => setScore(n)}
              aria-label={`${n} sao`}
              aria-checked={myScore === n}
              role="radio"
              className="p-0.5 transition disabled:opacity-50"
            >
              <Star
                className={
                  "h-5 w-5 transition " +
                  (filled ? "fill-primary text-primary" : "text-muted-foreground")
                }
              />
            </button>
          );
        })}
      </div>
      <div className="text-xs text-muted-foreground tabular-nums">
        {rows.length > 0 ? (
          <>
            <span className="font-semibold text-foreground">{avg.toFixed(1)}</span> / 5 ·{" "}
            {rows.length} đánh giá
          </>
        ) : (
          "Chưa có đánh giá"
        )}
      </div>
    </div>
  );
}
