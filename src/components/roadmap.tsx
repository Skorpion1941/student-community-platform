"use client";

import React, { useState } from "react";
import { Award, Bell, CalendarRange, Check, Edit3, Flag, Layers, Plus, Star, Trash2 } from "lucide-react";
import { useGuild } from "@/lib/store";
import type { Project, Sprint } from "@/lib/types";
import { Avatar, Badge, Btn, Card, EmptyState, Field, Modal, Progress, inputCls } from "@/components/ui";
import {
  DEFAULT_STAGES,
  SPRINT_CRIT,
  SPRINT_CRIT_HINT,
  SPRINT_CRIT_LABEL,
  SPRINT_MAX,
  addDays,
  dailyStat,
  dayState,
  fmt,
  gradeSum,
  mondayOf,
  shortRange,
  sprintEnd,
  sprintStatusByDate,
  sprintWorkdays,
  stageColor,
  todayISO,
  type SprintCrit,
} from "@/lib/scoring";

export function projectStages(p: Project): string[] {
  return p.stages && p.stages.length ? p.stages : DEFAULT_STAGES;
}

export function effStatus(s: Sprint): Sprint["status"] {
  return s.status === "done" ? "done" : sprintStatusByDate(s);
}

const STATUS_LABEL: Record<Sprint["status"], { l: string; tone: string }> = {
  planned: { l: "Запланирован", tone: "slate" },
  active: { l: "Идёт сейчас", tone: "emerald" },
  done: { l: "Завершён", tone: "indigo" },
};

export function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} className={`${n <= value ? "text-amber-400" : "text-slate-300"} ${onChange ? "hover:scale-110" : "cursor-default"}`} aria-label={`${n} из 5`}>
          <Star size={16} fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </span>
  );
}

function WeekBlock({ label, stage, focus, stages, current }: { label: string; stage: string; focus: string; stages: string[]; current?: boolean }) {
  const c = stageColor(stages, stage);
  return (
    <div className={`rounded-xl p-2.5 ring-1 ${c.bg} ${c.ring} ${current ? "outline outline-2 outline-offset-1 outline-slate-900" : ""}`}>
      <p className={`text-[10px] font-extrabold uppercase tracking-wide ${c.text} opacity-70`}>{label}{current ? " · сейчас" : ""}</p>
      <p className={`text-[13px] font-extrabold leading-tight ${c.text}`}>{stage}</p>
      <p className={`mt-0.5 text-[11px] leading-snug ${c.text} opacity-80`}>{focus || "—"}</p>
    </div>
  );
}

function stageWeeks(sprints: Sprint[], stages: string[]) {
  return stages.map((name) => {
    let weeks = 0;
    const nums: number[] = [];
    let done = 0;
    let active = false;
    sprints.forEach((s) => {
      const hit = (s.week1Stage === name ? 1 : 0) + (s.week2Stage === name ? 1 : 0);
      if (!hit) return;
      weeks += hit;
      nums.push(s.number);
      const st = effStatus(s);
      if (st === "done") done += 1;
      if (st === "active") active = true;
    });
    return { name, weeks, nums: [...new Set(nums)], done: nums.length > 0 && done === new Set(nums).size, active };
  });
}

export function StageBar({ project, sprints }: { project: Project; sprints: Sprint[] }) {
  const stages = projectStages(project);
  const data = stageWeeks(sprints, stages);
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {data.map((st) => {
        const c = stageColor(stages, st.name);
        return (
          <div key={st.name} style={{ flexGrow: Math.max(st.weeks, 1), flexBasis: 120 }} className={`min-w-28 rounded-xl p-2.5 ring-1 ${st.weeks ? `${c.bg} ${c.ring}` : "bg-slate-50 ring-slate-200"}`}>
            <p className={`truncate text-[12px] font-extrabold ${st.weeks ? c.text : "text-slate-400"}`}>{st.name}</p>
            <p className={`text-[10px] font-semibold ${st.weeks ? `${c.text} opacity-80` : "text-slate-400"}`}>
              {st.weeks ? `${st.weeks} нед. · спринт ${st.nums.join(", ")}` : "не запланирован"}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/70">
              <div className={`h-full rounded-full ${st.weeks ? c.bar : "bg-slate-200"}`} style={{ width: st.done ? "100%" : st.active ? "55%" : st.weeks ? "8%" : "0%" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================= Карточка текущего спринта (для обзора проекта) ================= */

export function CurrentSprintCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const { state } = useGuild();
  const today = todayISO();
  const stages = projectStages(project);
  const sprints = state.sprints.filter((s) => s.projectId === project.id);
  const sp = sprints.find((s) => effStatus(s) === "active") ?? sprints.find((s) => effStatus(s) === "planned");
  const members = project.team.filter((t) => t.role === "Студент" || t.role === "Гильдиец");
  if (!sp) {
    return (
      <Card className="p-5">
        <h2 className="flex items-center gap-2 font-extrabold"><Flag size={17} className="text-indigo-600" /> Текущий спринт</h2>
        <p className="mt-2 text-xs text-slate-500">Спринт не запланирован. Наставник собирает дорожную карту на вкладке «Дорожная карта».</p>
        <Btn variant="secondary" size="sm" className="mt-3" onClick={onOpen}>Открыть дорожную карту</Btn>
      </Card>
    );
  }
  const st = effStatus(sp);
  const currentWeek = today < addDays(sp.startDate, 7) ? 1 : 2;
  const wd = sprintWorkdays(sp);
  const elapsed = wd.filter((d) => d <= today).length;
  const missing = st === "active" ? members.filter((m) => ["missed", "pending"].includes(dayState(m.name, state.dailies, today).kind)) : [];
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-extrabold"><Flag size={17} className="text-indigo-600" /> {sp.title} <Badge tone={STATUS_LABEL[st].tone}>{STATUS_LABEL[st].l}</Badge></h2>
        <span className="text-xs font-semibold text-slate-500">{shortRange(sp.startDate, sprintEnd(sp))} · {elapsed}/{wd.length} раб. дней</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <WeekBlock label="Неделя 1" stage={sp.week1Stage} focus={sp.week1Focus} stages={stages} current={st === "active" && currentWeek === 1} />
        <WeekBlock label="Неделя 2" stage={sp.week2Stage} focus={sp.week2Focus} stages={stages} current={st === "active" && currentWeek === 2} />
      </div>
      <div className="mt-3"><Progress value={(elapsed / wd.length) * 100} color="bg-indigo-500" /></div>
      {st === "active" && members.length > 0 ? (
        <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${missing.length ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
          {missing.length ? `Дейли за сегодня ещё не сдали: ${missing.map((m) => m.name).join(", ")}` : "Все участники сдали дейли за сегодня 🎉"}
        </p>
      ) : null}
      <Btn variant="secondary" size="sm" className="mt-3" onClick={onOpen}>Дорожная карта и оценки</Btn>
    </Card>
  );
}

/* ================= Форма оценки спринта наставником ================= */

export function GradeForm({ project, sprint, presetUser, onDone }: { project: Project; sprint: Sprint; presetUser?: string; onDone?: () => void }) {
  const members = project.team.filter((t) => t.role === "Студент" || t.role === "Гильдиец");
  const [name, setName] = useState(presetUser ?? members[0]?.name ?? "");
  if (!members.length) return <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">В команде нет студентов и гильдийцев для оценки.</p>;
  return (
    <div className="space-y-3">
      <Field label="Участник">
        <select value={name} onChange={(e) => setName(e.target.value)} className={inputCls}>
          {members.map((m) => <option key={m.name} value={m.name}>{m.name} · {m.role}</option>)}
        </select>
      </Field>
      <GradeFields key={name + sprint.id} project={project} sprint={sprint} name={name} onDone={onDone} />
    </div>
  );
}

function GradeFields({ project, sprint, name, onDone }: { project: Project; sprint: Sprint; name: string; onDone?: () => void }) {
  const { state, addGrade, pushToast } = useGuild();
  const existing = state.grades.find((g) => g.projectId === project.id && g.sprint === sprint.title && g.userName === name);
  const [scores, setScores] = useState<Record<SprintCrit, number>>({
    activity: existing?.activity ?? 4,
    execution: existing?.execution ?? 4,
    selforg: existing?.selforg ?? 4,
    learning: existing?.learning ?? 4,
  });
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [report, setReport] = useState(existing?.reportToOrg ?? "");
  const member = project.team.find((t) => t.name === name);
  const daily = dailyStat(name, state.dailies, sprint.startDate, sprintEnd(sprint));
  const mentorPts = SPRINT_CRIT.reduce((a, c) => a + scores[c], 0);
  const total = daily.points + mentorPts;
  const max = daily.max + SPRINT_MAX;
  const pct = max ? Math.round((total / max) * 1000) / 10 : 0;

  return (
    <div className="space-y-3">
      {existing ? <p className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800">Оценка за этот спринт уже есть — сохранение обновит её.</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {SPRINT_CRIT.map((c) => (
          <div key={c} className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[13px] font-extrabold">{SPRINT_CRIT_LABEL[c]}</p>
                <p className="text-[11px] text-slate-500">{SPRINT_CRIT_HINT[c]}</p>
              </div>
              <span className="text-lg font-extrabold text-amber-600">{scores[c]}</span>
            </div>
            <div className="mt-1.5 flex gap-1">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setScores((s) => ({ ...s, [c]: n }))} className={`h-7 flex-1 rounded-lg text-[11px] font-extrabold transition ${scores[c] === n ? "bg-amber-400 text-white" : scores[c] > n ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>{n}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Field label="Комментарий участнику"><textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className={inputCls} placeholder="Что получилось, над чем работать" /></Field>
        <Field label="Краткий отчёт орг. отделу (СГ)"><textarea value={report} onChange={(e) => setReport(e.target.value)} rows={3} className={inputCls} placeholder="Вывод по спринту, риски, рекомендации" /></Field>
      </div>
      <div className="rounded-2xl bg-slate-50 p-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-lg font-extrabold text-emerald-600">{fmt(daily.points)}<span className="text-xs text-slate-400">/{daily.max}</span></p><p className="text-[10px] text-slate-500">дейли (авто)</p></div>
          <div><p className="text-lg font-extrabold text-amber-600">{mentorPts}<span className="text-xs text-slate-400">/{SPRINT_MAX}</span></p><p className="text-[10px] text-slate-500">оценка наставника</p></div>
          <div><p className="text-lg font-extrabold text-indigo-600">{pct}%</p><p className="text-[10px] text-slate-500">итог за спринт</p></div>
        </div>
        <Progress value={pct} color="bg-indigo-500" />
      </div>
      <Btn
        variant="emerald"
        className="w-full"
        disabled={report.trim().length < 10}
        onClick={() => {
          addGrade({
            id: `g-${Date.now()}`,
            projectId: project.id,
            projectName: project.name,
            sprint: sprint.title,
            userId: member?.userId ?? "u-x",
            userName: name,
            activity: scores.activity,
            execution: scores.execution,
            selforg: scores.selforg,
            learning: scores.learning,
            comment,
            reportToOrg: report,
            createdAt: "только что",
          });
          pushToast({ kind: "success", title: "Оценка за спринт сохранена!", text: `${name} · ${sprint.title} · ${pct}%. Сводка отправлена СГ.` });
          onDone?.();
        }}
      >
        <Check size={16} /> Сохранить оценку и сводку
      </Btn>
    </div>
  );
}

/* ================= Окно спринта ================= */

export function SprintModal({ project, sprintId, onClose }: { project: Project; sprintId: string | null; onClose: () => void }) {
  const { state, can, updateSprint, removeSprint, pushToast } = useGuild();
  const [gradeFor, setGradeFor] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const sprint = state.sprints.find((s) => s.id === sprintId);
  const stages = projectStages(project);
  const today = todayISO();
  const isManager = can("manage_projects");
  const isAdmin = can("launch_projects");
  const members = project.team.filter((t) => t.role === "Студент" || t.role === "Гильдиец");

  if (!sprint) return null;
  const st = effStatus(sprint);
  const days = sprintWorkdays(sprint);
  const currentWeek = today < addDays(sprint.startDate, 7) ? 1 : 2;

  return (
    <>
      <Modal open={!!sprintId && !editing} onClose={() => { setGradeFor(null); setConfirmDel(false); onClose(); }} wide title={`${sprint.title} · ${project.name}`} subtitle={`${shortRange(sprint.startDate, sprintEnd(sprint))} · 2 недели, ${days.length} рабочих дней`}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_LABEL[st].tone}>{STATUS_LABEL[st].l}</Badge>
            <Badge tone="violet">{sprint.mode === "single" ? "1 спринт = 1 этап" : "Неделя 1 и 2 — разные части"}</Badge>
            {sprint.adminRating ? <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-slate-500">Оценка админа <Stars value={sprint.adminRating} /></span> : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <WeekBlock label="Неделя 1" stage={sprint.week1Stage} focus={sprint.week1Focus} stages={stages} current={st === "active" && currentWeek === 1} />
            <WeekBlock label="Неделя 2" stage={sprint.week2Stage} focus={sprint.week2Focus} stages={stages} current={st === "active" && currentWeek === 2} />
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Цели спринта</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sprint.goals.length ? sprint.goals.map((g) => <span key={g} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{g}</span>) : <span className="text-xs text-slate-400">Цели не заданы</span>}
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Итоги</p>
            <p className="mt-1 text-sm text-slate-600">{sprint.summary || (st === "done" ? "Итоги не заполнены." : "Итоги появятся после завершения спринта.")}</p>
          </div>

          {/* Дейли-матрица */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Дейли по рабочим дням (только будни)</p>
            {members.length === 0 ? <p className="mt-2 text-xs text-slate-400">В команде нет студентов и гильдийцев.</p> : (
              <div className="mt-2 space-y-1.5 overflow-x-auto">
                {members.map((m) => {
                  const stat = dailyStat(m.name, state.dailies, sprint.startDate, sprintEnd(sprint));
                  return (
                    <div key={m.name} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 truncate text-xs font-bold">{m.name}</span>
                      <span className="flex gap-1">
                        {days.map((day, i) => {
                          const s = dayState(m.name, state.dailies, day, today);
                          const color = s.kind === "ok" ? "bg-emerald-500" : s.kind === "partial" ? "bg-amber-400" : s.kind === "missed" ? "bg-rose-400" : "bg-slate-200";
                          return <span key={day} title={`${day}: ${s.kind === "ok" ? "1 балл" : s.kind === "partial" ? "0,5 балла" : s.kind === "missed" ? "не сдан" : "—"}`} className={`size-5 rounded-md ${color} ${i === 4 ? "mr-2" : ""}`} />;
                        })}
                      </span>
                      <span className="ml-auto shrink-0 text-xs font-extrabold">{fmt(stat.points)}<span className="text-slate-400">/{stat.max}</span></span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Участники */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Действия и оценки участников</p>
            <div className="mt-2 space-y-2">
              {members.map((m) => {
                const stat = dailyStat(m.name, state.dailies, sprint.startDate, sprintEnd(sprint));
                const g = state.grades.find((x) => x.projectId === project.id && x.sprint === sprint.title && x.userName === m.name);
                const total = stat.points + (g ? gradeSum(g) : 0);
                const max = stat.max + (g ? SPRINT_MAX : 0);
                const pct = max ? Math.round((total / max) * 100) : 0;
                const tasks = state.tasks.filter((t) => t.projectId === project.id && t.assigneeName === m.name && t.status === "done").length;
                const reviews = state.reviews.filter((r) => r.projectId === project.id && r.authorName === m.name).length;
                return (
                  <div key={m.name} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Avatar name={m.name} color="bg-slate-700" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold">{m.name} <span className="font-medium text-slate-400">· {m.role}, {m.spec}</span></p>
                        <p className="text-[11px] text-slate-500">дейли {fmt(stat.points)}/{stat.max} · задач закрыто в трекере {tasks} · ревью {reviews}{g ? ` · оценка наставника ${gradeSum(g)}/${SPRINT_MAX}` : " · не оценён"}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${pct >= 85 ? "bg-emerald-100 text-emerald-700" : pct >= 60 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700"}`}>{pct}%</span>
                      {isManager ? <Btn variant="outline" size="sm" onClick={() => setGradeFor(gradeFor === m.name ? null : m.name)}><Award size={14} /> {g ? "Изменить оценку" : "Оценить"}</Btn> : null}
                    </div>
                    {g ? (
                      <div className="mt-2 grid gap-1 sm:grid-cols-2">
                        {SPRINT_CRIT.map((c) => (
                          <div key={c} className="flex items-center gap-2 text-[11px]">
                            <span className="w-28 font-semibold text-slate-500">{SPRINT_CRIT_LABEL[c]}</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-amber-400" style={{ width: `${(g[c] / 5) * 100}%` }} /></div>
                            <b className="w-4 text-right">{g[c]}</b>
                          </div>
                        ))}
                        {g.comment ? <p className="text-[11px] text-slate-600 sm:col-span-2"><b>Комментарий:</b> {g.comment}</p> : null}
                      </div>
                    ) : null}
                    {gradeFor === m.name ? <div className="mt-3 border-t border-slate-200 pt-3"><GradeForm project={project} sprint={sprint} presetUser={m.name} onDone={() => setGradeFor(null)} /></div> : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Оценка админа */}
          {(isAdmin || sprint.adminRating) ? <AdminRating sprint={sprint} canEdit={isAdmin} onSave={(rating, comment) => { updateSprint(sprint.id, { adminRating: rating, adminComment: comment }); pushToast({ kind: "success", title: "Оценка спринта сохранена!", text: `${sprint.title} · ${rating}/5` }); }} /> : null}

          {isManager ? (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <Btn variant="secondary" size="sm" onClick={() => setEditing(true)}><Edit3 size={14} /> Редактировать спринт</Btn>
              {st !== "done" ? <Btn variant="outline" size="sm" onClick={() => { updateSprint(sprint.id, { status: "done" }); pushToast({ kind: "success", title: "Спринт завершён", text: `${sprint.title}: пора поставить оценки и заполнить итоги.` }); }}><Flag size={14} /> Завершить досрочно</Btn> : null}
              {confirmDel ? (
                <Btn variant="danger" size="sm" onClick={() => { removeSprint(sprint.id); setConfirmDel(false); onClose(); pushToast({ kind: "info", title: "Спринт удалён" }); }}>Подтвердить удаление</Btn>
              ) : (
                <Btn variant="ghost" size="sm" onClick={() => setConfirmDel(true)}><Trash2 size={14} /> Удалить</Btn>
              )}
            </div>
          ) : null}
        </div>
      </Modal>
      <Modal open={!!sprintId && editing} onClose={() => setEditing(false)} wide title="Редактирование спринта" subtitle={`${sprint.title} · ${project.name}`}>
        <PlannerForm project={project} sprint={sprint} onDone={() => setEditing(false)} />
      </Modal>
    </>
  );
}

function AdminRating({ sprint, canEdit, onSave }: { sprint: Sprint; canEdit: boolean; onSave: (r: number, c: string) => void }) {
  const [rating, setRating] = useState(sprint.adminRating ?? 0);
  const [comment, setComment] = useState(sprint.adminComment ?? "");
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
      <p className="flex items-center gap-2 text-sm font-extrabold text-rose-800"><Award size={16} /> Оценка администратора (орг. отдел)</p>
      {canEdit ? (
        <div className="mt-2 space-y-2">
          <Stars value={rating} onChange={setRating} />
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className={inputCls} placeholder="Комментарий к спринту и вкладу в дорожную карту" />
          <Btn variant="emerald" size="sm" disabled={rating < 1} onClick={() => onSave(rating, comment)}><Check size={14} /> Сохранить оценку спринта</Btn>
        </div>
      ) : (
        <p className="mt-1 text-xs text-slate-600">{sprint.adminComment || "Без комментария."}</p>
      )}
    </div>
  );
}

/* ================= Планирование спринта ================= */

function PlannerForm({ project, sprint, onDone }: { project: Project; sprint?: Sprint; onDone: () => void }) {
  const { state, addSprint, updateSprint, pushToast } = useGuild();
  const stages = projectStages(project);
  const others = state.sprints.filter((s) => s.projectId === project.id && s.id !== sprint?.id);
  const lastEnd = others.map((s) => sprintEnd(s)).sort().pop();
  const [number, setNumber] = useState(sprint?.number ?? (Math.max(0, ...others.map((s) => s.number)) + 1));
  const [start, setStart] = useState(sprint?.startDate ?? mondayOf(lastEnd ? addDays(lastEnd, 1) : todayISO()));
  const [mode, setMode] = useState<Sprint["mode"]>(sprint?.mode ?? "split");
  const [w1s, setW1s] = useState(sprint?.week1Stage ?? stages[0]);
  const [w1f, setW1f] = useState(sprint?.week1Focus ?? "");
  const [w2s, setW2s] = useState(sprint?.week2Stage ?? stages[Math.min(1, stages.length - 1)]);
  const [w2f, setW2f] = useState(sprint?.week2Focus ?? "");
  const [goals, setGoals] = useState((sprint?.goals ?? []).join("\n"));
  const [summary, setSummary] = useState(sprint?.summary ?? "");
  const end = addDays(start, 13);
  const clash = others.find((o) => start <= sprintEnd(o) && end >= o.startDate);

  const stageSelect = (v: string, set: (s: string) => void) => (
    <select value={v} onChange={(e) => set(e.target.value)} className={inputCls}>{stages.map((s) => <option key={s}>{s}</option>)}</select>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Номер спринта"><input type="number" min={1} value={number} onChange={(e) => setNumber(Number(e.target.value))} className={inputCls} /></Field>
        <Field label="Старт (понедельник)" hint="Любая дата сдвинется на ближайший понедельник назад">
          <input type="date" value={start} onChange={(e) => e.target.value && setStart(mondayOf(e.target.value))} className={inputCls} />
        </Field>
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-bold text-slate-800">{shortRange(start, end)}</p>
          <p>2 недели · 10 рабочих дней</p>
          <p className="text-slate-400">Дейли — только по будням</p>
        </div>
      </div>
      {clash ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-200">Даты пересекаются со спринтом «{clash.title}» ({shortRange(clash.startDate, sprintEnd(clash))}). Сдвиньте старт.</p> : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => setMode("single")} className={`rounded-xl border p-3 text-left ${mode === "single" ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
          <span className="block text-sm font-extrabold">1 спринт = 1 этап проекта</span>
          <span className="text-[11px] text-slate-500">Обе недели посвящены одному этапу дорожной карты</span>
        </button>
        <button type="button" onClick={() => setMode("split")} className={`rounded-xl border p-3 text-left ${mode === "split" ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
          <span className="block text-sm font-extrabold">Неделя 1 и неделя 2 — разные части</span>
          <span className="text-[11px] text-slate-500">Первая неделя — завершение этапа, вторая — начало следующего</span>
        </button>
      </div>

      {mode === "single" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Этап проекта">{stageSelect(w1s, setW1s)}</Field>
          <Field label="Фокус спринта"><input value={w1f} onChange={(e) => setW1f(e.target.value)} className={inputCls} placeholder="Что именно делаем в этом этапе" /></Field>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
            <p className="text-xs font-extrabold uppercase text-slate-400">Неделя 1</p>
            <Field label="Часть этапа">{stageSelect(w1s, setW1s)}</Field>
            <Field label="Фокус"><input value={w1f} onChange={(e) => setW1f(e.target.value)} className={inputCls} /></Field>
          </div>
          <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
            <p className="text-xs font-extrabold uppercase text-slate-400">Неделя 2</p>
            <Field label="Часть этапа">{stageSelect(w2s, setW2s)}</Field>
            <Field label="Фокус"><input value={w2f} onChange={(e) => setW2f(e.target.value)} className={inputCls} /></Field>
          </div>
        </div>
      )}

      <Field label="Цели спринта (по одной в строке)"><textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={3} className={inputCls} /></Field>
      {sprint ? <Field label="Итоги спринта"><textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={inputCls} placeholder="Заполняется после завершения" /></Field> : null}

      <Btn
        variant="emerald"
        className="w-full"
        disabled={!!clash || number < 1}
        onClick={() => {
          const base = {
            projectId: project.id,
            number,
            title: `Спринт ${number}`,
            startDate: start,
            mode,
            week1Stage: w1s,
            week1Focus: w1f,
            week2Stage: mode === "single" ? w1s : w2s,
            week2Focus: mode === "single" ? w1f : w2f,
            goals: goals.split("\n").map((g) => g.trim()).filter(Boolean),
            summary,
          };
          if (sprint) updateSprint(sprint.id, { ...base, status: sprint.status === "done" ? "done" : sprintStatusByDate({ startDate: start }) });
          else addSprint({ id: `sp-${project.id}-${Date.now()}`, ...base, status: sprintStatusByDate({ startDate: start }) });
          pushToast({ kind: "success", title: sprint ? "Спринт обновлён!" : "Спринт запланирован!", text: `Спринт ${number} · ${shortRange(start, end)} · дорожная карта пересобрана` });
          onDone();
        }}
      >
        <Check size={16} /> {sprint ? "Сохранить спринт" : "Добавить в дорожную карту"}
      </Btn>
    </div>
  );
}

function StageEditor({ project, onDone }: { project: Project; onDone: () => void }) {
  const { state, updateProject, updateSprint, pushToast } = useGuild();
  const original = projectStages(project);
  const [list, setList] = useState<string[]>(original);
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Этапы формируют дорожную карту проекта. Спринты привязываются к этапам, переименование обновит все связанные спринты.</p>
      {list.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-900 text-[11px] font-extrabold text-white">{i + 1}</span>
          <input value={s} onChange={(e) => setList((l) => l.map((x, k) => (k === i ? e.target.value : x)))} className={inputCls} />
          <button onClick={() => setList((l) => l.filter((_, k) => k !== i))} disabled={list.length <= 2} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"><Trash2 size={15} /></button>
        </div>
      ))}
      <Btn variant="secondary" size="sm" onClick={() => setList((l) => [...l, `Этап ${l.length + 1}`])}><Plus size={14} /> Добавить этап</Btn>
      <Btn
        variant="emerald"
        className="w-full"
        disabled={list.some((s) => !s.trim())}
        onClick={() => {
          const clean = list.map((s) => s.trim());
          state.sprints.filter((sp) => sp.projectId === project.id).forEach((sp) => {
            const i1 = original.indexOf(sp.week1Stage);
            const i2 = original.indexOf(sp.week2Stage);
            const patch: Partial<Sprint> = {};
            if (i1 >= 0 && clean[i1]) patch.week1Stage = clean[i1];
            if (i2 >= 0 && clean[i2]) patch.week2Stage = clean[i2];
            if (Object.keys(patch).length) updateSprint(sp.id, patch);
          });
          updateProject(project.id, { stages: clean });
          pushToast({ kind: "success", title: "Этапы проекта обновлены!", text: clean.join(" → ") });
          onDone();
        }}
      >
        <Check size={16} /> Сохранить этапы
      </Btn>
    </div>
  );
}

/* ================= Вкладка «Дорожная карта» ================= */

export function RoadmapTab({ project }: { project: Project }) {
  const { state, can } = useGuild();
  const [openId, setOpenId] = useState<string | null>(null);
  const [planner, setPlanner] = useState(false);
  const [stageEdit, setStageEdit] = useState(false);
  const stages = projectStages(project);
  const sprints = state.sprints.filter((s) => s.projectId === project.id).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const isManager = can("manage_projects");
  const today = todayISO();
  const rated = sprints.filter((s) => s.adminRating);
  const avgAdmin = rated.length ? Math.round((rated.reduce((a, s) => a + (s.adminRating ?? 0), 0) / rated.length) * 10) / 10 : 0;
  const done = sprints.filter((s) => effStatus(s) === "done").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-extrabold"><CalendarRange size={18} className="text-indigo-600" /> Дорожная карта проекта</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Спринт — 2 недели (10 рабочих дней). Наставник привязывает спринт к этапу целиком или раскладывает по неделям; из спринтов складывается дорожная карта, которую оценивает администратор. Нажмите на спринт, чтобы увидеть детали и оценки участников.
          </p>
        </div>
        {isManager ? (
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" onClick={() => setStageEdit(true)}><Layers size={14} /> Этапы проекта</Btn>
            <Btn variant="emerald" size="sm" onClick={() => setPlanner(true)}><Plus size={14} /> Запланировать спринт</Btn>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-4">
        {[
          { l: "Спринтов в плане", v: sprints.length },
          { l: "Завершено", v: done },
          { l: "Этапов", v: stages.length },
          { l: "Оценка админа (ср.)", v: avgAdmin || "—" },
        ].map((k) => (
          <Card key={k.l} className="p-3.5"><p className="text-xl font-extrabold">{k.v}</p><p className="text-[11px] text-slate-500">{k.l}</p></Card>
        ))}
      </div>

      <Card className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Этапы проекта · сколько недель отдано каждому</p>
        <div className="mt-2"><StageBar project={project} sprints={sprints} /></div>
      </Card>

      {sprints.length === 0 ? (
        <EmptyState title="Спринтов ещё нет" text="Наставник собирает дорожную карту: запланируйте первый спринт и привяжите его к этапу проекта." action={isManager ? <Btn variant="emerald" size="sm" onClick={() => setPlanner(true)}><Plus size={14} /> Запланировать спринт</Btn> : undefined} />
      ) : (
        <div className="relative space-y-3 pl-5">
          <span className="absolute bottom-2 left-1.5 top-2 w-0.5 rounded bg-slate-200" />
          {sprints.map((sp) => {
            const st = effStatus(sp);
            const wd = sprintWorkdays(sp);
            const elapsed = wd.filter((d) => d <= today).length;
            const currentWeek = today < addDays(sp.startDate, 7) ? 1 : 2;
            return (
              <div key={sp.id} className="relative">
                <span className={`absolute -left-[18px] top-5 size-3.5 rounded-full ring-4 ring-slate-100 ${st === "done" ? "bg-indigo-500" : st === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                <button onClick={() => setOpenId(sp.id)} className={`w-full rounded-2xl border bg-white p-4 text-left transition hover:shadow-md ${st === "active" ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200 hover:border-indigo-300"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold">{sp.title}</p>
                    <Badge tone={STATUS_LABEL[st].tone}>{STATUS_LABEL[st].l}</Badge>
                    <Badge tone="violet">{sp.mode === "single" ? "1 спринт = 1 этап" : "по неделям"}</Badge>
                    <span className="ml-auto text-xs font-semibold text-slate-500">{shortRange(sp.startDate, sprintEnd(sp))}</span>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <WeekBlock label="Неделя 1" stage={sp.week1Stage} focus={sp.week1Focus} stages={stages} current={st === "active" && currentWeek === 1} />
                    <WeekBlock label="Неделя 2" stage={sp.week2Stage} focus={sp.week2Focus} stages={stages} current={st === "active" && currentWeek === 2} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap gap-1">{sp.goals.slice(0, 3).map((g) => <span key={g} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{g}</span>)}</div>
                    <span className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                      {st === "active" ? `${elapsed}/${wd.length} раб. дней` : null}
                      {sp.adminRating ? <Stars value={sp.adminRating} /> : st === "done" ? <span className="text-slate-400">ждёт оценки админа</span> : null}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <SprintModal project={project} sprintId={openId} onClose={() => setOpenId(null)} />
      <Modal open={planner} onClose={() => setPlanner(false)} wide title="Планирование спринта" subtitle={project.name}>
        <PlannerForm project={project} onDone={() => setPlanner(false)} />
      </Modal>
      <Modal open={stageEdit} onClose={() => setStageEdit(false)} title="Этапы проекта" subtitle={project.name}>
        <StageEditor project={project} onDone={() => setStageEdit(false)} />
      </Modal>
      {isManager ? null : <p className="flex items-center gap-1.5 text-[11px] text-slate-400"><Bell size={12} /> Планирование спринтов доступно наставнику и орг. отделу.</p>}
    </div>
  );
}
