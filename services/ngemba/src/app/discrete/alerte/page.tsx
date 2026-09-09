import { Suspense } from "react";
import { SosFlow } from "@/components/sos-flow";

type Props = { searchParams: Promise<{ lang?: string }> };

/** Composition alerte discrète - déclenchée par gestes / raccourci PWA. */
export default async function DiscreteAlertPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <SosFlow initialLocale={sp.lang} discrete />
    </Suspense>
  );
}
