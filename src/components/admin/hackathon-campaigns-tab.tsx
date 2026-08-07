"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminConfirmDialog, adminCls } from "@/components/admin/admin-ui";

type Campaign = {
  id: string;
  name: string;
  segment: string;
  minCategory: string;
  status: string;
  prospectCount: number;
  sentCount: number;
  dryRun: boolean;
  scheduledAt: string | null;
  createdAt: string;
};

type PreviewRow = {
  id: string;
  leadId: string;
  email: string;
  company: string | null;
  subject: string;
  status: string;
  skipReason: string | null;
};

type Props = {
  editionId: string;
  isAdmin: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  READY_FOR_REVIEW: "À revoir",
  APPROVED: "Approuvée",
  SENDING: "Envoi en cours",
  PAUSED: "En pause",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const RECIPIENT_STATUS: Record<string, string> = {
  PENDING: "Prêt",
  SENT: "Envoyé",
  SKIPPED: "Exclu",
  FAILED: "Échec",
  BOUNCED: "Bounce",
  UNSUBSCRIBED: "Désinscrit",
};

const SKIP_LABEL: Record<string, string> = {
  invalid_email: "Email invalide",
  suppressed: "Liste suppression",
  existing_partner: "Partenaire / sponsor",
  already_registered: "Déjà inscrit",
  duplicate_company: "Entreprise déjà contactée",
  duplicate_email: "Email déjà en file",
  already_contacted: "Email déjà envoyé",
};

const SEGMENT_LABEL: Record<string, string> = {
  developers: "Developers",
  ai_data: "IA / Data",
  design_product: "Design / Product",
  entrepreneurs: "Entrepreneurs",
  general: "Général",
  mixed: "Mixte",
};

function humanMsg(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "Action terminée.";
}

export function HackathonCampaignsTab({ editionId, isAdmin }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    pending: number;
    skipped: number;
    total: number;
  } | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    tone: "primary" | "danger";
    body: Record<string, unknown>;
    onDone: (j: Record<string, unknown>) => Promise<void>;
  } | null>(null);

  const load = useCallback(async () => {
    if (!editionId) return;
    setErr(null);
    const res = await fetch(
      `/api/admin/hackathon/campaigns?editionId=${encodeURIComponent(editionId)}`,
      { credentials: "include", cache: "no-store" },
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof j.error === "string" ? j.error : "Chargement impossible");
      return;
    }
    setCampaigns((j.campaigns as Campaign[]) ?? []);
  }, [editionId]);

  useEffect(() => {
    void load().catch(() => setErr("Chargement impossible"));
  }, [load]);

  async function loadCampaign(id: string) {
    setSelectedId(id);
    setHtmlPreview(null);
    setPreviewSubject(null);
    const res = await fetch(
      `/api/admin/hackathon/campaigns?campaignId=${encodeURIComponent(id)}`,
      { credentials: "include", cache: "no-store" },
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof j.error === "string" ? j.error : "Détail impossible");
      return;
    }
    setStats(j.stats ?? null);
    setPreview(
      ((j.rows as Array<Record<string, unknown>>) ?? []).slice(0, 30).map((r) => ({
        id: String(r.id),
        leadId: String(r.leadId),
        email: String(r.email),
        company: (r.company as string | null) ?? null,
        subject: String(r.subject ?? ""),
        status: String(r.status),
        skipReason: (r.skipReason as string) ?? null,
      })),
    );
  }

  async function runAction(
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    if (!isAdmin || !editionId) return null;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/hackathon/campaigns", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, editionId }),
      });
      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Action impossible");
        return null;
      }
      return j;
    } catch {
      setErr("Action impossible");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function askConfirm(args: {
    title: string;
    message: string;
    confirmLabel: string;
    tone?: "primary" | "danger";
    body: Record<string, unknown>;
    onDone: (j: Record<string, unknown>) => Promise<void>;
  }) {
    if (!isAdmin || !editionId) return;
    setConfirm({
      title: args.title,
      message: args.message,
      confirmLabel: args.confirmLabel,
      tone: args.tone ?? "primary",
      body: args.body,
      onDone: args.onDone,
    });
  }

  async function prepareJul31() {
    askConfirm({
      title: "Préparer le pack campagnes",
      message:
        "Créer 5 campagnes (1 par segment).\nAucun email Resend ne sera envoyé (mode test).\n1 email max par entreprise.",
      confirmLabel: "Préparer",
      body: { action: "prepare_jul31_pack", minCategory: "B_QUALIFIED" },
      onDone: async (j) => {
        const lines = (
          j.campaigns as Array<{
            segment: string;
            generate: { queued: number; skipped: number };
          }>
        )
          ?.map(
            (c) =>
              `${SEGMENT_LABEL[c.segment] ?? c.segment}: ${c.generate.queued} prêts / ${c.generate.skipped} exclus`,
          )
          .join(" · ");
        setMsg(`Pack prêt (09h Kinshasa, dry-run). ${lines ?? ""}`);
        await load();
      },
    });
  }

  async function regenerateAll() {
    askConfirm({
      title: "Régénérer les contenus",
      message:
        "Recréer les emails partenariat (Patty B., WhatsApp, RCCM).\n1 seul email par entreprise sur cette lancée.",
      confirmLabel: "Régénérer",
      body: { action: "regenerate_all" },
      onDone: async (j) => {
        const lines = (
          j.campaigns as Array<{
            segment: string;
            queued: number;
            skipped: number;
          }>
        )
          ?.map(
            (c) =>
              `${SEGMENT_LABEL[c.segment] ?? c.segment}: ${c.queued} prêts / ${c.skipped} exclus`,
          )
          .join(" · ");
        setMsg(`${humanMsg(j.note)} ${lines ?? ""}`.trim());
        await load();
        if (selectedId) await loadCampaign(selectedId);
      },
    });
  }

  async function approveLive() {
    askConfirm({
      title: "Approuver l'envoi réel",
      message:
        "Les campagnes passeront en envoi réel.\nLots de 60/jour à 09h Kinshasa (GitHub Actions).\nGmail/iCloud d'abord, puis pro non contactés.\n1 email par entreprise.",
      confirmLabel: "Approuver",
      tone: "danger",
      body: { action: "approve", dryRun: false },
      onDone: async (j) => {
        setMsg(
          `${humanMsg(j.note)} (${Number(j.approved ?? 0)} campagne(s))`,
        );
        await load();
      },
    });
  }

  async function sendDailyBatch() {
    askConfirm({
      title: "Envoyer le lot du jour",
      message:
        "Envoi immédiat via Resend — max 60 emails.\nGmail/iCloud d'abord, sinon pro non contactés.\nLes campagnes doivent être approuvées (mode réel).",
      confirmLabel: "Envoyer 60",
      tone: "danger",
      body: {
        action: "send_daily_batch",
        limit: 60,
        domainMode: "gmail_icloud_first",
      },
      onDone: async (j) => {
        const blocked =
          typeof j.blockedReason === "string" ? ` — ${j.blockedReason}` : "";
        const phase =
          typeof j.domainPhase === "string" ? ` · phase ${j.domainPhase}` : "";
        setMsg(
          `Lot : ${Number(j.sent ?? 0)} envoyés · ${Number(j.failed ?? 0)} échecs · ${Number(j.skipped ?? 0)} exclus${phase}${blocked}`,
        );
        await load();
        if (selectedId) await loadCampaign(selectedId);
      },
    });
  }

  async function showHtml(recipientId: string) {
    const res = await fetch(
      `/api/admin/hackathon/campaigns?recipientId=${encodeURIComponent(recipientId)}`,
      { credentials: "include", cache: "no-store" },
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr("Aperçu HTML impossible");
      return;
    }
    const preview = j.preview as
      | { html?: string; subject?: string }
      | null
      | undefined;
    setPreviewSubject(
      typeof preview?.subject === "string" ? preview.subject : null,
    );
    setHtmlPreview(
      typeof preview?.html === "string" ? preview.html : "",
    );
  }

  return (
    <div className="space-y-4">
      <AdminConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmLabel={confirm?.confirmLabel}
        tone={confirm?.tone}
        busy={busy}
        onCancel={() => {
          if (!busy) setConfirm(null);
        }}
        onConfirm={() => {
          if (!confirm || busy) return;
          const pending = confirm;
          setConfirm(null);
          void (async () => {
            const j = await runAction(pending.body);
            if (j) await pending.onDone(j);
          })();
        }}
      />
      <div className={adminCls.card}>
        <p className="text-sm font-black">Campagnes email - Lead Gen</p>
        <p className={adminCls.muted}>
          Partenariat SI / innovation RDC · Mme Patty B. · WhatsApp · RCCM.
          Envoi <strong>50 / jour à 09h Kinshasa</strong> (GHA) —{" "}
          <strong>1 email max par entreprise</strong> sur cette lancée.
        </p>
        {isAdmin ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className={adminCls.btnSecondary}
              onClick={() => void prepareJul31()}
            >
              Préparer pack (dry-run)
            </button>
            <button
              type="button"
              disabled={busy}
              className={adminCls.btnSecondary}
              onClick={() => void regenerateAll()}
            >
              Régénérer (1 / entreprise)
            </button>
            <button
              type="button"
              disabled={busy}
              className={adminCls.btnPrimary}
              onClick={() => void approveLive()}
            >
              Approuver envoi réel
            </button>
            <button
              type="button"
              disabled={busy}
              className={adminCls.btnPrimary}
              onClick={() => void sendDailyBatch()}
            >
              Envoyer lot 60 maintenant
            </button>
            <button
              type="button"
              className={adminCls.btnSecondary}
              onClick={() => void load()}
            >
              ↻
            </button>
          </div>
        ) : null}
        {err ? <p className={`mt-3 ${adminCls.error}`}>{err}</p> : null}
        {msg ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {msg}
          </p>
        ) : null}
      </div>

      <div className={adminCls.card}>
        <p className="mb-3 text-sm font-black">Campagnes ({campaigns.length})</p>
        {campaigns.length === 0 ? (
          <p className={adminCls.empty}>
            Aucune campagne. Importez / scorez des leads puis préparez un pack.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--fd-border)] text-xs uppercase text-[color:var(--fd-muted)]">
                  <th className="py-2 pr-2">Nom</th>
                  <th className="py-2 pr-2">Segment</th>
                  <th className="py-2 pr-2">Statut</th>
                  <th className="py-2 pr-2">Prospects</th>
                  <th className="py-2 pr-2">Envoyés</th>
                  <th className="py-2 pr-2">Planifié</th>
                  <th className="py-2">Mode</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className={`cursor-pointer border-b border-[color:var(--fd-border)]/60 ${selectedId === c.id ? "bg-[color:var(--fd-mint)]/30" : ""}`}
                    onClick={() => void loadCampaign(c.id)}
                  >
                    <td className="py-2 pr-2 font-medium">{c.name}</td>
                    <td className="py-2 pr-2">
                      {SEGMENT_LABEL[c.segment] ?? c.segment}
                    </td>
                    <td className="py-2 pr-2">
                      {STATUS_LABEL[c.status] ?? c.status}
                    </td>
                    <td className="py-2 pr-2 tabular-nums">{c.prospectCount}</td>
                    <td className="py-2 pr-2 tabular-nums">{c.sentCount}</td>
                    <td className="py-2 pr-2 text-xs">
                      {c.scheduledAt
                        ? new Date(c.scheduledAt).toLocaleString("fr-FR", {
                            timeZone: "Africa/Kinshasa",
                          })
                        : "—"}
                    </td>
                    <td className="py-2">
                      {c.dryRun ? "Test (pas d'envoi)" : "Envoi réel"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && stats ? (
        <div className={adminCls.card}>
          <p className="mb-2 text-sm font-black">
            Destinataires — prêts {stats.pending} · exclus {stats.skipped} ·
            total {stats.total}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--fd-border)] text-xs uppercase text-[color:var(--fd-muted)]">
                  <th className="py-2 pr-2">Entreprise</th>
                  <th className="py-2 pr-2">Email</th>
                  <th className="py-2 pr-2">Objet</th>
                  <th className="py-2 pr-2">Statut</th>
                  <th className="py-2">Aperçu</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[color:var(--fd-border)]/60"
                  >
                    <td className="py-2 pr-2">{r.company || "—"}</td>
                    <td className="py-2 pr-2">{r.email}</td>
                    <td className="py-2 pr-2">{r.subject}</td>
                    <td className="py-2 pr-2">
                      {RECIPIENT_STATUS[r.status] ?? r.status}
                      {r.skipReason
                        ? ` (${SKIP_LABEL[r.skipReason] ?? r.skipReason})`
                        : ""}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        className="text-xs font-bold text-[color:var(--fd-primary)]"
                        onClick={() => void showHtml(r.id)}
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {htmlPreview !== null ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--fd-border)]">
              {previewSubject ? (
                <p className="border-b border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/30 px-3 py-2 text-sm font-semibold">
                  {previewSubject}
                </p>
              ) : null}
              <iframe
                title="email-preview"
                className="h-[480px] w-full bg-white"
                srcDoc={htmlPreview}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
