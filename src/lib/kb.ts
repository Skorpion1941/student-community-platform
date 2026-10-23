import type { KBChapter, KBSlide } from "./types";

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(r).padStart(2, "0")}`;
}

/** «12:40 Название» или «1:05:10 Название» → главы */
export function parseChapters(text: string): KBChapter[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(\d+(?::\d{1,2}){1,2})\s+(.+)$/);
      if (!m) return null;
      const parts = m[1].split(":").map(Number);
      const t = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
      return { t, label: m[2] };
    })
    .filter((x): x is KBChapter => !!x);
}

export function chaptersToText(ch: KBChapter[] | undefined): string {
  return (ch ?? []).map((c) => `${fmtTime(c.t)} ${c.label}`).join("\n");
}

/**
 * Формат слайдов:
 * # Заголовок
 * - пункт
 * > заметка докладчика
 * ---
 */
export function parseSlides(text: string): KBSlide[] {
  return text
    .split(/\n\s*---+\s*\n?/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      let title = "";
      const bullets: string[] = [];
      const notes: string[] = [];
      for (const l of lines) {
        if (l.startsWith("#")) title = title || l.replace(/^#+\s*/, "");
        else if (l.startsWith(">")) notes.push(l.replace(/^>\s*/, ""));
        else bullets.push(l.replace(/^[-*•]\s*/, ""));
      }
      if (!title && bullets.length) title = bullets.shift() ?? "";
      return { title: title || "Без названия", bullets, note: notes.length ? notes.join(" ") : undefined };
    });
}

export function slidesToText(slides: KBSlide[] | undefined): string {
  return (slides ?? [])
    .map((s) => [`# ${s.title}`, ...s.bullets.map((b) => `- ${b}`), ...(s.note ? [`> ${s.note}`] : [])].join("\n"))
    .join("\n---\n");
}

export type VideoSource =
  | { type: "file"; src: string }
  | { type: "embed"; src: string; provider: "YouTube" | "RuTube" | "VK Видео"; canStart: boolean }
  | { type: "none" };

export function videoSource(url: string | undefined): VideoSource {
  const u = (url ?? "").trim();
  if (!u) return { type: "none" };
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return { type: "embed", src: `https://www.youtube.com/embed/${yt[1]}`, provider: "YouTube", canStart: true };
  const rt = u.match(/rutube\.ru\/(?:video|play\/embed)\/([\w]+)/);
  if (rt) return { type: "embed", src: `https://rutube.ru/play/embed/${rt[1]}`, provider: "RuTube", canStart: false };
  const vk = u.match(/vk\.com\/video(-?\d+)_(\d+)/);
  if (vk) return { type: "embed", src: `https://vk.com/video_ext.php?oid=${vk[1]}&id=${vk[2]}`, provider: "VK Видео", canStart: false };
  return { type: "file", src: u };
}

export const KB_CATEGORIES = [
  "Архитектура",
  "Backend (Java/Spring)",
  "Frontend (React/Tailwind)",
  "Системный анализ",
  "QA/Тестирование",
  "UI/UX (Figma)",
  "Регламенты Гильдии",
  "Разбор типовых ошибок (FAQ)",
];

export const KIND_LABEL = { article: "Статья", video: "Видео", presentation: "Презентация" } as const;
