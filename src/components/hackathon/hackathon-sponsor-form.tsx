"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { preparePartnerLogoDataUrl } from "@/lib/hackathon/prepare-logo";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";
import {
  hkField,
  hkLabel,
  hkSelect,
  hkSelectChevronStyle,
} from "@/components/hackathon/hackathon-form-styles";

type Prefill = {
  contactName: string;
  email: string;
  phone: string;
  companyName: string;
  lockedEmail: boolean;
};

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
  const [prefill, setPrefill] = useState<Prefill>({
    contactName: "",
    email: "",
    phone: "",
    companyName: "",
    lockedEmail: false,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/hackathon/session-context?editionId=${encodeURIComponent(editionId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          session: {
            email: string;
            firstName: string;
            lastName: string;
            phone: string;
            partnerOrg?: string | null;
          } | null;
        };
        if (cancelled || !json.session) return;
        const name = [json.session.firstName, json.session.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        setPrefill({
          contactName: name,
          email: json.session.email,
          phone: json.session.phone
            ? normalizeCodPhoneNumber(json.session.phone) || json.session.phone
            : "",
          companyName: json.session.partnerOrg?.trim() || "",
          lockedEmail: true,
        });
      } catch {
        /* guest */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editionId]);

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
    const rawPhone = String(fd.get("phone") ?? "");
    const phone = rawPhone.trim()
      ? normalizeCodPhoneNumber(rawPhone)
      : undefined;
    if (phone && !isValidCodMsisdn(phone)) {
      setErr(
        isFr
          ? "Téléphone invalide (0…, +243… ou 243…)."
          : "Invalid phone (0…, +243… or 243…).",
      );
      setBusy(false);
      return;
    }
    const body = {
      editionId,
      companyName: String(fd.get("companyName") ?? ""),
      contactName: String(fd.get("contactName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: phone || undefined,
      pack: String(fd.get("pack") ?? "gold"),
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
          ? "Merci - demande de sponsorship reçue. On revient vers vous pour le pack."
          : "Thanks - sponsorship request received. We'll follow up on the pack."}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {prefill.lockedEmail ? (
        <p className="rounded-xl bg-[color:var(--fd-mint)]/45 px-4 py-2.5 text-xs text-[color:var(--fd-muted)]">
          {isFr
            ? "Connecté - profil prérempli. Budget détaillé après échange."
            : "Signed in - profile prefilled. Budget details after we talk."}
        </p>
      ) : null}

      <div>
        <label className={hkLabel}>{isFr ? "Entreprise" : "Company"}</label>
        <input
          name="companyName"
          required
          defaultValue={prefill.companyName}
          key={`co-${prefill.companyName}`}
          className={hkField}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={hkLabel}>{isFr ? "Contact" : "Contact"}</label>
          <input
            name="contactName"
            required
            autoComplete="name"
            defaultValue={prefill.contactName}
            key={`cn-${prefill.contactName}`}
            className={hkField}
          />
        </div>
        <div>
          <label className={hkLabel}>Email</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={prefill.email}
            key={`em-${prefill.email}`}
            readOnly={prefill.lockedEmail}
            className={`${hkField} ${prefill.lockedEmail ? "bg-[color:var(--fd-mint)]/40" : ""}`}
          />
        </div>
      </div>

      <div>
        <label className={hkLabel}>
          {isFr ? "Téléphone / WhatsApp" : "Phone / WhatsApp"}
        </label>
        <input
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={prefill.phone}
          key={`ph-${prefill.phone}`}
          className={hkField}
          placeholder={isFr ? "0812… / +243… / 243…" : "0812… / +243… / 243…"}
          onBlur={(e) => {
            const n = normalizeCodPhoneNumber(e.target.value);
            if (n) e.target.value = n;
          }}
        />
        <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
          {isFr
            ? "Accepte 0…, +243… ou 243…."
            : "Accepts 0…, +243… or 243…."}
        </p>
      </div>

      <div>
        <label className={hkLabel}>
          {isFr ? "Logo (optionnel)" : "Logo (optional)"}
        </label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={`${hkField} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--fd-mint)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[color:var(--fd-primary)]`}
          onChange={(ev) => void onLogoPick(ev.target.files?.[0] ?? null)}
        />
        {logoPreview ? (
          <span className="mt-2 inline-flex h-14 items-center rounded-xl bg-[color:var(--fd-card)] px-4 ring-1 ring-[color:var(--fd-border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPreview}
              alt=""
              className="max-h-9 max-w-[140px] object-contain"
            />
          </span>
        ) : null}
      </div>

      <div>
        <label className={hkLabel}>{isFr ? "Pack souhaité" : "Desired pack"}</label>
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
          <option value="custom">
            {isFr ? "À discuter" : "To discuss"}
          </option>
        </select>
      </div>

      {err ? (
        <p className="text-sm font-semibold text-[color:var(--hk-err,#b91c1c)]">
          {err}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-[color:var(--fd-primary)] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
      >
        {busy
          ? isFr
            ? "Envoi…"
            : "Sending…"
          : isFr
            ? "Sponsoriser"
            : "Sponsor"}
      </button>
    </form>
  );
}
