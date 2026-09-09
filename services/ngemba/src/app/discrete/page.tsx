import { Suspense } from "react";
import { DiscreteGuideView } from "@/components/discrete-guide";

type Props = { searchParams: Promise<{ lang?: string }> };

/** Guide citadin : explique les gestes discrets (pas l’envoi d’alerte). */
export default async function DiscreteGuidePage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <DiscreteGuideView initialLocale={sp.lang} />
    </Suspense>
  );
}
