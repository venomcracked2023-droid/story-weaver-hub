// Google Analytics 4 (GA4) Custom Event Tracking for Lcucumber

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Safely dispatch a GA4 event if gtag is defined on window.
 */
export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try {
      window.gtag("event", eventName, {
        ...params,
        send_to: "G-W7M4VB102V",
      });
    } catch (err) {
      console.warn("[Analytics] Failed to track event:", eventName, err);
    }
  }
}

/**
 * Track when a user clicks a comic card to view details.
 */
export function trackComicClick(comicId: string, comicTitle: string, location: "home_featured" | "home_library" | "featured_page" | "latest_page" | "genre_page" | "related" = "home_library") {
  trackEvent("comic_click", {
    comic_id: comicId,
    comic_title: comicTitle,
    click_location: location,
  });
}

/**
 * Track when a comic detail page is viewed.
 */
export function trackComicView(comicId: string, comicTitle: string, genres: string[] = []) {
  trackEvent("comic_view", {
    comic_id: comicId,
    comic_title: comicTitle,
    genres: genres.join(", "),
  });
}

/**
 * Track when a user starts reading a chapter.
 */
export function trackChapterReadStart(comicId: string, comicTitle: string, chapterSlug: string, chapterTitle: string) {
  trackEvent("chapter_read_start", {
    comic_id: comicId,
    comic_title: comicTitle,
    chapter_slug: chapterSlug,
    chapter_title: chapterTitle,
  });
}

/**
 * Track reading milestones/progress within a chapter.
 */
export function trackChapterProgress(comicTitle: string, chapterTitle: string, percentage: 25 | 50 | 75 | 100) {
  trackEvent("chapter_progress", {
    comic_title: comicTitle,
    chapter_title: chapterTitle,
    progress_percent: percentage,
  });
}

/**
 * Track search queries submitted by users.
 */
export function trackSearchQuery(searchTerm: string, resultCount?: number) {
  if (!searchTerm.trim()) return;
  trackEvent("search", {
    search_term: searchTerm.trim(),
    results_count: resultCount,
  });
}

/**
 * Track genre filter interactions.
 */
export function trackGenreFilter(genreName: string) {
  trackEvent("genre_filter", {
    genre: genreName,
  });
}

/**
 * Track sharing actions.
 */
export function trackShare(comicTitle: string, platform: "facebook" | "zalo" | "twitter" | "copy_link" | "native") {
  trackEvent("share", {
    content_type: "comic",
    item_id: comicTitle,
    method: platform,
  });
}

/**
 * Track bookmark / favorite toggle.
 */
export function trackBookmark(comicId: string, comicTitle: string, action: "add" | "remove") {
  trackEvent("bookmark_toggle", {
    comic_id: comicId,
    comic_title: comicTitle,
    action,
  });
}
