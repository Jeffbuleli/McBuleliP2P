import { AcademyModuleClient } from "@/components/academy/academy-module-client";

export const dynamic = "force-dynamic";

export default async function AcademyModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ editionSlug: string; moduleSlug: string }>;
  searchParams: Promise<{ program?: string }>;
}) {
  const { editionSlug, moduleSlug } = await params;
  const sp = await searchParams;
  const programSlug =
    sp.program?.trim() || "launch-crypto-trading-ia-p2p";

  return (
    <AcademyModuleClient
      editionSlug={editionSlug}
      moduleSlug={moduleSlug}
      programSlug={programSlug}
    />
  );
}
