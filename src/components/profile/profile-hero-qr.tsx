"use client";

import QRCode from "react-qr-code";
import { walletPayUri } from "@/lib/wallet-pay-uri";

export function ProfileHeroQr({ userId }: { userId: string }) {
  return (
    <div className="profile-pay-qr mt-4 rounded-2xl border border-[var(--fd-border)] bg-white p-3 shadow-sm">
      <QRCode value={walletPayUri(userId)} size={132} level="M" />
    </div>
  );
}
