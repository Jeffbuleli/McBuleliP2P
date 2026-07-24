import { HackathonPayPageClient } from "@/components/hackathon/hackathon-pay-page-client";
import { getRegistrationByPaymentToken } from "@/lib/hackathon/service";

export default async function HackathonPayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const row = await getRegistrationByPaymentToken(token);

  if (!row) {
    return <HackathonPayPageClient data={{ kind: "invalid" }} />;
  }

  const { registration: reg, edition } = row;

  if (reg.paymentStatus === "paid" && reg.ticketCode) {
    return (
      <HackathonPayPageClient
        data={{ kind: "paid", ticketCode: reg.ticketCode }}
      />
    );
  }

  if (reg.paymentStatus === "expired") {
    return <HackathonPayPageClient data={{ kind: "expired" }} />;
  }

  return (
    <HackathonPayPageClient
      data={{
        kind: "pay",
        token,
        firstName: reg.firstName,
        editionNameFr: edition?.nameFr ?? "McBuleli Hackathon",
        editionNameEn: edition?.nameEn ?? "McBuleli Hackathon",
        ticketPack: reg.ticketPack,
        priceUsd: String(reg.priceUsd),
        phone: reg.phone,
        holdExpiresAt: reg.holdExpiresAt?.toISOString() ?? null,
      }}
    />
  );
}
