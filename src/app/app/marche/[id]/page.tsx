import { EavecMarcheDetailClient } from "@/components/eavec-market/marche-detail-client";

export default async function MarcheDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EavecMarcheDetailClient id={id} />;
}
