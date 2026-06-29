import { LP } from "@/components/landing/landing-svg-palette";

/** Compact auth-side ecosystem visual (reuses landing palette). */
export function AuthEcosystemIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 220" fill="none" aria-hidden>
      <defs>
        <linearGradient id="auth-eco-bg" x1="0" y1="0" x2="320" y2="220">
          <stop offset="0%" stopColor={LP.mint} />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <rect width="320" height="220" rx="24" fill="url(#auth-eco-bg)" />
      <circle cx="160" cy="108" r="72" fill={LP.brand} opacity="0.06" />
      <circle cx="160" cy="108" r="44" fill="white" stroke={LP.brand} strokeWidth="2.5" />
      <rect x="138" y="92" width="44" height="32" rx="8" fill={LP.mint} stroke={LP.brand} strokeWidth="1.8" />
      <rect x="108" y="138" width="34" height="16" rx="8" fill={LP.usdtSoft} stroke={LP.usdt} strokeWidth="1.2" />
      <text x="125" y="149" textAnchor="middle" fill={LP.usdt} fontSize="7" fontWeight="800">
        USDT
      </text>
      <rect x="146" y="138" width="28" height="16" rx="8" fill={LP.piSoft} stroke={LP.pi} strokeWidth="1.2" />
      <text x="160" y="149" textAnchor="middle" fill={LP.pi} fontSize="7" fontWeight="800">
        Pi
      </text>
      <rect x="178" y="138" width="34" height="16" rx="8" fill={LP.fiatSoft} stroke={LP.fiat} strokeWidth="1.2" />
      <text x="195" y="149" textAnchor="middle" fill={LP.fiat} fontSize="7" fontWeight="800">
        Fiat
      </text>
      <circle cx="56" cy="64" r="22" fill="white" stroke={LP.p2p} strokeWidth="2" />
      <circle cx="264" cy="64" r="22" fill="white" stroke={LP.trade} strokeWidth="2" />
      <circle cx="56" cy="168" r="20" fill="white" stroke={LP.mobile} strokeWidth="2" />
      <circle cx="264" cy="168" r="20" fill="white" stroke={LP.mcb} strokeWidth="2" />
      <path d="M82 64h48M190 64h48" stroke={LP.brand} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.35" />
      <path d="M76 168h56M188 168h56" stroke={LP.brand} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.35" />
    </svg>
  );
}
