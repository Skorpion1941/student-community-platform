import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { GuildProvider } from "@/lib/store";
import { AppShell } from "@/components/shell";
import { Toasts } from "@/components/ui";

export const metadata: Metadata = {
  title: "Гильдия ЦЭУ ТПУ — сообщество студентов, проекты и карьера",
  description:
    "Внутренняя IT-платформа Томского политеха: вакансии со смарт-мэтчингом, собеседования, проекты, база знаний, мероприятия и грейды.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <GuildProvider>
          <AppShell>{children}</AppShell>
          <Toasts />
        </GuildProvider>
      </body>
    </html>
  );
}
