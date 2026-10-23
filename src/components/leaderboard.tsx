"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, BarChart3, Crown, Download, Medal, Minus, Search, Settings2, Sparkles, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { useGuild } from "@/lib/store";
import { roleMeta } from "@/lib/rbac";
import {
  SPRINT_CRIT,
  SPRINT_CRIT_LABEL,
  SPRINT_MAX,
  addDays,
  dailyPercentRange,
  dailyTrend,
  dayState,
  fmt,
  gradeSum,
  semesterRange,
  summarize,
  todayISO,
  weekStarts,
  workdaysBetween,
  type Range,
  type ScoreSummary,
} from "@/lib/scoring";
import type { DemoUser, Project } from "@/lib/types";
import { Avatar, Badge, Btn, Card, EmptyState, Modal, Pagination, Progress, SegTabs, SelectBox, inputCls } from "@/components/ui";

const ALL_TIME: Range = { start: "2000-01-01", end: "2100-12-31", label: "Всё время" };

type SortKey = "percent" | "daily" | "sprint" | "trend" | "name" | "projects";

interface Row {
  u: DemoUser;
  s: ScoreSummary;
  projects: Project[];
  reviews: number;
  trend: number | null;
  rank: number;
}

const BUCKETS = [
  { l: "< 60%", min: 0, max: 60, c: "bg-rose-400" },
  { l: "60–70%", min: 60, max: 70, c: "bg-orange-400" },
  { l: "70–80%", min: 70, max: 80, c: "bg-amber-400" },
  { l: "80–90%", min: 80, max: 90, c: "bg-lime-500" },
  { l: "90–100%", min: 90, max: 101, c: "bg-emerald-500" },
];

const pctColor = (p: number) => (p >= 85 ? "bg-emerald-500" : p >= 65 ? "bg-amber-500" : "bg-rose-500");

function median(a: number[]) {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10;
}
const avg = (a: number[]) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : 0);

function Trend({ v }: { v: number | null }) {
  if (v === null) return <span className="text-[11px] text-slate-300">—</span>;
  if (Math.abs(v) < 0.5) return <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-400"><Minus size={12} /> 0</span>;
  return v > 0 ? (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-emerald-600"><TrendingUp size={13} /> +{v}</span>
  ) : (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-rose-600"><TrendingDown size={13} /> {v}</span>
  );
}

export function Leaderboard({ onManage }: { onManage: (userId: string) => void }) {
  const { state, pushToast, setUserRole } = useGuild();
  const today = todayISO();
  const [view, setView] = useState<"rating" | "analytics">("rating");
  const [semKey, setSemKey] = useState<"0" | "-1" | "all">("0");
  const [project, setProject] = useState("all");
  const [roleF, setRoleF] = useState("all");
  const [spec, setSpec] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("percent");
  const [dir, setDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [open, setOpen] = useState<string | null>(null);

  const range: Range = semKey === "all" ? ALL_TIME : semesterRange(semKey === "0" ? 0 : -1);

  // базовые строки (без фильтров) — чтобы место в рейтинге было общим
  const base = useMemo<Row[]>(() => {
    const rows = state.users
      .filter((u) => u.role === "intern" || u.role === "junior")
      .map((u) => ({
        u,
        s: summarize(u.name, state.dailies, state.grades, state.sprints, range, today),
        projects: state.projects.filter((p) => p.team.some((t) => t.name === u.name)),
        reviews: state.reviews.filter((r) => r.authorName === u.name).length,
        trend: dailyTrend(u.name, state.dailies, today),
        rank: 0,
      }));
    rows.sort((a, b) => b.s.percent - a.s.percent);
    rows.forEach((r, i) => (r.rank = i + 1));
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.users, state.dailies, state.grades, state.sprints, state.projects, state.reviews, semKey, today]);

  const withData = base.filter((r) => r.s.maxTotal > 0);

  const filtered = useMemo(() => {
    let rows = base;
    if (project !== "all") rows = rows.filter((r) => r.projects.some((p) => p.id === project));
    if (roleF !== "all") rows = rows.filter((r) => r.u.role === roleF);
    if (spec !== "all") rows = rows.filter((r) => r.u.spec === spec);
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((r) => (r.u.name + r.u.spec + r.projects.map((p) => p.name).join(" ")).toLowerCase().includes(q));
    }
    const sgn = dir === "asc" ? 1 : -1;
    const val = (r: Row): number | string => {
      if (sort === "daily") return r.s.dailyPercent;
      if (sort === "sprint") return r.s.sprintPercent;
      if (sort === "trend") return r.trend ?? -999;
      if (sort === "projects") return r.projects.length;
      if (sort === "name") return r.u.name;
      return r.s.percent;
    };
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return typeof x === "string" ? sgn * x.localeCompare(String(y)) : sgn * (x - (y as number));
    });
  }, [base, project, roleF, spec, query, sort, dir]);

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const curPage = Math.min(page, pages);
  const slice = filtered.slice((curPage - 1) * size, curPage * size);
  const specs = [...new Set(base.map((r) => r.u.spec))];

  function head(key: SortKey, label: string, className = "") {
    const active = sort === key;
    return (
      <th className={`p-3 ${className}`}>
        <button
          onClick={() => {
            if (active) setDir((d) => (d === "desc" ? "asc" : "desc"));
            else {
              setSort(key);
              setDir(key === "name" ? "asc" : "desc");
            }
            setPage(1);
          }}
          className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide ${active ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
        >
          {label}
          {active ? dir === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} /> : null}
        </button>
      </th>
    );
  }

  /* ---------- Аналитика ---------- */
  const percents = withData.map((r) => r.s.percent);
  const buckets = BUCKETS.map((b) => ({ ...b, n: withData.filter((r) => r.s.percent >= b.min && r.s.percent < b.max).length }));
  const maxBucket = Math.max(...buckets.map((b) => b.n), 1);
  const risk = withData.filter((r) => r.s.percent < 70);
  const promo = withData.filter((r) => r.s.percent >= 90);
  const weeks = weekStarts(8, today).map((w) => {
    const vals = base.map((r) => dailyPercentRange(r.u.name, state.dailies, w, addDays(w, 6), today)).filter((v): v is number => v !== null);
    return { w, v: vals.length ? avg(vals) : null };
  });
  const dailyTotals = withData.reduce((a, r) => ({ ok: a.ok + r.s.daily.onTime, half: a.half + r.s.daily.partial, miss: a.miss + r.s.daily.missed }), { ok: 0, half: 0, miss: 0 });
  const dailyAll = Math.max(dailyTotals.ok + dailyTotals.half + dailyTotals.miss, 1);
  const byProject = state.projects
    .map((p) => {
      const rows = withData.filter((r) => r.projects.some((x) => x.id === p.id));
      return { p, n: rows.length, total: avg(rows.map((r) => r.s.percent)), daily: avg(rows.map((r) => r.s.dailyPercent)), sprint: avg(rows.map((r) => r.s.sprintPercent)) };
    })
    .filter((x) => x.n > 0);
  const bySpec = specs
    .map((sp) => {
      const rows = withData.filter((r) => r.u.spec === sp);
      return { sp, n: rows.length, total: avg(rows.map((r) => r.s.percent)) };
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.total - a.total);
  const grades = state.grades.filter((g) => withData.some((r) => r.u.name === g.userName));
  const critAvg = SPRINT_CRIT.map((c) => ({ c, v: grades.length ? Math.round((grades.reduce((a, g) => a + g[c], 0) / grades.length) * 10) / 10 : 0 }));
  const risers = [...base].filter((r) => r.trend !== null).sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0));
  const maxWeek = Math.max(...weeks.map((w) => w.v ?? 0), 1);

  /* ---------- Excel ---------- */
  async function exportXlsx(rows: Row[], suffix: string) {
    const XLSX = await import("xlsx");
    const lb = rows.map((r) => ({
      "Место (общее)": r.rank,
      "Участник": r.u.name,
      "Роль": roleMeta(r.u.role).label,
      "Направление": r.u.spec,
      "Проекты": r.projects.map((p) => p.name).join(", "),
      "Дейли: баллы": r.s.daily.points,
      "Дейли: максимум": r.s.daily.max,
      "Дейли вовремя (1)": r.s.daily.onTime,
      "Дейли 0,5": r.s.daily.partial,
      "Дейли пропуски (0)": r.s.daily.missed,
      "Дейли %": r.s.dailyPercent,
      "Спринты: баллы наставника": r.s.sprint.points,
      "Спринты: максимум": r.s.sprint.max,
      "Спринтов оценено": r.s.sprint.count,
      "Спринты %": r.s.sprintPercent,
      "Итого баллов": r.s.total,
      "Максимум баллов": r.s.maxTotal,
      "Итоговый %": r.s.percent,
      "Динамика дейли за 14 дн.": r.trend ?? "",
      "Задач закрыто": r.u.tasksClosed,
      "Ревью": r.reviews,
      "Рекомендации наставников": state.recs.filter((x) => x.userId === r.u.id).length,
    }));
    const names = new Set(rows.map((r) => r.u.name));
    const sprintRows = state.grades
      .filter((g) => names.has(g.userName))
      .filter((g) => {
        const sp = state.sprints.find((s) => s.projectId === g.projectId && s.title === g.sprint);
        return !sp || (sp.startDate >= range.start && sp.startDate <= range.end);
      })
      .map((g) => ({
        "Участник": g.userName,
        "Проект": g.projectName,
        "Спринт": g.sprint,
        ...Object.fromEntries(SPRINT_CRIT.map((c) => [SPRINT_CRIT_LABEL[c], g[c]])),
        "Сумма (из 20)": gradeSum(g),
        "Комментарий": g.comment,
        "Отчёт орг. отделу": g.reportToOrg,
      }));
    const dailyRows = state.dailies
      .filter((d) => names.has(d.userName) && d.date >= range.start && d.date <= range.end)
      .sort((a, b) => a.date.localeCompare(b.date) || a.userName.localeCompare(b.userName))
      .map((d) => ({
        "Дата": d.date,
        "Участник": d.userName,
        "Проект": d.projectName,
        "Баллы": d.score,
        "Тип отчёта": d.mode === "idle" ? "Ничего не делал" : "Рабочий",
        "Причина": d.reason ?? "",
        "Часы": d.hours ?? "",
        "Сдан": d.submittedAt.replace("T", " "),
        "Блокеры": d.blockers,
      }));
    const info = [
      { "Параметр": "Период", "Значение": `${range.label} (${range.start} — ${range.end})` },
      { "Параметр": "Выборка", "Значение": suffix === "all" ? "Все участники" : "Участники по текущим фильтрам" },
      { "Параметр": "Дейли", "Значение": "1 балл — вовремя, 0,5 — «ничего не делал» (с причиной) или опоздание, 0 — отчёта нет (только будни)" },
      { "Параметр": "Спринт", "Значение": "Оценка наставника: Активность, Выполнение, Самоорганизация, Обучаемость — по 0–5 (максимум 20)" },
      { "Параметр": "Итоговый %", "Значение": "(баллы дейли + баллы спринтов) / (максимум дейли + максимум спринтов) × 100" },
      { "Параметр": "Сформировано", "Значение": new Date().toLocaleString("ru-RU") },
    ];
    const wb = XLSX.utils.book_new();
    const add = (data: Record<string, unknown>[], name: string) => {
      const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ "Нет данных": "за выбранный период" }]);
      ws["!cols"] = Object.keys(data[0] ?? { x: 1 }).map((k) => ({ wch: Math.min(42, Math.max(k.length + 2, 14)) }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    };
    add(lb, "Лидерборд");
    add(sprintRows, "Оценки спринтов");
    add(dailyRows, "Дейли");
    add(info, "Как считается");
    XLSX.writeFile(wb, `Гильдия_лидерборд_${range.label.replace(/[\s/]+/g, "_")}${suffix === "all" ? "" : "_фильтр"}.xlsx`);
    pushToast({ kind: "success", title: "Excel выгружен!", text: `${range.label}: ${lb.length} участников, листы «Лидерборд», «Оценки спринтов», «Дейли», «Как считается».` });
  }

  const openRow = base.find((r) => r.u.id === open);
  const podium = withData.slice(0, 3);
  const noData = withData.length === 0;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-60 flex-1">
            <h3 className="flex items-center gap-2 font-extrabold"><Trophy size={18} className="text-amber-500" /> Лидерборд Гильдии</h3>
            <p className="mt-0.5 text-xs text-slate-500">Итоговый % = (баллы дейли + баллы спринтов) / максимум. Дейли: 1 / 0,5 / 0. Спринт: 4 критерия × 5 от наставника.</p>
          </div>
          <SelectBox label="Период" value={semKey} onChange={(v) => { setSemKey(v as "0" | "-1" | "all"); setPage(1); }} options={[{ v: "0", l: semesterRange(0).label }, { v: "-1", l: semesterRange(-1).label }, { v: "all", l: "Всё время" }]} />
          <div className="flex flex-wrap gap-2 pt-4">
            <Btn variant="emerald" size="sm" disabled={noData} onClick={() => exportXlsx(base, "all")}><Download size={15} /> Excel · весь семестр</Btn>
            <Btn variant="outline" size="sm" disabled={noData || filtered.length === 0} onClick={() => exportXlsx(filtered, "filter")}><Download size={15} /> Только по фильтрам ({filtered.length})</Btn>
          </div>
        </div>
      </Card>

      <SegTabs value={view} onChange={setView} items={[{ id: "rating", label: "Рейтинг", icon: <Trophy size={14} />, count: filtered.length }, { id: "analytics", label: "Аналитика и статистика", icon: <BarChart3 size={14} /> }]} />

      {noData ? (
        <EmptyState title="За выбранный период данных нет" text="В рейтинг попадают студенты и гильдийцы с дейли и оценками спринтов. Выберите другой семестр или «Всё время»." />
      ) : view === "rating" ? (
        <>
          {podium.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {podium.map((row, i) => (
                <button key={row.u.id} onClick={() => setOpen(row.u.id)} className="text-left">
                  <Card className={`h-full p-4 transition hover:shadow-md ${i === 0 ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className={`grid size-9 place-items-center rounded-xl text-white ${i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : "bg-orange-400"}`}><Medal size={18} /></span>
                      <Avatar name={row.u.name} color={row.u.color} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold">{row.u.name}</p>
                        <p className="truncate text-[11px] text-slate-500">{row.u.spec} · {roleMeta(row.u.role).short}</p>
                      </div>
                      <span className="ml-auto text-2xl font-extrabold text-emerald-600">{row.s.percent}%</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="rounded-lg bg-white/70 p-1.5 ring-1 ring-slate-100"><b>{fmt(row.s.daily.points)}</b>/{row.s.daily.max}<br />дейли</div>
                      <div className="rounded-lg bg-white/70 p-1.5 ring-1 ring-slate-100"><b>{row.s.sprint.points}</b>/{row.s.sprint.max}<br />спринты</div>
                      <div className="rounded-lg bg-white/70 p-1.5 ring-1 ring-slate-100"><Trend v={row.trend} /><br />динамика</div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          ) : null}

          <Card className="p-4">
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Поиск</span>
                <div className="relative">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Имя, направление, проект…" className={`${inputCls} !py-2 !pl-9 !text-xs`} />
                </div>
              </div>
              <SelectBox label="Проект" value={project} onChange={(v) => { setProject(v); setPage(1); }} options={[{ v: "all", l: "Все проекты" }, ...state.projects.map((p) => ({ v: p.id, l: p.name }))]} />
              <SelectBox label="Грейд" value={roleF} onChange={(v) => { setRoleF(v); setPage(1); }} options={[{ v: "all", l: "Все грейды" }, { v: "intern", l: "Студент (Intern)" }, { v: "junior", l: "Гильдиец (Junior)" }]} />
              <SelectBox label="Направление" value={spec} onChange={(v) => { setSpec(v); setPage(1); }} options={[{ v: "all", l: "Все направления" }, ...specs.map((s) => ({ v: s, l: s }))]} />
            </div>
          </Card>

          {filtered.length === 0 ? (
            <EmptyState title="Никого не нашли" text="Попробуйте изменить фильтры или очистить поиск." action={<Btn variant="secondary" size="sm" onClick={() => { setProject("all"); setRoleF("all"); setSpec("all"); setQuery(""); }}>Сбросить фильтры</Btn>} />
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Место</th>
                      {head("name", "Участник")}
                      {head("daily", "Дейли")}
                      {head("sprint", "Спринты")}
                      <th className="p-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Итого</th>
                      {head("percent", "Итоговый %")}
                      {head("trend", "Динамика", "text-center")}
                      {head("projects", "Проекты", "text-center")}
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {slice.map((r) => (
                      <tr key={r.u.id} onClick={() => setOpen(r.u.id)} className={`cursor-pointer border-t border-slate-100 hover:bg-emerald-50/40 ${r.rank <= 3 && r.s.maxTotal > 0 ? "bg-amber-50/30" : ""}`}>
                        <td className="p-3">
                          <span className={`grid size-7 place-items-center rounded-lg text-xs font-extrabold ${r.rank === 1 ? "bg-amber-400 text-white" : r.rank === 2 ? "bg-slate-300 text-white" : r.rank === 3 ? "bg-orange-300 text-white" : "bg-slate-100 text-slate-500"}`}>{r.rank}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={r.u.name} color={r.u.color} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-extrabold">{r.u.name}</p>
                              <p className="truncate text-[11px] text-slate-500">{roleMeta(r.u.role).short} · {r.u.spec}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-extrabold">{fmt(r.s.daily.points)}<span className="font-medium text-slate-400"> / {r.s.daily.max}</span> <span className="text-[10px] font-bold text-slate-400">({r.s.dailyPercent}%)</span></p>
                          <p className="text-[10px] text-slate-400">1б: {r.s.daily.onTime} · 0,5б: {r.s.daily.partial} · 0б: {r.s.daily.missed}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-extrabold">{r.s.sprint.points}<span className="font-medium text-slate-400"> / {r.s.sprint.max}</span> <span className="text-[10px] font-bold text-slate-400">({r.s.sprintPercent}%)</span></p>
                          <p className="text-[10px] text-slate-400">спринтов: {r.s.sprint.count} · ср. {r.s.sprint.avg || "—"}/5</p>
                        </td>
                        <td className="p-3 text-center font-extrabold">{fmt(r.s.total)}<span className="font-medium text-slate-400">/{r.s.maxTotal}</span></td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${pctColor(r.s.percent)}`} style={{ width: `${r.s.percent}%` }} /></div>
                            <span className="text-sm font-extrabold">{r.s.percent}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center"><Trend v={r.trend} /></td>
                        <td className="p-3 text-center font-bold">{r.projects.length}</td>
                        <td className="p-3 text-right">
                          {r.s.maxTotal > 0 && r.s.percent < 70 ? <Badge tone="rose"><AlertTriangle size={11} /> риск</Badge> : r.s.percent >= 90 ? <Badge tone="emerald"><Sparkles size={11} /> топ</Badge> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={curPage} pages={pages} total={filtered.length} pageSize={size} onPage={setPage} onSize={(n) => { setSize(n); setPage(1); }} sizes={[5, 10, 20, 50]} />
            </Card>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
            {[
              { l: "Участников в рейтинге", v: withData.length, c: "text-slate-900" },
              { l: "Средний итоговый %", v: `${avg(percents)}%`, c: "text-emerald-600" },
              { l: "Медиана", v: `${median(percents)}%`, c: "text-sky-600" },
              { l: "Лучший результат", v: `${Math.max(...percents)}%`, c: "text-amber-600" },
              { l: "Зона риска (<70%)", v: risk.length, c: "text-rose-600" },
              { l: "Кандидаты на повышение", v: promo.length, c: "text-indigo-600" },
            ].map((k) => (
              <Card key={k.l} className="p-3.5"><p className={`text-2xl font-extrabold ${k.c}`}>{k.v}</p><p className="text-[11px] font-semibold text-slate-500">{k.l}</p></Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h4 className="font-extrabold">Распределение итогового %</h4>
              <p className="mt-0.5 text-xs text-slate-500">Сколько участников в каждом диапазоне</p>
              <div className="mt-4 flex h-36 items-end gap-2">
                {buckets.map((b) => (
                  <div key={b.l} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-xs font-extrabold">{b.n}</span>
                    <div className={`w-full rounded-t-lg ${b.c}`} style={{ height: `${Math.max((b.n / maxBucket) * 80, b.n ? 8 : 2)}%` }} />
                    <span className="text-[10px] font-bold text-slate-500">{b.l}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h4 className="font-extrabold">Дисциплина дейли по неделям</h4>
              <p className="mt-0.5 text-xs text-slate-500">Средняя доля баллов за дейли, последние 8 недель</p>
              <div className="mt-4 flex h-36 items-end gap-2">
                {weeks.map((w) => (
                  <div key={w.w} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[11px] font-extrabold">{w.v === null ? "—" : `${w.v}`}</span>
                    <div className={`w-full rounded-t-lg ${w.v === null ? "bg-slate-100" : pctColor(w.v)}`} style={{ height: `${w.v === null ? 3 : Math.max((w.v / maxWeek) * 80, 6)}%` }} />
                    <span className="text-[10px] font-bold text-slate-500">{w.w.slice(8, 10)}.{w.w.slice(5, 7)}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h4 className="font-extrabold">Структура дейли-баллов</h4>
              <p className="mt-0.5 text-xs text-slate-500">Все отчётные дни участников за период</p>
              <div className="mt-4 flex h-5 overflow-hidden rounded-full bg-slate-100">
                <div className="bg-emerald-500" style={{ width: `${(dailyTotals.ok / dailyAll) * 100}%` }} />
                <div className="bg-amber-400" style={{ width: `${(dailyTotals.half / dailyAll) * 100}%` }} />
                <div className="bg-rose-400" style={{ width: `${(dailyTotals.miss / dailyAll) * 100}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-emerald-50 p-2"><p className="text-lg font-extrabold text-emerald-700">{dailyTotals.ok}</p><p className="text-[10px] font-semibold text-emerald-800">вовремя · 1 б.</p></div>
                <div className="rounded-xl bg-amber-50 p-2"><p className="text-lg font-extrabold text-amber-700">{dailyTotals.half}</p><p className="text-[10px] font-semibold text-amber-800">0,5 б.</p></div>
                <div className="rounded-xl bg-rose-50 p-2"><p className="text-lg font-extrabold text-rose-700">{dailyTotals.miss}</p><p className="text-[10px] font-semibold text-rose-800">пропуски · 0</p></div>
              </div>
            </Card>

            <Card className="p-5">
              <h4 className="font-extrabold">Оценки наставников по критериям</h4>
              <p className="mt-0.5 text-xs text-slate-500">Среднее по оценённым спринтам (0–5)</p>
              <div className="mt-3 space-y-2.5">
                {critAvg.map(({ c, v }) => (
                  <div key={c} className="flex items-center gap-2">
                    <span className="w-32 text-[11px] font-semibold text-slate-600">{SPRINT_CRIT_LABEL[c]}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${(v / 5) * 100}%` }} /></div>
                    <span className="w-8 text-right text-xs font-extrabold">{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h4 className="font-extrabold">Сравнение проектов</h4>
              <div className="mt-3 space-y-3">
                {byProject.map((x) => (
                  <div key={x.p.id}>
                    <div className="flex justify-between text-[11px] font-bold"><span className="truncate">{x.p.name}</span><span>{x.total}% · {x.n} уч.</span></div>
                    <Progress value={x.total} color={pctColor(x.total)} />
                    <p className="mt-0.5 text-[10px] text-slate-400">дейли {x.daily}% · спринты {x.sprint}%</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h4 className="font-extrabold">Сравнение направлений</h4>
              <div className="mt-3 space-y-2.5">
                {bySpec.map((x) => (
                  <div key={x.sp} className="flex items-center gap-2">
                    <span className="w-28 truncate text-[11px] font-bold text-slate-600">{x.sp}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${pctColor(x.total)}`} style={{ width: `${x.total}%` }} /></div>
                    <span className="w-24 text-right text-xs font-extrabold">{x.total}% <span className="font-medium text-slate-400">· {x.n}</span></span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-rose-200 p-5">
              <h4 className="flex items-center gap-2 font-extrabold text-rose-800"><AlertTriangle size={16} /> Зона риска</h4>
              <p className="mt-0.5 text-xs text-slate-500">Итоговый процент ниже 70%</p>
              <div className="mt-3 space-y-2">
                {risk.length === 0 ? <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">Никто не в зоне риска 🎉</p> : risk.map((r) => (
                  <button key={r.u.id} onClick={() => setOpen(r.u.id)} className="flex w-full items-center gap-2.5 rounded-xl bg-rose-50/60 p-2.5 text-left hover:bg-rose-50">
                    <Avatar name={r.u.name} color={r.u.color} size="sm" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold">{r.u.name}</span><span className="text-[11px] text-slate-500">дейли {r.s.dailyPercent}% · спринты {r.s.sprintPercent}%</span></span>
                    <span className="text-sm font-extrabold text-rose-700">{r.s.percent}%</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="border-emerald-200 p-5">
              <h4 className="flex items-center gap-2 font-extrabold text-emerald-800"><Crown size={16} /> Кандидаты на повышение</h4>
              <p className="mt-0.5 text-xs text-slate-500">Итоговый процент от 90%</p>
              <div className="mt-3 space-y-2">
                {promo.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Пока никого — нужен итоговый процент от 90%.</p> : promo.map((r) => {
                  const recs = state.recs.filter((x) => x.userId === r.u.id).length;
                  return (
                    <button key={r.u.id} onClick={() => setOpen(r.u.id)} className="flex w-full items-center gap-2.5 rounded-xl bg-emerald-50/60 p-2.5 text-left hover:bg-emerald-50">
                      <Avatar name={r.u.name} color={r.u.color} size="sm" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold">{r.u.name}</span><span className="text-[11px] text-slate-500">{roleMeta(r.u.role).short} · рекомендаций наставников: {recs}</span></span>
                      <span className="text-sm font-extrabold text-emerald-700">{r.s.percent}%</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5 lg:col-span-2">
              <h4 className="font-extrabold">Динамика дисциплины за 14 дней</h4>
              <p className="mt-0.5 text-xs text-slate-500">Кто растёт, а кто просел относительно предыдущих двух недель</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[...risers.slice(0, 3), ...risers.slice(-3).reverse()].filter((r, i, arr) => arr.findIndex((x) => x.u.id === r.u.id) === i).map((r) => (
                  <div key={r.u.id} className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5">
                    <Avatar name={r.u.name} color={r.u.color} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{r.u.name}</span>
                    <Trend v={r.trend} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <Modal open={!!openRow} onClose={() => setOpen(null)} wide title={openRow?.u.name ?? ""} subtitle={openRow ? `${roleMeta(openRow.u.role).label} · ${openRow.u.spec} · место ${openRow.rank} из ${base.length}` : ""}>
        {openRow ? (
          <RowDetail
            row={openRow}
            range={range}
            onManage={() => { setOpen(null); onManage(openRow.u.id); }}
            onPromote={() => {
              const next = openRow.u.role === "intern" ? "junior" : openRow.u.role === "junior" ? "techmentor" : null;
              if (!next) return;
              setUserRole(openRow.u.id, next, `Повышение по итогам рейтинга: ${openRow.s.percent}%`);
              pushToast({ kind: "success", title: `Грейд повышен: ${roleMeta(next).label}`, text: openRow.u.name });
              setOpen(null);
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function RowDetail({ row, range, onManage, onPromote }: { row: Row; range: Range; onManage: () => void; onPromote: () => void }) {
  const { state } = useGuild();
  const today = todayISO();
  const strip = workdaysBetween(addDays(today, -27), today).slice(-20);
  const grades = state.grades.filter((g) => g.userName === row.u.name);
  const recs = state.recs.filter((r) => r.userId === row.u.id);
  const next = row.u.role === "intern" ? "Гильдиец (Junior)" : row.u.role === "junior" ? "Технаставник" : null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-2xl font-extrabold text-emerald-600">{row.s.percent}%</p><p className="text-[10px] font-semibold text-emerald-800">итоговый · {range.label}</p></div>
        <div className="rounded-2xl bg-slate-50 p-3"><p className="text-2xl font-extrabold">{fmt(row.s.total)}<span className="text-sm text-slate-400">/{row.s.maxTotal}</span></p><p className="text-[10px] font-semibold text-slate-500">баллов</p></div>
        <div className="rounded-2xl bg-slate-50 p-3"><p className="text-2xl font-extrabold">{row.s.dailyPercent}%</p><p className="text-[10px] font-semibold text-slate-500">дисциплина дейли</p></div>
        <div className="rounded-2xl bg-slate-50 p-3"><p className="text-2xl font-extrabold">{row.s.sprintPercent}%</p><p className="text-[10px] font-semibold text-slate-500">оценка спринтов</p></div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Дейли · последние 20 рабочих дней</p>
        <div className="mt-2 flex gap-1">
          {strip.map((day) => {
            const st = dayState(row.u.name, state.dailies, day, today);
            const c = st.kind === "ok" ? "bg-emerald-500" : st.kind === "partial" ? "bg-amber-400" : st.kind === "missed" ? "bg-rose-400" : "bg-slate-200";
            return <span key={day} title={`${day}${st.report?.reason ? ` · ${st.report.reason}` : ""}`} className={`h-7 flex-1 rounded-md ${c}`} />;
          })}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-slate-500">вовремя: {row.s.daily.onTime} · 0,5 б.: {row.s.daily.partial} · пропуски: {row.s.daily.missed} · динамика за 14 дн.: <Trend v={row.trend} /></p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Оценки наставников по спринтам</p>
        {grades.length === 0 ? <p className="mt-2 text-xs text-slate-400">Оценок пока нет.</p> : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {grades.map((g) => (
              <div key={g.id} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between"><p className="text-[12px] font-extrabold">{g.sprint} · {g.projectName}</p><span className="text-xs font-extrabold text-amber-600">{gradeSum(g)}/{SPRINT_MAX}</span></div>
                <div className="mt-1.5 space-y-1">
                  {SPRINT_CRIT.map((c) => (
                    <div key={c} className="flex items-center gap-2 text-[10px]">
                      <span className="w-24 font-semibold text-slate-500">{SPRINT_CRIT_LABEL[c]}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-amber-400" style={{ width: `${(g[c] / 5) * 100}%` }} /></div>
                      <b>{g[c]}</b>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {recs.length ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Рекомендации наставников</p>
          {recs.map((r) => <p key={r.id} className="mt-1.5 text-xs text-slate-700"><b>{r.byName}:</b> {r.comment}</p>)}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <Btn variant="secondary" size="sm" onClick={onManage}><Settings2 size={14} /> Управлять участником</Btn>
        {next ? <Btn variant="emerald" size="sm" onClick={onPromote}><Crown size={14} /> Повысить до «{next}»</Btn> : null}
      </div>
    </div>
  );
}
