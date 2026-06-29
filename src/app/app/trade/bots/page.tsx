import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function toMarketSearchParams(sp: SearchParams): string {
  const q = new URLSearchParams();
  q.set("panel", "bots");
  for (const [key, value] of Object.entries(sp)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) q.append(key, v);
    } else {
      q.set(key, value);
    }
  }
  return q.toString();
}

/** Legacy URL - keeps Academy / Community / OPS deep-links working. */
export default async function TradeBotsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  redirect(`/app/market?${toMarketSearchParams(sp)}`);
}
