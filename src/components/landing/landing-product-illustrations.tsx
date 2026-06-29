import type { ReactNode } from "react";
import { LP } from "@/components/landing/landing-svg-palette";

type IllustrationProps = { className?: string };

function SceneFrame({
  className,
  id,
  accent,
  accentSoft,
  children,
}: IllustrationProps & {
  id: string;
  accent: string;
  accentSoft: string;
  children: ReactNode;
}) {
  return (
    <svg className={className} viewBox="0 0 320 200" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="320" y2="200">
          <stop offset="0%" stopColor={accentSoft} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <filter id={`${id}-sh`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={LP.shadow} />
        </filter>
      </defs>
      <rect width="320" height="200" rx="20" fill={`url(#${id}-bg)`} />
      <circle cx="280" cy="28" r="40" fill={accent} opacity="0.08" />
      <circle cx="36" cy="170" r="50" fill={accent} opacity="0.06" />
      {children}
    </svg>
  );
}

function AssetChip({
  x,
  y,
  label,
  color,
  soft,
  symbol,
}: {
  x: number;
  y: number;
  label: string;
  color: string;
  soft: string;
  symbol: string;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width="78" height="52" rx="14" fill="white" stroke={color} strokeWidth="2" filter="url(#lw-sh)" />
      <circle cx="22" cy="26" r="14" fill={soft} />
      <text x="22" y="30" textAnchor="middle" fill={color} fontSize="11" fontWeight="900">
        {symbol}
      </text>
      <text x="48" y="22" fill="#1F2937" fontSize="11" fontWeight="800">
        {label}
      </text>
      <text x="48" y="36" fill="#6B7280" fontSize="8" fontWeight="600">
        Balance
      </text>
    </g>
  );
}

export function IllustrationWallet({ className }: IllustrationProps) {
  return (
    <SceneFrame className={className} id="lw" accent={LP.brand} accentSoft={LP.mint}>
      <defs>
        <filter id="lw-sh" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={LP.shadow} />
        </filter>
      </defs>
      <AssetChip x={24} y={36} label="USDT" color={LP.usdt} soft={LP.usdtSoft} symbol="$" />
      <AssetChip x={118} y={72} label="Pi" color={LP.pi} soft={LP.piSoft} symbol="π" />
      <AssetChip x={212} y={36} label="Fiat" color={LP.fiat} soft={LP.fiatSoft} symbol="₣" />
      <path
        d="M48 118 Q160 148 272 118"
        stroke={LP.brand}
        strokeWidth="1.5"
        strokeDasharray="5 4"
        opacity="0.35"
      />
      <rect x="108" y="148" width="104" height="28" rx="14" fill={LP.brand} />
      <text x="160" y="166" textAnchor="middle" fill="white" fontSize="10" fontWeight="800">
        One wallet · Three rails
      </text>
    </SceneFrame>
  );
}

export function IllustrationP2P({ className }: IllustrationProps) {
  return (
    <SceneFrame className={className} id="lp2p" accent={LP.p2p} accentSoft={LP.p2pSoft}>
      <g filter="url(#lp2p-sh)">
        <circle cx="78" cy="92" r="30" fill="white" stroke={LP.p2p} strokeWidth="2" />
        <circle cx="78" cy="82" r="10" fill={LP.p2pSoft} stroke={LP.p2p} strokeWidth="1.5" />
        <path d="M58 108c6 8 32 8 40 0" stroke={LP.p2p} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="242" cy="92" r="30" fill="white" stroke={LP.mobile} strokeWidth="2" />
        <circle cx="242" cy="82" r="10" fill={LP.mobileSoft} stroke={LP.mobile} strokeWidth="1.5" />
        <path d="M222 108c6 8 32 8 40 0" stroke={LP.mobile} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="160" cy="92" r="26" fill={LP.brand} />
        <path d="M150 92l7 7 14-14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x="160" y="168" textAnchor="middle" fill={LP.p2p} fontSize="11" fontWeight="800">
        Escrow until payment confirmed
      </text>
    </SceneFrame>
  );
}

export function IllustrationTrade({ className }: IllustrationProps) {
  return (
    <SceneFrame className={className} id="ltr" accent={LP.trade} accentSoft={LP.tradeSoft}>
      <g filter="url(#ltr-sh)">
        <rect x="44" y="48" width="200" height="88" rx="14" fill="white" stroke={LP.trade} strokeWidth="1.8" />
        <rect x="58" y="98" width="10" height="24" rx="2" fill={LP.tradeUp} opacity="0.85" />
        <rect x="76" y="88" width="10" height="34" rx="2" fill={LP.trade} opacity="0.75" />
        <rect x="94" y="78" width="10" height="44" rx="2" fill={LP.tradeUp} opacity="0.85" />
        <rect x="112" y="92" width="10" height="30" rx="2" fill={LP.trade} opacity="0.75" />
        <rect x="130" y="70" width="10" height="52" rx="2" fill={LP.tradeUp} opacity="0.85" />
        <rect x="148" y="84" width="10" height="38" rx="2" fill={LP.trade} opacity="0.75" />
        <rect x="166" y="62" width="10" height="60" rx="2" fill={LP.tradeUp} opacity="0.85" />
        <path d="M58 122h152" stroke="#E5E7EB" strokeWidth="1.2" />
        <rect x="252" y="56" width="44" height="40" rx="10" fill={LP.brand} />
        <rect x="260" y="66" width="28" height="20" rx="5" fill="white" opacity="0.9" />
        <circle cx="268" cy="76" r="2" fill={LP.brand} />
        <circle cx="280" cy="76" r="2" fill={LP.brand} />
        <path d="M262 84h24" stroke={LP.brand} strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <text x="160" y="168" textAnchor="middle" fill={LP.trade} fontSize="11" fontWeight="800">
        Bots · Futures · Options
      </text>
    </SceneFrame>
  );
}

export function IllustrationEarn({ className }: IllustrationProps) {
  return (
    <SceneFrame className={className} id="learn" accent={LP.earn} accentSoft={LP.earnSoft}>
      <g filter="url(#learn-sh)">
        <path
          d="M160 44l56 28v40c0 24-22 44-56 48-34-4-56-24-56-48V72l56-28z"
          fill="white"
          stroke={LP.earn}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M136 98l16 16 32-32" stroke={LP.earn} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="88" cy="132" r="18" fill={LP.mcbSoft} stroke={LP.mcb} strokeWidth="2" />
        <text x="88" y="137" textAnchor="middle" fill={LP.mcb} fontSize="10" fontWeight="900">
          M
        </text>
        <circle cx="232" cy="132" r="18" fill={LP.usdtSoft} stroke={LP.usdt} strokeWidth="2" />
        <text x="232" y="137" textAnchor="middle" fill={LP.usdt} fontSize="10" fontWeight="900">
          $
        </text>
      </g>
      <text x="160" y="176" textAnchor="middle" fill={LP.earn} fontSize="11" fontWeight="800">
        Staking · Pool · AVEC
      </text>
    </SceneFrame>
  );
}

export function IllustrationCommunity({ className }: IllustrationProps) {
  return (
    <SceneFrame className={className} id="lcom" accent={LP.community} accentSoft={LP.communitySoft}>
      <g filter="url(#lcom-sh)">
        <rect x="48" y="52" width="118" height="56" rx="16" fill="white" stroke={LP.community} strokeWidth="2" />
        <circle cx="72" cy="72" r="10" fill={LP.communitySoft} stroke={LP.community} strokeWidth="1.5" />
        <rect x="88" y="66" width="62" height="8" rx="4" fill={LP.communitySoft} />
        <rect x="88" y="82" width="44" height="8" rx="4" fill="#F3F4F6" />
        <rect x="154" y="44" width="118" height="56" rx="16" fill="white" stroke={LP.p2p} strokeWidth="2" />
        <path d="M170 88 L186 64 L202 76 L218 58" stroke={LP.tradeUp} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="98" y="118" width="124" height="40" rx="12" fill={LP.brand} />
        <text x="160" y="143" textAnchor="middle" fill="white" fontSize="10" fontWeight="800">
          Academy · Signals · BP
        </text>
      </g>
    </SceneFrame>
  );
}
