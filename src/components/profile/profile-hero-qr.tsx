"use client";

import Image from "next/image";
import QRCode from "react-qr-code";
import { walletPayUri } from "@/lib/wallet-pay-uri";

const QR_SIZE = 132;
const LOGO_SIZE = 28;

export function ProfileHeroQr({ userId }: { userId: string }) {
  return (
    <div className="profile-pay-qr mt-4 rounded-2xl border border-[var(--fd-border)] bg-white p-3 shadow-sm">
      <div className="relative inline-block">
        <QRCode value={walletPayUri(userId)} size={QR_SIZE} level="H" />
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <div className="rounded-lg bg-white p-1 shadow-sm ring-2 ring-white">
            <Image
              src="/brand/logo.png"
              alt=""
              width={LOGO_SIZE}
              height={LOGO_SIZE}
              className="h-7 w-7 object-contain"
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
}
