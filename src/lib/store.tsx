"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  Application,
  ConsultRequest,
  DailyReport,
  DemoUser,
  GradeChange,
  InboxMsg,
  PromoRec,
  Escalation,
  EventItem,
  InterviewSlot,
  KBArticle,
  PermissionRow,
  Project,
  ReviewRequest,
  RoleId,
  SprintGrade,
  Sprint,
  TaskItem,
  TeamMember,
  ToastMsg,
  Vacancy,
} from "./types";
import { DEFAULT_PERMISSIONS, GRADE_BY_ROLE } from "./rbac";
import {
  SEED_APPLICATIONS,
  SEED_ARTICLES,
  SEED_DAILIES,
  SEED_ESCALATIONS,
  SEED_SPRINTS,
  SEED_GRADES,
  SEED_PROJECTS,
  SEED_REQUESTS,
  SEED_REVIEWS,
  SEED_TASKS,
  SEED_USERS,
  SEED_VACANCIES,
  seedEvents,
  seedSlots,
} from "./seed";

const KEY = "guild_state_v6";

export interface GuildState {
  users: DemoUser[];
  vacancies: Vacancy[];
  slots: InterviewSlot[];
  applications: Application[];
  projects: Project[];
  tasks: TaskItem[];
  dailies: DailyReport[];
  sprints: Sprint[];
  favorites: string[];
  readNotifs: string[];
  gradeHistory: GradeChange[];
  recs: PromoRec[];
  inbox: InboxMsg[];
  articles: KBArticle[];
  events: EventItem[];
  escalations: Escalation[];
  requests: ConsultRequest[];
  reviews: ReviewRequest[];
  grades: SprintGrade[];
  permissions: PermissionRow[];
  roadmapDone: Record<string, string[]>;
  presetSpec: string;
}

function initialState(): GuildState {
  return {
    users: SEED_USERS,
    vacancies: SEED_VACANCIES,
    slots: seedSlots(),
    applications: SEED_APPLICATIONS,
    projects: SEED_PROJECTS,
    tasks: SEED_TASKS,
    dailies: SEED_DAILIES,
    articles: SEED_ARTICLES,
    events: seedEvents(),
    escalations: SEED_ESCALATIONS,
    requests: SEED_REQUESTS,
    reviews: SEED_REVIEWS,
    grades: SEED_GRADES,
    sprints: SEED_SPRINTS,
    favorites: [],
    gradeHistory: [],
    recs: [],
    inbox: [],
    readNotifs: [],
    permissions: DEFAULT_PERMISSIONS,
    presetSpec: "Все",
    roadmapDone: { "u-intern:Backend": ["Изучение API-контракта", "Схема БД и миграции"] },
  };
}

interface StoreApi {
  role: RoleId;
  setRole: (r: RoleId) => void;
  currentUser: DemoUser;
  state: GuildState;
  loading: boolean;
  toasts: ToastMsg[];
  pushToast: (t: Omit<ToastMsg, "id">) => void;
  dismissToast: (id: string) => void;
  can: (permId: string) => boolean;
  togglePermission: (permId: string, role: RoleId) => void;
  updateUser: (id: string, patch: Partial<DemoUser>) => void;
  promoteUser: (id: string) => void;
  addVacancy: (v: Vacancy) => void;
  removeVacancy: (id: string) => void;
  bookSlot: (slotId: string, app: Omit<Application, "id" | "createdAt" | "status" | "slotId">) => boolean;
  cancelApplication: (appId: string) => void;
  verdictApplication: (appId: string, ok: boolean, text?: string) => void;
  addSlot: (s: InterviewSlot) => void;
  removeSlot: (id: string) => void;
  addDaily: (d: DailyReport) => void;
  addTask: (t: TaskItem) => void;
  moveTask: (id: string, status: TaskItem["status"]) => void;
  removeTask: (id: string) => void;
  addArticle: (a: KBArticle) => void;
  updateArticle: (id: string, patch: Partial<KBArticle>) => void;
  removeArticle: (id: string) => void;
  likeArticle: (id: string) => void;
  addEvent: (e: EventItem) => void;
  removeEvent: (id: string) => void;
  joinEvent: (id: string, name: string) => void;
  addEscalation: (e: Escalation) => void;
  resolveEscalation: (id: string) => void;
  updateRequest: (id: string, status: ConsultRequest["status"]) => void;
  addRequest: (r: ConsultRequest) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  addProject: (p: Project) => void;
  toggleRoadmap: (userId: string, spec: string, item: string) => void;
  setPresetSpec: (s: string) => void;
  addSprint: (sp: Sprint) => void;
  updateSprint: (id: string, patch: Partial<Sprint>) => void;
  removeSprint: (id: string) => void;
  toggleFavorite: (vacancyId: string) => void;
  setUserRole: (userId: string, role: RoleId, comment: string) => void;
  addUser: (u: DemoUser) => void;
  addRec: (r: PromoRec) => void;
  addInbox: (m: InboxMsg) => void;
  doneInbox: (id: string) => void;
  toggleSprintGoal: (sprintId: string, goal: string) => void;
  addSprintGoal: (sprintId: string, goal: string) => void;
  removeFromProjects: (userName: string) => void;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: (ids: string[]) => void;
  addReview: (r: ReviewRequest) => void;
  moveReview: (id: string, status: ReviewRequest["status"]) => void;
  resolveReview: (id: string, status: ReviewRequest["status"], verdict: string) => void;
  removeReview: (id: string) => void;
  addGrade: (g: SprintGrade) => void;
  removeMember: (projectId: string, memberName: string) => void;
  addMember: (projectId: string, member: TeamMember) => void;
  updateVacancy: (id: string, patch: Partial<Vacancy>) => void;
  resetDemo: () => void;
}

const Ctx = createContext<StoreApi | null>(null);

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`;
}

const ROLE_USER: Record<RoleId, string> = {
  guest: "u-candidate",
  candidate: "u-candidate",
  intern: "u-intern",
  junior: "u-junior",
  mentor: "u-mentor",
  techmentor: "u-tech",
  admin: "u-admin",
};

export function GuildProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<RoleId>("guest");
  const [state, setState] = useState<GuildState>(initialState);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const savedRole = localStorage.getItem("guild_role") as RoleId | null;
      if (raw) {
        const parsed = JSON.parse(raw) as GuildState;
        if (parsed && parsed.users && parsed.vacancies) {
          const base = initialState();
          setState({ ...base, ...parsed, reviews: parsed.reviews ?? base.reviews, grades: parsed.grades ?? base.grades, sprints: parsed.sprints ?? base.sprints, favorites: parsed.favorites ?? [], readNotifs: parsed.readNotifs ?? [], gradeHistory: parsed.gradeHistory ?? [], recs: parsed.recs ?? [], inbox: parsed.inbox ?? [] });
        }
      }
      if (savedRole) setRoleState(savedRole);
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, loading]);

  const setRole = useCallback((r: RoleId) => {
    setRoleState(r);
    try {
      localStorage.setItem("guild_role", r);
    } catch {
      /* ignore */
    }
  }, []);

  const pushToast = useCallback((t: Omit<ToastMsg, "id">) => {
    const id = uid("toast");
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const can = useCallback(
    (permId: string) => {
      const row = state.permissions.find((p) => p.id === permId);
      if (!row) return false;
      return !!row.roles[role];
    },
    [state.permissions, role]
  );

  const api: StoreApi = useMemo(() => {
    const patch = (fn: (s: GuildState) => GuildState) => setState((s) => fn(s));
    return {
      role,
      setRole,
      currentUser: state.users.find((u) => u.id === ROLE_USER[role]) ?? state.users[0],
      state,
      loading,
      toasts,
      pushToast,
      dismissToast,
      can,
      togglePermission: (permId, r) =>
        patch((s) => ({
          ...s,
          permissions: s.permissions.map((p) => (p.id === permId ? { ...p, roles: { ...p.roles, [r]: !p.roles[r] } } : p)),
        })),
      updateUser: (id, p) => patch((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...p } : u)) })),
      promoteUser: (id) => {
        const order: RoleId[] = ["candidate", "intern", "junior", "techmentor"];
        const gradeNames: Record<string, string> = {
          candidate: "Кандидат",
          intern: "Студент (Intern)",
          junior: "Гильдиец (Junior)",
          techmentor: "Технаставник (Senior)",
        };
        patch((s) => ({
          ...s,
          users: s.users.map((u) => {
            if (u.id !== id) return u;
            const idx = order.indexOf(u.role);
            const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : u.role;
            return { ...u, role: next, grade: gradeNames[next] ?? u.grade };
          }),
        }));
      },
      addVacancy: (v) => patch((s) => ({ ...s, vacancies: [v, ...s.vacancies] })),
      removeVacancy: (id) => patch((s) => ({ ...s, vacancies: s.vacancies.filter((v) => v.id !== id) })),
      bookSlot: (slotId, app) => {
        let ok = false;
        setState((s) => {
          const slot = s.slots.find((x) => x.id === slotId);
          if (!slot || slot.status === "booked") return s;
          ok = true;
          const appId = uid("app");
          const today = new Date().toISOString().slice(0, 10);
          const application: Application = {
            id: appId,
            createdAt: today,
            status: "booked",
            slotId,
            ...app,
          };
          return {
            ...s,
            slots: s.slots.map((x) =>
              x.id === slotId ? { ...x, status: "booked", bookedBy: app.userId, bookedByName: app.userName, vacancyId: app.vacancyId } : x
            ),
            applications: [application, ...s.applications],
            vacancies: s.vacancies.map((v) => (v.id === app.vacancyId ? { ...v, responses: v.responses + 1 } : v)),
          };
        });
        return true;
      },
      cancelApplication: (appId) =>
        patch((s) => {
          const app = s.applications.find((a) => a.id === appId);
          if (!app) return s;
          return {
            ...s,
            applications: s.applications.map((a) => (a.id === appId ? { ...a, status: "cancelled" } : a)),
            slots: app.slotId ? s.slots.map((x) => (x.id === app.slotId ? { ...x, status: "free", bookedBy: undefined, bookedByName: undefined, vacancyId: undefined } : x)) : s.slots,
          };
        }),
      verdictApplication: (appId, ok, text) =>
        patch((s) => ({
          ...s,
          applications: s.applications.map((a) => (a.id === appId ? { ...a, status: ok ? "accepted" : "rejected", verdict: text ?? (ok ? "Принят в проект. Добро пожаловать в Гильдию!" : "Пока не готовы предложить место. Приходите через спринт.") } : a)),
        })),
      addSlot: (sl) => patch((s) => ({ ...s, slots: [...s.slots, sl].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) })),
      removeSlot: (id) => patch((s) => ({ ...s, slots: s.slots.filter((x) => x.id !== id) })),
      addDaily: (dRep) => patch((s) => ({ ...s, dailies: [dRep, ...s.dailies.filter((x) => !(x.userName === dRep.userName && x.date === dRep.date))] })),
      addTask: (t) => patch((s) => ({ ...s, tasks: [...s.tasks, t] })),
      moveTask: (id, status) => patch((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) })),
      removeTask: (id) => patch((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
      addArticle: (a) => patch((s) => ({ ...s, articles: [a, ...s.articles] })),
      updateArticle: (id, p) => patch((s) => ({ ...s, articles: s.articles.map((a) => (a.id === id ? { ...a, ...p } : a)) })),
      removeArticle: (id) => patch((s) => ({ ...s, articles: s.articles.filter((a) => a.id !== id) })),
      likeArticle: (id) => patch((s) => ({ ...s, articles: s.articles.map((a) => (a.id === id ? { ...a, likes: a.likes + 1 } : a)) })),
      addEvent: (e) => patch((s) => ({ ...s, events: [...s.events, e].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) })),
      removeEvent: (id) => patch((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) })),
      joinEvent: (id, name) =>
        patch((s) => ({
          ...s,
          events: s.events.map((e) => (e.id === id && !e.attendees.includes(name) ? { ...e, attendees: [...e.attendees, name] } : e)),
        })),
      addEscalation: (e) => patch((s) => ({ ...s, escalations: [e, ...s.escalations] })),
      resolveEscalation: (id) => patch((s) => ({ ...s, escalations: s.escalations.map((e) => (e.id === id ? { ...e, status: "resolved" } : e)) })),
      updateRequest: (id, status) => patch((s) => ({ ...s, requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) })),
      addRequest: (r) => patch((s) => ({ ...s, requests: [r, ...s.requests] })),
      addSprint: (sp) => patch((s) => ({ ...s, sprints: [...s.sprints, sp].sort((a, b) => a.startDate.localeCompare(b.startDate)) })),
      updateSprint: (id, p) => patch((s) => ({ ...s, sprints: s.sprints.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      removeSprint: (id) => patch((s) => ({ ...s, sprints: s.sprints.filter((x) => x.id !== id) })),
      setUserRole: (userId, newRole, comment) =>
        patch((s) => {
          const u = s.users.find((x) => x.id === userId);
          if (!u || u.role === newRole) return s;
          const entry: GradeChange = { id: `gc-${Date.now()}`, userId, userName: u.name, from: u.grade, to: GRADE_BY_ROLE[newRole], by: "Администратор", comment, date: new Date().toISOString().slice(0, 10) };
          return {
            ...s,
            users: s.users.map((x) => (x.id === userId ? { ...x, role: newRole, grade: GRADE_BY_ROLE[newRole] } : x)),
            gradeHistory: [entry, ...s.gradeHistory],
          };
        }),
      addUser: (u) => patch((s) => ({ ...s, users: [...s.users, u] })),
      addRec: (r) => patch((s) => ({ ...s, recs: [r, ...s.recs.filter((x) => !(x.userId === r.userId && x.byName === r.byName))] })),
      addInbox: (m) => patch((s) => ({ ...s, inbox: [m, ...s.inbox] })),
      doneInbox: (id) => patch((s) => ({ ...s, inbox: s.inbox.map((m) => (m.id === id ? { ...m, done: true } : m)) })),
      toggleSprintGoal: (sid, goal) => patch((s) => ({ ...s, sprints: s.sprints.map((x) => { if (x.id !== sid) return x; const d = x.goalsDone ?? []; return { ...x, goalsDone: d.includes(goal) ? d.filter((g) => g !== goal) : [...d, goal] }; }) })),
      addSprintGoal: (sid, goal) => patch((s) => ({ ...s, sprints: s.sprints.map((x) => (x.id === sid && !x.goals.includes(goal) ? { ...x, goals: [...x.goals, goal] } : x)) })),
      removeFromProjects: (userName) => patch((s) => ({ ...s, projects: s.projects.map((p) => ({ ...p, team: p.team.filter((t) => t.name !== userName) })) })),
      toggleFavorite: (vid) => patch((s) => ({ ...s, favorites: s.favorites.includes(vid) ? s.favorites.filter((x) => x !== vid) : [...s.favorites, vid] })),
      markNotifRead: (nid) => patch((s) => (s.readNotifs.includes(nid) ? s : { ...s, readNotifs: [...s.readNotifs, nid] })),
      markAllNotifsRead: (ids) => patch((s) => ({ ...s, readNotifs: [...new Set([...s.readNotifs, ...ids])] })),
      updateProject: (id, p) => patch((s) => ({ ...s, projects: s.projects.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      addProject: (p) => patch((s) => ({ ...s, projects: [p, ...s.projects] })),
      toggleRoadmap: (userId, spec, item) =>
        patch((s) => {
          const key = `${userId}:${spec}`;
          const cur = s.roadmapDone[key] ?? [];
          const next = cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item];
          return { ...s, roadmapDone: { ...s.roadmapDone, [key]: next } };
        }),
      setPresetSpec: (sp) => patch((s) => ({ ...s, presetSpec: sp })),
      addReview: (r) => patch((s) => ({ ...s, reviews: [r, ...s.reviews] })),
      moveReview: (id, status) => patch((s) => ({ ...s, reviews: s.reviews.map((r) => (r.id === id ? { ...r, status } : r)) })),
      resolveReview: (id, status, verdict) => patch((s) => ({ ...s, reviews: s.reviews.map((r) => (r.id === id ? { ...r, status, verdict } : r)) })),
      removeReview: (id) => patch((s) => ({ ...s, reviews: s.reviews.filter((r) => r.id !== id) })),
      addGrade: (g) => patch((s) => ({ ...s, grades: [g, ...s.grades.filter((x) => !(x.projectId === g.projectId && x.sprint === g.sprint && x.userName === g.userName))] })),
      removeMember: (projectId, memberName) =>
        patch((s) => {
          const project = s.projects.find((p) => p.id === projectId);
          const member = project?.team.find((t) => t.name === memberName);
          if (!project || !member) return s;
          const freed: Vacancy = {
            id: `v-freed-${Date.now()}`,
            title: `${member.role} — ${member.spec} (освободилось место)`,
            spec: (["Backend", "Frontend", "Аналитика", "Тестирование", "UI/UX", "PM"].includes(member.spec) ? member.spec : "Backend") as Vacancy["spec"],
            projectId,
            projectName: project.name,
            projectType: "existing",
            commercial: project.commercial,
            grade: member.role === "Студент" ? "Intern" : member.role === "Гильдиец" ? "Junior" : "Middle",
            kind: "project",
            openings: 1,
            source: "freed",
            freedFrom: memberName,
            workload: "4–6 ч/нед",
            format: "Гибрид · Томск",
            description: `Место в команде проекта «${project.name}» освободилось после смены состава. Направление: ${member.spec}. Наставник проведёт собеседование по ближайшим слотам.`,
            responsibilities: ["Войти в контекст проекта за первую неделю", "Выполнять задачи спринта", "Вести дейли-отчёты"],
            hardSkills: [member.spec === "Frontend" ? "React" : member.spec === "Backend" ? "Java" : "BPMN", "Git"],
            softSkills: ["Ответственность", "Коммуникация"],
            tools: ["Git", "Figma"],
            niceToHave: [],
            team: `Команда проекта «${project.name}»`,
            mentor: project.team.find((t) => t.role === "Наставник")?.name ?? "Наставник проекта",
            postedAt: "только что",
            responses: 0,
          };
          return {
            ...s,
            projects: s.projects.map((p) => (p.id === projectId ? { ...p, team: p.team.filter((t) => t.name !== memberName) } : p)),
            vacancies: [freed, ...s.vacancies],
          };
        }),
      addMember: (projectId, member) =>
        patch((s) => ({
          ...s,
          projects: s.projects.map((p) => (p.id === projectId ? { ...p, team: [...p.team, member] } : p)),
        })),
      updateVacancy: (id, p) => patch((s) => ({ ...s, vacancies: s.vacancies.map((v) => (v.id === id ? { ...v, ...p } : v)) })),
      resetDemo: () => {
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* ignore */
        }
        setState(initialState());
      },
    };
  }, [role, state, loading, toasts, pushToast, dismissToast, can, setRole]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGuild(): StoreApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGuild must be used within GuildProvider");
  return ctx;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatFullRU(iso: string): string {
  try {
    return parseISODate(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" });
  } catch {
    return iso;
  }
}

export function formatDateRU(iso: string): string {
  try {
    const [y, m, dd] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, dd);
    return dt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });
  } catch {
    return iso;
  }
}
