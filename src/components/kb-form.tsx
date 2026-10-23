"use client";

import React, { useState } from "react";
import { FileText, PenLine, Presentation, Video } from "lucide-react";
import type { KBArticle, KBKind } from "@/lib/types";
import { KB_CATEGORIES, KIND_LABEL, chaptersToText, parseChapters, parseSlides, slidesToText, videoSource } from "@/lib/kb";
import { Btn, Field, inputCls } from "@/components/ui";

export type MaterialValues = Pick<KBArticle, "kind" | "title" | "category" | "level" | "tags" | "excerpt" | "content" | "videoUrl" | "duration" | "chapters" | "slides" | "speaker" | "readingTime">;

const KIND_ICON: Record<KBKind, React.ReactNode> = {
  article: <FileText size={16} />,
  video: <Video size={16} />,
  presentation: <Presentation size={16} />,
};

export function MaterialForm({ initial, onDone, lockKind }: { initial?: KBArticle; onDone: (v: MaterialValues) => void; lockKind?: boolean }) {
  const [kind, setKind] = useState<KBKind>(initial?.kind ?? "article");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? KB_CATEGORIES[1]);
  const [level, setLevel] = useState<KBArticle["level"]>(initial?.level ?? "Начальный");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? (kind === "article" ? "## Заголовок раздела\n\nТекст статьи с поддержкой Markdown…" : ""));
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [chapters, setChapters] = useState(chaptersToText(initial?.chapters));
  const [speaker, setSpeaker] = useState(initial?.speaker ?? "");
  const [slidesText, setSlidesText] = useState(slidesToText(initial?.slides) || "# Название презентации\n- Ключевая мысль\n- Ещё одна мысль\n> Заметка докладчика\n---\n# Второй слайд\n- Пункт 1\n- Пункт 2");

  const slides = parseSlides(slidesText);
  const src = videoSource(videoUrl);
  const valid =
    title.trim().length >= 5 &&
    (kind === "article" ? content.trim().length >= 20 : kind === "video" ? src.type !== "none" : slides.length >= 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {(["article", "video", "presentation"] as KBKind[]).map((k) => (
          <button key={k} type="button" disabled={lockKind && kind !== k} onClick={() => setKind(k)} className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-extrabold transition ${kind === k ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"} disabled:opacity-40`}>
            {KIND_ICON[k]} {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <Field label="Заголовок"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Понятный заголовок: что узнает читатель или зритель" /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Категория">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>{KB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Уровень">
          <select value={level} onChange={(e) => setLevel(e.target.value as KBArticle["level"])} className={inputCls}>{["Начальный", "Средний", "Продвинутый"].map((l) => <option key={l}>{l}</option>)}</select>
        </Field>
        <Field label="Теги (через запятую)"><input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="Spring Boot, Архитектура" /></Field>
      </div>
      <Field label="Краткое описание"><input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={inputCls} placeholder="1–2 предложения для карточки" /></Field>

      {kind === "article" ? (
        <Field label="Текст (Markdown)"><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={9} className={`${inputCls} font-mono !text-[13px]`} /></Field>
      ) : null}

      {kind === "video" ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
          <Field label="Ссылка на видео" hint="Поддерживаются YouTube, RuTube, VK Видео и прямые ссылки на mp4">
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputCls} placeholder="https://rutube.ru/video/… или https://…/lecture.mp4" />
          </Field>
          <p className={`rounded-xl px-3 py-2 text-xs font-bold ${src.type === "none" ? "bg-slate-50 text-slate-500" : "bg-emerald-50 text-emerald-800"}`}>
            {src.type === "none" ? "Вставьте ссылку — тип источника определится автоматически" : src.type === "embed" ? `Распознано: ${src.provider} (встраиваемый плеер)` : "Распознан видеофайл (mp4)"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Длительность"><input value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} placeholder="45:10" /></Field>
            <Field label="Спикер"><input value={speaker} onChange={(e) => setSpeaker(e.target.value)} className={inputCls} placeholder="Имя ведущего" /></Field>
          </div>
          <Field label="Главы (таймкод и название — по одной в строке)" hint="Например: 0:00 Вступление">
            <textarea value={chapters} onChange={(e) => setChapters(e.target.value)} rows={4} className={`${inputCls} font-mono !text-[13px]`} placeholder={"0:00 Вступление\n12:30 Разбор примера"} />
          </Field>
          <Field label="Описание и материалы к видео"><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} className={inputCls} /></Field>
        </div>
      ) : null}

      {kind === "presentation" ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <Field label="Слайды" hint="# Заголовок · - пункт · > заметка докладчика · «---» — разделитель слайдов">
            <textarea value={slidesText} onChange={(e) => setSlidesText(e.target.value)} rows={11} className={`${inputCls} font-mono !text-[13px]`} />
          </Field>
          <Field label="Спикер"><input value={speaker} onChange={(e) => setSpeaker(e.target.value)} className={inputCls} placeholder="Имя докладчика" /></Field>
          <div className="flex flex-wrap gap-2">
            {slides.slice(0, 6).map((s, i) => (
              <div key={`${s.title}-${i}`} className="aspect-video w-32 rounded-lg bg-slate-900 p-2">
                <p className="text-[8px] font-bold text-emerald-300">{i + 1}</p>
                <p className="line-clamp-3 text-[10px] font-extrabold leading-tight text-white">{s.title}</p>
              </div>
            ))}
            {slides.length > 6 ? <span className="self-center text-xs font-bold text-slate-500">+{slides.length - 6}</span> : null}
          </div>
          <p className="text-xs font-semibold text-slate-500">Слайдов распознано: {slides.length}</p>
        </div>
      ) : null}

      <Btn
        variant="emerald"
        className="w-full"
        disabled={!valid}
        onClick={() =>
          onDone({
            kind,
            title: title.trim(),
            category,
            level,
            tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
            excerpt: excerpt.trim() || content.replace(/[#*`>-]/g, "").slice(0, 140) || title.trim(),
            content,
            videoUrl: kind === "video" ? videoUrl.trim() : undefined,
            duration: kind === "video" ? duration.trim() || undefined : undefined,
            chapters: kind === "video" ? parseChapters(chapters) : undefined,
            slides: kind === "presentation" ? slides : undefined,
            speaker: kind === "article" ? undefined : speaker.trim() || undefined,
            readingTime: kind === "presentation" ? `${slides.length} слайдов` : kind === "video" ? duration.trim() || "видео" : `${Math.max(2, Math.round(content.split(/\s+/).length / 180))} мин`,
          })
        }
      >
        <PenLine size={16} /> {initial ? "Сохранить изменения" : `Опубликовать · ${KIND_LABEL[kind].toLowerCase()}`}
      </Btn>
    </div>
  );
}
