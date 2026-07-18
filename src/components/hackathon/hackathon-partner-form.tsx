"use client";

import { useState } from "react";
import { HACKATHON_PARTNERSHIP_TYPES } from "@/lib/hackathon/constants";

const TYPE_LABELS: Record<"fr" | "en", Record<string, string>> = {
  fr: {
    lieu: "Lieu",
    internet: "Internet",
    communication: "Communication",
    jury: "Jury",
    mentorat: "Mentorat",
    incubation: "Incubation",
    formation: "Formation",
    recrutement: "Recrutement",
    autre: "Autre",
  },
  en: {
    lieu: "Venue",
    internet: "Internet",
    communication: "Communication",
    jury: "Jury",
    mentorat: "Mentoring",
    incubation: "Incubation",
    formation: "Training",
    recrutement: "Recruiting",
    autre: "Other",
  },
};

export function HackathonPartnerForm({
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
    const types = HACKATHON_PARTNERSHIP_TYPES.filter((t) => fd.get(`type_${t}`) === "on");
    const body = {
      editionId,
      orgName: String(fd.get("orgName") ?? ""),
      contactName: String(fd.get("contactName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? "") || undefined,
      website: String(fd.get("website") ?? "") || undefined,
      sector: String(fd.get("sector") ?? "") || undefined,
      partnershipTypes: types.length ? types : (["autre"] as const),
      contribution: String(fd.get("contribution") ?? "") || undefined,
      locale,
    };
    try {
      const res = await fetch("/api/hackathon/partner", {
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
          ? "Merci — nous avons bien reçu votre demande de partenariat."
          : "Thanks — we received your partnership request."}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={label}>{isFr ? "Organisation" : "Organization"}</label>
        <input name="orgName" required className={field} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>{isFr ? "Responsable" : "Contact"}</label>
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
        <label className={label}>{isFr ? "Secteur" : "Sector"}</label>
        <input name="sector" className={field} />
      </div>
      <fieldset>
        <legend className={label}>{isFr ? "Type de partenariat" : "Partnership type"}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HACKATHON_PARTNERSHIP_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm font-medium text-[color:var(--fd-text)]">
              <input type="checkbox" name={`type_${t}`} />
              {TYPE_LABELS[locale][t]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className={label}>
          {isFr ? "Comment souhaitez-vous contribuer ?" : "How would you like to contribute?"}
        </label>
        <textarea name="contribution" rows={3} className={field} />
      </div>
      {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-[color:var(--fd-primary)] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
      >
        {busy ? (isFr ? "Envoi…" : "Sending…") : isFr ? "Devenir partenaire" : "Become a partner"}
      </button>
    </form>
  );
}
