/** Refined event illustration — clean, editorial, not game-like. */

export function HackathonHeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      role="presentation"
    >
      <rect width="520" height="400" rx="24" fill="#f4f6f5" />
      <rect x="40" y="48" width="280" height="200" rx="16" fill="white" stroke="#305f33" strokeOpacity="0.18" strokeWidth="1.5" />
      <rect x="56" y="64" width="40" height="8" rx="4" fill="#305f33" fillOpacity="0.35" />
      <rect x="56" y="88" width="200" height="10" rx="5" fill="#0c0a09" fillOpacity="0.08" />
      <rect x="56" y="110" width="168" height="10" rx="5" fill="#0c0a09" fillOpacity="0.08" />
      <rect x="56" y="132" width="220" height="10" rx="5" fill="#0c0a09" fillOpacity="0.06" />
      <rect x="56" y="168" width="88" height="36" rx="10" fill="#305f33" />
      <rect x="156" y="168" width="88" height="36" rx="10" fill="#e8f3ee" stroke="#305f33" strokeOpacity="0.25" />
      <circle cx="400" cy="120" r="72" fill="#e8f3ee" />
      <circle cx="400" cy="120" r="48" fill="white" stroke="#305f33" strokeOpacity="0.2" strokeWidth="1.5" />
      <path
        d="M384 120h32M400 104v32"
        stroke="#305f33"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="340" y="220" width="140" height="120" rx="14" fill="white" stroke="#305f33" strokeOpacity="0.18" strokeWidth="1.5" />
      <rect x="356" y="240" width="108" height="8" rx="4" fill="#305f33" fillOpacity="0.25" />
      <rect x="356" y="260" width="72" height="8" rx="4" fill="#0c0a09" fillOpacity="0.08" />
      <rect x="356" y="280" width="96" height="8" rx="4" fill="#0c0a09" fillOpacity="0.08" />
      <rect x="356" y="300" width="48" height="8" rx="4" fill="#c47a1a" fillOpacity="0.45" />
      <text
        x="260"
        y="372"
        textAnchor="middle"
        fill="#305f33"
        fontSize="13"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
        letterSpacing="0.04em"
      >
        AI · Build · Pitch · Scale
      </text>
    </svg>
  );
}
