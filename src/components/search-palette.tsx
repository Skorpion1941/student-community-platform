"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Briefcase, CalendarDays, CornerDownLeft, FolderKanban, Home, Search, UserRound } from "lucide-react";
import { useGuild } from "@/lib/store";
import { NAV_BY_ROLE } from "@/lib/rbac";

interface Item {
  id: string;
  group: string;
  title: string;
  sub: string;
  href: string;
}

const PAGES = [
  { id: "home", title: "Главная", sub: "Лендинг, карьерный курс, проекты", href: "/" },
  { id: "cabinet", title: "Личный кабинет", sub: "Профиль, баллы, роадмап, панель роли", href: "/cabinet" },
  { id: "projects", title: "Проекты", sub: "Воркспейсы, дорожные карты, дейли", href: "/projects" },
  { id: "vacancies", title: "Вакансии", sub: "Умный подбор и записи на собеседования", href: "/vacancies" },
  { id: "knowledge", title: "База знаний", sub: "Статьи, гайды, регламенты", href: "/knowledge" },
  { id: "events", title: "Мероприятия", sub: "Календарь по месяцам", href: "/events" },
];

const ICON: Record<string, React.ReactNode> = {
  Страницы: <Home size={15} />,
  Вакансии: <Briefcase size={15} />,
  Проекты: <FolderKanban size={15} />,
  Статьи: <BookOpen size={15} />,
  События: <CalendarDays size={15} />,
  Люди: <UserRound size={15} />,
};

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <PaletteInner onClose={onClose} />;
}

function PaletteInner({ onClose }: { onClose: () => void }) {
  const { state, role } = useGuild();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, []);

  const items = useMemo<Item[]>(() => {
    const allowed = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.guest;
    const all: Item[] = [
      ...PAGES.filter((p) => allowed.includes(p.id)).map((p) => ({ ...p, group: "Страницы" })),
      ...state.vacancies.map((v) => ({ id: v.id, group: "Вакансии", title: v.title, sub: `${v.projectName} · ${v.grade} · ${v.spec}`, href: `/vacancies/${v.id}` })),
      ...state.projects.map((p) => ({ id: p.id, group: "Проекты", title: p.name, sub: `${p.status} · ${p.typeLabel}`, href: `/projects/${p.id}` })),
      ...state.articles.map((a) => ({ id: a.id, group: "Статьи", title: a.title, sub: `${a.category} · ${a.tags.join(", ")}`, href: `/knowledge/${a.id}` })),
      ...state.events.map((e) => ({ id: e.id, group: "События", title: e.title, sub: `${e.date.slice(8, 10)}.${e.date.slice(5, 7)} ${e.time} · ${e.type}`, href: "/events" })),
      ...(role === "admin" || role === "mentor" || role === "techmentor"
        ? state.users.map((u) => ({ id: u.id, group: "Люди", title: u.name, sub: `${u.grade} · ${u.spec}`, href: "/cabinet" }))
        : []),
    ];
    const query = q.trim().toLowerCase();
    if (!query) {
      return [...all.filter((i) => i.group === "Страницы"), ...all.filter((i) => i.group === "Вакансии").slice(0, 3), ...all.filter((i) => i.group === "Статьи").slice(0, 3)];
    }
    return all.filter((i) => (i.title + " " + i.sub).toLowerCase().includes(query)).slice(0, 14);
  }, [q, state, role]);

  const safeIdx = Math.min(idx, Math.max(items.length - 1, 0));

  function go(item?: Item) {
    if (!item) return;
    router.push(item.href);
    onClose();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(items[safeIdx]); }
    else if (e.key === "Escape") onClose();
  }

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/50 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={onKey}
            placeholder="Вакансии, проекты, статьи, события…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">Esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">Ничего не найдено по запросу «{q}»</p>
          ) : (
            items.map((it, i) => {
              const header = it.group !== lastGroup;
              lastGroup = it.group;
              return (
                <React.Fragment key={`${it.group}-${it.id}`}>
                  {header ? <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{it.group}</p> : null}
                  <button
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => go(it)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${i === safeIdx ? "bg-emerald-50" : ""}`}
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${i === safeIdx ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>{ICON[it.group]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold">{it.title}</span>
                      <span className="block truncate text-[11px] text-slate-500">{it.sub}</span>
                    </span>
                    {i === safeIdx ? <CornerDownLeft size={14} className="text-emerald-600" /> : null}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-semibold text-slate-400">
          <span>↑↓ навигация</span>
          <span>Enter — открыть</span>
          <span className="ml-auto">⌘K / Ctrl+K — поиск из любого места</span>
        </div>
      </div>
    </div>
  );
}
