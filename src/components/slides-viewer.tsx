"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, MessageSquareText } from "lucide-react";
import type { KBSlide } from "@/lib/types";

export function SlideFace({ slide, index, total, big }: { slide: KBSlide; index: number; total: number; big?: boolean }) {
  const first = index === 0;
  return (
    <div className={`relative flex h-full w-full flex-col justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900 text-white ${big ? "p-12 sm:p-16" : "p-6 sm:p-10"}`}>
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 size-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">Гильдия ЦЭУ · ТПУ</p>
      <h3 className={`relative mt-3 font-extrabold leading-tight ${first ? (big ? "text-5xl" : "text-2xl sm:text-4xl") : big ? "text-4xl" : "text-xl sm:text-3xl"}`}>{slide.title}</h3>
      {slide.bullets.length ? (
        <ul className={`relative mt-5 space-y-2.5 ${big ? "text-2xl" : "text-sm sm:text-lg"}`}>
          {slide.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-slate-100">
              <span className="mt-[0.55em] size-2 shrink-0 rounded-full bg-emerald-400" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <span className="absolute bottom-4 right-5 text-[11px] font-bold text-slate-400">{index + 1} / {total}</span>
    </div>
  );
}

export function SlidesViewer({ slides }: { slides: KBSlide[] }) {
  const [i, setI] = useState(0);
  const [notes, setNotes] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const total = slides.length;
  const go = (n: number) => setI(Math.min(total - 1, Math.max(0, n)));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") setI((v) => Math.min(total - 1, v + 1));
      if (e.key === "ArrowLeft" || e.key === "PageUp") setI((v) => Math.max(0, v - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  if (!total) return <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">В презентации пока нет слайдов.</p>;
  const slide = slides[Math.min(i, total - 1)];

  return (
    <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
      <div className="scrollbar-thin order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:max-h-[520px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
        {slides.map((s, k) => (
          <button key={`${s.title}-${k}`} onClick={() => go(k)} className={`group relative shrink-0 overflow-hidden rounded-xl border-2 text-left transition lg:w-full ${k === i ? "border-emerald-500" : "border-transparent hover:border-slate-300"}`}>
            <div className="aspect-video w-36 bg-slate-900 p-2 lg:w-full">
              <p className="text-[8px] font-bold uppercase text-emerald-300">{k + 1}</p>
              <p className="line-clamp-3 text-[10px] font-extrabold leading-tight text-white">{s.title}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="order-1 space-y-3 lg:order-2">
        <div ref={boxRef} className="overflow-hidden rounded-2xl shadow-lg">
          <div className="aspect-video w-full">
            <SlideFace slide={slide} index={i} total={total} />
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${((i + 1) / total) * 100}%` }} /></div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => go(i - 1)} disabled={i === 0} className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={15} /> Назад</button>
          <button onClick={() => go(i + 1)} disabled={i >= total - 1} className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40">Далее <ChevronRight size={15} /></button>
          <span className="text-xs font-bold text-slate-500">Слайд {i + 1} из {total} · листайте стрелками ← →</span>
          <div className="ml-auto flex gap-2">
            {slide.note ? <button onClick={() => setNotes((v) => !v)} className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold ${notes ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}><MessageSquareText size={14} /> Заметки докладчика</button> : null}
            <button onClick={() => void boxRef.current?.requestFullscreen?.().catch(() => undefined)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Maximize2 size={14} /> На весь экран</button>
          </div>
        </div>
        {notes && slide.note ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200"><b>Заметка докладчика:</b> {slide.note}</p> : null}
      </div>
    </div>
  );
}
