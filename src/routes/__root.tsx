import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";
import {
  SITE_LOGO,
  SITE_NAME,
  SITE_URL,
  getOrganizationSchema,
  getPreconnectLinks,
  getWebApplicationSchema,
  getWebSiteSchema,
} from "@/lib/seo";
import { SiteFooter } from "@/components/SiteFooter";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Không tìm thấy trang</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang địa chỉ mới.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Đã có lỗi xảy ra khi tải trang
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hệ thống gặp sự cố tạm thời. Bạn có thể thử tải lại hoặc quay về trang chủ.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
          >
            Thử lại
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { name: "author", content: "Lcucumber" },
      { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:160,max-video-preview:-1" },
      { name: "theme-color", content: "#0b0b10" },
      { name: "keywords", content: "webtoon, đọc truyện online, manhwa, manhua, manga, truyện tranh, cuộn dọc, Lcucumber, đọc truyện miễn phí" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "vi_VN" },
      { property: "og:image", content: `${SITE_URL}/og-default.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Lcucumber — Đọc Webtoon cuộn dọc miễn phí" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE_URL}/og-default.jpg` },
      { name: "google-site-verification", content: "nuznkezATkzuBsrNT1mC972T86bQZnZgH4LhasUO4qc" },
      { name: "google-site-verification", content: "FNyknghInTmMnKo0aS-FSjZDDGaAf1F_CbHeyzpLe6A" },
    ],
    links: [
      ...getPreconnectLinks(),
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
    scripts: [
      {
        async: true,
        src: "https://www.googletagmanager.com/gtag/js?id=G-W7M4VB102V",
      },
      {
        children: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W7M4VB102V', { page_path: window.location.pathname });`,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(getOrganizationSchema()),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(getWebSiteSchema()),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(getWebApplicationSchema()),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <SiteFooter />
        <Toaster richColors position="top-right" theme="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
