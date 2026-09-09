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
import {
  kpiGridClass,
  opsAlertListClass,
  opsPagePad,
  opsShellMaxWidth,
  useDeviceClass,
} from "@/lib/ui/device";

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

function urgencyBar(u: string) {
  if (u === "critical" || u === "high") return "bg-ng-urgent";
  if (u === "medium") return "bg-ng-warning";
  return "bg-ng-primary";
}

function preview(text: string, max = 120) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function fmtShort(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
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
  const [unitStats, setUnitStats] = useState<{
    total: number;
    available: number;
    assigned: number;
    enRoute: number;
    onScene: number;
    busy: number;
    offline: number;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const canPatch = role !== "partner";
  const device = useDeviceClass();

  const load = useCallback(async () => {
    const res = await fetch("/api/alerts");
    if (!res.ok) {
      setLoaded(true);
      return;
    }
    const data = await res.json();
    setRows(data.sessions ?? []);
    if (data.role) setRole(data.role);
    if (data.stats) setStats(data.stats);
    setLoaded(true);
  }, []);

  const loadUnits = useCallback(async () => {
    const res = await fetch("/api/ops/units");
    if (!res.ok) return;
    const data = await res.json();
    if (data.stats) setUnitStats(data.stats);
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
    void loadUnits();
  }, [load, loadUnits]);

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
      className={`ng-shell mx-auto min-h-dvh ${opsPagePad(device)} ${opsShellMaxWidth(device)}`}
    >
      <header className="overflow-hidden rounded-2xl border border-[var(--ng-border)] bg-ng-surface shadow-[0_12px_32px_-24px_rgba(6,64,43,0.35)]">
        <div className="h-1 bg-ng-primary" />
        <div
          className={`flex gap-4 p-4 ${
            device === "mobile"
              ? "flex-col"
              : "flex-row items-start justify-between"
          }`}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-ng-primary uppercase">
              NGEMBA OPS
            </p>
            <h1
              className={`mt-1 font-semibold tracking-tight text-ng-text ${
                device === "desktop" ? "text-2xl" : "text-lg"
              }`}
            >
              File active
            </h1>
            <p className="mt-1 text-xs font-medium text-ng-primary">{roleLabel}</p>
            <p className="mt-0.5 text-xs text-ng-muted">{dashboardHint(role)}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ng-muted">
              <span
                className={`size-1.5 rounded-full ${live ? "animate-pulse bg-ng-calm" : "bg-ng-muted"}`}
              />
              {live ? "Temps réel actif" : "Temps réel inactif"}
            </p>
          </div>
          <nav
            className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${
              device === "mobile" ? "text-xs" : "text-sm"
            }`}
          >
            {role === "admin" ? (
              <Link href="/ops/partners" className="font-semibold text-ng-primary">
                Partenaires
              </Link>
            ) : null}
            <Link href="/ops/observatory" className="font-semibold text-ng-primary">
              Observatoire
            </Link>
            <Link href="/" className="text-ng-muted hover:text-ng-primary">
              App
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-ng-muted hover:text-ng-primary"
            >
              Quitter
            </button>
          </nav>
        </div>
      </header>

      <section
        className={`mt-5 grid gap-4 ${
          device === "desktop"
            ? "grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
            : device === "tablet"
              ? "grid-cols-2"
              : "grid-cols-1"
        }`}
      >
        <div className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
          <UrgencyDonut
            slices={urgencySlices}
            centerLabel="Ouvertes"
            centerValue={stats?.open ?? open.length}
          />
        </div>
        <div className="flex flex-col justify-center gap-4 rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
          <div className={kpiGridClass(device)}>
            {[
              {
                label: "Visibles",
                value: stats?.total ?? rows.length,
                tone: "text-ng-text",
              },
              {
                label: "Ouvertes",
                value: stats?.open ?? open.length,
                tone: "text-ng-primary",
              },
              {
                label: "Critiques",
                value: stats?.critical ?? urgencySlices[0]?.value ?? 0,
                tone: "text-ng-urgent",
              },
              {
                label: "Élevées",
                value: stats?.high ?? urgencySlices[1]?.value ?? 0,
                tone: "text-ng-warning",
              },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl bg-ng-bg px-3 py-2.5 text-center"
              >
                <p className="text-[10px] font-semibold tracking-wide text-ng-muted uppercase">
                  {c.label}
                </p>
                <p className={`mt-0.5 text-lg font-bold ${c.tone}`}>{c.value}</p>
              </div>
            ))}
          </div>
          <SlaBar
            ok={slaOk}
            breached={slaBreached}
            okLabel="SLA OK"
            breachedLabel="Dépassés"
          />
        </div>
      </section>

      {unitStats ? (
        <section
          className={`mt-4 rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-3 ${
            device === "mobile"
              ? "grid grid-cols-3 gap-2"
              : "grid grid-cols-6 gap-2"
          }`}
        >
          {[
            { label: "Unités", value: unitStats.total },
            { label: "Dispo", value: unitStats.available },
            { label: "Assignées", value: unitStats.assigned },
            { label: "En route", value: unitStats.enRoute },
            { label: "Sur place", value: unitStats.onScene },
            { label: "Offline", value: unitStats.offline + unitStats.busy },
          ].map((c) => (
            <div key={c.label} className="text-center">
              <p className="text-[10px] font-semibold tracking-wide text-ng-muted uppercase">
                {c.label}
              </p>
              <p className="text-base font-bold text-ng-primary">{c.value}</p>
            </div>
          ))}
        </section>
      ) : null}

      <div className="mt-6 flex items-end justify-between gap-3">
        <h2 className="text-sm font-semibold text-ng-text">
          Alertes ouvertes
          <span className="ml-2 text-ng-muted">({open.length})</span>
        </h2>
      </div>

      {!loaded ? (
        <div className={`mt-3 ${opsAlertListClass(device)}`}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-ng-primary-muted/50"
            />
          ))}
        </div>
      ) : (
        <ul className={`mt-3 ${opsAlertListClass(device)}`}>
          {open.length === 0 ? (
            <li className="col-span-full rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-5 text-sm text-ng-muted">
              Aucune alerte active.
            </li>
          ) : (
            open.map((r) => (
              <li
                key={r.id}
                className="overflow-hidden rounded-2xl border border-[var(--ng-border)] bg-ng-surface shadow-[0_8px_24px_-20px_rgba(6,64,43,0.4)] transition hover:border-ng-primary/25"
              >
                <div className={`h-1 ${urgencyBar(r.urgency)}`} />
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge(r.urgency)}`}
                    >
                      {urgencyLabelFr(r.urgency)}
                    </span>
                    <span className="text-xs font-medium text-ng-primary">
                      {categoryLabelFr(r.category)}
                    </span>
                    <span className="font-mono text-[10px] text-ng-muted">
                      {r.id.slice(0, 8).toUpperCase()}
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
                  <p className="mt-2 text-sm leading-snug text-ng-text">
                    {preview(r.message, device === "desktop" ? 160 : 110)}
                  </p>
                  <p className="mt-1.5 text-xs text-ng-muted">
                    {r.locationLabel || r.commune || "Sans lieu"}
                    {r.routingMeta?.provinceName
                      ? ` · ${r.routingMeta.provinceName}`
                      : ""}{" "}
                    · {fmtShort(r.createdAt)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ng-muted">
                    {sourceLabelFr(r.source)} · {statusLabelFr(r.status)} ·{" "}
                    {routingLabelFr(r.routingQueue)} ·{" "}
                    {providerLabelFr(r.provider)}
                    {r.assignedTo ? ` · ${r.assignedTo}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/ops/${r.id}`}
                      className="inline-flex min-h-9 items-center rounded-xl bg-ng-primary px-3 text-xs font-semibold text-white"
                    >
                      Ouvrir dossier
                    </Link>
                    {canPatch && r.status !== "oriented" ? (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() =>
                          void patch(r.id, {
                            status: "oriented",
                            assignedTo: roleLabel || "ops",
                            historyNote: "Prise en charge depuis la file",
                          })
                        }
                        className="inline-flex min-h-9 items-center rounded-xl border border-[var(--ng-border)] px-3 text-xs font-semibold text-ng-primary disabled:opacity-50"
                      >
                        Prendre en charge
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {closed.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-ng-muted">
            Clôturées / annulées
          </h2>
          <ul
            className={`mt-3 ${
              device === "desktop"
                ? "grid grid-cols-2 gap-2"
                : "flex flex-col gap-2"
            }`}
          >
            {closed.slice(0, device === "desktop" ? 16 : 12).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/ops/${r.id}`}
                  className="block rounded-xl border border-[var(--ng-border)] bg-ng-surface/70 px-3 py-2.5 text-xs text-ng-muted transition hover:border-ng-primary/30 hover:text-ng-primary"
                >
                  {statusLabelFr(r.status)} · {urgencyLabelFr(r.urgency)} ·{" "}
                  {categoryLabelFr(r.category)} · {preview(r.message, 60)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
