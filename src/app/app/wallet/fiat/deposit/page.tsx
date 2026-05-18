import { redirect } from "next/navigation";

/** Fiat (USD/CDF) via PawaPay is disabled — crypto wallet only. */
export default function WalletFiatDepositInfoPage() {
  redirect("/app/wallet");
}
