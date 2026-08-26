import { SITE_URL } from "./seo";

export async function pingIndexNow(urls: string[]): Promise<{ success: boolean; message: string }> {
  try {
    const host = new URL(SITE_URL).host;
    const body = {
      host,
      key: "lcucumber-indexnow-key",
      keyLocation: `${SITE_URL}/lcucumber-indexnow-key.txt`,
      urlList: urls.map((u) => (u.startsWith("http") ? u : `${SITE_URL}${u}`)),
    };

    // IndexNow endpoint - Bing, Yandex, Seznam, Naver
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    if (res.ok || res.status === 200 || res.status === 202) {
      return { success: true, message: `IndexNow pinged for ${urls.length} URLs` };
    }
    return { success: false, message: `IndexNow status: ${res.status}` };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to ping IndexNow" };
  }
}
