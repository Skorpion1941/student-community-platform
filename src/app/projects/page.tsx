"use client";

import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { useGuild } from "@/lib/store";
import { Avatar, Badge, Btn, Card, Progress } from "@/components/ui";
import { addDays, sprintStatusByDate, todayISO } from "@/lib/scoring";

export default function ProjectsPage() {
  const { state, role, can, pushToast, addProject, addVacancy } = useGuild();

  if (role === "guest" || role === "candidate") {
    return (
      <div className="space-y-4">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold"><FolderKanban className="text-emerald-600" /> Проекты</h1>
        <Card className="p-8 text-center">
          <p className="text-lg font-extrabold">Воркспейсы доступны участникам проектов</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Вы сейчас: {role === "guest" ? "Гость" : "Кандидат"}. Выберите роль «Студент» и выше в выплывающем списке входа в шапке, чтобы увидеть канбан, команду и дейлики. Публичная витрина — на главной.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/"><Btn variant="secondary">К витрине проектов</Btn></Link>
            <Link href="/vacancies"><Btn variant="emerald">Выбрать вакансию</Btn></Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><FolderKanban className="text-emerald-600" /> Проекты Гильдии</h1>
          <p className="mt-1 text-sm text-slate-500">Дорожная карта, ревью, дейли и эскалации · {state.projects.length} проекта</p>
        </div>
        {can("launch_projects") ? (
          <Btn
            variant="emerald"
            size="sm"
            onClick={() => {
              const pid = `p-${Date.now()}`;
              addProject({
                id: pid,
                name: "Новый проект Гильдии",
                short: "Черновик инициативы — заполните описание",
                description: "Новая инициатива ЦЭУ. Наставник дополнит цели, состав команды и дедлайны.",
                status: "Инициация",
                typeLabel: "Внутренний ЦЭУ",
                commercial: false,
                isNew: true,
                stack: ["React", "Spring Boot"],
                links: { github: "", tracker: "", figma: "" },
                team: [],
                progress: 5,
                deadline: "Уточняется",
                color: "bg-slate-500",
                cover: "from-slate-500 to-slate-700",
                goals: ["Сформировать команду", "Пройти инициацию"],
              });
              pushToast({ kind: "success", title: "Проект создан!", text: "Статус: Инициация. Вакансии команды открыты автоматически." });
              addVacancy({
                id: `v-new-${pid}-pm`, title: "Менеджер проекта (PM) — новый проект", spec: "PM", projectId: pid, projectName: "Новый проект Гильдии",
                projectType: "new", commercial: false, grade: "Junior / Middle", kind: "project", openings: 1, source: "new",
                workload: "6–8 ч/нед", format: "Гибрид · Томск",
                description: "Проект только что инициирован. Нужен PM, который соберёт команду, разложит бэклог и запустит первый спринт.",
                responsibilities: ["Собрать команду", "Запустить спринт 1", "Отчитываться перед орг. отделом"],
                hardSkills: ["Scrum", "Декомпозиция", "Notion"], softSkills: ["Лидерство"], tools: ["Jira/Tracker", "Miro"], niceToHave: [],
                team: "Команда формируется", mentor: "Орг. отдел ЦЭУ", postedAt: "только что", responses: 0,
              });
              addVacancy({
                id: `v-new-${pid}-dev`, title: "Разработчик (Fullstack) — новый проект", spec: "Backend", projectId: pid, projectName: "Новый проект Гильдии",
                projectType: "new", commercial: false, grade: "Intern / Junior", kind: "project", openings: 2, source: "new",
                workload: "4–6 ч/нед", format: "Гибрид · Томск",
                description: "Первые инженерные роли в новом проекте: скелет сервиса, контракт API, базовая вёрстка. Рядом технаставник.",
                responsibilities: ["Поднять скелет сервиса", "Реализовать первые эндпоинты", "Вести дейли-отчёты"],
                hardSkills: ["React", "Spring Boot", "Git"], softSkills: ["Ответственность"], tools: ["Postman", "Figma"], niceToHave: ["Docker"],
                team: "Команда формируется", mentor: "Орг. отдел ЦЭУ", postedAt: "только что", responses: 0,
              });
            }}
          >
            <Plus size={15} /> Новый проект
          </Btn>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {state.projects.map((p) => {
          const tasks = state.tasks.filter((t) => t.projectId === p.id);
          const done = tasks.filter((t) => t.status === "done").length;
          const blockers = state.dailies.filter((d) => d.projectId === p.id && d.date >= addDays(todayISO(), -3) && d.blockers && !d.blockers.toLowerCase().includes("нет")).length;
          const sp = state.sprints.find((x) => x.projectId === p.id && sprintStatusByDate(x) === "active");
          return (
            <Card key={p.id} className="overflow-hidden">
              <div className={`bg-gradient-to-r p-4 text-white ${p.cover}`}>
                <div className="flex items-center justify-between">
                  <Badge tone="slate">{p.status}</Badge>
                  <span className="text-[11px] font-bold uppercase tracking-wide opacity-80">{p.typeLabel}</span>
                </div>
                <h3 className="mt-2 text-lg font-extrabold">{p.name}</h3>
                <p className="text-xs opacity-90">{p.short}</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {p.team.slice(0, 5).map((m, i) => <Avatar key={i} name={m.name} color="bg-slate-700" size="sm" />)}
                    {p.team.length === 0 ? <span className="text-xs text-slate-400">Команда формируется</span> : null}
                  </div>
                  <p className="ml-auto text-xs text-slate-500">Задач: {done}/{tasks.length} · Блокеры: {blockers}</p>
                </div>
                <div className="mt-2"><Progress value={p.progress} /></div>
                {sp ? (
                  <p className="mt-2 rounded-xl bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-800">
                    {sp.title}: {sp.week1Stage === sp.week2Stage ? sp.week1Stage : `${sp.week1Stage} → ${sp.week2Stage}`}
                  </p>
                ) : <p className="mt-2 rounded-xl bg-slate-50 px-3 py-1.5 text-[11px] text-slate-400">Активного спринта нет</p>}
                <Link href={`/projects/${p.id}`}>
                  <Btn variant="secondary" size="sm" className="mt-3 w-full">Открыть воркспейс</Btn>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
