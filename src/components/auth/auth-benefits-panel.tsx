"use client";

import { useI18n } from "@/components/i18n-provider";
import {
  IconCoins,
  IconP2P,
  IconShield,
  IconWallet,
} from "@/components/landing/landing-icons";
import { AuthEcosystemIllustration } from "@/components/auth/auth-ecosystem-illustration";

const BENEFITS = [
  { icon: IconShield, key: "auth_benefit_1", ring: "ring-emerald-200/80", bg: "bg-emerald-50", text: "text-emerald-800" },
  { icon: IconWallet, key: "auth_benefit_2", ring: "ring-sky-200/80", bg: "bg-sky-50", text: "text-sky-900" },
  { icon: IconP2P, key: "auth_benefit_3", ring: "ring-violet-200/80", bg: "bg-violet-50", text: "text-violet-800" },
  { icon: IconCoins, key: "auth_benefit_4", ring: "ring-amber-200/80", bg: "bg-amber-50", text: "text-amber-900" },
] as const;

export function AuthBenefitsPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();

  return (
    <div className={compact ? "mb-5" : "flex flex-col gap-5"}>
      {!compact ? (
        <AuthEcosystemIllustration className="mx-auto w-full max-w-sm drop-shadow-sm" />
      ) : null}
      <ul className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-1"}`}>
        {BENEFITS.map(({ icon: Icon, key, ring, bg, text }) => (
          <li
            key={key}
            className={`flex items-center gap-3 rounded-2xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 shadow-sm ring-1 ${ring}`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg} ${text}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-extrabold leading-snug text-[color:var(--fd-text)]">
              {t(key as "auth_benefit_1")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
