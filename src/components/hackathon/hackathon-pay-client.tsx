"use client";

import Link from "next/link";
import { useState } from "react";
import {
  hkField,
  hkLabel,
  hkSelect,
  hkSelectChevronStyle,
} from "@/components/hackathon/hackathon-form-styles";

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      paymentMethod: String(fd.get("paymentMethod") ?? "orange"),
      phone: String(fd.get("phone") ?? phone),
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
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
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

  const packLabel =
    ticketPack === "day1"
      ? isFr
        ? "1 jour"
        : "1 day"
      : isFr
        ? "2 jours + Hackathon"
        : "2 days + Hackathon";

  const expiresLabel = holdExpiresAt
    ? new Date(holdExpiresAt).toLocaleString(isFr ? "fr-FR" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="home-theme fd-public-light flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] border border-[color:var(--fd-border)] bg-white p-6">
        <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
          McBuleli Hackathon
        </p>
        <h1 className="mt-3 text-center text-xl font-black text-[color:var(--fd-text)]">
          {isFr ? `Finaliser, ${firstName}` : `Complete payment, ${firstName}`}
        </h1>
        <p className="mt-2 text-center text-sm text-[color:var(--fd-muted)]">
          {editionName}
        </p>
        <dl className="mt-5 space-y-2 rounded-xl bg-[color:var(--fd-mint)]/40 px-4 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[color:var(--fd-muted)]">{isFr ? "Pack" : "Pack"}</dt>
            <dd className="font-semibold text-[color:var(--fd-text)]">{packLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[color:var(--fd-muted)]">{isFr ? "Montant" : "Amount"}</dt>
            <dd className="font-semibold text-[color:var(--fd-text)]">{priceUsd} USD</dd>
          </div>
          {expiresLabel ? (
            <div className="flex justify-between gap-3">
              <dt className="text-[color:var(--fd-muted)]">
                {isFr ? "Place retenue jusqu'au" : "Seat held until"}
              </dt>
              <dd className="font-semibold text-[color:var(--fd-text)]">{expiresLabel}</dd>
            </div>
          ) : null}
        </dl>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className={hkLabel} htmlFor="pay-phone">
              {isFr ? "Téléphone (MoMo)" : "Phone (MoMo)"}
            </label>
            <input
              id="pay-phone"
              name="phone"
              required
              defaultValue={phone}
              className={hkField}
            />
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
      </div>
    </div>
  );
}
