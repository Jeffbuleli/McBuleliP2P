import { redirect } from "next/navigation";

/** Trade hub — Futures/Demo first. */
export default function TradeHubRedirectPage() {
  redirect("/app/trade/futures");
}
