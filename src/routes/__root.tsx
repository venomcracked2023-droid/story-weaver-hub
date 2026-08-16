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
import { SITE_LOGO, SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/lib/seo";
import { SiteFooter } from "@/components/SiteFooter";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            search={{ q: "" }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
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
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Lcucumber" },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { name: "theme-color", content: "#0b0b10" },
      { name: "keywords", content: "webtoon, đọc truyện online, manhwa, manhua, manga, truyện tranh, cuộn dọc, Lcucumber" },
      { property: "og:site_name", content: "Lcucumber" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "vi_VN" },
      { property: "og:image", content: `${SITE_URL}/og-default.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image:alt", content: "Lcucumber — Đọc Webtoon cuộn dọc miễn phí" },
      { name: "twitter:image", content: `${SITE_URL}/og-default.jpg` },
      { name: "google-site-verification", content: "nuznkezATkzuBsrNT1mC972T86bQZnZgH4LhasUO4qc" },
      { name: "google-site-verification", content: "FNyknghInTmMnKo0aS-FSjZDDGaAf1F_CbHeyzpLe6A" },
      { title: "Lcucumber — Đọc Webtoon cuộn dọc miễn phí" },
      { property: "og:title", content: "Lcucumber — Đọc Webtoon cuộn dọc miễn phí" },
      { name: "twitter:title", content: "Lcucumber — Đọc Webtoon cuộn dọc miễn phí" },
      { name: "description", content: "Lcucumber là nền tảng đọc webtoon cuộn dọc miễn phí: manhwa, manhua, manga Việt hoá, cập nhật chương mới mỗi ngày, đọc mượt trên mọi thiết bị." },
      { property: "og:description", content: "Lcucumber là nền tảng đọc webtoon cuộn dọc miễn phí: manhwa, manhua, manga Việt hoá, cập nhật chương mới mỗi ngày, đọc mượt trên mọi thiết bị." },
      { name: "twitter:description", content: "Lcucumber là nền tảng đọc webtoon cuộn dọc miễn phí: manhwa, manhua, manga Việt hoá, cập nhật chương mới mỗi ngày, đọc mượt trên mọi thiết bị." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "alternate", hrefLang: "vi", href: `${SITE_URL}/` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/` },
    ],
    scripts: [
      {
        async: true,
        src: "https://www.googletagmanager.com/gtag/js?id=G-W7M4VB102V",
      },
      {
        children: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W7M4VB102V');`,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: SITE_LOGO,
          sameAs: SOCIAL_LINKS,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          inLanguage: "vi-VN",
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }),
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
