"use client";

import { useId } from "react";
import { HudCornerBrackets } from "@/components/ui/hud-corners";

/** McBuleli IA bot mark - speech ring, white visor face, M badge (distinct from brand logo). */
export function AssistantBotLogo({
  className = "",
  size = 40,
  animated = false,
  gradientId,
}: {
  className?: string;
  size?: number;
  animated?: boolean;
  gradientId?: string;
}) {
  const autoId = useId().replace(/:/g, "");
  const gid = gradientId ?? autoId;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" fill="none" width={size} height={size}>
        <path
          d="M32 4c15.5 0 28 12.5 28 28s-12.5 28-28 28c-3.2 0-6.2-.5-9-1.5L8 62l3.8-14.2C6.8 42.2 4 37.3 4 32 4 16.5 16.5 4 32 4z"
          fill={`url(#${gid})`}
          opacity="0.95"
        />
        <circle cx="32" cy="30" r="17" fill="#F8FAF8" />
        <circle cx="32" cy="30" r="17" stroke="#305f33" strokeWidth="1.25" opacity="0.35" />
        <circle cx="17" cy="30" r="5.5" fill="#F8FAF8" stroke="#305f33" strokeWidth="1" opacity="0.5" />
        <circle cx="47" cy="30" r="5.5" fill="#F8FAF8" stroke="#305f33" strokeWidth="1" opacity="0.5" />
        <path d="M32 13v4" stroke="#305f33" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="32" cy="11.5" r="2" fill="#6ee7a0" stroke="#305f33" strokeWidth="1" />
        <path
          d="M26 22.5 29 27l3-4.5 3 4.5 3-4.5V27h-2.2v-3.2l-2.3 3.4-2.3-3.4V27H26v-4.5z"
          fill="#305f33"
        />
        <rect x="21" y="28" width="22" height="11" rx="5.5" fill="#1a3520" />
        <path
          d="M26 32.5c.8 1.2 2 1.8 3 1.8s2.2-.6 3-1.8"
          stroke="#6ee7a0"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M27 31.5c.4-.6 1-.9 1.5-.9s1.1.3 1.5.9M34 31.5c.4-.6 1-.9 1.5-.9s1.1.3 1.5.9"
          stroke="#6ee7a0"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="48" cy="46" r="9" fill="#305f33" stroke="#6ee7a0" strokeWidth="1.25" />
        <circle cx="45" cy="46" r="1.1" fill="#6ee7a0" />
        <circle cx="48" cy="46" r="1.1" fill="#6ee7a0" />
        <circle cx="51" cy="46" r="1.1" fill="#6ee7a0" />
        <defs>
          <linearGradient id={gid} x1="8" y1="8" x2="56" y2="56">
            <stop stopColor="#305f33" />
            <stop offset="1" stopColor="#6ee7a0" />
          </linearGradient>
        </defs>
      </svg>
      {animated ? (
        <HudCornerBrackets tone="spectral" size="xs" animated className="-inset-[6%]" />
      ) : null}
    </div>
  );
}
