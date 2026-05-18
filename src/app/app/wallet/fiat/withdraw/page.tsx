import { redirect } from "next/navigation";

/** Fiat (USD/CDF) via PawaPay is disabled — crypto wallet only. */
export default function WalletFiatWithdrawPage() {
  redirect("/app/wallet");
}
