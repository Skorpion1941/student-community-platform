"use client";

import React, { useState } from "react";
import { Activity, BarChart3, CalendarRange, Check, FolderKanban, Inbox, Rocket, ShieldCheck, Trophy, Users } from "lucide-react";
import { useGuild } from "@/lib/store";
import { roleMeta, ROLES } from "@/lib/rbac";
import type { RoleId } from "@/lib/types";
import { Badge, Btn, Card, Progress, SegTabs } from "@/components/ui";
import { SprintModal, Stars, StageBar, effStatus } from "@/components/roadmap";
import { Leaderboard } from "@/components/leaderboard";
import { AdminUsers } from "@/components/admin-users";
import { semesterRange, shortRange, sprintEnd, summarize, todayISO } from "@/lib/scoring";

type Tab = "stats" | "board" | "roadmaps" | "rbac" | "users" | "mvp";

const STATUSES = ["Инициация", "В разработке", "Тестирование", "MVP Готов", "В релизе", "Пилот", "Масштабирование", "Остановка"] as const;

export function AdminPanel() {
  const { state, togglePermission, updateProject, doneInbox, pushToast } = useGuild();
  const [tab, setTab] = useState<Tab>("stats");
  const [manageId, setManageId] = useState<string | null>(null);
  const [openSprint, setOpenSprint] = useState<{ projectId: string; sprintId: string } | null>(null);
  const today = todayISO();
  const range = semesterRange(0);

  const members = state.users.filter((u) => u.role === "intern" || u.role === "junior");
  const sums = members.map((u) => summarize(u.name, state.dailies, state.grades, state.sprints, range, today)).filter((s) => s.maxTotal > 0);
  const avgPercent = sums.length ? Math.round((sums.reduce((a, s) => a + s.percent, 0) / sums.length) * 10) / 10 : 0;
  const avgDaily = sums.length ? Math.round((sums.reduce((a, s) => a + s.dailyPercent, 0) / sums.length) * 10) / 10 : 0;
  const awaiting = state.sprints.filter((s) => effStatus(s) === "done" && !s.adminRating).length;
  const newMsgs = state.inbox.filter((m) => !m.done).length;

  const roleDist = ROLES.filter((r) => r.id !== "guest").map((r) => ({ r, n: state.users.filter((u) => u.role === r.id).length }));
  const maxRole = Math.max(...roleDist.map((x) => x.n), 1);
  const specs = ["Backend", "Frontend", "Аналитика", "Тестирование", "UI/UX", "PM"];
  const specDist = specs.map((s) => ({ s, n: state.vacancies.filter((v) => v.spec === s).length }));

  const kpis = [
    { l: "Участников сообщества", v: state.users.length, sub: `${members.length} в рейтинге Гильдии`, icon: Users, c: "text-indigo-600" },
    { l: "Проектов", v: state.projects.length, sub: `${state.projects.filter((p) => p.commercial).length} коммерческих`, icon: FolderKanban, c: "text-emerald-600" },
    { l: "Средний итоговый %", v: `${avgPercent}%`, sub: range.label, icon: Trophy, c: "text-amber-600" },
    { l: "Дисциплина дейли", v: `${avgDaily}%`, sub: "доля набранных баллов", icon: Activity, c: "text-sky-600" },
    { l: "Спринты ждут оценки", v: awaiting, sub: "дорожные карты · админ", icon: CalendarRange, c: "text-rose-600" },
    { l: "Открытых вакансий", v: state.vacancies.length, sub: `${state.vacancies.filter((v) => v.source === "freed").length} освободилось · ${state.vacancies.filter((v) => v.kind === "org").length} орг. отдел`, icon: Rocket, c: "text-violet-600" },
  ];

  const sprintProject = openSprint ? state.projects.find((p) => p.id === openSprint.projectId) : undefined;

  return (
    <div className="space-y-4">
      <SegTabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "stats", label: "Статистика", icon: <BarChart3 size={15} /> },
          { id: "board", label: "Лидерборд", icon: <Trophy size={15} /> },
          { id: "roadmaps", label: "Дорожные карты", icon: <CalendarRange size={15} />, count: awaiting || undefined },
          { id: "users", label: "Грейды и пользователи", icon: <Users size={15} /> },
          { id: "rbac", label: "Матрица прав", icon: <ShieldCheck size={15} /> },
          { id: "mvp", label: "Проекты и MVP", icon: <Rocket size={15} /> },
        ]}
      />

      {tab === "stats" ? (
        <>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map((k) => (
              <Card key={k.l} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-extrabold">{k.v}</p>
                    <p className="text-[11px] font-semibold text-slate-500">{k.l}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{k.sub}</p>
                  </div>
                  <k.icon size={20} className={k.c} />
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-extrabold">Распределение по ролям</h3>
              <div className="mt-3 space-y-2">
                {roleDist.map(({ r, n }) => (
                  <button key={r.id} onClick={() => setTab("users")} className="flex w-full items-center gap-2 text-left">
                    <span className={`w-32 shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${r.bg} ${r.color}`}>{r.short}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900" style={{ width: `${(n / maxRole) * 100}%` }} /></div>
                    <span className="w-6 text-right text-xs font-extrabold">{n}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-extrabold">Вакансии по направлениям</h3>
              <div className="mt-3 space-y-2">
                {specDist.map(({ s, n }) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 text-[11px] font-bold text-slate-600">{s}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(n / Math.max(...specDist.map((x) => x.n), 1)) * 100}%` }} /></div>
                    <span className="w-6 text-right text-xs font-extrabold">{n}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="flex items-center gap-2 font-extrabold"><Inbox size={17} className="text-sky-600" /> Обращения с лендинга {newMsgs ? <Badge tone="rose">{newMsgs} новых</Badge> : null}</h3>
              {state.inbox.length === 0 ? (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Сообщений пока нет. Здесь появятся обращения из формы «Написать нам» на главной странице.</p>
              ) : (
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                  {state.inbox.map((m) => (
                    <div key={m.id} className={`rounded-xl border p-3 text-xs ${m.done ? "border-slate-100 bg-slate-50 opacity-70" : "border-sky-200 bg-sky-50/50"}`}>
                      <p className="font-extrabold">{m.name} <span className="font-medium text-slate-400">· {m.contact}</span></p>
                      <p className="mt-0.5 text-slate-600">{m.text}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">{m.createdAt}</span>
                        {m.done ? <Badge tone="emerald"><Check size={10} /> обработано</Badge> : <Btn variant="secondary" size="sm" onClick={() => { doneInbox(m.id); pushToast({ kind: "success", title: "Обращение отмечено как обработанное" }); }}>Обработано</Btn>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="font-extrabold">Жизненный цикл проектов</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {STATUSES.filter((s) => state.projects.some((p) => p.status === s)).map((s) => {
                  const list = state.projects.filter((p) => p.status === s);
                  return (
                    <div key={s} className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between"><span className="text-[13px] font-extrabold">{s}</span><Badge tone="slate">{list.length}</Badge></div>
                      <p className="mt-1 text-[11px] text-slate-500">{list.map((p) => p.name).join(" · ")}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      ) : null}

      {tab === "board" ? <Leaderboard onManage={(id) => { setManageId(id); setTab("users"); }} /> : null}

      {tab === "users" ? <AdminUsers focusId={manageId} onFocusDone={() => setManageId(null)} /> : null}

      {tab === "roadmaps" ? (
        <div className="space-y-3">
          <Card className="p-4">
            <h3 className="flex items-center gap-2 font-extrabold"><CalendarRange size={18} className="text-indigo-600" /> Дорожные карты проектов</h3>
            <p className="mt-1 text-xs text-slate-500">Карты собираются наставниками из спринтов (2 недели). Откройте спринт, чтобы увидеть действия и оценки участников и поставить оценку администратора.</p>
          </Card>
          {state.projects.map((p) => {
            const sprints = state.sprints.filter((s) => s.projectId === p.id).sort((a, b) => a.startDate.localeCompare(b.startDate));
            const rated = sprints.filter((s) => s.adminRating);
            const avg = rated.length ? Math.round((rated.reduce((a, s) => a + (s.adminRating ?? 0), 0) / rated.length) * 10) / 10 : 0;
            return (
              <Card key={p.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-extrabold">{p.name}</p>
                  <Badge tone="slate">{p.status}</Badge>
                  <span className="ml-auto text-xs font-semibold text-slate-500">Оценка админа: {avg ? <span className="inline-flex items-center gap-1 align-middle"><Stars value={Math.round(avg)} /> {avg}</span> : "—"}</span>
                </div>
                <div className="mt-3"><StageBar project={p} sprints={sprints} /></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sprints.map((s) => {
                    const st = effStatus(s);
                    return (
                      <button key={s.id} onClick={() => setOpenSprint({ projectId: p.id, sprintId: s.id })} className={`rounded-xl border px-3 py-2 text-left transition hover:shadow-md ${st === "active" ? "border-emerald-300 bg-emerald-50" : st === "done" ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 bg-white"}`}>
                        <p className="text-xs font-extrabold">{s.title}</p>
                        <p className="text-[10px] text-slate-500">{shortRange(s.startDate, sprintEnd(s))}</p>
                        <p className="mt-0.5 text-[10px] font-bold">{s.adminRating ? <span className="text-amber-600">★ {s.adminRating}/5</span> : st === "done" ? <span className="text-rose-600">ждёт оценки</span> : st === "active" ? <span className="text-emerald-700">идёт</span> : <span className="text-slate-400">план</span>}</p>
                      </button>
                    );
                  })}
                  {sprints.length === 0 ? <p className="text-xs text-slate-400">Наставник ещё не запланировал спринты.</p> : null}
                </div>
              </Card>
            );
          })}
          {sprintProject ? <SprintModal project={sprintProject} sprintId={openSprint?.sprintId ?? null} onClose={() => setOpenSprint(null)} /> : null}
        </div>
      ) : null}

      {tab === "rbac" ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 p-5">
            <h3 className="flex items-center gap-2 font-extrabold"><ShieldCheck size={18} className="text-rose-600" /> Матрица прав и ролей (RBAC)</h3>
            <p className="mt-1 text-xs text-slate-500">Переключайте права — меню, кабинеты и кнопки перестраиваются мгновенно у всех ролей.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="p-3 font-bold">Право / Роль</th>
                  {ROLES.filter((r) => r.id !== "guest").map((r) => <th key={r.id} className="p-3 text-center font-bold">{r.short}</th>)}
                </tr>
              </thead>
              <tbody>
                {state.permissions.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="p-3"><p className="font-bold text-slate-800">{p.label}</p><p className="text-[11px] text-slate-400">{p.hint}</p></td>
                    {(["candidate", "intern", "junior", "mentor", "techmentor", "admin"] as RoleId[]).map((r) => (
                      <td key={r} className="p-3 text-center">
                        <button onClick={() => { togglePermission(p.id, r); pushToast({ kind: "info", title: "Права обновлены", text: `${p.label} · ${roleMeta(r).label}: ${p.roles[r] ? "запрещено" : "разрешено"}` }); }} className={`inline-grid size-7 place-items-center rounded-lg font-bold ${p.roles[r] ? "bg-emerald-500 text-white shadow" : "bg-slate-100 text-slate-300 hover:bg-slate-200"}`}>✓</button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab === "mvp" ? (
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-extrabold"><Rocket size={18} className="text-emerald-600" /> Приёмка MVP и жизненный цикл проектов</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {state.projects.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-2"><p className="text-sm font-extrabold">{p.name}</p><Badge tone="slate">{p.status}</Badge></div>
                <div className="mt-2"><Progress value={p.progress} /></div>
                <p className="mt-1 text-[11px] text-slate-500">{p.typeLabel} · {p.team.length} участников · {p.deadline}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => { updateProject(p.id, { status: s }); pushToast({ kind: "success", title: "Статус проекта обновлён!", text: `«${p.name}» → ${s}` }); }} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.status === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{s}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
