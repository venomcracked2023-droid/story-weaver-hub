import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { BookOpen, Heart, Users } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const Route = createFileRoute("/gioi-thieu")({
  component: AboutPage,
  head: () => {
    const title = "Giới thiệu Lcucumber — Nền tảng đọc webtoon cuộn dọc";
    const desc =
      "Lcucumber là nền tảng đọc webtoon cuộn dọc miễn phí do cộng đồng Việt vận hành: manhwa, manhua, manga Việt hoá, cập nhật chương mới mỗi ngày.";
    const url = `${SITE_URL}/gioi-thieu`;
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
            "@type": "AboutPage",
            name: title,
            url,
            inLanguage: "vi-VN",
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
              { "@type": "ListItem", position: 2, name: "Giới thiệu", item: url },
            ],
          }),
        },
      ],
    };
  },
});

function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Giới thiệu <span className="text-gradient-brand">Lcucumber</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Nền tảng đọc webtoon cuộn dọc dành cho cộng đồng độc giả Việt.
          </p>
        </header>

        <section className="space-y-6 text-sm leading-7 text-foreground/90">
          <p>
            <strong>Lcucumber</strong> ra đời với mong muốn tạo một không gian đọc
            webtoon, manhwa, manhua thuần Việt — <em>mượt như lướt sóng, xanh
            như dưa leo</em>. Chúng tôi tuyển chọn nội dung được cộng tác viên
            đăng tải, ưu tiên trải nghiệm cuộn dọc trên điện thoại và máy tính.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <BookOpen className="mb-2 h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold">Miễn phí</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Toàn bộ chương truyện đọc miễn phí, không paywall.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <Users className="mb-2 h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold">Cộng đồng</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Cộng tác viên đăng truyện, độc giả bình luận & đánh giá.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <Heart className="mb-2 h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold">Trải nghiệm</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Cuộn dọc tối ưu, tải ảnh nhanh, giao diện tối bảo vệ mắt.
              </p>
            </div>
          </div>

          <h2 className="pt-4 text-xl font-bold">Chúng tôi làm gì?</h2>
          <p>
            Lcucumber tổng hợp và lưu trữ webtoon do cộng tác viên gửi lên,
            phân loại theo thể loại và giúp bạn tìm truyện mới nhanh chóng.
            Chúng tôi <strong>không sở hữu tác quyền</strong> nội dung do người
            dùng đăng tải; mọi bản quyền thuộc về tác giả và nhà xuất bản gốc.
          </p>

          <h2 className="pt-4 text-xl font-bold">Trở thành cộng tác viên</h2>
          <p>
            Nếu bạn muốn dịch/đăng truyện lên Lcucumber, hãy{" "}
            <Link to="/apply" className="text-primary underline">
              ứng tuyển cộng tác viên
            </Link>
            . Đội ngũ sẽ xét duyệt và cấp quyền đăng chương.
          </p>

          <h2 className="pt-4 text-xl font-bold">Liên hệ</h2>
          <p>
            Mọi thắc mắc, góp ý hoặc yêu cầu gỡ nội dung vui lòng gửi qua{" "}
            <Link to="/lien-he" className="text-primary underline">
              trang Liên hệ
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}