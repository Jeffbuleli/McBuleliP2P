"use client";

import { useId } from "react";

/** Minimalist McBuleli AI bot mark — face only (no speech-bubble plate). */

type Props = { className?: string; size?: number; gradientId?: string };

export function AssistantBotLogo({ className, size, gradientId }: Props) {
  const autoId = useId().replace(/:/g, "");
  const gid = gradientId ?? autoId;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      width={size}
      height={size}
      aria-hidden
    >
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
        {/* Keep id stable for callers that pass gradientId; unused plate removed. */}
        <linearGradient id={gid} x1="8" y1="8" x2="56" y2="56">
          <stop stopColor="#305f33" />
          <stop offset="1" stopColor="#6ee7a0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
