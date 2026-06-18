import Image from "next/image";
import type { WalletAsset } from "@/lib/wallet-types";

const PNG: Partial<Record<WalletAsset, string>> = {
  USDT: "/assets/crypto/usdt.png",
  PI: "/assets/crypto/pi.png",
  PI_TEST: "/assets/crypto/pi.png",
  USD: "/assets/crypto/usd.png",
  CDF: "/assets/crypto/cdf.png",
};

export function assetDetailHref(asset: WalletAsset): string {
  return `/app/wallet/${asset}`;
}

export function WalletAssetIcon({
  asset,
  size = 44,
  className = "",
}: {
  asset: WalletAsset;
  size?: number;
  className?: string;
}) {
  const src = PNG[asset];
  if (!src) {
    return (
      <span
        className={`flex items-center justify-center rounded-full bg-[color:var(--fd-mint)] font-bold text-[color:var(--fd-primary)] ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.28 }}
      >
        {asset.slice(0, 2)}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
