"use client";

import React, { useState } from "react";
import { Activity, AlertTriangle, CalendarClock, CalendarPlus, Check, ClipboardList, ExternalLink, Flag, GitPullRequest, ListChecks, Plus, Siren, Users } from "lucide-react";
import { useGuild, formatDateRU } from "@/lib/store";
import type { Project } from "@/lib/types";
import { Avatar, Badge, Btn, Card, Progress, inputCls } from "@/components/ui";
import { CurrentSprintCard } from "@/components/roadmap";
import { addDays, dayState, fmt, isWeekday, sprintStatusByDate, sprintWorkdays, todayISO } from "@/lib/scoring";

export type TabId = "overview" | "roadmap" | "review" | "daily" | "events" | "team" | "settings";

function relDate(text: string, today: string): string {
  const t = text.toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  if (t.includes("вчера")) return addDays(today, -1);
  const m = t.match(/(\d+)\s*дн/);
  if (m) return addDays(today, -Number(m[1]));
  return today;
}

interface FeedItem {
  id: string;
  date: string;
  icon: React.ReactNode;
  tone: string;
  title: string;
  text: string;
  tab?: TabId;
}

export function ProjectOverview({ project, goTab, onEscalate }: { project: Project; goTab: (t: TabId) => void; onEscalate: () => void }) {
  const { state, can, toggleSprintGoal, addSprintGoal, pushToast } = useGuild();
  const today = todayISO();
  const isManager = can("manage_projects") || can("launch_projects");
  const [goalText, setGoalText] = useState("");

  const sprints = state.sprints.filter((s) => s.projectId === project.id).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const active = sprints.find((s) => sprintStatusByDate(s) === "active");
  const goalSprint = active ?? sprints.find((s) => sprintStatusByDate(s) === "planned");
  const names = new Set(project.team.map((t) => t.name));
  const members = project.team.filter((t) => t.role === "Студент" || t.role === "Гильдиец");
  const reviews = state.reviews.filter((r) => r.projectId === project.id);
  const events = state.events.filter((e) => e.projectId === project.id && e.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const blockers = state.dailies.filter((d) => names.has(d.userName) && d.date >= addDays(today, -3) && d.blockers && !d.blockers.toLowerCase().includes("нет"));
  const escalations = state.escalations.filter((e) => e.projectId === project.id);
  const todayDone = members.filter((m) => ["ok", "partial"].includes(dayState(m.name, state.dailies, today).kind)).length;

  const done = goalSprint?.goalsDone ?? [];
  const goals = goalSprint?.goals ?? project.goals;
  const goalPct = goals.length ? Math.round((goals.filter((g) => done.includes(g)).length / goals.length) * 100) : 0;
  const wd = active ? sprintWorkdays(active) : [];
  const dayNo = active ? wd.filter((d) => d <= today).length : 0;

  /* лента активности */
  const feed: FeedItem[] = [];
  state.dailies
    .filter((d) => names.has(d.userName) && d.date >= addDays(today, -4))
    .forEach((d) => {
      const hasBlock = d.blockers && !d.blockers.toLowerCase().includes("нет");
      feed.push({
        id: `d-${d.id}`,
        date: d.date,
        icon: <ClipboardList size={14} />,
        tone: d.mode === "idle" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
        title: `${d.userName} сдал(а) дейли · ${fmt(d.score)} б.`,
        text: hasBlock ? `Блокер: ${d.blockers}` : d.mode === "idle" ? `Не работал(а): ${d.reason ?? "причина не указана"}` : d.yesterday,
        tab: "daily",
      });
    });
  reviews.forEach((r) => {
    const label = r.status === "todo" ? "готовится к отправке" : r.status === "sent" ? "у технаставника" : r.status === "changes" ? "возвращено на правки" : "принято";
    feed.push({ id: `r-${r.id}`, date: relDate(r.createdAt, today), icon: <GitPullRequest size={14} />, tone: "bg-sky-100 text-sky-700", title: `Ревью: ${r.title}`, text: `${r.authorName} → ${r.reviewerName} · ${label}`, tab: "review" });
  });
  escalations.forEach((e) => feed.push({ id: `e-${e.id}`, date: relDate(e.createdAt, today), icon: <Siren size={14} />, tone: "bg-rose-100 text-rose-700", title: `Эскалация: ${e.title}`, text: `${e.authorName} · ${e.status === "resolved" ? "решена" : "в работе"}` }));
  feed.sort((a, b) => b.date.localeCompare(a.date));
  const recent = feed.slice(0, 7);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><Users size={14} /> Команда проекта</p>
          <div className="mt-3 space-y-2">
            {project.team.map((m, i) => {
              const isMember = m.role === "Студент" || m.role === "Гильдиец";
              const st = isMember ? dayState(m.name, state.dailies, today) : null;
              return (
                <div key={i} className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5">
                  <Avatar name={m.name} color="bg-slate-700" size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{m.name}</p>
                    <p className="text-[11px] text-slate-500">{m.role} · {m.spec}</p>
                  </div>
                  {st && isWeekday(today) ? (
                    <span title="Дейли сегодня" className={`size-2.5 shrink-0 rounded-full ${st.kind === "ok" ? "bg-emerald-500" : st.kind === "partial" ? "bg-amber-400" : "bg-slate-300"}`} />
                  ) : null}
                </div>
              );
            })}
            {project.team.length === 0 ? <p className="text-xs text-slate-400">Команда формируется — место освободилось, вакансия уже в общем списке.</p> : null}
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Точка справа — дейли за сегодня: зелёная сдан, жёлтая 0,5 б., серая ещё нет</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Показатели</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            {[
              { l: "День спринта", v: active ? `${dayNo}/${wd.length}` : "—" },
              { l: "Цели спринта", v: goals.length ? `${goalPct}%` : "—" },
              { l: "Дейли сегодня", v: isWeekday(today) ? `${todayDone}/${members.length}` : "вых." },
              { l: "На ревью", v: reviews.filter((r) => r.status !== "done").length },
              { l: "Блокеры (3 дня)", v: blockers.length },
              { l: "Эскалации", v: escalations.filter((e) => e.status !== "resolved").length },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-slate-50 p-2.5">
                <p className="font-extrabold">{s.v}</p>
                <p className="text-[10px] text-slate-500">{s.l}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-rose-200 bg-rose-50/60 p-4">
          <p className="flex items-center gap-2 text-sm font-extrabold text-rose-800"><Siren size={16} /> Эскалация</p>
          <p className="mt-1 text-xs leading-relaxed text-rose-700/80">Техническая → технаставник · организационная → наставник/СГ · HR → орг. отдел</p>
          <Btn variant="danger" size="sm" className="mt-3 w-full" onClick={onEscalate}><AlertTriangle size={15} /> Эскалировать проблему</Btn>
          {escalations.length ? (
            <div className="mt-3 space-y-2">
              {escalations.slice(0, 3).map((e) => (
                <div key={e.id} className="rounded-xl bg-white p-2.5 text-xs ring-1 ring-rose-100">
                  <p className="font-bold">{e.title}</p>
                  <p className="text-slate-500">{e.type === "tech" ? "Техническая" : e.type === "org" ? "Организационная" : "HR/Конфликт"} · {e.status === "resolved" ? "решена" : "в работе"}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      <div className="space-y-4">
        {isManager ? (
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Быстрые действия наставника</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              {([
                { l: "Запланировать спринт", i: <Flag size={15} />, t: "roadmap" },
                { l: "Оценить спринт", i: <Check size={15} />, t: "roadmap" },
                { l: "Создать событие", i: <CalendarPlus size={15} />, t: "events" },
                { l: "Состав и вакансии", i: <Users size={15} />, t: "team" },
              ] as { l: string; i: React.ReactNode; t: TabId }[]).map((a) => (
                <button key={a.l} onClick={() => goTab(a.t)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50">{a.i} {a.l}</button>
              ))}
            </div>
          </Card>
        ) : null}

        <CurrentSprintCard project={project} onOpen={() => goTab("roadmap")} />

        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-extrabold"><ListChecks size={17} className="text-emerald-600" /> Цели {goalSprint ? goalSprint.title : "проекта"}</h2>
            {goals.length ? <span className="text-xs font-extrabold text-emerald-700">{goals.filter((g) => done.includes(g)).length}/{goals.length} выполнено</span> : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">Результаты уровня «чего добиваемся за спринт». Детальные задачи ведутся в таск-трекере — здесь только итоговые цели, которые видит орг. отдел.</p>
          {goals.length ? <div className="mt-3"><Progress value={goalPct} color="bg-emerald-500" /></div> : null}
          <div className="mt-3 space-y-2">
            {goals.map((g) => {
              const isDone = done.includes(g);
              return (
                <button
                  key={g}
                  disabled={!goalSprint || !(isManager || can("project_workspace"))}
                  onClick={() => {
                    if (!goalSprint) return;
                    toggleSprintGoal(goalSprint.id, g);
                    if (!isDone) pushToast({ kind: "success", title: "Цель достигнута!", text: g });
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${isDone ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 hover:border-emerald-300"}`}
                >
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}><Check size={12} /></span>
                  <span className={`text-[13px] font-bold ${isDone ? "text-emerald-900 line-through opacity-70" : "text-slate-800"}`}>{g}</span>
                </button>
              );
            })}
            {goals.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Целей пока нет. {isManager ? "Добавьте первую ниже." : "Наставник добавит цели при планировании спринта."}</p> : null}
          </div>
          {isManager && goalSprint ? (
            <div className="mt-3 flex gap-2">
              <input value={goalText} onChange={(e) => setGoalText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && goalText.trim().length >= 4) { addSprintGoal(goalSprint.id, goalText.trim()); setGoalText(""); } }} className={inputCls} placeholder="Новая цель спринта, например: «Запустить бронь слотов на проде»" />
              <Btn variant="emerald" size="md" disabled={goalText.trim().length < 4} onClick={() => { addSprintGoal(goalSprint.id, goalText.trim()); setGoalText(""); pushToast({ kind: "success", title: "Цель добавлена", text: goalText.trim() }); }}><Plus size={15} /> Цель</Btn>
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-extrabold"><ExternalLink size={17} className="text-indigo-600" /> Где что вести</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { t: "Задачи и баги", d: "Ведутся в таск-трекере проекта. Здесь дублировать их не нужно.", cta: "Открыть трекер", ext: true },
              { t: "Ревью кода и макетов", d: "Канбан инициации ревью технаставнику — ссылка или файл + комментарий.", cta: "К ревью", tab: "review" as TabId },
              { t: "Ежедневные отчёты", d: "Календарь дейли: 1 балл вовремя, 0,5 — если ничего не делали.", cta: "К дейли", tab: "daily" as TabId },
              { t: "Спринты и этапы", d: "Дорожная карта: этапы проекта, цели недель, оценки участников.", cta: "К дорожной карте", tab: "roadmap" as TabId },
            ].map((c) => (
              <div key={c.t} className="flex flex-col rounded-2xl bg-slate-50 p-3.5">
                <p className="text-[13px] font-extrabold">{c.t}</p>
                <p className="mt-0.5 flex-1 text-[11px] leading-snug text-slate-500">{c.d}</p>
                {c.ext ? (
                  <Btn variant="outline" size="sm" className="mt-2 self-start" onClick={() => pushToast({ kind: "info", title: "Демо: таск-трекер", text: project.links.tracker ? `Здесь откроется ${project.links.tracker}` : "Ссылка на трекер не привязана — укажите её в настройках проекта." })}><ExternalLink size={13} /> {c.cta}</Btn>
                ) : (
                  <Btn variant="outline" size="sm" className="mt-2 self-start" onClick={() => c.tab && goTab(c.tab)}>{c.cta}</Btn>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-extrabold"><Activity size={17} className="text-sky-600" /> Лента активности</h2>
          {recent.length === 0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Пока тихо: события появятся после первых дейли и ревью.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {recent.map((f) => (
                <button key={f.id} onClick={() => f.tab && goTab(f.tab)} className="flex w-full items-start gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-slate-300">
                  <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${f.tone}`}>{f.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold">{f.title}</span>
                    <span className="block truncate text-[11px] text-slate-500">{f.text}</span>
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-slate-400">{f.date === today ? "сегодня" : formatDateRU(f.date)}</span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-extrabold"><CalendarClock size={17} className="text-violet-600" /> Ближайшие встречи</h2>
            {events.length === 0 ? (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Встреч проекта нет. {isManager ? "Создайте дейли или ретро — команда получит приглашение." : ""}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {events.slice(0, 3).map((e) => (
                  <div key={e.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[13px] font-bold">{e.title}</p>
                    <p className="text-[11px] text-slate-500">{formatDateRU(e.date)} · {e.time} · {e.type}</p>
                  </div>
                ))}
                <Btn variant="ghost" size="sm" onClick={() => goTab("events")}>Все события проекта</Btn>
              </div>
            )}
          </Card>

          <Card className={blockers.length ? "border-amber-300 bg-amber-50/60 p-5" : "p-5"}>
            <h2 className={`flex items-center gap-2 font-extrabold ${blockers.length ? "text-amber-900" : ""}`}><AlertTriangle size={17} className={blockers.length ? "" : "text-slate-400"} /> Активные блокеры</h2>
            {blockers.length === 0 ? (
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">За последние 3 дня блокеров нет 🎉</p>
            ) : (
              <div className="mt-3 space-y-2">
                {blockers.slice(0, 3).map((d) => (
                  <div key={d.id} className="rounded-xl bg-white p-3 text-xs">
                    <p className="font-bold">{d.userName} · {formatDateRU(d.date)}</p>
                    <p className="text-amber-800">{d.blockers}</p>
                  </div>
                ))}
                <Badge tone="amber">Блокер старше 24 ч — эскалируйте</Badge>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

