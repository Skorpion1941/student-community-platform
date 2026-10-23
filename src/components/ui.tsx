"use client";

import React from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  SearchX,
  X,
} from "lucide-react";
import { useGuild } from "@/lib/store";
import type { ToastMsg } from "@/lib/types";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone] ?? tones.slate}`}>
      {children}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "emerald" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const v: Record<string, string> = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    emerald: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white",
  };
  const s: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-6 py-3 text-sm rounded-xl",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${v[variant]} ${s[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${wide ? "max-w-3xl" : "max-w-lg"}`}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 p-5 backdrop-blur sm:p-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <SearchX size={22} />
      </span>
      <h4 className="mt-4 font-bold text-slate-800">{title}</h4>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

export function SkeletonCards({ n = 3 }: { n?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-4 h-9 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function Avatar({ name, color, size = "md" }: { name: string; color: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const s = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-12 text-base" : "size-10 text-sm";
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl font-bold text-white ${color} ${s}`}>{initials}</span>
  );
}

export function Progress({ value, color = "bg-emerald-500" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function ToastIcon({ kind }: { kind: ToastMsg["kind"] }) {
  if (kind === "success") return <CheckCircle2 size={18} className="text-emerald-600" />;
  if (kind === "error") return <AlertTriangle size={18} className="text-rose-600" />;
  if (kind === "warn") return <Bell size={18} className="text-amber-600" />;
  return <Info size={18} className="text-sky-600" />;
}

export function Toasts() {
  const { toasts, dismissToast } = useGuild();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <ToastIcon kind={t.kind} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">{t.title}</p>
            {t.text ? <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t.text}</p> : null}
          </div>
          <button onClick={() => dismissToast(t.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function MatchRing({ value }: { value: number }) {
  const color = value >= 75 ? "text-emerald-600" : value >= 50 ? "text-amber-600" : "text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold ${color} border border-slate-200`}>
      <span className="relative grid size-4 place-items-center">
        <svg viewBox="0 0 20 20" className="size-4 -rotate-90">
          <circle cx="10" cy="10" r="8" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${(value / 100) * 50.2} 50.2`}
            strokeLinecap="round"
          />
        </svg>
      </span>
      {value}% match
    </span>
  );
}

export function Pagination({
  page,
  pages,
  total,
  pageSize,
  onPage,
  onSize,
  sizes = [5, 10, 20, 50],
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  onSize?: (n: number) => void;
  sizes?: number[];
}) {
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
      <p className="text-[11px] font-semibold text-slate-500">
        {from}–{to} из {total}
      </p>
      {onSize ? (
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          На странице
          <select value={pageSize} onChange={(e) => onSize(Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold">
            {sizes.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="ml-auto flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40">‹</button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="px-1 text-xs text-slate-400">…</span>
          ) : (
            <button key={n} onClick={() => onPage(n)} className={`min-w-8 rounded-lg px-2.5 py-1.5 text-xs font-bold ${n === page ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{n}</button>
          )
        )}
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40">›</button>
      </div>
    </div>
  );
}

export function SegTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { id: T; label: string; count?: number; icon?: React.ReactNode }[];
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-bold transition ${value === t.id ? "bg-slate-900 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          {t.icon}
          {t.label}
          {typeof t.count === "number" ? (
            <span className={`rounded-full px-1.5 text-[10px] ${value === t.id ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{t.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function SelectBox({ label, value, options, onChange }: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  const active = options[0]?.v !== value;
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} !py-2 !text-xs ${active ? "!border-emerald-400 !bg-emerald-50/50 font-bold" : ""}`}>
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}
