import { redirect } from "next/navigation";

export default function TradeOptionsRedirectPage() {
  redirect("/app/market?panel=futures");
}
