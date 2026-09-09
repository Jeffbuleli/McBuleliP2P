"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { SessionChat } from "@/components/session-chat";
import { SessionMediaList } from "@/components/session-media";
import { OpsRoutingPanel } from "@/components/ops-routing-panel";
import { OpsUnitsPanel } from "@/components/ops-units-panel";
import { OpsTrustedContacts } from "@/components/ops-trusted-contacts";
import {
  categoryLabelFr,
  locationSourceLabelFr,
  providerLabelFr,
  routingLabelFr,
  sourceLabelFr,
  statusLabelFr,
  urgencyLabelFr,
} from "@/lib/labels";
import { SCHOOL_CONCERN_LABELS_FR } from "@/lib/school/types";
import type { StatusHistoryEntry } from "@/lib/sessions/store";
import type { TrustedContact } from "@/lib/trusted-contacts/types";
import { shellMaxWidth, useDeviceClass } from "@/lib/ui/device";

type Session = {
  id: string;
  status: string;
  source: string;
  locale: string;
  message: string;
  urgency: string;
  category: string;
  immediateDanger: boolean;
  locationLabel: string | null;
  commune: string | null;
  locationSource: string | null;
  lat: number | null;
  lng: number | null;
  aiSummary: string;
  aiConfidence: number;
  aiPayload: {
    follow_up_questions?: string[];
    ai_disclaimer?: string;
    summary_user_locale?: string;
    missing_info?: string[];
    required_services?: string[];
    people_at_risk?: string[];
    recommended_actions?: string[];
    engine_policy_version?: string;
    engine_reason?: string;
    prompt_version?: string;
  };
  routingQueue: string;
  provider: string;
  aiMode: string;
  operatorNotes: string | null;
  assignedTo: string | null;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  orientedAt: string | null;
  closedAt: string | null;
  discreteMode?: boolean;
  clientIp?: string | null;
  userAgent?: string | null;
  trustedContacts?: TrustedContact[];
  escalation?: {
    level: number;
    escalatedAt: string;
    reason: string;
    fromScope: string;
  } | null;
  routingMeta?: {
    provinceId: string | null;
    provinceName: string | null;
    commune: string | null;
    matchedPartnerIds: string[];
    scope: "local" | "national_fallback" | "unassigned";
    note: string;
  } | null;
  schoolContext?: {
    concernType: string;
    establishmentHint: string | null;
    isMinor: boolean;
  } | null;
  media?: Array<{
    id: string;
    kind: string;
    fileName: string;
    transcription: string | null;
    publicUrl?: string | null;
  }>;
  chatMessages?: Array<{
    id: string;
    role: string;
    body: string;
    createdAt: string;
  }>;
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

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

function workflowStep(status: string): number {
  if (status === "closed" || status === "cancelled") return 3;
  if (status === "oriented") return 2;
  return 1;
}

function WorkflowBar({ status }: { status: string }) {
  const step = workflowStep(status);
  const items = [
    { n: 1, label: "Reçue" },
    { n: 2, label: "En charge" },
    { n: 3, label: status === "cancelled" ? "Annulée" : "Clôturée" },
  ];
  return (
    <ol className="mt-4 grid grid-cols-3 gap-2">
      {items.map((it) => {
        const done = step >= it.n;
        const current = step === it.n;
        return (
          <li
            key={it.n}
            className={`rounded-xl px-2 py-2.5 text-center text-[11px] font-semibold ${
              done
                ? current
                  ? "bg-ng-primary text-white shadow-sm"
                  : "bg-ng-primary-muted text-ng-primary"
                : "bg-ng-bg text-ng-muted ring-1 ring-[var(--ng-border)]"
            }`}
          >
            {it.n}. {it.label}
          </li>
        );
      })}
    </ol>
  );
}

function Section({
  title,
  children,
  accent,
}: {
  title: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-ng-surface ${
        accent
          ? "border-ng-primary/25 shadow-[0_12px_28px_-22px_rgba(6,64,43,0.5)]"
          : "border-[var(--ng-border)]"
      }`}
    >
      <div className="border-b border-[var(--ng-border)] bg-ng-bg/60 px-4 py-2.5">
        <h2 className="text-[11px] font-bold tracking-[0.08em] text-ng-muted uppercase">
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function OpsDossierView({ id }: { id: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [suggestedPartners, setSuggestedPartners] = useState<
    Array<{
      id: string;
      name: string;
      contactHint: string | null;
      nationalFallback: boolean;
    }>
  >([]);
  const [referrals, setReferrals] = useState<{
    requiredServices: string[];
    matches: Array<{
      serviceId: string;
      serviceCode: string;
      serviceName: string;
      organizationName: string | null;
      contactHint: string | null;
      score: number;
      reason: string;
      scope: string;
    }>;
    unmatched: string[];
  } | null>(null);
  const [unitMatches, setUnitMatches] = useState<
    Array<{
      id: string;
      name: string;
      unitType: string;
      status: string;
      organizationName: string | null;
      locationLabel: string | null;
      capabilities: string[];
      score: number;
      reason: string;
      matchedCapabilities: string[];
      etaMinutes: number | null;
    }>
  >([]);
  const [sla, setSla] = useState<{
    label: string;
    breached: boolean;
    escalated: boolean;
    dueAt: string | null;
    remainingMs: number | null;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"not_found" | "forbidden" | "network" | null>(
    null,
  );
  const [canPatch, setCanPatch] = useState(true);
  const [relatedAlerts, setRelatedAlerts] = useState<
    Array<{
      id: string;
      status: string;
      urgency: string;
      createdAt: string;
      source: string;
    }>
  >([]);
  const [events, setEvents] = useState<
    Array<{
      id: string;
      at: string;
      eventType: string;
      status: string | null;
      actor: string | null;
      note: string | null;
    }>
  >([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const device = useDeviceClass();

  const load = useCallback(async () => {
    const res = await fetch(`/api/alerts/${id}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (res.status === 403) {
      setError("forbidden");
      return;
    }
    if (!res.ok || !data.session) {
      setError(res.status === 404 ? "not_found" : "network");
      return;
    }
    setError(null);
    setSession(data.session);
    setSuggestedPartners(data.suggestedPartners ?? []);
    setReferrals(data.referrals ?? null);
    setUnitMatches(data.unitMatches ?? []);
    setSla(data.sla ?? null);
    setNotes(data.session.operatorNotes ?? "");
    setAssignedTo(data.session.assignedTo ?? "");
    setRelatedAlerts(data.relatedAlerts ?? []);
    setEvents(Array.isArray(data.events) ? data.events : []);
  }, [id]);

  useEffect(() => {
    void load();
    void fetch("/api/ops/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.role === "partner") setCanPatch(false);
      })
      .catch(() => undefined);
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(
          data.error === "close_note_required"
            ? "Note obligatoire (min. 3 caractères) pour clôturer ou annuler."
            : "Action impossible. Réessayez.",
        );
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/ops/auth", { method: "DELETE" });
    window.location.href = "/ops/login";
  }

  if (error) {
    return (
      <main className={`ng-shell mx-auto py-10 ${shellMaxWidth(device)}`}>
        <Link href="/ops" className="text-sm text-ng-muted">
          ← File ops
        </Link>
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-5">
          <p className="text-sm font-semibold text-ng-urgent">
            {error === "forbidden"
              ? "Accès refusé pour ce dossier. Utilisez un code opérateur admin ou reconnectez-vous."
              : error === "not_found"
                ? "Dossier introuvable. Vérifiez le lien reçu par email ou consultez la file ops."
                : "Impossible de charger le dossier. Réessayez."}
          </p>
          <Link
            href={`/ops/login?next=${encodeURIComponent(`/ops/${id}`)}`}
            className="mt-3 inline-block text-sm font-medium text-ng-primary underline"
          >
            Se reconnecter
          </Link>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className={`ng-shell mx-auto space-y-4 py-8 ${shellMaxWidth(device)}`}>
        <div className="h-4 w-24 animate-pulse rounded bg-ng-primary-muted" />
        <div className="h-28 animate-pulse rounded-2xl bg-ng-primary-muted/70" />
        <div className="h-40 animate-pulse rounded-2xl bg-ng-primary-muted/50" />
        <div className="h-32 animate-pulse rounded-2xl bg-ng-primary-muted/40" />
      </main>
    );
  }

  const place = session.locationLabel || session.commune || "Sans lieu";
  const open =
    session.status !== "closed" && session.status !== "cancelled";
  const shortId = session.id.slice(0, 8).toUpperCase();
  const maps =
    session.lat != null && session.lng != null
      ? `https://maps.google.com/?q=${session.lat},${session.lng}`
      : null;

  return (
    <main
      className={`ng-shell mx-auto min-h-dvh space-y-4 py-5 pb-28 ${shellMaxWidth(device)}`}
    >
      <header className="overflow-hidden rounded-2xl border border-[var(--ng-border)] bg-ng-surface shadow-[0_12px_32px_-24px_rgba(6,64,43,0.4)]">
        <div className={`h-1.5 ${urgencyBar(session.urgency)}`} />
        <div className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href="/ops" className="text-sm text-ng-muted hover:text-ng-primary">
              ← File ops
            </Link>
            <span className="rounded-lg bg-ng-bg px-2 py-1 font-mono text-[10px] font-semibold tracking-wide text-ng-primary">
              {shortId}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-ng-text">
              {categoryLabelFr(session.category)}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge(session.urgency)}`}
            >
              {urgencyLabelFr(session.urgency)}
            </span>
            <span className="rounded-full bg-ng-primary-muted px-2.5 py-0.5 text-[11px] font-semibold text-ng-primary">
              {statusLabelFr(session.status)}
            </span>
            {session.discreteMode ? (
              <span className="rounded-full bg-[#2a1524] px-2.5 py-0.5 text-[11px] font-semibold text-[#c9a0bc]">
                Discret
              </span>
            ) : null}
            {session.source === "school" || session.schoolContext ? (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                Safe School
              </span>
            ) : null}
            {sla?.escalated || sla?.breached ? (
              <span className="rounded-full bg-ng-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold text-ng-urgent">
                {sla.escalated ? "Escalade" : "SLA dépassé"}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-medium text-ng-primary">{place}</p>
          <p className="mt-0.5 text-xs text-ng-muted">
            {sourceLabelFr(session.source)} · {fmt(session.createdAt)}
            {sla?.label ? ` · SLA ${sla.label}` : ""}
          </p>
          <WorkflowBar status={session.status} />
        </div>
      </header>

      {session.immediateDanger ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-ng-urgent">
          Danger immédiat signalé — prioriser la sécurité et les numéros
          d&apos;urgence locaux.
        </p>
      ) : null}
      {session.escalation ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          {session.escalation.reason}
        </p>
      ) : null}

      <Section title="1 · Situation" accent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ng-text">
          {session.message === "·"
            ? "(Message vocal ou photo sans texte)"
            : session.message}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-ng-muted">
          <span className="rounded-lg bg-ng-bg px-2 py-1">
            {categoryLabelFr(session.category)}
          </span>
          <span className="rounded-lg bg-ng-bg px-2 py-1">
            {sourceLabelFr(session.source)}
          </span>
          {session.locationSource ? (
            <span className="rounded-lg bg-ng-bg px-2 py-1">
              {locationSourceLabelFr(session.locationSource)}
            </span>
          ) : null}
          {maps ? (
            <a
              href={maps}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-ng-primary-muted px-2 py-1 font-medium text-ng-primary"
            >
              GPS {session.lat!.toFixed(4)}, {session.lng!.toFixed(4)} ↗
            </a>
          ) : null}
        </div>
        {session.schoolContext ? (
          <p className="mt-3 text-xs text-ng-muted">
            Safe School :{" "}
            {SCHOOL_CONCERN_LABELS_FR[
              session.schoolContext.concernType as keyof typeof SCHOOL_CONCERN_LABELS_FR
            ] ?? session.schoolContext.concernType}
            {session.schoolContext.establishmentHint
              ? ` · ${session.schoolContext.establishmentHint}`
              : ""}
          </p>
        ) : null}
        <div className="mt-4 rounded-xl bg-ng-primary-muted/70 px-3 py-3">
          <p className="text-[11px] font-bold tracking-wide text-ng-primary uppercase">
            Triage Ngemba IA
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ng-text">
            {session.aiSummary}
          </p>
          <p className="mt-2 text-[11px] text-ng-muted">
            {providerLabelFr(session.provider)} ·{" "}
            {Math.round(session.aiConfidence * 100)}% ·{" "}
            {routingLabelFr(session.routingQueue)}
          </p>
          {session.aiPayload.required_services?.length ? (
            <p className="mt-1 text-[11px] text-ng-muted">
              Services : {session.aiPayload.required_services.join(" · ")}
            </p>
          ) : null}
          {session.aiPayload.people_at_risk?.length ? (
            <p className="mt-1 text-[11px] text-ng-muted">
              Personnes à risque :{" "}
              {session.aiPayload.people_at_risk.join(" · ")}
            </p>
          ) : null}
          {session.aiPayload.engine_reason ? (
            <p className="mt-1 text-[11px] text-ng-muted">
              Moteur : {session.aiPayload.engine_reason}
              {session.aiPayload.engine_policy_version
                ? ` (${session.aiPayload.engine_policy_version})`
                : ""}
            </p>
          ) : null}
        </div>
      </Section>

      <Section title="2 · Qui a alerté">
        <p className="text-sm text-ng-text">
          <strong>{sourceLabelFr(session.source)}</strong> ·{" "}
          {fmt(session.createdAt)} · {session.locale.toUpperCase()}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ng-muted">
          Identité citoyenne non demandée. Dossier anonyme — IP / appareil
          réservés à une investigation si besoin.
        </p>
        <details className="mt-3 rounded-xl bg-ng-bg px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-ng-muted">
            Investigation technique
          </summary>
          <p className="mt-2 break-all font-mono text-[11px] text-ng-muted">
            IP {session.clientIp || "—"}
            {session.userAgent
              ? ` · ${session.userAgent.slice(0, 120)}${session.userAgent.length > 120 ? "…" : ""}`
              : ""}
          </p>
        </details>
        {relatedAlerts.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {relatedAlerts.slice(0, 4).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/ops/${r.id}`}
                  className="text-xs font-medium text-ng-primary underline-offset-2 hover:underline"
                >
                  Autre alerte · {statusLabelFr(r.status)} · {fmt(r.createdAt)}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      <Section title="3 · Actions OPS" accent>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--ng-border)] bg-ng-bg p-3 text-sm text-ng-text outline-none focus:ring-2 focus:ring-ng-primary/30"
          placeholder="Note obligatoire pour clôturer ou annuler…"
        />
        <input
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="mt-2 min-h-11 w-full rounded-xl border border-[var(--ng-border)] bg-ng-bg px-3 text-sm text-ng-text outline-none focus:ring-2 focus:ring-ng-primary/30"
          placeholder="Assigné à (nom opérateur)"
        />
        {actionError ? (
          <p className="mt-2 text-sm font-medium text-ng-urgent">{actionError}</p>
        ) : null}
        <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
          {canPatch ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void patch({
                  operatorNotes: notes || null,
                  assignedTo: assignedTo || null,
                })
              }
              className="min-h-10 rounded-xl border border-[var(--ng-border)] px-3 py-2 text-xs font-semibold text-ng-muted disabled:opacity-50"
            >
              Sauver notes
            </button>
          ) : null}
          {canPatch && open && session.status !== "oriented" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void patch({
                  status: "oriented",
                  assignedTo: assignedTo.trim() || "ops",
                  operatorNotes: notes || null,
                })
              }
              className="min-h-10 rounded-xl bg-ng-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Prendre en charge
            </button>
          ) : null}
          {canPatch && open ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void patch({
                  status: "closed",
                  operatorNotes: notes || null,
                  historyNote: "Dossier clôturé",
                })
              }
              className="min-h-10 rounded-xl border border-[var(--ng-border)] px-3 py-2 text-xs font-semibold text-ng-muted disabled:opacity-50"
            >
              Clôturer
            </button>
          ) : null}
          {canPatch && open ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void patch({
                  status: "cancelled",
                  operatorNotes: notes || null,
                  historyNote: "Alerte annulée / fausse alerte",
                })
              }
              className="min-h-10 rounded-xl border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800 disabled:opacity-50"
            >
              Annuler
            </button>
          ) : null}
          {canPatch && !open ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void patch({
                  status: "active",
                  operatorNotes: notes || null,
                  historyNote: "Dossier rouvert",
                })
              }
              className="min-h-10 rounded-xl border border-[var(--ng-border)] px-3 py-2 text-xs font-semibold text-ng-primary disabled:opacity-50"
            >
              Rouvrir
            </button>
          ) : null}
        </div>
      </Section>

      <OpsRoutingPanel
        routingMeta={session.routingMeta ?? null}
        suggestedPartners={suggestedPartners}
        referrals={referrals}
      />
      <OpsUnitsPanel
        matches={unitMatches}
        sessionId={session.id}
        canAssign={canPatch}
        onAssigned={() => void load()}
      />
      <OpsTrustedContacts contacts={session.trustedContacts ?? []} />

      {session.media?.length ? (
        <Section title="Médias">
          <SessionMediaList
            sessionId={session.id}
            items={session.media}
            dense
          />
        </Section>
      ) : null}

      <SessionChat
        sessionId={session.id}
        viewerRole="operator"
        labels={{
          chatTitle: "Chat citoyen",
          chatPlaceholder: "Répondre…",
          chatSend: "Envoyer",
          chatEmpty: "Aucun message. Écrivez pour orienter.",
        }}
      />

      <Section title="Chronologie">
        <ul className="relative space-y-0 border-l-2 border-ng-primary-muted pl-4">
          {events.length
            ? events.map((e) => (
                <li key={e.id} className="relative pb-4 last:pb-0">
                  <span className="absolute top-1.5 -left-[1.3rem] size-2.5 rounded-full bg-ng-primary ring-4 ring-ng-primary-muted" />
                  <p className="text-xs font-semibold text-ng-primary">
                    {e.eventType}
                    {e.status ? ` · ${statusLabelFr(e.status)}` : ""}
                  </p>
                  <p className="text-[11px] text-ng-muted">
                    {fmt(e.at)} · {e.actor || "système"}
                  </p>
                  {e.note ? (
                    <p className="mt-0.5 text-xs text-ng-muted">{e.note}</p>
                  ) : null}
                </li>
              ))
            : session.statusHistory.map((h, i) => (
                <li key={`${h.at}-${h.status}-${i}`} className="relative pb-4 last:pb-0">
                  <span className="absolute top-1.5 -left-[1.3rem] size-2.5 rounded-full bg-ng-primary ring-4 ring-ng-primary-muted" />
                  <p className="text-xs font-semibold text-ng-primary">
                    {statusLabelFr(h.status)}
                  </p>
                  <p className="text-[11px] text-ng-muted">
                    {fmt(h.at)} · {h.actor || "système"}
                  </p>
                  {h.note ? (
                    <p className="mt-0.5 text-xs text-ng-muted">{h.note}</p>
                  ) : null}
                </li>
              ))}
        </ul>
      </Section>

      <button
        type="button"
        onClick={() => void logout()}
        className="text-xs font-semibold text-ng-muted hover:text-ng-primary"
      >
        Déconnexion
      </button>

      {canPatch ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ng-border)] bg-ng-surface/95 px-4 py-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-lg gap-2">
            {open && session.status !== "oriented" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void patch({
                    status: "oriented",
                    assignedTo: assignedTo.trim() || "ops",
                    operatorNotes: notes || null,
                  })
                }
                className="min-h-11 flex-1 rounded-xl bg-ng-primary text-sm font-semibold text-white disabled:opacity-50"
              >
                Prendre en charge
              </button>
            ) : open ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void patch({
                    status: "closed",
                    operatorNotes: notes || null,
                    historyNote: "Dossier clôturé",
                  })
                }
                className="min-h-11 flex-1 rounded-xl bg-ng-primary text-sm font-semibold text-white disabled:opacity-50"
              >
                Clôturer
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void patch({
                    status: "active",
                    operatorNotes: notes || null,
                    historyNote: "Dossier rouvert",
                  })
                }
                className="min-h-11 flex-1 rounded-xl bg-ng-primary text-sm font-semibold text-white disabled:opacity-50"
              >
                Rouvrir
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void patch({
                  operatorNotes: notes || null,
                  assignedTo: assignedTo || null,
                })
              }
              className="min-h-11 rounded-xl border border-[var(--ng-border)] px-4 text-sm font-semibold text-ng-muted disabled:opacity-50"
            >
              Sauver
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
