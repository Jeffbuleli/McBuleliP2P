"use client";

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 24, className = "", ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    className,
    "aria-hidden": true as const,
    ...rest,
  };
}

/** Village circle — members around shared pot */
export function AvecHeroIllustration({ className }: { className?: string }) {
  const s = base({ size: 56, className });
  return (
    <svg {...s}>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <circle cx="24" cy="26" r="10" fill="currentColor" opacity="0.12" />
      <path
        d="M24 14v4M24 30v4M14 24h4M30 24h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle cx="24" cy="14" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="14" cy="28" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="34" cy="28" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="24" cy="34" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M20 26h8l-1 6h-6l-1-6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M22 24h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AvecIconShares({ className }: { className?: string }) {
  const s = base({ size: 20, className });
  return (
    <svg {...s}>
      <rect x="8" y="12" width="8" height="24" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <rect x="20" y="18" width="8" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <rect x="32" y="8" width="8" height="28" rx="2" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function AvecIconCycle({ className }: { className?: string }) {
  const s = base({ size: 20, className });
  return (
    <svg {...s}>
      <path
        d="M24 8a16 16 0 1012.2 6.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M36 6v8h-8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AvecIconMembers({ className }: { className?: string }) {
  const s = base({ size: 20, className });
  return (
    <svg {...s}>
      <circle cx="18" cy="16" r="4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="30" cy="16" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M10 32c0-4 4-7 8-7s8 3 8 7M22 32c0-3 3-5 6-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Loan / credit — hand + coin */
export function AvecIconLoan({ className }: { className?: string }) {
  const s = base({ size: 20, className });
  return (
    <svg {...s}>
      <circle cx="30" cy="14" r="6" stroke="currentColor" strokeWidth="1.75" />
      <path d="M30 11v6M27 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M10 22c0-6 4-10 10-10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M8 28h16l-2 8H10l-2-8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AvecIconTreasury({ className }: { className?: string }) {
  const s = base({ size: 20, className });
  return (
    <svg {...s}>
      <path
        d="M8 18h32v14a4 4 0 01-4 4H12a4 4 0 01-4-4V18z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 18V14a10 10 0 0120 0v4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="24" cy="26" r="3" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

export function AvecIconView({ className }: { className?: string }) {
  const s = base({ size: 20, className });
  return (
    <svg {...s}>
      <rect x="6" y="22" width="6" height="14" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="14" y="14" width="6" height="22" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="22" y="8" width="6" height="28" rx="1" fill="currentColor" />
      <path d="M8 10h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function AvecIconDialogue({ className }: { className?: string }) {
  const s = base({ size: 20, className });
  return (
    <svg {...s}>
      <path
        d="M8 10h24v14a3 3 0 01-3 3H14l-6 4v-4H11a3 3 0 01-3-3V10z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 16h12M14 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AvecIconReport({ className }: { className?: string }) {
  const s = base({ size: 20, className });
  return (
    <svg {...s}>
      <rect x="10" y="6" width="20" height="28" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M14 14h12M14 20h12M14 26h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Hands / community — solidarity (Africa & RDC context) */
export function AvecIconSolidarity({ className }: { className?: string }) {
  const s = base({ size: 20, className });
  return (
    <svg {...s}>
      <path
        d="M14 20c-2-3-1-7 3-9 2 4 5 5 7 5s5-1 7-5c4 2 5 6 3 9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 28h24"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx="24" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 32l4-6M40 32l-4-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function AvecListMark({ className }: { className?: string }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ${className ?? ""}`}
    >
      <AvecHeroIllustration className="h-6 w-6" />
    </span>
  );
}
