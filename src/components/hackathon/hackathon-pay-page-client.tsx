"use client";

import Link from "next/link";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { useI18n } from "@/components/i18n-provider";
import { HackathonPayClient } from "@/components/hackathon/hackathon-pay-client";
import { HackathonProcessCard } from "@/components/hackathon/hackathon-process-card";

export type HackathonPayPageData =
  | { kind: "invalid" }
  | {
      kind: "paid";
      ticketCode: string;
    }
  | { kind: "expired" }
  | {
      kind: "pay";
      token: string;
      firstName: string;
      editionNameFr: string;
      editionNameEn: string;
      ticketPack: string;
      priceUsd: string;
      phone: string;
      holdExpiresAt: string | null;
    };

export function HackathonPayPageClient({ data }: { data: HackathonPayPageData }) {
  const { locale } = useI18n();
  const isFr = locale === "fr";

  if (data.kind === "invalid") {
    return (
      <div className="min-h-dvh bg-[#F7F8F5]">
        <LandingTopBar authReturnPath="/hackathon" />
        <HackathonProcessCard
          tone="danger"
          title={isFr ? "Lien invalide" : "Invalid link"}
          subtitle={
            isFr
              ? "Ce lien de paiement n'existe pas ou a déjà été utilisé."
              : "This payment link does not exist or was already used."
          }
          backHref="/hackathon#register"
          backLabel={isFr ? "← Retour au Hackathon" : "← Back to Hackathon"}
        />
      </div>
    );
  }

  if (data.kind === "paid") {
    return (
      <div className="min-h-dvh bg-[#F7F8F5]">
        <LandingTopBar authReturnPath="/hackathon" />
        <HackathonProcessCard
          tone="success"
          title={isFr ? "Déjà payé" : "Already paid"}
          subtitle={
            isFr
              ? "Votre inscription est confirmée. Votre ticket QR est disponible."
              : "Your registration is confirmed. Your QR ticket is ready."
          }
          backHref={`/hackathon/ticket/${encodeURIComponent(data.ticketCode)}`}
          backLabel={isFr ? "Voir mon ticket →" : "View my ticket →"}
        >
          <Link
            href={`/hackathon/ticket/${encodeURIComponent(data.ticketCode)}`}
            className="inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white"
          >
            {isFr ? "Ouvrir mon ticket" : "Open my ticket"}
          </Link>
        </HackathonProcessCard>
      </div>
    );
  }

  if (data.kind === "expired") {
    return (
      <div className="min-h-dvh bg-[#F7F8F5]">
        <LandingTopBar authReturnPath="/hackathon" />
        <HackathonProcessCard
          tone="warning"
          title={isFr ? "Réservation expirée" : "Hold expired"}
          subtitle={
            isFr
              ? "Cette réservation n'est plus active. Pré-inscrivez-vous à nouveau pour reprendre une place."
              : "This reservation is no longer active. Pre-register again to claim a seat."
          }
          backHref="/hackathon#register"
          backLabel={isFr ? "← Pré-inscrire" : "← Pre-register"}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F7F8F5]">
      <LandingTopBar authReturnPath="/hackathon" />
      <HackathonPayClient
        token={data.token}
        firstName={data.firstName}
        editionNameFr={data.editionNameFr}
        editionNameEn={data.editionNameEn}
        ticketPack={data.ticketPack}
        priceUsd={data.priceUsd}
        phone={data.phone}
        holdExpiresAt={data.holdExpiresAt}
      />
    </div>
  );
}
