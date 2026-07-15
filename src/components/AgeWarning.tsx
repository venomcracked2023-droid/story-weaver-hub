import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { MIN_AGE } from "@/lib/content-rating";

// Banner + gate xác nhận tuổi cho các truyện nhạy cảm (BL/GL/18+/…).
// Lưu xác nhận trong sessionStorage để không phiền độc giả suốt phiên.
const STORAGE_KEY = "lcucumber:age-confirmed";

export function AgeWarning({ comicTitle }: { comicTitle: string }) {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setConfirmed(sessionStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setConfirmed(true);
    }
  }, []);

  const confirm = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setConfirmed(true);
  };

  if (confirmed === null) return null;

  if (!confirmed) {
    return (
      <div
        role="alertdialog"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 p-4 backdrop-blur"
      >
        <div className="w-full max-w-md rounded-2xl border border-primary/40 bg-card p-6 shadow-glow">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Xác nhận độ tuổi</span>
          </div>
          <h2 id="age-gate-title" className="mt-2 text-xl font-bold">
            Nội dung dành cho {MIN_AGE}+
          </h2>
          <p id="age-gate-desc" className="mt-2 text-sm text-muted-foreground">
            Truyện <strong className="text-foreground">"{comicTitle}"</strong> có thể chứa
            tình huống nhạy cảm, tình cảm đồng tính, bạo lực hoặc yếu tố người lớn.
            Vui lòng xác nhận bạn đã đủ {MIN_AGE} tuổi để tiếp tục đọc.
          </p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background/60 px-4 py-2 text-sm font-medium transition hover:bg-secondary"
            >
              Quay lại
            </Link>
            <button
              type="button"
              onClick={confirm}
              className="inline-flex items-center justify-center rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02] active:scale-95"
            >
              Tôi đã đủ {MIN_AGE} tuổi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside
      role="note"
      aria-label={`Cảnh báo nội dung ${MIN_AGE}+`}
      className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
      <p>
        <strong className="font-semibold">Cảnh báo {MIN_AGE}+.</strong> Nội dung có
        thể chứa yếu tố nhạy cảm, tình cảm đồng tính hoặc dành cho người trưởng thành.
        Vui lòng cân nhắc trước khi đọc.
      </p>
    </aside>
  );
}