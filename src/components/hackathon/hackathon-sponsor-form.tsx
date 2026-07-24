"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { preparePartnerLogoDataUrl } from "@/lib/hackathon/prepare-logo";
import {
  hkField,
  hkLabel,
  hkSelect,
  hkSelectChevronStyle,
} from "@/components/hackathon/hackathon-form-styles";

export function HackathonSponsorForm({
  editionId,
  locale: _localeProp,
}: {
  editionId: string;
  /** @deprecated Prefer live useI18n(); kept for call-site compatibility. */
  locale?: "fr" | "en";
}) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  async function onLogoPick(file: File | null) {
    setErr(null);
    if (!file) {
      setLogoPreview(null);
      setLogoUrl(null);
      return;
    }
    try {
      const dataUrl = await preparePartnerLogoDataUrl(file);
      setLogoUrl(dataUrl);
      setLogoPreview(dataUrl);
    } catch {
      setErr(isFr ? "Logo invalide ou trop lourd." : "Invalid or oversized logo.");
      setLogoPreview(null);
      setLogoUrl(null);
    }
  }

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
      logoUrl: logoUrl || undefined,
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
      setLogoPreview(null);
      setLogoUrl(null);
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
          ? "Merci - demande de sponsorship reçue."
          : "Thanks - sponsorship request received."}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={hkLabel}>{isFr ? "Entreprise" : "Company"}</label>
        <input name="companyName" required className={hkField} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={hkLabel}>{isFr ? "Contact" : "Contact"}</label>
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
        <label className={hkLabel}>
          {isFr ? "Logo (PNG, JPG ou WebP)" : "Logo (PNG, JPG or WebP)"}
        </label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={`${hkField} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--fd-mint)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[color:var(--fd-primary)]`}
          onChange={(ev) => void onLogoPick(ev.target.files?.[0] ?? null)}
        />
        {logoPreview ? (
          <span className="mt-2 inline-flex h-14 items-center rounded-xl bg-white px-4 ring-1 ring-[color:var(--fd-border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoPreview} alt="" className="max-h-9 max-w-[140px] object-contain" />
          </span>
        ) : null}
      </div>
      <div>
        <label className={hkLabel}>{isFr ? "Pack" : "Pack"}</label>
        <select
          name="pack"
          className={hkSelect}
          style={hkSelectChevronStyle}
          defaultValue="gold"
        >
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
          <option value="custom">{isFr ? "Budget personnalisé" : "Custom budget"}</option>
        </select>
      </div>
      <div>
        <label className={hkLabel}>{isFr ? "Budget / notes" : "Budget / notes"}</label>
        <input name="budgetNote" className={hkField} />
      </div>
      <div>
        <label className={hkLabel}>{isFr ? "Commentaire" : "Comment"}</label>
        <textarea name="comment" rows={3} className={hkField} />
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
