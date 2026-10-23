"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Crown, FolderKanban, History, Plus, Search, Settings2, UserMinus, UserPlus, Users } from "lucide-react";
import { useGuild } from "@/lib/store";
import { GRADE_BY_ROLE, MANAGEABLE_ROLES, ROLES, roleMeta } from "@/lib/rbac";
import { semesterRange, summarize, todayISO } from "@/lib/scoring";
import type { DemoUser, RoleId } from "@/lib/types";
import { Avatar, Badge, Btn, Card, EmptyState, Field, Modal, Pagination, SegTabs, SelectBox, inputCls } from "@/components/ui";

const STATUS: Record<string, { l: string; tone: string }> = {
  active: { l: "Активен", tone: "emerald" },
  paused: { l: "Приостановлен", tone: "amber" },
  alumni: { l: "Выпускник", tone: "slate" },
};

const ORDER: RoleId[] = ["candidate", "intern", "junior", "mentor", "techmentor", "admin"];
const SPECS = ["Backend", "Frontend", "Аналитика", "Тестирование", "UI/UX", "PM", "Орг. отдел"];
const COLORS = ["bg-sky-500", "bg-emerald-500", "bg-indigo-500", "bg-amber-500", "bg-violet-500", "bg-pink-500", "bg-teal-600", "bg-orange-500"];

const toneForRole = (r: RoleId) => (r === "admin" ? "rose" : r === "techmentor" ? "violet" : r === "mentor" ? "amber" : r === "junior" ? "indigo" : r === "intern" ? "emerald" : "sky");

export function AdminUsers({ focusId, onFocusDone }: { focusId: string | null; onFocusDone: () => void }) {
  const { state, setUserRole, pushToast } = useGuild();
  const today = todayISO();
  const range = semesterRange(0);
  const [query, setQuery] = useState("");
  const [roleF, setRoleF] = useState("all");
  const [specF, setSpecF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [manageId, setManageId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const effManage = manageId ?? focusId;
  const close = () => {
    setManageId(null);
    onFocusDone();
  };

  const specs = [...new Set(state.users.map((u) => u.spec))];
  const filtered = useMemo(() => {
    let rows = state.users;
    if (roleF !== "all") rows = rows.filter((u) => u.role === roleF);
    if (specF !== "all") rows = rows.filter((u) => u.spec === specF);
    if (statusF !== "all") rows = rows.filter((u) => (u.status ?? "active") === statusF);
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((u) => (u.name + u.spec + u.institute + u.telegram).toLowerCase().includes(q));
    }
    return rows;
  }, [state.users, roleF, specF, statusF, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * size, cur * size);
  const allOnPage = slice.length > 0 && slice.every((u) => selected.includes(u.id));
  const roleCounts = ORDER.map((r) => ({ r, n: state.users.filter((u) => u.role === r).length }));

  function nextRole(r: RoleId): RoleId | null {
    const i = ORDER.indexOf(r);
    return i >= 0 && i < ORDER.length - 2 ? ORDER[i + 1] : null; // выше техналставника массово не повышаем
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-60 flex-1">
            <h3 className="flex items-center gap-2 font-extrabold"><Users size={18} className="text-indigo-600" /> Управление грейдами и пользователями</h3>
            <p className="mt-0.5 text-xs text-slate-500">Меняйте грейд с указанием причины, правьте профиль, назначайте и снимайте с проектов. Все смены грейда попадают в историю.</p>
          </div>
          <Btn variant="emerald" size="sm" onClick={() => setAddOpen(true)}><UserPlus size={15} /> Добавить участника</Btn>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button onClick={() => { setRoleF("all"); setPage(1); }} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${roleF === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Все · {state.users.length}</button>
          {roleCounts.map(({ r, n }) => (
            <button key={r} onClick={() => { setRoleF(r); setPage(1); }} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${roleF === r ? "bg-slate-900 text-white" : `${roleMeta(r).bg} ${roleMeta(r).color} hover:opacity-80`}`}>{roleMeta(r).short} · {n}</button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Поиск</span>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Имя, Telegram, институт…" className={`${inputCls} !py-2 !pl-9 !text-xs`} />
            </div>
          </div>
          <SelectBox label="Грейд" value={roleF} onChange={(v) => { setRoleF(v); setPage(1); }} options={[{ v: "all", l: "Все грейды" }, ...ORDER.map((r) => ({ v: r, l: roleMeta(r).label }))]} />
          <SelectBox label="Направление" value={specF} onChange={(v) => { setSpecF(v); setPage(1); }} options={[{ v: "all", l: "Все направления" }, ...specs.map((s) => ({ v: s, l: s }))]} />
          <SelectBox label="Статус" value={statusF} onChange={(v) => { setStatusF(v); setPage(1); }} options={[{ v: "all", l: "Любой статус" }, { v: "active", l: "Активен" }, { v: "paused", l: "Приостановлен" }, { v: "alumni", l: "Выпускник" }]} />
        </div>
        {selected.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 p-3 ring-1 ring-indigo-200">
            <p className="text-xs font-bold text-indigo-900">Выбрано: {selected.length}</p>
            <Btn variant="emerald" size="sm" onClick={() => setBulkOpen(true)}><ArrowUp size={14} /> Повысить грейд</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setSelected([])}>Снять выделение</Btn>
          </div>
        ) : null}
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="Никого не нашли" text="Измените фильтры или добавьте нового участника." action={<Btn variant="secondary" size="sm" onClick={() => { setRoleF("all"); setSpecF("all"); setStatusF("all"); setQuery(""); }}>Сбросить фильтры</Btn>} />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="p-3"><input type="checkbox" checked={allOnPage} onChange={(e) => setSelected((s) => (e.target.checked ? [...new Set([...s, ...slice.map((u) => u.id)])] : s.filter((id) => !slice.some((u) => u.id === id))))} className="accent-emerald-600" /></th>
                  <th className="p-3">Участник</th>
                  <th className="p-3">Грейд</th>
                  <th className="p-3">Направление</th>
                  <th className="p-3">Учёба</th>
                  <th className="p-3">Проекты</th>
                  <th className="p-3">Итоговый %</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {slice.map((u) => {
                  const projects = state.projects.filter((p) => p.team.some((t) => t.name === u.name));
                  const sum = u.role === "intern" || u.role === "junior" ? summarize(u.name, state.dailies, state.grades, state.sprints, range, today) : null;
                  const st = STATUS[u.status ?? "active"];
                  const rec = state.recs.filter((r) => r.userId === u.id).length;
                  return (
                    <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="p-3"><input type="checkbox" checked={selected.includes(u.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, u.id] : s.filter((x) => x !== u.id)))} className="accent-emerald-600" /></td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} color={u.color} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-extrabold">{u.name}</p>
                            <p className="truncate text-[11px] text-slate-400">{u.telegram || "—"}{rec ? ` · рекомендаций: ${rec}` : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3"><Badge tone={toneForRole(u.role)}>{roleMeta(u.role).label}</Badge></td>
                      <td className="p-3 font-semibold text-slate-600">{u.spec}</td>
                      <td className="p-3 text-slate-500">{u.institute} · {u.course}</td>
                      <td className="p-3 font-bold">{projects.length}</td>
                      <td className="p-3 font-extrabold">{sum && sum.maxTotal ? `${sum.percent}%` : <span className="font-medium text-slate-300">—</span>}</td>
                      <td className="p-3"><Badge tone={st.tone}>{st.l}</Badge></td>
                      <td className="p-3 text-right"><Btn variant="outline" size="sm" onClick={() => setManageId(u.id)}><Settings2 size={13} /> Управлять</Btn></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={cur} pages={pages} total={filtered.length} pageSize={size} onPage={setPage} onSize={(n) => { setSize(n); setPage(1); }} sizes={[5, 10, 20, 50]} />
        </Card>
      )}

      <Card className="p-5">
        <h4 className="flex items-center gap-2 font-extrabold"><History size={16} className="text-slate-500" /> Последние изменения грейдов</h4>
        {state.gradeHistory.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">Изменений пока нет. Они появятся здесь после первой смены грейда.</p>
        ) : (
          <div className="mt-3 space-y-1.5">
            {state.gradeHistory.slice(0, 6).map((h) => (
              <p key={h.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600"><b>{h.userName}</b>: {h.from} → <b className="text-emerald-700">{h.to}</b> · {h.date} · {h.comment}</p>
            ))}
          </div>
        )}
      </Card>

      <Modal open={!!effManage} onClose={close} wide title="Управление участником" subtitle="Грейд, профиль, проекты и история">
        {effManage ? <ManageUser key={effManage} userId={effManage} onClose={close} /> : null}
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Добавить участника" subtitle="Новый пользователь сразу появится в списке">
        <AddUser onDone={() => setAddOpen(false)} />
      </Modal>

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Массовое повышение грейда" subtitle={`Выбрано участников: ${selected.length}`}>
        <div className="space-y-3">
          {selected.map((id) => {
            const u = state.users.find((x) => x.id === id);
            if (!u) return null;
            const nx = nextRole(u.role);
            return (
              <div key={id} className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5 text-xs">
                <Avatar name={u.name} color={u.color} size="sm" />
                <span className="min-w-0 flex-1 truncate font-bold">{u.name}</span>
                <span className="text-slate-500">{roleMeta(u.role).short}</span>
                <span>→</span>
                <span className={`font-extrabold ${nx ? "text-emerald-700" : "text-slate-300"}`}>{nx ? roleMeta(nx).short : "без изменений"}</span>
              </div>
            );
          })}
          <div className="flex gap-2">
            <Btn variant="ghost" className="flex-1" onClick={() => setBulkOpen(false)}>Отмена</Btn>
            <Btn
              variant="emerald"
              className="flex-1"
              onClick={() => {
                let n = 0;
                selected.forEach((id) => {
                  const u = state.users.find((x) => x.id === id);
                  const nx = u ? nextRole(u.role) : null;
                  if (u && nx) {
                    setUserRole(u.id, nx, "Массовое повышение грейда администратором");
                    n++;
                  }
                });
                setBulkOpen(false);
                setSelected([]);
                pushToast({ kind: "success", title: `Грейд повышен: ${n} участник(ов)`, text: "Изменения записаны в историю." });
              }}
            >
              <Crown size={15} /> Подтвердить
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= Окно управления ================= */

function ManageUser({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { state, setUserRole, updateUser, addMember, removeMember, pushToast } = useGuild();
  const [tab, setTab] = useState<"grade" | "profile" | "projects" | "history">("grade");
  const u = state.users.find((x) => x.id === userId);
  const [target, setTarget] = useState<RoleId>(u?.role ?? "candidate");
  const [reason, setReason] = useState("");
  const [form, setForm] = useState({ spec: u?.spec ?? "", institute: u?.institute ?? "", course: u?.course ?? "", hours: u?.hoursPerWeek ?? 5, status: u?.status ?? "active", note: u?.note ?? "", telegram: u?.telegram ?? "" });
  const [projId, setProjId] = useState(state.projects[0]?.id ?? "");
  const [projRole, setProjRole] = useState("Студент");
  if (!u) return null;

  const range = semesterRange(0);
  const sum = summarize(u.name, state.dailies, state.grades, state.sprints, range);
  const projects = state.projects.filter((p) => p.team.some((t) => t.name === u.name));
  const available = state.projects.filter((p) => !p.team.some((t) => t.name === u.name));
  const history = state.gradeHistory.filter((h) => h.userId === u.id);
  const recs = state.recs.filter((r) => r.userId === u.id);
  const idx = ORDER.indexOf(u.role);
  const chosenProj = available.find((p) => p.id === projId) ?? available[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-3">
        <Avatar name={u.name} color={u.color} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold">{u.name}</p>
          <p className="text-xs text-slate-500">{u.grade} · {u.spec} · {u.institute}, {u.course}</p>
        </div>
        {sum.maxTotal ? <div className="text-center"><p className="text-2xl font-extrabold text-emerald-600">{sum.percent}%</p><p className="text-[10px] font-semibold text-slate-500">итоговый</p></div> : null}
      </div>

      <SegTabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "grade", label: "Грейд", icon: <Crown size={14} /> },
          { id: "profile", label: "Профиль", icon: <Settings2 size={14} /> },
          { id: "projects", label: "Проекты", icon: <FolderKanban size={14} />, count: projects.length },
          { id: "history", label: "История", icon: <History size={14} />, count: history.length },
        ]}
      />

      {tab === "grade" ? (
        <div className="space-y-3">
          {recs.length ? (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-700">Рекомендации наставников</p>
              {recs.map((r) => <p key={r.id} className="mt-1 text-xs text-slate-700"><b>{r.byName}:</b> {r.comment}</p>)}
            </div>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {ORDER.map((r) => {
              const m = roleMeta(r);
              const active = target === r;
              return (
                <button key={r} onClick={() => setTarget(r)} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${active ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"}`}>
                  <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${m.bg} ${m.color}`}>{m.level}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[13px] font-extrabold">{m.label} {r === u.role ? <Badge tone="slate">сейчас</Badge> : null}</span>
                    <span className="block text-[11px] leading-snug text-slate-500">{m.grade}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn variant="outline" size="sm" disabled={idx <= 0} onClick={() => setTarget(ORDER[Math.max(0, idx - 1)])}><ArrowDown size={14} /> Понизить на шаг</Btn>
            <Btn variant="outline" size="sm" disabled={idx >= ORDER.length - 1} onClick={() => setTarget(ORDER[Math.min(ORDER.length - 1, idx + 1)])}><ArrowUp size={14} /> Повысить на шаг</Btn>
          </div>
          <Field label="Причина изменения (обязательно)" hint="Попадёт в историю грейдов и будет видна в журнале">
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className={inputCls} placeholder="Например: 2 проекта без срывов, итоговый 91%, рекомендация наставника" />
          </Field>
          <Btn
            variant="emerald"
            className="w-full"
            disabled={target === u.role || reason.trim().length < 5}
            onClick={() => {
              setUserRole(u.id, target, reason.trim());
              pushToast({ kind: "success", title: `Грейд изменён: ${GRADE_BY_ROLE[target]}`, text: `${u.name} · ${reason.trim()}` });
              setReason("");
            }}
          >
            <Check size={16} /> {target === u.role ? "Выберите новый грейд" : `Изменить грейд на «${roleMeta(target).label}»`}
          </Btn>
        </div>
      ) : null}

      {tab === "profile" ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Направление">
              <select value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} className={inputCls}>
                {[...new Set([form.spec, ...SPECS])].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Статус">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "paused" | "alumni" })} className={inputCls}>
                <option value="active">Активен</option>
                <option value="paused">Приостановлен</option>
                <option value="alumni">Выпускник</option>
              </select>
            </Field>
            <Field label="Институт / школа"><input value={form.institute} onChange={(e) => setForm({ ...form, institute: e.target.value })} className={inputCls} /></Field>
            <Field label="Курс"><input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} className={inputCls} /></Field>
            <Field label="Telegram"><input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} className={inputCls} /></Field>
            <Field label={`Загрузка: ${form.hours} ч/нед`}><input type="range" min={2} max={20} value={form.hours} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} className="w-full accent-emerald-600" /></Field>
          </div>
          <Field label="Заметка орг. отдела (видна только админам)"><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className={inputCls} /></Field>
          <Btn
            variant="emerald"
            className="w-full"
            onClick={() => {
              updateUser(u.id, { spec: form.spec, institute: form.institute, course: form.course, status: form.status, note: form.note, telegram: form.telegram, hoursPerWeek: form.hours });
              pushToast({ kind: "success", title: "Профиль участника обновлён", text: u.name });
            }}
          >
            <Check size={16} /> Сохранить профиль
          </Btn>
        </div>
      ) : null}

      {tab === "projects" ? (
        <div className="space-y-3">
          {projects.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Участник пока не состоит ни в одном проекте.</p> : projects.map((p) => {
            const m = p.team.find((t) => t.name === u.name);
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-extrabold">{p.name}</p>
                  <p className="text-[11px] text-slate-500">{m?.role} · {m?.spec} · {p.status}</p>
                </div>
                <Btn variant="outline" size="sm" onClick={() => { removeMember(p.id, u.name); pushToast({ kind: "warn", title: "Участник снят с проекта", text: `Вакансия «${m?.role} — ${m?.spec}» открыта автоматически.` }); }}><UserMinus size={13} /> Снять с проекта</Btn>
              </div>
            );
          })}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3">
            <p className="text-xs font-extrabold">Назначить на проект</p>
            {available.length === 0 ? <p className="mt-1 text-xs text-slate-500">Участник уже состоит во всех проектах.</p> : (
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <select value={chosenProj?.id ?? ""} onChange={(e) => setProjId(e.target.value)} className={inputCls}>{available.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                <select value={projRole} onChange={(e) => setProjRole(e.target.value)} className={inputCls}>{["Студент", "Гильдиец", "Наставник", "Технаставник"].map((r) => <option key={r}>{r}</option>)}</select>
                <Btn variant="emerald" size="md" disabled={!chosenProj} onClick={() => { if (!chosenProj) return; addMember(chosenProj.id, { userId: u.id, name: u.name, role: projRole, spec: u.spec }); pushToast({ kind: "success", title: "Участник назначен на проект", text: `${u.name} · ${projRole} · ${chosenProj.name}` }); }}><Plus size={14} /> Назначить</Btn>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tab === "history" ? (
        history.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Грейд этого участника ещё не менялся.</p> : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                <p className="font-extrabold">{h.from} → <span className="text-emerald-700">{h.to}</span></p>
                <p className="text-slate-500">{h.date} · {h.by}</p>
                <p className="mt-1 text-slate-700">{h.comment}</p>
              </div>
            ))}
          </div>
        )
      ) : null}

      <div className="flex justify-end border-t border-slate-100 pt-3"><Btn variant="ghost" onClick={onClose}>Закрыть</Btn></div>
    </div>
  );
}

function AddUser({ onDone }: { onDone: () => void }) {
  const { addUser, pushToast, state } = useGuild();
  const [name, setName] = useState("");
  const [role, setRole] = useState<RoleId>("candidate");
  const [spec, setSpec] = useState("Frontend");
  const [institute, setInstitute] = useState("ИШИТР");
  const [course, setCourse] = useState("1 курс");
  const [telegram, setTelegram] = useState("");
  return (
    <div className="space-y-3">
      <Field label="ФИО"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Иван Иванов" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Грейд">
          <select value={role} onChange={(e) => setRole(e.target.value as RoleId)} className={inputCls}>{MANAGEABLE_ROLES.map((r) => <option key={r} value={r}>{ROLES.find((x) => x.id === r)?.label}</option>)}</select>
        </Field>
        <Field label="Направление"><select value={spec} onChange={(e) => setSpec(e.target.value)} className={inputCls}>{SPECS.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Институт"><input value={institute} onChange={(e) => setInstitute(e.target.value)} className={inputCls} /></Field>
        <Field label="Курс"><input value={course} onChange={(e) => setCourse(e.target.value)} className={inputCls} /></Field>
      </div>
      <Field label="Telegram"><input value={telegram} onChange={(e) => setTelegram(e.target.value)} className={inputCls} placeholder="@username" /></Field>
      <Btn
        variant="emerald"
        className="w-full"
        disabled={name.trim().length < 4}
        onClick={() => {
          const id = `u-${Date.now()}`;
          const user: DemoUser = {
            id,
            name: name.trim(),
            role,
            spec,
            initials: name.trim().split(" ").map((w) => w[0]).slice(0, 2).join(""),
            color: COLORS[state.users.length % COLORS.length],
            bio: "",
            experience: "",
            github: "",
            telegram,
            figma: "",
            portfolio: "",
            skills: [],
            grade: GRADE_BY_ROLE[role],
            projectsCount: 0,
            tasksClosed: 0,
            rating: 0,
            institute,
            course,
            status: "active",
          };
          addUser(user);
          pushToast({ kind: "success", title: "Участник добавлен", text: `${user.name} · ${GRADE_BY_ROLE[role]}` });
          onDone();
        }}
      >
        <UserPlus size={16} /> Добавить
      </Btn>
    </div>
  );
}
