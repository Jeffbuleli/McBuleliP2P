type Props = { className?: string };

const green = "#305f33";
const mint = "#e8f3ee";
const gold = "#b8860b";
const muted = "#a8a29e";

/** Trophy + ascending chart — Top Trader program hero. */
export function TopTraderHeroIllustration({ className = "h-20 w-20" }: Props) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden>
      <rect x="8" y="52" width="10" height="16" rx="2" fill={mint} stroke={green} strokeWidth="1.2" />
      <rect x="24" y="40" width="10" height="28" rx="2" fill={mint} stroke={green} strokeWidth="1.2" />
      <rect x="40" y="28" width="10" height="40" rx="2" fill={green} stroke={green} strokeWidth="1.2" opacity="0.85" />
      <path
        d="M14 48 L30 36 L46 24"
        stroke={green}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <path
        d="M54 18h8v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10v-6z"
        fill={gold}
        stroke={gold}
        strokeWidth="1"
        opacity="0.9"
      />
      <path d="M50 18h16v3H50z" fill={gold} opacity="0.7" />
      <rect x="56" y="34" width="4" height="6" rx="1" fill={gold} opacity="0.8" />
      <rect x="52" y="40" width="12" height="3" rx="1" fill={gold} opacity="0.6" />
      <circle cx="58" cy="14" r="3" fill={mint} stroke={green} strokeWidth="1" />
    </svg>
  );
}

/** Compact rule icons row. */
export function TopTraderRuleIcons({ className = "h-8 w-8" }: Props) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="14" stroke={muted} strokeWidth="1.5" />
      <text x="16" y="20" textAnchor="middle" fontSize="9" fontWeight="700" fill={green}>
        10K
      </text>
    </svg>
  );
}

export function TopTraderCandleIllustration({ className = "h-6 w-6", up = true }: Props & { up?: boolean }) {
  const color = up ? green : "#b45309";
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <rect x="8" y="8" width="8" height="10" rx="1.5" fill={color} opacity="0.85" />
    </svg>
  );
}

export function TopTraderMedalSvg({
  rank,
  className = "h-9 w-9",
}: Props & { rank: number }) {
  const palette =
    rank === 1
      ? { fill: "#fef3c7", stroke: "#b8860b", text: "#92400e" }
      : rank === 2
        ? { fill: "#f5f5f4", stroke: "#a8a29e", text: "#57534e" }
        : rank === 3
          ? { fill: "#ffedd5", stroke: "#c2410c", text: "#9a3412" }
          : { fill: mint, stroke: green, text: green };

  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" aria-hidden>
      <circle cx="18" cy="18" r="16" fill={palette.fill} stroke={palette.stroke} strokeWidth="1.5" />
      <text
        x="18"
        y="22"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill={palette.text}
      >
        {rank}
      </text>
    </svg>
  );
}

export function TopTraderEmptyIllustration({ className = "h-24 w-24" }: Props) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <rect x="20" y="44" width="56" height="32" rx="6" stroke={muted} strokeWidth="2" />
      <path d="M32 60h32M32 52h20" stroke={green} strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <path
        d="M48 12v20M40 20h16"
        stroke={green}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="48" cy="36" r="10" fill={mint} stroke={green} strokeWidth="1.5" />
      <path d="M44 36h8M48 32v8" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
