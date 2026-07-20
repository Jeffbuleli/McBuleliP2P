import { HackathonPayClient } from "@/components/hackathon/hackathon-pay-client";
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
      <div className="home-theme fd-public-light flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[1.75rem] border border-[color:var(--fd-border)] bg-white p-6 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
            McBuleli Hackathon
          </p>
          <h1 className="mt-3 text-xl font-black text-[color:var(--fd-text)]">
            Lien invalide
          </h1>
          <p className="mt-2 text-sm text-[color:var(--fd-muted)]">
            Ce lien de paiement n&apos;existe pas ou a déjà été utilisé.
          </p>
          <a
            href="/hackathon#register"
            className="mt-6 inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white"
          >
            Retour au Hackathon
          </a>
        </div>
      </div>
    );
  }

  const { registration: reg, edition } = row;
  const isFr = reg.locale !== "en";
  const expired = reg.paymentStatus === "expired";

  if (reg.paymentStatus === "paid" && reg.ticketCode) {
    return (
      <div className="home-theme fd-public-light flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[1.75rem] border border-[color:var(--fd-border)] bg-white p-6 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
            McBuleli Hackathon
          </p>
          <h1 className="mt-3 text-xl font-black text-[color:var(--fd-text)]">
            {isFr ? "Déjà payé" : "Already paid"}
          </h1>
          <a
            href={`/hackathon/ticket/${encodeURIComponent(reg.ticketCode)}`}
            className="mt-6 inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white"
          >
            {isFr ? "Voir mon ticket" : "View my ticket"}
          </a>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="home-theme fd-public-light flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[1.75rem] border border-[color:var(--fd-border)] bg-white p-6 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
            McBuleli Hackathon
          </p>
          <h1 className="mt-3 text-xl font-black text-[color:var(--fd-text)]">
            {isFr ? "Réservation expirée" : "Hold expired"}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--fd-muted)]">
            {isFr
              ? "Cette réservation n'est plus active. Pré-inscrivez-vous à nouveau pour reprendre une place."
              : "This reservation is no longer active. Pre-register again to claim a seat."}
          </p>
          <a
            href="/hackathon#register"
            className="mt-6 inline-flex rounded-2xl bg-[color:var(--fd-primary)] px-5 py-3 text-sm font-extrabold text-white"
          >
            {isFr ? "Pré-inscrire" : "Pre-register"}
          </a>
        </div>
      </div>
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
