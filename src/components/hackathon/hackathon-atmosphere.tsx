"use client";

import { useId } from "react";

/**
 * Discrete Kinshasa landmark glyphs (pixel / ticket-watermark style).
 * Drawn as integer rectangles — not photo assets.
 */
function KinshasaPixelSkyline({
  id,
  opacity = 0.07,
}: {
  id: string;
  opacity?: number;
}) {
  const fill = "#1F6B43";
  return (
    <pattern
      id={id}
      width="168"
      height="56"
      patternUnits="userSpaceOnUse"
      patternTransform="scale(1)"
    >
      <g fill={fill} opacity={opacity}>
        {/* Ground rail */}
        <rect x="0" y="52" width="168" height="2" />

        {/* Place de l’Échangeur — star monument (pixel) */}
        <rect x="6" y="28" width="2" height="24" />
        <rect x="4" y="26" width="6" height="2" />
        <rect x="5" y="22" width="4" height="4" />
        <rect x="6" y="18" width="2" height="4" />
        <rect x="3" y="24" width="2" height="2" />
        <rect x="9" y="24" width="2" height="2" />
        <rect x="2" y="28" width="2" height="2" />
        <rect x="10" y="28" width="2" height="2" />

        {/* Cathédrale — clock tower + nave */}
        <rect x="18" y="34" width="14" height="18" />
        <rect x="22" y="22" width="6" height="12" />
        <rect x="23" y="16" width="4" height="6" />
        <rect x="24" y="12" width="2" height="4" />
        <rect x="20" y="38" width="2" height="4" />
        <rect x="28" y="38" width="2" height="4" />

        {/* Palais de la Nation — pediment + columns */}
        <rect x="38" y="36" width="28" height="16" />
        <rect x="40" y="32" width="24" height="4" />
        <rect x="48" y="28" width="8" height="4" />
        <rect x="42" y="40" width="2" height="10" />
        <rect x="48" y="40" width="2" height="10" />
        <rect x="54" y="40" width="2" height="10" />
        <rect x="60" y="40" width="2" height="10" />

        {/* Tour Limete / telecom — tall mast + platforms */}
        <rect x="74" y="6" width="3" height="46" />
        <rect x="70" y="14" width="11" height="2" />
        <rect x="71" y="20" width="9" height="2" />
        <rect x="72" y="26" width="7" height="2" />
        <rect x="73" y="4" width="5" height="2" />
        <rect x="75" y="0" width="1" height="4" />

        {/* Sainte-Anne — steeple */}
        <rect x="90" y="32" width="12" height="20" />
        <rect x="94" y="18" width="4" height="14" />
        <rect x="95" y="12" width="2" height="6" />
        <rect x="92" y="36" width="2" height="3" />
        <rect x="98" y="36" width="2" height="3" />

        {/* Pont haubané — pylons + cables (pixel steps) */}
        <rect x="110" y="30" width="2" height="22" />
        <rect x="128" y="30" width="2" height="22" />
        <rect x="110" y="30" width="20" height="2" />
        <rect x="112" y="32" width="2" height="2" />
        <rect x="116" y="34" width="2" height="2" />
        <rect x="120" y="36" width="2" height="2" />
        <rect x="124" y="34" width="2" height="2" />
        <rect x="126" y="32" width="2" height="2" />
        <rect x="108" y="48" width="24" height="2" />

        {/* Gombe tower — vertical facade pixels */}
        <rect x="140" y="20" width="12" height="32" />
        <rect x="142" y="24" width="1" height="24" />
        <rect x="145" y="24" width="1" height="24" />
        <rect x="148" y="24" width="1" height="24" />
        <rect x="141" y="18" width="10" height="2" />

        {/* Small classical building */}
        <rect x="156" y="40" width="10" height="12" />
        <rect x="158" y="36" width="6" height="4" />
        <rect x="159" y="34" width="4" height="2" />
      </g>
    </pattern>
  );
}

/** Soft mint wash + dots + Kinshasa pixel skyline watermark (badges / tickets / Live). */
export function HackathonAtmosphere({
  className = "",
  decorated = false,
  /** `card` = badge/ticket size. `page` = fixed small tiles (never stretched). */
  variant = "card",
}: {
  className?: string;
  /** Extra skyline accents (badges & tickets). */
  decorated?: boolean;
  variant?: "card" | "page";
}) {
  const uid = useId().replace(/:/g, "");
  const wash = `hk-wash-${uid}`;
  const dots = `hk-dots-${uid}`;
  const hex = `hk-hex-${uid}`;
  const kin = `hk-kin-${uid}`;

  // Full-page: tile at fixed px so motifs stay badge-small and discreet.
  if (variant === "page") {
    return (
      <div
        className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "radial-gradient(circle, var(--hk-dot, rgba(31,107,67,0.07)) 1.35px, transparent 1.6px)",
              "linear-gradient(135deg, var(--hk-wash, rgba(234,246,238,0.18)) 0%, transparent 40%, rgba(238,242,255,0.06) 100%)",
            ].join(", "),
            backgroundSize: "18px 18px, 100% 100%",
            backgroundRepeat: "repeat, no-repeat",
          }}
        />
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <KinshasaPixelSkyline id={kin} opacity={0.055} />
          </defs>
          {/* Tiled watermark — discrete like security paper */}
          <rect width="100%" height="100%" fill={`url(#${kin})`} />
          {/* Bottom band slightly stronger (stage / ticket footer feel) */}
          <rect
            x="0"
            y="78%"
            width="100%"
            height="22%"
            fill={`url(#${kin})`}
            opacity="1.35"
          />
        </svg>
      </div>
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
        <KinshasaPixelSkyline id={kin} opacity={0.08} />
      </defs>
      <rect width="400" height="680" fill={`url(#${wash})`} />
      <rect width="400" height="680" fill={`url(#${dots})`} />
      <rect width="400" height="680" fill={`url(#${hex})`} />
      <rect width="400" height="680" fill={`url(#${kin})`} />
      {decorated ? (
        <>
          {/* Stronger skyline band — ticket / badge watermark */}
          <rect y="100" width="400" height="72" fill={`url(#${kin})`} opacity="1.5" />
          <rect y="560" width="400" height="80" fill={`url(#${kin})`} opacity="1.25" />
          <circle cx="348" cy="220" r="64" stroke="#1F6B43" strokeOpacity="0.06" />
          <circle cx="52" cy="420" r="46" stroke="#1F6B43" strokeOpacity="0.08" />
        </>
      ) : null}
    </svg>
  );
}
