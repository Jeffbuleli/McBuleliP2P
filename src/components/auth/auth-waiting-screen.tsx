"use client";

import Image from "next/image";
import { useI18n } from "@/components/i18n-provider";

/** Branded splash while auth / app shell loads (logo + name). */
export function AuthWaitingScreen({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <div
      className="flex min-h-[min(70vh,32rem)] flex-col items-center justify-center gap-5 py-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative">
        <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-[#305F33]/20">
          <Image
            src="/brand/logo.png"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
            priority
          />
        </div>
        <span
          className="absolute -bottom-0.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-[#305F33]/40 animate-pulse"
          aria-hidden
        />
      </div>
      <div className="text-center">
        <p className="text-2xl font-black tracking-tight text-[color:var(--fd-text)]">
          {t("brand")}
        </p>
        {message ? (
          <p className="mt-2 text-sm font-medium text-[color:var(--fd-muted)]">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
