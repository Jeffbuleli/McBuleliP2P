"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCls } from "@/components/admin/admin-ui";

type Edition = {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  city: string;
  venue: string | null;
  status: string;
  featured: boolean;
  maxSeats: number;
  priceDay1Usd: string;
  priceFullUsd: string;
  startDate: string | null;
  endDate: string | null;
};

type Tab = "editions" | "registrations" | "partners" | "sponsors" | "people";

export function HackathonAdminClient() {
  const [tab, setTab] = useState<Tab>("editions");
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionId] = useState<string>("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadEditions = useCallback(async () => {
    const res = await fetch("/api/admin/hackathon?tab=editions");
    if (!res.ok) throw new Error("load_failed");
    const json = (await res.json()) as { editions: Edition[] };
    setEditions(json.editions);
    if (!editionId && json.editions[0]) setEditionId(json.editions[0].id);
  }, [editionId]);

  const loadTab = useCallback(async () => {
    if (tab === "editions") {
      await loadEditions();
      return;
    }
    if (!editionId) return;
    const res = await fetch(
      `/api/admin/hackathon?tab=${tab}&editionId=${encodeURIComponent(editionId)}`,
    );
    if (!res.ok) throw new Error("load_failed");
    const json = (await res.json()) as Record<string, unknown[]>;
    const key =
      tab === "registrations"
        ? "registrations"
        : tab === "partners"
          ? "partners"
          : tab === "sponsors"
            ? "sponsors"
            : "people";
    setRows((json[key] as Record<string, unknown>[]) ?? []);
  }, [tab, editionId, loadEditions]);

  useEffect(() => {
    void loadTab().catch(() => setErr("Impossible de charger."));
  }, [loadTab]);

  async function createEdition(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/hackathon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: String(fd.get("slug")),
          nameFr: String(fd.get("nameFr")),
          nameEn: String(fd.get("nameEn")),
          city: String(fd.get("city") || "Kinshasa"),
          venue: String(fd.get("venue") || "") || undefined,
          status: String(fd.get("status") || "soon"),
          featured: fd.get("featured") === "on",
        }),
      });
      if (!res.ok) throw new Error("create_failed");
      e.currentTarget.reset();
      await loadEditions();
      setTab("editions");
    } catch {
      setErr("Création impossible (slug déjà pris ?).");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await fetch("/api/admin/hackathon", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await loadEditions();
  }

  async function setFeatured(id: string) {
    await fetch("/api/admin/hackathon", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, featured: true }),
    });
    await loadEditions();
  }

  async function patchLead(
    kind: "partner" | "sponsor",
    id: string,
    status: string,
  ) {
    await fetch("/api/admin/hackathon", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, status }),
    });
    await loadTab();
  }

  function exportCsv() {
    if (tab !== "registrations" || !rows.length) return;
    const headers = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "ticketPack",
      "paymentStatus",
      "ticketCode",
      "city",
      "createdAt",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hackathon-registrations-${editionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "editions", label: "Éditions" },
    { id: "registrations", label: "Participants" },
    { id: "partners", label: "Partenaires" },
    { id: "sponsors", label: "Sponsors" },
    { id: "people", label: "Jury / Mentors" },
  ];

  return (
    <div className={adminCls.page}>
      <div>
        <h2 className={adminCls.h1}>Hackathon</h2>
        <p className={adminCls.muted}>
          Multi-éditions — landing publique{" "}
          <a href="/hackathon" className="font-semibold text-[color:var(--fd-primary)]">
            /hackathon
          </a>
        </p>
      </div>

      {err ? <p className={adminCls.error}>{err}</p> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id ? adminCls.btnPrimary : adminCls.btnSecondary
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "editions" ? (
        <label className="block text-sm font-semibold text-[color:var(--fd-text)]">
          Édition
          <select
            className={`${adminCls.select} mt-1 block w-full max-w-md`}
            value={editionId}
            onChange={(e) => setEditionId(e.target.value)}
          >
            {editions.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.nameFr} ({ed.status}){ed.featured ? " ★" : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {tab === "editions" ? (
        <>
          <form onSubmit={createEdition} className={`${adminCls.card} space-y-3`}>
            <h3 className={adminCls.h2}>Nouvelle édition</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <input name="slug" required placeholder="slug (ex: lubumbashi-2027)" className={adminCls.input} />
              <input name="city" placeholder="Ville" defaultValue="Kinshasa" className={adminCls.input} />
              <input name="nameFr" required placeholder="Nom FR" className={adminCls.input} />
              <input name="nameEn" required placeholder="Name EN" className={adminCls.input} />
              <input name="venue" placeholder="Lieu" className={adminCls.input} />
              <select name="status" className={adminCls.select} defaultValue="soon">
                <option value="soon">Bientôt</option>
                <option value="open">Ouvert</option>
                <option value="closed">Fermé</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="featured" /> Featured (landing)
            </label>
            <button type="submit" disabled={busy} className={adminCls.btnPrimary}>
              Créer
            </button>
          </form>

          <ul className="space-y-3">
            {editions.map((ed) => (
              <li key={ed.id} className={adminCls.card}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[color:var(--fd-text)]">
                      {ed.nameFr}{" "}
                      {ed.featured ? (
                        <span className="text-[color:var(--fd-primary)]">★ featured</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[color:var(--fd-muted)]">
                      {ed.slug} · {ed.city} · {ed.status} · {ed.priceDay1Usd}/{ed.priceFullUsd} USD
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!ed.featured ? (
                      <button type="button" className={adminCls.btnSecondary} onClick={() => void setFeatured(ed.id)}>
                        Featured
                      </button>
                    ) : null}
                    <select
                      className={adminCls.select}
                      value={ed.status}
                      onChange={(e) => void setStatus(ed.id, e.target.value)}
                    >
                      <option value="soon">soon</option>
                      <option value="open">open</option>
                      <option value="closed">closed</option>
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {tab === "registrations" ? (
        <div className="space-y-3">
          <button type="button" className={adminCls.btnSecondary} onClick={exportCsv}>
            Export CSV
          </button>
          <div className="overflow-x-auto rounded-2xl border border-[color:var(--fd-border)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[color:var(--fd-mint)] text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                <tr>
                  <th className="px-3 py-2">Nom</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Pack</th>
                  <th className="px-3 py-2">Paiement</th>
                  <th className="px-3 py-2">Ticket</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.id)} className="border-t border-[color:var(--fd-border)]">
                    <td className="px-3 py-2 font-semibold">
                      {String(r.firstName)} {String(r.lastName)}
                    </td>
                    <td className="px-3 py-2">{String(r.email)}</td>
                    <td className="px-3 py-2">{String(r.ticketPack)}</td>
                    <td className="px-3 py-2">{String(r.paymentStatus)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{String(r.ticketCode ?? "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "partners" || tab === "sponsors" ? (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={String(r.id)} className={`${adminCls.card} flex flex-wrap items-center justify-between gap-2`}>
              <div>
                <p className="font-bold">
                  {String(r.orgName ?? r.companyName)} — {String(r.contactName)}
                </p>
                <p className="text-xs text-[color:var(--fd-muted)]">
                  {String(r.email)} · {String(r.status)}
                  {r.pack ? ` · ${String(r.pack)}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={adminCls.btnSecondary}
                  onClick={() =>
                    void patchLead(tab === "partners" ? "partner" : "sponsor", String(r.id), "confirmed")
                  }
                >
                  Confirmer
                </button>
                <button
                  type="button"
                  className={adminCls.btnSecondary}
                  onClick={() =>
                    void patchLead(tab === "partners" ? "partner" : "sponsor", String(r.id), "rejected")
                  }
                >
                  Rejeter
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "people" ? (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={String(r.id)} className={adminCls.card}>
              <p className="font-bold">
                [{String(r.role)}] {String(r.name)}
              </p>
              <p className="text-xs text-[color:var(--fd-muted)]">
                {[r.title, r.company, r.expertise].filter(Boolean).join(" · ")}
              </p>
            </li>
          ))}
          {!rows.length ? (
            <p className={adminCls.empty}>Aucun jury/mentor — seed ou ajoutez en DB.</p>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
