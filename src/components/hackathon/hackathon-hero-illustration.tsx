/** Hero visual for /hackathon - editorial composition: AI → Build → Pitch → Scale. */

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
      <defs>
        <linearGradient id="hkHeroBg" x1="40" y1="20" x2="480" y2="380" gradientUnits="userSpaceOnUse">
          <stop stopColor="#eef5f0" />
          <stop offset="0.55" stopColor="#f4f6f5" />
          <stop offset="1" stopColor="#e8f3ee" />
        </linearGradient>
        <linearGradient id="hkHeroCard" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#f8fbf9" />
        </linearGradient>
        <filter id="hkSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#305f33" floodOpacity="0.08" />
        </filter>
      </defs>

      <rect width="520" height="400" rx="28" fill="url(#hkHeroBg)" />

      {/* Soft atmosphere orbs */}
      <circle cx="430" cy="70" r="56" fill="#305f33" fillOpacity="0.06" />
      <circle cx="90" cy="320" r="40" fill="#c47a1a" fillOpacity="0.07" />

      {/* ——— IDE / Build panel ——— */}
      <g filter="url(#hkSoft)">
        <rect x="36" y="44" width="248" height="210" rx="18" fill="url(#hkHeroCard)" stroke="#305f33" strokeOpacity="0.14" strokeWidth="1.5" />
        {/* Window chrome */}
        <circle cx="58" cy="66" r="4.5" fill="#ef4444" fillOpacity="0.85" />
        <circle cx="74" cy="66" r="4.5" fill="#eab308" fillOpacity="0.9" />
        <circle cx="90" cy="66" r="4.5" fill="#22c55e" fillOpacity="0.9" />
        <rect x="112" y="60" width="96" height="12" rx="6" fill="#e8f3ee" />
        {/* Code lines */}
        <rect x="56" y="92" width="52" height="8" rx="4" fill="#305f33" fillOpacity="0.45" />
        <rect x="114" y="92" width="120" height="8" rx="4" fill="#0c0a09" fillOpacity="0.08" />
        <rect x="56" y="112" width="28" height="8" rx="4" fill="#c47a1a" fillOpacity="0.55" />
        <rect x="90" y="112" width="148" height="8" rx="4" fill="#0c0a09" fillOpacity="0.07" />
        <rect x="56" y="132" width="40" height="8" rx="4" fill="#305f33" fillOpacity="0.3" />
        <rect x="102" y="132" width="100" height="8" rx="4" fill="#0c0a09" fillOpacity="0.07" />
        <rect x="56" y="152" width="176" height="8" rx="4" fill="#0c0a09" fillOpacity="0.06" />
        <rect x="56" y="172" width="64" height="8" rx="4" fill="#305f33" fillOpacity="0.22" />
        <rect x="128" y="172" width="88" height="8" rx="4" fill="#0c0a09" fillOpacity="0.06" />
        {/* Cursor caret */}
        <rect x="56" y="192" width="2.5" height="14" rx="1" fill="#305f33" />
        {/* AI chip badge */}
        <rect x="188" y="188" width="72" height="26" rx="8" fill="#e8f3ee" stroke="#305f33" strokeOpacity="0.2" />
        <circle cx="204" cy="201" r="5" fill="#305f33" fillOpacity="0.85" />
        <path d="M202 201h4M204 199v4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <text x="214" y="205" fill="#305f33" fontSize="10" fontWeight="700" fontFamily="system-ui,sans-serif">
          AI
        </text>
        {/* Mini CTAs */}
        <rect x="56" y="226" width="78" height="18" rx="7" fill="#305f33" />
        <rect x="142" y="226" width="78" height="18" rx="7" fill="#e8f3ee" stroke="#305f33" strokeOpacity="0.25" />
      </g>

      {/* ——— Neural / AI node ——— */}
      <g filter="url(#hkSoft)">
        <circle cx="400" cy="108" r="58" fill="#e8f3ee" />
        <circle cx="400" cy="108" r="42" fill="white" stroke="#305f33" strokeOpacity="0.16" strokeWidth="1.5" />
        {/* Network nodes */}
        <circle cx="382" cy="92" r="5" fill="#305f33" fillOpacity="0.75" />
        <circle cx="418" cy="92" r="5" fill="#305f33" fillOpacity="0.55" />
        <circle cx="400" cy="118" r="6.5" fill="#305f33" />
        <circle cx="378" cy="128" r="4.5" fill="#c47a1a" fillOpacity="0.7" />
        <circle cx="422" cy="126" r="4.5" fill="#305f33" fillOpacity="0.45" />
        <path
          d="M382 92L400 118M418 92L400 118M378 128L400 118M422 126L400 118M382 92L418 92"
          stroke="#305f33"
          strokeOpacity="0.35"
          strokeWidth="1.4"
        />
        {/* Spark */}
        <path
          d="M436 72l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8z"
          fill="#c47a1a"
          fillOpacity="0.85"
        />
      </g>

      {/* ——— Pitch / Demo card ——— */}
      <g filter="url(#hkSoft)">
        <rect x="308" y="198" width="176" height="132" rx="16" fill="url(#hkHeroCard)" stroke="#305f33" strokeOpacity="0.14" strokeWidth="1.5" />
        {/* Screen */}
        <rect x="324" y="214" width="144" height="72" rx="10" fill="#e8f3ee" />
        {/* Chart bars (growth) */}
        <rect x="340" y="258" width="14" height="18" rx="3" fill="#305f33" fillOpacity="0.35" />
        <rect x="362" y="246" width="14" height="30" rx="3" fill="#305f33" fillOpacity="0.5" />
        <rect x="384" y="234" width="14" height="42" rx="3" fill="#305f33" fillOpacity="0.7" />
        <rect x="406" y="224" width="14" height="52" rx="3" fill="#305f33" />
        <rect x="428" y="240" width="14" height="36" rx="3" fill="#c47a1a" fillOpacity="0.65" />
        {/* Audience avatars */}
        <circle cx="348" cy="306" r="9" fill="#d4e8de" stroke="#305f33" strokeOpacity="0.25" />
        <circle cx="370" cy="306" r="9" fill="#e8f3ee" stroke="#305f33" strokeOpacity="0.25" />
        <circle cx="392" cy="306" r="9" fill="#d4e8de" stroke="#305f33" strokeOpacity="0.25" />
        {/* Trophy / award */}
        <path
          d="M440 296h16v4h-5v6h-6v-6h-5v-4zm2-14h12c0 6-2 10-6 12-4-2-6-6-6-12zm-3 0c0 0-4 1-4 6h4v-6zm18 0v6h4c0-5-4-6-4-6z"
          fill="#c47a1a"
          fillOpacity="0.85"
        />
        <text x="324" y="208" fill="#305f33" fontSize="9" fontWeight="700" fontFamily="system-ui,sans-serif" opacity="0.7">
          DEMO DAY
        </text>
      </g>

      {/* ——— Journey chips ——— */}
      <g>
        {[
          { x: 48, label: "AI" },
          { x: 128, label: "Build" },
          { x: 220, label: "Pitch" },
          { x: 312, label: "Scale" },
        ].map((step, i) => (
          <g key={step.label}>
            {i > 0 ? (
              <path
                d={`M${step.x - 18} 358h12`}
                stroke="#305f33"
                strokeOpacity="0.3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="2 3"
              />
            ) : null}
            <rect
              x={step.x}
              y="346"
              width={i === 3 ? 70 : 62}
              height="26"
              rx="13"
              fill={i === 0 ? "#305f33" : "white"}
              stroke="#305f33"
              strokeOpacity={i === 0 ? 0 : 0.2}
              strokeWidth="1.25"
            />
            <text
              x={step.x + (i === 3 ? 35 : 31)}
              y="363"
              textAnchor="middle"
              fill={i === 0 ? "white" : "#305f33"}
              fontSize="11"
              fontWeight="700"
              fontFamily="system-ui,sans-serif"
            >
              {step.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
