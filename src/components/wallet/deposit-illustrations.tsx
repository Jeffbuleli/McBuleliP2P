/** Inline SVG illustrations for deposit flow (no external assets). */

export function IllustrationExactAmount({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#EEF2FF" />
      <rect x="14" y="22" width="36" height="24" rx="6" fill="#4F46E5" opacity="0.15" />
      <rect x="18" y="26" width="28" height="16" rx="4" fill="#4F46E5" />
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fill="white"
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        USDT
      </text>
      <path
        d="M44 14l4 4-10 10-4-4 10-10z"
        fill="#F59E0B"
        stroke="#D97706"
        strokeWidth="1"
      />
      <circle cx="48" cy="18" r="9" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
      <path
        d="M45 18h6M48 15v6"
        stroke="#B45309"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IllustrationAutoScan({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#ECFDF5" />
      <circle cx="32" cy="32" r="18" stroke="#10B981" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="32" cy="32" r="10" fill="#10B981" opacity="0.2" />
      <path
        d="M32 20v6M32 38v6M20 32h6M38 32h6"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="4" fill="#059669" />
      <path
        d="M42 22l6-6M42 42l6 6M22 42l-6 6M22 22l-6-6"
        stroke="#34D399"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IllustrationReview({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#FFFBEB" />
      <path
        d="M32 16l4 12h12l-10 8 4 12-10-7-10 7 4-12-10-8h12z"
        fill="#FCD34D"
        stroke="#F59E0B"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <rect x="20" y="44" width="24" height="6" rx="3" fill="#FDE68A" />
    </svg>
  );
}
