// Cấu hình SEO/thương hiệu — chỉnh ở đây khi có thêm mạng xã hội mới.
export const SITE_URL = "https://www.lcucumber.com";
export const SITE_NAME = "Lcucumber";
export const SITE_LOGO = `${SITE_URL}/og-default.jpg`;

// Thêm URL mạng xã hội vào đây — Google dùng sameAs để liên kết thương hiệu.
export const SOCIAL_LINKS: string[] = [
  "https://www.facebook.com/profile.php?id=61577465649339",
  // "https://www.youtube.com/@your-handle",
  // "https://x.com/your-handle",
  // "https://www.instagram.com/your-handle",
  // "https://www.tiktok.com/@your-handle",
];

export function formatTitle(title: string, maxLen = 60): string {
  const trimmed = title.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trimEnd()}…`;
}

export function formatDesc(desc: string, maxLen = 160): string {
  const trimmed = desc.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trimEnd()}…`;
}

export function buildPageLinks(pathOrUrl: string, extraLinks: Array<{ rel: string; href: string; [key: string]: unknown }> = []) {
  const cleanUrl = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;

  return [
    { rel: "canonical", href: cleanUrl },
    { rel: "alternate", hrefLang: "vi", href: cleanUrl },
    { rel: "alternate", hrefLang: "x-default", href: cleanUrl },
    ...extraLinks,
  ];
}

export interface SeoHeadOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: string;
  noindex?: boolean;
  prevUrl?: string | null;
  nextUrl?: string | null;
  scripts?: Array<{ type?: string; children?: string }>;
}

export function buildSeoHead(options: SeoHeadOptions) {
  const {
    title,
    description,
    path,
    image = `${SITE_URL}/og-default.jpg`,
    type = "website",
    noindex = false,
    prevUrl,
    nextUrl,
    scripts = [],
  } = options;

  const url = path.startsWith("http")
    ? path
    : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const formattedTitle = formatTitle(title, 60);
  const formattedDesc = formatDesc(description, 160);

  const meta: Array<{ title?: string; name?: string; property?: string; content?: string }> = [
    { title: formattedTitle },
    { name: "description", content: formattedDesc },
    ...(noindex ? [{ name: "robots", content: "noindex,nofollow" }] : []),
    { property: "og:title", content: formattedTitle },
    { property: "og:description", content: formattedDesc },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: formattedTitle },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: formattedTitle },
    { name: "twitter:description", content: formattedDesc },
    { name: "twitter:image", content: image },
  ];

  const extraLinks: Array<{ rel: string; href: string }> = [];
  if (prevUrl) extraLinks.push({ rel: "prev", href: prevUrl });
  if (nextUrl) extraLinks.push({ rel: "next", href: nextUrl });

  const links = buildPageLinks(url, extraLinks);

  return {
    meta,
    links,
    scripts,
  };
}
