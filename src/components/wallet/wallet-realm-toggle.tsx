"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSwapBrand } from "@/components/wallet/icon-swap-brand";

export type WalletRealmLabels = {
  crypto: string;
  swap: string;
};

export function WalletRealmToggle({
  labels,
  variant = "wallet",
}: {
  labels: WalletRealmLabels;
  variant?: "wallet" | "home";
}) {
  const pathname = usePathname();
  const onWallet = variant === "wallet" && pathname === "/app/wallet";

  return (
    <div className="wallet-realm-toggle mt-4 grid grid-cols-2 gap-2">
      <Link
        href="/app/wallet"
        onClick={(e) => {
          if (onWallet) {
            e.preventDefault();
            document.getElementById("wallet-assets")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
        className={`wallet-realm-btn wallet-realm-btn-crypto ${onWallet ? "wallet-realm-btn-active" : ""}`}
        aria-current={onWallet ? "page" : undefined}
      >
        {labels.crypto}
      </Link>
      <Link
        href="/app/wallet/swap"
        className={`wallet-realm-btn wallet-realm-btn-swap ${pathname.startsWith("/app/wallet/swap") ? "wallet-realm-btn-active" : ""}`}
        aria-current={pathname.startsWith("/app/wallet/swap") ? "page" : undefined}
      >
        <span className="wallet-realm-btn-icon">
          <IconSwapBrand className="h-4 w-4 shrink-0" />
        </span>
        <span className="leading-none">{labels.swap}</span>
      </Link>
    </div>
  );
}
