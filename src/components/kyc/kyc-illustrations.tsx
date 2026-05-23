"use client";

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 48, className = "", ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 96 96",
    fill: "none",
    className,
    "aria-hidden": true as const,
    ...rest,
  };
}

function stepBase({ size = 24, className = "", ...rest }: P) {
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

/** Step 0 — tap to begin */
export function KycHeroLaunch({ className }: { className?: string }) {
  const s = base({ size: 112, className });
  return (
    <svg {...s}>
      <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="1.25" opacity="0.12" />
      <rect x="30" y="18" width="36" height="58" rx="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="48" cy="72" r="3" fill="currentColor" opacity="0.35" />
      <path
        d="M42 38h12l-6 10 6-10z"
        fill="currentColor"
        opacity="0.18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M48 8v6M48 82v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.2"
      />
    </svg>
  );
}

/** Step 1 — national ID / voter card */
export function KycHeroIdDoc({ className }: { className?: string }) {
  const s = base({ size: 112, className });
  return (
    <svg {...s}>
      <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="1.25" opacity="0.12" />
      <rect x="24" y="22" width="48" height="52" rx="6" stroke="currentColor" strokeWidth="2" />
      <rect x="30" y="28" width="16" height="12" rx="2" fill="currentColor" opacity="0.14" />
      <circle cx="58" cy="34" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M30 48h36M30 56h26M30 64h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.45" />
      <path
        d="M18 32l6 6M78 64l6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

/** Step 2 — selfie / liveness */
export function KycHeroSelfie({ className }: { className?: string }) {
  const s = base({ size: 112, className });
  return (
    <svg {...s}>
      <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="1.25" opacity="0.12" />
      <path
        d="M28 28h40v40H28z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.35"
      />
      <circle cx="48" cy="44" r="14" stroke="currentColor" strokeWidth="2" />
      <path d="M34 62c3 6 8 9 14 9s11-3 14-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 44h6M70 44h6M20 32h6M70 32h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

/** Fresh start — ID + shield */
export function KycHeroStart({ className }: { className?: string }) {
  const s = base({ size: 112, className });
  return (
    <svg {...s}>
      <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="1.25" opacity="0.12" />
      <circle cx="48" cy="48" r="28" fill="currentColor" opacity="0.06" />
      <rect
        x="22"
        y="26"
        width="52"
        height="34"
        rx="6"
        stroke="currentColor"
        strokeWidth="2"
        transform="rotate(-8 48 48)"
      />
      <rect
        x="26"
        y="30"
        width="14"
        height="10"
        rx="2"
        fill="currentColor"
        opacity="0.15"
        transform="rotate(-8 48 48)"
      />
      <path
        d="M34 52h28M34 58h20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.45"
        transform="rotate(-8 48 48)"
      />
      <path
        d="M48 18L30 24v14c0 12 8 20 18 24 10-4 18-12 18-24V24L48 18z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M42 38l4 4 10-10"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="72" cy="28" r="3" fill="currentColor" opacity="0.35" />
      <circle cx="24" cy="68" r="2" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

/** Waiting — elegant hourglass */
export function KycHeroWaiting({ className }: { className?: string }) {
  const s = base({ size: 112, className });
  return (
    <svg {...s}>
      <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="1.25" opacity="0.12" />
      <path
        d="M34 24h28l-6 14c-4 6-4 14 0 20l6 14H34l6-14c4-6 4-14 0-20L34 24z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M42 38h12M44 48h8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="48" cy="48" r="4" fill="currentColor" opacity="0.2" />
      <path
        d="M48 32v6M48 58v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

/** Manual review — document under lens */
export function KycHeroReview({ className }: { className?: string }) {
  const s = base({ size: 112, className });
  return (
    <svg {...s}>
      <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="1.25" opacity="0.12" />
      <rect x="28" y="32" width="40" height="32" rx="5" stroke="currentColor" strokeWidth="2" />
      <path d="M34 42h28M34 50h22M34 58h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.45" />
      <circle cx="58" cy="28" r="14" stroke="currentColor" strokeWidth="2" />
      <path d="M68 38l8 8" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <path
        d="M54 24c2-3 6-4 10-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

/** Verified — shield glow */
export function KycHeroSuccess({ className }: { className?: string }) {
  const s = base({ size: 112, className });
  return (
    <svg {...s}>
      <circle cx="48" cy="48" r="40" fill="currentColor" opacity="0.08" />
      <circle cx="48" cy="48" r="32" stroke="currentColor" strokeWidth="1.25" opacity="0.18" />
      <path
        d="M48 16L26 24v16c0 14 9 24 22 28 13-4 22-14 22-28V24L48 16z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <path
        d="M38 44l6 6 14-14"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48 8v4M48 76v4M16 48h4M76 48h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

/** Blocked — lock shield */
export function KycHeroBlocked({ className }: { className?: string }) {
  const s = base({ size: 112, className });
  return (
    <svg {...s}>
      <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="1.25" opacity="0.12" />
      <path
        d="M48 18L30 26v14c0 11 7 19 18 22 11-3 18-11 18-22V26L48 18z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="38" y="44" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M42 44v-4a6 6 0 0112 0v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="48" cy="52" r="2" fill="currentColor" />
    </svg>
  );
}

/** SDK / load error */
export function KycHeroError({ className }: { className?: string }) {
  const s = base({ size: 112, className });
  return (
    <svg {...s}>
      <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="1.25" opacity="0.12" />
      <circle cx="48" cy="48" r="26" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path d="M48 34v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="48" cy="56" r="2.5" fill="currentColor" />
    </svg>
  );
}

/** Step 0 — profile / personal details (inside verification flow) */
export function KycIconProfile({ className }: { className?: string }) {
  const s = stepBase({ size: 24, className });
  return (
    <svg {...s}>
      <circle cx="24" cy="18" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 38c0-6 5-10 12-10s12 4 12 10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Open verification (CTA) */
export function KycIconLaunch({ className }: { className?: string }) {
  const s = stepBase({ size: 24, className });
  return (
    <svg {...s}>
      <rect x="14" y="10" width="20" height="28" rx="5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 34h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M22 16l6 4-6 4v-8z"
        fill="currentColor"
        opacity="0.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KycIconShield({ className }: { className?: string }) {
  const s = stepBase({ size: 24, className });
  return (
    <svg {...s}>
      <path
        d="M24 6L8 12v10c0 10 6.5 16.5 16 20 9.5-3.5 16-10 16-20V12L24 6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M18 24l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KycIconId({ className }: { className?: string }) {
  const s = stepBase({ size: 24, className });
  return (
    <svg {...s}>
      <rect x="10" y="8" width="28" height="32" rx="4" stroke="currentColor" strokeWidth="1.75" />
      <rect x="14" y="12" width="10" height="8" rx="1.5" fill="currentColor" opacity="0.15" />
      <circle cx="30" cy="18" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 28h20M14 34h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function KycIconFace({ className }: { className?: string }) {
  const s = stepBase({ size: 24, className });
  return (
    <svg {...s}>
      <path d="M14 14h20v20H14z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" opacity="0.35" />
      <circle cx="24" cy="22" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M18 32c1.5 3 4 5 6 5s4.5-2 6-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M10 24h3M35 24h3M10 16h3M35 16h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

export function KycIconReview({ className }: { className?: string }) {
  const s = stepBase({ size: 24, className });
  return (
    <svg {...s}>
      <circle cx="22" cy="22" r="10" stroke="currentColor" strokeWidth="1.75" />
      <path d="M29 29l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 22h8M18 18h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export type KycUiPhase =
  | "start"
  | "in_sdk"
  | "waiting"
  | "review"
  | "success"
  | "blocked"
  | "error";

export function kycUiPhase(args: {
  status: string;
  sdkError: boolean;
  sanctionsBlocked: boolean;
  diditSessionStatus?: string | null;
  hasSession?: boolean;
}): KycUiPhase {
  if (args.sdkError) return "error";
  if (args.sanctionsBlocked) return "blocked";
  if (args.status === "approved") return "success";
  if (args.status === "manual_review") return "review";
  if (args.status === "pending") {
    const d = args.diditSessionStatus?.trim();
    if (d === "In Review") return "review";
    if (
      d === "In Progress" ||
      d === "Resubmitted" ||
      d === "Not Started" ||
      (args.hasSession && !d)
    ) {
      return "in_sdk";
    }
    return "waiting";
  }
  return "start";
}

export function KycHeroScene({
  phase,
  activeStepIndex = 0,
  className,
}: {
  phase: KycUiPhase;
  /** 0 launch · 1 ID · 2 selfie · 3 decision */
  activeStepIndex?: number;
  className?: string;
}) {
  const tone =
    phase === "success"
      ? "text-emerald-700"
      : phase === "blocked" || phase === "error"
        ? "text-rose-700"
        : phase === "waiting" || phase === "review"
          ? "text-amber-800"
          : "text-[color:var(--fd-primary)]";

  let Hero = KycHeroStart;
  if (phase === "success") Hero = KycHeroSuccess;
  else if (phase === "blocked") Hero = KycHeroBlocked;
  else if (phase === "error") Hero = KycHeroError;
  else if (phase === "waiting") Hero = KycHeroWaiting;
  else if (phase === "review") Hero = KycHeroReview;
  else if (phase === "in_sdk") {
    if (activeStepIndex >= 2) Hero = KycHeroSelfie;
    else if (activeStepIndex >= 1) Hero = KycHeroIdDoc;
    else Hero = KycHeroLaunch;
  } else if (phase === "start" && activeStepIndex === 0) {
    Hero = KycHeroLaunch;
  }

  return (
    <div className={`relative flex items-center justify-center ${className ?? ""}`}>
      <Hero className={`h-28 w-28 ${tone}`} />
      <PulseRing phase={phase} />
    </div>
  );
}

function PulseRing({ phase }: { phase: KycUiPhase }) {
  if (phase !== "waiting" && phase !== "review" && phase !== "in_sdk") return null;
  return (
    <span
      className="pointer-events-none absolute inset-4 rounded-[2rem] border border-amber-700/15"
      aria-hidden
    />
  );
}
