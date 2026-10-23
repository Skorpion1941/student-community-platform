import type {
  Application,
  ConsultRequest,
  DailyReport,
  DemoUser,
  Escalation,
  EventItem,
  Sprint,
  InterviewSlot,
  KBArticle,
  Project,
  ReviewRequest,
  SprintGrade,
  TaskItem,
  Vacancy,
} from "./types";
import { DEFAULT_STAGES, addDays, isWeekday, isoLocal, mondayOf, sprintStatusByDate, todayISO } from "./scoring";

function d(offsetDays: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  return isoLocal(dt);
}


export const SEED_REVIEWS: ReviewRequest[] = [
  { id: "rv-1", projectId: "p-guild", title: "Ревью PR #142: API бронирования слотов", type: "code", link: "github.com/tpu-guild/platform/pull/142", comment: "Добавил optimistic lock и unit-тесты на двойную бронь. Прошу глубокое ревью.", authorName: "Алина Соколова", authorSpec: "Backend", reviewerName: "Михаил Громов", status: "sent", priority: "high", createdAt: "сегодня" },
  { id: "rv-2", projectId: "p-guild", title: "Ревью макета: календарь мероприятий", type: "design", link: "figma.com/guild/events-v3", comment: "Сетка недели + модалка дня. Нужна оценка по UI-kit.", authorName: "Дмитрий Орлов", authorSpec: "Frontend", reviewerName: "Михаил Громов", status: "todo", priority: "medium", createdAt: "сегодня" },
  { id: "rv-3", projectId: "p-rooms", title: "Ревью тест-плана модуля заявок", type: "qa", link: "docs.tpu.ru/rooms/test-plan-v2", comment: "42 кейса, приоритезация по критическому пути.", authorName: "Алина Соколова", authorSpec: "QA", reviewerName: "Михаил Громов", status: "changes", priority: "medium", verdict: "Добавить негативные сценарии по QR-подтверждению.", createdAt: "вчера" },
  { id: "rv-4", projectId: "p-abit", title: "Ревью ТЗ: конкурсные списки", type: "doc", link: "docs.tpu.ru/abit/tz-lists", comment: "User Story + словарь данных + API Contract ч.1.", authorName: "Екатерина Власова", authorSpec: "Аналитика", reviewerName: "Михаил Громов", status: "done", priority: "low", verdict: "Принято. Замечание по пагинации учтено.", createdAt: "3 дня назад" },
];

export const SEED_USERS: DemoUser[] = [
  {
    id: "u-candidate",
    name: "Иван Петров",
    role: "candidate",
    spec: "Frontend",
    initials: "ИП",
    color: "bg-sky-500",
    bio: "Студент 2 курса ИШИТР, направление «Программная инженерия». Делал лендинги и pet-проекты на React, хочу в реальный продукт ТПУ.",
    experience: "1 год: React, pet-проекты, хакатон Digital Tomsk — 2 место.",
    github: "github.com/ivanpetrov-tpu",
    telegram: "@ivan_petrov_tpu",
    figma: "",
    portfolio: "ivanpetrov.dev",
    skills: ["React", "TypeScript", "Tailwind CSS", "Git", "Figma (базово)", "Коммуникация", "Ответственность"],
    grade: "Кандидат",
    projectsCount: 0,
    tasksClosed: 0,
    rating: 0,
    institute: "ИШИТР",
    course: "2 курс",
  },
  {
    id: "u-intern",
    name: "Алина Соколова",
    role: "intern",
    spec: "Backend",
    initials: "АС",
    color: "bg-emerald-500",
    bio: "Студентка 2 курса ИШИТР. Прошла отбор в Гильдию весной, сейчас в проекте «Бронирование аудиторий ЦЭУ». Люблю порядок в API и хорошие тесты.",
    experience: "Java 1 год, Spring Boot — базовый уровень, SQL.",
    github: "github.com/alina-sok",
    telegram: "@alina_sok",
    figma: "",
    portfolio: "",
    skills: ["Java", "Spring Boot", "PostgreSQL", "Git", "Postman", "Дисциплина", "Умение задавать вопросы"],
    grade: "Студент (Intern)",
    projectsCount: 1,
    tasksClosed: 14,
    rating: 4.6,
    institute: "ИШИТР",
    course: "2 курс",
  },
  {
    id: "u-junior",
    name: "Дмитрий Орлов",
    role: "junior",
    spec: "Frontend",
    initials: "ДО",
    color: "bg-indigo-500",
    bio: "Гильдиец с 2024 года. Закрыл 2 проекта: кабинет абитуриента и виджеты расписания. Менторю двух стажёров, делаю ревью.",
    experience: "2 года: React, Next.js, Tailwind, Zustand. 2 релиза в проде ТПУ.",
    github: "github.com/dorlov",
    telegram: "@d_orlov",
    figma: "figma.com/@dorlov",
    portfolio: "dorlov.dev",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Zustand", "Code Review", "Менторство"],
    grade: "Гильдиец (Junior)",
    projectsCount: 2,
    tasksClosed: 47,
    rating: 4.8,
    institute: "ИШИТР",
    course: "3 курс",
  },
  {
    id: "u-mentor",
    name: "Екатерина Власова",
    role: "mentor",
    spec: "PM",
    initials: "ЕВ",
    color: "bg-amber-500",
    bio: "Наставник проектов «Гильдия» и «Кабинет абитуриента». Веду 2 команды по 5 человек, отвечаю за спринты и отчётность перед СГ.",
    experience: "3 года в управлении, Agile/Scrum, Notion/Jira,CustDev.",
    github: "",
    telegram: "@ek_vlasova",
    figma: "",
    portfolio: "",
    skills: ["Scrum", "Декомпозиция", "BPMN", "Notion", "Публичные выступления", "Обратная связь"],
    grade: "Наставник (Middle)",
    projectsCount: 4,
    tasksClosed: 120,
    rating: 4.9,
    institute: "ИШЭ",
    course: "Магистратура",
  },
  {
    id: "u-tech",
    name: "Михаил Громов",
    role: "techmentor",
    spec: "Backend",
    initials: "МГ",
    color: "bg-violet-500",
    bio: "Технаставник, Java/Spring. Отвечаю за архитектуру, глубокие ревью и слоты собеседований. Веду воркшопы по Spring и PostgreSQL.",
    experience: "5 лет backend, 2 года в ЦЭУ. 10+ студентов доведены до Junior.",
    github: "github.com/mgromov",
    telegram: "@m_gromov",
    figma: "",
    portfolio: "",
    skills: ["Java", "Spring Boot", "PostgreSQL", "Docker", "Архитектура", "Наставничество"],
    grade: "Технаставник (Senior)",
    projectsCount: 8,
    tasksClosed: 300,
    rating: 5.0,
    institute: "ЦЭУ",
    course: "Сотрудник",
  },
  {
    id: "u-admin",
    name: "Ковынев Алексей Николаевич",
    role: "admin",
    spec: "Архитектор",
    initials: "КА",
    color: "bg-rose-600",
    bio: "Архитектор и директор Центра цифровой трансформации университета (ЦЭУ). Отвечаю за стратегию Гильдии, запуск проектов и приёмку MVP.",
    experience: "12 лет в ИТ, архитектура корпоративных систем ТПУ.",
    github: "",
    telegram: "@kovynev_an",
    figma: "",
    portfolio: "",
    skills: ["Архитектура", "Стратегия", "Управление портфелем", "Приёмка MVP"],
    grade: "Администратор",
    projectsCount: 12,
    tasksClosed: 500,
    rating: 5.0,
    institute: "ЦЭУ",
    course: "Директор",
  },
  {
    id: "u-so",
    name: "Семен Олегович",
    role: "admin",
    spec: "Орг. отдел — Онбординг",
    initials: "СО",
    color: "bg-teal-600",
    bio: "Орг. отдел: онбординг, обучение, адаптация новичков.",
    experience: "Методист, куратор 40+ студентов.",
    github: "",
    telegram: "@semen_org",
    figma: "",
    portfolio: "",
    skills: ["Онбординг", "Обучение", "Адаптация"],
    grade: "Орг. отдел",
    projectsCount: 6,
    tasksClosed: 80,
    rating: 4.9,
    institute: "ЦЭУ",
    course: "Сотрудник",
  },
  {
    id: "u-sg",
    name: "Сергей Георгиевич",
    role: "admin",
    spec: "Орг. отдел — Коммерция",
    initials: "СГ",
    color: "bg-orange-600",
    bio: "Орг. отдел: коммерческие проекты, заказчики, пилоты.",
    experience: "Продажи и delivery коммерческих проектов.",
    github: "",
    telegram: "@sergey_com",
    figma: "",
    portfolio: "",
    skills: ["Коммерция", "Заказчики", "Пилоты"],
    grade: "Орг. отдел",
    projectsCount: 9,
    tasksClosed: 150,
    rating: 4.9,
    institute: "ЦЭУ",
    course: "Сотрудник",
  },
  {
    id: "u-vi",
    name: "Владимир Игоревич",
    role: "admin",
    spec: "Орг. отдел — База знаний",
    initials: "ВИ",
    color: "bg-cyan-700",
    bio: "Орг. отдел: база знаний, грейды, регламенты.",
    experience: "Методология оценки и грейдирования.",
    github: "",
    telegram: "@vlad_kb",
    figma: "",
    portfolio: "",
    skills: ["База знаний", "Грейды", "Регламенты"],
    grade: "Орг. отдел",
    projectsCount: 5,
    tasksClosed: 90,
    rating: 4.9,
    institute: "ЦЭУ",
    course: "Сотрудник",
  },
  {
    id: "u-tim", name: "Тимур Ахметов", role: "intern", spec: "Frontend", initials: "ТА", color: "bg-lime-600",
    bio: "Студент 1 курса ИШИТР. Осваиваю React и дизайн-систему Гильдии, веду календарь событий.",
    experience: "Полгода: HTML/CSS, React, учебные проекты.", github: "github.com/timur-ahm", telegram: "@timur_ahm", figma: "", portfolio: "",
    skills: ["React", "TypeScript", "Git", "Tailwind CSS", "Ответственность"], grade: "Студент (Intern)", projectsCount: 1, tasksClosed: 9, rating: 4.1, institute: "ИШИТР", course: "1 курс",
  },
  {
    id: "u-art", name: "Артём Беляев", role: "junior", spec: "Backend", initials: "АБ", color: "bg-sky-700",
    bio: "Гильдиец, backend. Закрыл 2 проекта, веду модуль заявок бронирования аудиторий.",
    experience: "2 года: Java, Spring Boot, PostgreSQL, Docker.", github: "github.com/art-belyaev", telegram: "@art_bel", figma: "", portfolio: "",
    skills: ["Java", "Spring Boot", "PostgreSQL", "Docker", "Postman", "Code Review"], grade: "Гильдиец (Junior)", projectsCount: 2, tasksClosed: 38, rating: 4.7, institute: "ИШИТР", course: "3 курс",
  },
  {
    id: "u-sof", name: "София Лебедева", role: "intern", spec: "UI/UX", initials: "СЛ", color: "bg-pink-500",
    bio: "Дизайнер, 2 курс. Собираю UI-kit для сетки бронирования, учусь вести демо заказчику.",
    experience: "1 год Figma, 3 учебных проекта, стажировка в студии.", github: "", telegram: "@sofia_ux", figma: "figma.com/@sofia", portfolio: "sofia.design",
    skills: ["Figma", "UI-kit", "Прототипирование", "Miro", "Коммуникация"], grade: "Студент (Intern)", projectsCount: 1, tasksClosed: 11, rating: 4.3, institute: "ИШИТР", course: "2 курс",
  },
  {
    id: "u-mar", name: "Мария Ковалёва", role: "intern", spec: "Тестирование", initials: "МК", color: "bg-fuchsia-600",
    bio: "QA-стажёр: тест-планы и баг-репорты по боту расписания.",
    experience: "Курс по тестированию, 2 учебных проекта.", github: "", telegram: "@mari_qa", figma: "", portfolio: "",
    skills: ["Тест-кейсы", "Баг-репорты", "Postman", "SQL", "Внимательность"], grade: "Студент (Intern)", projectsCount: 1, tasksClosed: 13, rating: 4.4, institute: "ИШИТР", course: "2 курс",
  },
  {
    id: "u-nik", name: "Никита Фролов", role: "junior", spec: "Аналитика", initials: "НФ", color: "bg-teal-700",
    bio: "Системный аналитик, гильдиец. Веду ТЗ и API-контракты кабинета абитуриента.",
    experience: "2 проекта: BPMN, Swagger, физическая модель данных.", github: "", telegram: "@nik_analyst", figma: "", portfolio: "",
    skills: ["BPMN", "SQL", "REST", "Swagger", "User Story", "Notion", "Миро"], grade: "Гильдиец (Junior)", projectsCount: 2, tasksClosed: 31, rating: 4.6, institute: "ИШЭ", course: "3 курс",
  },
];

export const SEED_PROJECTS: Project[] = [
  {
    id: "p-guild",
    stages: ["Инициация", "Проектирование", "Ядро платформы", "Кабинеты и роадмапы", "Тестирование и релиз"],
    name: "Веб-платформа «Гильдия»",
    short: "Внутренняя платформа сообщества: рекрутинг, проекты, база знаний",
    description:
      "Флагманский продукт ЦЭУ: единая платформа для отбора студентов, ведения проектов, расписания мероприятий и базы знаний. Именно этот продукт вы сейчас смотрите в демо. Стек: Next.js, Tailwind, PostgreSQL, Spring Boot (ядро API).",
    status: "В разработке",
    typeLabel: "Внутренний ЦЭУ",
    commercial: false,
    isNew: false,
    stack: ["Next.js", "React", "Tailwind", "Java", "Spring Boot", "PostgreSQL"],
    links: { github: "github.com/tpu-guild/platform", tracker: "tracker.tpu.ru/guild", figma: "figma.com/guild" },
    team: [
      { userId: "u-mentor", name: "Екатерина Власова", role: "Наставник", spec: "PM" },
      { userId: "u-tech", name: "Михаил Громов", role: "Технаставник", spec: "Backend" },
      { userId: "u-junior", name: "Дмитрий Орлов", role: "Гильдиец", spec: "Frontend" },
      { userId: "u-intern", name: "Алина Соколова", role: "Студент", spec: "Backend" },
      { userId: "u-tim", name: "Тимур Ахметов", role: "Студент", spec: "Frontend" },
    ],
    progress: 68,
    deadline: "Декабрь 2026",
    color: "bg-emerald-500",
    cover: "from-emerald-500 to-teal-600",
    goals: ["Запустить рекрутинг и слоты", "Канбан и дейлики", "База знаний и грейды"],
  },
  {
    id: "p-abit",
    name: "Личный кабинет абитуриента ТПУ",
    short: "Подача документов, статусы, чат с приёмной комиссией",
    description:
      "Сервис для абитуриентов: подача заявления, отслеживание конкурсных списков, расписание Дней открытых дверей, чат с приёмной комиссией. Пилот запущен в приёмную кампанию, сейчас масштабирование.",
    status: "Пилот",
    typeLabel: "Внутренний ЦЭУ",
    commercial: false,
    isNew: false,
    stack: ["React", "TypeScript", "Spring Boot", "PostgreSQL", "Figma"],
    links: { github: "github.com/tpu-guild/abit", tracker: "tracker.tpu.ru/abit", figma: "figma.com/abit" },
    team: [
      { userId: "u-mentor", name: "Екатерина Власова", role: "Наставник", spec: "PM" },
      { userId: "u-junior", name: "Дмитрий Орлов", role: "Гильдиец", spec: "Frontend" },
      { userId: "u-nik", name: "Никита Фролов", role: "Гильдиец", spec: "Аналитика" },
    ],
    progress: 82,
    deadline: "Ноябрь 2026",
    color: "bg-indigo-500",
    cover: "from-indigo-500 to-violet-600",
    goals: ["Интеграция с 1С", "Уведомления", "Мобильная адаптация"],
  },
  {
    id: "p-schedule",
    name: "ИИ-ассистент расписания ИШИТР",
    short: "Telegram-бот и виджет: расписание, аудитории, переносы",
    description:
      "Коммерческий эксперимент: ассистент отвечает на вопросы «где пара?», «кто ведёт?», «куда перенесли?», рассылает изменения. Модель + RAG поверх расписания ТПУ.",
    status: "Тестирование",
    typeLabel: "Коммерческий",
    commercial: true,
    isNew: true,
    stack: ["Python", "React", "PostgreSQL", "LLM", "Telegram API"],
    links: { github: "github.com/tpu-guild/schedule-ai", tracker: "tracker.tpu.ru/schedule", figma: "figma.com/schedule" },
    team: [
      { userId: "u-tech", name: "Михаил Громов", role: "Технаставник", spec: "Backend" },
      { userId: "u-intern", name: "Алина Соколова", role: "Студент", spec: "QA" },
      { userId: "u-mar", name: "Мария Ковалёва", role: "Студент", spec: "Тестирование" },
    ],
    progress: 54,
    deadline: "Январь 2027",
    color: "bg-amber-500",
    cover: "from-amber-500 to-orange-600",
    goals: ["Точность 95%", "Пилот в 3 группах", "Интеграция с ЛК"],
  },
  {
    id: "p-rooms",
    name: "Бронирование аудиторий ЦЭУ",
    short: "Календарь аудиторий, заявки, подтверждение",
    description:
      "Внутренний сервис ЦЭУ: интерактивная сетка аудиторий, бронирование под пары и мероприятия, согласование с диспетчером, QR-подтверждение на входе.",
    status: "MVP Готов",
    typeLabel: "Внутренний ЦЭУ",
    commercial: false,
    isNew: true,
    stack: ["Next.js", "Spring Boot", "PostgreSQL"],
    links: { github: "github.com/tpu-guild/rooms", tracker: "tracker.tpu.ru/rooms", figma: "figma.com/rooms" },
    team: [
      { userId: "u-mentor", name: "Екатерина Власова", role: "Наставник", spec: "PM" },
      { userId: "u-intern", name: "Алина Соколова", role: "Студент", spec: "Backend" },
      { userId: "u-art", name: "Артём Беляев", role: "Гильдиец", spec: "Backend" },
      { userId: "u-sof", name: "София Лебедева", role: "Студент", spec: "UI/UX" },
    ],
    progress: 91,
    deadline: "Октябрь 2026",
    color: "bg-sky-500",
    cover: "from-sky-500 to-cyan-600",
    goals: ["Приёмка у СГ", "Пилот в корпусе №10", "Масштабирование"],
  },
];

export const SEED_VACANCIES: Vacancy[] = [
  {
    id: "v-backend-1",
    title: "Backend-разработчик (Java / Spring Boot)",
    spec: "Backend",
    projectId: "p-guild",
    projectName: "Веб-платформа «Гильдия»",
    projectType: "existing",
    commercial: false,
    grade: "Intern / Junior",
    kind: "project",
    openings: 1,
    source: "manual",
    workload: "6–8 ч/нед",
    format: "Гибрид · Томск",
    description:
      "Разработка ядра API платформы: заявки, слоты собеседований, дейли-отчёты. Работа в паре с технаставником, ревью каждого PR, понятные критерии приёмки.",
    responsibilities: [
      "Проектировать REST API по OpenAPI-контракту",
      "Писать сервисный слой на Spring Boot + JPA",
      "Покрывать код unit-тестами",
      "Вести дейли-отчёты и участвовать в ретро",
    ],
    hardSkills: ["Java", "Spring Boot", "PostgreSQL", "Git"],
    softSkills: ["Ответственность", "Дисциплина"],
    tools: ["Postman", "Swagger", "Docker (базово)"],
    niceToHave: ["Redis", "Testcontainers"],
    team: "Наставник + Технаставник + 2 Frontend + Аналитик",
    mentor: "Михаил Громов",
    postedAt: "2 дня назад",
    responses: 12,
  },
  {
    id: "v-front-1",
    title: "Frontend-разработчик (React / Tailwind)",
    spec: "Frontend",
    projectId: "p-guild",
    projectName: "Веб-платформа «Гильдия»",
    projectType: "existing",
    commercial: false,
    grade: "Intern",
    kind: "project",
    openings: 2,
    source: "new",
    workload: "4–6 ч/нед",
    format: "Гибрид · Томск",
    description:
      "Интерфейсы кабинета студента: роадмап, дейли-виджет, календарь событий. Дизайн-система готова в Figma, рядом ментор-Дмитрий.",
    responsibilities: ["Верстать по Figma на React + Tailwind", "Интегрировать REST API", "Делать адаптив desktop/mobile"],
    hardSkills: ["React", "TypeScript", "Tailwind CSS"],
    softSkills: ["Коммуникация", "Внимательность"],
    tools: ["Git", "Figma"],
    niceToHave: ["Next.js", "Zustand"],
    team: "2 Frontend + Backend + Дизайнер",
    mentor: "Дмитрий Орлов",
    postedAt: "1 день назад",
    responses: 18,
  },
  {
    id: "v-analyst-1",
    title: "Системный аналитик",
    spec: "Аналитика",
    projectId: "p-abit",
    projectName: "Личный кабинет абитуриента ТПУ",
    projectType: "existing",
    commercial: false,
    grade: "Intern / Junior",
    kind: "project",
    openings: 1,
    source: "freed",
    workload: "5–7 ч/нед",
    format: "Гибрид · Томск",
    description:
      "Погружение в приёмную кампанию: интервью, User Story, концептуальная и физическая модели, API-контракты. Идеально для старта в аналитике.",
    responsibilities: ["Собирать требования и писать User Story", "Проектировать модели данных", "Описывать API в Swagger"],
    hardSkills: ["BPMN", "SQL", "REST", "Swagger"],
    softSkills: ["Структурное мышление", "Коммуникация"],
    tools: ["Miro", "Notion", "Postman"],
    niceToHave: ["Figma (чтение макетов)"],
    team: "PM + 2 Backend + Frontend + QA",
    mentor: "Екатерина Власова",
    postedAt: "3 дня назад",
    responses: 9,
  },
  {
    id: "v-qa-1",
    title: "Тестировщик (Manual QA)",
    spec: "Тестирование",
    projectId: "p-schedule",
    projectName: "ИИ-ассистент расписания ИШИТР",
    projectType: "new",
    commercial: true,
    grade: "Intern",
    kind: "project",
    openings: 2,
    source: "new",
    workload: "4–6 ч/нед",
    format: "Удалённо + встречи",
    description:
      "Тестирование Telegram-бота и виджета расписания: тест-планы, тест-кейсы, баг-репорты. Наставник научит приоритизации и работе с макетами.",
    responsibilities: ["Составлять тест-планы и тест-кейсы", "Сверять с макетом", "Оформлять баг-репорты"],
    hardSkills: ["Тест-кейсы", "Баг-репорты", "Postman"],
    softSkills: ["Внимательность", "Усидчивость"],
    tools: ["TestRail (демо)", "Figma", "Telegram"],
    niceToHave: ["SQL (базово)", "Charles"],
    team: "Tech Lead + Backend + Frontend",
    mentor: "Михаил Громов",
    postedAt: "5 часов назад",
    responses: 6,
  },
  {
    id: "v-design-1",
    title: "UI/UX-дизайнер (Figma)",
    spec: "UI/UX",
    projectId: "p-rooms",
    projectName: "Бронирование аудиторий ЦЭУ",
    projectType: "new",
    commercial: false,
    grade: "Junior",
    kind: "project",
    openings: 1,
    source: "freed",
    workload: "6 ч/нед",
    format: "Гибрид · Томск",
    description:
      "Проектирование сетки бронирования: wireframes, UI-kit, адаптивные макеты, прототипирование. Демонстрации заказчику каждую неделю.",
    responsibilities: ["Вести UI-kit", "Проектировать wireframes и макеты", "Готовить прототипы"],
    hardSkills: ["Figma", "UI-kit", "Прототипирование"],
    softSkills: ["Насмотренность", "Коммуникация"],
    tools: ["FigJam", "Miro"],
    niceToHave: ["Основы HTML/CSS"],
    team: "PM + 2 Backend + Frontend",
    mentor: "Екатерина Власова",
    postedAt: "1 неделю назад",
    responses: 11,
  },
  {
    id: "v-pm-1",
    title: "Менеджер проекта (PM-стажёр)",
    spec: "PM",
    projectId: "p-schedule",
    projectName: "ИИ-ассистент расписания ИШИТР",
    projectType: "new",
    commercial: true,
    grade: "Junior",
    kind: "project",
    openings: 1,
    source: "new",
    workload: "6–8 ч/нед",
    format: "Гибрид · Томск",
    description:
      "Помощь наставнику: планирование спринтов, дейли, статусы для СГ, контроль дедлайнов. Быстрый рост до самостоятельного PM.",
    responsibilities: ["Вести бэклог и спринты", "Проводить дейли", "Готовить статусы заказчику"],
    hardSkills: ["Scrum", "Декомпозиция", "Notion"],
    softSkills: ["Лидерство", "Ответственность"],
    tools: ["Jira/Tracker", "Miro"],
    niceToHave: ["BPMN"],
    team: "Команда 5 человек",
    mentor: "Сергей Георгиевич",
    postedAt: "4 дня назад",
    responses: 7,
  },
  {
    id: "v-front-2",
    title: "Frontend-разработчик (React) — Кабинет абитуриента",
    spec: "Frontend",
    projectId: "p-abit",
    projectName: "Личный кабинет абитуриента ТПУ",
    projectType: "existing",
    commercial: false,
    grade: "Junior",
    kind: "project",
    openings: 1,
    source: "new",
    workload: "6–8 ч/нед",
    format: "Гибрид · Томск",
    description:
      "Развитие пилота: конкурсные списки, уведомления, чат. Код-ревью от гильдийцев, релизы каждые 2 недели.",
    responsibilities: ["Развивать существующие экраны", "Оптимизировать производительность", "Покрывать e2e-дымами"],
    hardSkills: ["React", "Next.js", "TypeScript"],
    softSkills: ["Самостоятельность"],
    tools: ["Git", "Figma", "Sentry"],
    niceToHave: ["Playwright"],
    team: "PM + Backend + QA",
    mentor: "Дмитрий Орлов",
    postedAt: "6 дней назад",
    responses: 14,
  },
  {
    id: "v-backend-2",
    title: "Backend-разработчик — Бронирование аудиторий",
    spec: "Backend",
    projectId: "p-rooms",
    projectName: "Бронирование аудиторий ЦЭУ",
    projectType: "new",
    commercial: false,
    grade: "Intern",
    kind: "project",
    openings: 2,
    source: "new",
    workload: "4–6 ч/нед",
    format: "Гибрид · Томск",
    description:
      "Модуль заявок и согласований: статусы, уведомления, QR-подтверждение. Отличный первый проект — быстрый видимый результат.",
    responsibilities: ["CRUD заявок", "Статус-машина согласований", "Интеграция уведомлений"],
    hardSkills: ["Java", "Spring Boot", "PostgreSQL"],
    softSkills: ["Дисциплина"],
    tools: ["Swagger", "Postman"],
    niceToHave: ["Docker"],
    team: "PM + Frontend + Аналитик",
    mentor: "Михаил Громов",
    postedAt: "2 недели назад",
    responses: 10,
  },
  {
    id: "v-org-mentor",
    title: "Наставник проекта (PM, Middle)",
    spec: "PM",
    projectId: "p-guild",
    projectName: "Орг. отдел · Портфель ЦЭУ",
    projectType: "existing",
    commercial: true,
    grade: "Middle",
    kind: "org",
    dept: "Коммерческие проекты · Сергей Георгиевич",
    openings: 1,
    source: "manual",
    workload: "10–12 ч/нед",
    format: "Офис ЦЭУ + гибрид",
    description:
      "Оплачиваемая позиция для гильдийца: самостоятельное ведение команды из 4–6 человек, спринты, оценка студентов и отчётность перед орг. отделом. Кандидатов утверждает директор ЦЭУ.",
    responsibilities: [
      "Вести 1–2 команды: планирование, дейли, ретро",
      "Оценивать студентов по рубрике каждого спринта",
      "Отправлять краткие отчёты в орг. отдел (СГ)",
      "Управлять вакансиями и составом команды",
    ],
    hardSkills: ["Scrum", "Декомпозиция", "Notion", "BPMN"],
    softSkills: ["Лидерство", "Ответственность", "Обратная связь"],
    tools: ["Jira/Tracker", "Miro", "Notion"],
    niceToHave: ["Опыт менторства 1–2 стажёров"],
    team: "Подчинение: орг. отдел ЦЭУ",
    mentor: "Сергей Георгиевич",
    postedAt: "3 дня назад",
    responses: 4,
  },
  {
    id: "v-org-tech",
    title: "Технаставник направления Frontend (Senior)",
    spec: "Frontend",
    projectId: "p-guild",
    projectName: "Орг. отдел · Направление Frontend",
    projectType: "existing",
    commercial: true,
    grade: "Senior",
    kind: "org",
    dept: "База знаний и грейды · Владимир Игоревич",
    openings: 1,
    source: "manual",
    workload: "12 ч/нед",
    format: "Гибрид · Томск",
    description:
      "Оплачиваемая кросс-проектная роль: глубокие ревью, сетка слотов собеседований, воркшопы и акселераторы, курирование базы знаний направления.",
    responsibilities: [
      "Проводить глубокие Code/Design Review",
      "Вести сетку слотов и выносить вердикты",
      "Публиковать гайды и вести мастер-классы",
      "Принимать заявки на 1-on-1 и акселератор",
    ],
    hardSkills: ["React", "Next.js", "TypeScript", "Архитектура"],
    softSkills: ["Менторство", "Code Review", "Коммуникация"],
    tools: ["Figma", "Sentry", "Git"],
    niceToHave: ["Опыт релизов в проде ТПУ"],
    team: "Направление Frontend · 9 человек",
    mentor: "Владимир Игоревич",
    postedAt: "1 день назад",
    responses: 6,
  },
];

export function seedSlots(): InterviewSlot[] {
  const times = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];
  const mentors = [
    { id: "u-tech", name: "Михаил Громов", direction: "Backend / QA" },
    { id: "u-mentor", name: "Екатерина Власова", direction: "Аналитика / PM / Дизайн" },
  ];
  const slots: InterviewSlot[] = [];
  let n = 0;
  for (let day = 1; day <= 5; day++) {
    for (const t of times.slice(0, 4)) {
      const m = mentors[n % 2];
      const booked = (day === 1 && (t === "10:00" || t === "11:00")) || (day === 2 && t === "14:00");
      slots.push({
        id: `slot-${day}-${t.replace(":", "")}-${n}`,
        date: d(day),
        time: t,
        mentorId: m.id,
        mentorName: m.name,
        direction: m.direction,
        format: "Онлайн · 30 мин",
        link: "https://meet.tpu.ru/guild-interview",
        status: booked ? "booked" : "free",
        bookedBy: booked ? "u-other" : undefined,
        bookedByName: booked ? "Другой кандидат" : undefined,
      });
      n++;
    }
  }
  return slots;
}

export const SEED_APPLICATIONS: Application[] = [
  {
    id: "app-1",
    vacancyId: "v-front-1",
    vacancyTitle: "Frontend-разработчик (React / Tailwind)",
    userId: "u-candidate",
    userName: "Иван Петров",
    telegram: "@ivan_petrov_tpu",
    roleWant: "Frontend-разработчик",
    motivation: "Хочу в реальный продукт вместо абстрактных лаб. Год пишу на React, готов к ревью и дейли.",
    status: "pending",
    createdAt: d(-2),
  },
];

export const SEED_TASKS: TaskItem[] = [
  { id: "t-1", projectId: "p-guild", title: "Сверстать виджет дейли-отчёта", description: "Форма из 3 вопросов + валидация + optimistic UI", status: "inprogress", assignee: "u-junior", assigneeName: "Дмитрий Орлов", priority: "high", spec: "Frontend", estimate: "6 ч", comments: 4 },
  { id: "t-2", projectId: "p-guild", title: "API бронирования слотов", description: "POST /slots/:id/book с блокировкой", status: "review", assignee: "u-intern", assigneeName: "Алина Соколова", priority: "high", spec: "Backend", estimate: "8 ч", comments: 7 },
  { id: "t-3", projectId: "p-guild", title: "Матрица прав RBAC", description: "CRUD-переключатели прав по ролям", status: "todo", assignee: "u-junior", assigneeName: "Дмитрий Орлов", priority: "medium", spec: "Frontend", estimate: "5 ч", comments: 2 },
  { id: "t-4", projectId: "p-guild", title: "Календарь мероприятий", description: "Месяц/неделя + фильтры edu/work", status: "todo", assignee: "u-junior", assigneeName: "Дмитрий Орлов", priority: "medium", spec: "Frontend", estimate: "8 ч", comments: 1 },
  { id: "t-5", projectId: "p-guild", title: "Эскалации: модалка и очередь", description: "3 типа, обязательные поля", status: "done", assignee: "u-intern", assigneeName: "Алина Соколова", priority: "low", spec: "Backend", estimate: "4 ч", comments: 3 },
  { id: "t-6", projectId: "p-abit", title: "Конкурсные списки: фильтры", description: "Фильтры по направлениям и баллам", status: "inprogress", assignee: "u-junior", assigneeName: "Дмитрий Орлов", priority: "high", spec: "Frontend", estimate: "6 ч", comments: 5 },
  { id: "t-7", projectId: "p-abit", title: "Интеграция уведомлений", description: "Email + Telegram о смене статуса", status: "todo", assignee: "u-intern", assigneeName: "Алина Соколова", priority: "medium", spec: "Backend", estimate: "7 ч", comments: 0 },
  { id: "t-8", projectId: "p-schedule", title: "Тест-план бота v2", description: "30 кейсов: расписание, переносы, edge", status: "review", assignee: "u-intern", assigneeName: "Алина Соколова", priority: "high", spec: "QA", estimate: "5 ч", comments: 6 },
  { id: "t-9", projectId: "p-rooms", title: "Сетка аудиторий (UI-kit)", description: "Компоненты слотов и статусов", status: "done", assignee: "u-junior", assigneeName: "Дмитрий Орлов", priority: "medium", spec: "UI/UX", estimate: "6 ч", comments: 2 },
  { id: "t-10", projectId: "p-rooms", title: "Статус-машина заявок", description: "Черновик → На согласовании → Одобрена", status: "inprogress", assignee: "u-intern", assigneeName: "Алина Соколова", priority: "high", spec: "Backend", estimate: "8 ч", comments: 3 },
];

interface Participant {
  userId: string;
  name: string;
  role: string;
  projectId: string;
  projectName: string;
  disc: number; // «дисциплина» для демо-генерации истории
}

export const PARTICIPANTS: Participant[] = [
  { userId: "u-intern", name: "Алина Соколова", role: "Студент", projectId: "p-guild", projectName: "Веб-платформа «Гильдия»", disc: 0.92 },
  { userId: "u-junior", name: "Дмитрий Орлов", role: "Гильдиец", projectId: "p-guild", projectName: "Веб-платформа «Гильдия»", disc: 0.97 },
  { userId: "u-tim", name: "Тимур Ахметов", role: "Студент", projectId: "p-guild", projectName: "Веб-платформа «Гильдия»", disc: 0.78 },
  { userId: "u-art", name: "Артём Беляев", role: "Гильдиец", projectId: "p-rooms", projectName: "Бронирование аудиторий ЦЭУ", disc: 0.88 },
  { userId: "u-sof", name: "София Лебедева", role: "Студент", projectId: "p-rooms", projectName: "Бронирование аудиторий ЦЭУ", disc: 0.5 },
  { userId: "u-mar", name: "Мария Ковалёва", role: "Студент", projectId: "p-schedule", projectName: "ИИ-ассистент расписания ИШИТР", disc: 0.82 },
  { userId: "u-nik", name: "Никита Фролов", role: "Гильдиец", projectId: "p-abit", projectName: "Личный кабинет абитуриента ТПУ", disc: 0.9 },
];

function rng(seed: number) {
  let st = seed;
  return () => {
    st = (st * 1664525 + 1013904223) % 4294967296;
    return st / 4294967296;
  };
}

const IDLE_SEED = ["Болезнь", "Сессия, экзамены или зачёты", "Учебная нагрузка: дедлайны в университете", "Ждал(а) ТЗ или ответа от наставника"];

const YEST = [
  "Закрыл задачу по спринту, выложил PR на ревью.",
  "Доработал форму и валидацию, поправил замечания ментора.",
  "Написал тесты на сервисный слой, обновил контракт API.",
  "Разобрал баги с демо, согласовал правки с наставником.",
  "Собрал макет экрана и отдал на ревью дизайн-лиду.",
  "Описал User Story и обновил словарь данных.",
];
const TODAYS = [
  "Беру следующую задачу из спринта, после обеда — ревью.",
  "Доделываю интеграцию, затем покрываю тестами.",
  "Готовлю демо для заказчика и обновляю документацию.",
  "Разбираю замечания по PR и пишу тест-кейсы.",
];
const BLOCKS = [
  "Нужен пример optimistic lock в нашем проекте.",
  "Жду ТЗ по QR-подтверждению от аналитика.",
  "Нет доступа к стенду, написал в поддержку ЦЭУ.",
];

function buildDailies(): DailyReport[] {
  const out: DailyReport[] = [];
  PARTICIPANTS.forEach((p, pi) => {
    const r = rng(101 + pi * 37);
    for (let back = 40; back >= 0; back--) {
      const day = d(-back);
      if (!isWeekday(day)) continue;
      const roll = r();
      const sub = r();
      const pick = (arr: string[]) => arr[Math.floor(r() * arr.length)];
      let kind: "ok" | "nothing" | "late" | "miss" = roll < p.disc ? "ok" : sub < 0.4 ? "nothing" : sub < 0.7 ? "late" : "miss";
      if (back === 0) kind = roll < p.disc ? "ok" : "miss"; // сегодня: либо уже сдал, либо ещё нет
      if (p.userId === "u-intern" && back === 0) kind = "ok";
      if (p.userId === "u-junior" && back === 0) kind = "ok";
      if (kind === "miss") continue;
      const next = back > 0 ? d(-back + 1) : day;
      const submittedDate = kind === "late" ? next : day;
      const hh = kind === "late" ? "15" : String(9 + Math.floor(r() * 2)).padStart(2, "0");
      const mm = String(Math.floor(r() * 50) + 5).padStart(2, "0");
      const blocker = r() < 0.12 ? pick(BLOCKS) : "Нет блокеров.";
      const idle = kind === "nothing";
      const blockerText = p.userId === "u-intern" && back === 0 ? "Нужен пример optimistic lock в нашем проекте." : blocker;
      const hasBlock = !blockerText.toLowerCase().includes("нет");
      out.push({
        id: `dl-${p.userId}-${day}`,
        projectId: p.projectId,
        projectName: p.projectName,
        userId: p.userId,
        userName: p.name,
        userRole: p.role,
        date: day,
        yesterday: idle ? "Ничего не делал(а) — " + IDLE_SEED[Math.floor(r() * IDLE_SEED.length)].toLowerCase() + "." : p.userId === "u-intern" && back === 0 ? "Дописала POST /slots/book, добавила валидацию двойной брони." : pick(YEST),
        today: pick(TODAYS),
        blockers: blockerText,
        submittedAt: `${submittedDate}T${hh}:${mm}`,
        score: kind === "ok" ? 1 : 0.5,
        mode: idle ? "idle" : "work",
        reason: idle ? IDLE_SEED[Math.floor(r() * IDLE_SEED.length)] : undefined,
        mood: hasBlock ? "blocked" : r() < 0.18 ? "risk" : "good",
        hours: idle ? 0 : [1, 2, 2, 3, 3, 4][Math.floor(r() * 6)],
      });
    }
  });
  return out;
}

export const SEED_DAILIES: DailyReport[] = buildDailies();

function buildSprints(): Sprint[] {
  const mon0 = mondayOf(todayISO());
  const t = todayISO();
  const mk = (
    projectId: string, number: number, weeksFromNow: number, mode: "single" | "split",
    w1s: string, w1f: string, w2s: string, w2f: string, goals: string[], summary: string, adminRating?: number, adminComment?: string
  ): Sprint => {
    const startDate = addDays(mon0, weeksFromNow * 7);
    return { id: `sp-${projectId}-${number}`, projectId, number, title: `Спринт ${number}`, startDate, mode, week1Stage: w1s, week1Focus: w1f, week2Stage: w2s, week2Focus: w2f, goals, status: sprintStatusByDate({ startDate }, t), summary, adminRating, adminComment };
  };
  return [
    mk("p-guild", 10, -5, "single", "Инициация", "Требования, UI-kit, архитектура и выбор стека", "Инициация", "Требования, UI-kit, архитектура и выбор стека", ["Утвердить PRD", "UI-kit в Figma", "Выбрать стек"], "PRD утверждён директором ЦЭУ, UI-kit готов, стек зафиксирован.", 5, "Отличный старт: цели и критерии приёмки понятны."),
    mk("p-guild", 11, -3, "split", "Проектирование", "API-контракт и схема БД", "Ядро платформы", "Слоты, заявки, RBAC-матрица", ["OpenAPI v1", "Схема БД", "Каркас API"], "Контракт согласован с фронтом, каркас API поднят.", 4, "Хороший темп, но ретро провели с опозданием."),
    mk("p-guild", 12, -1, "split", "Ядро платформы", "Оптимистичная бронь слотов", "Кабинеты и роадмапы", "Дейли-календарь, канбан ревью", ["Бронь слотов", "Дейли с баллами", "Канбан ревью"], ""),
    mk("p-guild", 13, 1, "single", "Кабинеты и роадмапы", "Лидерборд и планирование спринтов", "Кабинеты и роадмапы", "Лидерборд и планирование спринтов", ["Лидерборд", "Дорожная карта"], ""),
    mk("p-guild", 14, 3, "single", "Тестирование и релиз", "Регресс, нагрузка, приёмка MVP", "Тестирование и релиз", "Регресс, нагрузка, приёмка MVP", ["Регресс", "Приёмка MVP"], ""),
    mk("p-abit", 5, -3, "single", "Проектирование", "ТЗ дизайнеру, концептуальная модель", "Проектирование", "ТЗ дизайнеру, концептуальная модель", ["ТЗ ч.1", "Модель данных"], "ТЗ и модель согласованы с приёмной комиссией.", 4, "Аналитика сильная, дизайнерам хватило ТЗ."),
    mk("p-abit", 6, -1, "split", "Проектирование", "API-контракт ч.1", "Разработка", "Конкурсные списки: фильтры", ["API ч.1", "Фильтры списков"], ""),
    mk("p-abit", 7, 1, "single", "Разработка", "Уведомления и интеграция с 1С", "Разработка", "Уведомления и интеграция с 1С", ["Уведомления", "Интеграция 1С"], ""),
    mk("p-schedule", 1, -3, "single", "Инициация", "Данные расписания, RAG-прототип", "Инициация", "Данные расписания, RAG-прототип", ["Прототип RAG"], "Прототип отвечает на 70% вопросов.", 4, "Хороший прототип."),
    mk("p-schedule", 2, -1, "split", "Проектирование", "Тест-план бота v2", "Разработка", "Рассылки об изменениях", ["Тест-план", "Рассылки"], ""),
    mk("p-schedule", 3, 1, "single", "Тестирование", "Пилот в 3 группах", "Тестирование", "Пилот в 3 группах", ["Пилот"], ""),
    mk("p-rooms", 3, -5, "single", "Разработка", "Сетка аудиторий и статус-машина", "Разработка", "Сетка аудиторий и статус-машина", ["Сетка", "Статусы заявок"], "Сетка и статусы реализованы.", 5, "MVP-ядро собрано быстро."),
    mk("p-rooms", 4, -3, "split", "Разработка", "Уведомления диспетчеру", "Тестирование", "Регресс заявок", ["Уведомления", "Регресс"], "Регресс пройден с 2 замечаниями.", 4, ""),
    mk("p-rooms", 5, -1, "single", "Тестирование", "Приёмка MVP заказчиком", "Тестирование", "Приёмка MVP заказчиком", ["Демо", "Приёмка"], ""),
    mk("p-rooms", 6, 1, "single", "Релиз", "Пилот в корпусе №10", "Релиз", "Пилот в корпусе №10", ["Пилот"], ""),
  ];
}

export const SEED_SPRINTS: Sprint[] = buildSprints();

const GRADE_COMMENTS = [
  "Стабильно закрывает задачи, сама поднимает вопросы на дейли.",
  "Хороший прогресс, стоит чаще брать инициативу в ревью.",
  "Быстро учится: за спринт освоил новый инструмент.",
  "Нужно планировать задачи на неделю вперёд, без дедлайнов в последний день.",
];
const ORG_REPORTS = [
  "Готов к расширению зоны ответственности.",
  "Результат в рамках ожиданий, рисков нет.",
  "Рекомендуется к рассмотрению на повышение грейда.",
  "Нужен мониторинг дисциплины по дейли.",
];

function buildGrades(): SprintGrade[] {
  const out: SprintGrade[] = [];
  const sprints = SEED_SPRINTS;
  PARTICIPANTS.forEach((p, pi) => {
    const r = rng(777 + pi * 13);
    sprints
      .filter((sp) => sp.projectId === p.projectId && sp.status === "done")
      .forEach((sp) => {
        const base = 2.2 + p.disc * 2.8;
        const v = () => Math.max(1, Math.min(5, Math.round(base + (r() - 0.5) * 1.6)));
        out.push({
          id: `g-${p.userId}-${sp.id}`,
          projectId: p.projectId,
          projectName: p.projectName,
          sprint: sp.title,
          userId: p.userId,
          userName: p.name,
          activity: v(),
          execution: v(),
          selforg: v(),
          learning: v(),
          comment: GRADE_COMMENTS[Math.floor(r() * GRADE_COMMENTS.length)],
          reportToOrg: ORG_REPORTS[Math.floor(r() * ORG_REPORTS.length)],
          createdAt: "по итогам спринта",
        });
      });
  });
  return out;
}

export const SEED_GRADES: SprintGrade[] = buildGrades();

export { DEFAULT_STAGES };

export const SEED_ARTICLES: KBArticle[] = [
  {
    id: "a-spring",
    kind: "article",
    level: "Средний",
    title: "Spring Boot в проектах Гильдии: структура, слои и типовые ошибки",
    category: "Backend (Java/Spring)",
    tags: ["Spring Boot", "Архитектура", "JPA"],
    authorId: "u-tech",
    authorName: "Михаил Громов",
    authorRole: "Технаставник",
    readingTime: "12 мин",
    excerpt: "Как мы раскладываем контроллеры, сервисы и репозитории. Почему нельзя тащить Entity в API и как оформлять миграции.",
    content: "## Зачем единый скелет\n\nВсе проекты Гильдии стартуют из одного стартера: controller → service → repository, DTO на границе, маппинг в мапперах.\n\n## Слои\n\n**Controller** — только валидация и вызов сервиса. Никакой бизнес-логики.\n\n**Service** — транзакции, проверки прав, оркестрация.\n\n**Repository** — запросы, оптимизация N+1 через EntityGraph.\n\n## Типовые ошибки\n\n1. Возврат Entity наружу — ломается контракт при рефакторинге.\n2. Логика в контроллере — невозможно переиспользовать.\n3. Отсутствие тестов на граничные переходы статусов.\n\n## Чек-лист PR\n\n- OpenAPI обновлён\n- Миграция Liquibase приложена\n- Unit-тесты на сервис\n- Дейли-отчёт заполнен",
    status: "published",
    createdAt: "12 сентября 2026",
    likes: 48,
    views: 312,
  },
  {
    id: "a-react",
    kind: "article",
    level: "Начальный",
    title: "React + Tailwind: дизайн-система Гильдии за 30 минут",
    category: "Frontend (React/Tailwind)",
    tags: ["React", "Tailwind", "UI-kit"],
    authorId: "u-junior",
    authorName: "Дмитрий Орлов",
    authorRole: "Гильдиец",
    readingTime: "8 мин",
    excerpt: "Токены, компоненты Badge/Card/Modal, адаптив. Как не плодить 40 оттенков серого.",
    content: "## Токены\n\nЦвета: emerald/indigo акценты, slate фон. Радиусы 12–16px, тени мягкие.\n\n## Компоненты\n\nПереиспользуй Badge, Card, Modal из общей папки. Не создавай новые кнопки — кастомизируй пропсами.\n\n## Адаптив\n\nMobile-first: сначала колонка, потом grid md:. Проверяй на 360px.\n\n## Ошибки\n\n- Инлайн-стили вместо классов\n- Жёсткие px-ширины\n- Отсутствие empty/loading состояний",
    status: "published",
    createdAt: "28 сентября 2026",
    likes: 36,
    views: 240,
  },
  {
    id: "a-analyst",
    kind: "article",
    level: "Средний",
    title: "От PRD до ТЗ разработчикам: маршрут аналитика",
    category: "Системный анализ",
    tags: ["PRD", "User Story", "API Contract"],
    authorId: "u-mentor",
    authorName: "Екатерина Власова",
    authorRole: "Наставник",
    readingTime: "15 мин",
    excerpt: "4 этапа: погружение, UX и концептуальное моделирование, детальное проектирование, сборка и передача.",
    content: "## Этап 1. Погружение\n\nИзучение PRD → интервью → предметная область. Артефакт: User Story / Use Case.\n\n## Этап 2. UX и концептуальное моделирование\n\nВетка А: ТЗ дизайнеру ч.1 → brainstorming. Ветка Б: декомпозиция на сервисы → концептуальная модель → интеграции.\n\n## Этап 3. Детальное проектирование\n\nТЗ дизайнеру ч.2, физическая модель, словарь данных, API Contract ч.1.\n\n## Этап 4. Сборка\n\nМакет + ТЗ разработчикам + API Contract ч.2. Критерий готовности: разработчик берёт задачу без вопросов.",
    status: "published",
    createdAt: "5 октября 2026",
    likes: 52,
    views: 401,
  },
  {
    id: "a-qa",
    kind: "article",
    level: "Начальный",
    title: "Тест-план, тест-кейсы и баг-репорты: стандарт QA Гильдии",
    category: "QA/Тестирование",
    tags: ["Тест-план", "Postman", "Баг-репорт"],
    authorId: "u-tech",
    authorName: "Михаил Громов",
    authorRole: "Технаставник",
    readingTime: "10 мин",
    excerpt: "Приоритезация, сверка с макетом, идеальный баг-репорт с шагами и логами.",
    content: "## Тест-план\n\nОбласть, риски, приоритеты. Сначала критический путь: бронь, оплата, уведомления.\n\n## Тест-кейсы\n\nФормат: предусловие → шаги → ожидаемый результат. Сверяй с макетом попиксельно.\n\n## Баг-репорт\n\nЗаголовок: [Модуль] Что сломалось. Внутри: окружение, шаги, факт/ожидание, логи, скрин.\n\n## Частые ошибки\n\n- Один кейс на всё\n- Нет приоритета\n- Баг без шагов воспроизведения",
    status: "published",
    createdAt: "9 октября 2026",
    likes: 29,
    views: 187,
  },
  {
    id: "a-figma",
    kind: "article",
    level: "Начальный",
    title: "UI-kit и wireframes: как дизайнеру не утонуть в правках",
    category: "UI/UX (Figma)",
    tags: ["Figma", "UI-kit", "Wireframe"],
    authorId: "u-mentor",
    authorName: "Екатерина Власова",
    authorRole: "Наставник",
    readingTime: "9 мин",
    excerpt: "UI-kit → wireframe → макет → демо заказчику → прототип под устройства. Цикл правок без боли.",
    content: "## UI-kit first\n\nСначала токены и компоненты, потом экраны. Иначе редизайн всего после первого демо.\n\n## Wireframe + brainstorming\n\nКаркас согласуй с аналитиком до красоты. Дешёвые правки — на каркасе.\n\n## Демо\n\nГотовь 3 сценария, фиксируй решения. Правки — отдельным списком, не в чате.\n\n## Прототипы\n\nDesktop → планшет → 360px. Интерактивный прототип обязателен для сложных флоу.",
    status: "published",
    createdAt: "14 октября 2026",
    likes: 33,
    views: 205,
  },
  {
    id: "a-reglament",
    kind: "article",
    level: "Начальный",
    title: "Регламент Гильдии: дейли, ретро, эскалации и грейды",
    category: "Регламенты Гильдии",
    tags: ["Регламент", "Дейли", "Грейды"],
    authorId: "u-vi",
    authorName: "Владимир Игоревич",
    authorRole: "Орг. отдел",
    readingTime: "7 мин",
    excerpt: "3 вопроса дейли, когда звать ретро, лестница эскалаций и критерии Intern → Junior → Tech Mentor.",
    content: "## Дейли\n\nКаждый день: что сделал вчера / сделаю сегодня / блокеры. Блокер старше 24ч — эскалация.\n\n## Эскалации\n\nТехническая → технаставник. Организационная → наставник → СГ. HR/конфликт → орг. отдел.\n\n## Грейды\n\nIntern → Junior: 1–3 проекта, нет срывов, дейли каждый день, рекомендация ментора.\n\nJunior → Tech Mentor: глубокие ревью, воркшопы, ведение направления.",
    status: "published",
    createdAt: "18 октября 2026",
    likes: 61,
    views: 520,
  },
  {
    id: "a-faq",
    kind: "article",
    level: "Начальный",
    title: "Разбор типовых ошибок: 10 причин вернуть PR на доработку",
    category: "Разбор типовых ошибок (FAQ)",
    tags: ["Code Review", "PR", "FAQ"],
    authorId: "u-tech",
    authorName: "Михаил Громов",
    authorRole: "Технаставник",
    readingTime: "6 мин",
    excerpt: "Отсутствие тестов, магия в коде, гигантские PR на 800 строк. Как пройти ревью с первого раза.",
    content: "## Топ-10\n\n1. PR на 800 строк без описания\n2. Нет тестов\n3. Закомментированный код\n4. Магические числа\n5. N+1 запросы\n6. Секреты в коде\n7. Нет обработки ошибок\n8. Ломается контракт API\n9. Нет скрина для UI\n10. Не заполнен чек-лист\n\n## Правило\n\nМаленькие PR, понятное описание, зелёные тесты — и ревью за час.",
    status: "published",
    createdAt: "20 октября 2026",
    likes: 44,
    views: 298,
  },
  {
    id: "m-video-spring",
    kind: "video",
    level: "Средний",
    title: "Запись воркшопа: Spring Boot — REST и JPA без боли",
    category: "Backend (Java/Spring)",
    tags: ["Spring Boot", "JPA", "Воркшоп"],
    authorId: "u-tech",
    authorName: "Михаил Громов",
    authorRole: "Технаставник",
    speaker: "Михаил Громов",
    readingTime: "1 ч 32 мин",
    duration: "1:32:00",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    chapters: [
      { t: 0, label: "Вступление: как устроен стартер Гильдии" },
      { t: 540, label: "Controller → Service → Repository" },
      { t: 1500, label: "DTO и мапперы: почему не отдаём Entity" },
      { t: 2700, label: "Миграции Liquibase и профили" },
      { t: 3900, label: "Тесты на сервисный слой" },
      { t: 5100, label: "Разбор вопросов студентов" },
    ],
    excerpt: "Полная запись воркшопа: структура сервиса, JPA без N+1, миграции и тесты. Практика на коде проекта «Бронирование аудиторий».",
    content: "Воркшоп для стажёров и гильдийцев направления Backend.\n\n**Что разберём:** структуру сервиса, транзакции, DTO, миграции, unit-тесты.\n\n**Материалы:** репозиторий-стартер и чек-лист PR — в статье «Spring Boot в проектах Гильдии».",
    status: "published",
    createdAt: "12 октября 2026",
    likes: 57,
    views: 428,
  },
  {
    id: "m-video-figma",
    kind: "video",
    level: "Начальный",
    title: "Мастер-класс: UI-kit в Figma за 45 минут",
    category: "UI/UX (Figma)",
    tags: ["Figma", "UI-kit", "Автолейаут"],
    authorId: "u-mentor",
    authorName: "Екатерина Власова",
    authorRole: "Наставник",
    speaker: "Приглашённый дизайнер ЦЭУ",
    readingTime: "45 мин",
    duration: "45:10",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    chapters: [
      { t: 0, label: "Токены: цвет, типографика, радиусы" },
      { t: 480, label: "Компоненты и варианты" },
      { t: 1260, label: "Автолейаут на примере сетки бронирования" },
      { t: 2100, label: "Передача макета разработчикам" },
    ],
    excerpt: "Собираем UI-kit с нуля: токены, компоненты, автолейаут. Итог — сетка бронирования аудиторий.",
    content: "Мастер-класс для дизайнеров и фронтендеров.\n\nФайл Figma с результатом выдаётся участникам на встрече.",
    status: "published",
    createdAt: "16 октября 2026",
    likes: 41,
    views: 233,
  },
  {
    id: "m-video-bug",
    kind: "video",
    level: "Начальный",
    title: "Идеальный баг-репорт: разбор на живых примерах",
    category: "QA/Тестирование",
    tags: ["Баг-репорт", "QA", "Postman"],
    authorId: "u-tech",
    authorName: "Михаил Громов",
    authorRole: "Технаставник",
    speaker: "Михаил Громов",
    readingTime: "28 мин",
    duration: "28:40",
    videoUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
    chapters: [
      { t: 0, label: "Анатомия баг-репорта" },
      { t: 420, label: "Шаги воспроизведения и логи" },
      { t: 960, label: "Приоритет и серьёзность" },
      { t: 1380, label: "Разбор репортов из проекта расписания" },
    ],
    excerpt: "Что отличает репорт, который чинят за час, от репорта, который возвращают с вопросами.",
    content: "Короткий практикум для QA-стажёров. К видео прилагается шаблон баг-репорта в базе знаний.",
    status: "published",
    createdAt: "19 октября 2026",
    likes: 38,
    views: 191,
  },
  {
    id: "m-pres-arch",
    kind: "presentation",
    level: "Средний",
    title: "Архитектура платформы «Гильдия»: слои, интеграции, безопасность",
    category: "Архитектура",
    tags: ["Архитектура", "Интеграции", "Безопасность"],
    authorId: "u-admin",
    authorName: "Ковынев Алексей Николаевич",
    authorRole: "Архитектор ЦЭУ",
    speaker: "Ковынев Алексей Николаевич",
    readingTime: "8 слайдов",
    excerpt: "Лекция директора ЦЭУ: как устроено ядро платформы, где проходят границы сервисов и как мы закрываем вопросы безопасности.",
    content: "Презентация к лекции «Архитектура платформы». Слайды можно листать стрелками клавиатуры.",
    slides: [
      { title: "Архитектура платформы «Гильдия»", bullets: ["ЦЭУ ТПУ · лекция для гильдийцев и технаставников", "Цель: единая картина системы и границ ответственности"], note: "Начинаем с общей карты: зачем платформа и для кого." },
      { title: "Контекст и пользователи", bullets: ["7 ролей: от гостя до администратора", "Кандидаты, студенты, гильдийцы, наставники, технаставники", "Орг. отдел: онбординг, коммерция, база знаний"], note: "Роли определяют права — RBAC-матрица управляется админом." },
      { title: "Слои системы", bullets: ["Клиент: Next.js + Tailwind", "API: Spring Boot, OpenAPI-контракт", "Данные: PostgreSQL, миграции Liquibase", "Интеграции: SSO ТПУ, Telegram, 1С"] },
      { title: "Границы сервисов", bullets: ["Рекрутинг: вакансии, слоты, заявки", "Проекты: спринты, дейли, ревью, эскалации", "Знания: статьи, видео, презентации", "Рейтинг: баллы дейли + оценки спринтов"] },
      { title: "Безопасность", bullets: ["SSO через аккаунт ТПУ", "Права проверяются на сервере, не только в UI", "Логи действий админа и смены грейдов"] },
      { title: "Данные и рейтинг", bullets: ["Дейли: 1 / 0,5 / 0 баллов", "Спринт: 4 критерия × 5 от наставника", "Итоговый процент и выгрузка в Excel за семестр"] },
      { title: "Дорожная карта платформы", bullets: ["Сейчас: ядро, кабинеты, лидерборд", "Дальше: интеграция с таск-трекером и SSO", "Затем: мобильное приложение и push-уведомления"] },
      { title: "Вопросы и обсуждение", bullets: ["Контакты: орг. отдел ЦЭУ, кабинет 415", "Приходите в команду платформы"] },
    ],
    status: "published",
    createdAt: "8 октября 2026",
    likes: 63,
    views: 512,
  },
  {
    id: "m-pres-onboard",
    kind: "presentation",
    level: "Начальный",
    title: "Онбординг в Гильдию: первые 30 дней студента",
    category: "Регламенты Гильдии",
    tags: ["Онбординг", "Регламент", "Грейды"],
    authorId: "u-so",
    authorName: "Семен Олегович",
    authorRole: "Орг. отдел",
    speaker: "Семен Олегович",
    readingTime: "7 слайдов",
    excerpt: "Что ждёт стажёра в первый месяц: знакомство с командой, роадмап, дейли и первая оценка.",
    content: "Презентация для новичков, прошедших собеседование.",
    slides: [
      { title: "Добро пожаловать в Гильдию!", bullets: ["Реальные проекты ТПУ вместо абстрактных лаб", "Менторство с первого дня"] },
      { title: "Неделя 1: знакомство", bullets: ["Встреча с наставником и командой", "Доступы: репозиторий, трекер, Figma", "Роадмап вашей специализации"] },
      { title: "Неделя 2: первые задачи", bullets: ["Простые задачи из спринта", "Первое ревью у гильдийца", "Дейли каждый будний день"] },
      { title: "Дейли: как набирать баллы", bullets: ["Вовремя — 1 балл", "«Ничего не делал» с причиной — 0,5", "Нет отчёта — 0"], note: "Опоздание тоже даёт 0,5 — лучше сдавать в тот же день." },
      { title: "Спринт и оценка", bullets: ["Спринт — 2 недели", "Наставник оценивает 4 критерия по шкале 0–5", "Итоговый процент идёт в лидерборд"] },
      { title: "Эскалации и помощь", bullets: ["Блокер старше суток — эскалация", "Техническая → технаставник", "Организационная → наставник, HR → орг. отдел"] },
      { title: "Путь до Гильдийца", bullets: ["1–3 проекта без срывов", "Рекомендация наставника", "Итоговый процент 80+"] },
    ],
    status: "published",
    createdAt: "2 октября 2026",
    likes: 72,
    views: 640,
  },
  {
    id: "m-pres-demo",
    kind: "presentation",
    level: "Средний",
    title: "Демо заказчику: как показывать MVP и собирать замечания",
    category: "Системный анализ",
    tags: ["Демо", "MVP", "Заказчик"],
    authorId: "u-mentor",
    authorName: "Екатерина Власова",
    authorRole: "Наставник",
    speaker: "Екатерина Власова",
    readingTime: "6 слайдов",
    excerpt: "Структура демо на 30 минут: сценарии, фиксация замечаний, договорённости по следующему спринту.",
    content: "Шаблон презентации для демо заказчику.",
    slides: [
      { title: "Демо заказчику: цель и формат", bullets: ["30 минут: 15 показ, 10 обсуждение, 5 договорённости", "Показываем сценарии, а не экраны"] },
      { title: "Подготовка", bullets: ["3 пользовательских сценария", "Стенд с тестовыми данными", "План на случай сбоя: записанный прогон"] },
      { title: "Ход встречи", bullets: ["Контекст: что изменилось с прошлого демо", "Сценарии по порядку", "Фиксация замечаний на ходу"] },
      { title: "Замечания", bullets: ["Отдельным списком, не в чате", "Каждое — с приоритетом и владельцем", "Согласовать, что войдёт в следующий спринт"] },
      { title: "После демо", bullets: ["Письмо с итогами в течение дня", "Обновить бэклог и дорожную карту", "Отчёт в орг. отдел"] },
      { title: "Чек-лист", bullets: ["Стенд проверен", "Роли распределены", "Замечания зафиксированы", "Следующая встреча назначена"] },
    ],
    status: "published",
    createdAt: "14 октября 2026",
    likes: 34,
    views: 187,
  },
];

export function seedEvents(): EventItem[] {
  return [
    { id: "e-1", title: "Лекция: Архитектура платформы «Гильдия»", description: "Ковынев А.Н. — как устроено ядро, интеграции и контуры безопасности ТПУ.", category: "edu", type: "Лекция", date: d(1), time: "16:00", duration: "1,5 ч", location: "Корпус №10, ауд. 314", link: "https://meet.tpu.ru/guild-arch", speaker: "Ковынев Алексей Николаевич", attendees: ["Все желающие"] },
    { id: "e-2", title: "Дейли · Веб-платформа «Гильдия»", description: "Синхрон команды: статусы, блокеры, план на день.", category: "work", type: "Дейли", date: d(1), time: "10:00", duration: "15 мин", location: "Онлайн", link: "https://meet.tpu.ru/guild-daily", projectId: "p-guild", projectName: "Веб-платформа «Гильдия»", speaker: "Екатерина Власова", attendees: ["Екатерина Власова", "Михаил Громов", "Дмитрий Орлов", "Алина Соколова"] },
    { id: "e-3", title: "Воркшоп: Spring Boot — REST и JPA без боли", description: "Практика от Михаила Громова: контроллеры, DTO, миграции, тесты.", category: "edu", type: "Воркшоп", date: d(2), time: "17:00", duration: "2 ч", location: "Коворкинг ЦЭУ", link: "https://meet.tpu.ru/spring-ws", speaker: "Михаил Громов", attendees: ["Backend-направление"] },
    { id: "e-4", title: "Ретро · Кабинет абитуриента", description: "Что получилось, что чиним в следующем спринте.", category: "work", type: "Ретро", date: d(2), time: "12:00", duration: "1 ч", location: "Онлайн", link: "https://meet.tpu.ru/abit-retro", projectId: "p-abit", projectName: "Личный кабинет абитуриента ТПУ", speaker: "Екатерина Власова", attendees: ["Команда проекта"] },
    { id: "e-5", title: "Мастер-класс: Figma UI-kit", description: "Токены, автолейаут, компоненты. Разбираем сетку бронирования.", category: "edu", type: "Мастер-класс", date: d(3), time: "16:30", duration: "1,5 ч", location: "Корпус №10, ауд. 201", link: "https://meet.tpu.ru/figma-mk", speaker: "Приглашённый дизайнер ЦЭУ", attendees: ["Дизайн / Frontend"] },
    { id: "e-6", title: "Планирование спринта · ИИ-ассистент расписания", description: "Декомпозиция бэклога, оценка, распределение.", category: "work", type: "Планирование", date: d(3), time: "11:00", duration: "1 ч", location: "Онлайн", link: "https://meet.tpu.ru/sched-plan", projectId: "p-schedule", projectName: "ИИ-ассистент расписания ИШИТР", speaker: "Сергей Георгиевич", attendees: ["Команда проекта"] },
    { id: "e-7", title: "Семинар: Системный анализ — от PRD к API", description: "Разбор маршрута аналитика на примере кабинета абитуриента.", category: "edu", type: "Семинар", date: d(4), time: "15:00", duration: "1,5 ч", location: "Онлайн", link: "https://meet.tpu.ru/analyst", speaker: "Екатерина Власова", attendees: ["Аналитика / QA"] },
    { id: "e-8", title: "Демо заказчику · Бронирование аудиторий", description: "Показываем MVP диспетчеру ЦЭУ, фиксируем замечания.", category: "work", type: "Демо", date: d(5), time: "13:00", duration: "1 ч", location: "ЦЭУ, переговорная", link: "https://meet.tpu.ru/rooms-demo", projectId: "p-rooms", projectName: "Бронирование аудиторий ЦЭУ", speaker: "Екатерина Власова", attendees: ["Команда + заказчик"] },
    { id: "e-9", title: "Дейли · Бронирование аудиторий", description: "Синхрон перед демо.", category: "work", type: "Дейли", date: d(4), time: "10:00", duration: "15 мин", location: "Онлайн", link: "https://meet.tpu.ru/rooms-daily", projectId: "p-abit", projectName: "Бронирование аудиторий ЦЭУ", speaker: "Екатерина Власова", attendees: ["Команда проекта"] },
  ];
}

export const SEED_ESCALATIONS: Escalation[] = [
  { id: "esc-1", projectId: "p-guild", projectName: "Веб-платформа «Гильдия»", type: "tech", title: "Гонка при брони слотов", description: "Два кандидата одновременно бронируют один слот, второй получает 500 вместо понятной ошибки.", steps: "1. Открыть один слот в двух вкладках\n2. Нажать «Подтвердить» одновременно\n3. Наблюдать 500", links: "Логи: tracker.tpu.ru/guild/LOG-142", authorName: "Алина Соколова", status: "inwork", createdAt: d(-1) },
];

export const SEED_REQUESTS: ConsultRequest[] = [
  { id: "r-1", type: "codereview", title: "Ревью PR: API бронирования слотов", description: "Алина Соколова · Backend · нужен разбор optimistic lock и тестов.", requesterName: "Алина Соколова", requesterSpec: "Backend", status: "new", createdAt: d(0) },
  { id: "r-2", type: "oneonone", title: "1-on-1: план роста до Junior", description: "Иван Петров · Frontend · что дотянуть перед проектом.", requesterName: "Иван Петров", requesterSpec: "Frontend", status: "new", createdAt: d(0) },
  { id: "r-3", type: "workshop", title: "Воркшоп по Postman для QA", description: "Группа QA · коллекции, окружения, автотесты.", requesterName: "QA-направление", requesterSpec: "QA", status: "accepted", createdAt: d(-1) },
  { id: "r-4", type: "accelerator", title: "Акселератор: подготовка питча", description: "Команда расписания · прогон демо перед заказчиком.", requesterName: "Команда расписания", requesterSpec: "PM", status: "new", createdAt: d(-1) },
];

export const SKILL_GROUPS: { title: string; skills: string[] }[] = [
  { title: "Hard Skills (Dev / Design)", skills: ["Java", "Spring Boot", "PostgreSQL", "React", "Next.js", "TypeScript", "Tailwind CSS", "Figma", "UI-kit", "Docker", "Git", "Zustand", "Python"] },
  { title: "Аналитика и тестирование", skills: ["BPMN", "SQL", "REST", "Swagger", "User Story", "Тест-кейсы", "Баг-репорты", "Postman", "Miro", "Notion", "Scrum", "Декомпозиция"] },
  { title: "Soft Skills", skills: ["Коммуникация", "Ответственность", "Дисциплина", "Внимательность", "Менторство", "Code Review", "Лидерство", "Обратная связь", "Самостоятельность", "Умение задавать вопросы"] },
];

export function calcMatch(userSkills: string[], vacancy: Vacancy): number {
  const need = [...vacancy.hardSkills, ...vacancy.tools].map((s) => s.toLowerCase());
  const have = userSkills.map((s) => s.toLowerCase());
  if (!need.length) return 50;
  let score = 0;
  for (const n of need) {
    if (have.some((h) => h.includes(n) || n.includes(h))) score += 1;
    else if (have.some((h) => h.split(" ")[0] === n.split(" ")[0])) score += 0.5;
  }
  const softBonus = vacancy.softSkills.some((s) => have.includes(s.toLowerCase())) ? 6 : 0;
  const pct = Math.round((score / need.length) * 88 + softBonus + 6);
  return Math.max(12, Math.min(98, pct));
}
