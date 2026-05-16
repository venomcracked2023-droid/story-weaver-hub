import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Chapter = {
  id: string;
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
let loading: Promise<void> | null = null;

function emit() { listeners.forEach((l) => l()); }

async function fetchAll(): Promise<void> {
  const { data: comics, error } = await supabase
    .from("comics")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return; }
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
        title: ch.title,
        pages: ch.pages ?? [],
        createdAt: new Date(ch.created_at).getTime(),
      });
    }
  }
  cache = (comics ?? []).map((c) => ({
    id: c.id,
    slug: (c as { slug?: string }).slug ?? "",
    title: c.title,
    author: c.author ?? "",
    description: c.description ?? "",
    coverId: c.cover_id ?? "",
    genres: c.genres ?? [],
    chapters: chaptersByComic[c.id] ?? [],
    createdAt: new Date(c.created_at).getTime(),
    createdBy: c.created_by,
    featured: (c as any).featured ?? false,
  }));
  loaded = true;
  emit();
}

export function loadComics(): Promise<void> {
  if (loading) return loading;
  loading = fetchAll().finally(() => { loading = null; });
  return loading;
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

  await fetchAll();
}

export async function deleteComic(id: string): Promise<void> {
  const { error } = await supabase.from("comics").delete().eq("id", id);
  if (error) throw error;
  await fetchAll();
}

export async function setFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await supabase.from("comics").update({ featured }).eq("id", id);
  if (error) throw error;
  const c = cache.find((x) => x.id === id);
  if (c) c.featured = featured;
  emit();
}

export function useComics(): Comic[] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const cb = () => setTick((n) => n + 1);
    listeners.add(cb);
    if (!loaded && !loading) loadComics();
    else cb();
    return () => { listeners.delete(cb); };
  }, []);
  return cache;
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
