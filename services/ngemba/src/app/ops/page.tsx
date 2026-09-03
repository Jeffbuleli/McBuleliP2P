"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SlaBar, UrgencyDonut } from "@/components/charts/ops-charts";
import {
  categoryLabelFr,
  providerLabelFr,
  routingLabelFr,
  sourceLabelFr,
  statusLabelFr,
  urgencyLabelFr,
} from "@/lib/labels";
import type { OpsRole } from "@/lib/ops/roles";
import { dashboardHint } from "@/lib/ops/roles";
import { shellMaxWidth, useDeviceClass } from "@/lib/ui/device";

type Row = {
  id: string;
  status: string;
  urgency: string;
  category: string;
  message: string;
  commune: string | null;
  locationLabel: string | null;
  aiSummary: string;
  provider: string;
  routingQueue: string;
  assignedTo: string | null;
  createdAt: string;
  source: string;
  discreteMode?: boolean;
  routingMeta?: {
    scope: "local" | "national_fallback" | "unassigned";
    provinceName: string | null;
  } | null;
  sla?: {
    label: string;
    breached: boolean;
    escalated: boolean;
    remainingMs: number | null;
  };
};

function badge(u: string) {
  if (u === "critical" || u === "high") return "bg-red-50 text-ng-urgent";
  if (u === "medium") return "bg-amber-50 text-ng-warning";
  return "bg-ng-primary-muted text-ng-primary";
}

function preview(text: string, max = 120) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export default function OpsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [role, setRole] = useState<OpsRole>("admin");
  const [roleLabel, setRoleLabel] = useState("Administrateur");
  const [stats, setStats] = useState<{
    total: number;
    critical: number;
    high: number;
    open: number;
    slaBreached?: number;
  } | null>(null);

  const canPatch = role !== "partner";
  const device = useDeviceClass();

  const load = useCallback(async () => {
    const res = await fetch("/api/alerts");
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.sessions ?? []);
    if (data.role) setRole(data.role);
    if (data.stats) setStats(data.stats);
  }, []);

  useEffect(() => {
    void fetch("/api/ops/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.roleLabel) setRoleLabel(d.roleLabel);
        if (d.role) setRole(d.role);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const es = new EventSource("/api/ops/stream");
    es.addEventListener("connected", () => setLive(true));
    es.addEventListener("alert_created", () => void load());
    es.addEventListener("alert_updated", () => void load());
    es.addEventListener("alert_escalated", () => void load());
    es.onerror = () => setLive(false);
    return () => es.close();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    try {
      await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch("/api/ops/auth", { method: "DELETE" });
    window.location.href = "/ops/login";
  }

  const open = rows.filter(
    (r) => r.status !== "closed" && r.status !== "cancelled",
  );
  const closed = rows.filter(
    (r) => r.status === "closed" || r.status === "cancelled",
  );

  const urgencySlices = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const r of open) {
      if (r.urgency === "critical") counts.critical += 1;
      else if (r.urgency === "high") counts.high += 1;
      else if (r.urgency === "medium") counts.medium += 1;
      else counts.low += 1;
    }
    return [
      { id: "critical", label: "Critiques", value: counts.critical, color: "#c41e3a" },
      { id: "high", label: "Élevées", value: counts.high, color: "#d97706" },
      { id: "medium", label: "Moyennes", value: counts.medium, color: "#882364" },
      { id: "low", label: "Basses", value: counts.low, color: "#06402b" },
    ];
  }, [open]);

  const slaBreached = stats?.slaBreached ?? 0;
  const slaOk = Math.max((stats?.open ?? open.length) - slaBreached, 0);

  return (
    <main
      className={`ng-shell mx-auto min-h-dvh py-6 ${shellMaxWidth(device)}`}
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-ng-primary uppercase">
            NGEMBA OPS
          </p>
          <h1 className="text-lg font-semibold text-ng-text">
            File active
          </h1>
          <p className="text-xs font-medium text-ng-primary">{roleLabel}</p>
          <p className="text-xs text-ng-muted">{dashboardHint(role)}</p>
          <p className="text-xs text-ng-muted">
            {live ? "Temps réel actif" : "Temps réel inactif"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {role === "admin" ? (
            <Link
              href="/ops/partners"
              className="text-sm font-semibold text-ng-primary"
            >
              Partenaires
            </Link>
          ) : null}
          <Link
            href="/ops/observatory"
            className="text-sm font-semibold text-ng-primary"
          >
            Observatoire
          </Link>
          <Link href="/" className="text-sm text-ng-muted">
            App
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-sm text-ng-muted"
          >
            Quitter
          </button>
        </div>
      </header>

      <section className="mt-5 grid gap-4 rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4 md:grid-cols-2">
        <UrgencyDonut
          slices={urgencySlices}
          centerLabel="Ouvertes"
          centerValue={stats?.open ?? open.length}
        />
        <div className="flex flex-col justify-center gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase text-ng-muted">
                Visibles
              </p>
              <p className="text-lg font-bold text-ng-text">
                {stats?.total ?? rows.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-ng-muted">
                Critiques
              </p>
              <p className="text-lg font-bold text-ng-urgent">
                {stats?.critical ?? urgencySlices[0]?.value ?? 0}
              </p>
            </div>
          </div>
          <SlaBar
            ok={slaOk}
            breached={slaBreached}
            okLabel="SLA OK"
            breachedLabel="Dépassés"
          />
        </div>
      </section>

      <ul className="mt-6 space-y-3">
        {open.length === 0 ? (
          <li className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4 text-sm text-ng-muted">
            Aucune alerte active.
          </li>
        ) : (
          open.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge(r.urgency)}`}
                >
                  {urgencyLabelFr(r.urgency)}
                </span>
                <span className="text-xs font-medium text-ng-primary">
                  {categoryLabelFr(r.category)}
                </span>
                <span className="text-xs text-ng-muted">
                  {sourceLabelFr(r.source)}
                </span>
                <span className="text-xs text-ng-muted">
                  {statusLabelFr(r.status)}
                </span>
                {r.discreteMode ? (
                  <span className="rounded-full bg-[#2a1524] px-2.5 py-0.5 text-[11px] font-semibold text-[#c9a0bc]">
                    Discret
                  </span>
                ) : null}
                {r.routingMeta?.scope === "national_fallback" ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                    Hors zone
                  </span>
                ) : null}
                {r.routingMeta?.scope === "local" ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    Local
                  </span>
                ) : null}
                {r.sla?.escalated ? (
                  <span className="rounded-full bg-ng-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold text-ng-urgent">
                    Escalade
                  </span>
                ) : r.sla?.breached ? (
                  <span className="rounded-full bg-ng-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold text-ng-urgent">
                    SLA dépassé
                  </span>
                ) : r.sla?.label ? (
                  <span className="rounded-full bg-ng-primary-muted px-2.5 py-0.5 text-[11px] font-semibold text-ng-primary">
                    {r.sla.label}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-ng-text">
                {preview(r.message)}
              </p>
              <p className="mt-1 text-xs text-ng-muted">
                {r.locationLabel || r.commune || "Sans lieu"} -{" "}
                {routingLabelFr(r.routingQueue)} - {providerLabelFr(r.provider)}
                {r.assignedTo ? ` - ${r.assignedTo}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/ops/${r.id}`}
                  className="rounded-lg bg-ng-primary px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Dossier
                </Link>
                {canPatch ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() =>
                        void patch(r.id, {
                          status: "oriented",
                          assignedTo: "ops-local",
                        })
                      }
                      className="rounded-lg border border-[var(--ng-border)] px-3 py-1.5 text-xs font-semibold text-ng-primary disabled:opacity-50"
                    >
                      Prendre
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void patch(r.id, { status: "closed" })}
                      className="rounded-lg border border-[var(--ng-border)] px-3 py-1.5 text-xs font-semibold text-ng-muted disabled:opacity-50"
                    >
                      Clôturer
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>

      {closed.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-ng-muted">Clôturées</h2>
          <ul className="mt-3 space-y-2">
            {closed.slice(0, 10).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/ops/${r.id}`}
                  className="text-xs text-ng-muted hover:text-ng-primary"
                >
                  {urgencyLabelFr(r.urgency)} - {categoryLabelFr(r.category)} -{" "}
                  {preview(r.message, 60)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
