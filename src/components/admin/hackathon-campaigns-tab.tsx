"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCls } from "@/components/admin/admin-ui";

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
  subject: string;
  facts: Record<string, string>;
  personalizationRate: number;
  status: string;
  skipReason: string | null;
};

type Props = {
  editionId: string;
  isAdmin: boolean;
};

export function HackathonCampaignsTab({ editionId, isAdmin }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    pending: number;
    skipped: number;
    total: number;
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
      ((j.rows as Array<Record<string, unknown>>) ?? []).slice(0, 20).map((r) => ({
        id: String(r.id),
        leadId: String(r.leadId),
        email: String(r.email),
        subject: String(r.subject),
        facts: (r.facts as Record<string, string>) ?? {},
        personalizationRate: 0,
        status: String(r.status),
        skipReason: (r.skipReason as string) ?? null,
      })),
    );
  }

  async function prepareJul31() {
    if (!isAdmin || !editionId) return;
    if (
      !window.confirm(
        "Préparer 5 campagnes (1 par segment) pour le 31 juil. 2026 à 09h Kinshasa ?\nAucun email Resend ne sera envoyé (dryRun).",
      )
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/hackathon/campaigns", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepare_jul31_pack",
          editionId,
          minCategory: "B_QUALIFIED",
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Préparation impossible");
        return;
      }
      const lines = (j.campaigns as Array<{ segment: string; generate: { queued: number; skipped: number; avgPersonalizationRate: number } }>)
        ?.map(
          (c) =>
            `${c.segment}: ${c.generate.queued} prêts / ${c.generate.skipped} exclus (perso ~${c.generate.avgPersonalizationRate}%)`,
        )
        .join(" · ");
      setMsg(
        `Pack prêt pour ${j.scheduledAt} (09h Kinshasa). dryRun=true. ${lines ?? ""}`,
      );
      await load();
    } catch {
      setErr("Préparation impossible");
    } finally {
      setBusy(false);
    }
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
    setHtmlPreview(String(j.preview?.html ?? ""));
  }

  return (
    <div className="space-y-4">
      <div className={adminCls.card}>
        <p className="text-sm font-black">Campagnes email - Lead Gen</p>
        <p className={adminCls.muted}>
          Emails personnalisés par segment · CTA /hackathon · désinscription
          one-click. Limite Resend atteinte : préparation pour{" "}
          <strong>31 juil. 2026 · 09h00 Kinshasa</strong> (dryRun, aucun envoi
          aujourd&apos;hui).
        </p>
        {isAdmin ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className={adminCls.btnPrimary}
              onClick={() => void prepareJul31()}
            >
              Préparer pack 31 juil. 09h (dry-run)
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
            Aucune campagne. Importez/scorer des leads puis lancez le pack 31
            juil.
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
                  <th className="py-2 pr-2">Planifié</th>
                  <th className="py-2">Dry-run</th>
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
                    <td className="py-2 pr-2">{c.segment}</td>
                    <td className="py-2 pr-2">{c.status}</td>
                    <td className="py-2 pr-2 tabular-nums">{c.prospectCount}</td>
                    <td className="py-2 pr-2 text-xs">
                      {c.scheduledAt
                        ? new Date(c.scheduledAt).toLocaleString("fr-FR", {
                            timeZone: "Africa/Kinshasa",
                          })
                        : "—"}
                    </td>
                    <td className="py-2">{c.dryRun ? "oui" : "NON"}</td>
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
            Destinataires - prêts {stats.pending} · exclus {stats.skipped} ·
            total {stats.total}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--fd-border)] text-xs uppercase text-[color:var(--fd-muted)]">
                  <th className="py-2 pr-2">Email</th>
                  <th className="py-2 pr-2">Objet</th>
                  <th className="py-2 pr-2">Statut</th>
                  <th className="py-2">HTML</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[color:var(--fd-border)]/60"
                  >
                    <td className="py-2 pr-2">{r.email}</td>
                    <td className="py-2 pr-2">{r.subject}</td>
                    <td className="py-2 pr-2">
                      {r.status}
                      {r.skipReason ? ` (${r.skipReason})` : ""}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        className="text-xs font-bold text-[color:var(--fd-primary)]"
                        onClick={() => void showHtml(r.id)}
                      >
                        HTML
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {htmlPreview ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--fd-border)]">
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
