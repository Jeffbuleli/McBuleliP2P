"use client";

import { AcademyIcon } from "@/components/academy/academy-icon";
import { adminCls } from "@/components/admin/admin-ui";
import type { EventDashboardKpis } from "@/lib/events/types";

type Props = {
  editions: number;
  enrollments: number;
  events: number;
  eventKpis: EventDashboardKpis | null;
  liveOk: boolean;
};

export function AcademyKpiStrip({ editions, enrollments, events, eventKpis, liveOk }: Props) {
  const cards = [
    { icon: "calendar" as const, label: "Cohortes", value: String(editions) },
    { icon: "wallet" as const, label: "Inscrits", value: String(enrollments) },
    { icon: "live" as const, label: "Événements", value: String(eventKpis?.totalEvents ?? events) },
    {
      icon: "signal" as const,
      label: "À venir",
      value: String(eventKpis?.upcomingCount ?? 0),
    },
    {
      icon: "tutor" as const,
      label: "Présence",
      value: `${(eventKpis?.participationRate ?? 0).toFixed(0)}%`,
    },
    {
      icon: "wallet" as const,
      label: "USDT",
      value: (eventKpis?.revenueUsdt ?? 0).toFixed(0),
    },
    { icon: "video" as const, label: "McBuleli Live", value: liveOk ? "OK" : "-" },
  ];

  return (
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
      {cards.map((c) => (
        <div key={c.label} className={`${adminCls.card} flex flex-col items-center py-3 text-center`}>
          <AcademyIcon name={c.icon} className="h-6 w-6" />
          <p className="mt-1 text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">{c.label}</p>
          <p className="text-lg font-black tabular-nums">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
