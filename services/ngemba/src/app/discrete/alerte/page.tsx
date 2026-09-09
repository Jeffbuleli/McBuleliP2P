import { Suspense } from "react";
import { DiscreteSilentFire } from "@/components/discrete-silent-fire";

type Props = { searchParams: Promise<{ lang?: string }> };

/** Geste / raccourci PWA : envoi immédiat, pas de formulaire voyant. */
export default async function DiscreteAlertPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <DiscreteSilentFire initialLocale={sp.lang} />
    </Suspense>
  );
}
