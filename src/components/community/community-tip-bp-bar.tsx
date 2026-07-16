"use client";

import { useState } from "react";
import { COMMUNITY_TIP_BP } from "@/lib/reward-points-config";

/** Compact BP tip amounts (icon-first). */
export function CommunityTipBpBar({
  fr,
  disabled,
  onTip,
}: {
  fr: boolean;
  disabled?: boolean;
  onTip: (amount: number) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const send = async (amount: number) => {
    if (disabled || busy) return;
    setBusy(true);
    try {
      await onTip(amount);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <svg
        className="h-3.5 w-3.5 shrink-0 text-[#305f33]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M12 3v18M7 8h8a3 3 0 010 6H9a3 3 0 000 6h8" />
      </svg>
      {COMMUNITY_TIP_BP.amounts.map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled || busy}
          title={fr ? `Tip ${n} BP` : `Tip ${n} BP`}
          aria-label={fr ? `Tip ${n} BP` : `Tip ${n} BP`}
          onClick={() => void send(n)}
          className="min-h-[32px] min-w-[40px] rounded-lg border border-[#e8f3ee] bg-white px-2 text-[11px] font-bold tabular-nums text-[#305f33] active:scale-95 disabled:opacity-40"
        >
          {n}
        </button>
      ))}
    </div>
  );
}
