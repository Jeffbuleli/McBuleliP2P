"use client";

import { useI18n } from "@/components/i18n-provider";

function KycShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.5L3 3.5v3.5c0 3.2 2.1 5.3 5 6.5 2.9-1.2 5-3.3 5-6.5V3.5L8 1.5z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M6 8l1.2 1.2L10.5 6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KycVerifiedBadge({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const label = t("kyc_badge_label");

  if (compact) {
    return (
      <span
        className={`inline-flex shrink-0 items-center text-emerald-700 ${className}`}
        title={label}
        aria-label={label}
      >
        <KycShieldIcon className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-emerald-800 ${className}`}
      title={label}
      aria-label={label}
    >
      <KycShieldIcon className="h-3 w-3" />
      <span>KYC</span>
    </span>
  );
}
