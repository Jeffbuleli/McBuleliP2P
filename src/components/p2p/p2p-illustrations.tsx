"use client";

import { useId, type ReactNode } from "react";

/** Futuristic HUD palette for P2P rule / procedure SVGs. */
const HUD = {
  panel: "#050810",
  grid: "rgba(34,211,238,0.07)",
  cyan: "#22D3EE",
  emerald: "#34D399",
  amber: "#FBBF24",
  red: "#F87171",
  violet: "#C084FC",
  white: "#F1F5F9",
  muted: "#64748B",
} as const;

type Accent = keyof typeof ACCENT;
const ACCENT = {
  cyan: HUD.cyan,
  emerald: HUD.emerald,
  amber: HUD.amber,
  red: HUD.red,
  violet: HUD.violet,
} as const;

type IllusProps = { className?: string };

type IllusCtx = { glow: string; accent: string; uid: string };

function P2pHudSvg({
  className = "h-12 w-12",
  accent = "cyan",
  children,
}: {
  className?: string;
  accent?: Accent;
  children: (ctx: IllusCtx) => ReactNode;
}) {
  const uid = useId().replace(/:/g, "");
  const glow = `p2pg-${uid}`;
  const grad = `p2pgr-${uid}`;
  const color = ACCENT[accent];

  return (
    <svg className={`p2p-hud-illus ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={grad} x1="4" y1="4" x2="60" y2="60">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={HUD.panel} stopOpacity="0.04" />
        </linearGradient>
        <radialGradient id={`p2prg-${uid}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={HUD.panel} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="1.5" y="1.5" width="61" height="61" rx="9" fill={`url(#${grad})`} />
      <rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="9"
        stroke={color}
        strokeOpacity="0.2"
        strokeWidth="0.75"
      />
      <path d="M1.5 32h61M32 1.5v61" stroke={HUD.grid} strokeWidth="0.45" />
      <circle cx="32" cy="32" r="18" fill={`url(#p2prg-${uid})`} />

      <path d="M5 13V5h8" stroke={color} strokeWidth="1.15" strokeOpacity="0.9" />
      <path d="M51 5h8v8" stroke={color} strokeWidth="1.15" strokeOpacity="0.9" />
      <path d="M59 51v8h-8" stroke={color} strokeWidth="1.15" strokeOpacity="0.9" />
      <path d="M13 59H5v-8" stroke={color} strokeWidth="1.15" strokeOpacity="0.9" />

      {children({ glow, accent: color, uid })}
    </svg>
  );
}

export function P2pIllusEscrow({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="emerald">
      {({ glow, accent }) => (
        <>
          <rect
            x="18"
            y="28"
            width="28"
            height="22"
            rx="4"
            stroke={accent}
            strokeWidth="1.5"
            fill={HUD.panel}
            fillOpacity="0.55"
            filter={`url(#${glow})`}
          />
          <path
            d="M32 22v10m-5-5h10"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
            filter={`url(#${glow})`}
          />
          <path
            d="M28 22a4 4 0 018 0v2h-8v-2z"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill={HUD.panel}
            fillOpacity="0.7"
          />
          <circle cx="46" cy="18" r="7" fill={HUD.panel} stroke={HUD.amber} strokeWidth="1.25" />
          <text x="46" y="21" textAnchor="middle" fontSize="7" fontWeight="800" fill={HUD.amber}>
            $
          </text>
          <path
            d="M22 38h20"
            stroke={accent}
            strokeWidth="1"
            strokeOpacity="0.45"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusPayFiat({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="cyan">
      {({ glow, accent }) => (
        <>
          <rect
            x="22"
            y="12"
            width="20"
            height="36"
            rx="5"
            stroke={accent}
            strokeWidth="1.5"
            fill={HUD.panel}
            fillOpacity="0.6"
            filter={`url(#${glow})`}
          />
          <rect x="26" y="17" width="12" height="2" rx="1" fill={accent} fillOpacity="0.5" />
          <rect x="26" y="22" width="12" height="14" rx="2.5" fill={accent} fillOpacity="0.12" />
          <path d="M28 28h8M28 32h5" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="32" cy="42" r="5" fill={HUD.emerald} fillOpacity="0.2" stroke={HUD.emerald} strokeWidth="1.25" />
          <path
            d="M29.5 42l2 2 3.5-4"
            stroke={HUD.emerald}
            strokeWidth="1.5"
            strokeLinecap="round"
            filter={`url(#${glow})`}
          />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusVerify({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="amber">
      {({ glow, accent }) => (
        <>
          <rect
            x="12"
            y="20"
            width="26"
            height="18"
            rx="3"
            stroke={accent}
            strokeWidth="1.5"
            fill={HUD.panel}
            fillOpacity="0.55"
          />
          <path d="M16 26h18M16 30h12" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
          <circle
            cx="46"
            cy="36"
            r="11"
            stroke={accent}
            strokeWidth="1.5"
            fill={HUD.panel}
            fillOpacity="0.65"
            filter={`url(#${glow})`}
          />
          <circle cx="46" cy="36" r="7" stroke={accent} strokeWidth="1" strokeOpacity="0.45" />
          <path d="M42 36l3 3 6-7" stroke={HUD.emerald} strokeWidth="2" strokeLinecap="round" filter={`url(#${glow})`} />
          <path d="M40 30h12" stroke={accent} strokeWidth="0.75" strokeOpacity="0.35" strokeDasharray="1.5 2" />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusDispute({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="violet">
      {({ glow, accent }) => (
        <>
          <path
            d="M32 12l18 8v12c0 10-7.5 15.5-18 18-10.5-2.5-18-8-18-18V20L32 12z"
            stroke={accent}
            strokeWidth="1.5"
            fill={HUD.panel}
            fillOpacity="0.55"
            filter={`url(#${glow})`}
          />
          <path d="M26 30h12M26 35h8" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.75" />
          <circle cx="46" cy="44" r="8" fill={HUD.panel} stroke={HUD.cyan} strokeWidth="1.25" />
          <path d="M46 40v6m0 2h.01" stroke={HUD.cyan} strokeWidth="1.75" strokeLinecap="round" filter={`url(#${glow})`} />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusOffPlatform({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="red">
      {({ glow, accent }) => (
        <>
          <rect
            x="10"
            y="22"
            width="24"
            height="22"
            rx="4"
            stroke={HUD.emerald}
            strokeWidth="1.25"
            fill={HUD.panel}
            fillOpacity="0.5"
            strokeOpacity="0.55"
          />
          <path d="M14 30h16M14 34h10" stroke={HUD.emerald} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" />
          <circle cx="46" cy="34" r="12" fill={HUD.panel} fillOpacity="0.7" stroke={accent} strokeWidth="1.5" />
          <path
            d="M40 28l12 12M52 28L40 40"
            stroke={accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            filter={`url(#${glow})`}
          />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusBuy({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="emerald">
      {({ glow, accent }) => (
        <>
          <circle cx="24" cy="26" r="8" fill={HUD.panel} stroke={HUD.amber} strokeWidth="1.25" />
          <text x="24" y="29" textAnchor="middle" fontSize="7" fontWeight="800" fill={HUD.amber}>
            $
          </text>
          <path
            d="M36 38l8-14h-5l3-6"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glow})`}
          />
          <path d="M32 46V34" stroke={accent} strokeWidth="1.75" strokeLinecap="round" />
          <path d="M27 41l5 5 5-5" stroke={accent} strokeWidth="1.75" strokeLinecap="round" filter={`url(#${glow})`} />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusSell({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="amber">
      {({ glow, accent }) => (
        <>
          <circle cx="24" cy="38" r="8" fill={HUD.panel} stroke={HUD.amber} strokeWidth="1.25" />
          <text x="24" y="41" textAnchor="middle" fontSize="7" fontWeight="800" fill={HUD.amber}>
            $
          </text>
          <path
            d="M38 26l8 14h-5l3 6"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glow})`}
          />
          <path d="M32 18v12" stroke={accent} strokeWidth="1.75" strokeLinecap="round" />
          <path d="M27 23l5-5 5 5" stroke={accent} strokeWidth="1.75" strokeLinecap="round" filter={`url(#${glow})`} />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusKyc({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="cyan">
      {({ glow, accent }) => (
        <>
          <rect
            x="16"
            y="14"
            width="28"
            height="34"
            rx="3"
            stroke={accent}
            strokeWidth="1.5"
            fill={HUD.panel}
            fillOpacity="0.55"
            filter={`url(#${glow})`}
          />
          <circle cx="30" cy="26" r="6" stroke={accent} strokeWidth="1.25" />
          <path d="M22 40c1.5-5 4.5-7 8-7s6.5 2 8 7" stroke={accent} strokeWidth="1.25" strokeLinecap="round" />
          <circle cx="46" cy="46" r="7" fill={HUD.panel} stroke={HUD.emerald} strokeWidth="1.25" />
          <path d="M43 46l2 2 4-4.5" stroke={HUD.emerald} strokeWidth="1.5" strokeLinecap="round" filter={`url(#${glow})`} />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusFakeReceipt({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="amber">
      {({ glow, accent }) => (
        <>
          <rect
            x="18"
            y="12"
            width="24"
            height="36"
            rx="3"
            stroke={accent}
            strokeWidth="1.5"
            fill={HUD.panel}
            fillOpacity="0.55"
          />
          <path d="M22 20h16M22 26h12M22 32h16" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
          <path
            d="M38 40l10 10M48 40L38 50"
            stroke={HUD.red}
            strokeWidth="2.5"
            strokeLinecap="round"
            filter={`url(#${glow})`}
          />
          <rect x="40" y="14" width="10" height="5" rx="1" fill={HUD.red} fillOpacity="0.25" stroke={HUD.red} strokeWidth="0.75" />
          <text x="45" y="18" textAnchor="middle" fontSize="4" fontWeight="800" fill={HUD.red}>
            FAKE
          </text>
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusPostCancel({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="red">
      {({ glow, accent }) => (
        <>
          <circle cx="30" cy="30" r="14" stroke={accent} strokeWidth="1.5" fill={HUD.panel} fillOpacity="0.6" filter={`url(#${glow})`} />
          <path d="M22 30h16M30 22v16" stroke={accent} strokeWidth="2.25" strokeLinecap="round" />
          <rect
            x="38"
            y="38"
            width="14"
            height="10"
            rx="2"
            stroke={HUD.muted}
            strokeWidth="1"
            fill={HUD.panel}
            fillOpacity="0.5"
            strokeDasharray="2 2"
          />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusTriangle({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="amber">
      {({ glow, accent }) => (
        <>
          <path
            d="M32 14L50 46H14L32 14z"
            stroke={accent}
            strokeWidth="1.5"
            fill={HUD.panel}
            fillOpacity="0.5"
            strokeLinejoin="round"
            filter={`url(#${glow})`}
          />
          <circle cx="24" cy="40" r="4" fill={accent} fillOpacity="0.35" stroke={accent} strokeWidth="1" />
          <circle cx="40" cy="40" r="4" fill={accent} fillOpacity="0.35" stroke={accent} strokeWidth="1" />
          <path d="M28 38h8" stroke={HUD.red} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M32 22v8m0 0h.01" stroke={accent} strokeWidth="1.75" strokeLinecap="round" />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusChargeback({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="cyan">
      {({ glow, accent }) => (
        <>
          <rect
            x="12"
            y="24"
            width="34"
            height="20"
            rx="3"
            stroke={accent}
            strokeWidth="1.5"
            fill={HUD.panel}
            fillOpacity="0.55"
          />
          <path d="M18 32h10M18 36h7" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
          <path
            d="M42 30l-5 5 5 5"
            stroke={HUD.red}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glow})`}
          />
          <circle cx="48" cy="16" r="7" fill={HUD.panel} stroke={HUD.red} strokeWidth="1.25" />
          <path d="M48 12v8M44 16h8" stroke={HUD.red} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusImpersonate({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="violet">
      {({ glow, accent }) => (
        <>
          <circle cx="26" cy="24" r="8" stroke={accent} strokeWidth="1.5" fill={HUD.panel} fillOpacity="0.5" />
          <path d="M14 44c2-7 6-10 12-10s10 3 12 10" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
          <rect
            x="36"
            y="32"
            width="18"
            height="12"
            rx="2.5"
            stroke={HUD.cyan}
            strokeWidth="1.25"
            fill={HUD.panel}
            fillOpacity="0.55"
          />
          <path d="M40 38h10M40 41h7" stroke={HUD.cyan} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.7" />
          <path d="M52 28l4 4-4 4" stroke={HUD.red} strokeWidth="1.75" strokeLinecap="round" filter={`url(#${glow})`} />
        </>
      )}
    </P2pHudSvg>
  );
}

export function P2pIllusReport({ className = "h-12 w-12" }: IllusProps) {
  return (
    <P2pHudSvg className={className} accent="red">
      {({ glow, accent }) => (
        <>
          <path
            d="M32 12l18 8v12c0 10-7.5 15.5-18 18-10.5-2.5-18-8-18-18V20L32 12z"
            stroke={accent}
            strokeWidth="1.5"
            fill={HUD.panel}
            fillOpacity="0.55"
            filter={`url(#${glow})`}
          />
          <path d="M32 26v8m0 4h.01" stroke={HUD.white} strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="22" r="2" fill={accent} className="p2p-hud-illus-pulse" />
        </>
      )}
    </P2pHudSvg>
  );
}
