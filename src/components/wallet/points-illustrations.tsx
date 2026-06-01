/** Inline SVG — Buleli Points (BP) coin badge (McBuleli green + gold utility). */

type IllProps = { className?: string };

export function BuleliPointsHeroIllustration({ className = "h-20 w-20" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="38" fill="#ECFDF5" />
      <circle cx="40" cy="40" r="30" fill="url(#bp_coin_grad)" stroke="#305F33" strokeWidth="2" />
      <circle cx="40" cy="40" r="24" fill="none" stroke="#FDE68A" strokeWidth="1.5" opacity="0.85" />
      <text
        x="40"
        y="46"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="22"
        fontWeight="800"
        fontFamily="system-ui,sans-serif"
        letterSpacing="-0.5"
      >
        BP
      </text>
      <path
        d="M22 58c6-4 14-4 20 0s14 4 20 0"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="58" cy="22" r="10" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
      <path
        d="M54 22l2.5 2.5 5-5"
        stroke="#B45309"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="bp_coin_grad" x1="16" y1="16" x2="64" y2="64">
          <stop stopColor="#3D7A40" />
          <stop offset="1" stopColor="#305F33" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BuleliPointsCompactIllustration({ className = "h-12 w-12" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="22" fill="#D1FAE5" />
      <circle cx="24" cy="24" r="17" fill="#305F33" stroke="#244A27" strokeWidth="1.5" />
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="13"
        fontWeight="800"
        fontFamily="system-ui,sans-serif"
      >
        BP
      </text>
    </svg>
  );
}

export function BuleliPointsEarnIllustration({ className = "h-11 w-11" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden>
      <circle cx="22" cy="22" r="20" fill="#ECFDF5" />
      <path
        d="M14 28V16l8 4 8-4v12"
        stroke="#305F33"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="14" r="6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.2" />
      <path d="M28 14h4M30 12v4" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function BuleliPointsSpendIllustration({ className = "h-11 w-11" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden>
      <circle cx="22" cy="22" r="20" fill="#FEF3C7" />
      <rect x="13" y="18" width="18" height="12" rx="3" fill="#305F33" />
      <path d="M16 18v-2a6 6 0 0112 0v2" stroke="#305F33" strokeWidth="2" />
      <text x="22" y="27" textAnchor="middle" fill="#FFF" fontSize="7" fontWeight="700">
        −15%
      </text>
    </svg>
  );
}

/** McB on-chain utility token badge (maroon + gold). */
export function McBHeroIllustration({ className = "h-20 w-20" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="38" fill="#FEF2F2" />
      <circle cx="40" cy="40" r="30" fill="url(#mcb_coin_grad)" stroke="#7F1D1D" strokeWidth="2" />
      <circle cx="40" cy="40" r="24" fill="none" stroke="#FDE68A" strokeWidth="1.5" opacity="0.9" />
      <text
        x="40"
        y="46"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="18"
        fontWeight="800"
        fontFamily="system-ui,sans-serif"
        letterSpacing="-0.5"
      >
        McB
      </text>
      <path
        d="M14 26 L26 14 M54 14 L66 26"
        stroke="#FCA5A5"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="58" cy="58" r="9" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
      <path
        d="M55 58h6M58 55v6"
        stroke="#B45309"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="mcb_coin_grad" x1="16" y1="16" x2="64" y2="64">
          <stop stopColor="#991B1B" />
          <stop offset="1" stopColor="#7F1D1D" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function McBCompactIllustration({ className = "h-12 w-12" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="22" fill="#FEE2E2" />
      <circle cx="24" cy="24" r="17" fill="#991B1B" stroke="#7F1D1D" strokeWidth="1.5" />
      <text
        x="24"
        y="28"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="11"
        fontWeight="800"
        fontFamily="system-ui,sans-serif"
      >
        McB
      </text>
    </svg>
  );
}
