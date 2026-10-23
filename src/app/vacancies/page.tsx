"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CalendarCheck,
  Check,
  Clock,
  Crown,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useGuild, formatDateRU } from "@/lib/store";
import { calcMatch } from "@/lib/seed";
import type { Vacancy } from "@/lib/types";
import { ApplyModal } from "@/components/apply-modal";
import { Badge, Btn, Card, EmptyState, Field, MatchRing, Modal, inputCls } from "@/components/ui";

const SPECS = ["Все", "Backend", "Frontend", "Аналитика", "Тестирование", "UI/UX", "PM"];

type Filters = {
  spec: string;
  kind: string;
  source: string;
  ptype: string;
  model: string;
  grade: string;
  sort: string;
  favOnly: boolean;
};

const STEPS = [
  { t: "Профиль и навыки", d: "Отметьте навыки в кабинете — вакансии отсортируются по % совпадения", icon: UserCheck },
  { t: "Отклик", d: "Telegram, желаемая роль и мотивационное письмо", icon: Briefcase },
  { t: "Слот собеседования", d: "Выбор свободного времени в календаре технаставника — слот блокируется мгновенно", icon: CalendarCheck },
  { t: "Вердикт", d: "Технаставник принимает решение, статус виден в кабинете", icon: ShieldCheck },
];

export default function VacanciesPage() {
  const { state, currentUser, role, can, setPresetSpec, toggleFavorite, addVacancy, pushToast } = useGuild();
  const [f, setF] = useState<Filters>({ spec: state.presetSpec || "Все", kind: "Все", source: "Все", ptype: "Все", model: "Все", grade: "Все", sort: "match", favOnly: false });
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(6);
  const [applyFor, setApplyFor] = useState<Vacancy | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setLimit(6);
  };

  const filtered = useMemo(() => {
    let list = state.vacancies.map((v, idx) => ({ v, m: calcMatch(currentUser.skills, v), idx }));
    if (f.spec !== "Все") list = list.filter(({ v }) => v.spec === f.spec);
    if (f.kind === "Проектные") list = list.filter(({ v }) => v.kind === "project");
    if (f.kind === "Орг. отдел") list = list.filter(({ v }) => v.kind === "org");
    if (f.source === "Освободилось место") list = list.filter(({ v }) => v.source === "freed");
    if (f.source === "Новый проект") list = list.filter(({ v }) => v.source === "new");
    if (f.source === "Открыто вручную") list = list.filter(({ v }) => v.source === "manual");
    if (f.ptype !== "Все") list = list.filter(({ v }) => (f.ptype === "Новый проект" ? v.projectType === "new" : v.projectType === "existing"));
    if (f.model !== "Все") list = list.filter(({ v }) => (f.model === "Коммерческий" ? v.commercial : !v.commercial));
    if (f.grade !== "Все") list = list.filter(({ v }) => v.grade.includes(f.grade));
    if (f.favOnly) list = list.filter(({ v }) => state.favorites.includes(v.id));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(({ v }) => (v.title + v.projectName + v.description + v.hardSkills.join(" ")).toLowerCase().includes(q));
    }
    if (f.sort === "match") list.sort((a, b) => b.m - a.m);
    if (f.sort === "responses") list.sort((a, b) => b.v.responses - a.v.responses);
    if (f.sort === "title") list.sort((a, b) => a.v.title.localeCompare(b.v.title));
    return list;
  }, [state.vacancies, state.favorites, currentUser.skills, f, query]);

  const freedCount = state.vacancies.filter((v) => v.source === "freed").length;
  const orgCount = state.vacancies.filter((v) => v.kind === "org").length;
  const freeSlots = state.slots.filter((s) => s.status === "free").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const myApps = state.applications.filter((a) => a.userId === currentUser.id && a.status !== "cancelled");
  const nextInterview = myApps
    .filter((a) => a.slotId && (a.status === "booked" || a.status === "pending"))
    .map((a) => ({ a, slot: state.slots.find((s) => s.id === a.slotId) }))
    .filter((x) => x.slot)
    .sort((x, y) => ((x.slot?.date ?? "") + (x.slot?.time ?? "")).localeCompare((y.slot?.date ?? "") + (y.slot?.time ?? "")))[0];

  const activeChips: { label: string; clear: () => void }[] = [];
  if (f.spec !== "Все") activeChips.push({ label: f.spec, clear: () => { set("spec", "Все"); setPresetSpec("Все"); } });
  if (f.kind !== "Все") activeChips.push({ label: f.kind, clear: () => set("kind", "Все") });
  if (f.source !== "Все") activeChips.push({ label: f.source, clear: () => set("source", "Все") });
  if (f.ptype !== "Все") activeChips.push({ label: f.ptype, clear: () => set("ptype", "Все") });
  if (f.model !== "Все") activeChips.push({ label: f.model, clear: () => set("model", "Все") });
  if (f.grade !== "Все") activeChips.push({ label: `Грейд: ${f.grade}`, clear: () => set("grade", "Все") });
  if (f.favOnly) activeChips.push({ label: "Избранное", clear: () => set("favOnly", false) });
  if (query.trim()) activeChips.push({ label: `«${query}»`, clear: () => setQuery("") });

  function resetAll() {
    setF({ spec: "Все", kind: "Все", source: "Все", ptype: "Все", model: "Все", grade: "Все", sort: "match", favOnly: false });
    setQuery("");
    setPresetSpec("Все");
    setLimit(6);
  }

  const tiles = [
    { l: "Открытых вакансий", v: state.vacancies.length, icon: Briefcase, c: "text-emerald-600", on: () => resetAll() },
    { l: "Освободилось место", v: freedCount, icon: Zap, c: "text-amber-600", on: () => set("source", "Освободилось место") },
    { l: "Позиций орг. отдела", v: orgCount, icon: Crown, c: "text-rose-600", on: () => set("kind", "Орг. отдел") },
    { l: "Свободных слотов", v: freeSlots.length, icon: CalendarCheck, c: "text-sky-600", on: undefined },
    { l: "Избранное", v: state.favorites.length, icon: BookmarkCheck, c: "text-indigo-600", on: () => set("favOnly", true) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><Briefcase className="text-emerald-600" /> Вакансии и умный рекрутинг</h1>
          <p className="mt-1 text-sm text-slate-500">Роли в проектах Гильдии и позиции орг. отдела ЦЭУ · сортировка по совпадению ваших навыков</p>
        </div>
        {can("launch_projects") ? (
          <Btn variant="emerald" size="sm" onClick={() => setCreateOpen(true)}><Plus size={15} /> Открыть вакансию</Btn>
        ) : (
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">Позиции наставника и орг. отдела открывает администратор ЦЭУ</span>
        )}
      </div>

      {/* How it works + important info */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wide opacity-80">Как работает рекрутинг</p>
            <p className="mt-1 text-lg font-extrabold">От отклика до команды — за один спринт</p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.t} className="relative rounded-2xl bg-slate-50 p-3.5">
                <span className="absolute right-3 top-3 text-[11px] font-extrabold text-slate-300">{i + 1}</span>
                <s.icon size={18} className="text-emerald-600" />
                <p className="mt-2 text-[13px] font-extrabold">{s.t}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{s.d}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Важно знать</p>
          <ul className="mt-2 space-y-2 text-[12px] text-slate-600">
            {[
              "Отмена и перенос собеседования — не позднее чем за 24 часа",
              "Слот блокируется сразу после подтверждения брони",
              "Нагрузка: Intern 4–6 ч/нед, Junior 6–8 ч/нед",
              "Дейли — только по будням: вовремя 1 балл, «ничего не делал» 0,5",
              "Освободившиеся места открываются автоматически; позиции орг. отдела — только админом",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600" /> {t}</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Stat tiles — click to filter */}
      <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <button key={t.l} onClick={t.on} disabled={!t.on} className={`rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition ${t.on ? "hover:border-emerald-300 hover:shadow-md" : "cursor-default"}`}>
            <div className="flex items-center justify-between"><p className="text-2xl font-extrabold">{t.v}</p><t.icon size={18} className={t.c} /></div>
            <p className="text-[11px] font-semibold text-slate-500">{t.l}</p>
            {t.on ? <p className="text-[10px] text-slate-400">нажмите, чтобы отфильтровать</p> : freeSlots[0] ? <p className="text-[10px] text-slate-400">ближайший: {formatDateRU(freeSlots[0].date)}, {freeSlots[0].time}</p> : null}
          </button>
        ))}
      </div>

      {nextInterview?.slot ? (
        <Card className="flex flex-wrap items-center gap-3 border-sky-200 bg-sky-50/60 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-sky-500 text-white"><CalendarCheck size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">Ваше ближайшее собеседование: {formatDateRU(nextInterview.slot.date)} в {nextInterview.slot.time}</p>
            <p className="text-xs text-slate-600">{nextInterview.a.vacancyTitle} · {nextInterview.slot.mentorName}</p>
          </div>
          <Link href="/cabinet"><Btn variant="secondary" size="sm">Управлять записью</Btn></Link>
        </Card>
      ) : null}

      {/* Filters: dropdowns */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(6); }} placeholder="Поиск: название, проект, навык…" className={`${inputCls} !py-2 !pl-9`} />
          </div>
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
            <Sparkles size={14} className="text-emerald-600" />
            <select value={f.sort} onChange={(e) => set("sort", e.target.value)} className={`${inputCls} !w-auto !py-2 !text-xs`}>
              <option value="match">Сначала подходящие мне</option>
              <option value="responses">По числу откликов</option>
              <option value="new">Как опубликованы</option>
              <option value="title">По названию</option>
            </select>
          </label>
          <Btn variant="ghost" size="sm" onClick={resetAll}><RotateCcw size={14} /> Сбросить</Btn>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <Sel label="Специализация" value={f.spec} options={SPECS} onChange={(v) => { set("spec", v); setPresetSpec(v); }} />
          <Sel label="Тип вакансии" value={f.kind} options={["Все", "Проектные", "Орг. отдел"]} onChange={(v) => set("kind", v)} />
          <Sel label="Источник" value={f.source} options={["Все", "Освободилось место", "Новый проект", "Открыто вручную"]} onChange={(v) => set("source", v)} />
          <Sel label="Проект" value={f.ptype} options={["Все", "Новый проект", "Действующий проект"]} onChange={(v) => set("ptype", v)} />
          <Sel label="Модель" value={f.model} options={["Все", "Коммерческий", "Внутренний"]} onChange={(v) => set("model", v)} />
          <Sel label="Грейд" value={f.grade} options={["Все", "Intern", "Junior", "Middle", "Senior"]} onChange={(v) => set("grade", v)} />
        </div>
        {activeChips.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400">Активные фильтры:</span>
            {activeChips.map((c) => (
              <button key={c.label} onClick={c.clear} className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100">{c.label} <X size={11} /></button>
            ))}
          </div>
        ) : null}
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-600">Найдено: {filtered.length}</p>
        <p className="text-[11px] text-slate-400">Нажмите на карточку, чтобы открыть страницу вакансии</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Ничего не найдено" text="Смягчите фильтры или сбросьте поиск — вакансии открываются при освобождении мест и запуске новых проектов." action={<Btn variant="secondary" size="sm" onClick={resetAll}><RotateCcw size={14} /> Сбросить фильтры</Btn>} />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.slice(0, limit).map(({ v, m }) => {
              const fav = state.favorites.includes(v.id);
              const mine = currentUser.skills.map((s) => s.toLowerCase());
              const applied = myApps.some((a) => a.vacancyId === v.id);
              return (
                <Card key={v.id} className="flex flex-col p-4 transition hover:border-emerald-300 hover:shadow-md">
                  <div className="flex items-start gap-2">
                    <Link href={`/vacancies/${v.id}`} className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold leading-snug hover:text-emerald-700">{v.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">{v.projectName}</p>
                    </Link>
                    <MatchRing value={m} />
                    <button onClick={() => { toggleFavorite(v.id); pushToast({ kind: "info", title: fav ? "Убрано из избранного" : "Добавлено в избранное", text: v.title }); }} className={`rounded-lg p-1.5 ${fav ? "text-indigo-600" : "text-slate-300 hover:text-slate-500"}`} aria-label="Избранное">
                      {fav ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge tone={v.kind === "org" ? "rose" : v.commercial ? "amber" : "emerald"}>{v.kind === "org" ? "Орг. отдел" : v.commercial ? "Коммерческий" : "Внутренний"}</Badge>
                    <Badge tone="sky">{v.spec}</Badge>
                    <Badge tone="violet">{v.grade}</Badge>
                    {v.source === "freed" ? <Badge tone="amber"><Zap size={10} /> Освободилось место</Badge> : null}
                    {v.source === "new" ? <Badge tone="indigo">Новый проект</Badge> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {[...v.hardSkills, ...v.tools].slice(0, 5).map((s) => {
                      const has = mine.some((h) => h.includes(s.toLowerCase()) || s.toLowerCase().includes(h));
                      return <span key={s} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${has ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{has ? "✓ " : ""}{s}</span>;
                    })}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-slate-500">{v.description}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock size={11} /> {v.workload}</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400"><Users size={11} /> {v.responses} · мест: {v.openings}</span>
                    <div className="ml-auto flex gap-2">
                      <Link href={`/vacancies/${v.id}`}><Btn variant="secondary" size="sm">Подробнее <ArrowRight size={13} /></Btn></Link>
                      {role !== "guest" ? (
                        applied ? <Badge tone="emerald"><Check size={11} /> Отклик отправлен</Badge> : <Btn variant="emerald" size="sm" onClick={() => setApplyFor(v)}>Откликнуться</Btn>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          {filtered.length > limit ? (
            <div className="flex justify-center"><Btn variant="outline" onClick={() => setLimit((l) => l + 6)}>Показать ещё ({filtered.length - limit})</Btn></div>
          ) : null}
        </>
      )}

      {applyFor ? <ApplyModal vacancy={applyFor} open onClose={() => setApplyFor(null)} /> : null}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} wide title="Открыть вакансию" subtitle="Только администратор / орг. отдел ЦЭУ">
        <CreateVacancyForm
          onDone={(v) => {
            addVacancy(v);
            setCreateOpen(false);
            pushToast({ kind: "success", title: "Вакансия открыта!", text: `${v.title} · ${v.kind === "org" ? "позиция орг. отдела" : v.projectName}` });
          }}
        />
      </Modal>
    </div>
  );
}

function Sel({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} !py-2 !text-xs ${value !== "Все" ? "!border-emerald-400 !bg-emerald-50/50 font-bold" : ""}`}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function CreateVacancyForm({ onDone }: { onDone: (v: Vacancy) => void }) {
  const { state } = useGuild();
  const [kind, setKind] = useState<"project" | "org">("org");
  const [title, setTitle] = useState("");
  const [spec, setSpec] = useState<Vacancy["spec"]>("PM");
  const [grade, setGrade] = useState("Middle");
  const [dept, setDept] = useState("Орг. отдел · Онбординг (Семен Олегович)");
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? "");
  const [workload, setWorkload] = useState("10–12 ч/нед");
  const [paid, setPaid] = useState(true);
  const [desc, setDesc] = useState("");
  const [hard, setHard] = useState("Scrum, Декомпозиция, Notion");
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <button onClick={() => { setKind("org"); setSpec("PM"); }} className={`rounded-xl border p-3 text-left ${kind === "org" ? "border-rose-400 bg-rose-50" : "border-slate-200"}`}>
          <span className="block text-sm font-extrabold">Должность орг. отдела</span>
          <span className="text-[11px] text-slate-500">Наставник, технаставник, методист, аналитик ЦЭУ</span>
        </button>
        <button onClick={() => { setKind("project"); setSpec("Backend"); }} className={`rounded-xl border p-3 text-left ${kind === "project" ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}>
          <span className="block text-sm font-extrabold">Роль в проекте</span>
          <span className="text-[11px] text-slate-500">Открывается вручную или автоматически при освобождении места</span>
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Название должности"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Наставник проекта (PM, Middle)" /></Field>
        <Field label="Направление">
          <select value={spec} onChange={(e) => setSpec(e.target.value as Vacancy["spec"])} className={inputCls}>
            {["Backend", "Frontend", "Аналитика", "Тестирование", "UI/UX", "PM"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Грейд">
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls}>
            {["Intern", "Junior", "Middle", "Senior"].map((g) => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Загрузка"><input value={workload} onChange={(e) => setWorkload(e.target.value)} className={inputCls} /></Field>
        {kind === "org" ? (
          <div className="sm:col-span-2">
            <Field label="Куратор в орг. отделе">
              <select value={dept} onChange={(e) => setDept(e.target.value)} className={inputCls}>
                <option>Орг. отдел · Онбординг (Семен Олегович)</option>
                <option>Коммерческие проекты · Сергей Георгиевич</option>
                <option>База знаний и грейды · Владимир Игоревич</option>
                <option>Архитектура · Ковынев Алексей Николаевич</option>
              </select>
            </Field>
          </div>
        ) : (
          <div className="sm:col-span-2">
            <Field label="Проект">
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
                {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>
        )}
      </div>
      <Field label="Описание роли"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className={inputCls} placeholder="Зона ответственности и ожидаемый результат" /></Field>
      <Field label="Hard Skills (через запятую)"><input value={hard} onChange={(e) => setHard(e.target.value)} className={inputCls} /></Field>
      <label className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
        <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="accent-amber-600" /> Оплачиваемая позиция (стипендия/договор ЦЭУ)
      </label>
      <Btn
        variant="emerald"
        className="w-full"
        disabled={title.trim().length < 5}
        onClick={() => {
          const p = state.projects.find((x) => x.id === projectId);
          onDone({
            id: `v-${Date.now()}`,
            title: title.trim(),
            spec,
            projectId,
            projectName: kind === "org" ? `Орг. отдел · ${dept.split("·")[0].trim()}` : p?.name ?? "Проект Гильдии",
            projectType: "existing",
            commercial: paid,
            grade,
            kind,
            dept: kind === "org" ? dept : undefined,
            openings: 1,
            source: "manual",
            workload,
            format: "Гибрид · Томск",
            description: desc || "Новая роль, открытая решением орг. отдела ЦЭУ.",
            responsibilities: ["Вести направление", "Отчитываться перед орг. отделом", "Менторить студентов"],
            hardSkills: hard.split(",").map((s) => s.trim()).filter(Boolean),
            softSkills: ["Ответственность", "Коммуникация"],
            tools: ["Notion", "Git"],
            niceToHave: [],
            team: kind === "org" ? "Орг. отдел ЦЭУ" : `Команда «${p?.name ?? "проекта"}»`,
            mentor: kind === "org" ? dept.split("·")[1]?.trim() ?? "Орг. отдел" : p?.team.find((t) => t.role === "Наставник")?.name ?? "Наставник проекта",
            postedAt: "только что",
            responses: 0,
          });
        }}
      >
        <Plus size={16} /> Открыть вакансию
      </Btn>
    </div>
  );
}
