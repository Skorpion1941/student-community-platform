"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock, Video } from "lucide-react";
import { useGuild, formatDateRU } from "@/lib/store";
import type { InterviewSlot, Vacancy } from "@/lib/types";
import { Btn, EmptyState, Field, Modal, inputCls } from "@/components/ui";

export function ApplyModal({ vacancy, open, onClose }: { vacancy: Vacancy; open: boolean; onClose: () => void }) {
  const { state, currentUser, bookSlot, pushToast } = useGuild();
  const [step, setStep] = useState(1);
  const [telegram, setTelegram] = useState(currentUser.telegram);
  const [roleWant, setRoleWant] = useState<string>(vacancy.spec);
  const [motivation, setMotivation] = useState("");
  const [slotId, setSlotId] = useState("");
  const [day, setDay] = useState("");

  React.useEffect(() => {
    if (open) {
      setStep(1);
      setTelegram(currentUser.telegram);
      setRoleWant(vacancy.spec);
      setMotivation("");
      const free = state.slots.find((s) => s.status === "free");
      setDay(free?.date ?? "");
      setSlotId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vacancy.id]);

  const days = useMemo(() => [...new Set(state.slots.map((s) => s.date))].sort(), [state.slots]);
  const daySlots = state.slots.filter((s) => s.date === day).sort((a, b) => a.time.localeCompare(b.time));
  const chosen: InterviewSlot | undefined = state.slots.find((s) => s.id === slotId);
  const canNext1 = telegram.trim().length >= 3 && roleWant.trim().length >= 2 && motivation.trim().length >= 30;

  function confirm() {
    if (!chosen || chosen.status !== "free") {
      pushToast({ kind: "error", title: "Слот уже занят", text: "Выберите другой свободный слот — сетка обновляется мгновенно." });
      return;
    }
    bookSlot(chosen.id, { vacancyId: vacancy.id, vacancyTitle: vacancy.title, userId: currentUser.id, userName: currentUser.name, telegram, roleWant, motivation });
    pushToast({ kind: "success", title: "Слот собеседования успешно забронирован!", text: `${formatDateRU(chosen.date)} в ${chosen.time} · ${chosen.mentorName}` });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} wide title="Отклик на вакансию" subtitle={`${vacancy.title} · ${vacancy.projectName}`}>
      <div className="mb-5 flex items-center gap-2">
        {["Заявка", "Слот собеседования", "Подтверждение"].map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-emerald-500 text-white" : active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>{done ? <Check size={14} /> : n}</span>
              <span className={`hidden text-xs font-bold sm:block ${active ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
              {n < 3 ? <span className="h-px flex-1 bg-slate-200" /> : null}
            </div>
          );
        })}
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telegram для связи"><input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" className={inputCls} /></Field>
            <Field label="Желаемая роль"><input value={roleWant} onChange={(e) => setRoleWant(e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Мотивационное письмо" hint={`${motivation.trim().length}/30 символов минимум`}>
            <textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} rows={5} placeholder="Опыт, pet-проекты, почему хотите именно сюда…" className={inputCls} />
          </Field>
          <div className="flex justify-end">
            <Btn variant="primary" disabled={!canNext1} onClick={() => setStep(2)}>К выбору слота <ArrowRight size={16} /></Btn>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">1 · Выберите дату</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {days.map((dd) => {
                const free = state.slots.filter((s) => s.date === dd && s.status === "free").length;
                return (
                  <button key={dd} onClick={() => { setDay(dd); setSlotId(""); }} className={`rounded-xl border px-3 py-2 text-left ${day === dd ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}>
                    <span className="block text-xs font-bold">{formatDateRU(dd)}</span>
                    <span className={`text-[11px] font-semibold ${free ? "text-emerald-600" : "text-rose-500"}`}>{free ? `Свободно: ${free}` : "Всё занято"}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">2 · Выберите время</p>
            {daySlots.length === 0 ? <EmptyState title="Нет слотов на дату" text="Технаставники ещё не открыли сетку." /> : (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {daySlots.map((s) => {
                  const isFree = s.status === "free";
                  return (
                    <button key={s.id} disabled={!isFree} onClick={() => setSlotId(s.id)} className={`rounded-xl border p-3 text-left ${slotId === s.id ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : isFree ? "border-slate-200 hover:border-emerald-300" : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"}`}>
                      <span className="flex items-center gap-1.5 text-sm font-extrabold"><Clock size={13} /> {s.time}</span>
                      <span className="mt-1 block truncate text-[11px] text-slate-500">{s.mentorName}</span>
                      <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${isFree ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{isFree ? "Свободно" : "Занято"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Btn variant="ghost" onClick={() => setStep(1)}><ArrowLeft size={16} /> Назад</Btn>
            <Btn variant="primary" disabled={!slotId} onClick={() => setStep(3)}>К подтверждению <ArrowRight size={16} /></Btn>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-[13px] text-slate-600">
            <p className="text-sm font-extrabold text-slate-900">Проверьте заявку</p>
            <div className="mt-2 space-y-1.5">
              <p><b>Вакансия:</b> {vacancy.title}</p>
              <p><b>Кандидат:</b> {currentUser.name} · {telegram}</p>
              <p><b>Роль:</b> {roleWant}</p>
              <p><b>Письмо:</b> {motivation.slice(0, 140)}{motivation.length > 140 ? "…" : ""}</p>
              {chosen ? <p className="flex items-center gap-1.5"><Video size={14} className="text-emerald-600" /> <b>Слот:</b> {formatDateRU(chosen.date)} в {chosen.time} · {chosen.mentorName}</p> : null}
            </div>
          </div>
          <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">После подтверждения слот блокируется мгновенно. Отмена/перенос — не позднее чем за 24 часа в кабинете.</p>
          <div className="flex justify-between">
            <Btn variant="ghost" onClick={() => setStep(2)}><ArrowLeft size={16} /> Назад</Btn>
            <Btn variant="emerald" onClick={confirm}><Check size={16} /> Подтвердить бронь</Btn>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
