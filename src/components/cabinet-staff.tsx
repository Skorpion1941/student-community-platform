"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Award, Bell, BookOpen, CalendarCheck, Check, ClipboardList, Eye, FileText, GitPullRequest, Inbox, Plus, Presentation, Siren, Star, Trash2, Users, Video, X } from "lucide-react";
import { useGuild, formatDateRU } from "@/lib/store";
import { roleMeta } from "@/lib/rbac";
import type { InterviewSlot, PromoRec } from "@/lib/types";
import { Avatar, Badge, Btn, Card, EmptyState, Field, Modal, Progress, SegTabs, inputCls } from "@/components/ui";
import { GradeForm, effStatus } from "@/components/roadmap";
import { SPRINT_CRIT, SPRINT_CRIT_LABEL, SPRINT_MAX, addDays, dayState, fmt, gradeSum, isWeekday, semesterRange, shortRange, sprintEnd, sprintStatusByDate, summarize, todayISO, workdaysBetween } from "@/lib/scoring";
import { sprintsToGrade } from "@/lib/notifications";

function Header({ title, desc }: { title: string; desc: string }) {
  const { currentUser, role } = useGuild();
  const meta = roleMeta(role);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Avatar name={currentUser.name} color={currentUser.color} size="lg" />
      <div>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h1>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
      <span className={`ml-auto rounded-full px-3 py-1.5 text-xs font-bold ${meta.bg} ${meta.color}`}>{meta.label} · {currentUser.spec}</span>
    </div>
  );
}

function Kpi({ l, v, hint, tone = "text-slate-900" }: { l: string; v: React.ReactNode; hint?: string; tone?: string }) {
  return (
    <Card className="p-3.5">
      <p className={`text-2xl font-extrabold ${tone}`}>{v}</p>
      <p className="text-[11px] font-semibold text-slate-600">{l}</p>
      {hint ? <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">{hint}</p> : null}
    </Card>
  );
}

/* ================= НАСТАВНИК ================= */

export function MentorView() {
  const { state, currentUser, pushToast, resolveEscalation, addRec } = useGuild();
  const [tab, setTab] = useState<"overview" | "team" | "grades" | "report">("overview");
  const [recFor, setRecFor] = useState<string | null>(null);
  const [recText, setRecText] = useState("");
  const [presetGrade, setPresetGrade] = useState<{ projectId: string; user: string } | null>(null);
  const today = todayISO();
  const range = semesterRange(0);

  const mine = useMemo(() => {
    const own = state.projects.filter((p) => p.team.some((t) => t.name === currentUser.name));
    return own.length ? own : state.projects;
  }, [state.projects, currentUser.name]);
  const mineIds = new Set(mine.map((p) => p.id));
  const roster = useMemo(() => {
    const map = new Map<string, { name: string; role: string; spec: string; userId: string; projects: string[] }>();
    mine.forEach((p) =>
      p.team.filter((t) => t.role === "Студент" || t.role === "Гильдиец").forEach((t) => {
        const cur = map.get(t.name);
        if (cur) cur.projects.push(p.name);
        else map.set(t.name, { name: t.name, role: t.role, spec: t.spec, userId: t.userId, projects: [p.name] });
      })
    );
    return [...map.values()];
  }, [mine]);

  const missing = isWeekday(today) ? roster.filter((m) => !state.dailies.some((d) => d.userName === m.name && d.date === today)) : [];
  const toGrade = sprintsToGrade(state, currentUser).filter((s) => mineIds.has(s.projectId));
  const openEsc = state.escalations.filter((e) => mineIds.has(e.projectId) && e.status !== "resolved");
  const reviewsOpen = state.reviews.filter((r) => mineIds.has(r.projectId) && r.status !== "done").length;
  const activeSprints = state.sprints.filter((s) => mineIds.has(s.projectId) && sprintStatusByDate(s) === "active");
  const strip = workdaysBetween(addDays(today, -13), today).slice(-10);

  return (
    <div className="space-y-4">
      <Header title="Кабинет наставника (PM)" desc="Команды и спринты · оценки по рубрике · рекомендации к повышению · отчёты для орг. отдела" />
      <div className="grid gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi l="Мои проекты" v={mine.length} hint={mine.map((p) => p.short).join(", ")} />
        <Kpi l="Активные спринты" v={activeSprints.length} tone="text-indigo-600" />
        <Kpi l="Не сдали дейли" v={isWeekday(today) ? missing.length : "—"} tone={missing.length ? "text-amber-600" : "text-emerald-600"} hint={missing.slice(0, 2).map((m) => m.name).join(", ") || (isWeekday(today) ? "все отчитались" : "выходной")} />
        <Kpi l="Ждут оценки" v={toGrade.length} tone={toGrade.length ? "text-rose-600" : "text-emerald-600"} />
        <Kpi l="Ревью в работе" v={reviewsOpen} tone="text-sky-600" />
        <Kpi l="Открытые эскалации" v={openEsc.length} tone={openEsc.length ? "text-rose-600" : "text-emerald-600"} />
      </div>

      <SegTabs value={tab} onChange={setTab} items={[
        { id: "overview", label: "Обзор", icon: <ClipboardList size={14} /> },
        { id: "team", label: "Моя команда", icon: <Users size={14} />, count: roster.length },
        { id: "grades", label: "Оценка спринтов", icon: <Award size={14} />, count: toGrade.length || undefined },
        { id: "report", label: "Отчёт орг. отделу", icon: <FileText size={14} /> },
      ]} />

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            {mine.map((p) => {
              const sp = state.sprints.find((s) => s.projectId === p.id && sprintStatusByDate(s) === "active");
              const members = p.team.filter((t) => t.role === "Студент" || t.role === "Гильдиец");
              return (
                <Card key={p.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold">{p.name}</p>
                    <Badge tone="slate">{p.status}</Badge>
                    <span className="ml-auto text-xs font-semibold text-slate-500">дедлайн {p.deadline}</span>
                  </div>
                  <div className="mt-2"><Progress value={p.progress} /></div>
                  <p className="mt-2 rounded-xl bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-800">{sp ? `${sp.title}: ${sp.week1Stage === sp.week2Stage ? sp.week1Stage : `${sp.week1Stage} → ${sp.week2Stage}`}` : "Активного спринта нет — запланируйте следующий"}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {members.map((m) => {
                      const st = dayState(m.name, state.dailies, today);
                      return (
                        <span key={m.name} title={`${m.name}: дейли сегодня`} className="relative">
                          <Avatar name={m.name} color="bg-slate-700" size="sm" />
                          <span className={`absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-white ${st.kind === "ok" ? "bg-emerald-500" : st.kind === "partial" ? "bg-amber-400" : "bg-slate-300"}`} />
                        </span>
                      );
                    })}
                    <div className="ml-auto flex flex-wrap gap-1.5">
                      <Link href={`/projects/${p.id}`}><Btn variant="secondary" size="sm">Воркспейс</Btn></Link>
                      <Link href={`/projects/${p.id}?tab=roadmap`}><Btn variant="outline" size="sm">Дорожная карта</Btn></Link>
                      <Link href={`/projects/${p.id}?tab=daily`}><Btn variant="outline" size="sm">Дейли</Btn></Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="space-y-3">
            <Card className="p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold"><Bell size={15} className="text-amber-600" /> Требует внимания</p>
              <div className="mt-3 space-y-2">
                {missing.length ? <div className="rounded-xl bg-amber-50 p-3 text-xs"><p className="font-bold text-amber-900">Дейли за сегодня не сдали: {missing.length}</p><p className="text-amber-800">{missing.map((m) => m.name).join(", ")}</p><Btn variant="secondary" size="sm" className="mt-2" onClick={() => pushToast({ kind: "success", title: "Напоминание отправлено", text: missing.map((m) => m.name).join(", ") })}><Bell size={13} /> Напомнить всем</Btn></div> : null}
                {toGrade.map((sp) => <button key={sp.id} onClick={() => setTab("grades")} className="block w-full rounded-xl bg-rose-50 p-3 text-left text-xs hover:bg-rose-100"><p className="font-bold text-rose-900">Оцените {sp.title}</p><p className="text-rose-800">{mine.find((p) => p.id === sp.projectId)?.name} · завершён {shortRange(sp.startDate, sprintEnd(sp))}</p></button>)}
                {openEsc.map((e) => (
                  <div key={e.id} className="rounded-xl bg-rose-50/60 p-3 text-xs ring-1 ring-rose-100">
                    <p className="flex items-center gap-1.5 font-bold text-rose-900"><Siren size={13} /> {e.title}</p>
                    <p className="text-slate-600">{e.projectName} · {e.authorName} · {e.type === "tech" ? "техническая" : e.type === "org" ? "организационная" : "HR"}</p>
                    <Btn variant="emerald" size="sm" className="mt-2" onClick={() => { resolveEscalation(e.id); pushToast({ kind: "success", title: "Эскалация закрыта", text: e.title }); }}><Check size={13} /> Решено</Btn>
                  </div>
                ))}
                {!missing.length && !toGrade.length && !openEsc.length ? <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">Всё под контролем 🎉</p> : null}
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-extrabold">Быстрые ссылки</p>
              <div className="mt-2 grid gap-2">
                <Link href="/events"><Btn variant="outline" size="sm" className="w-full"><CalendarCheck size={14} /> Создать встречу проекта</Btn></Link>
                <Link href="/vacancies"><Btn variant="outline" size="sm" className="w-full"><Users size={14} /> Вакансии и освободившиеся места</Btn></Link>
                <Link href="/knowledge"><Btn variant="outline" size="sm" className="w-full"><BookOpen size={14} /> База знаний</Btn></Link>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "team" ? (
        roster.length === 0 ? <EmptyState title="В командах нет студентов" text="Откройте вакансии проектов, чтобы пополнить команду." /> : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-xs">
                <thead>
                  <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="p-3">Участник</th><th className="p-3">Проекты</th><th className="p-3">Дейли · 10 дней</th><th className="p-3">Итоговый %</th><th className="p-3">Посл. оценка</th><th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {roster.map((m) => {
                    const sum = summarize(m.name, state.dailies, state.grades, state.sprints, range, today);
                    const last = state.grades.filter((g) => g.userName === m.name).slice(-1)[0];
                    const rec = state.recs.some((r) => r.userName === m.name && r.byName === currentUser.name);
                    return (
                      <tr key={m.name} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="p-3"><div className="flex items-center gap-2.5"><Avatar name={m.name} color="bg-slate-700" size="sm" /><div><p className="text-[13px] font-extrabold">{m.name}</p><p className="text-[11px] text-slate-500">{m.role} · {m.spec}</p></div></div></td>
                        <td className="p-3 text-[11px] text-slate-600">{m.projects.join(", ")}</td>
                        <td className="p-3"><div className="flex gap-0.5">{strip.map((d) => { const st = dayState(m.name, state.dailies, d, today); return <span key={d} className={`h-5 w-2.5 rounded-sm ${st.kind === "ok" ? "bg-emerald-500" : st.kind === "partial" ? "bg-amber-400" : st.kind === "missed" ? "bg-rose-400" : "bg-slate-200"}`} />; })}</div></td>
                        <td className="p-3 text-sm font-extrabold">{sum.maxTotal ? `${sum.percent}%` : "—"}</td>
                        <td className="p-3 font-bold">{last ? `${gradeSum(last)}/${SPRINT_MAX}` : "—"}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1.5">
                            <Btn variant="outline" size="sm" onClick={() => { const pr = mine.find((p) => p.team.some((t) => t.name === m.name)); if (pr) setPresetGrade({ projectId: pr.id, user: m.name }); }}><Award size={13} /> Оценить</Btn>
                            <Btn variant={rec ? "secondary" : "emerald"} size="sm" onClick={() => { setRecFor(m.name); setRecText(""); }}><Star size={13} /> {rec ? "Рекомендовано" : "К повышению"}</Btn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : null}

      {tab === "grades" ? <SprintGrading projectIds={[...mineIds]} /> : null}

      {tab === "report" ? <OrgReport projectIds={[...mineIds]} /> : null}

      <Modal open={!!recFor} onClose={() => setRecFor(null)} title="Рекомендация к повышению" subtitle={recFor ?? ""}>
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Рекомендация уйдёт в орг. отдел и появится в карточке участника у администратора. Решение о грейде принимает админ.</p>
          <Field label="Обоснование"><textarea value={recText} onChange={(e) => setRecText(e.target.value)} rows={3} className={inputCls} placeholder="Закрыл 2 проекта без срывов, ведёт стажёров, итоговый % выше 90…" /></Field>
          <Btn variant="emerald" className="w-full" disabled={recText.trim().length < 10} onClick={() => {
            const u = state.users.find((x) => x.name === recFor);
            if (!u) return;
            const rec: PromoRec = { id: `rec-${Date.now()}`, userId: u.id, userName: u.name, byName: currentUser.name, comment: recText.trim(), date: today };
            addRec(rec);
            pushToast({ kind: "success", title: "Рекомендация отправлена", text: `${u.name} · орг. отдел увидит её в панели администратора` });
            setRecFor(null);
          }}><Star size={15} /> Отправить рекомендацию</Btn>
        </div>
      </Modal>

      <Modal open={!!presetGrade} onClose={() => setPresetGrade(null)} wide title="Оценка за спринт" subtitle={presetGrade?.user ?? ""}>
        {presetGrade ? <QuickGrade projectId={presetGrade.projectId} user={presetGrade.user} onDone={() => setPresetGrade(null)} /> : null}
      </Modal>
    </div>
  );
}

function QuickGrade({ projectId, user, onDone }: { projectId: string; user: string; onDone: () => void }) {
  const { state } = useGuild();
  const project = state.projects.find((p) => p.id === projectId);
  const sprints = state.sprints.filter((s) => s.projectId === projectId).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const def = sprints.find((s) => sprintStatusByDate(s) === "active") ?? sprints.filter((s) => sprintStatusByDate(s) === "done").slice(-1)[0] ?? sprints[0];
  const [sid, setSid] = useState(def?.id ?? "");
  const sprint = sprints.find((s) => s.id === sid) ?? def;
  if (!project || !sprint) return <EmptyState title="Нет спринтов" text="Сначала запланируйте спринт на вкладке «Дорожная карта» проекта." />;
  return (
    <div className="space-y-3">
      <Field label="Спринт">
        <select value={sprint.id} onChange={(e) => setSid(e.target.value)} className={inputCls}>{sprints.map((s) => <option key={s.id} value={s.id}>{s.title} · {shortRange(s.startDate, sprintEnd(s))}</option>)}</select>
      </Field>
      <GradeForm key={sprint.id + user} project={project} sprint={sprint} presetUser={user} onDone={onDone} />
    </div>
  );
}

export function SprintGrading({ projectIds }: { projectIds?: string[] }) {
  const { state } = useGuild();
  const projects = projectIds ? state.projects.filter((p) => projectIds.includes(p.id)) : state.projects;
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [sprintId, setSprintId] = useState("");
  const project = projects.find((p) => p.id === projectId) ?? projects[0];
  const sprints = state.sprints.filter((s) => s.projectId === project?.id).sort((x, y) => x.startDate.localeCompare(y.startDate));
  const fallback = sprints.find((s) => effStatus(s) === "active") ?? sprints.filter((s) => effStatus(s) === "done").slice(-1)[0] ?? sprints[0];
  const sprint = sprints.find((s) => s.id === sprintId) ?? fallback;
  const history = state.grades.filter((g) => g.projectId === project?.id);

  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 font-extrabold"><Award size={17} className="text-amber-600" /> Оценка по спринту</h3>
      <p className="mt-1 text-xs text-slate-500">Рубрика наставника: Активность, Выполнение, Самоорганизация, Обучаемость (0–5). К ним автоматически добавляются баллы за дейли — получается итоговый процент.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Проект">
          <select value={project?.id ?? ""} onChange={(e) => { setProjectId(e.target.value); setSprintId(""); }} className={inputCls}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </Field>
        <Field label="Спринт из дорожной карты">
          <select value={sprint?.id ?? ""} onChange={(e) => setSprintId(e.target.value)} className={inputCls}>
            {sprints.map((sp) => <option key={sp.id} value={sp.id}>{sp.title} · {shortRange(sp.startDate, sprintEnd(sp))}</option>)}
            {sprints.length === 0 ? <option value="">Спринтов нет</option> : null}
          </select>
        </Field>
      </div>
      <div className="mt-3">
        {project && sprint ? <GradeForm key={`${project.id}-${sprint.id}`} project={project} sprint={sprint} /> : <EmptyState title="Нет спринтов для оценки" text="Сначала запланируйте спринт на вкладке «Дорожная карта» проекта." action={project ? <Link href={`/projects/${project.id}?tab=roadmap`}><Btn variant="secondary" size="sm">Открыть дорожную карту</Btn></Link> : undefined} />}
      </div>
      {history.length ? (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Выставленные оценки</p>
          <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
            {history.map((g) => (
              <div key={g.id} className="rounded-xl bg-slate-50 p-3 text-xs">
                <p className="font-bold">{g.userName} · {g.sprint} · {gradeSum(g)}/{SPRINT_MAX}</p>
                <p className="mt-0.5 text-slate-500">{SPRINT_CRIT.map((c) => `${SPRINT_CRIT_LABEL[c].slice(0, 4)}. ${g[c]}`).join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function OrgReport({ projectIds }: { projectIds: string[] }) {
  const { state, pushToast } = useGuild();
  const [report, setReport] = useState("");
  const [projectId, setProjectId] = useState(projectIds[0] ?? "");
  const sent = state.grades.filter((g) => projectIds.includes(g.projectId) && g.reportToOrg).slice(0, 8);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="flex items-center gap-2 font-extrabold"><ClipboardList size={17} className="text-sky-600" /> Статус-отчёт для орг. отдела (СГ)</h3>
        <div className="mt-3 space-y-3">
          <Field label="Проект"><select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>{state.projects.filter((p) => projectIds.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Прогресс, риски, план"><textarea value={report} onChange={(e) => setReport(e.target.value)} rows={6} className={inputCls} placeholder="Спринт 12: закрыто 4 из 5 целей. Риск: интеграция уведомлений. План: демо в пятницу…" /></Field>
          <Btn variant="emerald" className="w-full" disabled={report.trim().length < 20} onClick={() => { setReport(""); pushToast({ kind: "success", title: "Отчёт отправлен Сергею Георгиевичу", text: "Орг. отдел увидит его при приёмке MVP." }); }}>Отправить отчёт</Btn>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-extrabold">Сводки по спринтам (из оценок)</h3>
        <p className="mt-1 text-xs text-slate-500">Краткие выводы, которые вы оставляли при оценке участников — их видит орг. отдел.</p>
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
          {sent.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Сводок пока нет — они появятся после оценки спринтов.</p> : sent.map((g) => (
            <div key={g.id} className="rounded-xl bg-slate-50 p-3 text-xs"><p className="font-bold">{g.userName} · {g.sprint}</p><p className="text-slate-600">{g.reportToOrg}</p></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ================= ТЕХНАСТАВНИК ================= */

const TIMES = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

export function TechView() {
  const { state, currentUser, pushToast, addSlot, removeSlot, verdictApplication, updateRequest, resolveReview } = useGuild();
  const [tab, setTab] = useState<"reviews" | "interviews" | "requests" | "materials">("reviews");
  const [revFilter, setRevFilter] = useState<"queue" | "changes" | "done" | "all">("queue");
  const [verdict, setVerdict] = useState<Record<string, string>>({});
  const [reqFilter, setReqFilter] = useState("all");
  const [from, setFrom] = useState(() => addDays(todayISO(), 1));
  const [to, setTo] = useState(() => addDays(todayISO(), 5));
  const [times, setTimes] = useState<string[]>(["14:00", "15:00"]);
  const [direction, setDirection] = useState("Backend / QA");

  const queue = state.reviews.filter((r) => r.status === "todo" || r.status === "sent");
  const reviews = state.reviews.filter((r) => (revFilter === "all" ? true : revFilter === "queue" ? r.status === "todo" || r.status === "sent" : r.status === revFilter));
  const free = state.slots.filter((s) => s.status === "free").length;
  const booked = state.slots.filter((s) => s.status === "booked").length;
  const pendingApps = state.applications.filter((a) => a.status === "booked" || a.status === "pending");
  const newReq = state.requests.filter((r) => r.status === "new").length;
  const mine = state.articles.filter((a) => a.authorId === currentUser.id);
  const views = mine.reduce((n, a) => n + a.views, 0);
  const reqs = state.requests.filter((r) => reqFilter === "all" || r.type === reqFilter);

  const days = workdaysBetween(from, to);
  const planned = days.length * times.length;
  const slotsByDay = useMemo(() => {
    const m = new Map<string, InterviewSlot[]>();
    [...state.slots].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach((s) => m.set(s.date, [...(m.get(s.date) ?? []), s]));
    return [...m.entries()].slice(0, 8);
  }, [state.slots]);

  function generate() {
    let n = 0;
    days.forEach((d) => times.forEach((t) => {
      if (state.slots.some((s) => s.date === d && s.time === t && s.mentorName === currentUser.name)) return;
      addSlot({ id: `slot-${d}-${t.replace(":", "")}-${Date.now()}-${n}`, date: d, time: t, mentorId: currentUser.id, mentorName: currentUser.name, direction, format: "Онлайн · 30 мин", link: "https://meet.tpu.ru/guild-interview", status: "free" });
      n++;
    }));
    pushToast({ kind: n ? "success" : "info", title: n ? `Создано слотов: ${n}` : "Новых слотов нет", text: n ? "Кандидаты увидят их в календаре сразу." : "Выбранные слоты уже существуют." });
  }

  const typeLabel: Record<string, string> = { codereview: "Code Review", oneonone: "1-on-1", workshop: "Воркшоп", accelerator: "Акселератор" };

  return (
    <div className="space-y-4">
      <Header title="Кабинет технаставника" desc="Очередь ревью · собеседования · заявки студентов · ваши материалы" />
      <div className="grid gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi l="Ревью в очереди" v={queue.length} tone={queue.length ? "text-sky-600" : "text-emerald-600"} />
        <Kpi l="Вердикты по кандидатам" v={pendingApps.length} tone={pendingApps.length ? "text-amber-600" : "text-emerald-600"} />
        <Kpi l="Свободных слотов" v={free} hint={`${booked} забронировано`} />
        <Kpi l="Новые заявки" v={newReq} tone="text-violet-600" />
        <Kpi l="Мои материалы" v={mine.length} />
        <Kpi l="Просмотров материалов" v={views} tone="text-indigo-600" />
      </div>

      <SegTabs value={tab} onChange={setTab} items={[
        { id: "reviews", label: "Очередь ревью", icon: <GitPullRequest size={14} />, count: queue.length || undefined },
        { id: "interviews", label: "Собеседования", icon: <CalendarCheck size={14} />, count: pendingApps.length || undefined },
        { id: "requests", label: "Заявки студентов", icon: <Inbox size={14} />, count: newReq || undefined },
        { id: "materials", label: "Мои материалы", icon: <BookOpen size={14} />, count: mine.length },
      ]} />

      {tab === "reviews" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {([["queue", "В очереди"], ["changes", "На правках"], ["done", "Принятые"], ["all", "Все"]] as const).map(([id, l]) => (
              <button key={id} onClick={() => setRevFilter(id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${revFilter === id ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{l}</button>
            ))}
          </div>
          {reviews.length === 0 ? <EmptyState title="Здесь пока пусто" text="Новые ревью от студентов и гильдийцев появятся в очереди." /> : (
            <div className="grid gap-3 md:grid-cols-2">
              {reviews.map((r) => {
                const proj = state.projects.find((p) => p.id === r.projectId);
                const open = r.status === "todo" || r.status === "sent";
                return (
                  <Card key={r.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={r.type === "code" ? "sky" : r.type === "design" ? "violet" : r.type === "qa" ? "amber" : "slate"}>{r.type === "code" ? "Code" : r.type === "design" ? "Design" : r.type === "qa" ? "QA" : "Документ"}</Badge>
                      <Badge tone={r.priority === "high" ? "rose" : r.priority === "medium" ? "amber" : "slate"}>{r.priority === "high" ? "Срочно" : r.priority === "medium" ? "Средне" : "Низкий"}</Badge>
                      <Badge tone={r.status === "done" ? "emerald" : r.status === "changes" ? "amber" : "sky"}>{r.status === "done" ? "Принято" : r.status === "changes" ? "На правках" : r.status === "sent" ? "У вас" : "Инициировано"}</Badge>
                      <span className="ml-auto text-[10px] text-slate-400">{r.createdAt}</span>
                    </div>
                    <p className="mt-2 text-sm font-extrabold leading-snug">{r.title}</p>
                    <p className="text-[11px] text-slate-500">{proj?.name} · {r.authorName} ({r.authorSpec})</p>
                    <p className="mt-1.5 text-xs text-slate-600">{r.comment}</p>
                    <p className="mt-1.5 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">{r.fileName ? `📎 ${r.fileName}` : r.link}</p>
                    {r.verdict ? <p className="mt-1.5 rounded-lg bg-indigo-50 p-2 text-[11px] text-indigo-800"><b>Вердикт:</b> {r.verdict}</p> : null}
                    {open ? (
                      <div className="mt-2.5 space-y-2">
                        <textarea value={verdict[r.id] ?? ""} onChange={(e) => setVerdict((v) => ({ ...v, [r.id]: e.target.value }))} rows={2} className={inputCls} placeholder="Комментарий ревьюера (для правок обязателен)" />
                        <div className="flex gap-2">
                          <Btn variant="emerald" size="sm" className="flex-1" onClick={() => { resolveReview(r.id, "done", verdict[r.id]?.trim() || "Принято без замечаний."); pushToast({ kind: "success", title: "Ревью принято", text: r.title }); }}><Check size={14} /> Принять</Btn>
                          <Btn variant="danger" size="sm" className="flex-1" disabled={(verdict[r.id] ?? "").trim().length < 5} onClick={() => { resolveReview(r.id, "changes", verdict[r.id].trim()); pushToast({ kind: "info", title: "Возвращено на правки", text: r.title }); }}><X size={14} /> На правки</Btn>
                        </div>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {tab === "interviews" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-extrabold"><CalendarCheck size={17} className="text-violet-600" /> Генератор слотов</h3>
            <p className="mt-1 text-xs text-slate-500">Выберите период и время — слоты создадутся на все рабочие дни сразу. Выходные пропускаются.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="С"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></Field>
              <Field label="По"><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputCls} /></Field>
            </div>
            <p className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Время</p>
            <div className="flex flex-wrap gap-1.5">
              {TIMES.map((t) => <button key={t} onClick={() => setTimes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))} className={`rounded-full px-3 py-1.5 text-xs font-bold ${times.includes(t) ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{t}</button>)}
            </div>
            <div className="mt-3"><Field label="Направление"><input value={direction} onChange={(e) => setDirection(e.target.value)} className={inputCls} /></Field></div>
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">Будет создано до {planned} слотов ({days.length} раб. дн. × {times.length} вр.)</p>
            <Btn variant="emerald" className="mt-3 w-full" disabled={!planned} onClick={generate}><Plus size={15} /> Создать слоты</Btn>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ближайшая сетка</p>
              <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                {slotsByDay.map(([d, list]) => (
                  <div key={d} className="rounded-xl bg-slate-50 p-2.5">
                    <p className="text-xs font-extrabold">{formatDateRU(d)}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {list.map((s) => (
                        <span key={s.id} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${s.status === "free" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"}`} title={s.status === "free" ? s.direction : `Занят: ${s.bookedByName}`}>
                          {s.time} {s.status === "booked" ? "· занят" : ""}
                          {s.status === "free" ? <button onClick={() => removeSlot(s.id)} className="text-emerald-700/60 hover:text-rose-600" aria-label="Удалить слот"><Trash2 size={11} /></button> : null}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-extrabold"><Check size={17} className="text-emerald-600" /> Вердикты по собеседованиям</h3>
            {pendingApps.length === 0 ? <EmptyState title="Очередь пуста" text="Новые отклики кандидатов появятся здесь." /> : (
              <div className="mt-3 max-h-[560px] space-y-2.5 overflow-y-auto">
                {pendingApps.map((a) => {
                  const slot = state.slots.find((s) => s.id === a.slotId);
                  return (
                    <div key={a.id} className="rounded-2xl border border-slate-200 p-3.5">
                      <p className="text-sm font-extrabold">{a.userName} <span className="font-medium text-slate-400">· {a.telegram}</span></p>
                      <p className="text-xs text-slate-500">{a.vacancyTitle} · хочет: {a.roleWant}</p>
                      {slot ? <p className="mt-1 text-[11px] font-bold text-sky-700">{formatDateRU(slot.date)} в {slot.time}</p> : null}
                      <p className="mt-1.5 rounded-xl bg-slate-50 p-2.5 text-xs italic text-slate-600">«{a.motivation}»</p>
                      <div className="mt-2 flex gap-2">
                        <Btn variant="emerald" size="sm" className="flex-1" onClick={() => { verdictApplication(a.id, true); pushToast({ kind: "success", title: "Кандидат принят!", text: `${a.userName} — добро пожаловать в Гильдию.` }); }}><Check size={14} /> Принять</Btn>
                        <Btn variant="danger" size="sm" className="flex-1" onClick={() => { verdictApplication(a.id, false); pushToast({ kind: "info", title: "Отклонено", text: "Кандидат получил мягкий ответ с рекомендациями." }); }}><X size={14} /> Отклонить</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "requests" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {[["all", "Все"], ["codereview", "Code Review"], ["oneonone", "1-on-1"], ["workshop", "Воркшопы"], ["accelerator", "Акселератор"]].map(([id, l]) => (
              <button key={id} onClick={() => setReqFilter(id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${reqFilter === id ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{l}</button>
            ))}
          </div>
          {reqs.length === 0 ? <EmptyState title="Заявок нет" text="Здесь появятся запросы студентов на консультации и воркшопы." /> : (
            <div className="grid gap-3 md:grid-cols-2">
              {reqs.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={r.type === "codereview" ? "sky" : r.type === "oneonone" ? "violet" : r.type === "workshop" ? "amber" : "emerald"}>{typeLabel[r.type]}</Badge>
                    <Badge tone={r.status === "new" ? "amber" : r.status === "accepted" ? "sky" : r.status === "done" ? "emerald" : "rose"}>{r.status === "new" ? "Новая" : r.status === "accepted" ? "Принята" : r.status === "done" ? "Завершена" : "Отклонена"}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm font-extrabold">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.description}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{r.requesterName} · {r.requesterSpec} · {r.createdAt}</p>
                  <div className="mt-2 flex gap-2">
                    {r.status === "new" ? (
                      <>
                        <Btn variant="emerald" size="sm" className="flex-1" onClick={() => { updateRequest(r.id, "accepted"); pushToast({ kind: "success", title: "Заявка принята", text: "Студент получил уведомление." }); }}>Принять</Btn>
                        <Btn variant="ghost" size="sm" onClick={() => { updateRequest(r.id, "rejected"); pushToast({ kind: "info", title: "Заявка отклонена" }); }}>Отклонить</Btn>
                      </>
                    ) : r.status === "accepted" ? <Btn variant="secondary" size="sm" onClick={() => { updateRequest(r.id, "done"); pushToast({ kind: "success", title: "Заявка завершена" }); }}><Check size={14} /> Отметить завершённой</Btn> : null}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "materials" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">Статьи, видеозаписи воркшопов и презентации, которые вы опубликовали.</p>
            <div className="flex gap-2">
              <Link href="/knowledge"><Btn variant="emerald" size="sm"><Plus size={14} /> Новый материал</Btn></Link>
              <Link href="/events"><Btn variant="outline" size="sm"><CalendarCheck size={14} /> Запланировать воркшоп</Btn></Link>
            </div>
          </div>
          {mine.length === 0 ? <EmptyState title="Материалов пока нет" text="Опубликуйте статью, видеозапись воркшопа или презентацию — они появятся в базе знаний." action={<Link href="/knowledge"><Btn variant="emerald" size="sm">В базу знаний</Btn></Link>} /> : (
            <div className="grid gap-3 md:grid-cols-2">
              {mine.map((a) => (
                <Link key={a.id} href={`/knowledge/${a.id}`}>
                  <Card className="flex h-full items-start gap-3 p-4 transition hover:border-emerald-300 hover:shadow-md">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${a.kind === "video" ? "bg-rose-100 text-rose-600" : a.kind === "presentation" ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"}`}>{a.kind === "video" ? <Video size={18} /> : a.kind === "presentation" ? <Presentation size={18} /> : <FileText size={18} />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold leading-snug">{a.title}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">{a.category} · {a.createdAt}</span>
                      <span className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-slate-500"><span className="flex items-center gap-1"><Eye size={11} /> {a.views}</span><span>♥ {a.likes}</span></span>
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
      {role_hint()}
    </div>
  );
}

function role_hint() {
  return <p className="flex items-center gap-1.5 text-[11px] text-slate-400"><AlertTriangle size={12} /> Права технаставника: глубокие ревью, сетка слотов, вердикты, материалы базы знаний.</p>;
}
