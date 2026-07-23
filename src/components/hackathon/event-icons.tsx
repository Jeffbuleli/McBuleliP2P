import type { ReactNode } from "react";

type SvgProps = { className?: string };

function IconBase({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export type PrizeIconId = "first" | "second" | "third" | "innovation" | "impact";

export type BenefitIconId =
  | "visibility"
  | "talents"
  | "innovation"
  | "impact"
  | "network"
  | "hiring"
  | "comms"
  | "report";

export function PrizeIcon({ id, className }: { id: PrizeIconId; className?: string }) {
  switch (id) {
    case "first":
      return <GoldTrophyIcon className={className} />;
    case "second":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="10" r="5.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8.5 14 7 19l5-2L17 19l-1.5-5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        </IconBase>
      );
    case "third":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="10" r="5.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M9 14 8 18l4-1.5L16 18l-1-4" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        </IconBase>
      );
    case "innovation":
      return (
        <IconBase className={className}>
          <path d="M12 3 13.4 8.6 19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        </IconBase>
      );
    case "impact":
      return (
        <IconBase className={className}>
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        </IconBase>
      );
  }
}

/** Gold trophy for Prix ILOKWE (first prize) — metallic cup with shine sweep. */
export function GoldTrophyIcon({ className = "" }: { className?: string }) {
  const gid = "ilokwe-gold-trophy";
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={`${gid}-metal`} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF6C8" />
          <stop offset="35%" stopColor="#F5D76E" />
          <stop offset="55%" stopColor="#D4A017" />
          <stop offset="78%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#F0E68C" />
        </linearGradient>
        <linearGradient id={`${gid}-shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${gid}-clip`}>
          <path d="M7.2 3.2h9.6v7.2c0 2.7-2.15 4.9-4.8 4.9S7.2 13.1 7.2 10.4V3.2Z" />
        </clipPath>
      </defs>
      {/* Handles */}
      <path
        d="M7.2 4.6H5.4a2.2 2.2 0 0 0 0 4.4h1.2"
        stroke={`url(#${gid}-metal)`}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16.8 4.6h1.8a2.2 2.2 0 0 1 0 4.4h-1.2"
        stroke={`url(#${gid}-metal)`}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Cup */}
      <path
        d="M7.2 3.2h9.6v7.2c0 2.7-2.15 4.9-4.8 4.9S7.2 13.1 7.2 10.4V3.2Z"
        fill={`url(#${gid}-metal)`}
      />
      {/* Shine sweep */}
      <g clipPath={`url(#${gid}-clip)`}>
        <rect x="-8" y="2" width="6" height="14" fill={`url(#${gid}-shine)`} opacity="0.9">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="-2 0; 26 0; -2 0"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </rect>
      </g>
      {/* Stem + base */}
      <path d="M12 15.3v2.2" stroke={`url(#${gid}-metal)`} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M8.4 20.6h7.2c.55 0 1-.35 1-.8 0-.55-.45-.9-1-.9H8.4c-.55 0-1 .35-1 .9 0 .45.45.8 1 .8Z"
        fill={`url(#${gid}-metal)`}
      />
      <ellipse cx="12" cy="17.8" rx="2.2" ry="0.7" fill={`url(#${gid}-metal)`} opacity="0.9" />
      {/* Sparkles */}
      <circle cx="18.6" cy="4.2" r="0.7" fill="#FFF6C8">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="5.4" cy="6.4" r="0.55" fill="#FFF6C8">
        <animate attributeName="opacity" values="1;0.25;1" dur="1.9s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function BenefitIcon({ id, className }: { id: BenefitIconId; className?: string }) {
  switch (id) {
    case "visibility":
      return (
        <IconBase className={className}>
          <path d="M4 10v4h3l4 4V6L7 10H4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M16.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </IconBase>
      );
    case "talents":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </IconBase>
      );
    case "innovation":
      return (
        <IconBase className={className}>
          <path d="M9 18h6M10 18a4 4 0 0 1-.5-7.5A5 5 0 0 1 17 7a4 4 0 0 1-1 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </IconBase>
      );
    case "impact":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
          <path d="M3 12h18M12 4c2 2.5 2 13.5 0 16M12 4c-2 2.5-2 13.5 0 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </IconBase>
      );
    case "network":
      return (
        <IconBase className={className}>
          <path d="M8 11h8M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM16 18a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM8 18a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" stroke="currentColor" strokeWidth="1.75" />
          <path d="M10 13.5 14 15.5" stroke="currentColor" strokeWidth="1.75" />
        </IconBase>
      );
    case "hiring":
      return (
        <IconBase className={className}>
          <rect x="4" y="7" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.75" />
        </IconBase>
      );
    case "comms":
      return (
        <IconBase className={className}>
          <rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M10 17h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </IconBase>
      );
    case "report":
      return (
        <IconBase className={className}>
          <path d="M5 19V5h14v14H5Z" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 15V11M12 15V8M16 15v-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </IconBase>
      );
  }
}

export function CheckIcon({ className }: SvgProps) {
  return (
    <IconBase className={className}>
      <path d="M6 12.5 10 16.5 18 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function BulletIcon({ className }: SvgProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </IconBase>
  );
}
