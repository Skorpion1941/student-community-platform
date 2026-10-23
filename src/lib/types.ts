export type RoleId =
  | "guest"
  | "candidate"
  | "intern"
  | "junior"
  | "mentor"
  | "techmentor"
  | "admin";

export type SpecId =
  | "Backend"
  | "Frontend"
  | "Аналитика"
  | "Тестирование"
  | "UI/UX"
  | "PM"
  | "DevOps";

export interface RoleMeta {
  id: RoleId;
  label: string;
  short: string;
  grade: string;
  description: string;
  color: string;
  bg: string;
  icon: string;
  level: number;
}

export interface DemoUser {
  id: string;
  name: string;
  role: RoleId;
  spec: string;
  initials: string;
  color: string;
  bio: string;
  experience: string;
  github: string;
  telegram: string;
  figma: string;
  portfolio: string;
  skills: string[];
  grade: string;
  projectsCount: number;
  tasksClosed: number;
  rating: number;
  institute: string;
  course: string;
  status?: "active" | "paused" | "alumni";
  note?: string;
  hoursPerWeek?: number;
}

export type VacancyKind = "project" | "org";

export interface Vacancy {
  id: string;
  title: string;
  spec: SpecId;
  projectId: string;
  projectName: string;
  projectType: "new" | "existing";
  commercial: boolean;
  grade: string;
  kind: VacancyKind;
  dept?: string;
  openings: number;
  source: "freed" | "new" | "manual";
  freedFrom?: string;
  workload: string;
  format: string;
  description: string;
  responsibilities: string[];
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
  niceToHave: string[];
  team: string;
  mentor: string;
  postedAt: string;
  responses: number;
}

export interface InterviewSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // "10:00"
  mentorId: string;
  mentorName: string;
  direction: string;
  format: string;
  link: string;
  status: "free" | "booked";
  bookedBy?: string;
  bookedByName?: string;
  vacancyId?: string;
}

export interface Application {
  id: string;
  vacancyId: string;
  vacancyTitle: string;
  userId: string;
  userName: string;
  telegram: string;
  roleWant: string;
  motivation: string;
  slotId?: string;
  status: "draft" | "booked" | "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
  verdict?: string;
}

export interface TeamMember {
  userId: string;
  name: string;
  role: string;
  spec: string;
}

export interface Project {
  id: string;
  name: string;
  short: string;
  description: string;
  status: "Инициация" | "В разработке" | "Тестирование" | "MVP Готов" | "В релизе" | "Пилот" | "Масштабирование" | "Остановка";
  typeLabel: string;
  commercial: boolean;
  isNew: boolean;
  stack: string[];
  links: { github: string; tracker: string; figma: string };
  team: TeamMember[];
  progress: number;
  deadline: string;
  color: string;
  cover: string;
  goals: string[];
  stages?: string[];
}

export interface TaskItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "todo" | "inprogress" | "review" | "done";
  assignee: string;
  assigneeName: string;
  priority: "low" | "medium" | "high";
  spec: string;
  estimate: string;
  comments: number;
}

export interface DailyReport {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  userRole: string;
  date: string;
  yesterday: string;
  today: string;
  blockers: string;
  submittedAt: string;
  score: number; // 1 = вовремя, 0.5 = «ничего не делал» / с опозданием
  mode?: "work" | "idle"; // work — есть о чём написать, idle — ничего не делал (с причиной)
  reason?: string;
  mood?: "good" | "risk" | "blocked";
  hours?: number;
  link?: string;
}

export type KBKind = "article" | "video" | "presentation";

export interface KBSlide {
  title: string;
  bullets: string[];
  note?: string;
}

export interface KBChapter {
  t: number; // секунды
  label: string;
}

export interface KBArticle {
  id: string;
  kind: KBKind;
  level: "Начальный" | "Средний" | "Продвинутый";
  videoUrl?: string;
  duration?: string;
  chapters?: KBChapter[];
  slides?: KBSlide[];
  speaker?: string;
  title: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorRole: string;
  readingTime: string;
  excerpt: string;
  content: string;
  status: "published" | "draft";
  createdAt: string;
  likes: number;
  views: number;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: "edu" | "work";
  type: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  link: string;
  projectId?: string;
  projectName?: string;
  attendees: string[];
  speaker: string;
}

export interface ReviewRequest {
  id: string;
  projectId: string;
  title: string;
  type: "code" | "design" | "qa" | "doc";
  link: string;
  fileName?: string;
  comment: string;
  authorName: string;
  authorSpec: string;
  reviewerName: string;
  status: "todo" | "sent" | "changes" | "done";
  priority: "low" | "medium" | "high";
  verdict?: string;
  createdAt: string;
}

export interface SprintGrade {
  id: string;
  projectId: string;
  projectName: string;
  sprint: string;
  userId: string;
  userName: string;
  activity: number;
  execution: number;
  selforg: number;
  learning: number;
  comment: string;
  reportToOrg: string;
  createdAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  number: number;
  title: string;
  startDate: string; // понедельник, YYYY-MM-DD. Спринт = 2 недели (10 рабочих дней)
  mode: "single" | "split"; // single: спринт = один этап; split: у каждой недели своя часть этапа
  week1Stage: string;
  week1Focus: string;
  week2Stage: string;
  week2Focus: string;
  goals: string[];
  goalsDone?: string[];
  status: "planned" | "active" | "done";
  summary: string;
  adminRating?: number;
  adminComment?: string;
}

export interface Escalation {
  id: string;
  projectId: string;
  projectName: string;
  type: "tech" | "org" | "hr";
  title: string;
  description: string;
  steps: string;
  links: string;
  authorName: string;
  status: "new" | "inwork" | "resolved";
  createdAt: string;
}

export interface ConsultRequest {
  id: string;
  type: "oneonone" | "codereview" | "workshop" | "accelerator";
  title: string;
  description: string;
  requesterName: string;
  requesterSpec: string;
  status: "new" | "accepted" | "done" | "rejected";
  createdAt: string;
}

export interface ToastMsg {
  id: string;
  title: string;
  text?: string;
  kind: "success" | "info" | "warn" | "error";
}

export interface PermissionRow {
  id: string;
  label: string;
  hint: string;
  roles: Record<RoleId, boolean>;
}

export interface GradeChange {
  id: string;
  userId: string;
  userName: string;
  from: string;
  to: string;
  by: string;
  comment: string;
  date: string;
}

export interface PromoRec {
  id: string;
  userId: string;
  userName: string;
  byName: string;
  comment: string;
  date: string;
}

export interface InboxMsg {
  id: string;
  name: string;
  contact: string;
  text: string;
  createdAt: string;
  done: boolean;
}
