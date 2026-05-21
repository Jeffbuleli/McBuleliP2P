"use client";

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, className = "", ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    className,
    "aria-hidden": true as const,
    ...props,
  };
}

export function IconCron(props: IconProps) {
  const p = base(props);
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconAnalysis(props: IconProps) {
  const p = base(props);
  return (
    <svg {...p}>
      <path
        d="M4 14l4-6 4 4 4-8 4 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBot(props: IconProps) {
  const p = base(props);
  return (
    <svg {...p}>
      <path
        d="M13 3L4 14h7l-1 7 9-12h-7l1-6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  const p = base({ size: 14, ...props });
  return (
    <svg {...p}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconStatusOk(props: IconProps) {
  const p = base({ size: 14, ...props });
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path
        d="M8 12.5l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconStatusWarn(props: IconProps) {
  const p = base({ size: 14, ...props });
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path
        d="M12 8v5M12 16.5v.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconStatusOff(props: IconProps) {
  const p = base({ size: 14, ...props });
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path d="M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlay(props: IconProps) {
  const p = base({ size: 14, ...props });
  return (
    <svg {...p}>
      <path d="M9 7l8 5-8 5V7z" fill="currentColor" />
    </svg>
  );
}

export function IconPause(props: IconProps) {
  const p = base({ size: 14, ...props });
  return (
    <svg {...p}>
      <path d="M9 7h2v10H9V7zm4 0h2v10h-2V7z" fill="currentColor" />
    </svg>
  );
}

export function IconLong(props: IconProps) {
  const p = base(props);
  return (
    <svg {...p}>
      <path
        d="M12 19V8M8 12l4-4 4 4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconShort(props: IconProps) {
  const p = base(props);
  return (
    <svg {...p}>
      <path
        d="M12 5v11M8 12l4 4 4-4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconHold(props: IconProps) {
  const p = base(props);
  return (
    <svg {...p}>
      <path d="M8 12h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  const p = base({ size: 14, ...props });
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconXLogo(props: IconProps) {
  const p = base({ size: 14, ...props });
  return (
    <svg {...p}>
      <path
        d="M5 5l14 14M19 5L5 19"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSentimentBull(props: IconProps) {
  const p = base({ size: 16, ...props });
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 14s1.5-2 4-2 4 2 4 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconSentimentBear(props: IconProps) {
  const p = base({ size: 16, ...props });
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 16s1.5-2 4-2 4 2 4 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconSentimentVolatile(props: IconProps) {
  const p = base({ size: 16, ...props });
  return (
    <svg {...p}>
      <path
        d="M4 14l3-6 3 4 3-8 3 10 4-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLock({ size = 14, className = "", ...props }: IconProps) {
  const p = base({ size, className, ...props });
  return (
    <svg {...p}>
      <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 11V8a4 4 0 118 0v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSpinner({ className = "", ...props }: IconProps) {
  const p = base({
    size: 16,
    className: `animate-spin ${className}`.trim(),
    ...props,
  });
  return (
    <svg {...p}>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="28 56"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type XSentimentKind = "bullish" | "bearish" | "neutral" | "volatile";

export function parseXSentiment(insight: string): XSentimentKind | null {
  const l = insight.toLowerCase();
  if (l.includes("volatile") || l.includes("volat")) return "volatile";
  if (l.includes("bullish") || l.includes("bull")) return "bullish";
  if (l.includes("bearish") || l.includes("bear")) return "bearish";
  if (l.includes("neutral")) return "neutral";
  return null;
}

export function SentimentIcon({
  kind,
  ...props
}: IconProps & { kind: XSentimentKind }) {
  if (kind === "bullish") return <IconSentimentBull {...props} />;
  if (kind === "bearish") return <IconSentimentBear {...props} />;
  if (kind === "volatile") return <IconSentimentVolatile {...props} />;
  return <IconHold {...props} />;
}

export function ActionIcon({
  action,
  ...props
}: IconProps & { action: "LONG" | "SHORT" | "HOLD" }) {
  if (action === "LONG") return <IconLong {...props} />;
  if (action === "SHORT") return <IconShort {...props} />;
  return <IconHold {...props} />;
}
