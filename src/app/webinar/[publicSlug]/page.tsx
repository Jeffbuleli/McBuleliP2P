import { AcademyWebinarPublicClient } from "@/components/academy/academy-webinar-public-client";

export const dynamic = "force-dynamic";

export default async function WebinarPublicPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;
  const nextPath = `/webinar/${publicSlug}`;
  return (
    <AcademyWebinarPublicClient publicSlug={publicSlug} nextPath={nextPath} />
  );
}
