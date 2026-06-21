"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AcademyIcon, type AcademyIconName } from "@/components/academy/academy-icon";
import { AcademyKpiStrip } from "@/components/admin/academy-kpi-strip";
import type { EventDashboardKpis } from "@/lib/events/types";

type EditionRow = {
  id: string;
  slug: string;
  titleFr: string;
  status: string;
  enrollmentCount: number;
  sessionCount: number;
};

type OpsData = {
  editions: EditionRow[];
  eventKpis: EventDashboardKpis | null;
  infra: { liveBaseUrl: string | null; embedEnabled: boolean } | null;
};

const QUICK: {
  tab: string;
  icon: AcademyIconName;
  label: string;
}[] = [
  { tab: "overview", icon: "signal", label: "Aperçu" },
  { tab: "program", icon: "calendar", label: "Cohorte" },
  { tab: "lives", icon: "live", label: "Évts" },
  { tab: "enrollments", icon: "wallet", label: "Inscrits" },
  { tab: "leads", icon: "chat", label: "Leads" },
  { tab: "analytics", icon: "tutor", label: "Stats" },
];

export function AcademyStaffHubPanel() {
  const [data, setData] = useState<OpsData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/academy", { credentials: "include" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const eds = (j.editions as EditionRow[]) ?? [];
    setData({
      editions: eds,
      eventKpis: (j.eventKpis as EventDashboardKpis) ?? null,
      infra: j.infra ?? null,
    });
    setSelected((cur) => cur ?? eds[0]?.slug ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalEnrollments = useMemo(
    () => data?.editions.reduce((n, e) => n + e.enrollmentCount, 0) ?? 0,
    [data],
  );
  const totalEvents = useMemo(
    () => data?.editions.reduce((n, e) => n + e.sessionCount, 0) ?? 0,
    [data],
  );
  const liveOk = Boolean(data?.infra?.liveBaseUrl?.trim());

  if (!data) {
    return (
      <div className="rounded-2xl border border-amber-600/30 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <img src="/academy/event-live.svg" alt="" className="h-10 w-10" />
          <Link
            href="/admin/academy"
            className="text-sm font-bold text-stone-900 underline"
          >
            Ops Academy →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AcademyKpiStrip
        editions={data.editions.length}
        enrollments={totalEnrollments}
        events={totalEvents}
        eventKpis={data.eventKpis}
        liveOk={liveOk}
      />

      <div className="flex flex-wrap gap-1.5">
        {data.editions.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setSelected(e.slug)}
            className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold ${
              selected === e.slug
                ? "bg-[#305f33] text-white"
                : "border border-[color:var(--fd-border)] bg-white"
            }`}
          >
            {e.titleFr}
          </button>
        ))}
      </div>

      <nav className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {QUICK.map(({ tab, icon, label }) => (
          <Link
            key={tab}
            href={`/admin/academy?tab=${tab}${selected ? `&edition=${encodeURIComponent(selected)}` : ""}`}
            className="flex flex-col items-center rounded-xl border border-[color:var(--fd-border)] bg-white py-2.5 shadow-sm"
          >
            <AcademyIcon name={icon} className="h-5 w-5" />
            <span className="mt-1 text-[9px] font-extrabold">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
