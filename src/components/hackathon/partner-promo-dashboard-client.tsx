"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
import {
  SUPPORT_EMAIL,
  SUPPORT_WA_PATH,
  SUPPORT_X,
} from "@/lib/support-contact";
import type { PartnerDashboardStats } from "@/lib/hackathon/promo-types";
import { PROMO_CASHBACK_CLAIM_MIN_USD } from "@/lib/hackathon/promo-types";
import { FiatStepper } from "@/components/wallet/fiat-stepper";
import { FiatProviderPicker } from "@/components/wallet/fiat-provider-picker";
import {
  COD_MOBILE_FALLBACK,
  detectCodMobileMethodFromPhone,
  filterCodMobileProviders,
} from "@/lib/cod-mobile-providers";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";

type Props = { token: string };
type ProviderOption = { provider: string; label: string };

function statusLabel(status: string, confirmed: boolean): string {
  if (confirmed) return "Confirmé";
  if (
    status === "reserved" ||
    status === "pending" ||
    status === "pending_verify"
  ) {
    return "En attente";
  }
  if (status === "failed") return "Échoué";
  return status;
}

function claimStatusLabel(status: string): string {
  if (status === "requested") return "Mobile Money en cours";
  if (status === "approved") return "Approuvé";
  if (status === "paid") return "Payé";
  if (status === "rejected") return "Rejeté";
  if (status === "failed") return "Échoué";
  return status;
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

export function PartnerPromoDashboardClient({ token }: Props) {
  const [data, setData] = useState<PartnerDashboardStats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(0);
  const [amountUsd, setAmountUsd] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/hackathon/promo/dashboard/${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setErr(
          res.status === 404
            ? "Lien invalide ou expiré."
            : "Erreur de chargement.",
        );
        setData(null);
        return;
      }
      const json = (await res.json()) as PartnerDashboardStats;
      setData(json);
      setErr(null);
    } catch {
      setErr("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      void load();
    }, 12_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    async function loadProviders() {
      try {
        const res = await fetch("/api/config/mobile-money/providers");
        const json = (await res.json().catch(() => ({}))) as {
          providers?: ProviderOption[];
        };
        const raw = (json.providers ?? []).map((p) => ({
          provider: p.provider,
          label: p.label,
        }));
        const use =
          filterCodMobileProviders(raw).length > 0
            ? filterCodMobileProviders(raw)
            : COD_MOBILE_FALLBACK.map((p) => ({
                provider: p.provider,
                label: p.label,
              }));
        if (!cancelled) {
          setProviders(use);
          if (use[0]) setProvider((prev) => prev || use[0].provider);
        }
      } catch {
        if (!cancelled) {
          const fallback = COD_MOBILE_FALLBACK.map((p) => ({
            provider: p.provider,
            label: p.label,
          }));
          setProviders(fallback);
          if (fallback[0]) setProvider((prev) => prev || fallback[0].provider);
        }
      }
    }
    void loadProviders();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const detected = detectCodMobileMethodFromPhone(phoneNumber);
    if (detected && providers.some((p) => p.provider === detected)) {
      setProvider(detected);
    }
  }, [phoneNumber, providers]);

  async function requestOtp() {
    setAuthBusy(true);
    setAuthMsg(null);
    try {
      const res = await fetch(
        `/api/hackathon/promo/dashboard/${encodeURIComponent(token)}/auth`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "request" }),
        },
      );
      const json = (await res.json().catch(() => null)) as {
        maskedEmail?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        setAuthMsg(
          json?.error === "email_failed"
            ? "Envoi du code impossible. Réessayez."
            : "Impossible d'envoyer le code.",
        );
        return;
      }
      setOtpSent(true);
      setAuthMsg(
        json?.maskedEmail
          ? `Code envoyé à ${json.maskedEmail}.`
          : "Code envoyé.",
      );
    } catch {
      setAuthMsg("Erreur réseau.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setAuthBusy(true);
    setAuthMsg(null);
    try {
      const res = await fetch(
        `/api/hackathon/promo/dashboard/${encodeURIComponent(token)}/auth`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", code: otpCode.trim() }),
        },
      );
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setAuthMsg(
          json?.error === "otp_expired"
            ? "Code expiré. Demandez-en un nouveau."
            : "Code invalide.",
        );
        return;
      }
      setOtpCode("");
      setAuthMsg(null);
      await load();
    } catch {
      setAuthMsg("Erreur réseau.");
    } finally {
      setAuthBusy(false);
    }
  }

  function openWithdraw() {
    const max = data?.cashback.claimableUsd ?? 0;
    setAmountUsd(max > 0 ? String(max) : "");
    setWithdrawStep(0);
    setClaimMsg(null);
    setWithdrawOpen(true);
  }

  function closeWithdraw() {
    setWithdrawOpen(false);
    setWithdrawStep(0);
    setClaimMsg(null);
  }

  async function submitWithdraw() {
    setClaimBusy(true);
    setClaimMsg(null);
    try {
      const phone = normalizeCodPhoneNumber(phoneNumber);
      const res = await fetch(
        `/api/hackathon/promo/dashboard/${encodeURIComponent(token)}/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountUsd: Number(amountUsd),
            phoneNumber: phone,
            provider,
            providerLabel:
              providers.find((p) => p.provider === provider)?.label ?? provider,
          }),
        },
      );
      const json = (await res.json().catch(() => null)) as {
        amountUsd?: number;
        error?: string;
      } | null;
      if (!res.ok) {
        const map: Record<string, string> = {
          auth_required: "Vérifiez votre email d'abord.",
          nothing_to_claim: "Rien à réclamer pour le moment.",
          claim_pending: "Une demande est déjà en cours.",
          email_mismatch: "Email non autorisé pour ce code.",
          invalid_phone: "Numéro Mobile Money invalide (243...).",
          invalid_amount: `Montant invalide (minimum ${PROMO_CASHBACK_CLAIM_MIN_USD} USD).`,
          amount_exceeds_claimable: "Montant supérieur au cashback disponible.",
          momo_unavailable: "Mobile Money temporairement indisponible.",
          payout_rejected: "Paiement Mobile Money refusé. Réessayez.",
          payout_failed: "Échec d'envoi Mobile Money. Réessayez.",
          invalid_body: "Vérifiez le montant, le numéro et le réseau.",
        };
        setClaimMsg(map[json?.error ?? ""] ?? "Retrait impossible.");
        return;
      }
      setClaimMsg(
        json?.amountUsd != null
          ? `Retrait de ${json.amountUsd} USD lancé vers votre Mobile Money.`
          : "Retrait Mobile Money lancé.",
      );
      setWithdrawOpen(false);
      setWithdrawStep(0);
      await load();
    } catch {
      setClaimMsg("Erreur réseau.");
    } finally {
      setClaimBusy(false);
    }
  }

  async function copyShare() {
    if (!data?.promo.shareUrl) return;
    try {
      await navigator.clipboard.writeText(data.promo.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  const withdrawSteps = useMemo(
    () => [
      { id: "amount", label: "Montant" },
      { id: "network", label: "Réseau" },
      { id: "confirm", label: "Confirmer" },
    ],
    [],
  );

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-2xl bg-[#1F6B43]/15" />
        <p className="mt-4 text-sm font-semibold text-[#8A8A8A]">
          Chargement du dashboard...
        </p>
      </div>
    );
  }

  if (err && !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight text-[#1A1A1A]">
          Dashboard partenaire
        </h1>
        <p className="mt-3 text-sm font-semibold text-red-700">{err}</p>
      </div>
    );
  }

  if (!data) return null;

  const { promo, totals, signups, edition, rewards, auth, cashback } = data;
  const isAmbassador = promo.kind === "ambassador";
  const verified = auth.verified;
  const pendingClaim = cashback.claims.some((c) => c.status === "requested");
  const claimable = cashback.claimableUsd;
  const amountNum = Number(amountUsd);
  const amountOk =
    Number.isFinite(amountNum) &&
    amountNum >= PROMO_CASHBACK_CLAIM_MIN_USD &&
    amountNum <= claimable + 0.001;
  const phoneOk = isValidCodMsisdn(normalizeCodPhoneNumber(phoneNumber));
  const providerLabel =
    providers.find((p) => p.provider === provider)?.label ?? provider;
  const seatsEarned = rewards.seatsEarned ?? (rewards.freeSeatsUnlocked ? 2 : 0);
  const seat1At = rewards.seat1At ?? 3;
  const seat2At = rewards.seat2At ?? 10;
  const seat1Done = totals.confirmed >= seat1At;
  const seat2Done = totals.confirmed >= seat2At;
  const progressToNext = rewards.nextSeatAt
    ? Math.min(
        100,
        Math.round((totals.confirmed / rewards.nextSeatAt) * 100),
      )
    : 100;

  const amountPresets = [0.25, 0.5, 0.75, 1].map((ratio) => ({
    label: ratio === 1 ? "Max" : `${Math.round(ratio * 100)}%`,
    value: Math.round(claimable * ratio * 100) / 100,
  }));

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(31,107,67,0.14),_transparent_60%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="space-y-6"
      >
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1F6B43]">
              {isAmbassador ? "Ambassadeur Hackathon" : "Partenaire Hackathon"}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-[#1A1A1A] sm:text-4xl">
              {promo.orgName}
            </h1>
            {edition ? (
              <p className="mt-1.5 text-sm text-[#6B6B6B]">
                {edition.nameFr.replace(/\s*[—–]\s*/g, " - ")}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#1F6B43] px-3.5 py-1.5 font-mono text-sm font-bold tracking-[0.14em] text-white">
                {promo.code}
              </span>
              <span className="text-xs font-semibold text-[#6B6B6B]">
                -{promo.discountPercent}% · cashback {promo.cashbackPerPaidUsd}{" "}
                USD / payé
              </span>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_LOGO_256}
            alt=""
            width={52}
            height={52}
            className="h-13 w-13 shrink-0 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/5"
          />
        </header>

        {/* Share strip */}
        <section className="rounded-2xl bg-white/80 px-4 py-3.5 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-sm sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A8A8A]">
                Lien à partager
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-[#1F6B43]">
                {promo.shareUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyShare()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F6B43] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#185535]"
            >
              <IconCopy className="h-3.5 w-3.5" />
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-[#8A8A8A]">
            Mise à jour {new Date(data.updatedAt).toLocaleTimeString("fr-CD")}
          </p>
        </section>

        {/* Auth gate */}
        <AnimatePresence>
          {!verified ? (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-[#1F6B43]/15"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F6B43]">
                Vérification email
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[#3D3D3D]">
                Pour voir les inscrits et retirer le cashback, validez l&apos;accès
                avec le code envoyé à{" "}
                <span className="font-bold text-[#1A1A1A]">
                  {auth.partnerEmailMasked ??
                    (isAmbassador
                      ? "votre email"
                      : "votre email partenaire")}
                </span>
                .
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void requestOtp()}
                  className="rounded-xl bg-[#1F6B43] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {otpSent ? "Renvoyer le code" : "Recevoir le code"}
                </button>
              </div>
              {otpSent ? (
                <form
                  onSubmit={verifyOtp}
                  className="mt-4 flex flex-wrap items-end gap-2"
                >
                  <label className="block text-xs font-bold text-[#6B6B6B]">
                    Code à 6 chiffres
                    <input
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="mt-1 block w-40 rounded-xl border border-[#E5E5E0] bg-[#FAFAF8] px-3 py-2 font-mono text-lg tracking-[0.2em] text-[#1A1A1A]"
                      placeholder="000000"
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={authBusy || otpCode.length !== 6}
                    className="rounded-xl border-2 border-[#1F6B43] px-4 py-2.5 text-sm font-bold text-[#1F6B43] disabled:opacity-60"
                  >
                    Valider
                  </button>
                </form>
              ) : null}
              {authMsg ? (
                <p className="mt-3 text-xs font-semibold text-[#6B6B6B]">
                  {authMsg}
                </p>
              ) : null}
            </motion.section>
          ) : null}
        </AnimatePresence>

        {/* KPIs */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Inscrits" value={String(totals.signups)} />
          <Kpi label="Confirmés" value={String(totals.confirmed)} accent />
          <Kpi label="En attente" value={String(totals.pending)} />
          <Kpi label="Cashback" value={`${totals.cashbackUsd} $`} accent />
        </section>

        {/* Free seats - partners only */}
        {!isAmbassador ? (
        <section className="rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F6B43]">
                Places partenaires
              </p>
              <p className="mt-1 text-lg font-black tracking-tight text-[#1A1A1A]">
                {seatsEarned} / {rewards.seatsMax ?? 2} débloquée
                {seatsEarned > 1 ? "s" : ""}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                seatsEarned >= 2
                  ? "bg-[#1F6B43] text-white"
                  : seatsEarned === 1
                    ? "bg-[#EAF6EE] text-[#1F6B43]"
                    : "bg-[#F3F4F1] text-[#6B6B6B]"
              }`}
            >
              {seatsEarned >= 2
                ? "Complet"
                : seatsEarned === 1
                  ? "1 place"
                  : "En cours"}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <SeatTier
              title="1re place - pour vous"
              detail={`${seat1At} inscrits payés`}
              done={seat1Done}
              progress={Math.min(
                100,
                Math.round((totals.confirmed / seat1At) * 100),
              )}
              current={`${Math.min(totals.confirmed, seat1At)} / ${seat1At}`}
            />
            <SeatTier
              title="2e place"
              detail={`${seat2At}+ inscrits payés`}
              done={seat2Done}
              progress={Math.min(
                100,
                Math.round((totals.confirmed / seat2At) * 100),
              )}
              current={`${Math.min(totals.confirmed, seat2At)} / ${seat2At}`}
            />
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#6B6B6B]">
            {seatsEarned >= 2
              ? "Les 2 places sont débloquées. Le cashback continue sur chaque inscription payée."
              : seatsEarned === 1
                ? `Votre place est débloquée. Encore ${rewards.nextSeatRemaining} confirmé${rewards.nextSeatRemaining > 1 ? "s" : ""} pour la 2e place.`
                : `À ${seat1At} payés : 1 place pour vous. À ${seat2At}+ : 2e place. Cashback dès le 1er payé.`}
          </p>
          {rewards.nextSeatAt ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EFEFEA]">
              <motion.div
                className="h-full rounded-full bg-[#1F6B43]"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          ) : null}
        </section>
        ) : null}

        {/* Cashback */}
        {verified ? (
          <section className="rounded-2xl bg-gradient-to-br from-[#EAF6EE] to-[#F7FBF8] px-5 py-5 ring-1 ring-[#1F6B43]/12">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F6B43]">
              Cashback à retirer
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-black tabular-nums tracking-tight text-[#1F6B43]">
              {claimable}{" "}
              <span className="text-xl font-bold text-[#1F6B43]/80">USD</span>
            </p>
            <p className="mt-2 text-xs text-[#57534e]">
              Cumulé confirmé : {totals.cashbackUsd} USD · retrait Mobile Money
            </p>

            {!withdrawOpen ? (
              <button
                type="button"
                disabled={
                  claimBusy ||
                  claimable < PROMO_CASHBACK_CLAIM_MIN_USD ||
                  pendingClaim
                }
                onClick={openWithdraw}
                className="mt-4 rounded-xl bg-[#1F6B43] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#185535] disabled:opacity-45"
              >
                Demander le cashback
              </button>
            ) : (
              <div className="mt-4 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#1A1A1A]">
                    Retrait Mobile Money
                  </p>
                  <button
                    type="button"
                    onClick={closeWithdraw}
                    className="text-xs font-bold text-[#8A8A8A] underline"
                  >
                    Fermer
                  </button>
                </div>
                <div className="mt-3">
                  <FiatStepper steps={withdrawSteps} current={withdrawStep} />
                </div>

                {withdrawStep === 0 ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#6B6B6B]">
                      Montant (USD)
                      <input
                        inputMode="decimal"
                        value={amountUsd}
                        onChange={(e) =>
                          setAmountUsd(e.target.value.replace(/[^\d.]/g, ""))
                        }
                        className="mt-1 block w-full rounded-xl border border-[#E5E5E0] bg-[#FAFAF8] px-3 py-2.5 text-lg font-black tabular-nums text-[#1A1A1A]"
                        placeholder="0.00"
                      />
                    </label>
                    <p className="text-[11px] text-[#8A8A8A]">
                      Disponible : {claimable} USD (min.{" "}
                      {PROMO_CASHBACK_CLAIM_MIN_USD})
                    </p>
                    {claimable > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {amountPresets.map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            disabled={p.value < PROMO_CASHBACK_CLAIM_MIN_USD}
                            onClick={() => setAmountUsd(String(p.value))}
                            className="rounded-full border border-[#E5E5E0] bg-[#F3F4F1] px-2.5 py-1 text-[11px] font-bold text-[#1A1A1A] disabled:opacity-40"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      disabled={!amountOk}
                      onClick={() => setWithdrawStep(1)}
                      className="rounded-xl bg-[#1F6B43] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Continuer
                    </button>
                  </div>
                ) : null}

                {withdrawStep === 1 ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#6B6B6B]">
                      Numéro Mobile Money
                      <input
                        inputMode="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onBlur={() => {
                          const n = normalizeCodPhoneNumber(phoneNumber);
                          if (n) setPhoneNumber(n);
                        }}
                        className="mt-1 block w-full rounded-xl border border-[#E5E5E0] bg-[#FAFAF8] px-3 py-2.5 font-mono text-sm text-[#1A1A1A]"
                        placeholder="2438XXXXXXXX"
                      />
                    </label>
                    <div>
                      <p className="mb-2 text-xs font-bold text-[#6B6B6B]">
                        Réseau
                      </p>
                      <FiatProviderPicker
                        providers={providers}
                        value={provider}
                        onChange={setProvider}
                        disabled={claimBusy}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setWithdrawStep(0)}
                        className="rounded-xl border border-[#E5E5E0] px-4 py-2.5 text-sm font-bold text-[#6B6B6B]"
                      >
                        Retour
                      </button>
                      <button
                        type="button"
                        disabled={!phoneOk || !provider}
                        onClick={() => setWithdrawStep(2)}
                        className="rounded-xl bg-[#1F6B43] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        Continuer
                      </button>
                    </div>
                  </div>
                ) : null}

                {withdrawStep === 2 ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-[#F3F4F1] px-3 py-3 text-sm">
                      <p className="font-bold text-[#1A1A1A]">
                        {amountNum} USD → {providerLabel}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#6B6B6B]">
                        {normalizeCodPhoneNumber(phoneNumber)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setWithdrawStep(1)}
                        disabled={claimBusy}
                        className="rounded-xl border border-[#E5E5E0] px-4 py-2.5 text-sm font-bold text-[#6B6B6B] disabled:opacity-50"
                      >
                        Retour
                      </button>
                      <button
                        type="button"
                        disabled={claimBusy || !amountOk || !phoneOk}
                        onClick={() => void submitWithdraw()}
                        className="rounded-xl bg-[#1F6B43] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {claimBusy ? "Envoi..." : "Confirmer le retrait"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {claimMsg ? (
              <p className="mt-3 text-xs font-semibold text-[#57534e]">
                {claimMsg}
              </p>
            ) : null}

            {cashback.claims.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-[#1F6B43]/12 pt-3">
                {cashback.claims.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-semibold text-[#1A1A1A]">
                      {c.amountUsd} USD · {claimStatusLabel(c.status)}
                      {c.providerLabel ? ` · ${c.providerLabel}` : ""}
                    </span>
                    <span className="text-[#8A8A8A]">
                      {new Date(c.requestedAt).toLocaleDateString("fr-CD")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : (
          <section className="rounded-2xl bg-[#EAF6EE] px-5 py-6 text-center ring-1 ring-[#1F6B43]/12">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F6B43]">
              Cashback cumulé
            </p>
            <p className="mt-1 text-3xl font-black tabular-nums text-[#1F6B43]">
              {totals.cashbackUsd} USD
            </p>
            <p className="mt-2 text-xs text-[#57534e]">
              Vérifiez votre email pour demander le retrait.
            </p>
          </section>
        )}

        {/* Signups table */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]">
          <div className="border-b border-[#EFEFEA] px-5 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A8A8A]">
              Inscrits via votre code
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#FAFAF8] text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A8A8A]">
                <tr>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">Email</th>
                </tr>
              </thead>
              <tbody>
                {!verified ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-[#8A8A8A]"
                    >
                      Liste disponible après vérification email.
                    </td>
                  </tr>
                ) : signups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-[#8A8A8A]"
                    >
                      {isAmbassador
                        ? "Aucun inscrit pour le moment. Partage ton lien ambassadeur."
                        : "Aucun inscrit pour le moment. Partagez votre lien."}
                    </td>
                  </tr>
                ) : (
                  signups.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-[#F0F0EC] transition hover:bg-[#FAFAF8]"
                    >
                      <td className="px-4 py-3 font-semibold text-[#1A1A1A]">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            s.confirmed
                              ? "font-bold text-[#1F6B43]"
                              : "font-semibold text-amber-800"
                          }
                        >
                          {statusLabel(s.paymentStatus, s.confirmed)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#6B6B6B]">
                        {s.ticketCode ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {s.whatsappUrl ? (
                          <a
                            href={s.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#1F6B43] underline-offset-2 hover:underline"
                          >
                            Contacter
                          </a>
                        ) : (
                          <span className="text-[#8A8A8A]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`mailto:${encodeURIComponent(s.email)}?subject=${encodeURIComponent(`McBuleli Hackathon - ${promo.code}`)}`}
                          className="font-semibold text-[#1F6B43] underline-offset-2 hover:underline"
                        >
                          Écrire
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="rounded-2xl bg-[#1F6B43] px-5 py-5 text-center text-white">
          <p className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-semibold text-white/90">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <IconMail className="h-3.5 w-3.5" />
              {SUPPORT_EMAIL}
            </a>
            <span className="opacity-40">|</span>
            <a
              href={SUPPORT_WA_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              WhatsApp
            </a>
          </p>
          <a
            href={SUPPORT_X}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-white/90 hover:text-white"
          >
            <span className="opacity-80">Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_256}
              alt=""
              width={22}
              height={22}
              className="h-[22px] w-[22px] rounded-full bg-white/10 p-0.5 ring-1 ring-white/25"
            />
            <span className="font-extrabold">McBuleli</span>
          </a>
        </footer>
      </motion.div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-3.5 py-3.5 shadow-sm ring-1 ${
        accent
          ? "bg-[#EAF6EE] ring-[#1F6B43]/15"
          : "bg-white ring-black/[0.04]"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8A8A]">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-black tabular-nums tracking-tight ${
          accent ? "text-[#1F6B43]" : "text-[#1A1A1A]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SeatTier({
  title,
  detail,
  done,
  progress,
  current,
}: {
  title: string;
  detail: string;
  done: boolean;
  progress: number;
  current: string;
}) {
  return (
    <div
      className={`rounded-xl px-3.5 py-3 ${
        done ? "bg-[#EAF6EE]" : "bg-[#FAFAF8]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#1A1A1A]">{title}</p>
          <p className="text-[11px] text-[#6B6B6B]">{detail}</p>
        </div>
        <span
          className={`text-[11px] font-bold ${
            done ? "text-[#1F6B43]" : "text-[#8A8A8A]"
          }`}
        >
          {done ? "OK" : current}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
        <motion.div
          className={`h-full rounded-full ${done ? "bg-[#1F6B43]" : "bg-[#1F6B43]/55"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
