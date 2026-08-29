import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Chapter = {
  id: string;
  slug: string;
  title: string;
  pages: string[];
  createdAt: number;
};

export type Comic = {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  coverId: string;
  genres: string[];
  chapters: Chapter[];
  createdAt: number;
  createdBy?: string;
  featured: boolean;
};

const listeners = new Set<() => void>();
let cache: Comic[] = [];
let loaded = false;
let loading: Promise<Comic[]> | null = null;

function emit() { listeners.forEach((l) => l()); }

export function enhanceComicMetadata<
  T extends {
    id: string;
    slug?: string;
    title: string;
    author?: string | null;
    description?: string | null;
    cover_id?: string | null;
    genres?: string[] | null;
    created_at?: string | null;
    created_by?: string | null;
    featured?: boolean | null;
    updated_at?: string | null;
  },
>(c: T): T & {
  author: string;
  genres: string[];
  description: string;
  cover_id: string;
} {
  const isShutline = (c.slug ?? "").toLowerCase() === "shutline" || (c.title ?? "").toLowerCase() === "shutline";
  const author = c.author || (isShutline ? "KYOU" : "");
  const genres = (c.genres && c.genres.length > 0) ? c.genres : (isShutline ? ["BL", "Hành động", "Drama", "Manhwa", "18+"] : []);
  const description = c.description || (isShutline
    ? "Shin Moon-Dae là thợ sửa xe đường phố ngầm kiếm sống qua ngày. Cuộc đời anh rẽ sang hướng khác khi nhận lời sửa xe cho Jake Gillan — người đàn ông ngoại quốc bí ẩn mang súng và mối nguy hiểm rình rập..."
    : "");
  const coverId = (c.cover_id && c.cover_id !== "1L0n1l52DNr9sXG0lpkJl3WD3jEMaff3X")
    ? c.cover_id
    : (isShutline ? "/assets/covers/shutline.jpg" : (c.cover_id ?? ""));

  return {
    ...c,
    author,
    genres,
    description,
    cover_id: coverId,
  };
}

export async function fetchComicsData(): Promise<Comic[]> {
  try {
    const { data: comics, error } = await supabase
      .from("comics")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); return cache; }
    const ids = (comics ?? []).map((c) => c.id);
    let chaptersByComic: Record<string, Chapter[]> = {};
    if (ids.length) {
      const { data: chapters, error: chErr } = await supabase
        .from("chapters")
        .select("*")
        .in("comic_id", ids)
        .order("order_index", { ascending: true });
      if (chErr) console.error(chErr);
      for (const ch of chapters ?? []) {
        (chaptersByComic[ch.comic_id] ||= []).push({
          id: ch.id,
          slug: (ch as any).slug ?? "",
          title: ch.title,
          pages: ch.pages ?? [],
          createdAt: new Date(ch.created_at).getTime(),
        });
      }
    }
    const result: Comic[] = (comics ?? []).map((raw) => {
      const c = enhanceComicMetadata(raw);
      return {
        id: c.id,
        slug: (c as any).slug ?? "",
        title: c.title,
        author: c.author,
        description: c.description,
        coverId: c.cover_id,
        genres: c.genres,
        chapters: chaptersByComic[c.id] ?? [],
        createdAt: new Date(c.created_at ?? Date.now()).getTime(),
        createdBy: c.created_by ?? undefined,
        featured: (c as any).featured ?? false,
      };
    });
    cache = result;
    loaded = true;
    emit();
    return result;
  } catch (err) {
    console.error("fetchComicsData error:", err);
    return cache;
  }
}

export function loadComics(): Promise<Comic[]> {
  if (loading) return loading;
  loading = fetchComicsData().finally(() => { loading = null; });
  return loading;
}

export function syncComicsCache(initialComics: Comic[]) {
  if (initialComics && initialComics.length > 0) {
    cache = initialComics;
    loaded = true;
  }
}

export function getComics(): Comic[] { return cache; }

export async function upsertComic(c: Comic): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Bạn cần đăng nhập");

  const isNew = !cache.some((x) => x.id === c.id);
  const payload = {
    title: c.title,
    author: c.author,
    description: c.description,
    cover_id: c.coverId,
    genres: c.genres,
    featured: c.featured,
  };

  let comicId = c.id;
  if (isNew) {
    const { data, error } = await supabase
      .from("comics")
      .insert({ ...payload, created_by: userId })
      .select("id")
      .single();
    if (error) throw error;
    comicId = data.id;
  } else {
    const { error } = await supabase.from("comics").update(payload).eq("id", c.id);
    if (error) throw error;
    // Replace chapters: delete all then insert
    const { error: delErr } = await supabase.from("chapters").delete().eq("comic_id", c.id);
    if (delErr) throw delErr;
  }

  if (c.chapters.length) {
    const rows = c.chapters.map((ch, i) => ({
      comic_id: comicId,
      title: ch.title,
      pages: ch.pages,
      order_index: i,
    }));
    const { error: insErr } = await supabase.from("chapters").insert(rows);
    if (insErr) throw insErr;
  }

  await fetchComicsData();
}

export async function deleteComic(id: string): Promise<void> {
  const { error } = await supabase.from("comics").delete().eq("id", id);
  if (error) throw error;
  await fetchComicsData();
}

export async function setFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await supabase.from("comics").update({ featured }).eq("id", id);
  if (error) throw error;
  const c = cache.find((x) => x.id === id);
  if (c) c.featured = featured;
  emit();
}

export function useComics(initialComics?: Comic[]): Comic[] {
  if (initialComics && initialComics.length > 0 && !loaded) {
    cache = initialComics;
    loaded = true;
  }
  const [, setTick] = useState(0);
  useEffect(() => {
    const cb = () => setTick((n) => n + 1);
    listeners.add(cb);
    if (!loaded && !loading) loadComics();
    else cb();
    return () => { listeners.delete(cb); };
  }, []);
  return cache.length > 0 ? cache : (initialComics ?? cache);
}

export function useComicsLoaded(): boolean {
  const [val, setVal] = useState(loaded);
  useEffect(() => {
    const cb = () => setVal(loaded);
    listeners.add(cb);
    if (!loaded && !loading) loadComics();
    cb();
    return () => { listeners.delete(cb); };
  }, []);
  return val;
}

export function uid(): string {
  return (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getRelatedComics(
  currentSlug: string,
  genres: string[] = [],
  author: string = "",
  allComics: Comic[] = cache,
  limit = 4,
): Comic[] {
  const currentGenres = new Set(genres.map((g) => g.toLowerCase().trim()));
  const currentAuthor = author.toLowerCase().trim();

  return allComics
    .filter((c) => c.slug !== currentSlug)
    .map((c) => {
      let score = 0;
      if (currentAuthor && (c.author || "").toLowerCase().trim() === currentAuthor) {
        score += 5;
      }
      for (const g of c.genres || []) {
        if (currentGenres.has(g.toLowerCase().trim())) {
          score += 2;
        }
      }
      return { comic: c, score };
    })
    .sort((a, b) => b.score - a.score || b.comic.createdAt - a.comic.createdAt)
    .slice(0, limit)
    .map((x) => x.comic);
}


