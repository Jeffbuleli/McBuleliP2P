/** Abstract AI / build illustration for hackathon hero — FD palette. */

export function HackathonHeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="hkBg" x1="40" y1="20" x2="440" y2="340" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e8f3ee" />
          <stop offset="1" stopColor="#d4e8dc" />
        </linearGradient>
        <linearGradient id="hkAccent" x1="120" y1="80" x2="360" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="#305f33" />
          <stop offset="1" stopColor="#1e3d20" />
        </linearGradient>
      </defs>
      <rect x="16" y="16" width="448" height="328" rx="28" fill="url(#hkBg)" />
      <circle cx="380" cy="72" r="48" fill="#305f33" opacity="0.12" />
      <circle cx="90" cy="280" r="36" fill="#c9a227" opacity="0.18" />
      {/* Window / IDE */}
      <rect x="88" y="88" width="220" height="160" rx="14" fill="white" stroke="#305f33" strokeWidth="2.5" />
      <circle cx="108" cy="108" r="5" fill="#ef4444" />
      <circle cx="124" cy="108" r="5" fill="#eab308" />
      <circle cx="140" cy="108" r="5" fill="#22c55e" />
      <rect x="104" y="128" width="120" height="8" rx="4" fill="#305f33" opacity="0.35" />
      <rect x="104" y="148" width="160" height="8" rx="4" fill="#305f33" opacity="0.2" />
      <rect x="104" y="168" width="90" height="8" rx="4" fill="#305f33" opacity="0.2" />
      <rect x="104" y="188" width="140" height="8" rx="4" fill="#c9a227" opacity="0.55" />
      <rect x="104" y="208" width="70" height="8" rx="4" fill="#305f33" opacity="0.15" />
      {/* Phone / pitch */}
      <rect x="300" y="120" width="92" height="168" rx="16" fill="url(#hkAccent)" />
      <rect x="312" y="140" width="68" height="100" rx="8" fill="white" opacity="0.92" />
      <rect x="324" y="152" width="44" height="6" rx="3" fill="#305f33" opacity="0.4" />
      <rect x="324" y="168" width="32" height="6" rx="3" fill="#305f33" opacity="0.25" />
      <circle cx="346" cy="220" r="14" fill="#305f33" opacity="0.2" />
      <path
        d="M200 280c40-48 80-48 120 0"
        stroke="#305f33"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
      <text
        x="240"
        y="318"
        textAnchor="middle"
        fill="#305f33"
        fontSize="14"
        fontWeight="800"
        fontFamily="system-ui,sans-serif"
      >
        Vibe Coding · AI · Ship
      </text>
    </svg>
  );
}
