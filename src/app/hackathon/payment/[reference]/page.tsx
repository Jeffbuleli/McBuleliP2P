"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (kind === "miss") {
    return (
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-500">
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

  const paid = data?.paymentStatus === "paid" && data.ticketCode;
  const failed =
    data?.status === "FAILED" || data?.paymentStatus === "failed";

  useEffect(() => {
    if (!paid || !data?.ticketCode || redirected.current) return;
    redirected.current = true;
    const timer = window.setTimeout(() => {
      window.location.href = `/hackathon/ticket/${encodeURIComponent(data.ticketCode!)}`;
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [paid, data?.ticketCode]);

  if (err) {
    return (
      <HackathonProcessCard
        tone="danger"
        icon={<StatusIcon kind="miss" />}
        title={isFr ? "Paiement introuvable" : "Payment not found"}
        subtitle={
          isFr
            ? "Cette référence n'existe pas ou n'est plus disponible. Vérifiez le lien ou recommencez depuis la page Hackathon."
            : "This reference does not exist or is no longer available. Check the link or start again from the Hackathon page."
        }
        backHref="/hackathon#register"
        backLabel={isFr ? "← Retour inscription" : "← Back to registration"}
      >
        <p className="font-mono text-[11px] text-[color:var(--fd-muted)]">
          {reference}
        </p>
      </HackathonProcessCard>
    );
  }

  if (paid && data?.ticketCode) {
    return (
      <HackathonProcessCard
        tone="success"
        icon={<StatusIcon kind="ok" />}
        title={isFr ? "Paiement confirmé" : "Payment confirmed"}
        subtitle={
          isFr
            ? `${data.firstName ? `Merci ${data.firstName}. ` : ""}Votre ticket QR est prêt. Redirection automatique…`
            : `${data.firstName ? `Thank you ${data.firstName}. ` : ""}Your QR ticket is ready. Redirecting…`
        }
        backHref={`/hackathon/ticket/${encodeURIComponent(data.ticketCode)}`}
        backLabel={isFr ? "Voir mon ticket QR →" : "View my QR ticket →"}
      >
        <Link
          href={`/hackathon/ticket/${encodeURIComponent(data.ticketCode)}`}
          className="inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[color:var(--fd-primary-dark)]"
        >
          {isFr ? "Ouvrir mon ticket" : "Open my ticket"}
        </Link>
        <p className="mt-3 font-mono text-xs font-bold tracking-wide text-[color:var(--fd-primary)]">
          {data.ticketCode}
        </p>
      </HackathonProcessCard>
    );
  }

  if (failed) {
    return (
      <HackathonProcessCard
        tone="danger"
        icon={<StatusIcon kind="fail" />}
        title={isFr ? "Paiement échoué" : "Payment failed"}
        subtitle={
          isFr
            ? "La transaction n'a pas abouti (annulation, fonds insuffisants ou délai dépassé). Vous pouvez réessayer avec le même numéro ou un autre opérateur."
            : "The transaction did not complete (cancelled, insufficient funds, or timeout). You can retry with the same number or another operator."
        }
        backHref="/hackathon#register"
        backLabel={isFr ? "← Réessayer l'inscription" : "← Try registration again"}
      >
        <p className="rounded-xl bg-red-50 px-3 py-2 font-mono text-[11px] text-red-700">
          {data?.status ?? "FAILED"}
        </p>
        <Link
          href="/hackathon#register"
          className="mt-4 inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white"
        >
          {isFr ? "Reprendre" : "Try again"}
        </Link>
      </HackathonProcessCard>
    );
  }

  const statusLabel = (data?.status ?? "…").toUpperCase();

  return (
    <HackathonProcessCard
      tone="info"
      icon={<StatusIcon kind="wait" />}
      title={isFr ? "En attente de paiement" : "Waiting for payment"}
      subtitle={
        isFr
          ? "Validez le prompt sur votre téléphone (Orange / M-Pesa / Airtel). Le numéro doit commencer par 243. Cette page se met à jour automatiquement."
          : "Confirm the prompt on your phone (Orange / M-Pesa / Airtel). The number must start with 243. This page updates automatically."
      }
    >
      <div className="rounded-xl bg-[color:var(--fd-mint)]/50 px-4 py-3">
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
      <p className="mt-4 text-xs text-[color:var(--fd-muted)]">
        {isFr
          ? "Ne fermez pas cette page tant que le paiement n'est pas confirmé."
          : "Keep this page open until payment is confirmed."}
      </p>
    </HackathonProcessCard>
  );
}
