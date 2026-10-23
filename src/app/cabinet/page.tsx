"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Briefcase,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Crown,
  Eye,
  GraduationCap,
  Inbox,
  Map as MapIcon,
  PenLine,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useGuild, formatDateRU } from "@/lib/store";
import { roleMeta, ROLES } from "@/lib/rbac";
import { SKILL_GROUPS, calcMatch } from "@/lib/seed";
import { ROADMAPS } from "@/lib/roadmaps";
import type { RoleId } from "@/lib/types";
import { Avatar, Badge, Btn, Card, EmptyState, Field, MatchRing, Modal, Progress, inputCls } from "@/components/ui";
import { AdminPanel } from "@/components/admin-panel";
import { MentorView, TechView } from "@/components/cabinet-staff";
import { SPRINT_CRIT, SPRINT_CRIT_LABEL, SPRINT_MAX, addDays, dayState, fmt, gradeSum, semesterRange, shortRange, sprintEnd, summarize, todayISO, workdaysBetween } from "@/lib/scoring";

export default function CabinetPage() {
  const { role } = useGuild();
  if (role === "guest") return <GuestCabinet />;
  if (role === "candidate") return <CandidateView />;
  if (role === "intern" || role === "junior") return <StudentView />;
  if (role === "mentor") return <MentorView />;
  if (role === "techmentor") return <TechView />;
  return <AdminView />;
}

function GuestCabinet() {
  const { setRole } = useGuild();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Личный кабинет</h1>
      <Card className="p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Eye size={26} /></span>
        <h2 className="mt-4 text-lg font-extrabold">Вы просматриваете как Гость</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Кабинет доступен после входа. Авторизация — это выплывающий список уровней доступа в шапке: выберите роль от Кандидата до Администратора, и права применятся мгновенно без пароля.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Btn variant="emerald" onClick={() => setRole("candidate")}>Войти как Кандидат</Btn>
          <Btn variant="secondary" onClick={() => setRole("intern")}>Студент</Btn>
          <Btn variant="secondary" onClick={() => setRole("admin")}>Администратор</Btn>
        </div>
      </Card>
    </div>
  );
}

/* ============ SHARED: profile editor + skills ============ */

function ProfileCard() {
  const { currentUser, updateUser, pushToast } = useGuild();
  const [edit, setEdit] = useState(false);
  const [bio, setBio] = useState(currentUser.bio);
  const [exp, setExp] = useState(currentUser.experience);
  const [github, setGithub] = useState(currentUser.github);
  const [telegram, setTelegram] = useState(currentUser.telegram);
  const [figma, setFigma] = useState(currentUser.figma);
  const [portfolio, setPortfolio] = useState(currentUser.portfolio);

  React.useEffect(() => {
    setBio(currentUser.bio);
    setExp(currentUser.experience);
    setGithub(currentUser.github);
    setTelegram(currentUser.telegram);
    setFigma(currentUser.figma);
    setPortfolio(currentUser.portfolio);
  }, [currentUser.id]);

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <Avatar name={currentUser.name} color={currentUser.color} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold">{currentUser.name}</h2>
            <Badge tone="emerald">{currentUser.grade}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{currentUser.spec} · {currentUser.institute} · {currentUser.course}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-2"><p className="font-extrabold">{currentUser.projectsCount}</p><p className="text-[10px] text-slate-500">проектов</p></div>
            <div className="rounded-xl bg-slate-50 p-2"><p className="font-extrabold">{currentUser.tasksClosed}</p><p className="text-[10px] text-slate-500">задач</p></div>
            <div className="rounded-xl bg-slate-50 p-2"><p className="flex items-center justify-center gap-1 font-extrabold"><Star size={12} className="text-amber-500" />{currentUser.rating || "—"}</p><p className="text-[10px] text-slate-500">рейтинг</p></div>
          </div>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => setEdit((v) => !v)}><PenLine size={14} /> {edit ? "Скрыть" : "Изменить"}</Btn>
      </div>
      {!edit ? (
        <div className="mt-3 space-y-1.5 text-[13px] text-slate-600">
          <p><b>О себе:</b> {currentUser.bio}</p>
          <p><b>Опыт:</b> {currentUser.experience}</p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            {currentUser.github ? <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">GitHub: {currentUser.github}</span> : null}
            {currentUser.telegram ? <span className="rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-700">TG: {currentUser.telegram}</span> : null}
            {currentUser.figma ? <span className="rounded-full bg-violet-50 px-2.5 py-1 font-semibold text-violet-700">Figma: {currentUser.figma}</span> : null}
            {currentUser.portfolio ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">{currentUser.portfolio}</span> : null}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <Field label="О себе"><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className={inputCls} /></Field>
          <Field label="Опыт"><textarea value={exp} onChange={(e) => setExp(e.target.value)} rows={2} className={inputCls} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="GitHub"><input value={github} onChange={(e) => setGithub(e.target.value)} className={inputCls} /></Field>
            <Field label="Telegram"><input value={telegram} onChange={(e) => setTelegram(e.target.value)} className={inputCls} /></Field>
            <Field label="Figma"><input value={figma} onChange={(e) => setFigma(e.target.value)} className={inputCls} /></Field>
            <Field label="Портфолио"><input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className={inputCls} /></Field>
          </div>
          <Btn variant="emerald" size="sm" onClick={() => { updateUser(currentUser.id, { bio, experience: exp, github, telegram, figma, portfolio }); setEdit(false); pushToast({ kind: "success", title: "Профиль обновлён!" }); }}>
            <Check size={15} /> Сохранить профиль
          </Btn>
        </div>
      )}
    </Card>
  );
}

function SkillPicker() {
  const { currentUser, updateUser, pushToast } = useGuild();
  const mine = currentUser.skills;
  function toggle(s: string) {
    const next = mine.includes(s) ? mine.filter((x) => x !== s) : [...mine, s];
    updateUser(currentUser.id, { skills: next });
  }
  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 font-extrabold"><Sparkles size={17} className="text-emerald-600" /> Мои навыки <span className="text-xs font-medium text-slate-400">({mine.length} выбрано)</span></h3>
      <p className="mt-1 text-xs text-slate-500">От них зависит % совпадения с вакансиями. Нажмите, чтобы добавить или убрать.</p>
      <div className="mt-3 space-y-3">
        {SKILL_GROUPS.map((g) => (
          <div key={g.title}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{g.title}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {g.skills.map((s) => {
                const on = mine.includes(s);
                return (
                  <button key={s} onClick={() => toggle(s)} className={`rounded-full border px-2.5 py-1 text-xs font-bold transition ${on ? "border-emerald-500 bg-emerald-500 text-white shadow" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300"}`}>
                    {on ? "✓ " : "+ "}{s}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Btn variant="ghost" size="sm" className="mt-3" onClick={() => pushToast({ kind: "success", title: "Навыки сохранены", text: "Умная выдача вакансий пересчитана." })}>
        Пересчитать мэтчинг
      </Btn>
    </Card>
  );
}

function MyApplications() {
  const { state, currentUser, cancelApplication, pushToast } = useGuild();
  const mine = state.applications.filter((a) => a.userId === currentUser.id && a.status !== "cancelled");
  const slotsById = Object.fromEntries(state.slots.map((s) => [s.id, s]));
  if (mine.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="flex items-center gap-2 font-extrabold"><CalendarCheck size={17} className="text-sky-600" /> Мои записи на собеседования</h3>
        <EmptyState title="Записей пока нет" text="Выберите вакансию и забронируйте слот — здесь появятся время, ссылка на звонок и статусы." action={<Link href="/vacancies"><Btn variant="emerald" size="sm">К вакансиям</Btn></Link>} />
      </Card>
    );
  }
  const statusTone: Record<string, string> = { booked: "sky", pending: "amber", accepted: "emerald", rejected: "rose", draft: "slate" };
  const statusLabel: Record<string, string> = { booked: "Слот забронирован", pending: "На рассмотрении", accepted: "Принят!", rejected: "Отклонён", draft: "Черновик", cancelled: "Отменена" };
  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 font-extrabold"><CalendarCheck size={17} className="text-sky-600" /> Мои записи на собеседования ({mine.length})</h3>
      <div className="mt-3 space-y-2.5">
        {mine.map((a) => {
          const slot = a.slotId ? slotsById[a.slotId] : undefined;
          return (
            <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-extrabold">{a.vacancyTitle}</p>
                <Badge tone={statusTone[a.status] ?? "slate"}>{statusLabel[a.status]}</Badge>
              </div>
              {slot ? (
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-600">
                  <span className="flex items-center gap-1 font-bold"><Clock size={13} /> {formatDateRU(slot.date)} в {slot.time}</span>
                  <span>{slot.mentorName} · {slot.direction}</span>
                  <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-1 font-bold text-emerald-700 hover:underline"><Video size={13} /> Ссылка на звонок</a>
                </p>
              ) : <p className="mt-1 text-xs text-slate-500">Слот не выбран · заявка от {a.createdAt}</p>}
              {a.verdict ? <p className="mt-1.5 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600"><b>Вердикт:</b> {a.verdict}</p> : null}
              {(a.status === "booked" || a.status === "pending") ? (
                <div className="mt-2 flex gap-2">
                  <Btn variant="ghost" size="sm" onClick={() => { cancelApplication(a.id); pushToast({ kind: "info", title: "Запись отменена", text: "Слот снова свободен для других кандидатов. Перенос — через новую бронь." }); }}>
                    <X size={14} /> Отменить / перенести (&gt;24ч)
                  </Btn>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function MatchedVacancies() {
  const { state, currentUser } = useGuild();
  const top = useMemo(() => state.vacancies.map((v) => ({ v, m: calcMatch(currentUser.skills, v) })).sort((a, b) => b.m - a.m).slice(0, 3), [state.vacancies, currentUser.skills]);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-extrabold"><Briefcase size={17} className="text-emerald-600" /> Вакансии по вашим навыкам</h3>
        <Link href="/vacancies" className="flex items-center gap-1 text-xs font-bold text-emerald-700">Все <ChevronRight size={14} /></Link>
      </div>
      <div className="mt-3 space-y-2">
        {top.map(({ v, m }) => (
          <Link key={v.id} href="/vacancies" className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3 hover:border-emerald-200 hover:bg-emerald-50/40">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold">{v.title}</p>
              <p className="truncate text-[11px] text-slate-500">{v.projectName} · {v.grade}</p>
            </div>
            <MatchRing value={m} />
          </Link>
        ))}
      </div>
    </Card>
  );
}

/* ============ VIEW A: candidate ============ */

function CandidateView() {
  return (
    <div className="space-y-4">
      <CabinetHeader title="Кабинет кандидата" desc="Профиль, навыки, персональные вакансии и записи на собеседования" />
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileCard />
        <SkillPicker />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <MatchedVacancies />
        <MyApplications />
      </div>
    </div>
  );
}

function CabinetHeader({ title, desc }: { title: string; desc: string }) {
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

/* ============ VIEW B: intern / junior ============ */

function StudentView() {
  const { role, state, currentUser } = useGuild();
  const myProject = state.projects.find((p) => p.team.some((t) => t.name === currentUser.name)) ?? state.projects[0];
  return (
    <div className="space-y-4">
      <CabinetHeader title={role === "intern" ? "Кабинет студента (Intern)" : "Кабинет гильдийца (Junior)"} desc="Проекты и портфолио · роадмап · рейтинги · база знаний" />
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileCard />
        <SkillPicker />
      </div>
      <MyProjects />
      <div className="grid gap-4 lg:grid-cols-2">
        <RoadmapWidget />
        <GradesWidget />
      </div>
      <Card className="p-5">
        <p className="text-sm font-extrabold">Ежедневный отчёт переехал в воркспейс проекта</p>
        <p className="mt-1 text-xs text-slate-500">Теперь дейли добавляются в календарь проекта — там же отчёты команды и видимые блокеры.</p>
        <Link href={`/projects/${myProject?.id ?? "p-guild"}?tab=daily`} className="mt-2 inline-block"><Btn variant="emerald" size="sm">Открыть календарь дейликов</Btn></Link>
      </Card>
      {role === "junior" ? <MenteesWidget /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <MatchedVacancies />
        <MyApplications />
      </div>
    </div>
  );
}

function MyProjects() {
  const { state, currentUser, role } = useGuild();
  const mine = state.projects.filter((p) => p.team.some((t) => t.userId === currentUser.id || t.name === currentUser.name));
  const show = mine.length ? mine : state.projects.slice(0, 2);
  const myTasks = state.tasks.filter((t) => t.assigneeName === currentUser.name);
  const done = state.tasks.filter((t) => t.assigneeName === currentUser.name && t.status === "done").length;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-extrabold"><Rocket size={17} className="text-indigo-600" /> Мои проекты и портфолио</h3>
        <Link href="/projects" className="text-xs font-bold text-emerald-700">Все проекты</Link>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {show.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-extrabold">{p.name}</p>
              <Badge tone="slate">{p.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">{p.short}</p>
            <div className="mt-2"><Progress value={p.progress} /></div>
            <div className="mt-2 flex gap-2">
              <Link href={`/projects/${p.id}`} className="flex-1"><Btn variant="secondary" size="sm" className="w-full">Воркспейс</Btn></Link>
              <Btn variant="outline" size="sm">Сертификат</Btn>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-center sm:grid-cols-4">
        <div><p className="font-extrabold">{myTasks.length}</p><p className="text-[11px] text-slate-500">моих задач</p></div>
        <div><p className="font-extrabold text-emerald-600">{done}</p><p className="text-[11px] text-slate-500">закрыто</p></div>
        <div><p className="font-extrabold">{currentUser.projectsCount}</p><p className="text-[11px] text-slate-500">проектов</p></div>
        <div><p className="font-extrabold">{role === "junior" ? "2" : "0"}</p><p className="text-[11px] text-slate-500">подопечных</p></div>
      </div>
    </Card>
  );
}

function RoadmapWidget() {
  const { currentUser, state, toggleRoadmap, pushToast } = useGuild();
  const specs = ["Backend", "Frontend", "Аналитика", "Тестирование", "UI/UX", "PM"];
  const initial = specs.find((s) => currentUser.spec.toLowerCase().includes(s.toLowerCase().slice(0, 4))) ?? "Backend";
  const [spec, setSpec] = useState(initial);
  const roadmap = ROADMAPS.find((r) => r.spec === spec) ?? ROADMAPS[0];
  const key = `${currentUser.id}:${spec}`;
  const doneItems = state.roadmapDone[key] ?? [];
  const total = roadmap.stages.reduce((n, s) => n + s.items.length, 0);
  const pct = Math.round((doneItems.length / total) * 100);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-extrabold"><MapIcon size={17} className="text-violet-600" /> Интерактивный роадмап</h3>
        <select value={spec} onChange={(e) => setSpec(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold">
          {ROADMAPS.map((r) => <option key={r.spec}>{r.spec}</option>)}
        </select>
      </div>
      <p className="mt-1 text-xs text-slate-500">{roadmap.intro}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1"><Progress value={pct} color="bg-violet-500" /></div>
        <span className="text-xs font-extrabold text-violet-700">{pct}%</span>
      </div>
      <div className="mt-3 space-y-3">
        {roadmap.stages.map((st, si) => (
          <div key={st.title} className="rounded-2xl border border-slate-200 p-3.5">
            <p className="text-[13px] font-extrabold"><span className="mr-1.5 inline-grid size-5 place-items-center rounded-full bg-slate-900 text-[10px] text-white">{si + 1}</span>{st.title}</p>
            <div className="mt-2 space-y-1.5">
              {st.items.map((item) => {
                const done = doneItems.includes(item);
                return (
                  <button key={item} onClick={() => { toggleRoadmap(currentUser.id, spec, item); if (!done) pushToast({ kind: "success", title: "Шаг роадмапа закрыт!", text: item }); }} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${done ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 hover:border-violet-300"}`}>
                    <span className={`grid size-4 shrink-0 place-items-center rounded-full border ${done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}><Check size={11} /></span>
                    <span className={done ? "line-through opacity-70" : ""}>{item}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {st.links.map((l) => (
                <Link key={l.label} href="/knowledge" className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                  <BookOpen size={10} className="mr-1 inline" />{l.label} · {l.kind}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MenteesWidget() {
  const { state } = useGuild();
  const mentees = [
    { name: "Алина Соколова", spec: "Backend", progress: 62, blocker: "Нужен пример optimistic lock", review: "PR «API бронирования» ждёт ревью" },
    { name: "Тимур Ахметов", spec: "Frontend", progress: 41, blocker: "Нет блокеров", review: "PR «Календарь событий» — 2 замечания" },
  ];
  const onReview = state.tasks.filter((t) => t.status === "review");
  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 font-extrabold"><Users size={17} className="text-indigo-600" /> Мои подопечные (Interns)</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {mentees.map((m) => (
          <div key={m.name} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2.5">
              <Avatar name={m.name} color="bg-emerald-500" />
              <div><p className="text-sm font-extrabold">{m.name}</p><p className="text-xs text-slate-500">{m.spec} · прогресс {m.progress}%</p></div>
            </div>
            <div className="mt-2"><Progress value={m.progress} /></div>
            <p className="mt-2 rounded-xl bg-amber-50 p-2 text-xs text-amber-800"><b>Блокер:</b> {m.blocker}</p>
            <p className="mt-1.5 rounded-xl bg-sky-50 p-2 text-xs text-sky-800"><b>Ревью:</b> {m.review}</p>
          </div>
        ))}
      </div>
      {onReview.length > 0 ? (
        <p className="mt-3 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800 ring-1 ring-indigo-200">На первичном ревью у вас: {onReview.length} задач(и) — {onReview.map((t) => `«${t.title}»`).join(", ")}</p>
      ) : null}
    </Card>
  );
}

/* ============ VIEW E: admin ============ */

function AdminView() {
  return <AdminPanel />;
}

/* ============ Мои баллы и оценки (student / junior) ============ */

function GradesWidget() {
  const { state, currentUser } = useGuild();
  const today = todayISO();
  const range = semesterRange(0);
  const me = summarize(currentUser.name, state.dailies, state.grades, state.sprints, range, today);
  const board = state.users
    .filter((u) => u.role === "intern" || u.role === "junior")
    .map((u) => ({ name: u.name, pct: summarize(u.name, state.dailies, state.grades, state.sprints, range, today).percent }))
    .sort((a, b) => b.pct - a.pct);
  const place = board.findIndex((b) => b.name === currentUser.name) + 1;
  const mine = state.grades.filter((g) => g.userName === currentUser.name);
  const strip = workdaysBetween(addDays(today, -21), today).slice(-10);

  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 font-extrabold"><Award size={17} className="text-amber-600" /> Мои баллы и оценки</h3>
      <p className="mt-0.5 text-[11px] text-slate-500">{range.label}</p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-2xl font-extrabold text-emerald-600">{me.percent}%</p><p className="text-[10px] font-semibold text-emerald-800">итоговый</p></div>
        <div className="rounded-2xl bg-slate-50 p-3"><p className="text-2xl font-extrabold">{place ? `#${place}` : "—"}</p><p className="text-[10px] font-semibold text-slate-500">из {board.length} в рейтинге</p></div>
        <div className="rounded-2xl bg-slate-50 p-3"><p className="text-2xl font-extrabold">{fmt(me.total)}</p><p className="text-[10px] font-semibold text-slate-500">баллов из {me.maxTotal}</p></div>
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <div className="flex justify-between text-[11px] font-bold text-slate-600"><span>Дейли: {fmt(me.daily.points)} / {me.daily.max}</span><span>{me.dailyPercent}%</span></div>
          <Progress value={me.dailyPercent} color="bg-emerald-500" />
          <p className="mt-0.5 text-[10px] text-slate-400">вовремя (1 б.): {me.daily.onTime} · «ничего не делал»/опоздание (0,5): {me.daily.partial} · пропуски (0): {me.daily.missed}</p>
        </div>
        <div>
          <div className="flex justify-between text-[11px] font-bold text-slate-600"><span>Спринты (наставник): {me.sprint.points} / {me.sprint.max}</span><span>{me.sprintPercent}%</span></div>
          <Progress value={me.sprintPercent} color="bg-amber-400" />
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Мои дейли · последние 10 рабочих дней</p>
        <div className="mt-1.5 flex gap-1">
          {strip.map((day) => {
            const st = dayState(currentUser.name, state.dailies, day, today);
            const color = st.kind === "ok" ? "bg-emerald-500" : st.kind === "partial" ? "bg-amber-400" : st.kind === "missed" ? "bg-rose-400" : "bg-slate-200";
            return <span key={day} title={`${day}`} className={`h-6 flex-1 rounded-md ${color}`} />;
          })}
        </div>
      </div>

      {mine.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">Оценок наставника за спринты пока нет — они появятся по итогам первого спринта.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {mine.map((g) => (
            <div key={g.id} className="rounded-2xl border border-slate-200 p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-extrabold">{g.projectName} · {g.sprint}</p>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-700">{gradeSum(g)}/{SPRINT_MAX}</span>
              </div>
              <div className="mt-2 space-y-1">
                {SPRINT_CRIT.map((c) => (
                  <div key={c} className="flex items-center gap-2">
                    <span className="w-32 text-[11px] font-semibold text-slate-500">{SPRINT_CRIT_LABEL[c]}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${(g[c] / 5) * 100}%` }} /></div>
                    <span className="w-6 text-right text-[11px] font-extrabold text-slate-600">{g[c]}</span>
                  </div>
                ))}
              </div>
              {g.comment ? <p className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600"><b>Комментарий наставника:</b> {g.comment}</p> : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
