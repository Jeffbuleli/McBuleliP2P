"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
import {
  SUPPORT_EMAIL,
  SUPPORT_WA_PATH,
  SUPPORT_X,
} from "@/lib/support-contact";
import type { PartnerDashboardStats } from "@/lib/hackathon/promo-types";
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

type Props = {
  token: string;
};

type ProviderOption = { provider: string; label: string };

function statusLabel(status: string, confirmed: boolean): string {
  if (confirmed) return "Confirmé";
  if (
    status === "reserved" ||
    status === "pending" ||
    status === "pending_verify"
  ) {
    return "Non confirmé";
  }
  if (status === "failed") return "Échoué";
  return status;
}

function claimStatusLabel(status: string): string {
  if (status === "requested") return "En cours (Mobile Money)";
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
          invalid_amount: "Montant invalide (minimum 1 USD).",
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
          ? `Retrait de ${json.amountUsd} USD lancé vers votre Mobile Money. Vous recevrez bientôt la notification.`
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
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-[#8A8A8A]">
        Chargement du dashboard partenaire...
      </div>
    );
  }

  if (err && !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-black tracking-tight text-[#222222]">
          Dashboard partenaire
        </h1>
        <p className="mt-3 text-sm font-semibold text-red-700">{err}</p>
      </div>
    );
  }

  if (!data) return null;

  const { promo, totals, signups, edition, rewards, auth, cashback } = data;
  const verified = auth.verified;
  const progress = Math.min(
    100,
    Math.round((totals.confirmed / rewards.freeSeatsThreshold) * 100),
  );
  const pendingClaim = cashback.claims.some((c) => c.status === "requested");
  const claimable = cashback.claimableUsd;
  const amountNum = Number(amountUsd);
  const amountOk =
    Number.isFinite(amountNum) && amountNum >= 1 && amountNum <= claimable + 0.001;
  const phoneOk = isValidCodMsisdn(normalizeCodPhoneNumber(phoneNumber));
  const providerLabel =
    providers.find((p) => p.provider === provider)?.label ?? provider;

  const amountPresets = [0.25, 0.5, 0.75, 1].map((ratio) => ({
    label: ratio === 1 ? "Max" : `${Math.round(ratio * 100)}%`,
    value: Math.round(claimable * ratio * 100) / 100,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="overflow-hidden rounded-[28px] border border-white/80 bg-[#FBFBFA] shadow-[0_22px_60px_-28px_rgba(31,107,67,0.45)] ring-1 ring-black/[0.04]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#EAF6EE] via-[#FBFBFA] to-[#F3F4F1] px-5 pb-5 pt-6 sm:px-6">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
            viewBox="0 0 400 220"
            preserveAspectRatio="none"
            aria-hidden
          >
            <circle cx="340" cy="20" r="90" fill="#1F6B43" fillOpacity="0.06" />
            <circle cx="40" cy="180" r="70" fill="#1F6B43" fillOpacity="0.05" />
          </svg>

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1F6B43]">
                  Partenaire Hackathon
                </p>
                <h1 className="mt-1.5 text-2xl font-black tracking-tight text-[#222222]">
                  {promo.orgName}
                </h1>
                {edition ? (
                  <p className="mt-1 truncate text-sm text-[#8A8A8A]">
                    {edition.nameFr.replace(/\s*[—–]\s*/g, " - ")}
                  </p>
                ) : null}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND_LOGO_256}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-[#E5E5E0]"
              />
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#E5E5E0] bg-white/90 px-3.5 py-1.5 font-mono text-sm font-extrabold tracking-[0.12em] text-[#1F6B43] shadow-sm">
              {promo.code}
            </div>
            <p className="mt-2 text-xs font-semibold text-[#57534e]">
              -{promo.discountPercent}% - cashback {promo.cashbackPerPaidUsd}{" "}
              USD / payé
            </p>

            <p className="mt-3 break-all text-[11px] leading-relaxed text-[#8A8A8A]">
              Lien à partager :{" "}
              <a
                href={promo.shareUrl}
                className="font-semibold text-[#1F6B43] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {promo.shareUrl}
              </a>
            </p>
            <p className="mt-1 text-[10px] text-[#8A8A8A]">
              Mise à jour en temps réel -{" "}
              {new Date(data.updatedAt).toLocaleTimeString("fr-CD")}
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {!verified ? (
            <div className="rounded-2xl border border-[#1F6B43]/25 bg-white px-4 py-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#1F6B43]">
                Vérification email
              </p>
              <p className="mt-2 text-sm font-semibold text-[#222222]">
                Pour voir les inscrits et demander le cashback, validez l&apos;accès
                avec le code envoyé à{" "}
                {auth.partnerEmailMasked ?? "l'email partenaire"}.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void requestOtp()}
                  className="rounded-xl bg-[#1F6B43] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  {otpSent ? "Renvoyer le code" : "Recevoir le code"}
                </button>
              </div>
              {otpSent ? (
                <form onSubmit={verifyOtp} className="mt-4 flex flex-wrap items-end gap-2">
                  <label className="block text-xs font-bold text-[#57534e]">
                    Code à 6 chiffres
                    <input
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="mt-1 block w-40 rounded-xl border border-[#E5E5E0] bg-[#FBFBFA] px-3 py-2 font-mono text-lg tracking-[0.2em] text-[#222222]"
                      placeholder="000000"
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={authBusy || otpCode.length !== 6}
                    className="rounded-xl border border-[#1F6B43] px-4 py-2.5 text-sm font-extrabold text-[#1F6B43] disabled:opacity-60"
                  >
                    Valider
                  </button>
                </form>
              ) : null}
              {authMsg ? (
                <p className="mt-3 text-xs font-semibold text-[#57534e]">{authMsg}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Inscrits" value={String(totals.signups)} />
            <Stat label="Confirmés" value={String(totals.confirmed)} accent />
            <Stat label="En attente" value={String(totals.pending)} />
            <Stat label="Cashback" value={`${totals.cashbackUsd} USD`} accent />
          </div>

          <div
            className={`rounded-2xl border px-4 py-4 ${
              rewards.freeSeatsUnlocked
                ? "border-[#1F6B43]/30 bg-[#EAF6EE]"
                : "border-[#E5E5E0] bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#1F6B43]">
                  2 places offertes
                </p>
                <p className="mt-1 text-sm font-bold text-[#222222]">
                  {rewards.freeSeatsUnlocked
                    ? "Objectif atteint - places débloquées"
                    : `${totals.confirmed} / ${rewards.freeSeatsThreshold} confirmés`}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                  rewards.freeSeatsUnlocked
                    ? "bg-[#1F6B43] text-white"
                    : "bg-[#F3F4F1] text-[#57534e]"
                }`}
              >
                {rewards.freeSeatsUnlocked ? "Débloqué" : "En cours"}
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#E5E5E0]">
              <motion.div
                className="h-full rounded-full bg-[#1F6B43]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#8A8A8A]">
              {rewards.freeSeatsUnlocked
                ? `Vous avez ${rewards.freeSeats} places partenaires + le cashback sur chaque inscription payée.`
                : `Il faut ${rewards.freeSeatsThreshold}+ participants confirmés (payés) via votre code pour les ${rewards.freeSeats} places. Sinon, vous conservez uniquement le cashback (${promo.cashbackPerPaidUsd} USD / payé). Encore ${rewards.freeSeatsRemaining}.`}
            </p>
          </div>

          {verified ? (
            <div className="rounded-2xl border border-[#1F6B43]/20 bg-[#EAF6EE] px-4 py-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#1F6B43]">
                Cashback à réclamer
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-[#1F6B43]">
                {claimable} USD
              </p>
              <p className="mt-2 text-xs text-[#57534e]">
                Cumulé confirmé : {totals.cashbackUsd} USD. Retrait via Mobile Money
                (Airtel / Orange / M-Pesa).
              </p>

              {!withdrawOpen ? (
                <button
                  type="button"
                  disabled={claimBusy || claimable <= 0 || pendingClaim}
                  onClick={openWithdraw}
                  className="mt-4 rounded-xl bg-[#1F6B43] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
                >
                  Demander le cashback
                </button>
              ) : (
                <div className="mt-4 rounded-2xl border border-[#E5E5E0] bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-extrabold text-[#222222]">
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
                      <label className="block text-xs font-bold text-[#57534e]">
                        Montant (USD)
                        <input
                          inputMode="decimal"
                          value={amountUsd}
                          onChange={(e) =>
                            setAmountUsd(
                              e.target.value.replace(/[^\d.]/g, ""),
                            )
                          }
                          className="mt-1 block w-full rounded-xl border border-[#E5E5E0] bg-[#FBFBFA] px-3 py-2.5 text-lg font-black tabular-nums text-[#222222]"
                          placeholder="0.00"
                        />
                      </label>
                      <p className="text-[11px] text-[#8A8A8A]">
                        Disponible : {claimable} USD (min. 1 USD)
                      </p>
                      {claimable > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {amountPresets.map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              disabled={p.value < 1}
                              onClick={() => setAmountUsd(String(p.value))}
                              className="rounded-full border border-[#E5E5E0] bg-[#F3F4F1] px-2.5 py-1 text-[11px] font-bold text-[#222222] disabled:opacity-40"
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
                        className="rounded-xl bg-[#1F6B43] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
                      >
                        Continuer
                      </button>
                    </div>
                  ) : null}

                  {withdrawStep === 1 ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-[#57534e]">
                        Numéro Mobile Money
                        <input
                          inputMode="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          onBlur={() => {
                            const n = normalizeCodPhoneNumber(phoneNumber);
                            if (n) setPhoneNumber(n);
                          }}
                          className="mt-1 block w-full rounded-xl border border-[#E5E5E0] bg-[#FBFBFA] px-3 py-2.5 font-mono text-sm text-[#222222]"
                          placeholder="2438XXXXXXXX"
                        />
                      </label>
                      <div>
                        <p className="mb-2 text-xs font-bold text-[#57534e]">
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
                          className="rounded-xl border border-[#E5E5E0] px-4 py-2.5 text-sm font-extrabold text-[#57534e]"
                        >
                          Retour
                        </button>
                        <button
                          type="button"
                          disabled={!phoneOk || !provider}
                          onClick={() => setWithdrawStep(2)}
                          className="rounded-xl bg-[#1F6B43] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
                        >
                          Continuer
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {withdrawStep === 2 ? (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-[#F3F4F1] px-3 py-3 text-sm">
                        <p className="font-bold text-[#222222]">
                          {amountNum} USD → {providerLabel}
                        </p>
                        <p className="mt-1 font-mono text-xs text-[#57534e]">
                          {normalizeCodPhoneNumber(phoneNumber)}
                        </p>
                        <p className="mt-2 text-xs text-[#8A8A8A]">
                          Le montant sera envoyé directement sur ce numéro via
                          Mobile Money.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setWithdrawStep(1)}
                          disabled={claimBusy}
                          className="rounded-xl border border-[#E5E5E0] px-4 py-2.5 text-sm font-extrabold text-[#57534e] disabled:opacity-50"
                        >
                          Retour
                        </button>
                        <button
                          type="button"
                          disabled={claimBusy || !amountOk || !phoneOk}
                          onClick={() => void submitWithdraw()}
                          className="rounded-xl bg-[#1F6B43] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
                        >
                          {claimBusy ? "Envoi..." : "Confirmer le retrait"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {claimMsg ? (
                <p className="mt-2 text-xs font-semibold text-[#57534e]">
                  {claimMsg}
                </p>
              ) : null}
              {cashback.claims.length > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-[#1F6B43]/15 pt-3">
                  {cashback.claims.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-bold text-[#222222]">
                        {c.amountUsd} USD - {claimStatusLabel(c.status)}
                        {c.providerLabel ? ` · ${c.providerLabel}` : ""}
                        {c.phoneNumber ? ` · ${c.phoneNumber}` : ""}
                      </span>
                      <span className="text-[#8A8A8A]">
                        {new Date(c.requestedAt).toLocaleDateString("fr-CD")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1F6B43]/20 bg-[#EAF6EE] px-4 py-5 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#1F6B43]">
                Cashback cumulé (temps réel)
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-[#1F6B43]">
                {totals.cashbackUsd} USD
              </p>
              <p className="mt-2 text-xs text-[#57534e]">
                Vérifiez votre email pour demander le paiement.
              </p>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-[#E5E5E0] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#E5E5E0] bg-[#F3F4F1]/90 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8A8A8A]">
                <tr>
                  <th className="px-3 py-3 sm:px-4">Nom</th>
                  <th className="px-3 py-3 sm:px-4">Statut</th>
                  <th className="px-3 py-3 sm:px-4">N° ticket</th>
                  <th className="px-3 py-3 sm:px-4">WhatsApp</th>
                  <th className="px-3 py-3 sm:px-4">Email</th>
                </tr>
              </thead>
              <tbody>
                {!verified ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-[#8A8A8A]"
                    >
                      Liste des inscrits disponible après vérification email.
                    </td>
                  </tr>
                ) : signups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-[#8A8A8A]"
                    >
                      Aucun inscrit via votre code pour le moment. Partagez votre
                      lien.
                    </td>
                  </tr>
                ) : (
                  signups.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-[#E5E5E0]/70 last:border-0"
                    >
                      <td className="px-3 py-3 font-semibold text-[#222222] sm:px-4">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-3 py-3 sm:px-4">
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
                      <td className="px-3 py-3 font-mono text-xs sm:px-4">
                        {s.ticketCode ?? "-"}
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        {s.whatsappUrl ? (
                          <a
                            href={s.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#1F6B43] underline"
                          >
                            Contacter
                          </a>
                        ) : (
                          <span className="text-[#8A8A8A]">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        <a
                          href={`mailto:${encodeURIComponent(s.email)}?subject=${encodeURIComponent(`McBuleli Hackathon - confirmation (${promo.code})`)}`}
                          className="font-semibold text-[#1F6B43] underline"
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
        </div>

        <div className="relative overflow-hidden bg-[#1F6B43] px-5 py-4 text-white sm:px-6">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
            viewBox="0 0 400 88"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M0 40c40-16 80 16 120 0s80-16 120 0 80 16 120 0 40-10 40-10v58H0z"
              fill="#14532D"
            />
          </svg>
          <div className="relative flex flex-col items-center gap-2.5 text-center">
            <p className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-semibold text-white/90">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-1.5 hover:text-white"
              >
                <IconMail className="h-3.5 w-3.5 shrink-0" />
                {SUPPORT_EMAIL}
              </a>
              <span className="opacity-50" aria-hidden>
                |
              </span>
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
              className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/90 hover:text-white"
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
          </div>
        </div>
      </motion.article>
    </div>
  );
}

function Stat({
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
      className={`rounded-2xl border px-3 py-3 ${
        accent
          ? "border-[#1F6B43]/25 bg-[#EAF6EE]"
          : "border-[#E5E5E0] bg-white"
      }`}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8A8A8A]">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-black tabular-nums tracking-tight ${
          accent ? "text-[#1F6B43]" : "text-[#222222]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
