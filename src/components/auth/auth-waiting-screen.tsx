"use client";

import { useI18n } from "@/components/i18n-provider";
import { McBuleliLogoMark } from "@/components/brand/mcbuleli-logo-mark";

/** Branded splash while auth / app shell loads (logo + name). */
export function AuthWaitingScreen({ message }: { message?: string }) {
  const { t } = useI18n();
  const status = message ?? "Loading…";

  return (
    <div
      className="flex min-h-[min(56vh,28rem)] flex-col items-center justify-center gap-6 py-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <McBuleliLogoMark size={72} corners animated />

      <div className="text-center">
        <p className="text-xl font-black tracking-tight text-stone-100">{t("brand")}</p>
        <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/75">
          {status}
        </p>
        <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400/80 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400/70 [animation-delay:180ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-400/65 [animation-delay:360ms]" />
        </div>
      </div>
    </div>
  );
}
