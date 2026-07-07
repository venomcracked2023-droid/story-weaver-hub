import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

const UPDATED_AT = "2026-07-07";

export const Route = createFileRoute("/dieu-khoan")({
  component: TermsPage,
  head: () => {
    const title = "Điều khoản sử dụng — Lcucumber";
    const desc =
      "Điều khoản sử dụng Lcucumber: quyền và nghĩa vụ của độc giả, cộng tác viên, chính sách bản quyền và quy định gỡ nội dung.";
    const url = `${SITE_URL}/dieu-khoan`;
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
      links: [{ rel: "canonical", href: url }],
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
              { "@type": "ListItem", position: 2, name: "Điều khoản sử dụng", item: url },
            ],
          }),
        },
      ],
    };
  },
});

function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Điều khoản sử dụng</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cập nhật lần cuối:{" "}
            <time dateTime={UPDATED_AT}>{UPDATED_AT}</time>
          </p>
        </header>

        <article className="space-y-6 text-sm leading-7 text-foreground/90">
          <section>
            <h2 className="text-xl font-bold">1. Chấp nhận điều khoản</h2>
            <p className="mt-2">
              Bằng việc truy cập và sử dụng Lcucumber, bạn đồng ý với các điều
              khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">2. Nội dung & bản quyền</h2>
            <p className="mt-2">
              Lcucumber là nền tảng do cộng đồng đóng góp. Nội dung truyện được
              cộng tác viên đăng tải; <strong>bản quyền thuộc về tác giả/nhà
              xuất bản gốc</strong>. Chúng tôi không sở hữu và không xác nhận
              quyền phân phối cho các tác phẩm này.
            </p>
            <p className="mt-2">
              Nếu bạn là chủ sở hữu bản quyền và muốn gỡ nội dung, hãy liên hệ
              theo hướng dẫn tại{" "}
              <Link to="/lien-he" className="text-primary underline">
                trang Liên hệ
              </Link>
              . Chúng tôi xử lý trong vòng 72 giờ kể từ khi nhận được yêu cầu
              hợp lệ.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">3. Tài khoản người dùng</h2>
            <p className="mt-2">
              Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình. Mọi
              hoạt động dưới tài khoản của bạn được xem là do bạn thực hiện.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">4. Hành vi bị cấm</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Đăng tải nội dung vi phạm pháp luật Việt Nam.</li>
              <li>Đăng nội dung khiêu dâm trẻ em, bạo lực cực đoan, thù ghét.</li>
              <li>Tấn công, spam, phá hoại hạ tầng dịch vụ.</li>
              <li>Sao chép, cào dữ liệu quy mô lớn không xin phép.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">5. Cộng tác viên</h2>
            <p className="mt-2">
              Cộng tác viên tự chịu trách nhiệm về nội dung mình đăng và cam kết
              đã có quyền/được phép chia sẻ. Lcucumber có quyền gỡ nội dung
              hoặc thu hồi quyền đăng bất kỳ lúc nào nếu phát hiện vi phạm.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">6. Bình luận</h2>
            <p className="mt-2">
              Bình luận do độc giả gửi; Lcucumber không chịu trách nhiệm cho
              quan điểm cá nhân của người bình luận nhưng có quyền ẩn/xoá bình
              luận vi phạm.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">7. Miễn trừ trách nhiệm</h2>
            <p className="mt-2">
              Dịch vụ được cung cấp "nguyên trạng" (as-is). Chúng tôi không đảm
              bảo dịch vụ luôn không gián đoạn, không lỗi, hoặc phù hợp với
              mục đích cá nhân của bạn.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">8. Thay đổi điều khoản</h2>
            <p className="mt-2">
              Chúng tôi có thể cập nhật điều khoản này. Phiên bản mới có hiệu
              lực ngay khi đăng tải. Việc bạn tiếp tục sử dụng dịch vụ đồng
              nghĩa với chấp nhận điều khoản mới.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">9. Liên hệ</h2>
            <p className="mt-2">
              Mọi thắc mắc về điều khoản, vui lòng liên hệ qua{" "}
              <Link to="/lien-he" className="text-primary underline">
                trang Liên hệ
              </Link>
              .
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}