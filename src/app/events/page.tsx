"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useGuild, formatFullRU } from "@/lib/store";
import { Avatar, Badge, Btn, Card, Field, Modal, inputCls } from "@/components/ui";
import type { EventItem } from "@/lib/types";

const WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function EventsPage() {
  const { state, can, currentUser, pushToast, addEvent, removeEvent, joinEvent } = useGuild();
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [filter, setFilter] = useState<"all" | "edu" | "work">("all");
  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<EventItem | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);

  const events = useMemo(() => {
    let l = [...state.events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (filter !== "all") l = l.filter((e) => e.category === filter);
    return l;
  }, [state.events, filter]);

  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: { date: string | null; day: number | null }[] = [];
    for (let i = 0; i < offset; i++) cells.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: iso(cursor.y, cursor.m, d), day: d });
    while (cells.length % 7 !== 0) cells.push({ date: null, day: null });
    return cells;
  }, [cursor]);

  const monthEvents = events.filter((e) => e.date.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}`));
  const dayEvents = dayOpen ? events.filter((e) => e.date === dayOpen) : [];
  const monthLabel = `${MONTHS[cursor.m]} ${cursor.y}`;
  const isCurrentMonth = cursor.y === today.getFullYear() && cursor.m === today.getMonth();

  function shift(delta: number) {
    setCursor((c) => {
      const nm = c.m + delta;
      if (nm < 0) return { y: c.y - 1, m: 11 };
      if (nm > 11) return { y: c.y + 1, m: 0 };
      return { y: c.y, m: nm };
    });
  }

  const stats = [
    { l: "Обучающих", v: events.filter((e) => e.category === "edu").length, c: "text-violet-600" },
    { l: "Проектных", v: events.filter((e) => e.category === "work").length, c: "text-emerald-600" },
    { l: "В этом месяце", v: monthEvents.length, c: "text-slate-900" },
    { l: "Участников всего", v: events.reduce((n, e) => n + e.attendees.length, 0), c: "text-indigo-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <CalendarDays className="text-violet-600" /> Мероприятия Гильдии
          </h1>
          <p className="mt-1 text-sm text-slate-500">Единый календарь: обучающие лекции и воркшопы · проектные дейли, ретро и демо. Нажмите на день, чтобы открыть события.</p>
        </div>
        <div className="flex gap-2">
          {can("curate_kb") || can("manage_projects") ? (
            <Btn variant="emerald" size="sm" onClick={() => setCreateDate(iso(cursor.y, cursor.m, Math.min(today.getDate() + 1, 28)))}>
              <Plus size={15} /> Создать мероприятие
            </Btn>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.l} className="p-4">
            <p className={`text-2xl font-extrabold ${s.c}`}>{s.v}</p>
            <p className="text-[11px] text-slate-500">{s.l}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => shift(-1)} className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50" aria-label="Предыдущий месяц">
              <ChevronLeft size={16} />
            </button>
            <p className="min-w-44 text-center text-lg font-extrabold">{monthLabel}</p>
            <button onClick={() => shift(1)} className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50" aria-label="Следующий месяц">
              <ChevronRight size={16} />
            </button>
            {!isCurrentMonth ? (
              <Btn variant="ghost" size="sm" onClick={() => setCursor({ y: today.getFullYear(), m: today.getMonth() })}>
                Сегодня
              </Btn>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { id: "all", l: "Все" },
              { id: "edu", l: "🎓 Обучающие" },
              { id: "work", l: "💼 Проектные" },
            ] as const).map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === f.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-2">
          {WD.map((w) => (
            <div key={w} className="pb-1 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {w}
            </div>
          ))}
          {grid.map((cell, i) => {
            if (!cell.date) return <div key={`e${i}`} className="min-h-20 rounded-xl bg-slate-50/50" />;
            const evs = events.filter((e) => e.date === cell.date);
            const isToday = cell.date === today.toISOString().slice(0, 10);
            return (
              <button
                key={cell.date}
                onClick={() => setDayOpen(cell.date!)}
                className={`group flex min-h-20 flex-col rounded-xl border p-1.5 text-left transition hover:border-violet-400 hover:shadow-md sm:min-h-28 ${
                  isToday ? "border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-200" : "border-slate-200 bg-white"
                }`}
              >
                <span className={`text-xs font-extrabold ${isToday ? "text-emerald-700" : "text-slate-700"}`}>{cell.day}</span>
                <div className="mt-1 flex flex-1 flex-col gap-1 overflow-hidden">
                  {evs.slice(0, 2).map((e) => (
                    <span
                      key={e.id}
                      className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-tight ${
                        e.category === "edu" ? "bg-violet-100 text-violet-800" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {e.time} {e.title}
                    </span>
                  ))}
                  {evs.length > 2 ? <span className="text-[10px] font-bold text-slate-400">+{evs.length - 2} ещё</span> : null}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-violet-500" /> Обучающие (лекции, воркшопы, МК)</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500" /> Проектные (дейли, ретро, демо)</span>
          <span className="ml-auto">Клик по дню → список событий и запись</span>
        </div>
      </Card>

      {/* Upcoming list */}
      <div>
        <h2 className="font-extrabold">Ближайшие события</h2>
        <div className="mt-2 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {events.slice(0, 6).map((e) => (
            <Card key={e.id} className="cursor-pointer p-4 hover:shadow-md" >
              <div onClick={() => setDetail(e)}>
                <div className="flex items-center gap-2">
                  <Badge tone={e.category === "edu" ? "violet" : "emerald"}>{e.category === "edu" ? "Обучающее" : "Проектное"}</Badge>
                  <Badge tone="slate">{e.type}</Badge>
                </div>
                <p className="mt-2 text-sm font-extrabold leading-snug">{e.title}</p>
                <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <Clock size={11} /> {e.date.slice(8, 10)}.{e.date.slice(5, 7)} · {e.time} · {e.duration}
                </p>
                <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-500"><Users size={11} /> {e.attendees.length} участников · {e.speaker}</p>
              </div>
              <div className="mt-2 flex gap-2">
                {e.attendees.includes(currentUser.name) ? (
                  <Badge tone="emerald"><Check size={11} /> Вы записаны</Badge>
                ) : (
                  <Btn variant="secondary" size="sm" onClick={() => { joinEvent(e.id, currentUser.name); pushToast({ kind: "success", title: "Вы записаны!", text: `${e.title}` }); }}>
                    Участвовать
                  </Btn>
                )}
                <Btn variant="ghost" size="sm" onClick={() => setDetail(e)}>Подробнее</Btn>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Day popup */}
      <Modal
        open={!!dayOpen}
        onClose={() => setDayOpen(null)}
        wide
        title={dayOpen ? formatFullRU(dayOpen) : ""}
        subtitle={dayEvents.length ? `${dayEvents.length} событие(й) в этот день` : "Событий не запланировано"}
      >
        <div className="space-y-3">
          {dayEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="font-bold text-slate-700">День свободен</p>
              <p className="mt-1 text-xs text-slate-500">Можно запланировать дейли, ретро, воркшоп или мастер-класс.</p>
              {can("curate_kb") || can("manage_projects") ? (
                <Btn variant="emerald" size="sm" className="mt-3" onClick={() => { setCreateDate(dayOpen); setDayOpen(null); }}>
                  <Plus size={14} /> Создать событие на этот день
                </Btn>
              ) : null}
            </div>
          ) : (
            dayEvents.map((e) => (
              <div key={e.id} className={`rounded-2xl border p-4 ${e.category === "edu" ? "border-violet-200 bg-violet-50/40" : "border-emerald-200 bg-emerald-50/40"}`}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={e.category === "edu" ? "violet" : "emerald"}>{e.category === "edu" ? "Обучающее" : "Проектное"}</Badge>
                  <Badge tone="slate">{e.type}</Badge>
                  {e.projectName ? <Badge tone="sky">{e.projectName}</Badge> : null}
                  {(can("curate_kb") || can("manage_projects")) ? (
                    <button onClick={() => { removeEvent(e.id); pushToast({ kind: "info", title: "Событие удалено" }); }} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 text-[15px] font-extrabold">{e.title}</p>
                <p className="mt-1 text-[13px] text-slate-600">{e.description}</p>
                <div className="mt-2 grid gap-1.5 text-xs text-slate-600 sm:grid-cols-2">
                  <p className="flex items-center gap-1.5"><Clock size={13} /> {e.time} · {e.duration}</p>
                  <p className="flex items-center gap-1.5"><MapPin size={13} /> {e.location}</p>
                  <p className="flex items-center gap-1.5"><Video size={13} /> {e.speaker}</p>
                  <p className="flex items-center gap-1.5"><Users size={13} /> {e.attendees.length} участников</p>
                </div>
                {e.attendees.length ? (
                  <div className="mt-2 flex -space-x-2">
                    {e.attendees.slice(0, 6).map((a, i) => <Avatar key={i} name={a} color="bg-slate-600" size="sm" />)}
                  </div>
                ) : null}
                <div className="mt-3 flex gap-2">
                  {e.attendees.includes(currentUser.name) ? (
                    <Badge tone="emerald"><Check size={12} /> Вы записаны</Badge>
                  ) : (
                    <Btn variant="emerald" size="sm" onClick={() => { joinEvent(e.id, currentUser.name); pushToast({ kind: "success", title: "Вы записаны!", text: `${e.title} · ${e.time}` }); }}>
                      Записаться
                    </Btn>
                  )}
                  <a href="#" onClick={(ev) => ev.preventDefault()} className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200">
                    Ссылка на встречу
                  </a>
                </div>
              </div>
            ))
          )}
          <div className="flex justify-end">
            <Btn variant="ghost" onClick={() => setDayOpen(null)}><X size={15} /> Закрыть</Btn>
          </div>
        </div>
      </Modal>

      {/* Detail popup for list cards */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? ""} subtitle={detail ? `${detail.type} · ${detail.speaker}` : ""}>
        {detail ? (
          <div className="space-y-3">
            <Badge tone={detail.category === "edu" ? "violet" : "emerald"}>{detail.category === "edu" ? "Обучающее" : "Проектное"}</Badge>
            <p className="text-sm text-slate-600">{detail.description}</p>
            <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm">
              <p><b>Когда:</b> {formatFullRU(detail.date)} в {detail.time} ({detail.duration})</p>
              <p><b>Где:</b> {detail.location}</p>
              {detail.projectName ? <p><b>Проект:</b> {detail.projectName}</p> : null}
              <p><b>Ведущий:</b> {detail.speaker}</p>
            </div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Участники ({detail.attendees.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {detail.attendees.map((a, i) => <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{a}</span>)}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!createDate} onClose={() => setCreateDate(null)} wide title="Новое мероприятие" subtitle="При выборе проекта команда пригласится автоматически">
        <EventForm
          initialDate={createDate ?? ""}
          onDone={(vals) => {
            const proj = state.projects.find((p) => p.id === vals.projectId);
            addEvent({
              id: `e-${Date.now()}`,
              title: vals.title,
              description: vals.description,
              category: vals.category,
              type: vals.type,
              date: vals.date,
              time: vals.time,
              duration: vals.duration,
              location: vals.location,
              link: "https://meet.tpu.ru/guild",
              projectId: vals.projectId || undefined,
              projectName: proj?.name,
              attendees: proj ? proj.team.map((t) => t.name) : [currentUser.name],
              speaker: currentUser.name,
            });
            setCreateDate(null);
            pushToast({ kind: "success", title: "Мероприятие создано!", text: proj ? `Приглашена вся команда «${proj.name}»` : "Событие появилось в календаре." });
          }}
        />
      </Modal>
    </div>
  );
}

function EventForm({
  onDone,
  initialDate,
}: {
  onDone: (v: { title: string; description: string; category: "edu" | "work"; type: string; date: string; time: string; duration: string; location: string; projectId: string }) => void;
  initialDate: string;
}) {
  const { state } = useGuild();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"edu" | "work">("work");
  const [type, setType] = useState("Дейли");
  const [date, setDate] = useState(() => initialDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [time, setTime] = useState("16:00");
  const [duration, setDuration] = useState("1 ч");
  const [location, setLocation] = useState("Онлайн");
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? "");
  const proj = state.projects.find((p) => p.id === projectId);
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <button onClick={() => { setCategory("edu"); setType("Воркшоп"); }} className={`rounded-xl border p-3 text-left ${category === "edu" ? "border-violet-400 bg-violet-50" : "border-slate-200"}`}>
          <span className="text-sm font-extrabold">🎓 Обучающее</span>
          <span className="block text-[11px] text-slate-500">Лекции, воркшопы, мастер-классы, семинары</span>
        </button>
        <button onClick={() => { setCategory("work"); setType("Дейли"); }} className={`rounded-xl border p-3 text-left ${category === "work" ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}>
          <span className="text-sm font-extrabold">💼 Проектное</span>
          <span className="block text-[11px] text-slate-500">Дейли, ретро, планирование, демо</span>
        </button>
      </div>
      <Field label="Название"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Например: Ретро спринта 12" /></Field>
      <Field label="Описание"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} placeholder="Повестка, ожидаемый результат" /></Field>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Тип">
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {(category === "edu" ? ["Лекция", "Воркшоп", "Мастер-класс", "Семинар"] : ["Дейли", "Ретро", "Планирование", "Демо"]).map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Дата"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
        <Field label="Время"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} /></Field>
        <Field label="Длительность"><input value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} /></Field>
        <Field label="Место"><input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} /></Field>
        <Field label="Проект">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
            <option value="">Без привязки</option>
            {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      </div>
      {proj ? (
        <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 ring-1 ring-emerald-200">
          Будут приглашены ({proj.team.length}): {proj.team.map((t) => t.name).join(", ") || "команда формируется"} · ссылка на встречу создастся автоматически
        </p>
      ) : null}
      <Btn variant="emerald" className="w-full" disabled={title.trim().length < 3} onClick={() => onDone({ title: title.trim(), description: description || "Встреча сообщества Гильдии.", category, type, date, time, duration, location, projectId })}>
        Создать событие
      </Btn>
    </div>
  );
}
