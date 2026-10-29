"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { useI18n } from "@/components/i18n-provider";
import {
  HackathonProcessCard,
} from "@/components/hackathon/hackathon-process-card";

type Status = {
  reference: string;
  status: string;
  paymentStatus: string;
  ticketCode: string | null;
  firstName: string | null;
  locale?: string | null;
  checkoutUrl: string | null;
  editionSlug?: string | null;
  nov26Hub?: boolean;
};

function StatusIcon({ kind }: { kind: "wait" | "ok" | "fail" | "miss" }) {
  if (kind === "ok") {
    return (
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (kind === "fail") {
    return (
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-500">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (kind === "miss") {
    return (
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--hk-page,var(--fd-bg))] text-[color:var(--fd-muted)]">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
      <svg className="h-7 w-7 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function HackathonPaymentStatusPage() {
  const params = useParams<{ reference: string }>();
  const reference = params.reference;
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [data, setData] = useState<Status | null>(null);
  const [err, setErr] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/hackathon/payment/${encodeURIComponent(reference)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          if (!cancelled) setErr(true);
          return;
        }
        const json = (await res.json()) as Status;
        if (!cancelled) {
          setErr(false);
          setData(json);
        }
      } catch {
        if (!cancelled) setErr(true);
      }
    }
    void load();
    const t = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [reference]);

  const paid = data?.paymentStatus === "paid";
  const failed =
    data?.status === "FAILED" || data?.paymentStatus === "failed";
  const isNov26 =
    data?.nov26Hub === true || data?.editionSlug === "nov26";
  const registerBack = isNov26 ? "/nov26#register" : "/hackathon#register";

  useEffect(() => {
    if (!paid || redirected.current) return;
    redirected.current = true;
    const hub =
      data?.nov26Hub || data?.editionSlug === "nov26"
        ? "/nov26/espace"
        : data?.ticketCode
          ? `/hackathon/ticket/${encodeURIComponent(data.ticketCode)}`
          : "/hackathon/espace";
    const timer = window.setTimeout(() => {
      window.location.href = hub;
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [paid, data?.ticketCode, data?.nov26Hub, data?.editionSlug]);

  function shell(card: ReactNode) {
    return (
      <div className="min-h-dvh">
        <LandingTopBar authReturnPath="/hackathon" />
        {card}
      </div>
    );
  }

  if (err) {
    return shell(
      <HackathonProcessCard
        tone="danger"
        icon={<StatusIcon kind="miss" />}
        title={isFr ? "Paiement introuvable" : "Payment not found"}
        subtitle={
          isFr
            ? "Cette référence n'existe pas ou n'est plus disponible. Vérifiez le lien ou recommencez depuis la page Hackathon."
            : "This reference does not exist or is no longer available. Check the link or start again from the Hackathon page."
        }
        backHref={registerBack}
        backLabel={isFr ? "← Retour inscription" : "← Back to registration"}
      >
        <p className="font-mono text-[11px] text-[color:var(--fd-muted)]">
          {reference}
        </p>
      </HackathonProcessCard>,
    );
  }

  if (paid) {
    const hubHref = isNov26
      ? "/nov26/espace"
      : data?.ticketCode
        ? `/hackathon/ticket/${encodeURIComponent(data.ticketCode)}`
        : "/hackathon/espace";
    return shell(
      <HackathonProcessCard
        tone="success"
        icon={<StatusIcon kind="ok" />}
        title={isFr ? "Paiement confirmé" : "Payment confirmed"}
        subtitle={
          isNov26
            ? isFr
              ? `${data.firstName ? `Merci ${data.firstName}. ` : ""}Votre place est confirmée. Redirection vers l'espace formation…`
              : `${data.firstName ? `Thank you ${data.firstName}. ` : ""}Your seat is confirmed. Redirecting to the training hub…`
            : isFr
              ? `${data.firstName ? `Merci ${data.firstName}. ` : ""}Votre ticket QR est prêt. Redirection automatique…`
              : `${data.firstName ? `Thank you ${data.firstName}. ` : ""}Your QR ticket is ready. Redirecting…`
        }
        backHref={hubHref}
        backLabel={
          isNov26
            ? isFr
              ? "Ouvrir mon espace →"
              : "Open my hub →"
            : isFr
              ? "Voir mon ticket QR →"
              : "View my QR ticket →"
        }
      >
        <Link
          href={hubHref}
          className="inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[color:var(--fd-primary-dark)]"
        >
          {isNov26
            ? isFr
              ? "Espace formation"
              : "Training hub"
            : isFr
              ? "Ouvrir mon ticket"
              : "Open my ticket"}
        </Link>
        {data.ticketCode ? (
          <p className="mt-3 font-mono text-xs font-bold tracking-wide text-[color:var(--fd-primary)]">
            {data.ticketCode}
          </p>
        ) : null}
      </HackathonProcessCard>,
    );
  }

  if (failed) {
    return shell(
      <HackathonProcessCard
        tone="danger"
        icon={<StatusIcon kind="fail" />}
        title={isFr ? "Paiement échoué" : "Payment failed"}
        subtitle={
          isFr
            ? "La transaction n'a pas abouti (annulation, fonds insuffisants ou délai dépassé). Vous pouvez réessayer avec le même numéro ou un autre opérateur."
            : "The transaction did not complete (cancelled, insufficient funds, or timeout). You can retry with the same number or another operator."
        }
        backHref={registerBack}
        backLabel={isFr ? "← Réessayer l'inscription" : "← Try registration again"}
      >
        <p className="rounded-xl bg-red-50 px-3 py-2 font-mono text-[11px] text-red-700">
          {data?.status ?? "FAILED"}
        </p>
        <Link
          href={registerBack}
          className="mt-4 inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white"
        >
          {isFr ? "Reprendre" : "Try again"}
        </Link>
      </HackathonProcessCard>,
    );
  }

  const statusLabel = (data?.status ?? "…").toUpperCase();

  return shell(
    <HackathonProcessCard
      tone="info"
      icon={<StatusIcon kind="wait" />}
      title={isFr ? "En attente de paiement" : "Waiting for payment"}
      subtitle={
        isFr
          ? "Validez le prompt sur votre téléphone (Orange / M-Pesa / Airtel). Le numéro doit commencer par 243. Cette page interroge pawaPay et se met à jour automatiquement."
          : "Confirm the prompt on your phone (Orange / M-Pesa / Airtel). The number must start with 243. This page checks pawaPay and updates automatically."
      }
      showMomoRails
      momoLabel={isFr ? "Mobile Money via pawaPay" : "Mobile Money via pawaPay"}
    >
      <div className="rounded-2xl border border-[color:var(--fd-primary)]/15 bg-[color:var(--fd-mint)]/40 px-4 py-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--fd-muted)]">
          {isFr ? "Statut" : "Status"}
        </p>
        <p className="mt-1 font-mono text-sm font-bold text-[color:var(--fd-primary)]">
          {statusLabel}
        </p>
        <p className="mt-2 break-all font-mono text-[10px] text-[color:var(--fd-muted)]">
          {reference}
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-[color:var(--fd-muted)]">
        {isFr
          ? "Après validation MoMo, la confirmation peut prendre quelques secondes. Ne fermez pas cette page."
          : "After MoMo approval, confirmation can take a few seconds. Keep this page open."}
      </p>
    </HackathonProcessCard>,
  );
}
