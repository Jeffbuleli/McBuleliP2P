import Image from "next/image";
import { marketIconUrl } from "@/lib/market-icons";

type AssetAvatarProps = {
  symbol: string;
  name?: string;
  partnerLogo?: string;
  badge?: string;
  badgeClass?: string;
  size?: "sm" | "md";
};

export function AssetAvatar({
  symbol,
  name,
  partnerLogo,
  badge,
  badgeClass = "bg-slate-100 text-slate-700",
  size = "md",
}: AssetAvatarProps) {
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const text = size === "sm" ? "text-[10px]" : "text-xs";

  if (partnerLogo) {
    return (
      <div className={`relative flex ${dim} shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-100`}>
        <Image src={partnerLogo} alt="" width={28} height={28} className="h-5 w-5 object-contain" unoptimized />
      </div>
    );
  }

  const icon = marketIconUrl(symbol);
  if (icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt={name ?? symbol}
        className={`${dim} shrink-0 rounded-full bg-white ring-1 ring-slate-100`}
        width={36}
        height={36}
      />
    );
  }

  const letter = badge ?? symbol.slice(0, 2).toUpperCase();
  return (
    <div className={`flex ${dim} shrink-0 items-center justify-center rounded-full font-black ring-1 ring-slate-100 ${text} ${badgeClass}`}>
      {letter}
    </div>
  );
}

export function formatLandingUsd(symbol: string, price: string): string {
  const n = Number(price);
  if (!Number.isFinite(n)) return price;
  if (symbol.includes("BTC")) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 100) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}
