"use client";

import {
  IllustrationAutoScan,
  IllustrationReview,
} from "@/components/wallet/deposit-illustrations";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";

type Variant = "auto" | "ambiguous" | "expired";

export function DepositStatusChip({ variant }: { variant: Variant }) {
  const { t } = useI18n();
  const key: keyof Messages =
    variant === "auto"
      ? "deposit_auto_detect_hint"
      : variant === "ambiguous"
        ? "deposit_session_ambiguous"
        : "deposit_status_expired_pending_scan";

  const styles =
    variant === "auto"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
      : variant === "ambiguous"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
        : "border-white/12 bg-[#0a1018]/85 text-[color:var(--fd-muted)]";

  const Illustration = variant === "auto" ? IllustrationAutoScan : IllustrationReview;

  return (
    <div className={`mt-2 flex items-center gap-2.5 rounded-xl border px-3 py-2 ${styles}`}>
      <Illustration className="h-10 w-10 shrink-0" />
      <p className="text-xs font-semibold leading-snug">{t(key)}</p>
    </div>
  );
}
