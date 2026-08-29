import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import {
  Users,
  Sparkles,
  HeartHandshake,
  MessageSquareQuote,
  ShieldCheck,
  Award,
  ArrowRight,
  BookOpenCheck,
  Send,
  Share2,
} from "lucide-react";

export const Route = createFileRoute("/cong-dong")({
  component: CommunityPage,
  head: () => {
    const title = "Cộng đồng Độc giả & Dịch giả — Lcucumber";
    const desc =
      "Khám phá cộng đồng đam mê webtoon, kết nối độc giả và dịch giả, tham gia đội ngũ Cộng tác viên Lcucumber và giao lưu văn hóa truyện tranh.";
    const url = `${SITE_URL}/cong-dong`;
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
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Cộng đồng", item: url },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "Cộng đồng Lcucumber",
            url,
            description: desc,
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
          }),
        },
      ],
    };
  },
});

function CommunityPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link to="/" className="transition hover:text-primary">
            Trang chủ
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground/80">Cộng đồng</span>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 via-card/50 to-background p-8 md:p-12 shadow-2xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Users className="h-3.5 w-3.5" />
              Không gian kết nối yêu truyện
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Cộng đồng Webtoon <span className="text-gradient-brand">Lcucumber</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Nơi hội tụ những độc giả đam mê truyện tranh cuộn dọc và các nhóm dịch giả, cộng tác viên tận tâm. Cùng nhau chia sẻ cảm xúc, thảo luận tình tiết và xây dựng môi trường thưởng thức truyện văn minh.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95"
              >
                <Sparkles className="h-4 w-4" /> Ứng tuyển Cộng tác viên
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:bg-secondary"
              >
                Tham gia thành viên <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Pillars / Values */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">Vì sao bạn nên đồng hành cùng chúng tôi?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lcucumber tạo điều kiện tốt nhất cho cả người đọc lẫn người sáng tạo nội dung.
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card/60 p-6 transition-all hover:border-primary/50 hover:bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Tôn trọng quyền tác giả</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ghi nhận công sức nhóm dịch, đề cao tác quyền và phản hồi nhanh chóng mọi yêu cầu bản quyền qua kênh DMCA chuẩn mực.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-6 transition-all hover:border-primary/50 hover:bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Quyền lợi Cộng tác viên</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Hệ thống quản trị truyện thông minh, đăng tải dễ dàng, thống kê lượt đọc minh bạch và hỗ trợ kỹ thuật 24/7.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-6 transition-all hover:border-primary/50 hover:bg-card sm:col-span-2 lg:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquareQuote className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Giao lưu & Thảo luận</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Khu vực bình luận tương tác sôi nổi dưới mỗi chương truyện, cho phép bạn chia sẻ lý thuyết và bày tỏ tình cảm với nhân vật.
              </p>
            </div>
          </div>
        </section>

        {/* CTV Recruitment Guide */}
        <section className="mt-12 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <BookOpenCheck className="h-4 w-4" /> Tuyển dụng CTV
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Bạn muốn đăng truyện lên Lcucumber?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Nếu bạn là dịch giả, nhóm edit hoặc tác giả độc lập muốn chia sẻ tác phẩm của mình tới hàng ngàn độc giả trên nền tảng đọc truyện mượt mà không quảng cáo gián đoạn, hãy gửi đơn ứng tuyển ngay hôm nay.
              </p>
            </div>
            <Link
              to="/apply"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 active:scale-95"
            >
              Gửi đơn ứng tuyển <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Code of Conduct */}
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Quy tắc ứng xử cộng đồng
          </h2>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/40 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                1
              </span>
              <p>
                <strong className="text-foreground">Tôn trọng lẫn nhau:</strong> Không dùng từ ngữ xúc phạm, phân biệt đối xử, quấy rối hoặc công kích cá nhân người đọc khác hay nhóm dịch.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/40 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                2
              </span>
              <p>
                <strong className="text-foreground">Cảnh báo Spoil nội dung:</strong> Khi thảo luận về các tình tiết quan trọng chưa xuất hiện ở các chương trước, vui lòng ghi rõ cảnh báo để không ảnh hưởng trải nghiệm của người khác.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/40 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                3
              </span>
              <p>
                <strong className="text-foreground">Không Spam hoặc quảng cáo:</strong> Nghiêm cấm phát tán link độc hại, spam bình luận hoặc quảng bá các dịch vụ trái pháp luật trong phần bình luận.
              </p>
            </div>
          </div>
        </section>

        {/* Connect Channels */}
        <section className="mt-12 rounded-2xl border border-border bg-gradient-to-r from-card via-card/70 to-card p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Kênh liên hệ & Góp ý</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Có thắc mắc hoặc muốn đề xuất tính năng mới? Ban quản trị luôn sẵn sàng lắng nghe bạn.
              </p>
            </div>
            <Link
              to="/lien-he"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:text-primary"
            >
              <Send className="h-4 w-4" /> Liên hệ BQT
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
