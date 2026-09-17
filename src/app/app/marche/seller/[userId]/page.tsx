import { EavecMarcheSellerClient } from "@/components/eavec-market/marche-seller-client";

export default async function MarcheSellerPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <EavecMarcheSellerClient userId={userId} />;
}
