"use client";

import { useState } from "react";
import { COMMUNITY_TIP_BP } from "@/lib/reward-points-config";

/** Compact tip bar: BP amounts + McB (soon). */
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
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wide text-[#a8a29e]">
        Tip
      </span>
      {COMMUNITY_TIP_BP.amounts.map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled || busy}
          title={`${n} BP`}
          aria-label={`Tip ${n} BP`}
          onClick={() => void send(n)}
          className="min-h-[32px] min-w-[44px] rounded-lg border border-[#e8f3ee] bg-white px-2 text-[11px] font-bold tabular-nums text-[#305f33] active:scale-95 disabled:opacity-40"
        >
          {n} BP
        </button>
      ))}
      <button
        type="button"
        disabled
        title={fr ? "McB bientôt" : "McB soon"}
        className="min-h-[32px] cursor-not-allowed rounded-lg border border-dashed border-[#e7e5e4] px-2 text-[11px] font-bold text-[#a8a29e]"
      >
        McB
      </button>
    </div>
  );
}
