"use client";

import { useState } from "react";
import { HACKATHON_PARTNERSHIP_TYPES } from "@/lib/hackathon/constants";
import {
  hkCheckChip,
  hkCheckbox,
  hkField,
  hkLabel,
} from "@/components/hackathon/hackathon-form-styles";

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

  if (ok) {
    return (
      <p className="rounded-xl bg-[color:var(--fd-mint)] px-4 py-3 text-sm font-semibold text-[color:var(--fd-primary)]">
        {isFr
          ? "Merci - nous avons bien reçu votre demande de partenariat."
          : "Thanks - we received your partnership request."}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={hkLabel}>{isFr ? "Organisation" : "Organization"}</label>
        <input name="orgName" required className={hkField} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={hkLabel}>{isFr ? "Responsable" : "Contact"}</label>
          <input name="contactName" required className={hkField} />
        </div>
        <div>
          <label className={hkLabel}>Email</label>
          <input name="email" type="email" required className={hkField} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={hkLabel}>{isFr ? "Téléphone" : "Phone"}</label>
          <input name="phone" className={hkField} />
        </div>
        <div>
          <label className={hkLabel}>{isFr ? "Site web" : "Website"}</label>
          <input name="website" className={hkField} />
        </div>
      </div>
      <div>
        <label className={hkLabel}>{isFr ? "Secteur" : "Sector"}</label>
        <input name="sector" className={hkField} />
      </div>
      <fieldset>
        <legend className={hkLabel}>{isFr ? "Type de partenariat" : "Partnership type"}</legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {HACKATHON_PARTNERSHIP_TYPES.map((t) => (
            <label key={t} className={hkCheckChip}>
              <input type="checkbox" name={`type_${t}`} className={hkCheckbox} />
              {TYPE_LABELS[locale][t]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className={hkLabel}>
          {isFr ? "Comment souhaitez-vous contribuer ?" : "How would you like to contribute?"}
        </label>
        <textarea name="contribution" rows={3} className={hkField} />
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
