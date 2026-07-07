import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Mail, Facebook, AlertTriangle } from "lucide-react";
import { SITE_URL, SITE_NAME, SOCIAL_LINKS } from "@/lib/seo";

const CONTACT_EMAIL = "hello@lcucumber.com";

export const Route = createFileRoute("/lien-he")({
  component: ContactPage,
  head: () => {
    const title = "Liên hệ Lcucumber — Góp ý, báo lỗi, yêu cầu bản quyền";
    const desc =
      "Liên hệ đội ngũ Lcucumber qua email hoặc mạng xã hội để góp ý, báo lỗi nội dung, đề xuất truyện mới hoặc yêu cầu gỡ nội dung có bản quyền.";
    const url = `${SITE_URL}/lien-he`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: title,
            url,
            inLanguage: "vi-VN",
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
            mainEntity: {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              email: CONTACT_EMAIL,
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  email: CONTACT_EMAIL,
                  availableLanguage: ["Vietnamese", "English"],
                },
              ],
              sameAs: SOCIAL_LINKS,
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Liên hệ", item: url },
            ],
          }),
        },
      ],
    };
  },
});

function ContactPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Liên hệ Lcucumber</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Chúng tôi luôn sẵn sàng nhận góp ý, báo lỗi và yêu cầu bản quyền.
          </p>
        </header>

        <div className="space-y-4">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            rel="nofollow"
            className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4 transition hover:border-primary/60"
          >
            <Mail className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Email</h2>
              <p className="text-sm text-muted-foreground">{CONTACT_EMAIL}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Kênh chính thức cho góp ý, báo lỗi và yêu cầu gỡ nội dung.
              </p>
            </div>
          </a>

          {SOCIAL_LINKS.filter((u) => u.includes("facebook")).map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4 transition hover:border-primary/60"
            >
              <Facebook className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="text-sm font-semibold">Facebook</h2>
                <p className="break-all text-sm text-muted-foreground">{url}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cập nhật thông báo & trao đổi cộng đồng.
                </p>
              </div>
            </a>
          ))}

          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Yêu cầu bản quyền / DMCA</h2>
              <p className="text-sm text-muted-foreground">
                Nếu bạn là tác giả hoặc đại diện bản quyền hợp pháp muốn gỡ nội
                dung, vui lòng email tiêu đề{" "}
                <code className="rounded bg-secondary px-1 text-xs">
                  [Bản quyền]
                </code>{" "}
                về{" "}
                <a
                  className="text-primary underline"
                  href={`mailto:${CONTACT_EMAIL}?subject=%5BB%E1%BA%A3n%20quy%E1%BB%81n%5D`}
                  rel="nofollow"
                >
                  {CONTACT_EMAIL}
                </a>{" "}
                kèm bằng chứng sở hữu. Chúng tôi xử lý trong vòng 72 giờ.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}