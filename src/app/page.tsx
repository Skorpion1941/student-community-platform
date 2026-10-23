"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Presentation,
  Quote,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { useGuild } from "@/lib/store";
import { CAREER_PATH, ROADMAPS } from "@/lib/roadmaps";
import { CONTACTS } from "@/lib/contacts";
import { calcMatch } from "@/lib/seed";
import { semesterRange, summarize, todayISO } from "@/lib/scoring";
import { Avatar, Badge, Btn, Card, Field, MatchRing, Progress, SkeletonCards, inputCls } from "@/components/ui";
import { TodayPanel } from "@/components/today-panel";

const ROLE_CARDS = [
  { spec: "Backend", title: "Backend (Java / Spring)", desc: "API, сервисный слой, PostgreSQL, тесты", icon: Code2, tone: "from-emerald-500 to-teal-600", skills: ["Java", "Spring Boot", "PostgreSQL"] },
  { spec: "Frontend", title: "Frontend (React / Tailwind)", desc: "Интерфейсы, дизайн-система, адаптив", icon: Sparkles, tone: "from-indigo-500 to-violet-600", skills: ["React", "TypeScript", "Tailwind CSS"] },
  { spec: "Аналитика", title: "Системный аналитик", desc: "PRD → модели → API-контракт", icon: Target, tone: "from-sky-500 to-cyan-600", skills: ["BPMN", "Swagger", "User Story"] },
  { spec: "Тестирование", title: "QA / Тестировщик", desc: "Тест-планы, кейсы, баг-репорты", icon: ShieldCheck, tone: "from-amber-500 to-orange-600", skills: ["Postman", "Тест-кейсы", "Баг-репорты"] },
  { spec: "UI/UX", title: "UI/UX-дизайнер", desc: "UI-kit, wireframes, макеты, демо", icon: Rocket, tone: "from-rose-500 to-pink-600", skills: ["Figma", "UI-kit", "Прототипы"] },
  { spec: "PM", title: "Менеджер проекта", desc: "Спринты, дейли, оценка команды", icon: TrendingUp, tone: "from-violet-500 to-purple-700", skills: ["Scrum", "Декомпозиция", "Notion"] },
];

const BENEFITS = [
  { icon: Rocket, t: "Реальные проекты ТПУ", d: "Продукты, которыми пользуются абитуриенты, студенты и сотрудники университета." },
  { icon: Users, t: "Менторство с первого дня", d: "За каждым студентом — гильдиец и наставник, а глубокие ревью делает технаставник." },
  { icon: Trophy, t: "Прозрачный рейтинг", d: "Баллы за дейли и оценки наставников складываются в понятный итоговый процент." },
  { icon: Award, t: "Карьерный путь", d: "Кандидат → Студент → Гильдиец с явными критериями: проекты, дисциплина, рекомендация." },
  { icon: BookOpen, t: "База знаний", d: "Статьи, видеозаписи воркшопов и презентации экспертов ЦЭУ — всё в одном месте." },
  { icon: CalendarCheck, t: "Спринты по-взрослому", d: "Двухнедельные спринты, дорожная карта проекта, дейли и ретро — как в настоящей команде." },
];

const STORIES = [
  { name: "Алина Соколова", role: "Студент · Backend", text: "Пришла без опыта в командной разработке. За семестр закрыла первый проект, а ревью от технаставника научило писать код, который не стыдно показать." },
  { name: "Дмитрий Орлов", role: "Гильдиец · Frontend", text: "Здесь я впервые вёл стажёров и делал релиз в прод университета. Рейтинг и оценки спринтов помогают честно видеть свой рост." },
  { name: "Никита Фролов", role: "Гильдиец · Аналитика", text: "Дорожная карта аналитика из базы знаний — готовый маршрут от PRD до API-контракта. Это сильно ускорило вход в профессию." },
];

const FAQ = [
  { q: "Кто может вступить в Гильдию?", a: "Студенты ТПУ любых направлений: от первого курса до магистратуры. Нужны мотивация, 4–6 часов в неделю и готовность работать в команде. Опыт желателен, но не обязателен — для новичков есть роадмапы и менторы." },
  { q: "Как проходит отбор?", a: "Выбираете вакансию, пишете мотивационное письмо и бронируете слот собеседования в календаре технаставников. Решение — «Принять» или «Отклонить» с комментарием — приходит в личный кабинет." },
  { q: "Сколько времени нужно уделять?", a: "Студент (Intern) — 4–6 часов в неделю, Гильдиец (Junior) — 6–8 часов. Дейли-отчёт пишется только в будние дни и занимает пару минут." },
  { q: "Как считаются баллы и рейтинг?", a: "За дейли: 1 балл — отчёт вовремя, 0,5 — если вы честно написали, что ничего не делали (с причиной) или сдали с опозданием, 0 — отчёта нет. К ним добавляются оценки наставника за спринт по 4 критериям: активность, выполнение, самоорганизация, обучаемость." },
  { q: "Как стать Гильдийцем?", a: "Закрыть 1–3 проекта без срывов, стабильно сдавать дейли, набрать высокий итоговый процент и получить рекомендацию наставника. Грейд повышает орг. отдел ЦЭУ." },
  { q: "Это оплачивается?", a: "Роли Студента и Гильдийца — образовательные и портфолио-ориентированные. Оплачиваемые позиции — наставник и технаставник, а также роли в коммерческих проектах: вакансии открывает администратор." },
];

const SECTIONS = [
  { id: "path", l: "Путь" },
  { id: "projects", l: "Проекты" },
  { id: "directions", l: "Направления" },
  { id: "materials", l: "Материалы" },
  { id: "faq", l: "Вопросы" },
  { id: "contacts", l: "Контакты" },
];

export default function LandingPage() {
  const { state, loading, currentUser, role, setRole, setPresetSpec, pushToast, addInbox } = useGuild();
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const [form, setForm] = useState({ name: "", contact: "", text: "" });

  const perSlide = 2;
  const maxSlide = Math.max(0, state.projects.length - perSlide);
  const visible = state.projects.slice(slide, slide + perSlide);

  useEffect(() => {
    if (paused || maxSlide === 0) return;
    const t = setInterval(() => setSlide((s) => (s >= maxSlide ? 0 : s + 1)), 6000);
    return () => clearInterval(t);
  }, [paused, maxSlide]);

  const board = useMemo(() => {
    const range = semesterRange(0);
    const today = todayISO();
    return state.users
      .filter((u) => u.role === "intern" || u.role === "junior")
      .map((u) => ({ u, s: summarize(u.name, state.dailies, state.grades, state.sprints, range, today) }))
      .filter((r) => r.s.maxTotal > 0)
      .sort((a, b) => b.s.percent - a.s.percent)
      .slice(0, 3);
  }, [state.users, state.dailies, state.grades, state.sprints]);

  const best = useMemo(() => state.vacancies.map((v) => ({ v, m: calcMatch(currentUser.skills, v) })).sort((a, b) => b.m - a.m), [state.vacancies, currentUser.skills]);
  const kinds = { article: state.articles.filter((a) => a.kind === "article").length, video: state.articles.filter((a) => a.kind === "video").length, presentation: state.articles.filter((a) => a.kind === "presentation").length };
  const latestMaterials = [...state.articles].slice(0, 4);

  function pickRole(spec: string) {
    setPresetSpec(spec);
    pushToast({ kind: "info", title: `Фильтр применён: ${spec}`, text: "Вакансии отобраны под выбранное направление." });
    router.push("/vacancies");
  }

  function copy(text: string, what: string) {
    void navigator.clipboard?.writeText(text).then(
      () => pushToast({ kind: "success", title: `${what} скопирован`, text }),
      () => pushToast({ kind: "info", title: what, text })
    );
  }

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.28),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(99,102,241,0.30),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(20,184,166,0.2),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:p-14">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="emerald"><Sparkles size={12} /> Центр цифровой трансформации · ТПУ</Badge>
              <Badge tone="indigo"><Users size={12} /> 120+ студентов в сообществе</Badge>
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Строй <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">реальные IT-продукты</span> ТПУ вместе с Гильдией
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Сообщество, инкубатор проектов и школа для студентов: менторство с первого дня, код-ревью от технаставников, честный рейтинг и путь до Гильдийца.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {role === "guest" ? (
                <>
                  <Btn variant="emerald" size="lg" onClick={() => setRole("candidate")}><GraduationCap size={18} /> Войти через аккаунт ТПУ</Btn>
                  <Link href="/vacancies"><Btn variant="outline" size="lg" className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/20">Подать заявку в Гильдию <ArrowRight size={16} /></Btn></Link>
                </>
              ) : (
                <>
                  <Link href="/cabinet"><Btn variant="emerald" size="lg">Открыть личный кабинет <ArrowRight size={16} /></Btn></Link>
                  <Link href="/vacancies"><Btn variant="outline" size="lg" className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/20">Смотреть вакансии</Btn></Link>
                </>
              )}
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[{ v: state.projects.length, l: "активных продукта" }, { v: state.vacancies.length, l: "открытых вакансий" }, { v: state.articles.length, l: "материалов в базе знаний" }].map((s) => (
                <div key={s.l} className="rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/10 backdrop-blur">
                  <p className="text-2xl font-extrabold">{s.v}</p>
                  <p className="text-[11px] leading-snug text-slate-300">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-bold text-slate-400">
              <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">ИШИТР</span>
              <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">ИШЭ</span>
              <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">ЦЭУ ТПУ</span>
              <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">коммерческие пилоты</span>
            </div>
          </div>

          {/* живое превью продукта */}
          <div className="relative hidden lg:block">
            <div className="absolute -left-4 top-6 w-64 rotate-[-3deg] rounded-2xl bg-white p-4 text-slate-900 shadow-2xl">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-600"><Trophy size={13} /> Лидерборд семестра</p>
              <div className="mt-2 space-y-2">
                {board.length === 0 ? <p className="text-xs text-slate-500">Рейтинг формируется</p> : board.map((r, i) => (
                  <div key={r.u.id} className="flex items-center gap-2">
                    <span className={`grid size-6 place-items-center rounded-lg text-[11px] font-extrabold text-white ${i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : "bg-orange-400"}`}>{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-bold">{r.u.name}</span>
                    <span className="text-xs font-extrabold text-emerald-600">{r.s.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute right-0 top-28 w-72 rotate-[2deg] rounded-2xl bg-white p-4 text-slate-900 shadow-2xl">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700"><Briefcase size={13} /> Вакансия под ваши навыки</p>
              {best[0] ? (
                <>
                  <p className="mt-2 text-sm font-extrabold leading-snug">{best[0].v.title}</p>
                  <p className="text-[11px] text-slate-500">{best[0].v.projectName}</p>
                  <div className="mt-2"><MatchRing value={best[0].m} /></div>
                </>
              ) : null}
            </div>
            <div className="absolute bottom-0 left-8 w-72 rotate-[-1deg] rounded-2xl bg-white p-4 text-slate-900 shadow-2xl">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700"><CalendarCheck size={13} /> Дейли сегодня</p>
              <div className="mt-2 flex gap-1">{Array.from({ length: 10 }).map((_, i) => <span key={i} className={`h-6 flex-1 rounded-md ${i === 3 || i === 7 ? "bg-amber-400" : i === 9 ? "bg-slate-200" : "bg-emerald-500"}`} />)}</div>
              <p className="mt-2 text-[11px] text-slate-500">1 балл вовремя · 0,5 за «ничего не делал» · 0 без отчёта</p>
            </div>
            <div className="h-[420px]" />
          </div>
        </div>
      </section>

      {/* section nav */}
      <nav className="sticky top-[68px] z-30 -mt-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur lg:top-[72px]">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-900 hover:text-white">{s.l}</a>
        ))}
        <a href="#contacts" className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 sm:flex"><Phone size={13} /> {CONTACTS.phone}</a>
      </nav>

      <TodayPanel />

      {/* benefits */}
      <section>
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Почему Гильдия</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Всё, чтобы вырасти из студента в инженера</h2>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <Card key={b.t} className="group p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg">
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white"><b.icon size={21} /></span>
              <p className="mt-3 text-[15px] font-extrabold">{b.t}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{b.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* path */}
      <section id="path" className="scroll-mt-32">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Карьерный курс</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">От Кандидата до Гильдийца</h2>
            <p className="mt-1 text-sm text-slate-500">Три шага с понятными критериями перехода.</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">Срок: 1–2 семестра</span>
        </div>
        <div className="relative mt-5 grid gap-3 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-9 hidden h-0.5 bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-400 md:block" />
          {CAREER_PATH.slice(0, 3).map((c, i) => (
            <Card key={c.step} className="relative overflow-hidden p-5">
              <span className={`absolute inset-x-0 top-0 h-1 ${c.color}`} />
              <span className={`relative z-10 grid size-10 place-items-center rounded-full text-sm font-extrabold text-white ring-4 ring-white ${c.color}`}>{i + 1}</span>
              <p className="mt-3 text-base font-extrabold">{c.step}</p>
              <p className="mt-1 text-xs leading-snug text-slate-500">{c.desc}</p>
              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                {c.criteria.map((k) => <p key={k} className="flex items-start gap-1.5 text-[11px] text-slate-600"><Check size={12} className="mt-0.5 shrink-0 text-emerald-600" /> {k}</p>)}
              </div>
              <p className={`mt-3 flex items-center gap-1 text-[11px] font-bold ${i < 2 ? "text-emerald-700" : "text-indigo-700"}`}>
                {i < 2 ? <><ArrowRight size={12} /> далее: {CAREER_PATH[i + 1].step}</> : <><Award size={12} /> далее: наставник, технаставник и ЦЭУ</>}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* projects carousel */}
      <section id="projects" className="scroll-mt-32" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Витрина</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Проекты Гильдии</h2>
            <p className="mt-1 text-sm text-slate-500">Продукты экосистемы ТПУ — листайте и открывайте воркспейс.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSlide((s) => (s <= 0 ? maxSlide : s - 1))} className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50" aria-label="Назад"><ChevronLeft size={16} /></button>
            <div className="flex gap-1.5">{Array.from({ length: maxSlide + 1 }).map((_, i) => <button key={i} onClick={() => setSlide(i)} className={`h-2 rounded-full transition-all ${i === slide ? "w-6 bg-emerald-600" : "w-2 bg-slate-300"}`} aria-label={`Слайд ${i + 1}`} />)}</div>
            <button onClick={() => setSlide((s) => (s >= maxSlide ? 0 : s + 1))} className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50" aria-label="Вперёд"><ChevronRight size={16} /></button>
          </div>
        </div>
        {loading ? (
          <div className="mt-4"><SkeletonCards n={perSlide} /></div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {visible.map((p) => (
              <Card key={p.id} className="overflow-hidden transition hover:shadow-lg">
                <div className={`bg-gradient-to-r p-5 text-white ${p.cover}`}>
                  <div className="flex items-center justify-between gap-2"><Badge tone="slate">{p.status}</Badge><span className="text-[11px] font-bold uppercase tracking-wide opacity-80">{p.typeLabel}</span></div>
                  <h3 className="mt-2 text-lg font-extrabold">{p.name}</h3>
                  <p className="text-xs opacity-90">{p.short}</p>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">{p.team.slice(0, 4).map((m, i) => <Avatar key={i} name={m.name} color="bg-slate-700" size="sm" />)}</div>
                    <p className="text-xs text-slate-500">{p.team.length} участников · {p.deadline}</p>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[11px] font-bold text-slate-500"><span>Прогресс</span><span>{p.progress}%</span></div>
                    <Progress value={p.progress} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{p.stack.slice(0, 5).map((s) => <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{s}</span>)}</div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/projects/${p.id}`} className="flex-1"><Btn variant="secondary" size="sm" className="w-full">Открыть воркспейс</Btn></Link>
                    <Link href="/vacancies" className="flex-1"><Btn variant="outline" size="sm" className="w-full">Вакансии проекта</Btn></Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* directions */}
      <section id="directions" className="scroll-mt-32">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Направления</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Выберите свою специализацию</h2>
            <p className="mt-1 text-sm text-slate-500">Нажмите на роль — откроются вакансии с готовым фильтром.</p>
          </div>
          <Link href="/knowledge" className="flex items-center gap-1 text-sm font-bold text-emerald-700 hover:underline"><BookOpen size={15} /> Роадмапы и гайды</Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ROLE_CARDS.map((r) => (
            <button key={r.spec} onClick={() => pickRole(r.spec)} className={`group overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-left text-white transition hover:-translate-y-0.5 hover:shadow-xl ${r.tone}`}>
              <div className="flex items-center justify-between"><r.icon size={22} /><span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold transition group-hover:bg-white/30">Фильтр →</span></div>
              <p className="mt-3 text-base font-extrabold">{r.title}</p>
              <p className="text-xs opacity-90">{r.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{r.skills.map((s) => <span key={s} className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">{s}</span>)}</div>
              <p className="mt-3 text-[11px] font-bold opacity-90">{state.vacancies.filter((v) => v.spec === r.spec).length} вакансий · {ROADMAPS.find((x) => x.spec === r.spec)?.stages.length ?? 4} этапа роадмапа</p>
            </button>
          ))}
        </div>
      </section>

      {/* materials + vacancies */}
      <section id="materials" className="grid scroll-mt-32 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-extrabold"><Briefcase size={18} className="text-emerald-600" /> Вакансии под ваши навыки</h3>
            <Link href="/vacancies" className="text-xs font-bold text-emerald-700 hover:underline">Все вакансии</Link>
          </div>
          <div className="mt-3 space-y-2">
            {best.slice(0, 4).map(({ v, m }) => (
              <Link key={v.id} href={`/vacancies/${v.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/40">
                <div className="min-w-0"><p className="truncate text-sm font-bold">{v.title}</p><p className="truncate text-xs text-slate-500">{v.projectName} · {v.grade}</p></div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${m >= 75 ? "bg-emerald-100 text-emerald-700" : m >= 50 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{m}%</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-extrabold"><BookOpen size={18} className="text-indigo-600" /> Новое в базе знаний</h3>
            <Link href="/knowledge" className="text-xs font-bold text-emerald-700 hover:underline">Все материалы</Link>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600"><FileText size={11} /> {kinds.article} статей</span>
            <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700"><Video size={11} /> {kinds.video} видео</span>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700"><Presentation size={11} /> {kinds.presentation} презентации</span>
          </div>
          <div className="mt-3 space-y-2">
            {latestMaterials.map((a) => (
              <Link key={a.id} href={`/knowledge/${a.id}`} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/40">
                <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${a.kind === "video" ? "bg-rose-100 text-rose-600" : a.kind === "presentation" ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"}`}>{a.kind === "video" ? <Video size={15} /> : a.kind === "presentation" ? <Presentation size={15} /> : <FileText size={15} />}</span>
                <span className="min-w-0"><span className="block text-sm font-bold leading-snug">{a.title}</span><span className="text-xs text-slate-500">{a.category} · {a.speaker ?? a.authorName} · {a.readingTime}</span></span>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      {/* numbers band */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 p-6 text-white sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: "120+", l: "студентов в сообществе", i: Users },
            { v: String(state.projects.length), l: "продукта в разработке и пилотах", i: Rocket },
            { v: "2 недели", l: "длится спринт у каждой команды", i: CalendarCheck },
            { v: "4", l: "критерия оценки наставника + дейли", i: Trophy },
          ].map((s) => (
            <div key={s.l} className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-emerald-300"><s.i size={22} /></span>
              <div><p className="text-3xl font-extrabold leading-none">{s.v}</p><p className="mt-1 text-xs text-slate-300">{s.l}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* stories */}
      <section>
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Истории участников</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Что говорят те, кто уже в Гильдии</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {STORIES.map((s) => {
            const u = state.users.find((x) => x.name === s.name);
            return (
              <Card key={s.name} className="flex flex-col p-5">
                <Quote size={22} className="text-emerald-300" />
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-600">{s.text}</p>
                <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3">
                  <Avatar name={s.name} color={u?.color ?? "bg-slate-600"} />
                  <div><p className="text-sm font-extrabold">{s.name}</p><p className="text-[11px] text-slate-500">{s.role}</p></div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="scroll-mt-32">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">FAQ</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Частые вопросы</h2>
            <p className="mt-2 text-sm text-slate-500">Не нашли ответ? Напишите нам — отвечает орг. отдел ЦЭУ в рабочие часы.</p>
            <a href="#contacts"><Btn variant="outline" size="md" className="mt-4"><MessageCircle size={16} /> Задать вопрос</Btn></a>
          </div>
          <div className="space-y-2">
            {FAQ.map((f, i) => (
              <div key={f.q} className={`overflow-hidden rounded-2xl border bg-white transition ${faq === i ? "border-emerald-300 shadow-sm" : "border-slate-200"}`}>
                <button onClick={() => setFaq(faq === i ? null : i)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                  <span className="flex-1 text-sm font-extrabold">{f.q}</span>
                  <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${faq === i ? "rotate-180 text-emerald-600" : ""}`} />
                </button>
                {faq === i ? <p className="px-4 pb-4 text-[13px] leading-relaxed text-slate-600">{f.a}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-7 text-white sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="min-w-60 flex-1">
            <Rocket size={28} />
            <h3 className="mt-3 text-2xl font-extrabold sm:text-3xl">Готовы попасть в команду?</h3>
            <p className="mt-2 max-w-xl text-sm text-emerald-50">Заполните профиль, выберите направление и забронируйте слот собеседования. Решение придёт в течение спринта.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/vacancies"><Btn variant="secondary" size="lg">Выбрать вакансию <ArrowRight size={16} /></Btn></Link>
            <Link href="/events"><Btn variant="outline" size="lg" className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10">Календарь событий</Btn></Link>
          </div>
        </div>
      </section>

      {/* contacts */}
      <section id="contacts" className="scroll-mt-32">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Контакты</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Свяжитесь с орг. отделом</h2>
          <p className="mt-1 text-sm text-slate-500">Вопросы по вступлению, проектам и сотрудничеству — звоните, пишите или приходите в кабинет.</p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { i: Mail, l: "Почта", v: CONTACTS.email, href: `mailto:${CONTACTS.email}`, copy: "Адрес почты" },
              { i: Phone, l: "Телефон", v: CONTACTS.phone, href: `tel:${CONTACTS.phoneHref}`, copy: "Телефон" },
              { i: Building2, l: "Где нас найти", v: CONTACTS.room, sub: CONTACTS.address, copy: "Адрес кабинета" },
              { i: MessageCircle, l: "Telegram", v: CONTACTS.telegram, sub: "Новости и вопросы сообщества", copy: "Telegram" },
            ].map((c) => (
              <Card key={c.l} className="group p-4 transition hover:border-emerald-300 hover:shadow-md">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><c.i size={19} /></span>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">{c.l}</p>
                {c.href ? <a href={c.href} className="mt-0.5 block break-all text-sm font-extrabold hover:text-emerald-700">{c.v}</a> : <p className="mt-0.5 text-sm font-extrabold">{c.v}</p>}
                {c.sub ? <p className="text-[11px] text-slate-500">{c.sub}</p> : null}
                <button onClick={() => copy(c.v, c.copy)} className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-400 transition hover:text-emerald-700"><Copy size={11} /> Копировать</button>
              </Card>
            ))}
            <Card className="p-4 sm:col-span-2">
              <p className="flex items-center gap-2 text-sm font-extrabold"><Clock size={16} className="text-emerald-600" /> Часы работы · {CONTACTS.office}</p>
              <p className="mt-1 text-[13px] text-slate-600">{CONTACTS.hours}. Консультации по вступлению — без записи; для собеседований используйте календарь слотов в разделе «Вакансии».</p>
              <p className="mt-2 flex items-start gap-2 text-[12px] text-slate-500"><MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" /> {CONTACTS.address}, {CONTACTS.room}</p>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-extrabold"><Send size={17} className="text-emerald-600" /> Написать нам</h3>
            <p className="mt-1 text-xs text-slate-500">Обращение увидит администратор в панели — ответим по указанным контактам.</p>
            <div className="mt-4 space-y-3">
              <Field label="Как к вам обращаться"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Имя" /></Field>
              <Field label="Telegram или почта для ответа"><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className={inputCls} placeholder="@username или name@mail.ru" /></Field>
              <Field label="Сообщение"><textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={4} className={inputCls} placeholder="Расскажите, чем можем помочь…" /></Field>
              <Btn
                variant="emerald"
                className="w-full"
                disabled={form.name.trim().length < 2 || form.contact.trim().length < 4 || form.text.trim().length < 10}
                onClick={() => {
                  addInbox({ id: `msg-${Date.now()}`, name: form.name.trim(), contact: form.contact.trim(), text: form.text.trim(), createdAt: new Date().toLocaleString("ru-RU"), done: false });
                  setForm({ name: "", contact: "", text: "" });
                  pushToast({ kind: "success", title: "Сообщение отправлено!", text: "Орг. отдел ответит в рабочие часы." });
                }}
              >
                <Send size={16} /> Отправить
              </Btn>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
