"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, CalendarCheck, Check, Clock, Crown, MapPin, Sparkles, Users } from "lucide-react";
import { useGuild } from "@/lib/store";
import { calcMatch } from "@/lib/seed";
import { ApplyModal } from "@/components/apply-modal";
import { Avatar, Badge, Btn, Card, EmptyState, MatchRing, Progress } from "@/components/ui";

export default function VacancyPage() {
  const params = useParams<{ id: string }>();
  const { state, currentUser, role } = useGuild();
  const [applyOpen, setApplyOpen] = useState(false);
  const vacancy = state.vacancies.find((v) => v.id === params.id);

  if (!vacancy) {
    return <EmptyState title="Вакансия не найдена" text="Возможно, место уже закрыто." action={<Link href="/vacancies"><Btn variant="secondary" size="sm">К списку вакансий</Btn></Link>} />;
  }

  const match = calcMatch(currentUser.skills, vacancy);
  const project = state.projects.find((p) => p.id === vacancy.projectId);
  const sameSpec = state.vacancies.filter((v) => v.id !== vacancy.id && v.spec === vacancy.spec).slice(0, 3);
  const low = currentUser.skills.map((s) => s.toLowerCase());
  const missing = [...vacancy.hardSkills, ...vacancy.tools].filter((s) => !low.some((h) => h.includes(s.toLowerCase()) || s.toLowerCase().includes(h)));

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link href="/vacancies" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Все вакансии
      </Link>

      <div className={`overflow-hidden rounded-3xl p-6 text-white sm:p-8 ${vacancy.kind === "org" ? "bg-gradient-to-r from-rose-600 to-orange-600" : vacancy.commercial ? "bg-gradient-to-r from-amber-500 to-orange-600" : "bg-gradient-to-r from-emerald-600 to-teal-700"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="slate">{vacancy.kind === "org" ? `Орг. отдел · ${vacancy.dept}` : vacancy.commercial ? "Коммерческий проект" : "Внутренний ЦЭУ"}</Badge>
          <Badge tone="slate">{vacancy.projectType === "new" ? "Новый проект" : "Действующий проект"}</Badge>
          <Badge tone="slate">{vacancy.spec}</Badge>
          <span className="ml-auto rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold">{vacancy.openings} место(а) · {vacancy.grade}</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{vacancy.title}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-90">
          <span className="flex items-center gap-1"><Building2 size={14} /> {vacancy.projectName}</span>
          <span className="flex items-center gap-1"><MapPin size={14} /> {vacancy.format}</span>
          <span className="flex items-center gap-1"><Clock size={14} /> {vacancy.workload}</span>
          <span className="flex items-center gap-1"><Users size={14} /> {vacancy.responses} откликов</span>
        </p>
        {vacancy.source === "freed" ? (
          <p className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold">Место освободилось после смены состава ({vacancy.freedFrom}) — приоритетный отбор.</p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-extrabold"><Briefcase size={17} className="text-emerald-600" /> О роли</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{vacancy.description}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Обязанности</p>
                <ul className="mt-2 space-y-1.5">
                  {vacancy.responsibilities.map((r) => <li key={r} className="flex items-start gap-2 text-[13px] text-slate-700"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600" /> {r}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{vacancy.kind === "org" ? "Куратор" : "Команда и наставник"}</p>
                <p className="mt-2 text-[13px] text-slate-700">{vacancy.team}</p>
                <p className="mt-2 flex items-center gap-2 text-[13px] font-bold"><Avatar name={vacancy.mentor} color="bg-violet-500" size="sm" /> {vacancy.mentor}</p>
                <p className="mt-2 text-[11px] text-slate-500">Опубликовано: {vacancy.postedAt}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-extrabold">Требования</h2>
            <div className="mt-3 space-y-3">
              <Skills label="Необходимые Hard Skills" skills={vacancy.hardSkills} mine={currentUser.skills} tone="emerald" />
              <Skills label="Инструменты и аналитика" skills={vacancy.tools} mine={currentUser.skills} tone="sky" />
              <Skills label="Soft Skills" skills={vacancy.softSkills} mine={currentUser.skills} tone="violet" />
              {vacancy.niceToHave.length ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Будет плюсом</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {vacancy.niceToHave.map((s) => <span key={s} className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-500">{s}</span>)}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          {project ? (
            <Card className="p-5">
              <h2 className="font-extrabold">О проекте</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="slate">{project.status}</Badge>
                <Badge tone="slate">{project.typeLabel}</Badge>
                <span className="text-xs text-slate-500">Дедлайн: {project.deadline} · {project.team.length} участников</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{project.description}</p>
              <div className="mt-2"><Progress value={project.progress} /></div>
              <div className="mt-3 flex -space-x-2">
                {project.team.slice(0, 6).map((m, i) => <Avatar key={i} name={m.name} color="bg-slate-700" size="sm" />)}
              </div>
              <Link href={`/projects/${project.id}`} className="mt-3 inline-block"><Btn variant="secondary" size="sm">Открыть воркспейс проекта</Btn></Link>
            </Card>
          ) : null}
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Совпадение с вашим профилем</p>
            <div className="mt-2 flex items-center justify-between">
              <MatchRing value={match} />
              <span className="text-[11px] text-slate-500">{currentUser.skills.length} навыков в профиле</span>
            </div>
            <div className="mt-2"><Progress value={match} color={match >= 75 ? "bg-emerald-500" : match >= 50 ? "bg-amber-500" : "bg-slate-400"} /></div>
            {missing.length ? (
              <div className="mt-3 rounded-xl bg-amber-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Стоит подтянуть</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {missing.slice(0, 6).map((s) => <span key={s} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">{s}</span>)}
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">Все ключевые требования покрыты вашим профилем 🎉</p>
            )}
            <div className="mt-4">
              {role === "guest" ? (
                <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">Выберите роль «Кандидат» в списке входа в шапке, чтобы откликнуться.</p>
              ) : (
                <Btn variant="emerald" size="lg" className="w-full" onClick={() => setApplyOpen(true)}>
                  <CalendarCheck size={18} /> Откликнуться и выбрать слот
                </Btn>
              )}
            </div>
          </Card>

          {vacancy.kind === "org" ? (
            <Card className="border-rose-200 bg-rose-50/50 p-5">
              <p className="flex items-center gap-2 text-sm font-extrabold text-rose-800"><Crown size={16} /> Оплачиваемая позиция</p>
              <p className="mt-1 text-xs text-rose-700">Утверждается орг. отделом ЦЭУ. Нужна рекомендация наставника и опыт менторства.</p>
            </Card>
          ) : null}

          {sameSpec.length ? (
            <Card className="p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><Sparkles size={13} /> Похожие роли</p>
              <div className="mt-2 space-y-2">
                {sameSpec.map((v) => (
                  <Link key={v.id} href={`/vacancies/${v.id}`} className="block rounded-xl border border-slate-100 p-3 hover:border-emerald-200">
                    <p className="truncate text-[13px] font-bold">{v.title}</p>
                    <p className="truncate text-[11px] text-slate-500">{v.projectName} · {v.grade}</p>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <ApplyModal vacancy={vacancy} open={applyOpen} onClose={() => setApplyOpen(false)} />
    </div>
  );
}

function Skills({ label, skills, mine, tone }: { label: string; skills: string[]; mine: string[]; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-300",
    sky: "bg-sky-100 text-sky-800 border-sky-300",
    violet: "bg-violet-100 text-violet-800 border-violet-300",
  };
  const low = mine.map((s) => s.toLowerCase());
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {skills.map((s) => {
          const has = low.includes(s.toLowerCase());
          return <span key={s} className={`rounded-full border px-2.5 py-1 text-xs font-bold ${has ? tones[tone] : "bg-slate-100 text-slate-600 border-slate-200"}`}>{has ? "✓ " : ""}{s}</span>;
        })}
      </div>
    </div>
  );
}
