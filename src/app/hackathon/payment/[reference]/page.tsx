"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Status = {
  reference: string;
  status: string;
  paymentStatus: string;
  ticketCode: string | null;
  firstName: string | null;
  checkoutUrl: string | null;
};

export default function HackathonPaymentStatusPage() {
  const params = useParams<{ reference: string }>();
  const reference = params.reference;
  const [data, setData] = useState<Status | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/hackathon/payment/${encodeURIComponent(reference)}`);
        if (!res.ok) {
          if (!cancelled) setErr(true);
          return;
        }
        const json = (await res.json()) as Status;
        if (!cancelled) setData(json);
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

  return (
    <div className="home-theme fd-public-light flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[1.75rem] border border-[color:var(--fd-border)] bg-white p-6 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
          McBuleli Hackathon
        </p>
        {err ? (
          <p className="mt-4 text-sm font-semibold text-red-700">Paiement introuvable.</p>
        ) : paid ? (
          <>
            <h1 className="mt-3 text-xl font-black text-[color:var(--fd-text)]">
              Paiement confirmé
            </h1>
            <p className="mt-2 text-sm text-[color:var(--fd-muted)]">
              {data.firstName ? `Merci ${data.firstName}. ` : null}
              Votre ticket est prêt.
            </p>
            <Link
              href={`/hackathon/ticket/${encodeURIComponent(data.ticketCode!)}`}
              className="mt-6 inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white"
            >
              Voir mon ticket QR
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-xl font-black text-[color:var(--fd-text)]">
              En attente de paiement
            </h1>
            <p className="mt-2 text-sm text-[color:var(--fd-muted)]">
              Validez le prompt sur votre téléphone (Orange / M-Pesa / Airtel). Le numéro doit
              commencer par 243. Cette page se met à jour automatiquement.
            </p>
            <p className="mt-4 font-mono text-xs text-[color:var(--fd-muted)]">
              {data?.status ?? "…"}
            </p>
          </>
        )}
        <p className="mt-8 text-xs">
          <Link href="/hackathon" className="font-semibold text-[color:var(--fd-primary)]">
            ← Hackathon
          </Link>
        </p>
      </div>
    </div>
  );
}
