import { redirect } from "next/navigation";

/** Legacy URL — swap was removed in favor of P2P. */
export default function WalletSwapRedirectPage() {
  redirect("/app/wallet");
}
