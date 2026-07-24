"use client";

import { useId } from "react";

/** Soft mint wash + dots + hex — same language as badges / tickets. */
export function HackathonAtmosphere({
  className = "",
  decorated = false,
  /** `card` = badge/ticket size. `page` = fixed small tiles (never stretched). */
  variant = "card",
}: {
  className?: string;
  /** Extra skyline / circle accents (badges & tickets). */
  decorated?: boolean;
  variant?: "card" | "page";
}) {
  const uid = useId().replace(/:/g, "");
  const wash = `hk-wash-${uid}`;
  const dots = `hk-dots-${uid}`;
  const hex = `hk-hex-${uid}`;

  // Full-page: tile at fixed px so motifs stay badge-small and discreet.
  // Stays strictly behind content (z-0); cards/titles must be opaque above.
  if (variant === "page") {
    return (
      <div
        className={`pointer-events-none absolute inset-0 z-0 ${className}`}
        aria-hidden
        style={{
          backgroundImage: [
            "radial-gradient(circle, rgba(31,107,67,0.07) 1.35px, transparent 1.6px)",
            "linear-gradient(135deg, rgba(234,246,238,0.18) 0%, transparent 40%, rgba(238,242,255,0.06) 100%)",
          ].join(", "),
          backgroundSize: "18px 18px, 100% 100%",
          backgroundRepeat: "repeat, no-repeat",
        }}
      />
    );
  }

  return (
    <svg
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${className}`}
      viewBox="0 0 400 680"
      fill="none"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={dots} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="0.9" fill="#1F6B43" opacity="0.07" />
        </pattern>
        <linearGradient id={wash} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EAF6EE" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#FAFAF8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0.28" />
        </linearGradient>
        <pattern id={hex} width="28" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M14 2l10 6v8l-10 6L4 16V8z"
            stroke="#1F6B43"
            strokeOpacity="0.05"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="400" height="680" fill={`url(#${wash})`} />
      <rect width="400" height="680" fill={`url(#${dots})`} />
      <rect width="400" height="680" fill={`url(#${hex})`} />
      {decorated ? (
        <>
          <g opacity="0.1" stroke="#1F6B43" strokeWidth="1">
            <path d="M42 108l16-9 16 9v18l-16 9-16-9z" />
            <path d="M58 99v18M42 108l16 9 16-9" />
            <path d="M328 86l12-7 12 7v14l-12 7-12-7z" />
            <path d="M340 79v14M328 86l12 7 12-7" />
          </g>
          <g fill="#1F6B43" opacity="0.05">
            <path d="M0 150h36v-24h16v24h20v-36h14v10h12v-18h18v46h26v-30h16v-14h12v44h22v-22h18v22h36v-40h14v18h20v-26h16v48h32v-34h18v34h44v-20h14v20H400v20H0z" />
            <rect x="186" y="88" width="7" height="62" rx="1" />
            <path d="M176 88h27l-5-16h-17z" />
          </g>
          <circle cx="348" cy="220" r="64" stroke="#6D28D9" strokeOpacity="0.07" />
          <circle cx="52" cy="380" r="46" stroke="#1F6B43" strokeOpacity="0.09" />
        </>
      ) : null}
    </svg>
  );
}
