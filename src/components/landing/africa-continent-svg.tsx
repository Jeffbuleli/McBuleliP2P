import Image from "next/image";
import { LP } from "@/components/landing/landing-svg-palette";

/** Stylized Africa continent - multi-tone regions (not a single blob). */
export function AfricaContinentSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="africa-ocean" x1="0" y1="0" x2="240" y2="260">
          <stop offset="0%" stopColor={LP.mobileSoft} />
          <stop offset="100%" stopColor={LP.mint} />
        </linearGradient>
        <filter id="africa-sh" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor={LP.shadow} />
        </filter>
      </defs>

      <rect width="240" height="260" rx="20" fill="url(#africa-ocean)" />

      {/* North / Maghreb */}
      <path
        d="M118 28 L152 32 L168 48 L162 68 L140 72 L118 64 L98 52 L102 34 Z"
        fill="#A7D7AB"
        stroke={LP.brand}
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#africa-sh)"
      />
      {/* West Africa */}
      <path
        d="M98 52 L118 64 L122 98 L108 128 L82 142 L58 124 L52 88 L72 58 Z"
        fill="#7CB883"
        stroke={LP.brand}
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#africa-sh)"
      />
      {/* Central + East */}
      <path
        d="M118 64 L162 68 L178 98 L172 138 L148 168 L118 182 L98 158 L108 128 L122 98 Z"
        fill={LP.brandLight}
        stroke={LP.brand}
        strokeWidth="1.8"
        strokeLinejoin="round"
        filter="url(#africa-sh)"
      />
      {/* Horn */}
      <path
        d="M178 98 L198 88 L208 108 L200 132 L182 128 Z"
        fill="#5C9E62"
        stroke={LP.brand}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Southern Africa */}
      <path
        d="M118 182 L148 168 L168 192 L158 222 L128 236 L98 218 L88 188 Z"
        fill="#4A8F50"
        stroke={LP.brand}
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#africa-sh)"
      />
      {/* Madagascar hint */}
      <ellipse cx="206" cy="206" rx="10" ry="22" fill="#7CB883" stroke={LP.brand} strokeWidth="1.2" opacity="0.9" />

      {/* Kinshasa pulse - RDC hub */}
      <circle cx="128" cy="118" r="6" fill={LP.pi} opacity="0.35" />
      <circle cx="128" cy="118" r="3" fill={LP.brand} />
    </svg>
  );
}

export function AfricaLogoBadge({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-2 ring-[color:var(--fd-primary)]/20 ${className ?? ""}`}
    >
      <Image
        src="/brand/logo-256.png"
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 object-contain p-1.5"
        priority
      />
    </div>
  );
}
