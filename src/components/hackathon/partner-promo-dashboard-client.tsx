"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
import {
  SUPPORT_EMAIL,
  SUPPORT_WA_PATH,
  SUPPORT_X,
} from "@/lib/support-contact";
import type { PartnerDashboardStats } from "@/lib/hackathon/promo-types";

type Props = {
  token: string;
};

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

  const { promo, totals, signups, edition, rewards } = data;
  const progress = Math.min(
    100,
    Math.round((totals.confirmed / rewards.freeSeatsThreshold) * 100),
  );

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
                    {edition.nameFr}
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
                {signups.length === 0 ? (
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

          <div className="rounded-2xl border border-[#1F6B43]/20 bg-[#EAF6EE] px-4 py-5 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#1F6B43]">
              Cashback cumulé (temps réel)
            </p>
            <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-[#1F6B43]">
              {totals.cashbackUsd} USD
            </p>
            <p className="mt-2 text-xs text-[#57534e]">
              {promo.cashbackPerPaidUsd} USD par inscription confirmée (payée) via
              votre code.
            </p>
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
