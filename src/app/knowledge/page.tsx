"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Eye, FileText, Heart, Play, Plus, Presentation, Search, Sparkles, Trash2, Video } from "lucide-react";
import { useGuild } from "@/lib/store";
import { KB_CATEGORIES, KIND_LABEL } from "@/lib/kb";
import type { KBArticle, KBKind } from "@/lib/types";
import { Avatar, Badge, Btn, Card, EmptyState, Modal, SegTabs, SelectBox, inputCls } from "@/components/ui";
import { MaterialForm } from "@/components/kb-form";

type Tab = "all" | KBKind;

const KIND_STYLE: Record<KBKind, { tone: string; label: string }> = {
  article: { tone: "slate", label: "Статья" },
  video: { tone: "rose", label: "Видео" },
  presentation: { tone: "amber", label: "Презентация" },
};

function Cover({ a }: { a: KBArticle }) {
  if (a.kind === "video") {
    return (
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-rose-900">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-rose-500/30 blur-2xl" />
        <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900 shadow-xl transition group-hover:scale-110"><Play size={22} className="ml-0.5" fill="currentColor" /></span>
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-white">{a.duration ?? a.readingTime}</span>
        <p className="absolute left-3 top-3 text-[10px] font-bold uppercase tracking-widest text-rose-200">Видеоуроки Гильдии</p>
      </div>
    );
  }
  if (a.kind === "presentation") {
    const s = a.slides?.[0];
    return (
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-900 to-emerald-900 p-4 text-white">
        <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-emerald-500/30 blur-2xl" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Презентация · {a.slides?.length ?? 0} слайдов</p>
        <p className="mt-2 line-clamp-3 text-base font-extrabold leading-tight">{s?.title ?? a.title}</p>
        <div className="absolute bottom-3 left-4 flex gap-1">{(a.slides ?? []).slice(0, 8).map((_, i) => <span key={i} className={`h-1 w-4 rounded-full ${i === 0 ? "bg-emerald-400" : "bg-white/25"}`} />)}</div>
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/6] overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-4">
      <FileText size={34} className="text-indigo-300" />
      <p className="absolute bottom-3 left-4 text-[10px] font-bold uppercase tracking-widest text-indigo-400">Статья · {a.readingTime}</p>
    </div>
  );
}

export default function KnowledgePage() {
  const { state, can, currentUser, pushToast, addArticle, removeArticle } = useGuild();
  const [tab, setTab] = useState<Tab>("all");
  const [cat, setCat] = useState("all");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState("new");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(9);
  const [createOpen, setCreateOpen] = useState(false);

  const counts = useMemo(
    () => ({ all: state.articles.length, article: state.articles.filter((a) => a.kind === "article").length, video: state.articles.filter((a) => a.kind === "video").length, presentation: state.articles.filter((a) => a.kind === "presentation").length }),
    [state.articles]
  );

  const list = useMemo(() => {
    let l = state.articles;
    if (tab !== "all") l = l.filter((a) => a.kind === tab);
    if (cat !== "all") l = l.filter((a) => a.category === cat);
    if (level !== "all") l = l.filter((a) => a.level === level);
    if (q.trim()) {
      const qq = q.toLowerCase();
      l = l.filter((a) => (a.title + a.excerpt + a.tags.join(" ") + (a.speaker ?? "")).toLowerCase().includes(qq));
    }
    if (sort === "views") l = [...l].sort((a, b) => b.views - a.views);
    if (sort === "likes") l = [...l].sort((a, b) => b.likes - a.likes);
    return l;
  }, [state.articles, tab, cat, level, sort, q]);

  const featured = [...state.articles].filter((a) => a.kind !== "article").sort((a, b) => b.views - a.views)[0];
  const curator = can("curate_kb");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><BookOpen className="text-indigo-600" /> База знаний</h1>
          <p className="mt-1 text-sm text-slate-500">Статьи, видеозаписи воркшопов и презентации от технаставников и экспертов ЦЭУ · {state.articles.length} материалов</p>
        </div>
        {curator ? <Btn variant="emerald" size="sm" onClick={() => setCreateOpen(true)}><Plus size={15} /> Добавить материал</Btn> : null}
      </div>

      {featured && tab === "all" && !q && cat === "all" && level === "all" ? (
        <Link href={`/knowledge/${featured.id}`}>
          <Card className="group grid overflow-hidden transition hover:shadow-lg md:grid-cols-[1.1fr_1fr]">
            <Cover a={featured} />
            <div className="flex flex-col justify-center p-5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700"><Sparkles size={13} /> Самое популярное · {KIND_LABEL[featured.kind]}</p>
              <h2 className="mt-1.5 text-lg font-extrabold leading-snug">{featured.title}</h2>
              <p className="mt-1.5 line-clamp-3 text-[13px] text-slate-500">{featured.excerpt}</p>
              <p className="mt-3 flex items-center gap-3 text-[11px] text-slate-500"><span className="flex items-center gap-1"><Eye size={12} /> {featured.views}</span><span className="flex items-center gap-1"><Heart size={12} /> {featured.likes}</span><span>{featured.speaker ?? featured.authorName}</span></p>
            </div>
          </Card>
        </Link>
      ) : null}

      <SegTabs
        value={tab}
        onChange={(v) => { setTab(v); setLimit(9); }}
        items={[
          { id: "all", label: "Всё", icon: <BookOpen size={14} />, count: counts.all },
          { id: "article", label: "Статьи", icon: <FileText size={14} />, count: counts.article },
          { id: "video", label: "Видео", icon: <Video size={14} />, count: counts.video },
          { id: "presentation", label: "Презентации", icon: <Presentation size={14} />, count: counts.presentation },
        ]}
      />

      <Card className="p-4">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Поиск</span>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(9); }} placeholder="Заголовок, тег, спикер…" className={`${inputCls} !py-2 !pl-9 !text-xs`} />
            </div>
          </div>
          <SelectBox label="Категория" value={cat} onChange={(v) => { setCat(v); setLimit(9); }} options={[{ v: "all", l: "Все категории" }, ...KB_CATEGORIES.map((c) => ({ v: c, l: c }))]} />
          <SelectBox label="Уровень" value={level} onChange={(v) => { setLevel(v); setLimit(9); }} options={[{ v: "all", l: "Любой уровень" }, { v: "Начальный", l: "Начальный" }, { v: "Средний", l: "Средний" }, { v: "Продвинутый", l: "Продвинутый" }]} />
          <SelectBox label="Сортировка" value={sort} onChange={setSort} options={[{ v: "new", l: "Сначала новые" }, { v: "views", l: "По просмотрам" }, { v: "likes", l: "По оценкам" }]} />
        </div>
      </Card>

      {list.length === 0 ? (
        <EmptyState title="Материалов не найдено" text="Попробуйте другой тип, категорию или формулировку поиска." action={<Btn variant="secondary" size="sm" onClick={() => { setTab("all"); setCat("all"); setLevel("all"); setQ(""); }}>Сбросить фильтры</Btn>} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.slice(0, limit).map((a) => (
              <Card key={a.id} className="group flex flex-col overflow-hidden p-0 transition hover:shadow-lg">
                <Link href={`/knowledge/${a.id}`}><Cover a={a} /></Link>
                <div className="flex-1 p-4">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={KIND_STYLE[a.kind].tone}>{KIND_STYLE[a.kind].label}</Badge>
                    <Badge tone="indigo">{a.category}</Badge>
                    <Badge tone={a.level === "Начальный" ? "emerald" : a.level === "Средний" ? "amber" : "rose"}>{a.level}</Badge>
                  </div>
                  <Link href={`/knowledge/${a.id}`}><h3 className="mt-2 text-[15px] font-extrabold leading-snug hover:text-emerald-700">{a.title}</h3></Link>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">{a.excerpt}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{a.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">#{t}</span>)}</div>
                </div>
                <div className="flex items-center gap-2.5 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                  <Avatar name={a.speaker ?? a.authorName} color="bg-indigo-500" size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{a.speaker ?? a.authorName}</p>
                    <p className="flex items-center gap-2 text-[11px] text-slate-500"><span className="flex items-center gap-1"><Clock size={10} /> {a.readingTime}</span><span className="flex items-center gap-1"><Eye size={10} /> {a.views}</span><span className="flex items-center gap-1"><Heart size={10} /> {a.likes}</span></p>
                  </div>
                  {curator ? <button onClick={() => { removeArticle(a.id); pushToast({ kind: "info", title: "Материал удалён", text: a.title }); }} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Удалить"><Trash2 size={14} /></button> : null}
                </div>
              </Card>
            ))}
          </div>
          {list.length > limit ? <div className="flex justify-center"><Btn variant="outline" onClick={() => setLimit((l) => l + 9)}>Показать ещё ({list.length - limit})</Btn></div> : null}
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} wide title="Новый материал" subtitle="Статья, видеозапись или презентация">
        <MaterialForm
          onDone={(v) => {
            addArticle({ id: `m-${Date.now()}`, ...v, authorId: currentUser.id, authorName: currentUser.name, authorRole: currentUser.grade, status: "published", createdAt: "только что", likes: 0, views: 1 });
            setCreateOpen(false);
            setTab(v.kind);
            pushToast({ kind: "success", title: `${KIND_LABEL[v.kind]} опубликован(а)!`, text: v.title });
          }}
        />
      </Modal>
    </div>
  );
}
