import { redirect } from "next/navigation";

export default function TradeHubPage() {
  redirect("/app/market?panel=futures");
}
