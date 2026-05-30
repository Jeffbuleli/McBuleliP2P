/** Inline SVG illustrations for fixed-term staking (matches backend: lock → simple interest → maturity). */

type IllProps = { className?: string };

export function StakingHeroIllustration({ className = "h-20 w-20" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="38" fill="#ECFDF5" />
      <rect x="22" y="28" width="36" height="28" rx="8" fill="#059669" opacity="0.12" />
      <rect x="26" y="32" width="28" height="20" rx="6" fill="#059669" />
      <path
        d="M34 42h12M40 36v12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="56" cy="24" r="12" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
      <path
        d="M52 24l3 3 6-6"
        stroke="#B45309"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 52c4-6 10-6 14 0s10 6 14 0"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StakingIllAprFixed({ className = "h-11 w-11" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden>
      <circle cx="22" cy="22" r="20" fill="#D1FAE5" />
      <rect x="12" y="14" width="20" height="16" rx="4" fill="#059669" opacity="0.2" />
      <path
        d="M16 22h12M22 16v12"
        stroke="#047857"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <text
        x="22"
        y="36"
        textAnchor="middle"
        fill="#047857"
        fontSize="8"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        APR
      </text>
    </svg>
  );
}

export function StakingIllLocked({ className = "h-11 w-11" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden>
      <circle cx="22" cy="22" r="20" fill="#E0E7FF" />
      <rect x="14" y="20" width="16" height="12" rx="3" fill="#6366F1" />
      <path
        d="M17 20v-3a5 5 0 0110 0v3"
        stroke="#6366F1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="22" cy="26" r="2" fill="#C7D2FE" />
    </svg>
  );
}

export function StakingIllSimpleInterest({ className = "h-11 w-11" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden>
      <circle cx="22" cy="22" r="20" fill="#FEF3C7" />
      <path
        d="M12 30 L22 14 L32 30"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M16 26h12" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <text
        x="22"
        y="36"
        textAnchor="middle"
        fill="#92400E"
        fontSize="6"
        fontWeight="600"
        fontFamily="system-ui,sans-serif"
      >
        P×APR×d/365
      </text>
    </svg>
  );
}

export function StakingIllMaturity({ className = "h-11 w-11" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden>
      <circle cx="22" cy="22" r="20" fill="#ECFDF5" />
      <rect x="11" y="18" width="22" height="14" rx="4" fill="#10B981" opacity="0.25" />
      <rect x="14" y="21" width="16" height="8" rx="2" fill="#059669" />
      <path
        d="M28 12l3 3-8 8-4-4 8-8z"
        fill="#34D399"
        stroke="#059669"
        strokeWidth="1"
      />
    </svg>
  );
}

export function StakingIllEmpty({ className = "h-14 w-14" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 56 56" fill="none" aria-hidden>
      <circle cx="28" cy="28" r="26" fill="#F5F5F4" />
      <circle cx="28" cy="28" r="14" stroke="#A8A29E" strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="22" y="24" width="12" height="10" rx="2" fill="#D6D3D1" />
      <path
        d="M24 24v-2a4 4 0 018 0v2"
        stroke="#78716C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
