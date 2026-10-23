"use client";

import React, { useRef, useState } from "react";
import { ExternalLink, ListVideo, Play, VideoOff } from "lucide-react";
import type { KBChapter } from "@/lib/types";
import { fmtTime, videoSource } from "@/lib/kb";

export function VideoPlayer({ url, chapters = [], title }: { url?: string; chapters?: KBChapter[]; title: string }) {
  const src = videoSource(url);
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(0);
  const [dur, setDur] = useState(0);
  const [start, setStart] = useState(0);

  const maxT = chapters.length ? Math.max(...chapters.map((c) => c.t)) : 0;
  const scaled = (t: number) => (src.type === "file" && dur > 0 && maxT > dur ? (t / (maxT + 60)) * dur : t);
  const activeIdx = chapters.reduce((acc, c, i) => (now >= scaled(c.t) - 0.05 ? i : acc), 0);
  const isShortDemo = src.type === "file" && dur > 0 && maxT > dur;

  function seek(c: KBChapter) {
    if (src.type === "file" && ref.current) {
      ref.current.currentTime = Math.min(scaled(c.t), Math.max(dur - 0.2, 0));
      void ref.current.play().catch(() => undefined);
    } else if (src.type === "embed" && src.canStart) {
      setStart(c.t);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-lg">
          {src.type === "none" || failed ? (
            <div className="grid aspect-video place-items-center p-6 text-center text-slate-300">
              <div>
                <VideoOff size={34} className="mx-auto text-slate-500" />
                <p className="mt-3 text-sm font-bold">Видео сейчас недоступно</p>
                <p className="mt-1 text-xs text-slate-400">Проверьте ссылку или откройте запись по адресу напрямую.</p>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20">
                    <ExternalLink size={13} /> Открыть ссылку
                  </a>
                ) : null}
              </div>
            </div>
          ) : src.type === "embed" ? (
            <iframe
              key={start}
              title={title}
              src={`${src.src}${src.canStart && start ? `?start=${start}&autoplay=1` : ""}`}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <video
              ref={ref}
              src={src.src}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black"
              onError={() => setFailed(true)}
              onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
              onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
            />
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          {src.type === "embed" ? `Источник: ${src.provider}` : src.type === "file" ? "Видеофайл (mp4)" : ""}
          {isShortDemo ? " · Демо-ролик короче реальной записи: таймкоды глав масштабируются под его длину." : ""}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400"><ListVideo size={14} /> Содержание</p>
        {chapters.length === 0 ? (
          <p className="mt-2 px-1 text-xs text-slate-400">Автор не добавил главы.</p>
        ) : (
          <div className="mt-2 space-y-1">
            {chapters.map((c, i) => (
              <button key={`${c.t}-${c.label}`} onClick={() => seek(c)} className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${i === activeIdx && src.type === "file" ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-slate-50"}`}>
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-slate-900 text-white"><Play size={9} /></span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-extrabold text-emerald-700">{fmtTime(c.t)}</span>
                  <span className="block text-[12px] font-semibold leading-snug text-slate-700">{c.label}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
