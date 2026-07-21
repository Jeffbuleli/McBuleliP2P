"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  hkField,
  hkLabel,
  hkSelect,
  hkSelectChevronStyle,
} from "@/components/hackathon/hackathon-form-styles";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";

type Props = {
  editionId: string;
  locale: "fr" | "en";
  /** Unique 3-day program price (USD) */
  priceUsd: string;
  registrationOpen: boolean;
};

type SessionCtx = {
  session: {
    email: string;
    emailVerified: boolean;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  registration: {
    id: string;
    paymentStatus: string;
    ticketCode: string | null;
    payUrl: string | null;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
};

export function HackathonParticipantForm({
  editionId,
  locale,
  priceUsd,
  registrationOpen,
}: Props) {
  const isFr = locale === "fr";
  const [busy, setBusy] = useState(false);
  const intentRef = useRef<"reserve" | "pay_now">("reserve");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [prefill, setPrefill] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [existingReg, setExistingReg] = useState<SessionCtx["registration"]>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/hackathon/session-context?editionId=${encodeURIComponent(editionId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const json = (await res.json()) as SessionCtx;
        if (cancelled) return;
        if (json.session) {
          setSessionEmail(json.session.email);
          setSessionVerified(json.session.emailVerified);
          setPrefill({
            firstName: json.session.firstName,
            lastName: json.session.lastName,
            email: json.session.email,
            phone: json.session.phone
              ? normalizeCodPhoneNumber(json.session.phone) || json.session.phone
              : "",
          });
        }
        if (json.registration) {
          setExistingReg(json.registration);
          if (json.registration.payUrl) setPayUrl(json.registration.payUrl);
        }
      } catch {
        /* guest */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editionId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!registrationOpen) return;
    const intent = intentRef.current;
    setBusy(true);
    setMsg(null);
    setErr(null);
    setPayUrl(null);
    const fd = new FormData(e.currentTarget);
    const rawPhone = String(fd.get("phone") ?? "");
    const phone = normalizeCodPhoneNumber(rawPhone);
    if (!isValidCodMsisdn(phone)) {
      setErr(
        isFr
          ? "Le téléphone doit commencer par 243 (ex. 2438XXXXXXXX)."
          : "Phone must start with 243 (e.g. 2438XXXXXXXX).",
      );
      setBusy(false);
      return;
    }
    const body = {
      editionId,
      firstName: String(fd.get("firstName") ?? ""),
      lastName: String(fd.get("lastName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone,
      whatsapp: String(fd.get("whatsapp") ?? "") || undefined,
      city: String(fd.get("city") ?? "") || undefined,
      profession: String(fd.get("profession") ?? "") || undefined,
      company: String(fd.get("company") ?? "") || undefined,
      level: String(fd.get("level") ?? "beginner"),
      projectName: String(fd.get("projectName") ?? "") || undefined,
      projectDescription: String(fd.get("projectDescription") ?? "") || undefined,
      projectCategory: String(fd.get("projectCategory") ?? "") || undefined,
      workMode: String(fd.get("workMode") ?? "solo"),
      ticketPack: "full",
      intent,
      paymentMethod:
        intent === "pay_now"
          ? String(fd.get("paymentMethod") ?? "orange")
          : undefined,
      locale,
    };

    try {
      const res = await fetch("/api/hackathon/register", {
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
        mode?: string;
        payUrl?: string;
        holdHours?: number;
        existingAccount?: boolean;
      };
      if (!res.ok) {
        if (json.error === "already_registered") {
          setErr(
            isFr
              ? `Déjà inscrit${json.ticketCode ? ` - ticket ${json.ticketCode}` : ""}.`
              : `Already registered${json.ticketCode ? ` - ticket ${json.ticketCode}` : ""}.`,
          );
        } else if (json.error === "usdt_coming_soon") {
          setErr(
            isFr
              ? "Paiement USDT bientôt disponible - choisissez Orange, M-Pesa ou Airtel."
              : "USDT payment coming soon - choose Orange, M-Pesa or Airtel.",
          );
        } else if (json.error === "sold_out") {
          setErr(
            isFr
              ? "Plus de places disponibles pour cette édition."
              : "No seats left for this edition.",
          );
        } else if (json.error === "invalid_phone") {
          setErr(
            isFr
              ? "Le téléphone doit commencer par 243 (ex. 2438XXXXXXXX)."
              : "Phone must start with 243 (e.g. 2438XXXXXXXX).",
          );
        } else {
          setErr(
            json.message ||
              (isFr
                ? "Inscription impossible. Vérifiez vos infos et réessayez."
                : "Registration failed. Check your details and try again."),
          );
        }
        return;
      }
      if (json.mode === "pending_verify") {
        setMsg(
          isFr
            ? "Confirmez votre e-mail : un message de vérification vient de vous être envoyé. Dès confirmation, vous recevrez le lien de réservation / paiement. Compte McBuleli déjà lié à cet e-mail ? Utilisez « Mot de passe oublié » sur /login pour y accéder."
            : "Confirm your email: we just sent a verification message. Once confirmed, you will get the reservation / payment link. Already have a McBuleli account on this email? Use “Forgot password” on /login to access it.",
        );
        return;
      }
      if (json.mode === "reserved" && json.payUrl) {
        setPayUrl(json.payUrl);
        setMsg(
          isFr
            ? json.existingAccount
              ? "Place pré-réservée. Lien de paiement envoyé (compte McBuleli déjà lié à cet e-mail - Mot de passe oublié sur /login si besoin)."
              : "Place pré-réservée. Un e-mail avec le lien de paiement vous a été envoyé. Nous vous rappelons toutes les 24 h pour confirmer."
            : json.existingAccount
              ? "Seat reserved. Payment link emailed (McBuleli account already linked - use Forgot password on /login if needed)."
              : "Seat reserved. We emailed you a payment link. We remind you every 24 h to confirm.",
        );
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
      setMsg(
        isFr
          ? "Demande envoyée. Validez le paiement sur votre téléphone."
          : "Request sent. Confirm payment on your phone.",
      );
    } catch {
      setErr(isFr ? "Erreur réseau." : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!registrationOpen ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {isFr
            ? "Inscriptions fermées pour cette édition."
            : "Registration is closed for this edition."}
        </p>
      ) : null}

      {sessionEmail ? (
        <div className="rounded-xl border border-[color:var(--fd-primary)]/20 bg-[color:var(--fd-mint)]/60 px-4 py-3 text-sm text-[color:var(--fd-text)]">
          <p className="font-semibold text-[color:var(--fd-primary)]">
            {isFr ? "Connecté à McBuleli" : "Signed in to McBuleli"}
          </p>
          <p className="mt-1 text-[color:var(--fd-muted)]">
            {sessionVerified
              ? isFr
                ? `Compte vérifié · ${sessionEmail}. Vos infos sont préremplies - finalisez et payez en quelques clics.`
                : `Verified account · ${sessionEmail}. Details are prefilled - finish and pay in a few taps.`
              : isFr
                ? `Session active · ${sessionEmail}. Confirmez votre e-mail McBuleli pour accélérer le paiement.`
                : `Active session · ${sessionEmail}. Verify your McBuleli email to speed up payment.`}
          </p>
        </div>
      ) : (
        <p className="rounded-xl border border-[color:var(--fd-border)] bg-white px-4 py-3 text-xs leading-relaxed text-[color:var(--fd-muted)]">
          {isFr ? (
            <>
              Déjà un compte McBuleli ?{" "}
              <Link
                href={`/login?next=${encodeURIComponent("/hackathon#register")}`}
                className="font-semibold text-[color:var(--fd-primary)]"
              >
                Connectez-vous
              </Link>{" "}
              pour préremplir le formulaire.
            </>
          ) : (
            <>
              Already have a McBuleli account?{" "}
              <Link
                href={`/login?next=${encodeURIComponent("/hackathon#register")}`}
                className="font-semibold text-[color:var(--fd-primary)]"
              >
                Sign in
              </Link>{" "}
              to prefill this form.
            </>
          )}
        </p>
      )}

      {existingReg?.paymentStatus === "paid" && existingReg.ticketCode ? (
        <div className="rounded-xl border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)] px-4 py-4 text-center">
          <p className="text-sm font-bold text-[color:var(--fd-primary)]">
            {isFr ? "Vous êtes déjà inscrit" : "You are already registered"}
          </p>
          <p className="mt-1 font-mono text-xs font-semibold text-[color:var(--fd-text)]">
            {existingReg.ticketCode}
          </p>
          <Link
            href={`/hackathon/ticket/${encodeURIComponent(existingReg.ticketCode)}`}
            className="mt-3 inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-extrabold text-white"
          >
            {isFr ? "Voir mon ticket QR" : "View my QR ticket"}
          </Link>
        </div>
      ) : null}

      {existingReg?.paymentStatus === "reserved" && existingReg.payUrl ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
          <p className="text-sm font-bold text-amber-900">
            {isFr ? "Place déjà réservée" : "Seat already reserved"}
          </p>
          <p className="mt-1 text-xs text-amber-800">
            {isFr
              ? "Finalisez le paiement pour recevoir votre ticket QR."
              : "Complete payment to receive your QR ticket."}
          </p>
          <a
            href={existingReg.payUrl}
            className="mt-3 inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-extrabold text-white"
          >
            {isFr ? "Payer maintenant" : "Pay now"}
          </a>
        </div>
      ) : null}

      {existingReg?.paymentStatus === "paid" && existingReg.ticketCode ? null : (
      <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={hkLabel} htmlFor="hk-first">
            {isFr ? "Prénom" : "First name"}
          </label>
          <input
            id="hk-first"
            name="firstName"
            required
            defaultValue={prefill.firstName}
            key={`fn-${prefill.firstName}`}
            className={hkField}
            disabled={!registrationOpen}
          />
        </div>
        <div>
          <label className={hkLabel} htmlFor="hk-last">
            {isFr ? "Nom" : "Last name"}
          </label>
          <input
            id="hk-last"
            name="lastName"
            required
            defaultValue={prefill.lastName}
            key={`ln-${prefill.lastName}`}
            className={hkField}
            disabled={!registrationOpen}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={hkLabel} htmlFor="hk-email">
            Email
          </label>
          <input
            id="hk-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={prefill.email}
            key={`em-${prefill.email}`}
            readOnly={Boolean(sessionEmail)}
            className={`${hkField} ${sessionEmail ? "bg-[color:var(--fd-mint)]/40" : ""}`}
            disabled={!registrationOpen}
          />
          {sessionEmail ? (
            <p className="mt-1 text-[11px] text-[color:var(--fd-muted)]">
              {isFr
                ? "E-mail du compte connecté (non modifiable)."
                : "Signed-in account email (locked)."}
            </p>
          ) : null}
        </div>
        <div>
          <label className={hkLabel} htmlFor="hk-phone">
            {isFr ? "Téléphone (243…)" : "Phone (243…)"}
          </label>
          <input
            id="hk-phone"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            defaultValue={prefill.phone}
            key={`ph-${prefill.phone}`}
            className={hkField}
            placeholder="2438XXXXXXXX"
            disabled={!registrationOpen}
            onBlur={(e) => {
              const n = normalizeCodPhoneNumber(e.target.value);
              if (n) e.target.value = n;
            }}
          />
          <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
            {isFr
              ? "Le numéro doit commencer par 243."
              : "The number must start with 243."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={hkLabel} htmlFor="hk-wa">
            WhatsApp
          </label>
          <input id="hk-wa" name="whatsapp" className={hkField} disabled={!registrationOpen} />
        </div>
        <div>
          <label className={hkLabel} htmlFor="hk-city">
            {isFr ? "Ville" : "City"}
          </label>
          <input id="hk-city" name="city" className={hkField} disabled={!registrationOpen} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={hkLabel} htmlFor="hk-job">
            {isFr ? "Profession" : "Profession"}
          </label>
          <input id="hk-job" name="profession" className={hkField} disabled={!registrationOpen} />
        </div>
        <div>
          <label className={hkLabel} htmlFor="hk-co">
            {isFr ? "Entreprise (optionnel)" : "Company (optional)"}
          </label>
          <input id="hk-co" name="company" className={hkField} disabled={!registrationOpen} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={hkLabel} htmlFor="hk-level">
            {isFr ? "Niveau" : "Level"}
          </label>
          <select
            id="hk-level"
            name="level"
            className={hkSelect}
            style={hkSelectChevronStyle}
            defaultValue="beginner"
            disabled={!registrationOpen}
          >
            <option value="beginner">{isFr ? "Débutant" : "Beginner"}</option>
            <option value="intermediate">{isFr ? "Intermédiaire" : "Intermediate"}</option>
            <option value="advanced">{isFr ? "Avancé" : "Advanced"}</option>
          </select>
        </div>
        <div>
          <label className={hkLabel} htmlFor="hk-mode">
            {isFr ? "Travail" : "Work mode"}
          </label>
          <select
            id="hk-mode"
            name="workMode"
            className={hkSelect}
            style={hkSelectChevronStyle}
            defaultValue="solo"
            disabled={!registrationOpen}
          >
            <option value="solo">{isFr ? "Individuel" : "Solo"}</option>
            <option value="team">{isFr ? "Équipe" : "Team"}</option>
          </select>
        </div>
      </div>

      <div>
        <label className={hkLabel} htmlFor="hk-proj">
          {isFr ? "Nom du projet" : "Project name"}
        </label>
        <input id="hk-proj" name="projectName" className={hkField} disabled={!registrationOpen} />
      </div>
      <div>
        <label className={hkLabel} htmlFor="hk-desc">
          {isFr ? "Description" : "Description"}
        </label>
        <textarea id="hk-desc" name="projectDescription" rows={3} className={hkField} disabled={!registrationOpen} />
      </div>
      <div>
        <label className={hkLabel} htmlFor="hk-cat">
          {isFr ? "Catégorie" : "Category"}
        </label>
        <select
          id="hk-cat"
          name="projectCategory"
          className={hkSelect}
          style={hkSelectChevronStyle}
          defaultValue="ai"
          disabled={!registrationOpen}
        >
          {[
            ["ai", isFr ? "Intelligence artificielle" : "Artificial intelligence"],
            ["fintech", "FinTech"],
            ["govtech", "GovTech"],
            ["health", isFr ? "Santé" : "Health"],
            ["agriculture", isFr ? "Agriculture" : "Agriculture"],
            ["education", isFr ? "Éducation" : "Education"],
            ["media", isFr ? "Médias" : "Media"],
            ["cyber", isFr ? "Cybersécurité" : "Cybersecurity"],
            ["other", isFr ? "Autre" : "Other"],
          ].map(([value, optLabel]) => (
            <option key={value} value={value}>
              {optLabel}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {isFr ? "Tarif" : "Price"}
        </p>
        <p className="mt-1 text-lg font-semibold text-[color:var(--fd-text)]">
          {isFr
            ? `Programme 3 jours - ${priceUsd} USD`
            : `3-day program - ${priceUsd} USD`}
        </p>
        <input type="hidden" name="ticketPack" value="full" />
      </div>

      <p className="rounded-xl bg-[color:var(--fd-mint)]/50 px-4 py-3 text-sm text-[color:var(--fd-muted)]">
        {isFr
          ? "Pré-inscription gratuite : place réservée sans expiration, rappels toutes les 24 h pour confirmer. Ou payez tout de suite ci-dessous."
          : "Free pre-registration: seat held with no expiry, reminders every 24 h to confirm. Or pay now below."}
      </p>

      <div>
        <label className={hkLabel} htmlFor="hk-pay">
          {isFr ? "Moyen de paiement (si vous payez maintenant)" : "Payment method (if paying now)"}
        </label>
        <select
          id="hk-pay"
          name="paymentMethod"
          className={hkSelect}
          style={hkSelectChevronStyle}
          defaultValue="orange"
          disabled={!registrationOpen}
        >
            <option value="orange">Orange Money</option>
            <option value="mpesa">M-Pesa</option>
            <option value="airtel">Airtel Money</option>
            <option value="usdt">USDT ({isFr ? "bientôt" : "soon"})</option>
        </select>
      </div>

      {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}
      {msg ? <p className="text-sm font-semibold text-[color:var(--fd-primary)]">{msg}</p> : null}
      {payUrl ? (
        <a
          href={payUrl}
          className="inline-flex text-sm font-bold text-[color:var(--fd-primary)] underline"
        >
          {isFr ? "Payer maintenant" : "Pay now"}
        </a>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={busy || !registrationOpen}
          onClick={() => {
            intentRef.current = "reserve";
          }}
          className="w-full rounded-2xl bg-[color:var(--fd-primary)] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
        >
          {busy
            ? isFr
              ? "Envoi…"
              : "Sending…"
            : isFr
              ? "Pré-inscrire (gratuit)"
              : "Pre-register (free)"}
        </button>
        <button
          type="submit"
          disabled={busy || !registrationOpen}
          onClick={() => {
            intentRef.current = "pay_now";
          }}
          className="w-full rounded-2xl border border-[color:var(--fd-border)] bg-white px-4 py-3 text-sm font-extrabold text-[color:var(--fd-text)] disabled:opacity-60"
        >
          {isFr ? "S'inscrire et payer" : "Register & pay"}
        </button>
      </div>
      </>
      )}
    </form>
  );
}
