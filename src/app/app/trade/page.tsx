import { redirect } from "next/navigation";

/** Hub is skipped on mobile: bottom nav opens futures first; keep route for deep links. */
export default function TradeHubRedirectPage() {
  redirect("/app/trade/futures");
}
