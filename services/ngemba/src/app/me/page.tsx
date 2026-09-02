import { MeAlertsView } from "@/components/me-alerts";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function MePage({ searchParams }: Props) {
  const sp = await searchParams;
  return <MeAlertsView initialLocale={sp.lang} />;
}
