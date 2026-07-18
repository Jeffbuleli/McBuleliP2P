"use client";

import { useState } from "react";

export function HackathonSponsorForm({
  editionId,
  locale,
}: {
  editionId: string;
  locale: "fr" | "en";
}) {
  const isFr = locale === "fr";
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      editionId,
      companyName: String(fd.get("companyName") ?? ""),
      contactName: String(fd.get("contactName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? "") || undefined,
      website: String(fd.get("website") ?? "") || undefined,
      pack: String(fd.get("pack") ?? "bronze"),
      budgetNote: String(fd.get("budgetNote") ?? "") || undefined,
      comment: String(fd.get("comment") ?? "") || undefined,
      locale,
    };
    try {
      const res = await fetch("/api/hackathon/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setErr(isFr ? "Envoi impossible." : "Could not submit.");
        return;
      }
      setOk(true);
      e.currentTarget.reset();
    } catch {
      setErr(isFr ? "Erreur réseau." : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[color:var(--fd-primary)]";
  const label = "block text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]";

  if (ok) {
    return (
      <p className="rounded-xl bg-[color:var(--fd-mint)] px-4 py-3 text-sm font-semibold text-[color:var(--fd-primary)]">
        {isFr
          ? "Merci — demande de sponsorship reçue."
          : "Thanks — sponsorship request received."}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={label}>{isFr ? "Entreprise" : "Company"}</label>
        <input name="companyName" required className={field} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>{isFr ? "Contact" : "Contact"}</label>
          <input name="contactName" required className={field} />
        </div>
        <div>
          <label className={label}>Email</label>
          <input name="email" type="email" required className={field} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>{isFr ? "Téléphone" : "Phone"}</label>
          <input name="phone" className={field} />
        </div>
        <div>
          <label className={label}>{isFr ? "Site web" : "Website"}</label>
          <input name="website" className={field} />
        </div>
      </div>
      <div>
        <label className={label}>{isFr ? "Pack" : "Pack"}</label>
        <select name="pack" className={field} defaultValue="gold">
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
          <option value="custom">{isFr ? "Budget personnalisé" : "Custom budget"}</option>
        </select>
      </div>
      <div>
        <label className={label}>{isFr ? "Budget / notes" : "Budget / notes"}</label>
        <input name="budgetNote" className={field} />
      </div>
      <div>
        <label className={label}>{isFr ? "Commentaire" : "Comment"}</label>
        <textarea name="comment" rows={3} className={field} />
      </div>
      {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-[color:var(--fd-primary)] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
      >
        {busy ? (isFr ? "Envoi…" : "Sending…") : isFr ? "Sponsoriser" : "Sponsor"}
      </button>
    </form>
  );
}
