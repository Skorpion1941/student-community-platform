"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarDays, ClipboardList, Flag, Inbox, Rocket, ShieldCheck, Sparkles, Trophy, User } from "lucide-react";
import { useGuild, formatDateRU } from "@/lib/store";
import { roleMeta } from "@/lib/rbac";
import { calcMatch } from "@/lib/seed";
import { missingToday, sprintsToGrade } from "@/lib/notifications";
import { fmt, isWeekday, semesterRange, sprintStatusByDate, summarize, todayISO } from "@/lib/scoring";
import { Card } from "@/components/ui";

interface Tile {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: React.ReactNode;
  tone: string;
}

export function TodayPanel() {
  const { role, currentUser, state } = useGuild();
  if (role === "guest") return null;
  const today = todayISO();
  const range = semesterRange(0);
  const tiles: Tile[] = [];

  const nextEvent = [...state.events].filter((e) => e.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  const eventTile: Tile = nextEvent
    ? { label: "Ближайшее событие", value: `${nextEvent.time}`, hint: `${nextEvent.title} · ${formatDateRU(nextEvent.date)}`, href: "/events", icon: <CalendarDays size={18} />, tone: "text-violet-600 bg-violet-50" }
    : { label: "Ближайшее событие", value: "—", hint: "В календаре пока пусто", href: "/events", icon: <CalendarDays size={18} />, tone: "text-violet-600 bg-violet-50" };

  if (role === "intern" || role === "junior") {
    const myProject = state.projects.find((p) => p.team.some((t) => t.name === currentUser.name));
    const done = state.dailies.find((d) => d.userName === currentUser.name && d.date === today);
    const sum = summarize(currentUser.name, state.dailies, state.grades, state.sprints, range, today);
    const board = state.users
      .filter((u) => u.role === "intern" || u.role === "junior")
      .map((u) => ({ n: u.name, p: summarize(u.name, state.dailies, state.grades, state.sprints, range, today).percent }))
      .sort((a, b) => b.p - a.p);
    const place = board.findIndex((b) => b.n === currentUser.name) + 1;
    tiles.push(
      !isWeekday(today)
        ? { label: "Дейли", value: "Выходной", hint: "Дейли ставятся только в будни", href: myProject ? `/projects/${myProject.id}?tab=daily` : "/projects", icon: <ClipboardList size={18} />, tone: "text-slate-500 bg-slate-100" }
        : done
          ? { label: "Дейли сегодня", value: `+${fmt(done.score)} б.`, hint: "Отчёт сдан, баллы начислены", href: myProject ? `/projects/${myProject.id}?tab=daily` : "/projects", icon: <ClipboardList size={18} />, tone: "text-emerald-600 bg-emerald-50" }
          : { label: "Дейли сегодня", value: "Не сдан", hint: "Сдайте вовремя — это 1 балл", href: myProject ? `/projects/${myProject.id}?tab=daily` : "/projects", icon: <ClipboardList size={18} />, tone: "text-amber-600 bg-amber-50" },
      { label: "Мой итоговый %", value: `${sum.percent}%`, hint: place ? `#${place} из ${board.length} · ${fmt(sum.total)} из ${sum.maxTotal} баллов` : "Баллы появятся после первых дейли", href: "/cabinet", icon: <Trophy size={18} />, tone: "text-emerald-600 bg-emerald-50" },
      { label: "Мои ревью", value: String(state.reviews.filter((r) => r.authorName === currentUser.name && r.status !== "done").length), hint: "в работе у технаставников", href: myProject ? `/projects/${myProject.id}` : "/projects", icon: <ShieldCheck size={18} />, tone: "text-sky-600 bg-sky-50" },
      eventTile
    );
  } else if (role === "candidate") {
    const best = state.vacancies.map((v) => ({ v, m: calcMatch(currentUser.skills, v) })).sort((a, b) => b.m - a.m)[0];
    const apps = state.applications.filter((a) => a.userId === currentUser.id && a.status !== "cancelled");
    const booked = apps.find((a) => a.status === "booked");
    const slot = booked ? state.slots.find((s) => s.id === booked.slotId) : undefined;
    tiles.push(
      { label: "Навыки в профиле", value: String(currentUser.skills.length), hint: "Больше навыков — точнее подбор вакансий", href: "/cabinet", icon: <User size={18} />, tone: "text-sky-600 bg-sky-50" },
      slot
        ? { label: "Собеседование", value: slot.time, hint: `${formatDateRU(slot.date)} · ${slot.mentorName}`, href: "/cabinet", icon: <CalendarCheck size={18} />, tone: "text-emerald-600 bg-emerald-50" }
        : { label: "Собеседование", value: "Не записаны", hint: "Выберите вакансию и слот", href: "/vacancies", icon: <CalendarCheck size={18} />, tone: "text-amber-600 bg-amber-50" },
      best ? { label: "Лучший мэтч", value: `${best.m}%`, hint: best.v.title, href: `/vacancies/${best.v.id}`, icon: <Sparkles size={18} />, tone: "text-emerald-600 bg-emerald-50" } : eventTile,
      eventTile
    );
  } else if (role === "mentor") {
    const miss = missingToday(state, currentUser);
    const toGrade = sprintsToGrade(state, currentUser);
    const active = state.sprints.filter((s) => sprintStatusByDate(s) === "active").length;
    tiles.push(
      { label: "Не сдали дейли", value: isWeekday(today) ? String(miss.length) : "—", hint: miss.length ? miss.slice(0, 2).join(", ") : isWeekday(today) ? "Все отчитались" : "Сегодня выходной", href: "/projects", icon: <ClipboardList size={18} />, tone: miss.length ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50" },
      { label: "Активные спринты", value: String(active), hint: "Дорожные карты проектов", href: "/projects", icon: <Flag size={18} />, tone: "text-indigo-600 bg-indigo-50" },
      { label: "Ждут оценки", value: String(toGrade.length), hint: toGrade[0] ? `${toGrade[0].title} и др.` : "Все спринты оценены", href: "/cabinet", icon: <Trophy size={18} />, tone: toGrade.length ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50" },
      eventTile
    );
  } else if (role === "techmentor") {
    tiles.push(
      { label: "Ревью ждут", value: String(state.reviews.filter((r) => r.status === "sent" || r.status === "todo").length), hint: "Канбан ревью в проектах", href: "/projects", icon: <ShieldCheck size={18} />, tone: "text-sky-600 bg-sky-50" },
      { label: "Заявки студентов", value: String(state.requests.filter((r) => r.status === "new").length), hint: "1-on-1, Code Review, воркшопы", href: "/cabinet", icon: <Inbox size={18} />, tone: "text-violet-600 bg-violet-50" },
      { label: "Свободных слотов", value: String(state.slots.filter((s) => s.status === "free").length), hint: `${state.slots.filter((s) => s.status === "booked").length} уже забронировано`, href: "/cabinet", icon: <CalendarCheck size={18} />, tone: "text-emerald-600 bg-emerald-50" },
      eventTile
    );
  } else {
    const wait = state.sprints.filter((s) => sprintStatusByDate(s) === "done" && !s.adminRating).length;
    const rows = state.users.filter((u) => u.role === "intern" || u.role === "junior").map((u) => summarize(u.name, state.dailies, state.grades, state.sprints, range, today).percent);
    const avg = rows.length ? Math.round((rows.reduce((a, b) => a + b, 0) / rows.length) * 10) / 10 : 0;
    tiles.push(
      { label: "Спринты ждут оценки", value: String(wait), hint: "Дорожные карты · оценка админа", href: "/cabinet", icon: <Flag size={18} />, tone: wait ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50" },
      { label: "Средний итоговый %", value: `${avg}%`, hint: "Лидерборд · выгрузка в Excel", href: "/cabinet", icon: <Trophy size={18} />, tone: "text-amber-600 bg-amber-50" },
      { label: "Нерешённые эскалации", value: String(state.escalations.filter((e) => e.status !== "resolved").length), hint: "Проверьте проекты", href: "/projects", icon: <ShieldCheck size={18} />, tone: "text-rose-600 bg-rose-50" },
      { label: "Открытых вакансий", value: String(state.vacancies.length), hint: `${state.vacancies.filter((v) => v.source === "freed").length} освободившихся мест`, href: "/vacancies", icon: <Rocket size={18} />, tone: "text-emerald-600 bg-emerald-50" }
    );
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Мой день</h2>
          <p className="mt-1 text-sm text-slate-500">{currentUser.name} · {roleMeta(role).label} · главное на сегодня</p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href}>
            <Card className="group h-full p-4 transition hover:border-emerald-300 hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className={`grid size-9 place-items-center rounded-xl ${t.tone}`}>{t.icon}</span>
                <ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
              </div>
              <p className="mt-3 text-2xl font-extrabold leading-none">{t.value}</p>
              <p className="mt-1 text-[12px] font-bold text-slate-700">{t.label}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{t.hint}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
