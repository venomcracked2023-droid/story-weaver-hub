import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { ShieldCheck, Lock, Eye, Database, Server, RefreshCw } from "lucide-react";

const UPDATED_AT = "2026-08-29";
const CONTACT_EMAIL = "hello@lcucumber.com";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicyPage,
  head: () => {
    const title = "Chính sách bảo mật — Lcucumber";
    const desc =
      "Chính sách bảo mật và quyền riêng tư của Lcucumber: thu thập dữ liệu, lưu trữ an toàn trên Supabase, cookies, quyền người dùng và liên hệ bảo vệ dữ liệu.";
    const url = `${SITE_URL}/privacy`;
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
              { "@type": "ListItem", position: 2, name: "Chính sách bảo mật", item: url },
            ],
          }),
        },
      ],
    };
  },
});

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="transition hover:text-primary">Trang chủ</Link>
          <span className="text-border">/</span>
          <span className="text-foreground/80">Chính sách bảo mật</span>
        </nav>

        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Bảo vệ quyền riêng tư & dữ liệu người dùng
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Chính sách bảo mật
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cập nhật lần cuối: <time dateTime={UPDATED_AT}>{UPDATED_AT}</time>
          </p>
        </header>

        <article className="space-y-8 text-sm leading-7 text-foreground/90">
          <section className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Lock className="h-5 w-5 text-primary" />
              1. Cam kết chung
            </h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              <strong>{SITE_NAME}</strong> (sau đây gọi là "chúng tôi") tôn trọng và cam kết bảo vệ tối đa quyền riêng tư của bạn. Chính sách này mô tả rõ ràng dữ liệu nào được thu thập, mục đích sử dụng, phương thức lưu trữ an toàn và các quyền hạn của bạn đối với thông tin cá nhân khi truy cập hoặc sử dụng dịch vụ tại nền tảng.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Eye className="h-5 w-5 text-primary" />
              2. Dữ liệu chúng tôi thu thập
            </h2>
            <p>Chúng tôi chỉ thu thập các thông tin tối thiểu cần thiết để vận hành dịch vụ:</p>
            <ul className="list-disc space-y-1.5 pl-6 text-muted-foreground">
              <li>
                <strong className="text-foreground">Thông tin tài khoản:</strong> Địa chỉ email, tên hiển thị (display name), ảnh đại diện (nếu bạn đăng nhập qua Google OAuth hoặc tài khoản email) để phục vụ việc xác thực và định danh bình luận.
              </li>
              <li>
                <strong className="text-foreground">Hoạt động người dùng:</strong> Lịch sử đọc truyện, danh sách theo dõi, bình luận công khai dưới các chương truyện và đánh giá sao.
              </li>
              <li>
                <strong className="text-foreground">Dữ liệu kỹ thuật ẩn danh:</strong> Địa chỉ IP (được bảo vệ/ẩn), loại trình duyệt (User-Agent), thời gian truy cập và nhật ký lỗi nhằm mục đích tối ưu hóa hiệu năng và ngăn chặn tấn công mạng (DDoS/Spam).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Server className="h-5 w-5 text-primary" />
              3. Lưu trữ và bảo mật dữ liệu
            </h2>
            <p>
              Hệ thống xác thực và cơ sở dữ liệu của chúng tôi được xây dựng trên nền tảng đám mây <strong>Supabase</strong> (hạ tầng AWS đạt chuẩn ISO 27001, SOC 2 Type II và GDPR).
            </p>
            <ul className="list-disc space-y-1.5 pl-6 text-muted-foreground">
              <li>
                <strong className="text-foreground">Mã hóa truyền tải:</strong> Toàn bộ dữ liệu truyền giữa trình duyệt và máy chủ được mã hóa qua giao thức HTTPS / TLS 1.3 bảo mật cao.
              </li>
              <li>
                <strong className="text-foreground">Mã hóa mật khẩu:</strong> Mật khẩu tài khoản được băm một chiều (salted hash) bằng thuật toán an toàn tiêu chuẩn quốc tế; không ai — kể cả quản trị viên — có thể xem mật khẩu dạng thô.
              </li>
              <li>
                <strong className="text-foreground">Kiểm soát truy cập:</strong> Dữ liệu cộng tác viên và người dùng được bảo vệ bằng Row Level Security (RLS) ở cấp cơ sở dữ liệu.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Database className="h-5 w-5 text-primary" />
              4. Cookies và công nghệ theo dõi
            </h2>
            <p>
              {SITE_NAME} sử dụng các cookie kỹ thuật cần thiết để duy trì trạng thái đăng nhập của bạn (Session Storage & LocalStorage).
            </p>
            <ul className="list-disc space-y-1.5 pl-6 text-muted-foreground">
              <li>
                <strong className="text-foreground">Essential Cookies:</strong> Lưu phiên đăng nhập an toàn để bạn không phải đăng nhập lại mỗi lần tải trang.
              </li>
              <li>
                <strong className="text-foreground">Phân tích (Analytics):</strong> Sử dụng Google Analytics ở chế độ thu thập chỉ số tổng quan ẩn danh (pageviews, thời gian tải trang) phục vụ cải thiện trải nghiệm đọc.
              </li>
              <li>
                <strong className="text-foreground">Không bán dữ liệu:</strong> Chúng tôi <strong>tuyệt đối không</strong> bán, trao đổi hoặc chia sẻ thông tin cá nhân của bạn cho bất kỳ mạng lưới quảng cáo của bên thứ ba nào.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <RefreshCw className="h-5 w-5 text-primary" />
              5. Quyền của người dùng đối với dữ liệu
            </h2>
            <p>Bạn luôn có toàn quyền kiểm soát dữ liệu cá nhân của mình:</p>
            <ul className="list-disc space-y-1.5 pl-6 text-muted-foreground">
              <li>Quyền xem và cập nhật thông tin hồ sơ trong tài khoản.</li>
              <li>Quyền xóa các bình luận công khai do bạn tạo.</li>
              <li>
                Quyền yêu cầu đóng tài khoản và xóa vĩnh viễn toàn bộ dữ liệu liên quan khỏi hệ thống (Right to be Forgotten).
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <h2 className="text-lg font-bold text-foreground">
              6. Thông tin liên hệ & Cán bộ bảo vệ dữ liệu (DPO)
            </h2>
            <p className="mt-2 text-muted-foreground">
              Nếu bạn có bất kỳ câu hỏi, khiếu nại hoặc muốn thực thi quyền xóa dữ liệu cá nhân, vui lòng liên hệ trực tiếp với bộ phận phụ trách bảo mật của chúng tôi:
            </p>
            <div className="mt-4 flex flex-col gap-1 text-foreground">
              <p>
                <strong>Email hỗ trợ & DPO:</strong>{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                <strong>Trang liên hệ trực tuyến:</strong>{" "}
                <Link to="/lien-he" className="text-primary underline">
                  {SITE_URL}/lien-he
                </Link>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Chúng tôi cam kết phản hồi và xử lý các yêu cầu về quyền riêng tư trong vòng 48–72 giờ làm việc.
              </p>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
