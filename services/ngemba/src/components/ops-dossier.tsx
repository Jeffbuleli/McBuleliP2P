"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SessionChat } from "@/components/session-chat";
import { SessionMediaList } from "@/components/session-media";
import { OpsRoutingPanel } from "@/components/ops-routing-panel";
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
            className={`rounded-xl px-2 py-2 text-center text-[11px] font-semibold ${
              done
                ? current
                  ? "bg-ng-primary text-white"
                  : "bg-ng-primary-muted text-ng-primary"
                : "bg-ng-surface text-ng-muted ring-1 ring-[var(--ng-border)]"
            }`}
          >
            {it.n}. {it.label}
          </li>
        );
      })}
    </ol>
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
    setSla(data.sla ?? null);
    setNotes(data.session.operatorNotes ?? "");
    setAssignedTo(data.session.assignedTo ?? "");
    setRelatedAlerts(data.relatedAlerts ?? []);
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
      <main className="mx-auto max-w-3xl px-4 py-10 text-sm">
        <Link href="/ops" className="text-ng-muted">
          ← File ops
        </Link>
        <p className="mt-4 font-medium text-ng-urgent">
          {error === "forbidden"
            ? "Acces refuse pour ce dossier. Utilisez un code operateur admin ou reconnectez-vous."
            : error === "not_found"
              ? "Dossier introuvable. Verifiez le lien recu par email ou consultez la file ops."
              : "Impossible de charger le dossier. Reessayez."}
        </p>
        <Link
          href={`/ops/login?next=${encodeURIComponent(`/ops/${id}`)}`}
          className="mt-4 inline-block text-ng-primary underline"
        >
          Se reconnecter
        </Link>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-ng-muted">
        Chargement du dossier...
      </main>
    );
  }

  const place = session.locationLabel || session.commune || "Sans lieu";
  const open =
    session.status !== "closed" && session.status !== "cancelled";

  return (
    <main
      className={`ng-shell mx-auto min-h-dvh space-y-5 py-6 pb-20 ${shellMaxWidth(device)}`}
    >
      <header>
        <Link href="/ops" className="text-sm text-ng-muted">
          ← File ops
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-ng-text">Dossier</h1>
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
        <WorkflowBar status={session.status} />
      </header>

      {session.immediateDanger ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-ng-urgent">
          Danger immédiat signalé — prioriser la sécurité et les numéros
          d&apos;urgence locaux.
        </p>
      ) : null}
      {session.escalation ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {session.escalation.reason}
        </p>
      ) : null}

      {/* 1. Situation */}
      <section className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
          1. Situation
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ng-text">
          {session.message === "·"
            ? "(Message vocal ou photo sans texte)"
            : session.message}
        </p>
        <p className="mt-3 text-xs text-ng-muted">
          {categoryLabelFr(session.category)} · {sourceLabelFr(session.source)} ·{" "}
          {place}
          {session.lat != null && session.lng != null
            ? ` · GPS ${session.lat.toFixed(4)}, ${session.lng.toFixed(4)}`
            : ""}
          {session.locationSource
            ? ` (${locationSourceLabelFr(session.locationSource)})`
            : ""}
        </p>
        {session.schoolContext ? (
          <p className="mt-2 text-xs text-ng-muted">
            Safe School :{" "}
            {SCHOOL_CONCERN_LABELS_FR[
              session.schoolContext.concernType as keyof typeof SCHOOL_CONCERN_LABELS_FR
            ] ?? session.schoolContext.concernType}
            {session.schoolContext.establishmentHint
              ? ` · ${session.schoolContext.establishmentHint}`
              : ""}
          </p>
        ) : null}
        <div className="mt-3 rounded-xl bg-ng-primary-muted/60 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ng-primary">
            Triage IA
          </p>
          <p className="mt-1 text-sm text-ng-text">{session.aiSummary}</p>
          <p className="mt-1 text-[11px] text-ng-muted">
            {providerLabelFr(session.provider)} ·{" "}
            {Math.round(session.aiConfidence * 100)}% ·{" "}
            {routingLabelFr(session.routingQueue)}
          </p>
        </div>
      </section>

      {/* 2. Qui */}
      <section className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
          2. Qui a alerté
        </h2>
        <p className="mt-2 text-sm text-ng-text">
          <strong>{sourceLabelFr(session.source)}</strong> ·{" "}
          {fmt(session.createdAt)} · {session.locale.toUpperCase()}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ng-muted">
          Identité citoyenne non demandée. Dossier anonyme — IP / appareil
          réservés à une investigation si besoin.
        </p>
        <p className="mt-2 font-mono text-[11px] text-ng-muted">
          IP {session.clientIp || "—"}
          {session.userAgent
            ? ` · ${session.userAgent.slice(0, 80)}${session.userAgent.length > 80 ? "…" : ""}`
            : ""}
        </p>
        {relatedAlerts.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {relatedAlerts.slice(0, 4).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/ops/${r.id}`}
                  className="text-xs text-ng-primary underline"
                >
                  Autre alerte · {statusLabelFr(r.status)} · {fmt(r.createdAt)}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* 3. Actions */}
      <section className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
          3. Actions OPS
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-[var(--ng-border)] bg-ng-surface p-3 text-sm text-ng-text"
          placeholder="Note obligatoire pour clôturer ou annuler…"
        />
        <input
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="mt-2 min-h-10 w-full rounded-xl border border-[var(--ng-border)] px-3 text-sm text-ng-text"
          placeholder="Assigné à (nom opérateur)"
        />
        {actionError ? (
          <p className="mt-2 text-sm font-medium text-ng-urgent">{actionError}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
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
              className="rounded-lg border border-[var(--ng-border)] px-3 py-2 text-xs font-semibold text-ng-muted disabled:opacity-50"
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
              className="rounded-lg bg-ng-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
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
              className="rounded-lg border border-[var(--ng-border)] px-3 py-2 text-xs font-semibold text-ng-muted disabled:opacity-50"
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
              className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800 disabled:opacity-50"
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
              className="rounded-lg border border-[var(--ng-border)] px-3 py-2 text-xs font-semibold text-ng-primary disabled:opacity-50"
            >
              Rouvrir
            </button>
          ) : null}
        </div>
      </section>

      <OpsRoutingPanel
        routingMeta={session.routingMeta ?? null}
        suggestedPartners={suggestedPartners}
      />
      <OpsTrustedContacts contacts={session.trustedContacts ?? []} />

      {session.media?.length ? (
        <section className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
            Médias
          </h2>
          <div className="mt-3">
            <SessionMediaList
              sessionId={session.id}
              items={session.media}
              dense
            />
          </div>
        </section>
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

      <section className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
          Chronologie
        </h2>
        <ul className="mt-3 space-y-2">
          {session.statusHistory.map((h, i) => (
            <li
              key={`${h.at}-${h.status}-${i}`}
              className="rounded-lg bg-ng-primary-muted/50 px-3 py-2 text-xs"
            >
              <span className="font-semibold text-ng-primary">
                {statusLabelFr(h.status)}
              </span>
              <span className="text-ng-muted">
                {" "}
                · {fmt(h.at)} · {h.actor || "système"}
              </span>
              {h.note ? (
                <span className="mt-0.5 block text-ng-muted">{h.note}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={() => void logout()}
        className="text-xs font-semibold text-ng-muted"
      >
        Déconnexion
      </button>
    </main>
  );
}
