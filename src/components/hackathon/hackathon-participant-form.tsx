"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
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
  /** @deprecated Prefer live useI18n(); kept for call-site compatibility. */
  locale?: "fr" | "en";
  /** Unique 2-day program price (USD) */
  priceUsd: string;
  registrationOpen: boolean;
};

type LockedPromo = {
  code: string;
  orgName: string;
  discountPercent: number;
  priceUsd: string;
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

export function HackathonParticipantForm(props: Props) {
  return (
    <Suspense fallback={null}>
      <HackathonParticipantFormInner {...props} />
    </Suspense>
  );
}

function HackathonParticipantFormInner({
  editionId,
  priceUsd,
  registrationOpen,
}: Props) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const searchParams = useSearchParams();
  const promoParam = searchParams.get("promo")?.trim() ?? "";
  const [busy, setBusy] = useState(false);
  const intentRef = useRef<"reserve" | "pay_now">("reserve");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [lockedPromo, setLockedPromo] = useState<LockedPromo | null>(null);
  const [prefill, setPrefill] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [existingReg, setExistingReg] = useState<SessionCtx["registration"]>(null);

  const effectivePriceUsd = lockedPromo?.priceUsd ?? priceUsd;

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

  useEffect(() => {
    if (!promoParam) {
      setLockedPromo(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/hackathon/promo?code=${encodeURIComponent(promoParam)}&editionId=${encodeURIComponent(editionId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          if (!cancelled) setLockedPromo(null);
          return;
        }
        const json = (await res.json()) as LockedPromo;
        if (cancelled) return;
        setLockedPromo({
          code: json.code,
          orgName: json.orgName,
          discountPercent: json.discountPercent,
          priceUsd: json.priceUsd,
        });
      } catch {
        if (!cancelled) setLockedPromo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [promoParam, editionId]);

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
      level: "beginner",
      workMode: "solo",
      ticketPack: "full",
      intent,
      paymentMethod:
        intent === "pay_now"
          ? String(fd.get("paymentMethod") ?? "orange")
          : undefined,
      ...(lockedPromo?.code ? { promoCode: lockedPromo.code } : {}),
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
        } else if (json.error === "invalid_promo") {
          setErr(
            isFr
              ? "Code promo invalide ou inactif."
              : "Invalid or inactive promo code.",
          );
        } else {
          setErr(
            json.message ||
              (isFr
                ? "Inscription impossible. Vérifiez vos infos et réessayez."
                : "Registration failed. Check your details and try again."),
          );
          if (json.payUrl) {
            setPayUrl(json.payUrl);
          }
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
        <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-[color:var(--hk-warn-text,#92400e)]">
          {isFr
            ? "Inscriptions fermées pour cette édition."
            : "Registration is closed for this edition."}
        </p>
      ) : null}

      {lockedPromo ? (
        <div className="rounded-xl border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)]/70 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
            {isFr ? "Code partenaire" : "Partner code"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <input
              type="text"
              readOnly
              value={lockedPromo.code}
              className={`${hkField} max-w-[12rem] bg-[color:var(--fd-card)] font-mono font-bold tracking-wide`}
              aria-label={isFr ? "Code promo (non modifiable)" : "Promo code (locked)"}
            />
            <span className="text-sm font-semibold text-[color:var(--fd-text)]">
              -{lockedPromo.discountPercent}% - {lockedPromo.priceUsd} USD
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[color:var(--fd-muted)]">
            {isFr
              ? `Appliqué via le lien ${lockedPromo.orgName} (non modifiable).`
              : `Applied via ${lockedPromo.orgName} link (locked).`}
          </p>
        </div>
      ) : null}

      {sessionEmail ? (
        <div className="rounded-xl border border-[color:var(--fd-primary)]/20 bg-[color:var(--fd-mint)]/60 px-4 py-3 text-sm text-[color:var(--fd-text)]">
          <p className="font-semibold text-[color:var(--fd-primary)]">
            {isFr ? "Connecté à McBuleli" : "Signed in to McBuleli"}
          </p>
          <p className="mt-1 text-[color:var(--fd-muted)]">
            {sessionVerified
              ? isFr
                ? `Compte vérifié · ${sessionEmail}. Ce compte seul ne réserve pas de place : finalisez le formulaire ci-dessous et payez pour être sur la liste des inscrits.`
                : `Verified account · ${sessionEmail}. An account alone does not reserve a seat: finish the form below and pay to appear on the participants list.`
              : isFr
                ? `Session active · ${sessionEmail}. Confirmez votre e-mail McBuleli, puis finalisez le formulaire + paiement.`
                : `Active session · ${sessionEmail}. Verify your McBuleli email, then finish the form + payment.`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-[color:var(--hk-warn-text,#92400e)]">
          <p className="font-bold">
            {isFr
              ? "Important : créer un compte McBuleli ≠ inscription hackathon"
              : "Important: creating a McBuleli account ≠ hackathon registration"}
          </p>
          <p className="mt-1">
            {isFr ? (
              <>
                Remplissez ce formulaire puis payez (Mobile Money) pour être inscrit.
                Déjà un compte ?{" "}
                <Link
                  href={`/login?next=${encodeURIComponent("/hackathon#register")}`}
                  className="font-semibold underline"
                >
                  Connectez-vous
                </Link>{" "}
                pour préremplir.
              </>
            ) : (
              <>
                Fill this form then pay (Mobile Money) to be registered.
                Already have an account?{" "}
                <Link
                  href={`/login?next=${encodeURIComponent("/hackathon#register")}`}
                  className="font-semibold underline"
                >
                  Sign in
                </Link>{" "}
                to prefill.
              </>
            )}
          </p>
        </div>
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
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-4 text-center">
          <p className="text-sm font-bold text-[color:var(--hk-warn-text,#92400e)]">
            {isFr ? "Place déjà réservée" : "Seat already reserved"}
          </p>
          <p className="mt-1 text-xs text-[color:var(--hk-warn-muted,#b45309)]">
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
            autoComplete="given-name"
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
            autoComplete="family-name"
            defaultValue={prefill.lastName}
            key={`ln-${prefill.lastName}`}
            className={hkField}
            disabled={!registrationOpen}
          />
        </div>
      </div>

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
              ? "E-mail du compte McBuleli (non modifiable)."
              : "McBuleli account email (locked)."}
          </p>
        ) : null}
      </div>

      <div>
        <label className={hkLabel} htmlFor="hk-phone">
          {isFr ? "Téléphone Mobile Money" : "Mobile Money phone"}
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
          placeholder={isFr ? "0812… / +243… / 243…" : "0812… / +243… / 243…"}
          disabled={!registrationOpen}
          onBlur={(e) => {
            const n = normalizeCodPhoneNumber(e.target.value);
            if (n) e.target.value = n;
          }}
        />
      </div>

      <div className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {isFr ? "Tarif" : "Price"}
        </p>
        <p className="mt-1 text-lg font-semibold text-[color:var(--fd-text)]">
          {isFr
            ? `Programme 2 Jours - ${effectivePriceUsd} USD`
            : `2-day program - ${effectivePriceUsd} USD`}
          {lockedPromo && lockedPromo.priceUsd !== priceUsd ? (
            <span className="ml-2 text-sm font-medium text-[color:var(--fd-muted)] line-through">
              {priceUsd} USD
            </span>
          ) : null}
        </p>
        <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
          {isFr
            ? "Défi, équipe ou solo : vous choisirez dans votre espace après inscription."
            : "Challenge, team or solo: you choose later in your participant hub."}
        </p>
        <input type="hidden" name="ticketPack" value="full" />
      </div>

      <p className="rounded-xl bg-[color:var(--fd-mint)]/50 px-4 py-3 text-sm text-[color:var(--fd-muted)]">
        {isFr
          ? "Pré-inscription gratuite : place réservée, rappels 24 h pour confirmer. Ou payez tout de suite."
          : "Free pre-registration: seat held, 24h reminders to confirm. Or pay now."}
      </p>

      <div>
        <label className={hkLabel} htmlFor="hk-pay">
          {isFr ? "Paiement (si vous payez maintenant)" : "Payment (if paying now)"}
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

      {err ? <p className="text-sm font-semibold text-[color:var(--hk-err,#b91c1c)]">{err}</p> : null}
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
          className="w-full rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-4 py-3 text-sm font-extrabold text-[color:var(--fd-text)] transition hover:bg-[color:var(--fd-mint)] disabled:opacity-60"
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
          className="w-full rounded-2xl bg-[color:var(--fd-primary)] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[color:var(--fd-primary-dark)] disabled:opacity-60"
        >
          {isFr ? "S'inscrire et payer" : "Register & pay"}
        </button>
      </div>
      </>
      )}
    </form>
  );
}
