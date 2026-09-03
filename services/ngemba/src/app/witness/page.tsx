import { Suspense } from "react";
import { SosFlow } from "@/components/sos-flow";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function WitnessPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <SosFlow initialLocale={sp.lang} source="witness" />
    </Suspense>
  );
}
