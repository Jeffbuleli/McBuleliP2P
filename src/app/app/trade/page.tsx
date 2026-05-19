import { redirect } from "next/navigation";

/** Trade hub — Bots first, then Futures. */
export default function TradeHubRedirectPage() {
  redirect("/app/trade/bots");
}
