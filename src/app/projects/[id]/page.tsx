"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CalendarRange,
  CalendarPlus,
  Check,
  ClipboardList,
  Code2,
  FileText,
  GitPullRequest,
  KanbanSquare,
  ListTodo,
  PenTool,
  Plus,
  Settings2,
  Siren,
  Sparkles,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { useGuild, formatDateRU, formatFullRU } from "@/lib/store";
import type { Project, ReviewRequest, TaskItem } from "@/lib/types";
import { Avatar, Badge, Btn, Card, EmptyState, Field, Modal, Progress, inputCls } from "@/components/ui";
import { DailyCalendar } from "@/components/daily-calendar";
import { sprintStatusByDate, todayISO, addDays } from "@/lib/scoring";
import { RoadmapTab } from "@/components/roadmap";
import { ProjectOverview, type TabId } from "@/components/project-overview";

const TABS = [
  { id: "overview", label: "Обзор", icon: Sparkles },
  { id: "roadmap", label: "Дорожная карта и спринты", icon: CalendarRange },
  { id: "review", label: "Ревью (канбан)", icon: GitPullRequest },
  { id: "daily", label: "Дейлики · календарь", icon: ClipboardList },
  { id: "events", label: "Мероприятия", icon: CalendarPlus },
  { id: "team", label: "Команда и вакансии", icon: Users },
  { id: "settings", label: "Настройки проекта", icon: Settings2 },
] as const;

const REVIEW_COLS: { id: ReviewRequest["status"]; label: string; tone: string; hint: string }[] = [
  { id: "todo", label: "Инициация ревью", tone: "bg-slate-100 text-slate-700", hint: "Автор готовит материалы" },
  { id: "sent", label: "У технаставника", tone: "bg-sky-100 text-sky-700", hint: "Взято в глубокое ревью" },
  { id: "changes", label: "Вернуть на правки", tone: "bg-amber-100 text-amber-800", hint: "Есть замечания" },
  { id: "done", label: "Принято", tone: "bg-emerald-100 text-emerald-700", hint: "Ревью пройдено" },
];


export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const { state, currentUser, role, can, pushToast, addEscalation } = useGuild();
  const sp = useSearchParams();
  const [tab, setTab] = useState<TabId>(() => {
    const q = sp.get("tab");
    return TABS.some((x) => x.id === q) ? (q as TabId) : "overview";
  });
  const [escOpen, setEscOpen] = useState(false);
  const project = state.projects.find((p) => p.id === params.id);

  if (!project) {
    return <EmptyState title="Проект не найден" text="Вернитесь к списку проектов." action={<Link href="/projects"><Btn variant="secondary" size="sm">К проектам</Btn></Link>} />;
  }

  const isManager = can("manage_projects") || can("launch_projects");
  const reviews = state.reviews.filter((r) => r.projectId === project.id);
  const dailies = state.dailies.filter((d) => d.projectId === project.id);
  const events = state.events.filter((e) => e.projectId === project.id);
  const vacancies = state.vacancies.filter((v) => v.projectId === project.id);
  const escalations = state.escalations.filter((e) => e.projectId === project.id);
  const openReviews = reviews.filter((r) => r.status !== "done").length;
  const activeSprint = state.sprints.find((x) => x.projectId === project.id && sprintStatusByDate(x) === "active");

  return (
    <div className="space-y-4">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Все проекты
      </Link>

      <div className={`overflow-hidden rounded-3xl bg-gradient-to-r p-6 text-white ${project.cover}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="slate">{project.status}</Badge>
          <Badge tone="slate">{project.typeLabel}</Badge>
          {project.commercial ? <Badge tone="amber">Коммерческий</Badge> : <Badge tone="emerald">Внутренний ЦЭУ</Badge>}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{project.name}</h1>
        <p className="mt-1 max-w-3xl text-sm opacity-90">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold"><Code2 size={13} /> {project.links.github || "GitHub не привязан"}</span>
          <span className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold"><ListTodo size={13} /> {project.links.tracker || "Трекер не привязан"}</span>
          <span className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold"><PenTool size={13} /> {project.links.figma || "Figma не привязана"}</span>
          {activeSprint ? <span className="flex items-center gap-1.5 rounded-xl bg-white/25 px-3 py-1.5 text-xs font-extrabold">{activeSprint.title}: {activeSprint.week1Stage === activeSprint.week2Stage ? activeSprint.week1Stage : `${activeSprint.week1Stage} → ${activeSprint.week2Stage}`}</span> : null}
          <span className="ml-auto text-xs font-semibold opacity-80">Дедлайн: {project.deadline} · {project.team.length} участников</span>
        </div>
        <div className="mt-3 max-w-md"><Progress value={project.progress} color="bg-white" /></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.filter((t) => ((t.id === "team" || t.id === "settings") ? isManager : true)).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-bold transition ${
              tab === t.id ? "bg-slate-900 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <t.icon size={15} /> {t.label}
            {t.id === "review" && openReviews > 0 ? <span className={`rounded-full px-1.5 text-[10px] ${tab === t.id ? "bg-white/20" : "bg-sky-100 text-sky-700"}`}>{openReviews}</span> : null}
            {t.id === "events" && events.length > 0 ? <span className={`rounded-full px-1.5 text-[10px] ${tab === t.id ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{events.length}</span> : null}
          </button>
        ))}
      </div>

      {tab === "overview" ? <ProjectOverview project={project} goTab={setTab} onEscalate={() => setEscOpen(true)} /> : null}

      {tab === "review" ? <ReviewBoard project={project} reviews={reviews} /> : null}
      {tab === "roadmap" ? <RoadmapTab project={project} /> : null}
      {tab === "daily" ? <DailyCalendar project={project} /> : null}
      {tab === "events" ? <ProjectEvents projectId={project.id} events={events} /> : null}
      {tab === "team" && isManager ? <TeamVacancies projectId={project.id} /> : null}
      {tab === "settings" && isManager ? <ProjectSettings project={project} /> : null}

      <Modal open={escOpen} onClose={() => setEscOpen(false)} wide title="Эскалация проблемы" subtitle="Заявка уйдёт строго по иерархии Гильдии">
        <EscForm
          onDone={(vals) => {
            addEscalation({ id: `esc-${Date.now()}`, projectId: project.id, projectName: project.name, type: vals.type, title: vals.title, description: vals.description, steps: vals.steps, links: vals.links, authorName: currentUser.name, status: "new", createdAt: new Date().toISOString().slice(0, 10) });
            setEscOpen(false);
            pushToast({ kind: "warn", title: "Эскалация отправлена!", text: vals.type === "tech" ? "Назначен технаставник направления." : vals.type === "org" ? "Наставник → орг. отдел (СГ)." : "Заявка ушла в орг. отдел." });
          }}
        />
      </Modal>

      {role === "guest" || role === "candidate" ? (
        <Card className="p-4 text-xs text-slate-500">Полный воркспейс доступен участникам проекта: ревью, дейлики, команда и настройки.</Card>
      ) : null}
    </div>
  );
}

/* ================= REVIEW KANBAN ================= */

function ReviewBoard({ project, reviews }: { project: Project; reviews: ReviewRequest[] }) {
  const { state, pushToast, addReview, moveReview, removeReview, can } = useGuild();
  const [open, setOpen] = useState(false);
  const techLeads = state.users.filter((u) => u.role === "techmentor" || u.role === "admin").map((u) => u.name);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-extrabold"><GitPullRequest size={18} className="text-indigo-600" /> Канбан инициации ревью</h2>
          <p className="mt-1 text-xs text-slate-500">
            Студент и гильдиец инициируют ревью технаставнику: прикрепите ссылку (PR, Figma, документ) или файл и опишите контекст.
            Лёгкое ревью — гильдиец, глубокое — технаставник.
          </p>
        </div>
        <Btn variant="emerald" size="sm" onClick={() => setOpen(true)}><Plus size={15} /> Инициировать ревью</Btn>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {REVIEW_COLS.map((c) => (
          <div key={c.id} className="rounded-2xl bg-slate-200/50 p-2.5">
            <p className={`rounded-xl px-3 py-1.5 text-xs font-extrabold ${c.tone}`}>{c.label} · {reviews.filter((r) => r.status === c.id).length}</p>
            <p className="mt-1 px-1 text-[10px] text-slate-500">{c.hint}</p>
            <div className="mt-2 space-y-2">
              {reviews.filter((r) => r.status === c.id).map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={r.type === "code" ? "sky" : r.type === "design" ? "violet" : r.type === "qa" ? "amber" : "slate"}>
                      {r.type === "code" ? "Code" : r.type === "design" ? "Design" : r.type === "qa" ? "QA" : "Документ"}
                    </Badge>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.priority === "high" ? "bg-rose-100 text-rose-700" : r.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                      {r.priority === "high" ? "Срочно" : r.priority === "medium" ? "Средне" : "Низкий"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] font-bold leading-snug">{r.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{r.comment}</p>
                  <div className="mt-2 rounded-lg bg-slate-50 p-2">
                    <p className="truncate text-[11px] font-bold text-slate-600">{r.fileName ? <><FileText size={11} className="mr-1 inline" />{r.fileName}</> : <><Code2 size={11} className="mr-1 inline" />{r.link}</>}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Avatar name={r.authorName} color="bg-emerald-500" size="sm" />
                    <span className="truncate text-[11px] text-slate-500">{r.authorName} → <b>{r.reviewerName}</b></span>
                  </div>
                  {r.verdict ? <p className="mt-1.5 rounded-lg bg-indigo-50 p-2 text-[11px] text-indigo-800"><b>Вердикт:</b> {r.verdict}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {REVIEW_COLS.filter((x) => x.id !== r.status).map((x) => (
                      <button key={x.id} onClick={() => { moveReview(r.id, x.id); pushToast({ kind: "info", title: "Ревью перемещено", text: `«${r.title}» → ${x.label}` }); }} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200">
                        → {x.label}
                      </button>
                    ))}
                    {can("deep_review") && r.status === "sent" ? (
                      <button onClick={() => { moveReview(r.id, "done"); pushToast({ kind: "success", title: "Ревью принято!", text: r.title }); }} className="rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white">Принять</button>
                    ) : null}
                    <button onClick={() => removeReview(r.id)} className="ml-auto rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              {reviews.filter((r) => r.status === c.id).length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-3 text-center text-[11px] text-slate-400">Пусто</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} wide title="Инициировать ревью" subtitle={`Проект: ${project.name}`}>
        <ReviewForm reviewers={techLeads} onDone={(v) => {
          addReview({ id: `rv-${Date.now()}`, projectId: project.id, ...v, createdAt: "только что" });
          setOpen(false);
          pushToast({ kind: "success", title: "Ревью инициировано!", text: `${v.reviewerName} получил(а) заявку: ${v.title}` });
        }} />
      </Modal>
    </div>
  );
}

function ReviewForm({ reviewers, onDone }: { reviewers: string[]; onDone: (v: Omit<ReviewRequest, "id" | "projectId" | "createdAt">) => void }) {
  const { currentUser } = useGuild();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReviewRequest["type"]>("code");
  const [link, setLink] = useState("");
  const [fileName, setFileName] = useState("");
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState(reviewers[0] ?? "Михаил Громов");
  const [priority, setPriority] = useState<ReviewRequest["priority"]>("medium");
  return (
    <div className="space-y-4">
      <Field label="Что ревьюим"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Например: Ревью PR #142: API бронирования слотов" /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Тип ревью">
          <select value={type} onChange={(e) => setType(e.target.value as ReviewRequest["type"])} className={inputCls}>
            <option value="code">Code Review</option>
            <option value="design">Design Review</option>
            <option value="qa">Ревью тест-кейсов</option>
            <option value="doc">Ревью документации / ТЗ</option>
          </select>
        </Field>
        <Field label="Технаставник">
          <select value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} className={inputCls}>
            {reviewers.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Приоритет">
          <select value={priority} onChange={(e) => setPriority(e.target.value as ReviewRequest["priority"])} className={inputCls}>
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Срочно</option>
          </select>
        </Field>
      </div>
      <Field label="Прикрепить ссылку (PR, Figma, документ)" hint="Или загрузите файл — достаточно названия, демо-режим">
        <div className="flex gap-2">
          <input value={link} onChange={(e) => setLink(e.target.value)} className={inputCls} placeholder="github.com/tpu-guild/platform/pull/142" />
          <label className="shrink-0 cursor-pointer rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
            Файл
            <input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          </label>
        </div>
      </Field>
      {fileName ? <p className="rounded-xl bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800"><FileText size={12} className="mr-1 inline" />Прикреплён файл: {fileName}</p> : null}
      <Field label="Комментарий: контекст и на что смотреть"><textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className={inputCls} placeholder="Что проверили сами, где сомневаетесь…" /></Field>
      <Btn variant="emerald" className="w-full" disabled={title.trim().length < 4 || (!link.trim() && !fileName.trim())} onClick={() => onDone({ title: title.trim(), type, link: link.trim() || "вложение", fileName: fileName || undefined, comment, authorName: currentUser.name, authorSpec: currentUser.spec, reviewerName, status: "todo", priority })}>
        <GitPullRequest size={16} /> Отправить на ревью
      </Btn>
    </div>
  );
}

/* ================= PROJECT EVENTS ================= */

function ProjectEvents({ projectId, events }: { projectId: string; events: { id: string; title: string; type: string; date: string; time: string; attendees: string[]; category: string }[] }) {
  const { state, addEvent, removeEvent, joinEvent, currentUser, can, pushToast } = useGuild();
  const [open, setOpen] = useState(false);
  const project = state.projects.find((p) => p.id === projectId);
  const canCreate = can("manage_projects") || can("curate_kb") || can("launch_projects");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-extrabold"><CalendarPlus size={18} className="text-violet-600" /> Мероприятия проекта</h2>
          <p className="mt-1 text-xs text-slate-500">Наставник и технаставник создают дейли, ретро, планирование и демо — вся команда приглашается автоматически.</p>
        </div>
        {canCreate ? <Btn variant="emerald" size="sm" onClick={() => setOpen(true)}><Plus size={15} /> Создать событие проекта</Btn> : null}
      </div>
      {events.length === 0 ? (
        <EmptyState title="Событий проекта ещё нет" text="Создайте дейли или ретро — команда получит приглашения со ссылкой на встречу." action={canCreate ? <Btn variant="emerald" size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Создать</Btn> : undefined} />
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {events.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={e.category === "edu" ? "violet" : "emerald"}>{e.category === "edu" ? "Обучающее" : "Проектное"}</Badge>
                <Badge tone="slate">{e.type}</Badge>
              </div>
              <p className="mt-2 text-sm font-extrabold">{e.title}</p>
              <p className="text-xs text-slate-500">{formatDateRU(e.date)} · {e.time} · {e.attendees.length} участников</p>
              <div className="mt-2 flex gap-2">
                {e.attendees.includes(currentUser.name) ? <Badge tone="emerald"><Check size={11} /> Вы записаны</Badge> : (
                  <Btn variant="secondary" size="sm" onClick={() => { joinEvent(e.id, currentUser.name); pushToast({ kind: "success", title: "Вы записаны!" }); }}>Участвовать</Btn>
                )}
                {canCreate ? <button onClick={() => { removeEvent(e.id); pushToast({ kind: "info", title: "Событие удалено" }); }} className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={14} /></button> : null}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} wide title="Событие проекта" subtitle={project?.name}>
        <ProjectEventForm
          projectId={projectId}
          teamNames={project?.team.map((t) => t.name) ?? []}
          onDone={(v) => {
            addEvent({ id: `e-${Date.now()}`, title: v.title, description: v.description, category: "work", type: v.type, date: v.date, time: v.time, duration: v.duration, location: v.location, link: "https://meet.tpu.ru/guild", projectId, projectName: project?.name, attendees: v.inviteTeam ? (project?.team.map((t) => t.name) ?? []) : [currentUser.name], speaker: currentUser.name });
            setOpen(false);
            pushToast({ kind: "success", title: "Событие создано!", text: v.inviteTeam ? "Приглашена вся команда проекта." : "Событие добавлено в календарь." });
          }}
        />
      </Modal>
    </div>
  );
}

function ProjectEventForm({ teamNames, onDone }: { projectId: string; teamNames: string[]; onDone: (v: { title: string; description: string; type: string; date: string; time: string; duration: string; location: string; inviteTeam: boolean }) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Дейли");
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("15 мин");
  const [location, setLocation] = useState("Онлайн");
  const [inviteTeam, setInviteTeam] = useState(true);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["Дейли", "Ретро", "Планирование", "Демо", "Технический синк"].map((t) => (
          <button key={t} onClick={() => { setType(t); setDuration(t === "Дейли" ? "15 мин" : "1 ч"); }} className={`rounded-full px-3 py-1.5 text-xs font-bold ${type === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>{t}</button>
        ))}
      </div>
      <Field label="Название"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Ретро спринта 12" /></Field>
      <Field label="Повестка"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} /></Field>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Дата"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
        <Field label="Время"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} /></Field>
        <Field label="Длительность"><input value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} /></Field>
        <Field label="Место"><input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} /></Field>
      </div>
      <label className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
        <input type="checkbox" checked={inviteTeam} onChange={(e) => setInviteTeam(e.target.checked)} className="accent-emerald-600" />
        Пригласить всю команду проекта ({teamNames.length}) и создать ссылку на встречу
      </label>
      <Btn variant="emerald" className="w-full" disabled={title.trim().length < 3} onClick={() => onDone({ title: title.trim(), description, type, date, time, duration, location, inviteTeam })}>
        <CalendarPlus size={16} /> Создать событие
      </Btn>
    </div>
  );
}

/* ================= TEAM & VACANCIES ================= */

function TeamVacancies({ projectId }: { projectId: string }) {
  const { state, removeMember, addMember, updateVacancy, pushToast, can } = useGuild();
  const project = state.projects.find((p) => p.id === projectId);
  const vacancies = state.vacancies.filter((v) => v.projectId === projectId);
  const [editVac, setEditVac] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const isAdmin = can("launch_projects");
  if (!project) return null;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-extrabold"><Users size={18} className="text-indigo-600" /> Состав команды</h2>
            <p className="mt-1 text-xs text-slate-500">Убирая участника, вы автоматически открываете вакансию — она сразу появляется в общем списке рекрутинга.</p>
          </div>
          <Btn variant="secondary" size="sm" onClick={() => setAddOpen(true)}><UserPlus size={15} /> Добавить участника</Btn>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {project.team.map((m, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
              <Avatar name={m.name} color="bg-slate-700" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">{m.name}</p>
                <p className="text-[11px] text-slate-500">{m.role} · {m.spec}</p>
              </div>
              <button
                onClick={() => {
                  removeMember(projectId, m.name);
                  pushToast({ kind: "warn", title: "Участник исключён из проекта", text: `Вакансия «${m.role} — ${m.spec}» автоматически открыта в рекрутинге.` });
                }}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
              >
                <UserMinus size={13} className="mr-1 inline" /> Убрать
              </button>
            </div>
          ))}
          {project.team.length === 0 ? <p className="text-xs text-slate-400">Команда пуста — все места открыты как вакансии.</p> : null}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 font-extrabold"><Briefcase size={18} className="text-emerald-600" /> Вакансии проекта ({vacancies.length})</h2>
        <p className="mt-1 text-xs text-slate-500">
          Редактируйте описание, требования и грейд. {isAdmin ? "Как администратор вы также открываете позиции наставника или технаставника — они попадают в раздел «Орг. отдел»." : "Открытие позиций наставника/технаставника — прерогатива администратора ЦЭУ."}
        </p>
        <div className="mt-3 space-y-2.5">
          {vacancies.map((v) => (
            <div key={v.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={v.kind === "org" ? "rose" : "emerald"}>{v.kind === "org" ? `Орг. отдел · ${v.dept ?? "ЦЭУ"}` : "Проектная роль"}</Badge>
                <Badge tone="sky">{v.spec}</Badge>
                <Badge tone="violet">{v.grade}</Badge>
                <Badge tone="slate">{v.openings} место(а)</Badge>
                {v.source === "freed" ? <Badge tone="amber">Освободилось: {v.freedFrom}</Badge> : null}
              </div>
              <p className="mt-2 text-sm font-extrabold">{v.title}</p>
              <p className="mt-1 text-xs text-slate-500">{v.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {v.hardSkills.map((s) => <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{s}</span>)}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Btn variant="secondary" size="sm" onClick={() => setEditVac(v.id)}>Редактировать вакансию</Btn>
                <Btn variant="ghost" size="sm" onClick={() => { updateVacancy(v.id, { openings: v.openings + 1 }); pushToast({ kind: "success", title: "Открыто ещё одно место", text: v.title }); }}>+ место</Btn>
                <Link href={`/vacancies/${v.id}`} className="ml-auto"><Btn variant="outline" size="sm">Карточка вакансии</Btn></Link>
              </div>
            </div>
          ))}
          {vacancies.length === 0 ? <EmptyState title="Вакансий проекта нет" text="Место откроется автоматически, если убрать участника из команды, или при создании нового проекта." /> : null}
        </div>
      </Card>

      <Modal open={!!editVac} onClose={() => setEditVac(null)} wide title="Редактирование вакансии" subtitle="Изменения сразу видны кандидатам">
        {editVac ? <EditVacancyForm id={editVac} onDone={() => { setEditVac(null); pushToast({ kind: "success", title: "Вакансия обновлена!" }); }} /> : null}
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Добавить участника в команду" subtitle={project.name}>
        <AddMemberForm onDone={(m) => { addMember(projectId, m); setAddOpen(false); pushToast({ kind: "success", title: "Участник добавлен!", text: `${m.name} · ${m.role}` }); }} />
      </Modal>
    </div>
  );
}

function EditVacancyForm({ id, onDone }: { id: string; onDone: () => void }) {
  const { state, updateVacancy } = useGuild();
  const v = state.vacancies.find((x) => x.id === id);
  const [title, setTitle] = useState(v?.title ?? "");
  const [desc, setDesc] = useState(v?.description ?? "");
  const [grade, setGrade] = useState(v?.grade ?? "Intern");
  const [workload, setWorkload] = useState(v?.workload ?? "4–6 ч/нед");
  const [hard, setHard] = useState(v?.hardSkills.join(", ") ?? "");
  const [openings, setOpenings] = useState(v?.openings ?? 1);
  if (!v) return null;
  return (
    <div className="space-y-4">
      <Field label="Название вакансии"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
      <Field label="Описание"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} className={inputCls} /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Грейд">
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls}>
            {["Intern", "Junior", "Middle", "Senior"].map((g) => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Загрузка"><input value={workload} onChange={(e) => setWorkload(e.target.value)} className={inputCls} /></Field>
        <Field label="Мест"><input type="number" min={1} max={5} value={openings} onChange={(e) => setOpenings(Number(e.target.value))} className={inputCls} /></Field>
      </div>
      <Field label="Hard Skills (через запятую)"><input value={hard} onChange={(e) => setHard(e.target.value)} className={inputCls} /></Field>
      <Btn variant="emerald" className="w-full" onClick={() => { updateVacancy(id, { title, description: desc, grade, workload, hardSkills: hard.split(",").map((s) => s.trim()).filter(Boolean), openings }); onDone(); }}>
        <Check size={16} /> Сохранить вакансию
      </Btn>
    </div>
  );
}

function AddMemberForm({ onDone }: { onDone: (m: { userId: string; name: string; role: string; spec: string }) => void }) {
  const { state } = useGuild();
  const pool = state.users.filter((u) => !["admin"].includes(u.role));
  const [name, setName] = useState(pool[0]?.name ?? "");
  const [role, setRole] = useState("Студент");
  const [spec, setSpec] = useState("Frontend");
  return (
    <div className="space-y-4">
      <Field label="Участник">
        <select value={name} onChange={(e) => setName(e.target.value)} className={inputCls}>
          {pool.map((u) => <option key={u.id}>{u.name}</option>)}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Роль в проекте">
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
            {["Студент", "Гильдиец", "Наставник", "Технаставник", "Аналитик"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Направление">
          <select value={spec} onChange={(e) => setSpec(e.target.value)} className={inputCls}>
            {["Backend", "Frontend", "Аналитика", "Тестирование", "UI/UX", "PM"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Btn variant="emerald" className="w-full" onClick={() => onDone({ userId: "u-x", name, role, spec })}>
        <UserPlus size={16} /> Добавить в команду
      </Btn>
    </div>
  );
}

/* ================= PROJECT SETTINGS ================= */

function ProjectSettings({ project }: { project: Project }) {
  const { updateProject, pushToast } = useGuild();
  const [form, setForm] = useState({
    name: project.name,
    short: project.short,
    description: project.description,
    status: project.status,
    typeLabel: project.typeLabel,
    commercial: project.commercial,
    progress: project.progress,
    deadline: project.deadline,
    github: project.links.github,
    tracker: project.links.tracker,
    figma: project.links.figma,
    goals: project.goals.join("\n"),
    cover: project.cover,
  });
  const covers = ["from-emerald-500 to-teal-600", "from-indigo-500 to-violet-600", "from-amber-500 to-orange-600", "from-sky-500 to-cyan-600", "from-rose-500 to-pink-600"];
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-extrabold"><Settings2 size={18} className="text-slate-700" /> Настройки проекта</h2>
      <p className="mt-1 text-xs text-slate-500">Доступно наставнику и орг. отделу. Изменения применяются к карточке, витрине и воркспейсу.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Field label="Название"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
        <Field label="Краткое описание (для витрины)"><input value={form.short} onChange={(e) => setForm({ ...form, short: e.target.value })} className={inputCls} /></Field>
        <div className="lg:col-span-2"><Field label="Полное описание"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={inputCls} /></Field></div>
        <Field label="Статус">
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Project["status"] })} className={inputCls}>
            {["Инициация", "В разработке", "Тестирование", "MVP Готов", "В релизе", "Пилот", "Масштабирование", "Остановка"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Тип">
          <select value={form.typeLabel} onChange={(e) => setForm({ ...form, typeLabel: e.target.value, commercial: e.target.value === "Коммерческий" })} className={inputCls}>
            {["Коммерческий", "Внутренний ЦЭУ"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label={`Прогресс: ${form.progress}%`}>
          <input type="range" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} className="w-full accent-emerald-600" />
        </Field>
        <Field label="Дедлайн"><input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={inputCls} /></Field>
        <Field label="GitHub"><input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className={inputCls} /></Field>
        <Field label="TaskTracker"><input value={form.tracker} onChange={(e) => setForm({ ...form, tracker: e.target.value })} className={inputCls} /></Field>
        <Field label="Figma"><input value={form.figma} onChange={(e) => setForm({ ...form, figma: e.target.value })} className={inputCls} /></Field>
        <div className="lg:col-span-2">
          <Field label="Цели спринта (по одной в строке)"><textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} rows={3} className={inputCls} /></Field>
        </div>
        <div className="lg:col-span-2">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Обложка карточки</p>
          <div className="flex flex-wrap gap-2">
            {covers.map((c) => (
              <button key={c} onClick={() => setForm({ ...form, cover: c })} className={`h-10 w-20 rounded-xl bg-gradient-to-r ${c} ring-2 ${form.cover === c ? "ring-slate-900" : "ring-transparent"}`} />
            ))}
          </div>
        </div>
      </div>
      <Btn variant="emerald" className="mt-4" onClick={() => {
        updateProject(project.id, {
          name: form.name, short: form.short, description: form.description, status: form.status as Project["status"], typeLabel: form.typeLabel, commercial: form.commercial, progress: form.progress, deadline: form.deadline, cover: form.cover,
          links: { github: form.github, tracker: form.tracker, figma: form.figma },
          goals: form.goals.split("\n").map((g) => g.trim()).filter(Boolean),
        });
        pushToast({ kind: "success", title: "Настройки проекта сохранены!", text: "Карточка и воркспейс обновлены." });
      }}>
        <Check size={16} /> Сохранить настройки
      </Btn>
    </Card>
  );
}

/* ================= ESCALATION FORM ================= */

function EscForm({ onDone }: { onDone: (v: { type: "tech" | "org" | "hr"; title: string; description: string; steps: string; links: string }) => void }) {
  const [type, setType] = useState<"tech" | "org" | "hr">("tech");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [links, setLinks] = useState("");
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { id: "tech", l: "Техническая", d: "→ Технаставник" },
          { id: "org", l: "Организационная", d: "→ Наставник → СГ" },
          { id: "hr", l: "HR / Конфликт", d: "→ Орг. отдел" },
        ].map((t) => (
          <button key={t.id} onClick={() => setType(t.id as "tech" | "org" | "hr")} className={`rounded-xl border p-3 text-left ${type === t.id ? "border-rose-400 bg-rose-50" : "border-slate-200"}`}>
            <span className="block text-sm font-extrabold">{t.l}</span>
            <span className="text-[11px] text-slate-500">{t.d}</span>
          </button>
        ))}
      </div>
      <Field label="Заголовок"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
      <Field label="Описание проблемы"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} /></Field>
      <Field label="Шаги воспроизведения / гипотезы"><textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={2} className={inputCls} /></Field>
      <Field label="Логи / ссылки"><input value={links} onChange={(e) => setLinks(e.target.value)} className={inputCls} /></Field>
      <Btn variant="danger" className="w-full" disabled={title.trim().length < 5 || description.trim().length < 10} onClick={() => onDone({ type, title: title.trim(), description, steps, links })}>
        Отправить эскалацию
      </Btn>
    </div>
  );
}
