"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCls } from "@/components/admin/admin-ui";

type LeadRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  location: string | null;
  source: string;
  score: number;
  category: string;
  segment: string;
  priority: string;
  lifecycle: string;
  emailValid: boolean;
  suppressed: boolean;
  alreadyRegistered: boolean;
  contactCount: number;
  lastContactedAt: string | null;
  createdAt: string;
};

type PreviewSummary = {
  totalRows: number;
  valid: number;
  newProspects: number;
  duplicatesInFile: number;
  existingLeads: number;
  alreadyRegistered: number;
  suppressed: number;
  invalidEmail: number;
  alreadyContacted: number;
  errors: string[];
  format: string;
  headers: string[];
};

type PreviewRow = {
  rowIndex: number;
  status: string;
  draft: {
    firstName: string;
    lastName: string;
    email: string;
    company: string | null;
    jobTitle: string | null;
    location: string | null;
  };
  issues: string[];
};

type Props = {
  editionId: string;
  isAdmin: boolean;
};

export function HackathonLeadsTab({ editionId, isAdmin }: Props) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<PreviewSummary | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [includeRegistered, setIncludeRegistered] = useState(false);
  const [commitMsg, setCommitMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    if (!editionId) return;
    setErr(null);
    const params = new URLSearchParams({
      editionId,
      limit: "100",
    });
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/hackathon/leads?${params}`, {
      credentials: "include",
      cache: "no-store",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof j.error === "string" ? j.error : "Chargement impossible");
      setLeads([]);
      return;
    }
    setLeads((j.leads as LeadRow[]) ?? []);
    setTotal(typeof j.total === "number" ? j.total : 0);
  }, [editionId, q]);

  useEffect(() => {
    void load().catch(() => setErr("Chargement impossible"));
  }, [load]);

  async function runPreview() {
    if (!isAdmin || !file || !editionId) return;
    setBusy(true);
    setErr(null);
    setCommitMsg(null);
    setSummary(null);
    setPreviewRows([]);
    try {
      const fd = new FormData();
      fd.set("action", "preview");
      fd.set("editionId", editionId);
      fd.set("file", file);
      const res = await fetch("/api/admin/hackathon/leads", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Preview impossible");
        return;
      }
      setSummary(j.summary as PreviewSummary);
      setPreviewRows((j.rows as PreviewRow[]) ?? []);
      setTruncated(Boolean(j.truncated));
    } catch {
      setErr("Preview impossible");
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    if (!isAdmin || !file || !editionId || !summary) return;
    if (
      !window.confirm(
        `Confirmer l'import ?\nNouveaux: ${summary.newProspects}\n` +
          (updateExisting
            ? `MàJ existants: ${summary.existingLeads + summary.alreadyContacted}\n`
            : "") +
          `Invalides/exclus seront ignorés.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    setCommitMsg(null);
    try {
      const fd = new FormData();
      fd.set("action", "commit");
      fd.set("editionId", editionId);
      fd.set("file", file);
      fd.set("updateExisting", updateExisting ? "true" : "false");
      fd.set(
        "includeAlreadyRegistered",
        includeRegistered ? "true" : "false",
      );
      const res = await fetch("/api/admin/hackathon/leads", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Import impossible");
        return;
      }
      setCommitMsg(
        `Import OK — insertés: ${j.inserted}, mis à jour: ${j.updated}, ignorés: ${j.skipped}`,
      );
      setSummary(null);
      setPreviewRows([]);
      setFile(null);
      await load();
    } catch {
      setErr("Import impossible");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel: Record<string, string> = {
    new: "Nouveau",
    duplicate_in_file: "Doublon fichier",
    existing_lead: "Déjà en base",
    already_registered: "Déjà inscrit",
    suppressed: "Suppression",
    invalid_email: "Email invalide",
    already_contacted: "Déjà contacté",
  };

  return (
    <div className="space-y-4">
      <div className={adminCls.card}>
        <p className="text-sm font-black text-[color:var(--fd-text)]">
          Lead Generation — import prospects
        </p>
        <p className={adminCls.muted}>
          CSV ou XLSX · aperçu obligatoire avant insertion · aucun email envoyé
          à cette étape. Total en base : {total}
        </p>

        {isAdmin ? (
          <div className="mt-4 space-y-3">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className={adminCls.input}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setSummary(null);
                setPreviewRows([]);
                setCommitMsg(null);
              }}
            />
            <p className="text-xs text-[color:var(--fd-muted)]">
              Colonnes reconnues : firstName, lastName (ou fullName), email,
              phone, LinkedIn, company, jobTitle, location, skills, experience,
              source, notes, consent
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                />
                Mettre à jour les leads déjà présents
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeRegistered}
                  onChange={(e) => setIncludeRegistered(e.target.checked)}
                />
                Inclure les déjà inscrits (marqués, exclus des campagnes)
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!file || busy}
                onClick={() => void runPreview()}
                className={adminCls.btnSecondary}
              >
                Aperçu avant import
              </button>
              <button
                type="button"
                disabled={!summary || busy || !file}
                onClick={() => void runCommit()}
                className={adminCls.btnPrimary}
              >
                Confirmer l&apos;insertion
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[color:var(--fd-muted)]">
            Lecture seule — import réservé super admin.
          </p>
        )}

        {err ? <p className={`mt-3 ${adminCls.error}`}>{err}</p> : null}
        {commitMsg ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {commitMsg}
          </p>
        ) : null}
      </div>

      {summary ? (
        <div className={adminCls.card}>
          <p className="mb-3 text-sm font-black">Aperçu ({summary.format})</p>
          {summary.errors.length ? (
            <p className={`mb-3 ${adminCls.error}`}>
              Erreurs parse : {summary.errors.join(", ")}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Lignes", summary.totalRows],
              ["Nouveaux", summary.newProspects],
              ["Doublons fichier", summary.duplicatesInFile],
              ["Déjà présents", summary.existingLeads],
              ["Déjà inscrits", summary.alreadyRegistered],
              ["Déjà contactés", summary.alreadyContacted],
              ["Emails invalides", summary.invalidEmail],
              ["Suppression", summary.suppressed],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-[color:var(--fd-border)] px-3 py-2"
              >
                <p className={adminCls.kpiLabel}>{label}</p>
                <p className="text-xl font-black tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          {previewRows.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--fd-border)] text-xs uppercase text-[color:var(--fd-muted)]">
                    <th className="py-2 pr-2">Ligne</th>
                    <th className="py-2 pr-2">Statut</th>
                    <th className="py-2 pr-2">Nom</th>
                    <th className="py-2 pr-2">Email</th>
                    <th className="py-2">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 50).map((r) => (
                    <tr
                      key={`${r.rowIndex}-${r.draft.email}`}
                      className="border-b border-[color:var(--fd-border)]/60"
                    >
                      <td className="py-2 pr-2 tabular-nums">{r.rowIndex}</td>
                      <td className="py-2 pr-2 font-semibold">
                        {statusLabel[r.status] ?? r.status}
                      </td>
                      <td className="py-2 pr-2">
                        {r.draft.firstName} {r.draft.lastName}
                      </td>
                      <td className="py-2 pr-2">{r.draft.email}</td>
                      <td className="py-2 text-xs text-[color:var(--fd-muted)]">
                        {r.issues.join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {truncated || previewRows.length > 50 ? (
                <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
                  Aperçu tronqué — le commit retraitera tout le fichier.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={adminCls.card}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-sm font-black">Prospects ({total})</p>
          <input
            className={`${adminCls.input} ml-auto max-w-xs`}
            placeholder="Filtrer email / nom / société"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            className={adminCls.btnSecondary}
            onClick={() => void load()}
          >
            ↻
          </button>
        </div>
        {leads.length === 0 ? (
          <p className={adminCls.empty}>Aucun prospect pour cette édition.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--fd-border)] text-xs uppercase text-[color:var(--fd-muted)]">
                  <th className="py-2 pr-2">Nom</th>
                  <th className="py-2 pr-2">Email</th>
                  <th className="py-2 pr-2">Source</th>
                  <th className="py-2 pr-2">Score</th>
                  <th className="py-2 pr-2">Cat.</th>
                  <th className="py-2 pr-2">Cycle</th>
                  <th className="py-2">Flags</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-[color:var(--fd-border)]/60"
                  >
                    <td className="py-2 pr-2 font-medium">
                      {l.firstName} {l.lastName}
                      {l.company ? (
                        <span className="block text-xs text-[color:var(--fd-muted)]">
                          {l.company}
                          {l.jobTitle ? ` · ${l.jobTitle}` : ""}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-2">{l.email}</td>
                    <td className="py-2 pr-2">{l.source}</td>
                    <td className="py-2 pr-2 tabular-nums">{l.score}</td>
                    <td className="py-2 pr-2">{l.category}</td>
                    <td className="py-2 pr-2">{l.lifecycle}</td>
                    <td className="py-2 text-xs text-[color:var(--fd-muted)]">
                      {[
                        l.alreadyRegistered ? "inscrit" : null,
                        l.suppressed ? "suppressed" : null,
                        !l.emailValid ? "email?" : null,
                        l.contactCount > 0 ? `contact×${l.contactCount}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
