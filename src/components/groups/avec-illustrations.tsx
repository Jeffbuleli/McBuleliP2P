"use client";

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { className?: string };

function s(className?: string, w = 120, h = 80): P {
  return {
    width: w,
    height: h,
    viewBox: `0 0 ${w} ${h}`,
    fill: "none",
    className,
    "aria-hidden": true,
  };
}

/** Stacked vault + geometric coins */
export function IlluTreasury({ className }: { className?: string }) {
  return (
    <svg {...s(className, 100, 72)}>
      <rect x="28" y="38" width="44" height="28" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path d="M24 38h52l-6-14H30l-6 14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="38" cy="22" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="62" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <rect x="34" y="48" width="32" height="4" rx="1" fill="currentColor" opacity="0.25" />
      <rect x="34" y="56" width="24" height="4" rx="1" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

/** Hexagon vote - collective decision */
export function IlluCollectiveVote({ className }: { className?: string }) {
  return (
    <svg {...s(className, 100, 72)}>
      <polygon
        points="50,8 82,26 82,54 50,72 18,54 18,26"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.4"
      />
      <circle cx="50" cy="36" r="14" stroke="currentColor" strokeWidth="2" />
      <path d="M44 36l4 4 8-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22" cy="20" r="3" fill="currentColor" opacity="0.35" />
      <circle cx="78" cy="20" r="3" fill="currentColor" opacity="0.35" />
      <circle cx="22" cy="58" r="3" fill="currentColor" opacity="0.35" />
      <circle cx="78" cy="58" r="3" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

/** Meeting - ascending bars + rhythm line */
export function IlluMeeting({ className }: { className?: string }) {
  return (
    <svg {...s(className, 100, 72)}>
      <rect x="14" y="44" width="12" height="24" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="30" y="32" width="12" height="36" rx="2" fill="currentColor" opacity="0.35" />
      <rect x="46" y="24" width="12" height="44" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="62" y="36" width="12" height="32" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="78" y="40" width="12" height="28" rx="2" fill="currentColor" opacity="0.25" />
      <path
        d="M10 20 Q35 8 50 18 T90 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

/** Members - ring of nodes */
export function IlluMembersRing({ className }: { className?: string }) {
  return (
    <svg {...s(className, 100, 72)}>
      <circle cx="50" cy="36" r="26" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeDasharray="4 4" />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 50 + 22 * Math.cos(rad);
        const cy = 36 + 22 * Math.sin(rad);
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={i === 0 ? 6 : 5}
            stroke="currentColor"
            strokeWidth="1.75"
            fill={i === 0 ? "currentColor" : "none"}
            opacity={i === 0 ? 0.5 : 0.35}
          />
        );
      })}
      <circle cx="50" cy="36" r="8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** Activity - flowing ledger blocks */
export function IlluActivityFlow({ className }: { className?: string }) {
  return (
    <svg {...s(className, 100, 72)}>
      <rect x="8" y="28" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <rect x="36" y="20" width="20" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <rect x="64" y="32" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <path
        d="M28 36h8M56 32h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <circle cx="50" cy="12" r="4" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

/** Reports - document + mini chart */
export function IlluReports({ className }: { className?: string }) {
  return (
    <svg {...s(className, 100, 72)}>
      <rect x="22" y="10" width="40" height="52" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path d="M30 22h24M30 32h18M30 42h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <rect x="68" y="36" width="8" height="20" rx="1" fill="currentColor" opacity="0.25" />
      <rect x="78" y="28" width="8" height="28" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="88" y="44" width="8" height="12" rx="1" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

/** Loans - arc + balance scale geometry */
export function IlluLoans({ className }: { className?: string }) {
  return (
    <svg {...s(className, 100, 72)}>
      <path d="M50 12v44" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path d="M30 28h40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <path d="M34 28v8M66 28v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="34" cy="40" r="10" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="66" cy="44" r="10" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
