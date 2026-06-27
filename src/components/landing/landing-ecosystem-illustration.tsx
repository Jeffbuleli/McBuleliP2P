/** Hero ecosystem map — wallet hub with colored product spokes. */

import type { ReactNode } from "react";
import { LP } from "@/components/landing/landing-svg-palette";

function Node({
  cx,
  cy,
  r,
  glow,
  stroke,
  children,
  label,
  labelY,
}: {
  cx: number;
  cy: number;
  r: number;
  glow: string;
  stroke: string;
  children: ReactNode;
  label: string;
  labelY?: number;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 6} fill={glow} opacity="0.55" />
      <circle cx={cx} cy={cy} r={r} fill="white" stroke={stroke} strokeWidth="2.2" />
      <g transform={`translate(${cx}, ${cy})`}>{children}</g>
      <text
        x={cx}
        y={labelY ?? cy + r + 18}
        textAnchor="middle"
        fill={stroke}
        fontSize="10.5"
        fontWeight="800"
      >
        {label}
      </text>
    </g>
  );
}

export function LandingEcosystemIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id="leco-bg" x1="0" y1="0" x2="420" y2="340">
          <stop offset="0%" stopColor={LP.mint} />
          <stop offset="55%" stopColor="#F8FBF8" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <radialGradient id="leco-hub" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={LP.brandLight} stopOpacity="0.25" />
          <stop offset="100%" stopColor={LP.brand} stopOpacity="0" />
        </radialGradient>
        <filter id="leco-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor={LP.shadow} />
        </filter>
      </defs>

      <rect width="420" height="340" rx="28" fill="url(#leco-bg)" />
      <circle cx="210" cy="168" r="88" fill="url(#leco-hub)" />

      <g strokeWidth="2" strokeLinecap="round" opacity="0.45">
        <path d="M210 168 L88 78" stroke={LP.p2p} strokeDasharray="7 5" className="landing-eco-line" />
        <path d="M210 168 L332 78" stroke={LP.trade} strokeDasharray="7 5" className="landing-eco-line" />
        <path d="M210 168 L72 212" stroke={LP.mobile} strokeDasharray="7 5" className="landing-eco-line" />
        <path d="M210 168 L348 212" stroke={LP.mcb} strokeDasharray="7 5" className="landing-eco-line" />
        <path d="M210 168 L210 288" stroke={LP.avec} strokeDasharray="7 5" className="landing-eco-line" />
      </g>

      <g filter="url(#leco-shadow)">
        <circle cx="210" cy="168" r="50" fill="white" stroke={LP.brand} strokeWidth="2.8" />
        <rect x="186" y="148" width="48" height="36" rx="8" fill={LP.mint} stroke={LP.brand} strokeWidth="2" />
        <circle cx="222" cy="166" r="7" fill={LP.brand} />
        <rect x="174" y="198" width="28" height="14" rx="7" fill={LP.usdtSoft} stroke={LP.usdt} strokeWidth="1.2" />
        <text x="188" y="208" textAnchor="middle" fill={LP.usdt} fontSize="7" fontWeight="800">
          USDT
        </text>
        <rect x="206" y="198" width="22" height="14" rx="7" fill={LP.piSoft} stroke={LP.pi} strokeWidth="1.2" />
        <text x="217" y="208" textAnchor="middle" fill={LP.pi} fontSize="7" fontWeight="800">
          Pi
        </text>
        <rect x="232" y="198" width="26" height="14" rx="7" fill={LP.fiatSoft} stroke={LP.fiat} strokeWidth="1.2" />
        <text x="245" y="208" textAnchor="middle" fill={LP.fiat} fontSize="7" fontWeight="800">
          Fiat
        </text>
        <text x="210" y="238" textAnchor="middle" fill={LP.brand} fontSize="11" fontWeight="900">
          Wallet
        </text>
      </g>

      <Node cx={88} cy={78} r={36} glow={LP.p2pSoft} stroke={LP.p2p} label="P2P">
        <rect x="-18" y="-14" width="36" height="28" rx="6" stroke={LP.p2p} strokeWidth="1.8" />
        <path d="M-10 -4h20M-10 4h14" stroke={LP.p2p} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="0" r="5" fill={LP.p2pSoft} stroke={LP.p2p} strokeWidth="1.2" />
      </Node>

      <Node cx={332} cy={78} r={36} glow={LP.tradeSoft} stroke={LP.trade} label="Trade">
        <path d="M-16 8 L-4 -8 L4 0 L16 -12" stroke={LP.tradeUp} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-18 10h36" stroke={LP.trade} strokeWidth="1.4" opacity="0.35" />
        <rect x="6" y="-14" width="14" height="10" rx="3" fill={LP.tradeSoft} stroke={LP.trade} strokeWidth="1.2" />
      </Node>

      <Node cx={72} cy={212} r={34} glow={LP.mobileSoft} stroke={LP.mobile} label="Mobile $" labelY={252}>
        <rect x="-12" y="-18" width="24" height="36" rx="5" stroke={LP.mobile} strokeWidth="1.8" />
        <path d="M-6 12h12" stroke={LP.mobile} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="0" cy="-6" r="3" fill={LP.mobile} opacity="0.5" />
      </Node>

      <Node cx={348} cy={212} r={34} glow={LP.mcbSoft} stroke={LP.mcb} label="McB" labelY={252}>
        <circle r="14" stroke={LP.mcb} strokeWidth="2" />
        <text y="5" textAnchor="middle" fill={LP.mcb} fontSize="11" fontWeight="900">
          M
        </text>
      </Node>

      <Node cx={210} cy={288} r={30} glow={LP.mintDeep} stroke={LP.avec} label="AVEC" labelY={326}>
        <circle cx="-10" cy="-6" r="5" stroke={LP.avec} strokeWidth="1.5" />
        <circle cx="10" cy="-6" r="5" stroke={LP.avec} strokeWidth="1.5" />
        <path d="M-16 8c5 5 27 5 32 0" stroke={LP.avec} strokeWidth="1.6" strokeLinecap="round" />
      </Node>
    </svg>
  );
}
