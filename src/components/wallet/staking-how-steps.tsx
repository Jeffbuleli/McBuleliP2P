"use client";

import { useI18n } from "@/components/i18n-provider";
import {
  StakingIllAprFixed,
  StakingIllLocked,
  StakingIllMaturity,
  StakingIllSimpleInterest,
} from "@/components/wallet/staking-illustrations";

const STEPS = [
  { key: "staking_how_1" as const, Ill: StakingIllAprFixed },
  { key: "staking_how_2" as const, Ill: StakingIllLocked },
  { key: "staking_how_3" as const, Ill: StakingIllSimpleInterest },
  { key: "staking_how_4" as const, Ill: StakingIllMaturity },
] as const;

export function StakingHowSteps() {
  const { t } = useI18n();
  return (
    <section className="fd-card overflow-hidden p-0">
      <div className="border-b border-[color:var(--fd-border)] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("staking_how_title")}
        </p>
      </div>
      <ul className="divide-y divide-[color:var(--fd-border)]">
        {STEPS.map(({ key, Ill }, i) => (
          <li key={key} className="flex items-start gap-3 px-4 py-3">
            <Ill className="h-11 w-11 shrink-0" />
            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] font-bold tabular-nums text-[color:var(--fd-primary)]">
                {i + 1}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-[color:var(--fd-text)]">
                {t(key)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
