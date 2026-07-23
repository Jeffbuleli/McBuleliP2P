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

type PromoClaim = {
  id: string;
  amountUsd: number;
  status: string;
  requestedAt: string;
  resolvedAt: string | null;
  note: string | null;
};

type PromoRow = {
  id: string;
  editionId: string;
  code: string;
  orgName: string;
  partnerEmail: string;
  partnerName: string | null;
  discountPercent: number;
  cashbackUsd: number;
  active: boolean;
  dashboardToken: string;
  totals: {
    signups: number;
    confirmed: number;
    pending: number;
    cashbackUsd: number;
  };
  claimableUsd: number;
  claims: PromoClaim[];
};

type Tab =
  | "editions"
  | "registrations"
  | "partners"
  | "sponsors"
  | "people"
  | "promo";

type Props = {
  /** admin = full ops; stats = read-only lists for agents */
  mode?: "admin" | "stats";
};

export function HackathonAdminClient({ mode = "admin" }: Props) {
  const isAdmin = mode === "admin";
  const [tab, setTab] = useState<Tab>(isAdmin ? "editions" : "registrations");
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionId] = useState<string>("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);
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
    if (tab === "promo") {
      const res = await fetch(
        `/api/admin/hackathon?tab=promo&editionId=${encodeURIComponent(editionId)}`,
      );
      if (!res.ok) throw new Error("load_failed");
      const json = (await res.json()) as { promos: PromoRow[] };
      setPromos(json.promos ?? []);
      return;
    }
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
    void loadEditions().catch(() => setErr("Impossible de charger."));
  }, [loadEditions]);

  useEffect(() => {
    void loadTab().catch(() => setErr("Impossible de charger."));
  }, [loadTab]);

  async function createEdition(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAdmin) return;
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
          maxSeats: Number(fd.get("maxSeats") || 100) || 100,
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

  async function createPromo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAdmin || !editionId) return;
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/hackathon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "promo",
          editionId,
          code: String(fd.get("code")),
          orgName: String(fd.get("orgName")),
          partnerEmail: String(fd.get("partnerEmail")),
          partnerName: String(fd.get("partnerName") || "") || null,
          discountPercent: Number(fd.get("discountPercent") || 10),
          cashbackUsd: Number(fd.get("cashbackUsd") || 10),
        }),
      });
      if (!res.ok) throw new Error("create_failed");
      e.currentTarget.reset();
      await loadTab();
    } catch {
      setErr("Création / mise à jour du code promo impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function patchEdition(id: string, patch: Record<string, unknown>) {
    if (!isAdmin) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/hackathon", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) throw new Error("patch_failed");
      await loadEditions();
    } catch {
      setErr("Mise à jour impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await patchEdition(id, { status });
  }

  async function setFeatured(id: string) {
    await patchEdition(id, { featured: true });
  }

  async function patchLead(
    kind: "partner" | "sponsor",
    id: string,
    status: string,
  ) {
    if (!isAdmin) return;
    await fetch("/api/admin/hackathon", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, status }),
    });
    await loadTab();
  }

  async function patchRegistration(
    id: string,
    action: "relink_user" | "resend_verify",
  ) {
    if (!isAdmin) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/hackathon", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "registration", id, action }),
      });
      if (!res.ok) throw new Error("patch_failed");
      await loadTab();
    } catch {
      setErr("Action participant impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePromo(id: string, active: boolean) {
    if (!isAdmin) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/hackathon", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "promo", id, active }),
      });
      if (!res.ok) throw new Error("patch_failed");
      await loadTab();
    } catch {
      setErr("Activation code impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function resolveClaim(
    id: string,
    status: "approved" | "paid" | "rejected",
  ) {
    if (!isAdmin) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/hackathon", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "promo_claim", id, status }),
      });
      if (!res.ok) throw new Error("patch_failed");
      await loadTab();
    } catch {
      setErr("Traitement cashback impossible.");
    } finally {
      setBusy(false);
    }
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
      "holdExpiresAt",
      "userId",
      "userDisplayName",
      "userEmail",
      "userEmailVerified",
      "userDuplicateInEdition",
      "userEmailMismatch",
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

  const tabs: { id: Tab; label: string }[] = isAdmin
    ? [
        { id: "editions", label: "Éditions" },
        { id: "registrations", label: "Participants" },
        { id: "partners", label: "Partenaires" },
        { id: "sponsors", label: "Sponsors" },
        { id: "people", label: "Jury / Mentors" },
        { id: "promo", label: "Promo / Cashback" },
      ]
    : [
        { id: "registrations", label: "Participants" },
        { id: "partners", label: "Partenaires" },
        { id: "sponsors", label: "Sponsors" },
        { id: "people", label: "Jury / Mentors" },
        { id: "promo", label: "Promo (lecture)" },
      ];

  return (
    <div className={adminCls.page}>
      <div>
        <h2 className={adminCls.h1}>
          Hackathon{isAdmin ? "" : " - stats"}
        </h2>
        <p className={adminCls.muted}>
          Multi-éditions - landing publique{" "}
          <a href="/hackathon" className="font-semibold text-[color:var(--fd-primary)]">
            /hackathon
          </a>
          {" · "}
          <a
            href="/admin/hackathon/scan"
            className="font-semibold text-[color:var(--fd-primary)]"
          >
            Scanner porte
          </a>
          {!isAdmin ? " · lecture seule" : null}
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

      {tab === "editions" && isAdmin ? (
        <>
          <form onSubmit={createEdition} className={`${adminCls.card} space-y-3`}>
            <h3 className={adminCls.h2}>Nouvelle édition</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <input name="slug" required placeholder="slug (ex: lubumbashi-2026)" className={adminCls.input} />
              <input name="city" placeholder="Ville" defaultValue="Kinshasa" className={adminCls.input} />
              <input name="nameFr" required placeholder="Nom FR" className={adminCls.input} />
              <input name="nameEn" required placeholder="Name EN" className={adminCls.input} />
              <input name="venue" placeholder="Lieu" defaultValue="Silikin Village, 63, Ave Colonel Mondjiba" className={adminCls.input} />
              <input name="maxSeats" type="number" placeholder="Places (100)" defaultValue="100" className={adminCls.input} />
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
                      {ed.slug} · {ed.city} · {ed.status} · {ed.priceDay1Usd}/{ed.priceFullUsd} USD ·{" "}
                      {ed.maxSeats} places
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
                      {ed.venue ?? "-"}
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
                <form
                  className="mt-4 grid gap-2 border-t border-[color:var(--fd-border)] pt-4 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    void patchEdition(ed.id, {
                      venue: String(fd.get("venue") || "") || null,
                      maxSeats: Number(fd.get("maxSeats") || ed.maxSeats),
                      priceDay1Usd: String(fd.get("priceDay1Usd") || ed.priceDay1Usd),
                      priceFullUsd: String(fd.get("priceFullUsd") || ed.priceFullUsd),
                      city: String(fd.get("city") || ed.city),
                    });
                  }}
                >
                  <input name="venue" defaultValue={ed.venue ?? ""} placeholder="Lieu" className={adminCls.input} />
                  <input name="city" defaultValue={ed.city} placeholder="Ville" className={adminCls.input} />
                  <input name="maxSeats" type="number" defaultValue={ed.maxSeats} className={adminCls.input} />
                  <input name="priceDay1Usd" defaultValue={ed.priceDay1Usd} placeholder="Prix 1j" className={adminCls.input} />
                  <input name="priceFullUsd" defaultValue={ed.priceFullUsd} placeholder="Prix full" className={adminCls.input} />
                  <button type="submit" disabled={busy} className={adminCls.btnPrimary}>
                    Enregistrer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {tab === "registrations" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={adminCls.btnSecondary} onClick={exportCsv}>
              Export CSV
            </button>
            <p className="text-xs text-[color:var(--fd-muted)]">
              Compte = user McBuleli lié par e-mail. « Doublon user » = même UUID sur
              plusieurs lignes (anomalie). « E-mail ≠ compte » = userId rattaché au
              mauvais e-mail.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[color:var(--fd-border)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[color:var(--fd-mint)] text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                <tr>
                  <th className="px-3 py-2">Nom</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Tél</th>
                  <th className="px-3 py-2">Pack</th>
                  <th className="px-3 py-2">Paiement</th>
                  <th className="px-3 py-2">Hold</th>
                  <th className="px-3 py-2">Compte McBuleli</th>
                  <th className="px-3 py-2">Ticket</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const userId = r.userId ? String(r.userId) : "";
                  const duplicate = Boolean(r.userDuplicateInEdition);
                  const mismatch = Boolean(r.userEmailMismatch);
                  const verified = Boolean(r.userEmailVerified);
                  const status = String(r.paymentStatus);
                  return (
                    <tr
                      key={String(r.id)}
                      className={`border-t border-[color:var(--fd-border)] ${
                        duplicate || mismatch ? "bg-amber-50/80" : ""
                      }`}
                    >
                      <td className="px-3 py-2 font-semibold">
                        {String(r.firstName)} {String(r.lastName)}
                      </td>
                      <td className="px-3 py-2">{String(r.email)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{String(r.phone ?? "-")}</td>
                      <td className="px-3 py-2">{String(r.ticketPack)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            status === "pending_verify"
                              ? "font-semibold text-amber-800"
                              : status === "reserved"
                                ? "font-semibold text-[color:var(--fd-primary)]"
                                : status === "paid"
                                  ? "font-semibold text-emerald-700"
                                  : ""
                          }
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-[color:var(--fd-muted)]">
                        {r.holdExpiresAt
                          ? new Date(String(r.holdExpiresAt)).toLocaleString("fr-FR")
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {userId ? (
                          <div className="space-y-0.5">
                            <a
                              href={`/admin/users/${userId}`}
                              className="font-mono text-[11px] font-semibold text-[color:var(--fd-primary)] underline-offset-2 hover:underline"
                              title={userId}
                            >
                              {userId.slice(0, 8)}
                            </a>
                            <p className="text-[color:var(--fd-muted)]">
                              {String(r.userDisplayName ?? "-")}
                              {verified ? " · vérifié" : " · non vérifié"}
                            </p>
                            {duplicate ? (
                              <p className="font-semibold text-amber-800">Doublon user</p>
                            ) : null}
                            {mismatch ? (
                              <p className="font-semibold text-red-700">
                                E-mail ≠ compte ({String(r.userEmail)})
                              </p>
                            ) : null}
                            {isAdmin &&
                            (mismatch || !userId || status === "pending_verify") ? (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {mismatch || !userId ? (
                                  <button
                                    type="button"
                                    className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-border)]"
                                    onClick={() =>
                                      void patchRegistration(String(r.id), "relink_user")
                                    }
                                  >
                                    Relier e-mail
                                  </button>
                                ) : null}
                                {status === "pending_verify" ? (
                                  <button
                                    type="button"
                                    className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-amber-900 ring-1 ring-amber-200"
                                    onClick={() =>
                                      void patchRegistration(String(r.id), "resend_verify")
                                    }
                                  >
                                    Renvoyer vérif.
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{String(r.ticketCode ?? "-")}</td>
                    </tr>
                  );
                })}
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
                  {String(r.orgName ?? r.companyName)} - {String(r.contactName)}
                </p>
                <p className="text-xs text-[color:var(--fd-muted)]">
                  {String(r.email)} · {String(r.status)}
                  {r.pack ? ` · ${String(r.pack)}` : ""}
                </p>
              </div>
              {isAdmin ? (
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
              ) : null}
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
            <p className={adminCls.empty}>Aucun jury/mentor - seed ou ajoutez en DB.</p>
          ) : null}
        </ul>
      ) : null}

      {tab === "promo" ? (
        <div className="space-y-4">
          {isAdmin ? (
            <form onSubmit={createPromo} className={`${adminCls.card} space-y-3`}>
              <h3 className={adminCls.h2}>Créer / upsert code promo</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="code" required placeholder="CODE" className={adminCls.input} />
                <input name="orgName" required placeholder="Organisation" className={adminCls.input} />
                <input name="partnerEmail" required type="email" placeholder="Email partenaire" className={adminCls.input} />
                <input name="partnerName" placeholder="Nom contact" className={adminCls.input} />
                <input name="discountPercent" type="number" defaultValue={10} placeholder="% remise" className={adminCls.input} />
                <input name="cashbackUsd" type="number" defaultValue={10} placeholder="Cashback USD" className={adminCls.input} />
              </div>
              <button type="submit" disabled={busy || !editionId} className={adminCls.btnPrimary}>
                Enregistrer
              </button>
            </form>
          ) : null}

          <ul className="space-y-3">
            {promos.map((p) => (
              <li key={p.id} className={adminCls.card}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[color:var(--fd-text)]">
                      {p.code}{" "}
                      <span
                        className={
                          p.active
                            ? "text-emerald-700"
                            : "text-[color:var(--fd-muted)]"
                        }
                      >
                        {p.active ? "actif" : "inactif"}
                      </span>
                    </p>
                    <p className="text-xs text-[color:var(--fd-muted)]">
                      {p.orgName} · {p.partnerEmail}
                      {p.partnerName ? ` · ${p.partnerName}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
                      -{p.discountPercent}% · cashback {p.cashbackUsd} USD · inscrits{" "}
                      {p.totals.signups} · confirmés {p.totals.confirmed} · dû{" "}
                      {p.totals.cashbackUsd} USD · réclamable {p.claimableUsd} USD
                    </p>
                    {isAdmin ? (
                      <p className="mt-1 break-all text-[11px] text-[color:var(--fd-muted)]">
                        Dashboard :{" "}
                        <a
                          href={`/hackathon/promo/dashboard/${p.dashboardToken}`}
                          className="font-semibold text-[color:var(--fd-primary)] underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          /hackathon/promo/dashboard/...
                        </a>
                      </p>
                    ) : null}
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={adminCls.btnSecondary}
                      disabled={busy}
                      onClick={() => void togglePromo(p.id, !p.active)}
                    >
                      {p.active ? "Désactiver" : "Activer"}
                    </button>
                  ) : null}
                </div>

                {p.claims.length ? (
                  <ul className="mt-3 space-y-2 border-t border-[color:var(--fd-border)] pt-3">
                    {p.claims.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span>
                          <span className="font-semibold">{c.amountUsd} USD</span>{" "}
                          · {c.status} ·{" "}
                          {new Date(c.requestedAt).toLocaleString("fr-FR")}
                          {c.note ? ` · ${c.note}` : ""}
                        </span>
                        {isAdmin &&
                        (c.status === "requested" || c.status === "approved") ? (
                          <div className="flex flex-wrap gap-1">
                            {c.status === "requested" ? (
                              <>
                                <button
                                  type="button"
                                  className={adminCls.btnSecondary}
                                  disabled={busy}
                                  onClick={() => void resolveClaim(c.id, "approved")}
                                >
                                  Approuver
                                </button>
                                <button
                                  type="button"
                                  className={adminCls.btnSecondary}
                                  disabled={busy}
                                  onClick={() => void resolveClaim(c.id, "rejected")}
                                >
                                  Rejeter
                                </button>
                              </>
                            ) : null}
                            {c.status === "approved" || c.status === "requested" ? (
                              <button
                                type="button"
                                className={adminCls.btnPrimary}
                                disabled={busy}
                                onClick={() => void resolveClaim(c.id, "paid")}
                              >
                                Marquer payé
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-[color:var(--fd-muted)]">
                    Aucune demande cashback.
                  </p>
                )}
              </li>
            ))}
            {!promos.length ? (
              <p className={adminCls.empty}>Aucun code promo pour cette édition.</p>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
