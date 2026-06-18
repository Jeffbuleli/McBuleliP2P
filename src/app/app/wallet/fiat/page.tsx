import { getSessionUserId } from "@/lib/session";
import { FiatHubClient } from "@/components/wallet/fiat-hub-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WalletFiatHubPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  return <FiatHubClient />;
}
