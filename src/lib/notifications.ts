import type { DemoUser, RoleId } from "./types";
import type { GuildState } from "./store";
import { addDays, isWeekday, sprintEnd, sprintStatusByDate, todayISO } from "./scoring";

export interface Notif {
  id: string;
  title: string;
  text: string;
  href: string;
  tone: "sky" | "emerald" | "amber" | "violet" | "rose";
}

const dm = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

/** Имена студентов/гильдийцев в проектах пользователя, которые ещё не сдали дейли сегодня (только будни) */
export function missingToday(s: GuildState, user: DemoUser): string[] {
  const today = todayISO();
  if (!isWeekday(today)) return [];
  const names = new Set<string>();
  s.projects
    .filter((p) => p.team.some((t) => t.name === user.name))
    .forEach((p) =>
      p.team
        .filter((t) => t.role === "Студент" || t.role === "Гильдиец")
        .forEach((t) => {
          if (!s.dailies.some((d) => d.userName === t.name && d.date === today)) names.add(t.name);
        })
    );
  return [...names];
}

/** Завершённые спринты проектов пользователя, где не у всех участников есть оценка наставника */
export function sprintsToGrade(s: GuildState, user: DemoUser) {
  return s.sprints.filter((sp) => {
    if (sp.status !== "done" && sprintStatusByDate(sp) !== "done") return false;
    const p = s.projects.find((x) => x.id === sp.projectId);
    if (!p || !p.team.some((t) => t.name === user.name)) return false;
    const members = p.team.filter((t) => t.role === "Студент" || t.role === "Гильдиец");
    return members.some((m) => !s.grades.some((g) => g.projectId === sp.projectId && g.sprint === sp.title && g.userName === m.name));
  });
}

export function buildNotifications(role: RoleId, user: DemoUser, s: GuildState): Notif[] {
  const out: Notif[] = [];
  const today = todayISO();

  if (role === "guest") {
    return [{ id: "guest-login", title: "Войдите, чтобы открыть все возможности", text: "Выберите роль в списке «Войти» — права применятся мгновенно, без пароля.", href: "/", tone: "sky" }];
  }

  s.events
    .filter((e) => e.attendees.includes(user.name) && e.date >= today && e.date <= addDays(today, 2))
    .slice(0, 2)
    .forEach((e) => out.push({ id: `ev-${e.id}`, title: `Скоро: ${e.title}`, text: `${dm(e.date)} в ${e.time} · ${e.location}`, href: "/events", tone: "violet" }));

  s.applications
    .filter((a) => a.userId === user.id)
    .forEach((a) => {
      if (a.status === "accepted") out.push({ id: `app-${a.id}-ok`, title: "Вас приняли!", text: a.vacancyTitle, href: "/cabinet", tone: "emerald" });
      else if (a.status === "rejected") out.push({ id: `app-${a.id}-no`, title: "Решение по заявке", text: `${a.vacancyTitle}: ${a.verdict ?? "см. кабинет"}`, href: "/cabinet", tone: "rose" });
      else if (a.status === "booked") {
        const slot = s.slots.find((x) => x.id === a.slotId);
        if (slot) out.push({ id: `app-${a.id}-bk`, title: "Собеседование забронировано", text: `${dm(slot.date)} в ${slot.time} · ${slot.mentorName}`, href: "/cabinet", tone: "sky" });
      }
    });

  if (role === "intern" || role === "junior") {
    const mine = s.projects.find((p) => p.team.some((t) => t.name === user.name));
    if (isWeekday(today) && mine && !s.dailies.some((d) => d.userName === user.name && d.date === today)) {
      out.push({ id: `daily-${today}-${user.id}`, title: "Дейли за сегодня ещё не сдан", text: "Сдайте вовремя — это 1 балл в рейтинг", href: `/projects/${mine.id}?tab=daily`, tone: "amber" });
    }
    s.reviews
      .filter((r) => r.authorName === user.name && (r.status === "changes" || r.status === "done"))
      .forEach((r) => out.push({ id: `rv-${r.id}-${r.status}`, title: r.status === "done" ? "Ревью принято" : "Ревью вернули на правки", text: r.title, href: `/projects/${r.projectId}`, tone: r.status === "done" ? "emerald" : "amber" }));
    if (role === "junior") {
      const n = s.tasks.filter((t) => t.status === "review").length;
      if (n) out.push({ id: `jr-review-${n}`, title: `На первичном ревью: ${n}`, text: "Задачи подопечных ждут вашей проверки", href: "/cabinet", tone: "sky" });
    }
  }

  if (role === "mentor") {
    const miss = missingToday(s, user);
    if (miss.length) out.push({ id: `mn-miss-${today}-${miss.length}`, title: `Не сдали дейли сегодня: ${miss.length}`, text: miss.slice(0, 3).join(", "), href: "/projects", tone: "amber" });
    sprintsToGrade(s, user).slice(0, 2).forEach((sp) => out.push({ id: `mn-grade-${sp.id}`, title: `Оцените ${sp.title}`, text: "Спринт завершён — поставьте оценки и отправьте сводку в орг. отдел", href: "/cabinet", tone: "rose" }));
    const act = s.sprints.filter((sp) => sprintStatusByDate(sp) === "active").length;
    if (act) out.push({ id: `mn-active-${act}`, title: `Идут спринтов: ${act}`, text: "Проверьте дорожную карту и цели недели", href: "/projects", tone: "sky" });
  }

  if (role === "techmentor") {
    const rv = s.reviews.filter((r) => r.status === "sent" || r.status === "todo").length;
    if (rv) out.push({ id: `tm-rv-${rv}`, title: `Ревью ждут технаставника: ${rv}`, text: "Откройте канбан ревью в проекте", href: "/projects", tone: "sky" });
    const rq = s.requests.filter((r) => r.status === "new").length;
    if (rq) out.push({ id: `tm-rq-${rq}`, title: `Новые заявки студентов: ${rq}`, text: "1-on-1, Code Review, воркшопы", href: "/cabinet", tone: "violet" });
    const vd = s.applications.filter((a) => a.status === "booked" || a.status === "pending").length;
    if (vd) out.push({ id: `tm-vd-${vd}`, title: `Вердикты по собеседованиям: ${vd}`, text: "Примите или отклоните кандидатов", href: "/cabinet", tone: "emerald" });
  }

  if (role === "admin") {
    const wait = s.sprints.filter((sp) => (sp.status === "done" || sprintStatusByDate(sp) === "done") && !sp.adminRating).length;
    if (wait) out.push({ id: `ad-wait-${wait}`, title: `Спринты ждут вашей оценки: ${wait}`, text: "Вкладка «Дорожные карты» в панели администратора", href: "/cabinet", tone: "rose" });
    const inbox = s.inbox.filter((m) => !m.done).length;
    if (inbox) out.push({ id: `ad-inbox-${inbox}`, title: `Новых обращений с лендинга: ${inbox}`, text: "Раздел «Статистика» в панели администратора", href: "/cabinet", tone: "sky" });
    const recs = s.recs.length;
    if (recs) out.push({ id: `ad-recs-${recs}`, title: `Рекомендации наставников: ${recs}`, text: "Кандидаты на повышение — в «Грейды и пользователи»", href: "/cabinet", tone: "emerald" });
    const esc = s.escalations.filter((e) => e.status !== "resolved").length;
    if (esc) out.push({ id: `ad-esc-${esc}`, title: `Нерешённых эскалаций: ${esc}`, text: "Проверьте проекты и назначьте ответственных", href: "/projects", tone: "amber" });
    const act = s.sprints.filter((sp) => sprintStatusByDate(sp) === "active" && sprintEnd(sp) >= today).length;
    out.push({ id: `ad-act-${act}`, title: `Активных спринтов: ${act}`, text: "Лидерборд обновляется по дейли и оценкам наставников", href: "/cabinet", tone: "sky" });
  }

  if (out.length === 0) out.push({ id: `all-clear-${role}`, title: "Всё спокойно", text: "Новых уведомлений нет — самое время заглянуть в базу знаний.", href: "/knowledge", tone: "emerald" });
  return out;
}
