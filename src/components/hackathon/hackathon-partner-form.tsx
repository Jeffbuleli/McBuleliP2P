"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { HACKATHON_PARTNERSHIP_TYPES } from "@/lib/hackathon/constants";
import { preparePartnerLogoDataUrl } from "@/lib/hackathon/prepare-logo";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";
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

type Prefill = {
  contactName: string;
  email: string;
  phone: string;
  orgName: string;
  lockedEmail: boolean;
  partnerOrg: string | null;
};

export function HackathonPartnerForm({
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
    orgName: "",
    lockedEmail: false,
    partnerOrg: null,
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
          orgName: json.session.partnerOrg?.trim() || "",
          lockedEmail: true,
          partnerOrg: json.session.partnerOrg ?? null,
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
    const types = HACKATHON_PARTNERSHIP_TYPES.filter(
      (t) => fd.get(`type_${t}`) === "on",
    );
    const body = {
      editionId,
      orgName: String(fd.get("orgName") ?? ""),
      contactName: String(fd.get("contactName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: phone || undefined,
      partnershipTypes: types.length ? types : (["autre"] as const),
      logoUrl: logoUrl || undefined,
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
          ? "Merci - nous avons bien reçu votre demande. On finalise le rôle dans l'espace partenaires."
          : "Thanks - we received your request. Role details are finalized in the partner space."}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {prefill.lockedEmail ? (
        <p className="rounded-xl bg-[color:var(--fd-mint)]/45 px-4 py-2.5 text-xs text-[color:var(--fd-muted)]">
          {isFr
            ? `Connecté${prefill.partnerOrg ? ` · ${prefill.partnerOrg}` : ""} - profil prérempli. Détails (site, contribution) après échange.`
            : `Signed in${prefill.partnerOrg ? ` · ${prefill.partnerOrg}` : ""} - profile prefilled. Details after we talk.`}
        </p>
      ) : null}

      <div>
        <label className={hkLabel}>{isFr ? "Organisation" : "Organization"}</label>
        <input
          name="orgName"
          required
          defaultValue={prefill.orgName}
          key={`org-${prefill.orgName}`}
          className={hkField}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={hkLabel}>{isFr ? "Responsable" : "Contact"}</label>
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
            ? "Un seul numéro : MoMo + WhatsApp (wa.me/243…)."
            : "One number: MoMo + WhatsApp (wa.me/243…)."}
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

      <fieldset>
        <legend className={hkLabel}>
          {isFr ? "Intérêt (1 ou plusieurs)" : "Interest (one or more)"}
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {HACKATHON_PARTNERSHIP_TYPES.map((t) => (
            <label key={t} className={hkCheckChip}>
              <input type="checkbox" name={`type_${t}`} className={hkCheckbox} />
              {TYPE_LABELS[locale][t]}
            </label>
          ))}
        </div>
      </fieldset>

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
            ? "Devenir partenaire"
            : "Become a partner"}
      </button>
    </form>
  );
}
