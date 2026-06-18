import { notFound } from "next/navigation";
import { AssetDetailScreen } from "@/components/wallet/asset-detail-screen";
import { FiatAssetDetailScreen } from "@/components/wallet/fiat-asset-detail-screen";
import { isWalletCryptoAsset } from "@/lib/wallet-crypto-assets";
import { isWalletFiatAsset } from "@/lib/wallet-fiat-assets";

export const dynamic = "force-dynamic";

export default async function WalletAssetPage({
  params,
}: {
  params: Promise<{ asset: string }>;
}) {
  const { asset } = await params;
  if (isWalletCryptoAsset(asset)) {
    return <AssetDetailScreen asset={asset} />;
  }
  if (isWalletFiatAsset(asset)) {
    return <FiatAssetDetailScreen asset={asset} />;
  }
  notFound();
}
