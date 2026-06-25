import { FuturesGuideClient } from "@/components/trade/futures-guide-client";
import { getLocale } from "@/lib/get-locale";

export default async function FuturesGuidePage() {
  const locale = await getLocale();
  return <FuturesGuideClient locale={locale} />;
}
