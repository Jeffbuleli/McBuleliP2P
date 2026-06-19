"use client";

import { useParams, useSearchParams } from "next/navigation";
import { FiatTxStatusScreen } from "@/components/wallet/fiat-tx-status-screen";

export default function WalletFiatTxStatusPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id ?? "";
  const cardReturn = searchParams.get("card") === "1";

  if (!id) return null;

  return <FiatTxStatusScreen txId={id} cardReturn={cardReturn} />;
}
