"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminCls } from "@/components/admin/admin-ui";
import type { EventDashboardKpis } from "@/lib/events/types";

export function EventsAdminDashboard() {
  const [kpis, setKpis] = useState<EventDashboardKpis | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/events/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.kpis) setKpis(d.kpis as EventDashboardKpis);
        else setErr(d.error ?? "load_failed");
      })
      .catch(() => setErr("load_failed"));
  }, []);

  if (err) return <p className={adminCls.card}>{err}</p>;
  if (!kpis) return <p className={adminCls.card}>…</p>;

  const cards = [
    { label: "Événements", value: kpis.totalEvents },
    { label: "Inscrits", value: kpis.enrolledParticipants },
    { label: "Présents", value: kpis.attendedParticipants },
    { label: "Taux présence", value: `${kpis.participationRate.toFixed(1)}%` },
    { label: "Revenus USDT", value: kpis.revenueUsdt.toFixed(2) },
    { label: "À venir", value: kpis.upcomingCount },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={adminCls.card}>
            <p className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">{c.label}</p>
            <p className="mt-2 text-2xl font-black tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-[color:var(--fd-muted)]">
        API : <code>POST /api/events</code> · <code>POST /api/events/:id/publish</code> · affiches{" "}
        <code>/api/events/:slug/poster</code>
      </p>
      <Link href="/admin/academy" className="text-sm font-semibold text-[color:var(--fd-primary)]">
        ← Academy Live
      </Link>
    </div>
  );
}
