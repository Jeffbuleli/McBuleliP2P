import { AcademyEditionClient } from "@/components/academy/academy-edition-client";

export const dynamic = "force-dynamic";

export default async function AcademyEditionPage({
  params,
  searchParams,
}: {
  params: Promise<{ editionSlug: string }>;
  searchParams: Promise<{ program?: string }>;
}) {
  const { editionSlug } = await params;
  const sp = await searchParams;
  const programSlug =
    sp.program?.trim() || "launch-crypto-trading-ia-p2p";

  return (
    <AcademyEditionClient editionSlug={editionSlug} programSlug={programSlug} />
  );
}
