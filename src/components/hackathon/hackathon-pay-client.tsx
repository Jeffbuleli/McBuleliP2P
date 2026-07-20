"use client";

import Link from "next/link";
import { useState } from "react";
import {
  hkField,
  hkLabel,
  hkSelect,
  hkSelectChevronStyle,
} from "@/components/hackathon/hackathon-form-styles";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
import { SUPPORT_X } from "@/lib/support-contact";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";

type Props = {
  token: string;
  locale: "fr" | "en";
  firstName: string;
  editionName: string;
  ticketPack: string;
  priceUsd: string;
  phone: string;
  holdExpiresAt: string | null;
};

export function HackathonPayClient({
  token,
  locale,
  firstName,
  editionName,
  ticketPack,
  priceUsd,
  phone,
  holdExpiresAt,
}: Props) {
  const isFr = locale === "fr";
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState(
    normalizeCodPhoneNumber(phone) || phone,
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const normalized = normalizeCodPhoneNumber(phoneValue);
    if (!isValidCodMsisdn(normalized)) {
      setErr(
        isFr
          ? "Le numéro doit commencer par 243 (ex. 2438XXXXXXXX)."
          : "The number must start with 243 (e.g. 2438XXXXXXXX).",
      );
      setBusy(false);
      return;
    }
    setPhoneValue(normalized);
    const fd = new FormData(e.currentTarget);
    const body = {
      paymentMethod: String(fd.get("paymentMethod") ?? "orange"),
      phone: normalized,
    };
    try {
      const res = await fetch(`/api/hackathon/pay/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        checkoutUrl?: string;
        reference?: string;
        ticketCode?: string;
      };
      if (!res.ok) {
        if (json.error === "hold_expired") {
          setErr(
            isFr
              ? "Réservation expirée. Pré-inscrivez-vous à nouveau."
              : "Hold expired. Please pre-register again.",
          );
        } else if (json.error === "already_registered") {
          setErr(isFr ? "Déjà payé." : "Already paid.");
        } else if (json.error === "invalid_phone") {
          setErr(
            isFr
              ? "Le numéro doit commencer par 243."
              : "The number must start with 243.",
          );
        } else if (json.error === "usdt_coming_soon") {
          setErr(
            isFr
              ? "USDT bientôt disponible - choisissez Orange, M-Pesa ou Airtel."
              : "USDT coming soon - choose Orange, M-Pesa or Airtel.",
          );
        } else {
          setErr(
            json.message ||
              (isFr ? "Paiement impossible." : "Payment failed."),
          );
        }
        return;
      }
      if (json.reference) {
        window.location.href = `/hackathon/payment/${encodeURIComponent(json.reference)}`;
        return;
      }
      setErr(isFr ? "Réponse inattendue." : "Unexpected response.");
    } catch {
      setErr(isFr ? "Erreur réseau." : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  const packLabel = isFr ? "Programme 3 jours" : "3-day program";

  const expiresLabel = holdExpiresAt
    ? new Date(holdExpiresAt).toLocaleString(isFr ? "fr-FR" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="home-theme fd-public-light flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] border border-[color:var(--fd-border)] bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_LOGO_256}
            alt="McBuleli"
            width={56}
            height={56}
            className="h-14 w-14 rounded-xl"
          />
          <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
            McBuleli Hackathon
          </p>
        </div>
        <h1 className="mt-4 text-center text-xl font-black text-[color:var(--fd-text)]">
          {isFr ? `Finaliser, ${firstName}` : `Complete payment, ${firstName}`}
        </h1>
        <p className="mt-2 text-center text-sm text-[color:var(--fd-muted)]">
          {editionName}
        </p>
        <dl className="mt-5 divide-y divide-[color:var(--fd-primary)]/10 overflow-hidden rounded-xl border border-[color:var(--fd-primary)]/15 bg-[color:var(--fd-mint)]/35 text-sm">
          <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-3 px-4 py-3">
            <dt className="text-[color:var(--fd-muted)]">{isFr ? "Pack" : "Pack"}</dt>
            <dd className="text-right font-semibold text-[color:var(--fd-text)]">{packLabel}</dd>
          </div>
          <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-3 px-4 py-3">
            <dt className="text-[color:var(--fd-muted)]">{isFr ? "Montant" : "Amount"}</dt>
            <dd className="text-right font-semibold text-[color:var(--fd-text)]">{priceUsd} USD</dd>
          </div>
          {expiresLabel ? (
            <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-3 px-4 py-3">
              <dt className="text-[color:var(--fd-muted)]">
                {isFr ? "Retenue jusqu'au" : "Held until"}
              </dt>
              <dd className="text-right font-semibold leading-snug text-[color:var(--fd-text)]">
                {expiresLabel}
              </dd>
            </div>
          ) : null}
        </dl>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className={hkLabel} htmlFor="pay-phone">
              {isFr ? "Téléphone MoMo (243…)" : "MoMo phone (243…)"}
            </label>
            <input
              id="pay-phone"
              name="phone"
              required
              inputMode="tel"
              autoComplete="tel"
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              onBlur={() => {
                const n = normalizeCodPhoneNumber(phoneValue);
                if (n) setPhoneValue(n);
              }}
              className={hkField}
              placeholder="2438XXXXXXXX"
            />
            <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
              {isFr
                ? "Le numéro doit commencer par 243."
                : "The number must start with 243."}
            </p>
          </div>
          <div>
            <label className={hkLabel} htmlFor="pay-method">
              {isFr ? "Paiement" : "Payment"}
            </label>
            <select
              id="pay-method"
              name="paymentMethod"
              className={hkSelect}
              style={hkSelectChevronStyle}
              defaultValue="orange"
            >
              <option value="orange">Orange Money</option>
              <option value="mpesa">M-Pesa</option>
              <option value="airtel">Airtel Money</option>
              <option value="usdt">USDT ({isFr ? "bientôt" : "soon"})</option>
            </select>
          </div>
          {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}
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
                ? "Payer maintenant"
                : "Pay now"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs">
          <Link href="/hackathon" className="font-semibold text-[color:var(--fd-primary)]">
            ← Hackathon
          </Link>
        </p>

        <a
          href={SUPPORT_X}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex items-center justify-center gap-2 border-t border-[color:var(--fd-border)] pt-5 text-sm font-semibold text-[color:var(--fd-text)] transition hover:text-[color:var(--fd-primary)]"
        >
          <span className="text-xs font-medium text-[color:var(--fd-muted)]">Powered by</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--fd-mint)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_256}
              alt=""
              width={28}
              height={28}
              className="h-full w-full object-contain p-0.5"
            />
          </span>
          <span>McBuleli</span>
        </a>
      </div>
    </div>
  );
}
