import { redirect } from "next/navigation";

/** Fiat hub removed - USD/CDF via wallet list + money sheet. */
export default function WalletFiatHubPage() {
  redirect("/app/wallet");
}
