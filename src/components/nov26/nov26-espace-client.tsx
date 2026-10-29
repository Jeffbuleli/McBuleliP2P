"use client";

import Link from "next/link";
import { HackathonPoweredBy } from "@/components/hackathon/hackathon-process-card";
import { passPath } from "@/lib/hackathon/pass-url";
import { HACKATHON_REMINDER_HOURS } from "@/lib/hackathon/constants";
import { useI18n } from "@/components/i18n-provider";
import {
  NOV26_DATES_LABEL_EN,
  NOV26_DATES_LABEL_FR,
  NOV26_PROGRAM,
  NOV26_TIME_LABEL_EN,
  NOV26_TIME_LABEL_FR,
  NOV26_TITLE_EN,
  NOV26_TITLE_FR,
} from "@/lib/nov26/content";
import { SUPPORT_EMAIL, SUPPORT_WA_PATH } from "@/lib/support-contact";

type Props = {
  basePath?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  paymentStatus: string;
  priceUsd?: string;
  ticketCode: string | null;
  payUrl: string | null;
  meetUrl: string | null;
};

function ProgramBlock({ isFr }: { isFr: boolean }) {
  return (
    <div className="rounded-2xl border border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-surface,var(--fd-card))] p-5">
      <p className="text-sm font-bold">{isFr ? "Programme" : "Program"}</p>
      <ol className="mt-3 space-y-2">
        {NOV26_PROGRAM.map((day) => (
          <li
            key={day.day}
            className="flex gap-3 text-xs text-[color:var(--hk-muted,var(--fd-muted))]"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[color:var(--fd-mint)] text-[10px] font-extrabold text-[color:var(--fd-primary)]">
              {day.day}
            </span>
            <span className="font-semibold text-[color:var(--hk-text,var(--fd-text))]">
              {isFr
                ? (day.labelFr.split(" · ")[1] ?? day.labelFr)
                : (day.labelEn.split(" · ")[1] ?? day.labelEn)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Nov26EspaceClient({
  basePath = "/nov26",
  displayName,
  firstName,
  lastName,
  paymentStatus,
  priceUsd,
  ticketCode,
  payUrl,
  meetUrl,
}: Props) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const paid = paymentStatus === "paid";
  const reserved = paymentStatus === "reserved";
  const enrolled = paid || reserved;
  const greeting =
    firstName?.trim() ||
    displayName.split("@")[0] ||
    displayName;
  const registerHref = `${basePath}#register`;

  return (
    <div className="min-h-[60vh]">
      <div className="bg-gradient-to-br from-[#5c1830] via-[#7a2840] to-[#1F6B43] px-4 py-8 text-white">
        <div className="mx-auto max-w-lg">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
            {isFr ? "Espace participant" : "Participant hub"}
          </p>
          <h1 className="mt-2 text-xl font-black leading-tight sm:text-2xl">
            {isFr ? NOV26_TITLE_FR : NOV26_TITLE_EN}
          </h1>
          <p className="mt-2 text-sm text-white/90">
            {isFr ? `Bonjour ${greeting}` : `Hi ${greeting}`}
            {lastName ? ` ${lastName}` : null}
          </p>
          <p className="mt-2 text-xs text-white/80">{displayName}</p>
          <p className="mt-3 text-sm font-semibold text-white/95">
            {isFr ? NOV26_DATES_LABEL_FR : NOV26_DATES_LABEL_EN}
            <span className="mx-2 opacity-60">·</span>
            {isFr ? NOV26_TIME_LABEL_FR : NOV26_TIME_LABEL_EN}
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 py-8">
        {!enrolled ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm">
            <p className="font-bold text-amber-950 dark:text-amber-100">
              {isFr ? "Inscription requise" : "Registration required"}
            </p>
            <p className="mt-2 text-[color:var(--hk-muted,var(--fd-muted))]">
              {isFr
                ? "Connectez-vous avec le même e-mail que votre inscription, ou inscrivez-vous (pré-inscription gratuite ou paiement immédiat)."
                : "Sign in with the same email you used to register, or sign up (free pre-registration or pay now)."}
            </p>
            <Link
              href={registerHref}
              className="mt-4 inline-flex rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-extrabold text-white"
            >
              {isFr ? "S'inscrire sur la page formation" : "Register on the training page"}
            </Link>
          </div>
        ) : null}

        {reserved && !paid ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-5 text-sm">
              <p className="font-extrabold text-[color:var(--hk-warn-text,#92400e)]">
                {isFr ? "Place réservée — paiement à finaliser" : "Seat reserved — payment pending"}
              </p>
              <p className="mt-2 text-[color:var(--hk-muted,var(--fd-muted))]">
                {isFr
                  ? `Vous pouvez payer maintenant (${priceUsd ?? "50"} USD) ou attendre : nous vous rappelons par e-mail toutes les ${HACKATHON_REMINDER_HOURS} h. Le lien Google Meet s'active après paiement.`
                  : `Pay now (${priceUsd ?? "50"} USD) or wait: we email reminders every ${HACKATHON_REMINDER_HOURS} h. Google Meet unlocks after payment.`}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {payUrl ? (
                  <a
                    href={payUrl}
                    className="inline-flex justify-center rounded-xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[color:var(--fd-primary-dark)]"
                  >
                    {isFr ? "Payer maintenant" : "Pay now"}
                  </a>
                ) : null}
                <Link
                  href={registerHref}
                  className="inline-flex justify-center rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-5 py-3 text-sm font-bold text-[color:var(--fd-text)]"
                >
                  {isFr ? "Mobile Money sur la page inscription" : "Mobile Money on registration page"}
                </Link>
              </div>
            </div>
            <ProgramBlock isFr={isFr} />
          </div>
        ) : null}

        {paid ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[color:var(--fd-primary)]/30 bg-[color:var(--fd-mint)]/60 p-5 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[color:var(--fd-primary)]">
                {isFr ? "Inscription confirmée" : "Registration confirmed"}
              </p>
              <p className="mt-2 text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
                {isFr
                  ? "Rejoignez chaque soirée à 19h30 GMT+1 via Google Meet."
                  : "Join each evening at 7:30 PM GMT+1 via Google Meet."}
              </p>
              {meetUrl ? (
                <a
                  href={meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full justify-center rounded-xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[color:var(--fd-primary-dark)] sm:w-auto"
                >
                  {isFr ? "Rejoindre Google Meet" : "Join Google Meet"}
                </a>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-[color:var(--fd-muted)]">
                  {isFr
                    ? `Lien envoyé par e-mail avant chaque session · ${SUPPORT_EMAIL}`
                    : `Link emailed before each session · ${SUPPORT_EMAIL}`}
                </p>
              )}
            </div>
            <ProgramBlock isFr={isFr} />
            {ticketCode ? (
              <Link
                href={passPath(ticketCode)}
                className="flex items-center justify-between rounded-2xl border border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-page,var(--fd-bg))] px-4 py-3 text-sm font-semibold text-[color:var(--hk-accent,var(--fd-primary))] hover:bg-[color:var(--fd-mint)]/40"
              >
                {isFr ? "Pass / QR" : "Pass / QR"}
                <span aria-hidden>→</span>
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--hk-border,var(--fd-border))] pt-6 text-xs">
          <Link
            href={basePath}
            className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))]"
          >
            ← {isFr ? "Page formation" : "Training page"}
          </Link>
          <a
            href={SUPPORT_WA_PATH}
            className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))]"
          >
            WhatsApp
          </a>
        </div>
        <HackathonPoweredBy className="mt-6" />
      </main>
    </div>
  );
}
