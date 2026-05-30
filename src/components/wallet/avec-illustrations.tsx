/** Inline SVG for AVEC / village group savings (shared treasury, members). */

type IllProps = { className?: string };

export function AvecHeroIllustration({ className = "h-16 w-16" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#FFF7ED" />
      <circle cx="32" cy="32" r="18" stroke="#FB923C" strokeWidth="1.5" opacity="0.4" />
      <circle cx="32" cy="20" r="5" fill="#FDBA74" stroke="#EA580C" strokeWidth="1.25" />
      <circle cx="20" cy="38" r="4.5" fill="#FDBA74" stroke="#EA580C" strokeWidth="1.25" />
      <circle cx="44" cy="38" r="4.5" fill="#FDBA74" stroke="#EA580C" strokeWidth="1.25" />
      <path
        d="M27 28h10v14H27z"
        fill="#F97316"
        opacity="0.85"
        stroke="#C2410C"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M30 32h4M30 36h4"
        stroke="white"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AvecCompactIllustration({ className = "h-12 w-12" }: IllProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="22" fill="#FFEDD5" />
      <circle cx="24" cy="16" r="4" fill="#FB923C" />
      <circle cx="14" cy="30" r="3.5" fill="#FB923C" />
      <circle cx="34" cy="30" r="3.5" fill="#FB923C" />
      <rect x="19" y="22" width="10" height="8" rx="2" fill="#EA580C" opacity="0.9" />
    </svg>
  );
}
