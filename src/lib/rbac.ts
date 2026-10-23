import type { PermissionRow, RoleId, RoleMeta } from "./types";

export const ROLES: RoleMeta[] = [
  {
    id: "guest",
    label: "Гость",
    short: "Гость",
    grade: "Без доступа",
    description: "Только публичные страницы: лендинг, витрина проектов, вакансии и открытые статьи.",
    color: "text-slate-600",
    bg: "bg-slate-100",
    icon: "eye",
    level: 0,
  },
  {
    id: "candidate",
    label: "Кандидат",
    short: "Кандидат",
    grade: "Абитуриент Гильдии",
    description: "Авторизован через ТПУ. Кабинет, умный подбор вакансий, запись на собеседования.",
    color: "text-sky-700",
    bg: "bg-sky-100",
    icon: "user",
    level: 1,
  },
  {
    id: "intern",
    label: "Студент (Intern)",
    short: "Студент",
    grade: "Intern · 4–6 ч/нед",
    description: "Участник проекта. Задачи, дейли-отчёты, роадмап специализации, база знаний.",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    icon: "sprout",
    level: 2,
  },
  {
    id: "junior",
    label: "Гильдиец (Junior)",
    short: "Гильдиец",
    grade: "Junior · 1–3 проекта",
    description: "Опытный студент. Средние задачи, менторство 1–2 стажёров, код-ревью, коммерция.",
    color: "text-indigo-700",
    bg: "bg-indigo-100",
    icon: "medal",
    level: 3,
  },
  {
    id: "mentor",
    label: "Наставник (PM / Middle)",
    short: "Наставник",
    grade: "Middle · Руководитель",
    description: "Ведёт команды, декомпозирует задачи, планирует спринты, оценивает студентов.",
    color: "text-amber-700",
    bg: "bg-amber-100",
    icon: "compass",
    level: 4,
  },
  {
    id: "techmentor",
    label: "Технаставник (Tech Lead)",
    short: "Технаставник",
    grade: "Senior · Оплачиваемая",
    description: "Кросс-проектный эксперт. Ревью, слоты собеседований, база знаний, воркшопы, 1-on-1.",
    color: "text-violet-700",
    bg: "bg-violet-100",
    icon: "cpu",
    level: 5,
  },
  {
    id: "admin",
    label: "Администратор (Орг. отдел)",
    short: "Админ",
    grade: "ЦЭУ · Полный доступ",
    description: "Матрица прав, грейды, запуск и приёмка проектов, утверждение MVP.",
    color: "text-rose-700",
    bg: "bg-rose-100",
    icon: "shield",
    level: 6,
  },
];

export function roleMeta(id: RoleId): RoleMeta {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}

export const DEFAULT_PERMISSIONS: PermissionRow[] = [
  {
    id: "view_public",
    label: "Просмотр публичных страниц",
    hint: "Лендинг, витрина проектов, вакансии, открытые статьи",
    roles: { guest: true, candidate: true, intern: true, junior: true, mentor: true, techmentor: true, admin: true },
  },
  {
    id: "apply_vacancy",
    label: "Отклик на вакансии и бронь собеседований",
    hint: "Мотивационное письмо + интерактивный календарь слотов",
    roles: { guest: false, candidate: true, intern: true, junior: false, mentor: false, techmentor: false, admin: true },
  },
  {
    id: "edit_profile",
    label: "Редактирование профиля и навыков",
    hint: "Bio, опыт, соцсети, категориальный селектор скиллов",
    roles: { guest: false, candidate: true, intern: true, junior: true, mentor: true, techmentor: true, admin: true },
  },
  {
    id: "project_workspace",
    label: "Доступ к воркспейсу проектов",
    hint: "Канбан, команда, дейлики, ссылки GitHub/Figma/Tracker",
    roles: { guest: false, candidate: false, intern: true, junior: true, mentor: true, techmentor: true, admin: true },
  },
  {
    id: "submit_daily",
    label: "Ежедневные отчёты",
    hint: "Что сделал / сделаю / блокеры",
    roles: { guest: false, candidate: false, intern: true, junior: true, mentor: true, techmentor: false, admin: true },
  },
  {
    id: "view_roadmap",
    label: "Роадмапы специализаций",
    hint: "Аналитик, QA, UI/UX, Frontend, Backend — 4 этапа",
    roles: { guest: false, candidate: true, intern: true, junior: true, mentor: true, techmentor: true, admin: true },
  },
  {
    id: "mentor_interns",
    label: "Менторство и лёгкое ревью",
    hint: "1–2 подопечных, первичные код-ревью",
    roles: { guest: false, candidate: false, intern: false, junior: true, mentor: true, techmentor: true, admin: true },
  },
  {
    id: "manage_projects",
    label: "Управление проектами и спринтами",
    hint: "Декомпозиция, оценка студентов, ретро и дейли",
    roles: { guest: false, candidate: false, intern: false, junior: false, mentor: true, techmentor: true, admin: true },
  },
  {
    id: "manage_slots",
    label: "Слоты собеседований и вердикты",
    hint: "Генерация сетки, Принять / Отклонить",
    roles: { guest: false, candidate: false, intern: false, junior: false, mentor: false, techmentor: true, admin: true },
  },
  {
    id: "deep_review",
    label: "Глубокие ревью и консультации",
    hint: "Code/Design Review, 1-on-1, разбор блокеров",
    roles: { guest: false, candidate: false, intern: false, junior: false, mentor: false, techmentor: true, admin: true },
  },
  {
    id: "curate_kb",
    label: "Публикация статей и мероприятий",
    hint: "CRUD базы знаний, воркшопы и мастер-классы",
    roles: { guest: false, candidate: false, intern: false, junior: false, mentor: true, techmentor: true, admin: true },
  },
  {
    id: "manage_rbac",
    label: "Матрица прав и пользователи",
    hint: "Переключение прав, повышение грейдов",
    roles: { guest: false, candidate: false, intern: false, junior: false, mentor: false, techmentor: false, admin: true },
  },
  {
    id: "launch_projects",
    label: "Запуск и приёмка MVP",
    hint: "Релиз, пилот, масштабирование, остановка",
    roles: { guest: false, candidate: false, intern: false, junior: false, mentor: false, techmentor: false, admin: true },
  },
  {
    id: "escalate",
    label: "Эскалации по иерархии",
    hint: "Техническая, организационная, HR/конфликт",
    roles: { guest: false, candidate: false, intern: true, junior: true, mentor: true, techmentor: true, admin: true },
  },
];

export const NAV_BY_ROLE: Record<RoleId, string[]> = {
  guest: ["home", "vacancies", "knowledge"],
  candidate: ["home", "cabinet", "vacancies", "knowledge", "events"],
  intern: ["home", "cabinet", "projects", "vacancies", "knowledge", "events"],
  junior: ["home", "cabinet", "projects", "vacancies", "knowledge", "events"],
  mentor: ["home", "cabinet", "projects", "knowledge", "events", "vacancies"],
  techmentor: ["home", "cabinet", "projects", "knowledge", "events", "vacancies"],
  admin: ["home", "cabinet", "projects", "vacancies", "knowledge", "events"],
};

export const GRADE_BY_ROLE: Record<RoleId, string> = {
  guest: "Гость",
  candidate: "Кандидат",
  intern: "Студент (Intern)",
  junior: "Гильдиец (Junior)",
  mentor: "Наставник (Middle)",
  techmentor: "Технаставник (Senior)",
  admin: "Администратор",
};

/** Роли, которыми админ может управлять в списке участников */
export const MANAGEABLE_ROLES: RoleId[] = ["candidate", "intern", "junior", "mentor", "techmentor", "admin"];
