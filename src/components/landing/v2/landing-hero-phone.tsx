/** Polished 3D phone mockup - hero illustration (SVG), McBuleli green + brown. */

export function LandingHeroPhone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 440 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="App preview"
    >
      <defs>
        <linearGradient id="lhp-ambient" x1="0" y1="0" x2="440" y2="400">
          <stop offset="0%" stopColor="#F5F5F4" />
          <stop offset="50%" stopColor="#ECFDF5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lhp-phone-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#44403C" />
          <stop offset="100%" stopColor="#1C1917" />
        </linearGradient>
        <linearGradient id="lhp-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FAFAF9" />
        </linearGradient>
        <linearGradient id="lhp-usdt" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3DD6A5" />
          <stop offset="100%" stopColor="#1A9B6C" />
        </linearGradient>
        <linearGradient id="lhp-pi" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="lhp-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#305F33" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#305F33" stopOpacity="0" />
        </linearGradient>
        <filter id="lhp-phone-shadow" x="-40%" y="-30%" width="180%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#1C1917" floodOpacity="0.2" />
        </filter>
        <filter id="lhp-float-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#1C1917" floodOpacity="0.1" />
        </filter>
      </defs>

      <rect width="440" height="400" rx="32" fill="url(#lhp-ambient)" />
      <circle cx="88" cy="120" r="56" fill="#305F33" opacity="0.06" />
      <circle cx="360" cy="300" r="48" fill="#78350F" opacity="0.05" />

      {/* USDT coin */}
      <g filter="url(#lhp-float-shadow)" transform="translate(52, 88) rotate(-14)">
        <circle r="40" fill="url(#lhp-usdt)" />
        <text y="10" textAnchor="middle" fill="white" fontSize="26" fontWeight="900" fontFamily="system-ui,sans-serif">$</text>
        <text y="30" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="system-ui,sans-serif">USDT</text>
      </g>

      {/* Pi coin */}
      <g filter="url(#lhp-float-shadow)" transform="translate(348, 56) rotate(10)">
        <circle r="34" fill="url(#lhp-pi)" />
        <text y="8" textAnchor="middle" fill="#78350F" fontSize="24" fontWeight="900" fontFamily="serif">π</text>
      </g>

      {/* BUY pill - green */}
      <g filter="url(#lhp-float-shadow)" transform="translate(48, 162)">
        <rect width="54" height="28" rx="14" fill="#305F33" />
        <text x="27" y="19" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="system-ui,sans-serif">BUY</text>
      </g>

      {/* SELL pill - brown */}
      <g filter="url(#lhp-float-shadow)" transform="translate(48, 198)">
        <rect width="54" height="28" rx="14" fill="#78350F" />
        <text x="27" y="19" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="system-ui,sans-serif">SELL</text>
      </g>

      {/* P2P badge with SVG hands */}
      <g filter="url(#lhp-float-shadow)" transform="translate(318, 168)">
        <rect width="72" height="52" rx="14" fill="white" stroke="#D6D3D1" strokeWidth="1.5" />
        <rect x="10" y="10" width="32" height="32" rx="10" fill="#305F33" opacity="0.12" />
        <path d="M18 26h16M22 22v8M30 22v8" stroke="#305F33" strokeWidth="2" strokeLinecap="round" />
        <text x="50" y="22" fill="#305F33" fontSize="9" fontWeight="900" fontFamily="system-ui,sans-serif">P2P</text>
        <text x="50" y="34" fill="#78716C" fontSize="7" fontWeight="700" fontFamily="system-ui,sans-serif">Escrow</text>
      </g>

      {/* Mobile money card */}
      <g filter="url(#lhp-float-shadow)" transform="translate(24, 268) rotate(-5)">
        <rect width="96" height="62" rx="16" fill="white" stroke="#E7E5E4" strokeWidth="1.5" />
        <rect x="12" y="14" width="32" height="32" rx="10" fill="#FF7900" />
        <path d="M22 28h12M22 34h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <rect x="52" y="18" width="34" height="7" rx="3.5" fill="#F5F5F4" />
        <rect x="52" y="30" width="26" height="7" rx="3.5" fill="#ECFDF5" />
        <text x="48" y="54" textAnchor="middle" fill="#78716C" fontSize="8" fontWeight="700" fontFamily="system-ui,sans-serif">Mobile Money</text>
      </g>

      {/* Phone */}
      <g filter="url(#lhp-phone-shadow)" transform="translate(220, 205) rotate(-6)">
        <rect x="-78" y="-162" width="156" height="324" rx="32" fill="url(#lhp-phone-body)" />
        <rect x="-68" y="-148" width="136" height="296" rx="24" fill="url(#lhp-screen)" />
        <rect x="-28" y="-156" width="56" height="22" rx="11" fill="#1C1917" />

        {/* Header - logo only */}
        <rect x="-58" y="-118" width="116" height="32" rx="12" fill="#305F33" />
        <circle cx="-42" cy="-102" r="10" fill="white" />
        <text x="-42" y="-98" textAnchor="middle" fill="#305F33" fontSize="9" fontWeight="900" fontFamily="system-ui,sans-serif">M</text>
        <text x="12" y="-97" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="system-ui,sans-serif">Wallet</text>

        {/* Asset chips */}
        <rect x="-58" y="-74" width="36" height="36" rx="11" fill="#ECFDF5" stroke="#305F33" strokeWidth="1.5" />
        <text x="-40" y="-50" textAnchor="middle" fill="#305F33" fontSize="8" fontWeight="800" fontFamily="system-ui,sans-serif">USDT</text>
        <rect x="-16" y="-74" width="36" height="36" rx="11" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" />
        <text x="2" y="-50" textAnchor="middle" fill="#78350F" fontSize="9" fontWeight="800" fontFamily="serif">π</text>
        <rect x="26" y="-74" width="36" height="36" rx="11" fill="#F5F5F4" stroke="#A8A29E" strokeWidth="1.5" />
        <text x="44" y="-50" textAnchor="middle" fill="#57534E" fontSize="7" fontWeight="800" fontFamily="system-ui,sans-serif">Fiat</text>

        {/* BUY / SELL / P2P row */}
        <rect x="-58" y="-30" width="36" height="28" rx="9" fill="#305F33" />
        <text x="-40" y="-12" textAnchor="middle" fill="white" fontSize="8" fontWeight="800" fontFamily="system-ui,sans-serif">BUY</text>
        <rect x="-16" y="-30" width="36" height="28" rx="9" fill="#78350F" />
        <text x="2" y="-12" textAnchor="middle" fill="white" fontSize="8" fontWeight="800" fontFamily="system-ui,sans-serif">SELL</text>
        <rect x="26" y="-30" width="36" height="28" rx="9" fill="white" stroke="#305F33" strokeWidth="1.5" />
        <text x="44" y="-12" textAnchor="middle" fill="#305F33" fontSize="8" fontWeight="800" fontFamily="system-ui,sans-serif">P2P</text>

        {/* Chart */}
        <rect x="-58" y="8" width="116" height="72" rx="12" fill="white" stroke="#E7E5E4" strokeWidth="1" />
        <path d="M-48 62 L-28 48 L-8 54 L12 32 L32 40 L52 18" fill="url(#lhp-chart-fill)" />
        <path d="M-48 62 L-28 48 L-8 54 L12 32 L32 40 L52 18" stroke="#305F33" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="52" cy="18" r="4" fill="#305F33" stroke="white" strokeWidth="2" />
        <rect x="-34" y="88" width="68" height="22" rx="11" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
        <text y="103" textAnchor="middle" fill="#305F33" fontSize="9" fontWeight="800" fontFamily="system-ui,sans-serif">+2.4% today</text>
      </g>
    </svg>
  );
}
