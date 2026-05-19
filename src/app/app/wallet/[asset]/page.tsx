import { notFound } from "next/navigation";
import { AssetDetailScreen } from "@/components/wallet/asset-detail-screen";
import { isWalletCryptoAsset } from "@/lib/wallet-crypto-assets";

export const dynamic = "force-dynamic";

export default async function WalletAssetPage({
  params,
}: {
  params: Promise<{ asset: string }>;
}) {
  const { asset } = await params;
  if (!isWalletCryptoAsset(asset)) {
    notFound();
  }
  return <AssetDetailScreen asset={asset} />;
}
