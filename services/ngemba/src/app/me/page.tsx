import { Suspense } from "react";
import { MeAlertsView } from "@/components/me-alerts";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function MePage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <MeAlertsView initialLocale={sp.lang} />
    </Suspense>
  );
}
