"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Bell, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardList, Info, Link2, List } from "lucide-react";
import { useGuild, formatFullRU } from "@/lib/store";
import type { DailyReport, Project } from "@/lib/types";
import { Avatar, Badge, Btn, Card, Field, Modal, inputCls } from "@/components/ui";
import {
  IDLE_REASONS,
  MOODS,
  dailyStat,
  dayState,
  fmt,
  isWeekday,
  isoLocal,
  scoreDaily,
  sprintEnd,
  sprintOfDate,
  todayISO,
  weekOfSprint,
  type DayKind,
} from "@/lib/scoring";

const WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

const DOT: Record<DayKind, string> = {
  ok: "bg-emerald-500",
  partial: "bg-amber-400",
  missed: "bg-rose-500",
  pending: "bg-slate-300",
  future: "bg-slate-200",
};

export function KindChip({ kind, score }: { kind: DayKind; score: number }) {
  const map: Record<DayKind, { l: string; c: string }> = {
    ok: { l: "Вовремя · 1", c: "bg-emerald-100 text-emerald-700" },
    partial: { l: `${fmt(score)} балла`, c: "bg-amber-100 text-amber-800" },
    missed: { l: "Не сдан · 0", c: "bg-rose-100 text-rose-700" },
    pending: { l: "Ещё можно сдать", c: "bg-slate-100 text-slate-600" },
    future: { l: "Впереди", c: "bg-slate-100 text-slate-400" },
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${map[kind].c}`}>{map[kind].l}</span>;
}

export function DailyCalendar({ project }: { project: Project }) {
  const { state, currentUser, can, addDaily, addEscalation, pushToast } = useGuild();
  const today = todayISO();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [day, setDay] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "feed">("calendar");

  const members = project.team.filter((t) => t.role === "Студент" || t.role === "Гильдиец");
  const names = useMemo(() => new Set(project.team.map((t) => t.name)), [project.team]);
  const sprints = state.sprints.filter((s) => s.projectId === project.id);
  const dailies = state.dailies;
  const isMember = names.has(currentUser.name);
  const isManager = can("manage_projects");
  const activeSprint = sprints.find((s) => today >= s.startDate && today <= sprintEnd(s));

  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const total = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= total; d++) cells.push(isoLocal(new Date(cursor.y, cursor.m, d)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  function shift(delta: number) {
    setCursor((c) => {
      const nm = c.m + delta;
      if (nm < 0) return { y: c.y - 1, m: 11 };
      if (nm > 11) return { y: c.y + 1, m: 0 };
      return { y: c.y, m: nm };
    });
  }

  const dayReports = day ? dailies.filter((d) => d.date === day && names.has(d.userName)) : [];
  const daySprint = day ? sprintOfDate(sprints, day) : undefined;
  const myStat = activeSprint ? dailyStat(currentUser.name, dailies, activeSprint.startDate, sprintEnd(activeSprint), today) : null;
  const alreadyMine = day ? dailies.some((d) => d.userName === currentUser.name && d.date === day) : false;
  const canWrite = can("submit_daily") && isMember && !!day && isWeekday(day) && day <= today && !alreadyMine;
  const notSubmitted = day && day <= today ? members.filter((m) => dayState(m.name, dailies, day, today).kind === "missed" || dayState(m.name, dailies, day, today).kind === "pending") : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-extrabold"><ClipboardList size={18} className="text-amber-600" /> Календарь дейли-отчётов</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Дейли ставятся только в будние дни. Точки в клетке — участники команды: зелёная — вовремя, жёлтая — 0,5, красная — не сдан. Один отчёт в день виден во всех ваших проектах.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"><span className="size-2 rounded-full bg-emerald-500" /> вовремя = 1</span>
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800"><span className="size-2 rounded-full bg-amber-400" /> «ничего не делал» / опоздание = 0,5</span>
          <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700"><span className="size-2 rounded-full bg-rose-500" /> нет отчёта = 0</span>
        </div>
      </div>

      <div className="flex gap-1.5">
        <button onClick={() => setView("calendar")} className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-bold ${view === "calendar" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}><CalendarDays size={15} /> Календарь</button>
        <button onClick={() => setView("feed")} className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-bold ${view === "feed" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}><List size={15} /> Лента отчётов</button>
      </div>

      {/* Sprint summary */}
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        {view === "feed" ? <Feed project={project} members={members.map((m) => m.name)} /> : (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => shift(-1)} className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50" aria-label="Прошлый месяц"><ChevronLeft size={16} /></button>
            <p className="min-w-40 text-center font-extrabold">{MONTHS[cursor.m]} {cursor.y}</p>
            <button onClick={() => shift(1)} className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50" aria-label="Следующий месяц"><ChevronRight size={16} /></button>
            <Btn variant="ghost" size="sm" onClick={() => setCursor({ y: now.getFullYear(), m: now.getMonth() })}>Сегодня</Btn>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-1.5">
            {WD.map((w, i) => <div key={w} className={`pb-1 text-center text-[11px] font-bold uppercase ${i > 4 ? "text-slate-300" : "text-slate-400"}`}>{w}</div>)}
            {grid.map((date, i) => {
              if (!date) return <div key={`e${i}`} className="min-h-16 rounded-xl bg-slate-50/40" />;
              const dnum = Number(date.slice(8, 10));
              if (!isWeekday(date)) {
                return (
                  <div key={date} className="min-h-16 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-1.5">
                    <span className="text-[11px] font-bold text-slate-300">{dnum}</span>
                    <p className="mt-1 text-[9px] font-semibold uppercase text-slate-300">выходной</p>
                  </div>
                );
              }
              const states = members.map((m) => dayState(m.name, dailies, date, today));
              const done = states.filter((s) => s.kind === "ok" || s.kind === "partial").length;
              const sp = sprintOfDate(sprints, date);
              const isToday = date === today;
              const monday = new Date(date + "T00:00:00").getDay() === 1;
              return (
                <button
                  key={date}
                  onClick={() => setDay(date)}
                  className={`group relative flex min-h-16 flex-col rounded-xl border p-1.5 text-left transition hover:border-amber-400 hover:shadow-md sm:min-h-20 ${isToday ? "border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-200" : "border-slate-200 bg-white"}`}
                >
                  <span className="flex items-center justify-between">
                    <span className={`text-xs font-extrabold ${isToday ? "text-emerald-700" : "text-slate-700"}`}>{dnum}</span>
                    {sp && monday ? <span className="rounded bg-indigo-50 px-1 text-[9px] font-bold text-indigo-600">С{sp.number}·н{weekOfSprint(sp, date)}</span> : null}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-0.5">
                    {states.map((s, k) => <span key={k} className={`size-1.5 rounded-full ${DOT[s.kind]}`} />)}
                  </span>
                  {members.length ? <span className="mt-auto text-[10px] font-bold text-slate-400">{date <= today ? `${done}/${members.length}` : ""}</span> : null}
                </button>
              );
            })}
          </div>
        </Card>
        )}

        <div className="space-y-3">
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{activeSprint ? `${activeSprint.title} · баллы за дейли` : "Активного спринта нет"}</p>
            {activeSprint && myStat && isMember ? (
              <div className="mt-2">
                <p className="text-3xl font-extrabold text-emerald-600">{fmt(myStat.points)}<span className="text-base font-bold text-slate-400"> / {myStat.max}</span></p>
                <p className="text-[11px] text-slate-500">вовремя: {myStat.onTime} · 0,5 б.: {myStat.partial} · пропущено: {myStat.missed}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Личные баллы видны участникам команды проекта.</p>
            )}
            {activeSprint ? (
              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                {members.map((m) => {
                  const st = dailyStat(m.name, dailies, activeSprint.startDate, sprintEnd(activeSprint), today);
                  return (
                    <div key={m.name} className="flex items-center gap-2 text-xs">
                      <Avatar name={m.name} color="bg-slate-700" size="sm" />
                      <span className="min-w-0 flex-1 truncate font-semibold">{m.name}</span>
                      <span className="font-extrabold">{fmt(st.points)}<span className="text-slate-400">/{st.max}</span></span>
                    </div>
                  );
                })}
                {members.length === 0 ? <p className="text-xs text-slate-400">В команде пока нет студентов и гильдийцев.</p> : null}
              </div>
            ) : null}
          </Card>
          <Card className="border-sky-200 bg-sky-50/50 p-4">
            <p className="flex items-center gap-2 text-xs font-extrabold text-sky-800"><Info size={14} /> Как считаются баллы</p>
            <ul className="mt-2 space-y-1 text-[11px] leading-snug text-sky-900/80">
              <li>• 1 балл — отчёт сдан вовремя в рабочий день;</li>
              <li>• 0,5 — написали, что ничего не делали (или сдали с опозданием);</li>
              <li>• 0 — отчёта нет в будний день.</li>
              <li>• Баллы суммируются с оценкой наставника за спринт (4 критерия × 5) и дают процент в лидерборде.</li>
            </ul>
          </Card>
        </div>
      </div>

      <Modal
        open={!!day}
        onClose={() => setDay(null)}
        wide
        title={day ? formatFullRU(day) : ""}
        subtitle={`${project.name}${daySprint && day ? ` · ${daySprint.title}, неделя ${weekOfSprint(daySprint, day)}` : ""}`}
      >
        {day ? (
          <div className="space-y-3">
            {members.length > 0 && day <= today ? (
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Участники команды</p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {members.map((m) => {
                    const st = dayState(m.name, dailies, day, today);
                    return (
                      <div key={m.name} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2">
                        <Avatar name={m.name} color="bg-slate-700" size="sm" />
                        <span className="min-w-0 flex-1 truncate text-xs font-bold">{m.name}</span>
                        <KindChip kind={st.kind} score={st.score} />
                      </div>
                    );
                  })}
                </div>
                {isManager && notSubmitted.length > 0 ? (
                  <Btn variant="secondary" size="sm" className="mt-2" onClick={() => pushToast({ kind: "success", title: "Напоминание отправлено", text: `Не сдали дейли: ${notSubmitted.map((m) => m.name).join(", ")}` })}>
                    <Bell size={14} /> Напомнить не сдавшим ({notSubmitted.length})
                  </Btn>
                ) : null}
              </div>
            ) : null}

            {dayReports.map((r) => {
              const hasBlocker = r.blockers && !r.blockers.toLowerCase().includes("нет");
              return (
                <div key={r.id} className={`rounded-2xl border p-3.5 ${hasBlocker ? "border-amber-300 bg-amber-50/50" : "border-slate-200"}`}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Avatar name={r.userName} color="bg-emerald-600" size="sm" />
                    <p className="text-[13px] font-bold">{r.userName} <span className="font-medium text-slate-400">· {r.userRole}</span></p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.score >= 1 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{fmt(r.score)} б.</span>
                    {r.mode === "idle" ? <Badge tone="amber">Ничего не делал</Badge> : null}
                    {r.mood ? <span title={MOODS.find((m) => m.id === r.mood)?.label}>{MOODS.find((m) => m.id === r.mood)?.emoji}</span> : null}
                    {hasBlocker ? <Badge tone="amber"><AlertTriangle size={11} /> Блокер</Badge> : null}
                    <span className="ml-auto text-[10px] text-slate-400">сдан {r.submittedAt.replace("T", " ")}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs leading-relaxed">
                    {r.mode === "idle" ? <p><b className="text-slate-700">Причина:</b> {r.reason ?? "не указана"}</p> : <p><b className="text-slate-700">Вчера:</b> {r.yesterday}</p>}
                    <p><b className="text-slate-700">Сегодня:</b> {r.today}</p>
                    <p><b className="text-slate-700">Блокеры:</b> <span className={hasBlocker ? "font-semibold text-amber-700" : ""}>{r.blockers}</span></p>
                    {r.hours || r.link ? <p className="flex flex-wrap items-center gap-3 text-slate-500">{r.hours ? <span>⏱ {r.hours} ч вчера</span> : null}{r.link ? <span className="flex items-center gap-1"><Link2 size={12} /> {r.link}</span> : null}</p> : null}
                  </div>
                </div>
              );
            })}
            {dayReports.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">В этот день отчётов нет</p> : null}

            {canWrite ? (
              <DailyForm
                day={day}
                today={today}
                onSave={(vals) => {
                  const res = scoreDaily({ date: day, submittedDate: today, yesterday: vals.y, mode: vals.mode });
                  const blockerText = vals.mode === "work" ? vals.b.trim() : "";
                  addDaily({
                    id: `dl-${currentUser.id}-${day}`,
                    projectId: project.id,
                    projectName: project.name,
                    userId: currentUser.id,
                    userName: currentUser.name,
                    userRole: currentUser.grade,
                    date: day,
                    yesterday: vals.mode === "idle" ? `Ничего не делал(а) — ${vals.reason.toLowerCase()}${vals.reasonNote ? `: ${vals.reasonNote.trim()}` : ""}.` : vals.y.trim(),
                    today: vals.t.trim(),
                    blockers: blockerText || "Нет блокеров.",
                    submittedAt: `${today}T${new Date().toTimeString().slice(0, 5)}`,
                    score: res.score,
                    mode: vals.mode,
                    reason: vals.mode === "idle" ? (vals.reason === "Другое" && vals.reasonNote.trim() ? `Другое: ${vals.reasonNote.trim()}` : vals.reason) : undefined,
                    mood: vals.mode === "work" ? vals.mood : undefined,
                    hours: vals.mode === "work" ? vals.hours : 0,
                    link: vals.link.trim() || undefined,
                  });
                  if (blockerText && vals.escalate !== "none") {
                    addEscalation({
                      id: `esc-${Date.now()}`,
                      projectId: project.id,
                      projectName: project.name,
                      type: vals.escalate,
                      title: `Блокер из дейли: ${blockerText.slice(0, 60)}`,
                      description: blockerText,
                      steps: `Дейли за ${day}`,
                      links: vals.link.trim(),
                      authorName: currentUser.name,
                      status: "new",
                      createdAt: today,
                    });
                  }
                  pushToast({ kind: "success", title: `Дейли сохранён: +${fmt(res.score)} б.`, text: blockerText && vals.escalate !== "none" ? `${res.reason}. Блокер эскалирован автоматически.` : res.reason });
                  setDay(null);
                }}
              />
            ) : (
              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                {!isWeekday(day)
                  ? "Выходной: дейли ставятся только в будни."
                  : day > today
                    ? "Будущие дни: отчёт можно сдать в сам день."
                    : alreadyMine
                      ? "Ваш отчёт за этот день уже сдан — повторно отправить нельзя, баллы засчитаны."
                      : !isMember
                        ? "Дейли пишут участники команды проекта. Ваша роль здесь — просмотр."
                        : "Для вашей роли добавление дейли недоступно."}
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

type FormVals = { mode: "work" | "idle"; y: string; t: string; b: string; reason: string; reasonNote: string; mood: "good" | "risk" | "blocked"; hours: number; link: string; escalate: "none" | "tech" | "org" | "hr" };

function DailyForm({ day, today, onSave }: { day: string; today: string; onSave: (v: FormVals) => void }) {
  const [mode, setMode] = useState<"work" | "idle">("work");
  const [y, setY] = useState("");
  const [t, setT] = useState("");
  const [hasBlock, setHasBlock] = useState(false);
  const [b, setB] = useState("");
  const [reason, setReason] = useState<string>(IDLE_REASONS[0]);
  const [reasonNote, setReasonNote] = useState("");
  const [mood, setMood] = useState<"good" | "risk" | "blocked">("good");
  const [hours, setHours] = useState(2);
  const [link, setLink] = useState("");
  const [escalate, setEscalate] = useState<"none" | "tech" | "org" | "hr">("none");
  const preview = scoreDaily({ date: day, submittedDate: today, yesterday: y, mode });
  const tone = preview.score >= 1 ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-amber-200";
  const valid = mode === "work"
    ? y.trim().length >= 15 && t.trim().length >= 5 && (!hasBlock || b.trim().length >= 5)
    : t.trim().length >= 5 && (reason !== "Другое" || reasonNote.trim().length >= 5);

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
      <p className="text-sm font-extrabold">Мой отчёт за этот день</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => setMode("work")} className={`rounded-xl border p-3 text-left transition ${mode === "work" ? "border-emerald-500 bg-white ring-2 ring-emerald-100" : "border-slate-200 bg-white/60 hover:border-slate-300"}`}>
          <span className="block text-sm font-extrabold">✍️ Есть о чём написать</span>
          <span className="text-[11px] text-slate-500">Что сделал, что планируешь, блокеры · 1 балл</span>
        </button>
        <button type="button" onClick={() => setMode("idle")} className={`rounded-xl border p-3 text-left transition ${mode === "idle" ? "border-amber-400 bg-white ring-2 ring-amber-100" : "border-slate-200 bg-white/60 hover:border-slate-300"}`}>
          <span className="block text-sm font-extrabold">💤 Ничего не делал(а)</span>
          <span className="text-[11px] text-slate-500">Выбери причину · 0,5 балла</span>
        </button>
      </div>

      {mode === "work" ? (
        <div className="mt-3 space-y-2.5">
          <Field label="1. Что сделал вчера?" hint={`${y.trim().length}/15 символов минимум — опишите результат, а не процесс`}><textarea value={y} onChange={(e) => setY(e.target.value)} rows={2} className={inputCls} placeholder="Закрыл PR по бронированию слотов, поправил замечания ревью…" /></Field>
          <Field label="2. Что сделаю сегодня?"><textarea value={t} onChange={(e) => setT(e.target.value)} rows={2} className={inputCls} placeholder="Беру следующую цель спринта…" /></Field>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label={`Потрачено вчера: ${hours} ч`}><input type="range" min={1} max={8} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full accent-emerald-600" /></Field>
            <Field label="Ссылка на PR / задачу (необязательно)"><input value={link} onChange={(e) => setLink(e.target.value)} className={inputCls} placeholder="github.com/…/pull/142" /></Field>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Как идёт работа</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button key={m.id} type="button" onClick={() => { setMood(m.id); if (m.id === "blocked") setHasBlock(true); }} className={`rounded-xl border px-3 py-2 text-xs font-bold ${mood === m.id ? "border-slate-900 bg-white ring-2 ring-slate-200" : "border-slate-200 bg-white/60 text-slate-600"}`}>{m.emoji} {m.label}</button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
            <input type="checkbox" checked={hasBlock} onChange={(e) => { setHasBlock(e.target.checked); if (!e.target.checked) setEscalate("none"); }} className="accent-amber-600" /> У меня есть блокер
          </label>
          {hasBlock ? (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <Field label="3. Что мешает?"><textarea value={b} onChange={(e) => setB(e.target.value)} rows={2} className={inputCls} placeholder="Жду ТЗ по QR-подтверждению от аналитика…" /></Field>
              <Field label="Эскалировать автоматически?" hint="Эскалация создастся вместе с отчётом, по иерархии Гильдии">
                <select value={escalate} onChange={(e) => setEscalate(e.target.value as "none" | "tech" | "org" | "hr")} className={inputCls}>
                  <option value="none">Нет, только отметить в отчёте</option>
                  <option value="tech">Техническая → технаставник</option>
                  <option value="org">Организационная → наставник / СГ</option>
                  <option value="hr">HR / конфликт → орг. отдел</option>
                </select>
              </Field>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Почему ничего не получилось сделать?</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {IDLE_REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)} className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${reason === r ? "border-amber-400 bg-white ring-2 ring-amber-100" : "border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300"}`}>{r}</button>
              ))}
            </div>
          </div>
          {reason === "Другое" || reason === "Ждал(а) ТЗ или ответа от наставника" ? (
            <Field label={reason === "Другое" ? "Опишите причину" : "Уточнение (необязательно)"}><input value={reasonNote} onChange={(e) => setReasonNote(e.target.value)} className={inputCls} placeholder={reason === "Другое" ? "Что произошло?" : "От кого ждали и чего"} /></Field>
          ) : null}
          <Field label="Что сделаю сегодня?"><textarea value={t} onChange={(e) => setT(e.target.value)} rows={2} className={inputCls} placeholder="План на сегодня, чтобы вернуться в ритм" /></Field>
        </div>
      )}

      <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold ring-1 ${tone}`}>Этот отчёт принесёт: {preview.reason}</p>
      <Btn variant="emerald" className="mt-3 w-full" disabled={!valid} onClick={() => onSave({ mode, y, t, b: hasBlock ? b : "", reason, reasonNote, mood, hours, link, escalate: hasBlock ? escalate : "none" })}>
        <Check size={16} /> Сохранить отчёт
      </Btn>
    </div>
  );
}

function Feed({ project, members }: { project: Project; members: string[] }) {
  const { state } = useGuild();
  const [who, setWho] = useState("all");
  const [kind, setKind] = useState("all");
  const [limit, setLimit] = useState(8);
  const names = new Set(project.team.map((t) => t.name));
  let list: DailyReport[] = state.dailies.filter((d) => names.has(d.userName)).sort((a, b) => b.date.localeCompare(a.date) || b.submittedAt.localeCompare(a.submittedAt));
  if (who !== "all") list = list.filter((d) => d.userName === who);
  if (kind === "blockers") list = list.filter((d) => d.blockers && !d.blockers.toLowerCase().includes("нет"));
  if (kind === "idle") list = list.filter((d) => d.mode === "idle");
  if (kind === "late") list = list.filter((d) => d.score < 1 && d.mode !== "idle");
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={who} onChange={(e) => { setWho(e.target.value); setLimit(8); }} className={`${inputCls} !w-auto !py-2 !text-xs`}>
          <option value="all">Все участники</option>
          {members.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={kind} onChange={(e) => { setKind(e.target.value); setLimit(8); }} className={`${inputCls} !w-auto !py-2 !text-xs`}>
          <option value="all">Все отчёты</option>
          <option value="blockers">Только с блокерами</option>
          <option value="idle">«Ничего не делал»</option>
          <option value="late">С опозданием (0,5)</option>
        </select>
        <span className="ml-auto text-xs font-bold text-slate-500">Найдено: {list.length}</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {list.slice(0, limit).map((r) => {
          const hasBlocker = r.blockers && !r.blockers.toLowerCase().includes("нет");
          return (
            <div key={r.id} className={`rounded-2xl border p-3.5 ${hasBlocker ? "border-amber-300 bg-amber-50/50" : "border-slate-200"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Avatar name={r.userName} color="bg-emerald-600" size="sm" />
                <p className="text-[13px] font-bold">{r.userName} <span className="font-medium text-slate-400">· {formatFullRU(r.date)}</span></p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.score >= 1 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{fmt(r.score)} б.</span>
                {r.mode === "idle" ? <Badge tone="amber">Ничего не делал</Badge> : null}
                {hasBlocker ? <Badge tone="amber"><AlertTriangle size={11} /> Блокер</Badge> : null}
              </div>
              <div className="mt-2 space-y-1 text-xs leading-relaxed">
                {r.mode === "idle" ? <p><b className="text-slate-700">Причина:</b> {r.reason ?? "не указана"}</p> : <p><b className="text-slate-700">Вчера:</b> {r.yesterday}</p>}
                <p><b className="text-slate-700">Сегодня:</b> {r.today}</p>
                {hasBlocker ? <p><b className="text-slate-700">Блокеры:</b> <span className="font-semibold text-amber-700">{r.blockers}</span></p> : null}
              </div>
            </div>
          );
        })}
        {list.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">По выбранным фильтрам отчётов нет</p> : null}
        {list.length > limit ? <div className="flex justify-center"><Btn variant="outline" size="sm" onClick={() => setLimit((l) => l + 8)}>Показать ещё ({list.length - limit})</Btn></div> : null}
      </div>
    </Card>
  );
}
