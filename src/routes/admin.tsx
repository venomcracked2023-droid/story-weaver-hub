import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Comic,
  Chapter,
  deleteComic,
  uid,
  upsertComic,
  useComics,
  setFeatured,
} from "@/lib/comics-store";
import { extractDriveId, parseDriveIds } from "@/lib/drive";
import { ChevronDown, ChevronUp, Plus, Save, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Quản lý truyện — Lcucumber" }],
  }),
});

function emptyComic(): Comic {
  return {
    id: uid(),
    title: "",
    author: "",
    description: "",
    coverId: "",
    genres: [],
    chapters: [],
    createdAt: Date.now(),
    featured: false,
  };
}

function AdminPage() {
  const comics = useComics();
  const [editing, setEditing] = useState<Comic | null>(null);
  const { user, isContributor, loading } = useAuth();

  // Gom tác giả & thể loại đã từng dùng để gợi ý nhanh trong editor.
  const knownAuthors = Array.from(
    new Set(comics.map((c) => c.author?.trim()).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b));
  const knownGenres = Array.from(
    new Set(comics.flatMap((c) => c.genres).map((g) => g.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
          Đang tải…
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Bạn cần đăng nhập</h1>
          <p className="mt-2 text-muted-foreground">Đăng nhập để quản lý truyện.</p>
        </main>
      </div>
    );
  }

  if (!isContributor) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Chưa có quyền cộng tác viên</h1>
          <p className="mt-2 text-muted-foreground">Vui lòng nộp đơn ứng tuyển và chờ admin duyệt.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý truyện</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dữ liệu lưu trên Lovable Cloud. Ảnh nhúng trực tiếp từ Google Drive.
            </p>
          </div>
          <button
            onClick={() => setEditing(emptyComic())}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Truyện mới
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card/40 p-5">
          <h2 className="font-semibold">Hướng dẫn nhanh</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Upload ảnh chương lên Google Drive.</li>
            <li>
              Click chuột phải → <em>Share</em> → đổi thành <strong>"Anyone with the link"</strong>.
            </li>
            <li>
              Sao chép link hoặc <strong>File ID</strong> (đoạn dài trong URL <code>/file/d/…/view</code>) và dán vào ô bên dưới — mỗi dòng một file.
            </li>
            <li>Lưu — site sẽ tự nhúng ảnh.</li>
          </ol>
        </div>

        <div className="mt-8 grid gap-3">
          {comics.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div className="min-w-0">
                <Link
                  to="/comic/$comicId"
                  params={{ comicId: c.id }}
                  className="truncate font-semibold hover:text-primary"
                >
                  {c.title || "(chưa có tên)"}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {c.chapters.length} chương · {c.author || "Ẩn danh"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFeatured(c.id, !c.featured)
                      .then(() => toast.success(c.featured ? "Đã bỏ nổi bật" : "Đã đánh dấu nổi bật"))
                      .catch((e) => toast.error(e.message))
                  }
                  className={
                    "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs " +
                    (c.featured
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border hover:bg-secondary")
                  }
                  aria-label="Nổi bật"
                >
                  <Star className={"h-3.5 w-3.5 " + (c.featured ? "fill-current" : "")} />
                  {c.featured ? "Nổi bật" : "Đánh dấu"}
                </button>
                <button
                  onClick={() => setEditing(JSON.parse(JSON.stringify(c)))}
                  className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                >
                  Sửa
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Xoá "${c.title}"?`)) {
                      deleteComic(c.id)
                        .then(() => toast.success("Đã xoá"))
                        .catch((e) => toast.error(e.message));
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {editing && (
        <ComicEditor
          comic={editing}
          knownAuthors={knownAuthors}
          knownGenres={knownGenres}
          onClose={() => setEditing(null)}
          onSave={async (c) => {
            try {
              await upsertComic(c);
              toast.success("Đã lưu");
              setEditing(null);
            } catch (e: any) {
              toast.error(e.message ?? "Lỗi khi lưu");
            }
          }}
        />
      )}
    </div>
  );
}

function ComicEditor({
  comic,
  knownAuthors,
  knownGenres,
  onClose,
  onSave,
}: {
  comic: Comic;
  knownAuthors: string[];
  knownGenres: string[];
  onClose: () => void;
  onSave: (c: Comic) => void;
}) {
  const [draft, setDraft] = useState<Comic>(comic);

  function patch(p: Partial<Comic>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function toggleGenre(g: string) {
    const has = draft.genres.includes(g);
    patch({ genres: has ? draft.genres.filter((x) => x !== g) : [...draft.genres, g] });
  }

  function addChapter() {
    const ch: Chapter = { id: uid(), title: `Chương ${draft.chapters.length + 1}`, pages: [], createdAt: Date.now() };
    patch({ chapters: [...draft.chapters, ch] });
  }

  function updateChapter(id: string, p: Partial<Chapter>) {
    patch({
      chapters: draft.chapters.map((c) => (c.id === id ? { ...c, ...p } : c)),
    });
  }

  function removeChapter(id: string) {
    patch({ chapters: draft.chapters.filter((c) => c.id !== id) });
  }

  function moveChapter(id: string, dir: -1 | 1) {
    const arr = [...draft.chapters];
    const i = arr.findIndex((c) => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    patch({ chapters: arr });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-semibold">{comic.title ? `Sửa: ${comic.title}` : "Truyện mới"}</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Đóng
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên truyện">
              <input
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                className="input"
                placeholder="VD: Trăng Khuyết Đêm Hè"
              />
            </Field>
            <Field label="Tác giả">
              <input
                value={draft.author}
                onChange={(e) => patch({ author: e.target.value })}
                className="input"
                list="known-authors"
                placeholder="Gõ hoặc chọn tác giả đã có"
              />
              <datalist id="known-authors">
                {knownAuthors.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
              {knownAuthors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {knownAuthors.slice(0, 12).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => patch({ author: a })}
                      className={
                        "rounded-full border px-2.5 py-0.5 text-xs transition " +
                        (draft.author === a
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground")
                      }
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </Field>
          </div>

          <Field label="Mô tả">
            <textarea
              value={draft.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              className="input"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Thể loại (cách nhau bằng dấu phẩy)">
              <input
                value={draft.genres.join(", ")}
                onChange={(e) =>
                  patch({ genres: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                }
                className="input"
                placeholder="Action, Romance"
              />
              {knownGenres.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {knownGenres.map((g) => {
                    const active = draft.genres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={
                          "rounded-full border px-2.5 py-0.5 text-xs transition " +
                          (active
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground")
                        }
                        aria-pressed={active}
                      >
                        {active ? "✓ " : "+ "}
                        {g}
                      </button>
                    );
                  })}
                </div>
              )}
            </Field>
            <Field label="Cover — File ID hoặc link Drive">
              <input
                value={draft.coverId}
                onChange={(e) => patch({ coverId: extractDriveId(e.target.value) ?? e.target.value })}
                className="input"
                placeholder="1AbC… hoặc https://drive.google.com/file/d/…"
              />
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Chương</h3>
              <button
                onClick={addChapter}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm chương
              </button>
            </div>

            <div className="space-y-3">
              {draft.chapters.map((ch, i) => (
                <div key={ch.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">#{i + 1}</span>
                    <input
                      value={ch.title}
                      onChange={(e) => updateChapter(ch.id, { title: e.target.value })}
                      className="input flex-1"
                    />
                    <button onClick={() => moveChapter(ch.id, -1)} className="icon-btn" aria-label="Lên">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => moveChapter(ch.id, 1)} className="icon-btn" aria-label="Xuống">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeChapter(ch.id)}
                      className="icon-btn text-destructive"
                      aria-label="Xoá"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={ch.pages.join("\n")}
                    onChange={(e) => updateChapter(ch.id, { pages: parseDriveIds(e.target.value) })}
                    rows={4}
                    placeholder="Mỗi dòng một File ID hoặc link Drive (ảnh trang)"
                    className="input mt-2 font-mono text-xs"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{ch.pages.length} trang</p>
                </div>
              ))}
              {draft.chapters.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Chưa có chương nào.
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-background/40 px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary">
            Huỷ
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={!draft.title.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40 hover:opacity-90"
          >
            <Save className="h-4 w-4" /> Lưu
          </button>
        </footer>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: var(--input);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          color: var(--foreground);
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: var(--ring); box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 30%, transparent); }
        .icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          height: 2rem; width: 2rem; border-radius: 0.5rem;
          border: 1px solid var(--border); color: var(--muted-foreground);
        }
        .icon-btn:hover { background: var(--secondary); color: var(--foreground); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}