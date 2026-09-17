import { EavecMarcheOrderDetailClient } from "@/components/eavec-market/marche-orders-client";

export default async function MarcheOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EavecMarcheOrderDetailClient id={id} />;
}
