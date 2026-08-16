import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { Shield, Mail, AlertCircle } from "lucide-react";

const UPDATED_AT = "2026-07-15";
const CONTACT_EMAIL = "hello@lcucumber.com";

export const Route = createFileRoute("/dmca")({
  component: DmcaPage,
  head: () => {
    const title = "DMCA & Yêu cầu gỡ nội dung — Lcucumber";
    const desc =
      "Chính sách DMCA của Lcucumber: quy trình gửi yêu cầu gỡ nội dung vi phạm bản quyền, form liên hệ và cam kết xử lý trong 48 giờ.";
    const url = `${SITE_URL}/dmca`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "vi", href: url },
        { rel: "alternate", hrefLang: "x-default", href: url },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            url,
            inLanguage: "vi-VN",
            dateModified: UPDATED_AT,
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "DMCA", item: url },
            ],
          }),
        },
      ],
    };
  },
});

// Schema Zod cho form — validate cả client lẫn khi build mailto để tránh XSS/injection.
const dmcaFormSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ tên (tối thiểu 2 ký tự)").max(120),
  email: z.string().trim().email("Email không hợp lệ").max(255),
  workTitle: z.string().trim().min(2, "Nhập tên tác phẩm gốc").max(200),
  infringingUrl: z
    .string()
    .trim()
    .url("URL vi phạm phải là đường dẫn hợp lệ (http/https)")
    .max(500),
  evidence: z
    .string()
    .trim()
    .min(10, "Nêu bằng chứng quyền sở hữu (tối thiểu 10 ký tự)")
    .max(1000),
  message: z.string().trim().max(2000).optional().default(""),
  swornStatement: z.literal(true, {
    errorMap: () => ({ message: "Bạn cần xác nhận cam kết trung thực" }),
  }),
});

type DmcaFormValues = z.infer<typeof dmcaFormSchema>;
type FormErrors = Partial<Record<keyof DmcaFormValues, string>>;

function DmcaPage() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const raw = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      workTitle: String(fd.get("workTitle") ?? ""),
      infringingUrl: String(fd.get("infringingUrl") ?? ""),
      evidence: String(fd.get("evidence") ?? ""),
      message: String(fd.get("message") ?? ""),
      swornStatement: fd.get("swornStatement") === "on",
    };
    const parsed = dmcaFormSchema.safeParse(raw);
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof DmcaFormValues;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setSubmitting(false);
      return;
    }
    setErrors({});
    const v = parsed.data;
    const subject = `[DMCA] Yêu cầu gỡ nội dung — ${v.workTitle}`;
    const body =
      `Họ tên: ${v.name}\n` +
      `Email liên hệ: ${v.email}\n` +
      `Tác phẩm gốc: ${v.workTitle}\n` +
      `URL vi phạm trên Lcucumber: ${v.infringingUrl}\n\n` +
      `Bằng chứng quyền sở hữu:\n${v.evidence}\n\n` +
      (v.message ? `Ghi chú thêm:\n${v.message}\n\n` : "") +
      `Tôi cam đoan thông tin trên là chính xác và tôi là chủ sở hữu/đại diện hợp pháp của bản quyền bị vi phạm.`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSubmitting(false);
  };

  const fieldClass =
    "mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
  const errClass = "mt-1 text-xs text-destructive";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <header className="mb-8 flex items-start gap-3">
          <div className="rounded-full bg-primary/15 p-2 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DMCA & Yêu cầu gỡ nội dung</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cập nhật lần cuối: <time dateTime={UPDATED_AT}>{UPDATED_AT}</time>
            </p>
          </div>
        </header>

        <article className="space-y-6 text-sm leading-7 text-foreground/90">
          <section>
            <h2 className="text-xl font-bold">Chính sách bản quyền</h2>
            <p className="mt-2">
              Lcucumber là nền tảng do cộng đồng đóng góp. Nội dung truyện được cộng
              tác viên đăng tải; <strong>bản quyền thuộc về tác giả và nhà xuất bản gốc</strong>.
              Chúng tôi không sở hữu và không xác nhận quyền phân phối cho các tác phẩm này.
            </p>
            <p className="mt-2">
              Nếu bạn là chủ sở hữu bản quyền (hoặc đại diện hợp pháp) và phát hiện
              nội dung vi phạm, vui lòng gửi yêu cầu gỡ bằng form dưới đây hoặc email
              trực tiếp về{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
                {CONTACT_EMAIL}
              </a>
              . Chúng tôi cam kết xử lý và gỡ nội dung hợp lệ{" "}
              <strong>trong vòng 48 giờ</strong> kể từ khi nhận được yêu cầu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Yêu cầu hợp lệ cần có</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Họ tên và email liên hệ thật của chủ sở hữu / đại diện.</li>
              <li>Tên tác phẩm gốc bị vi phạm.</li>
              <li>URL cụ thể trên Lcucumber chứa nội dung vi phạm.</li>
              <li>Bằng chứng chứng minh bạn là chủ sở hữu (link tác giả, ISBN, hợp đồng…).</li>
              <li>Cam kết trung thực về thông tin cung cấp.</li>
            </ul>
          </section>

          <section
            aria-labelledby="dmca-form-title"
            className="rounded-2xl border border-border bg-card/40 p-5"
          >
            <h2 id="dmca-form-title" className="flex items-center gap-2 text-xl font-bold">
              <Mail className="h-5 w-5 text-primary" /> Gửi yêu cầu gỡ nội dung
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Form sẽ mở ứng dụng email mặc định với nội dung đã điền sẵn. Bạn chỉ cần
              bấm gửi.
            </p>

            <form className="mt-4 grid gap-4" onSubmit={onSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Họ tên *</span>
                  <input
                    name="name"
                    type="text"
                    required
                    maxLength={120}
                    className={fieldClass}
                    aria-invalid={!!errors.name}
                    autoComplete="name"
                  />
                  {errors.name && <p className={errClass}>{errors.name}</p>}
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Email *</span>
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={255}
                    className={fieldClass}
                    aria-invalid={!!errors.email}
                    autoComplete="email"
                  />
                  {errors.email && <p className={errClass}>{errors.email}</p>}
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium">Tên tác phẩm gốc *</span>
                <input
                  name="workTitle"
                  type="text"
                  required
                  maxLength={200}
                  className={fieldClass}
                  aria-invalid={!!errors.workTitle}
                />
                {errors.workTitle && <p className={errClass}>{errors.workTitle}</p>}
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  URL vi phạm trên Lcucumber *
                </span>
                <input
                  name="infringingUrl"
                  type="url"
                  required
                  maxLength={500}
                  placeholder="https://www.lcucumber.com/truyen/..."
                  className={fieldClass}
                  aria-invalid={!!errors.infringingUrl}
                />
                {errors.infringingUrl && (
                  <p className={errClass}>{errors.infringingUrl}</p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Bằng chứng quyền sở hữu *
                </span>
                <textarea
                  name="evidence"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={3}
                  className={fieldClass}
                  aria-invalid={!!errors.evidence}
                  placeholder="Link trang tác giả, ISBN, hợp đồng xuất bản…"
                />
                {errors.evidence && <p className={errClass}>{errors.evidence}</p>}
              </label>

              <label className="block">
                <span className="text-sm font-medium">Ghi chú thêm</span>
                <textarea
                  name="message"
                  maxLength={2000}
                  rows={3}
                  className={fieldClass}
                />
              </label>

              <label className="flex items-start gap-2 text-sm">
                <input
                  name="swornStatement"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/30"
                />
                <span>
                  Tôi cam đoan thông tin trên là chính xác và tôi là chủ sở hữu / đại
                  diện hợp pháp của bản quyền bị vi phạm. *
                </span>
              </label>
              {errors.swornStatement && (
                <p className={errClass}>{errors.swornStatement}</p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" /> Gửi yêu cầu
                </button>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5" /> Xử lý trong 48 giờ.
                </span>
              </div>
            </form>
          </section>

          <section>
            <h2 className="text-xl font-bold">Khiếu nại ngược (counter-notice)</h2>
            <p className="mt-2">
              Nếu nội dung của bạn bị gỡ nhầm, bạn có thể gửi khiếu nại ngược về cùng
              email trên kèm bằng chứng bạn có quyền sử dụng hợp pháp. Chúng tôi sẽ
              xem xét và khôi phục trong vòng 7 ngày làm việc nếu hợp lệ.
            </p>
          </section>

          <p className="border-t border-border pt-4 text-sm text-muted-foreground">
            Xem thêm{" "}
            <Link to="/dieu-khoan" className="text-primary underline">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link to="/lien-he" className="text-primary underline">
              Liên hệ chung
            </Link>
            .
          </p>
        </article>
      </main>
    </div>
  );
}