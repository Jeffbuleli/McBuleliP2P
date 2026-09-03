import { Suspense } from "react";
import { YouthScenarioChat } from "@/components/youth-scenario-chat";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function JeunesseScenarioPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <YouthScenarioChat scenarioId={id} initialLocale={sp.lang} />
    </Suspense>
  );
}
