"use client";

import { AcademyIcon } from "@/components/academy/academy-icon";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";

/** Schéma visuel : compte → rejoindre / payer → salle. */
export function AcademyLiveAccessFlow() {
  const { t } = useI18n();
  const steps = [
    { icon: "wallet" as const, key: "academy_live_flow_account" as const },
    { icon: "live" as const, key: "academy_live_flow_join" as const },
    { icon: "video" as const, key: "academy_live_flow_host" as const },
  ];
  return (
    <div
      className="flex items-stretch justify-between gap-1 rounded-2xl border border-[#305f33]/20 bg-[#e8f3ee]/60 px-3 py-4"
      aria-hidden
    >
      {steps.map((s) => (
        <div key={s.key} className="flex min-w-0 flex-1 flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-[#305f33]/15">
            <AcademyIcon name={s.icon} className="h-5 w-5 text-[#305f33]" />
          </span>
          <p className="mt-2 text-[9px] font-bold leading-tight text-[#1a2e1c]">
            {t(s.key as keyof Messages)}
          </p>
        </div>
      ))}
    </div>
  );
}
