"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  Cpu,
  Eye,
  FolderKanban,
  GraduationCap,
  Home,
  LogIn,
  Medal,
  Mail,
  MapPin,
  Menu,
  Phone,
  Building2,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Sprout,
  User,
  UserRound,
  X,
} from "lucide-react";
import { useGuild } from "@/lib/store";
import { NAV_BY_ROLE, ROLES, roleMeta } from "@/lib/rbac";
import type { RoleId } from "@/lib/types";
import { Avatar, Badge } from "./ui";
import { SearchPalette } from "./search-palette";
import { buildNotifications } from "@/lib/notifications";
import { CONTACTS } from "@/lib/contacts";

const NAV_ITEMS = [
  { id: "home", label: "Главная", href: "/", icon: Home },
  { id: "cabinet", label: "Личный кабинет", href: "/cabinet", icon: UserRound },
  { id: "projects", label: "Проекты", href: "/projects", icon: FolderKanban },
  { id: "vacancies", label: "Вакансии", href: "/vacancies", icon: Briefcase },
  { id: "knowledge", label: "База знаний", href: "/knowledge", icon: BookOpen },
  { id: "events", label: "Мероприятия", href: "/events", icon: CalendarDays },
];

function RoleIcon({ icon, size = 16 }: { icon: string; size?: number }) {
  switch (icon) {
    case "eye":
      return <Eye size={size} />;
    case "user":
      return <User size={size} />;
    case "sprout":
      return <Sprout size={size} />;
    case "medal":
      return <Medal size={size} />;
    case "compass":
      return <Compass size={size} />;
    case "cpu":
      return <Cpu size={size} />;
    case "shield":
      return <Shield size={size} />;
    default:
      return <User size={size} />;
  }
}

/** Авторизация в виде выплывающего списка ролей — без логики входа, просто применяются права доступа */
export function AuthRoleDropdown({ compact }: { compact?: boolean }) {
  const { role, setRole, pushToast, currentUser } = useGuild();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = roleMeta(role);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2.5 rounded-xl border transition ${
          open ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        } ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}
      >
        {role === "guest" ? (
          <span className="grid size-8 place-items-center rounded-lg bg-slate-200 text-slate-600">
            <LogIn size={16} />
          </span>
        ) : (
          <Avatar name={currentUser.name} color={currentUser.color} size="sm" />
        )}
        <span className="hidden text-left sm:block">
          <span className="block max-w-[140px] truncate text-[13px] font-bold leading-tight text-slate-900">
            {role === "guest" ? "Войти" : currentUser.name.split(" ").slice(0, 2).join(" ")}
          </span>
          <span className={`block text-[11px] font-semibold leading-tight ${meta.color}`}>{meta.label}</span>
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
            <p className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck size={16} /> Вход по роли · Демо-доступ
            </p>
            <p className="mt-0.5 text-xs text-emerald-50">Без пароля: выберите уровень прав — интерфейс перестроится мгновенно.</p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {ROLES.map((r) => {
              const active = r.id === role;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setRole(r.id as RoleId);
                    setOpen(false);
                    pushToast({
                      kind: "success",
                      title: r.id === "guest" ? "Вы вышли из аккаунта" : `Вы вошли как: ${r.label}`,
                      text: r.description,
                    });
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                    active ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-slate-50"
                  }`}
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${r.bg} ${r.color}`}>
                    <RoleIcon icon={r.icon} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{r.label}</span>
                      {active ? <Check size={14} className="text-emerald-600" /> : null}
                    </span>
                    <span className="block text-[11px] font-semibold text-slate-400">{r.grade} · уровень {r.level}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500">{r.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
            <p className="text-[11px] leading-snug text-slate-500">
              В проде здесь будет «Войти через аккаунт ТПУ» (SSO). Сейчас переключение мгновенно меняет меню, кабинеты и права.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, currentUser, resetDemo, pushToast, state, markNotifRead, markAllNotifsRead } = useGuild();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const allowed = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.guest;

  const notifs = useMemo(() => buildNotifications(role, currentUser, state), [role, currentUser, state]);
  const unread = notifs.filter((n) => !state.readNotifs.includes(n.id));
  const toneDot: Record<string, string> = { sky: "bg-sky-500", emerald: "bg-emerald-500", amber: "bg-amber-500", violet: "bg-violet-500", rose: "bg-rose-500" };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    function onDown(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Меню">
            <Menu size={20} />
          </button>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md">
              <GraduationCap size={20} />
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight text-slate-900">
                Гильдия <span className="text-emerald-600">ЦЭУ · ТПУ</span>
              </span>
              <span className="hidden text-[11px] font-medium text-slate-500 sm:block">IT-сообщество · проекты · карьера</span>
            </span>
          </Link>

          <button
            onClick={() => setSearchOpen(true)}
            className="mx-auto hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-400 transition hover:border-emerald-300 hover:bg-white md:flex"
          >
            <Search size={16} />
            <span className="flex-1">Поиск: вакансии, проекты, статьи, события…</span>
            <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 ring-1 ring-slate-200">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden xl:block">
              <Badge tone="emerald">
                <ShieldCheck size={12} /> {roleMeta(role).label}
              </Badge>
            </span>
            <button onClick={() => setSearchOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 md:hidden" aria-label="Поиск">
              <Search size={17} />
            </button>
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"
                aria-label="Уведомления"
              >
                <Bell size={17} />
                {unread.length > 0 ? (
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{unread.length}</span>
                ) : null}
              </button>
              {notifOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-bold">Уведомления {unread.length ? <span className="text-rose-500">· {unread.length}</span> : null}</p>
                    {unread.length ? (
                      <button onClick={() => markAllNotifsRead(notifs.map((n) => n.id))} className="text-[11px] font-bold text-emerald-700 hover:underline">Прочитать все</button>
                    ) : null}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {notifs.map((n) => {
                      const isNew = !state.readNotifs.includes(n.id);
                      return (
                        <button
                          key={n.id}
                          onClick={() => { markNotifRead(n.id); setNotifOpen(false); router.push(n.href); }}
                          className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50 ${isNew ? "bg-emerald-50/40" : ""}`}
                        >
                          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${isNew ? toneDot[n.tone] : "bg-slate-200"}`} />
                          <span className="min-w-0">
                            <span className={`block text-[13px] ${isNew ? "font-extrabold text-slate-900" : "font-semibold text-slate-600"}`}>{n.title}</span>
                            <span className="block text-xs text-slate-500">{n.text}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <button
              title="Сбросить демо-данные"
              onClick={() => {
                resetDemo();
                pushToast({ kind: "info", title: "Демо-данные сброшены", text: "Всё вернулось к исходному состоянию Гильдии." });
              }}
              className="hidden rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50 sm:block"
            >
              <RotateCcw size={17} />
            </button>
            <AuthRoleDropdown />
          </div>
        </div>
        {/* Mobile nav quick strip */}
        <div className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-white px-4 py-2 lg:hidden">
          {NAV_ITEMS.filter((n) => allowed.includes(n.id)).map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                pathname === n.href ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <n.icon size={13} /> {n.label}
            </Link>
          ))}
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-4">
            <nav className="rounded-2xl border border-slate-200 bg-white p-2">
              {NAV_ITEMS.filter((n) => allowed.includes(n.id)).map((n) => {
                const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <n.icon size={18} />
                    {n.label}
                  </Link>
                );
              })}
              {!allowed.includes("cabinet") ? (
                <p className="px-3 py-2 text-[11px] leading-snug text-slate-400">
                  Войдите через список ролей в шапке, чтобы открыть кабинет и проекты.
                </p>
              ) : null}
            </nav>

            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-600 to-teal-700 p-4 text-white">
              <p className="text-sm font-bold">Карьерный путь</p>
              <p className="mt-1 text-xs text-emerald-50">Кандидат → Студент → Гильдиец → Технаставник → ЦЭУ</p>
              <div className="mt-3 space-y-1.5">
                {["1–3 проекта для Junior", "Дейли без пропусков", "Рекомендация ментора"].map((t) => (
                  <p key={t} className="flex items-center gap-2 text-[11px] font-medium text-emerald-50">
                    <Check size={12} /> {t}
                  </p>
                ))}
              </div>
              <Link href="/cabinet" className="mt-3 block rounded-xl bg-white/15 px-3 py-2 text-center text-xs font-bold hover:bg-white/25">
                Открыть мой роадмап
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Активность Гильдии</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-lg font-extrabold text-slate-900">{state.projects.length}</p>
                  <p className="text-[11px] text-slate-500">проекта</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-lg font-extrabold text-slate-900">{state.vacancies.length}</p>
                  <p className="text-[11px] text-slate-500">вакансий</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-lg font-extrabold text-slate-900">{state.slots.filter((s) => s.status === "free").length}</p>
                  <p className="text-[11px] text-slate-500">слотов</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-lg font-extrabold text-slate-900">{state.articles.length}</p>
                  <p className="text-[11px] text-slate-500">статей</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                {role === "guest" ? "Вы просматриваете как Гость" : `Вы: ${currentUser.name} · ${roleMeta(role).label}`}
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        {sidebarOpen ? (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-slate-950/50" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="font-extrabold">Навигация</p>
                <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>
              <nav className="mt-3 space-y-1">
                {NAV_ITEMS.filter((n) => allowed.includes(n.id)).map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                      pathname === n.href ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <n.icon size={18} /> {n.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
                Роль переключается в шапке — выплывающий список «Войти». Права применяются мгновенно.
              </div>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-8 text-xs text-slate-500 sm:px-6 md:grid-cols-[1.3fr_1fr_1.2fr]">
          <div>
            <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><GraduationCap size={18} className="text-emerald-600" /> Гильдия ЦЭУ · ТПУ</p>
            <p className="mt-2 max-w-sm leading-relaxed">IT-сообщество, инкубатор проектов и образовательная экосистема Центра цифровой трансформации университета.</p>
            <p className="mt-3 text-[11px] text-slate-400">© 2026 Томский политехнический университет</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Разделы</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 font-semibold text-slate-600">
              <Link href="/vacancies" className="hover:text-emerald-700">Вакансии</Link>
              <Link href="/projects" className="hover:text-emerald-700">Проекты</Link>
              <Link href="/knowledge" className="hover:text-emerald-700">База знаний</Link>
              <Link href="/events" className="hover:text-emerald-700">Мероприятия</Link>
              <Link href="/#faq" className="hover:text-emerald-700">Вопросы</Link>
              <Link href="/#contacts" className="hover:text-emerald-700">Контакты</Link>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Контакты орг. отдела</p>
            <div className="mt-2 space-y-1.5 font-semibold text-slate-600">
              <a href={`mailto:${CONTACTS.email}`} className="flex items-center gap-2 hover:text-emerald-700"><Mail size={13} className="text-emerald-600" /> {CONTACTS.email}</a>
              <a href={`tel:${CONTACTS.phoneHref}`} className="flex items-center gap-2 hover:text-emerald-700"><Phone size={13} className="text-emerald-600" /> {CONTACTS.phone}</a>
              <p className="flex items-center gap-2"><Building2 size={13} className="text-emerald-600" /> {CONTACTS.room}</p>
              <p className="flex items-center gap-2 font-medium text-slate-500"><MapPin size={13} className="text-slate-400" /> {CONTACTS.address}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center text-[11px] text-slate-400">Демо: авторизация — выплывающий список ролей в шапке. Данные хранятся локально в браузере.</div>
      </footer>
    </div>
  );
}
