import type { DailyReport, Sprint, SprintGrade } from "./types";

/* ============ Рубрика спринта (только 4 критерия, 0–5) ============ */

export const SPRINT_CRIT = ["activity", "execution", "selforg", "learning"] as const;
export type SprintCrit = (typeof SPRINT_CRIT)[number];

export const SPRINT_CRIT_LABEL: Record<SprintCrit, string> = {
  activity: "Активность",
  execution: "Выполнение",
  selforg: "Самоорганизация",
  learning: "Обучаемость",
};

export const SPRINT_CRIT_HINT: Record<SprintCrit, string> = {
  activity: "Присутствие на встречах, темп работы",
  execution: "Сроки и качество приёмки задач",
  selforg: "Планирование без напоминаний",
  learning: "Скорость освоения нового",
};

export const SPRINT_MAX = SPRINT_CRIT.length * 5; // 20 баллов за спринт

export const DEFAULT_STAGES = ["Инициация", "Проектирование", "Разработка", "Тестирование", "Релиз"];

/* ============ Даты (локальные, без сдвига часовых поясов) ============ */

export function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayISO(): string {
  return isoLocal(new Date());
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return isoLocal(d);
}

export function isWeekday(iso: string): boolean {
  const w = parseISO(iso).getDay();
  return w !== 0 && w !== 6;
}

export function mondayOf(iso: string): string {
  const d = parseISO(iso);
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  return isoLocal(d);
}

export function workdaysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  if (start > end) return out;
  let cur = start;
  let guard = 0;
  while (cur <= end && guard < 800) {
    if (isWeekday(cur)) out.push(cur);
    cur = addDays(cur, 1);
    guard++;
  }
  return out;
}

export function shortRange(startIso: string, endIso: string): string {
  const f = (iso: string) => parseISO(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  return `${f(startIso)} – ${f(endIso)}`;
}

/* ============ Спринты ============ */

export function sprintEnd(s: Pick<Sprint, "startDate">): string {
  return addDays(s.startDate, 13);
}

export function sprintWorkdays(s: Pick<Sprint, "startDate">): string[] {
  return workdaysBetween(s.startDate, sprintEnd(s));
}

export function sprintStatusByDate(s: Pick<Sprint, "startDate">, today = todayISO()): Sprint["status"] {
  if (today < s.startDate) return "planned";
  if (today > sprintEnd(s)) return "done";
  return "active";
}

export function sprintOfDate(sprints: Sprint[], iso: string): Sprint | undefined {
  return sprints.find((s) => iso >= s.startDate && iso <= sprintEnd(s));
}

export function weekOfSprint(s: Sprint, iso: string): 1 | 2 {
  return iso < addDays(s.startDate, 7) ? 1 : 2;
}

export const STAGE_COLORS = [
  { bg: "bg-orange-100", text: "text-orange-800", ring: "ring-orange-300", bar: "bg-orange-400" },
  { bg: "bg-amber-100", text: "text-amber-800", ring: "ring-amber-300", bar: "bg-amber-400" },
  { bg: "bg-emerald-100", text: "text-emerald-800", ring: "ring-emerald-300", bar: "bg-emerald-500" },
  { bg: "bg-cyan-100", text: "text-cyan-800", ring: "ring-cyan-300", bar: "bg-cyan-500" },
  { bg: "bg-indigo-100", text: "text-indigo-800", ring: "ring-indigo-300", bar: "bg-indigo-500" },
  { bg: "bg-rose-100", text: "text-rose-800", ring: "ring-rose-300", bar: "bg-rose-500" },
];

export function stageColor(stages: string[], stage: string) {
  const i = stages.indexOf(stage);
  return i < 0 ? { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-300", bar: "bg-slate-400" } : STAGE_COLORS[i % STAGE_COLORS.length];
}

/* ============ Семестр ============ */

export interface Range {
  start: string;
  end: string;
  label: string;
}

export function semesterRange(offset = 0, now = new Date()): Range {
  const m = now.getMonth();
  const y = now.getFullYear();
  let kind: "autumn" | "spring";
  let year: number;
  if (m >= 8) {
    kind = "autumn";
    year = y;
  } else if (m === 0) {
    kind = "autumn";
    year = y - 1;
  } else {
    kind = "spring";
    year = y;
  }
  for (let i = 0; i < Math.abs(offset); i++) {
    if (kind === "autumn") kind = "spring";
    else {
      kind = "autumn";
      year -= 1;
    }
  }
  if (kind === "autumn") {
    return { start: `${year}-09-01`, end: `${year + 1}-01-31`, label: `Осенний семестр ${year}/${year + 1}` };
  }
  return { start: `${year}-02-01`, end: `${year}-08-31`, label: `Весенний семестр ${year}` };
}

/* ============ Баллы за дейли ============
   1   — отчёт сдан вовремя (в свой рабочий день)
   0.5 — в отчёте указано, что ничего не делал (или отчёт сдан с опозданием)
   0   — отчёта нет (по будним дням)
*/

export function detectNothing(text: string): boolean {
  return /(ничего\s+не\s+дел|не\s+делал|не\s+делала|ничего\s+не\s+успел|не\s+успел|не\s+успела|ничего)/i.test(text);
}

export const IDLE_REASONS = [
  "Болезнь",
  "Сессия, экзамены или зачёты",
  "Учебная нагрузка: дедлайны в университете",
  "Ждал(а) ТЗ или ответа от наставника",
  "Технические проблемы: нет доступа к стенду",
  "Личные обстоятельства",
  "Другое",
] as const;

export const MOODS: { id: "good" | "risk" | "blocked"; label: string; emoji: string }[] = [
  { id: "good", label: "Всё идёт по плану", emoji: "🟢" },
  { id: "risk", label: "Есть риски", emoji: "🟡" },
  { id: "blocked", label: "Я заблокирован(а)", emoji: "🔴" },
];

export function scoreDaily(opts: { date: string; submittedDate: string; yesterday: string; mode?: "work" | "idle" }): { score: number; reason: string } {
  if (opts.mode === "idle" || (opts.mode !== "work" && detectNothing(opts.yesterday))) return { score: 0.5, reason: "Указано, что ничего не делали — 0,5 балла" };
  if (detectNothing(opts.yesterday) && opts.yesterday.trim().length < 40) return { score: 0.5, reason: "В отчёте нет содержательных результатов — 0,5 балла" };
  if (opts.date !== opts.submittedDate) return { score: 0.5, reason: "Отчёт сдан с опозданием — 0,5 балла" };
  return { score: 1, reason: "Отчёт вовремя — 1 балл" };
}

export type DayKind = "ok" | "partial" | "missed" | "pending" | "future";

export function dayState(name: string, dailies: DailyReport[], day: string, today = todayISO()): { kind: DayKind; score: number; report?: DailyReport } {
  const report = dailies.find((d) => d.userName === name && d.date === day);
  if (report) return { kind: report.score >= 1 ? "ok" : "partial", score: report.score, report };
  if (day > today) return { kind: "future", score: 0 };
  if (day === today) return { kind: "pending", score: 0 };
  return { kind: "missed", score: 0 };
}

export interface DailyStat {
  points: number;
  max: number;
  onTime: number;
  partial: number;
  missed: number;
}

export function dailyStat(name: string, dailies: DailyReport[], from: string, to: string, today = todayISO()): DailyStat {
  const mine = dailies.filter((d) => d.userName === name && d.date >= from && d.date <= to && isWeekday(d.date));
  if (!mine.length) return { points: 0, max: 0, onTime: 0, partial: 0, missed: 0 }; // нет данных за период
  const first = mine.length ? mine.map((d) => d.date).sort()[0] : from;
  const start = first > from ? first : from;
  const end = to < today ? to : today;
  const days = workdaysBetween(start, end);
  let points = 0;
  let onTime = 0;
  let partial = 0;
  let missed = 0;
  let max = 0;
  for (const day of days) {
    const st = dayState(name, mine, day, today);
    if (st.kind === "pending") continue; // сегодняшний день ещё идёт
    max += 1;
    if (st.kind === "missed") missed += 1;
    else {
      points += st.score;
      if (st.kind === "ok") onTime += 1;
      else partial += 1;
    }
  }
  return { points, max, onTime, partial, missed };
}

/* ============ Баллы за спринты (наставник) ============ */

export function gradeSum(g: SprintGrade): number {
  return SPRINT_CRIT.reduce((a, c) => a + g[c], 0);
}

export function gradeAvg(g: SprintGrade): number {
  return Math.round((gradeSum(g) / SPRINT_CRIT.length) * 10) / 10;
}

export interface SprintStat {
  points: number;
  max: number;
  count: number;
  avg: number;
}

export function sprintStat(name: string, grades: SprintGrade[], sprints: Sprint[], range?: Range): SprintStat {
  const mine = grades.filter((g) => {
    if (g.userName !== name) return false;
    if (!range) return true;
    const sp = sprints.find((s) => s.projectId === g.projectId && s.title === g.sprint);
    return !sp || (sp.startDate >= range.start && sp.startDate <= range.end);
  });
  const points = mine.reduce((a, g) => a + gradeSum(g), 0);
  return { points, max: mine.length * SPRINT_MAX, count: mine.length, avg: mine.length ? Math.round((points / (mine.length * SPRINT_CRIT.length)) * 10) / 10 : 0 };
}

/* ============ Итог: дейли + спринты → проценты ============ */

export interface ScoreSummary {
  daily: DailyStat;
  sprint: SprintStat;
  total: number;
  maxTotal: number;
  percent: number;
  dailyPercent: number;
  sprintPercent: number;
}

export function summarize(name: string, dailies: DailyReport[], grades: SprintGrade[], sprints: Sprint[], range: Range, today = todayISO()): ScoreSummary {
  const daily = dailyStat(name, dailies, range.start, range.end, today);
  const sprint = sprintStat(name, grades, sprints, range);
  const total = daily.points + sprint.points;
  const maxTotal = daily.max + sprint.max;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  return { daily, sprint, total, maxTotal, percent: pct(total, maxTotal), dailyPercent: pct(daily.points, daily.max), sprintPercent: pct(sprint.points, sprint.max) };
}

export function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

/* ============ Недели и тренды ============ */

export function weekStarts(count: number, today = todayISO()): string[] {
  const out: string[] = [];
  const cur = mondayOf(today);
  for (let i = count - 1; i >= 0; i--) out.push(addDays(cur, -7 * i));
  return out;
}

/** Доля набранных баллов за дейли в диапазоне (или null, если данных нет) */
export function dailyPercentRange(name: string, dailies: DailyReport[], from: string, to: string, today = todayISO()): number | null {
  const st = dailyStat(name, dailies, from, to, today);
  return st.max ? Math.round((st.points / st.max) * 1000) / 10 : null;
}

/** Динамика: дисциплина дейли за последние 14 дней минус предыдущие 14 */
export function dailyTrend(name: string, dailies: DailyReport[], today = todayISO()): number | null {
  const cur = dailyPercentRange(name, dailies, addDays(today, -13), today, today);
  const prev = dailyPercentRange(name, dailies, addDays(today, -27), addDays(today, -14), today);
  if (cur === null || prev === null) return null;
  return Math.round((cur - prev) * 10) / 10;
}
