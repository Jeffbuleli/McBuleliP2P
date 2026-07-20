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
      return (
        <IconBase className={className}>
          <circle cx="12" cy="10" r="5.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8.5 14 7 20l5-2.5L17 20l-1.5-6" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M12 6.5V4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </IconBase>
      );
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
