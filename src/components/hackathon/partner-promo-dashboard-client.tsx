"use client";

import { useCallback, useEffect, useState } from "react";
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
  if (status === "reserved" || status === "pending" || status === "pending_verify") {
    return "Non confirmé";
  }
  if (status === "failed") return "Échoué";
  return status;
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
        setErr(res.status === 404 ? "Lien invalide ou expiré." : "Erreur de chargement.");
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
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[color:var(--fd-muted)]">
        Chargement du tableau partenaire…
      </div>
    );
  }

  if (err && !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-[color:var(--fd-text)]">Dashboard partenaire</h1>
        <p className="mt-3 text-sm text-red-700">{err}</p>
      </div>
    );
  }

  if (!data) return null;

  const { promo, totals, signups, edition } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <header className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
          Partenaire Hackathon
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[color:var(--fd-text)] sm:text-3xl">
          {promo.orgName}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--fd-muted)]">
          Code{" "}
          <span className="font-mono font-bold text-[color:var(--fd-primary)]">
            {promo.code}
          </span>
          {edition ? ` · ${edition.nameFr}` : null}
          {" · "}
          -{promo.discountPercent}% · cashback {promo.cashbackPerPaidUsd} USD / payé
        </p>
        <p className="mt-3 break-all text-xs text-[color:var(--fd-muted)]">
          Lien à partager :{" "}
          <a
            href={promo.shareUrl}
            className="font-semibold text-[color:var(--fd-primary)] underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {promo.shareUrl}
          </a>
        </p>
        <p className="mt-1 text-[11px] text-[color:var(--fd-muted)]">
          Mise à jour en temps réel · {new Date(data.updatedAt).toLocaleTimeString("fr-CD")}
        </p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Inscrits" value={String(totals.signups)} />
        <Stat label="Confirmés" value={String(totals.confirmed)} />
        <Stat label="En attente" value={String(totals.pending)} />
        <Stat label="Cashback" value={`${totals.cashbackUsd} USD`} accent />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--fd-border)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
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
                  className="px-4 py-10 text-center text-sm text-[color:var(--fd-muted)]"
                >
                  Aucun inscrit via votre code pour le moment. Partagez votre lien.
                </td>
              </tr>
            ) : (
              signups.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[color:var(--fd-border)]/70 last:border-0"
                >
                  <td className="px-3 py-3 font-semibold text-[color:var(--fd-text)] sm:px-4">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <span
                      className={
                        s.confirmed
                          ? "font-bold text-[color:var(--fd-primary)]"
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
                                          className="font-semibold text-[color:var(--fd-primary)] underline"
                                        >
                                          Contacter
                                        </a>
                                      ) : (
                                        <span className="text-[color:var(--fd-muted)]">-</span>
                                      )}
                                    </td>
                  <td className="px-3 py-3 sm:px-4">
                    <a
                      href={`mailto:${encodeURIComponent(s.email)}?subject=${encodeURIComponent(`McBuleli Hackathon - confirmation (${promo.code})`)}`}
                      className="font-semibold text-[color:var(--fd-primary)] underline"
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

      <div className="mt-8 rounded-2xl border border-[color:var(--fd-primary)]/20 bg-[color:var(--fd-mint)]/50 px-5 py-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
          Cashback cumulé (temps réel)
        </p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums text-[color:var(--fd-primary)]">
          {totals.cashbackUsd} USD
        </p>
        <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
          {promo.cashbackPerPaidUsd} USD par inscription confirmée (payée) via votre code.
        </p>
      </div>

      <footer className="mt-10 overflow-hidden rounded-2xl bg-[#1F6B43] px-5 py-5 text-center text-white">
        <p className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-semibold text-white/90">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">
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
          className="mt-3 inline-flex items-center justify-center gap-2 text-[11px] font-semibold text-white/90 hover:text-white"
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
      className={`rounded-2xl border px-3 py-3 sm:px-4 ${
        accent
          ? "border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)]/60"
          : "border-[color:var(--fd-border)] bg-white"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-extrabold tabular-nums sm:text-2xl ${
          accent ? "text-[color:var(--fd-primary)]" : "text-[color:var(--fd-text)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
