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

  return (
    <main
      className={`ng-shell mx-auto min-h-dvh py-6 pb-16 ${shellMaxWidth(device)}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/ops" className="text-sm text-ng-muted">
            ← File ops
          </Link>
          <h1 className="mt-2 text-lg font-semibold text-ng-text">
            Dossier alerte
          </h1>
          <p className="mt-1 font-mono text-xs text-ng-muted">{session.id}</p>
          <WorkflowBar status={session.status} />
        </div>
        <div className="flex gap-2">
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
              Mode discret
            </span>
          ) : null}
          {session.source === "school" || session.schoolContext ? (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
              Safe School - mineur
            </span>
          ) : null}
          {sla?.escalated ? (
            <span className="rounded-full bg-ng-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold text-ng-urgent">
              Escalade SLA
            </span>
          ) : sla?.breached ? (
            <span className="rounded-full bg-ng-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold text-ng-urgent">
              SLA depasse
            </span>
          ) : sla ? (
            <span className="rounded-full bg-ng-primary-muted px-2.5 py-0.5 text-[11px] font-semibold text-ng-primary">
              {sla.label}
            </span>
          ) : null}
        </div>
      </header>

      {session.escalation ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {session.escalation.reason}
        </p>
      ) : null}

      {session.immediateDanger ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-ng-urgent">
          Danger immediat signale - prioriser securite et numeros d&apos;urgence locaux.
        </p>
      ) : null}

      {sla ? (
        <p
          className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${
            sla.breached || sla.escalated
              ? "bg-ng-urgent/10 text-ng-urgent"
              : "bg-ng-primary-muted text-ng-primary"
          }`}
        >
          SLA : {sla.label}
          {sla.dueAt ? ` · echeance ${fmt(sla.dueAt)}` : ""}
        </p>
      ) : null}

      <section className="mt-6 ng-ops-dossier-grid">
        <article className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4 md:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
            Qui a alerte
          </h2>
          <p className="mt-2 text-sm text-ng-text">
            Source : <strong>{sourceLabelFr(session.source)}</strong>
            {" · "}
            {fmt(session.createdAt)}
            {" · "}
            Langue {session.locale.toUpperCase()}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ng-muted">
            L&apos;identité citoyenne n&apos;est pas demandée à ce stade. Le
            dossier reste anonyme ; l&apos;IP (et l&apos;appareil) sont
            attachés uniquement pour une investigation approfondie si
            nécessaire.
          </p>
          <dl className="mt-3 grid gap-2 text-xs text-ng-muted sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-ng-text">IP du dossier</dt>
              <dd className="mt-0.5 font-mono text-[11px]">
                {session.clientIp || "Non capturée"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ng-text">Appareil (UA)</dt>
              <dd className="mt-0.5 line-clamp-2 break-all text-[11px]">
                {session.userAgent || "Non capturé"}
              </dd>
            </div>
          </dl>
          {relatedAlerts.length > 0 ? (
            <div className="mt-3 rounded-xl bg-ng-primary-muted/50 px-3 py-2">
              <p className="text-xs font-semibold text-ng-primary">
                {relatedAlerts.length} autre(s) alerte(s) du même appareil /
                session anonyme
              </p>
              <ul className="mt-1.5 space-y-1">
                {relatedAlerts.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/ops/${r.id}`}
                      className="text-xs text-ng-primary underline"
                    >
                      {urgencyLabelFr(r.urgency)} · {statusLabelFr(r.status)} ·{" "}
                      {fmt(r.createdAt)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-xs text-ng-muted">
              Première alerte connue pour cette session anonyme.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
            Message citoyen
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ng-text whitespace-pre-wrap">
            {session.message === "·"
              ? "(Message vocal ou photo sans texte)"
              : session.message}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-ng-muted">
            <div>
              <dt className="font-semibold">Source</dt>
              <dd>{sourceLabelFr(session.source)}</dd>
            </div>
            <div>
              <dt className="font-semibold">Langue</dt>
              <dd>{session.locale.toUpperCase()}</dd>
            </div>
            <div>
              <dt className="font-semibold">Type</dt>
              <dd>{categoryLabelFr(session.category)}</dd>
            </div>
            <div>
              <dt className="font-semibold">File</dt>
              <dd>{routingLabelFr(session.routingQueue)}</dd>
            </div>
            {session.schoolContext ? (
              <>
                <div>
                  <dt className="font-semibold">Safe School</dt>
                  <dd>
                    {SCHOOL_CONCERN_LABELS_FR[
                      session.schoolContext.concernType as keyof typeof SCHOOL_CONCERN_LABELS_FR
                    ] ?? session.schoolContext.concernType}
                  </dd>
                </div>
                {session.schoolContext.establishmentHint ? (
                  <div>
                    <dt className="font-semibold">Établissement</dt>
                    <dd>{session.schoolContext.establishmentHint}</dd>
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="col-span-2">
              <dt className="font-semibold">Lieu</dt>
              <dd>
                {place}
                {session.locationSource
                  ? ` (${locationSourceLabelFr(session.locationSource)})`
                  : ""}
              </dd>
            </div>
            {session.lat != null && session.lng != null ? (
              <div className="col-span-2">
                <dt className="font-semibold">GPS</dt>
                <dd>
                  {session.lat.toFixed(5)}, {session.lng.toFixed(5)}
                </dd>
              </div>
            ) : null}
          </dl>
        </article>

        <article className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
            Triage IA
          </h2>
          <p className="mt-2 text-sm text-ng-text">{session.aiSummary}</p>
          <p className="mt-2 text-xs text-ng-muted">
            {providerLabelFr(session.provider)} - confiance{" "}
            {Math.round(session.aiConfidence * 100)}%
          </p>
          {session.aiPayload.follow_up_questions?.length ? (
            <ul className="mt-3 space-y-1 text-sm text-ng-primary">
              {session.aiPayload.follow_up_questions.map((q) => (
                <li key={q}>- {q}</li>
              ))}
            </ul>
          ) : null}
        </article>

        <OpsRoutingPanel
          routingMeta={session.routingMeta ?? null}
          suggestedPartners={suggestedPartners}
        />

        <OpsTrustedContacts contacts={session.trustedContacts ?? []} />

        <article className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
            Notes operateur
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-xl border border-[var(--ng-border)] bg-ng-surface p-3 text-sm text-ng-text"
            placeholder="Actions, contacts, orientation..."
          />
          <label className="mt-3 block text-xs font-semibold text-ng-muted">
            Assigne a
            <input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-xl border border-[var(--ng-border)] px-3 text-sm text-ng-text"
              placeholder="Nom operateur"
            />
          </label>
          <button
            type="button"
            disabled={busy || !canPatch}
            onClick={() =>
              void patch({
                operatorNotes: notes || null,
                assignedTo: assignedTo || null,
              })
            }
            className="mt-3 rounded-lg bg-ng-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Enregistrer notes
          </button>
        </article>

        {session.media?.length ? (
          <article className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4 md:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
              Médias citoyen
            </h2>
            <div className="mt-3">
              <SessionMediaList
                sessionId={session.id}
                items={session.media}
                dense
              />
            </div>
          </article>
        ) : null}

        <div className="md:col-span-2">
          <SessionChat
            sessionId={session.id}
            viewerRole="operator"
            labels={{
              chatTitle: "Échange avec le citoyen",
              chatPlaceholder: "Répondre au citoyen...",
              chatSend: "Envoyer",
              chatEmpty:
                "Aucun message pour l'instant. Écrivez pour orienter la personne.",
            }}
          />
        </div>

        <article className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4 md:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
            Chronologie du dossier
          </h2>
          <p className="mt-1 text-[11px] text-ng-muted">
            De la réception à la clôture — qui a agi, et quand.
          </p>
          <ul className="mt-3 space-y-2">
            {session.statusHistory.map((h, i) => (
              <li
                key={`${h.at}-${h.status}-${i}`}
                className="flex gap-3 rounded-lg bg-ng-primary-muted/50 px-3 py-2 text-xs"
              >
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-ng-primary" />
                <div>
                  <span className="font-semibold text-ng-primary">
                    {statusLabelFr(h.status)}
                  </span>
                  <span className="text-ng-muted"> · {fmt(h.at)}</span>
                  {h.actor ? (
                    <span className="text-ng-muted"> · {h.actor}</span>
                  ) : (
                    <span className="text-ng-muted"> · système / citoyen</span>
                  )}
                  {h.note ? (
                    <span className="mt-0.5 block text-ng-muted">{h.note}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {actionError ? (
        <p className="mt-4 text-sm font-medium text-ng-urgent">{actionError}</p>
      ) : null}

      <p className="mt-6 text-[11px] leading-relaxed text-ng-muted">
        Parcours OPS : réception → prise en charge → chat / orientation →
        clôture ou annulation (note obligatoire). L&apos;identité personnelle
        citoyenne n&apos;est pas demandée ; l&apos;IP est réservée à
        l&apos;investigation approfondie.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {canPatch &&
        session.status !== "oriented" &&
        session.status !== "closed" &&
        session.status !== "cancelled" ? (
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
            className="rounded-lg bg-ng-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Prendre en charge
          </button>
        ) : null}
        {canPatch &&
        session.status !== "closed" &&
        session.status !== "cancelled" ? (
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
            className="rounded-lg border border-[var(--ng-border)] px-4 py-2 text-xs font-semibold text-ng-muted disabled:opacity-50"
          >
            Clôturer (note requise)
          </button>
        ) : null}
        {canPatch &&
        session.status !== "closed" &&
        session.status !== "cancelled" ? (
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
            className="rounded-lg border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-800 disabled:opacity-50"
          >
            Annuler / fausse alerte
          </button>
        ) : null}
        {canPatch &&
        (session.status === "closed" || session.status === "cancelled") ? (
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
            className="rounded-lg border border-[var(--ng-border)] px-4 py-2 text-xs font-semibold text-ng-primary disabled:opacity-50"
          >
            Rouvrir
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void logout()}
          className="ml-auto rounded-lg px-4 py-2 text-xs font-semibold text-ng-muted"
        >
          Deconnexion
        </button>
      </div>
    </main>
  );
}
