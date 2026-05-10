import { useEffect, useState, useSyncExternalStore } from "react";

export type Chapter = {
  id: string;
  title: string;
  pages: string[]; // Drive file IDs
  createdAt: number;
};

export type Comic = {
  id: string;
  title: string;
  author: string;
  description: string;
  coverId: string; // Drive file ID for cover
  genres: string[];
  chapters: Chapter[];
  createdAt: number;
};

const KEY = "webtoon.comics.v1";

const SAMPLE: Comic[] = [
  {
    id: "sample-1",
    title: "Trăng Khuyết Đêm Hè",
    author: "Mây Trắng",
    description:
      "Một câu chuyện kỳ ảo về cô gái mang ký ức của mặt trăng, lạc giữa thành phố không bao giờ ngủ.",
    coverId: "",
    genres: ["Fantasy", "Romance"],
    chapters: [],
    createdAt: Date.now(),
  },
  {
    id: "sample-2",
    title: "Lưỡi Kiếm Của Bình Minh",
    author: "Hắc Vũ",
    description:
      "Hành trình của kiếm khách trẻ tìm lại danh dự cho gia tộc đã mất.",
    coverId: "",
    genres: ["Action", "Adventure"],
    chapters: [],
    createdAt: Date.now(),
  },
];

function read(): Comic[] {
  if (typeof window === "undefined") return SAMPLE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SAMPLE;
    return JSON.parse(raw) as Comic[];
  } catch {
    return SAMPLE;
  }
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function getComics(): Comic[] {
  return read();
}

export function saveComics(next: Comic[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export function upsertComic(c: Comic) {
  const list = read();
  const i = list.findIndex((x) => x.id === c.id);
  if (i === -1) list.unshift(c);
  else list[i] = c;
  saveComics(list);
}

export function deleteComic(id: string) {
  saveComics(read().filter((c) => c.id !== id));
}

export function useComics(): Comic[] {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const data = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => read(),
    () => SAMPLE,
  );
  return hydrated ? data : SAMPLE;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}