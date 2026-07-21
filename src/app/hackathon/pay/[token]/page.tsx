import Link from "next/link";
import { HackathonPayClient } from "@/components/hackathon/hackathon-pay-client";
import { HackathonProcessCard } from "@/components/hackathon/hackathon-process-card";
import { getRegistrationByPaymentToken } from "@/lib/hackathon/service";

export default async function HackathonPayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const row = await getRegistrationByPaymentToken(token);

  if (!row) {
    return (
      <HackathonProcessCard
        tone="danger"
        title="Lien invalide"
        subtitle="Ce lien de paiement n'existe pas ou a déjà été utilisé."
        backHref="/hackathon#register"
        backLabel="← Retour au Hackathon"
      />
    );
  }

  const { registration: reg, edition } = row;
  const isFr = reg.locale !== "en";
  const expired = reg.paymentStatus === "expired";

  if (reg.paymentStatus === "paid" && reg.ticketCode) {
    return (
      <HackathonProcessCard
        tone="success"
        title={isFr ? "Déjà payé" : "Already paid"}
        subtitle={
          isFr
            ? "Votre inscription est confirmée. Votre ticket QR est disponible."
            : "Your registration is confirmed. Your QR ticket is ready."
        }
        backHref={`/hackathon/ticket/${encodeURIComponent(reg.ticketCode)}`}
        backLabel={isFr ? "Voir mon ticket →" : "View my ticket →"}
      >
        <Link
          href={`/hackathon/ticket/${encodeURIComponent(reg.ticketCode)}`}
          className="inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white"
        >
          {isFr ? "Ouvrir mon ticket" : "Open my ticket"}
        </Link>
      </HackathonProcessCard>
    );
  }

  if (expired) {
    return (
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
    );
  }

  const editionName = isFr
    ? (edition?.nameFr ?? "McBuleli Hackathon")
    : (edition?.nameEn ?? "McBuleli Hackathon");

  return (
    <HackathonPayClient
      token={token}
      locale={isFr ? "fr" : "en"}
      firstName={reg.firstName}
      editionName={editionName}
      ticketPack={reg.ticketPack}
      priceUsd={String(reg.priceUsd)}
      phone={reg.phone}
      holdExpiresAt={reg.holdExpiresAt?.toISOString() ?? null}
    />
  );
}
