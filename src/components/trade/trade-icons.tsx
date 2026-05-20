import type { ReactNode } from "react";

/** Line icons for Trade (no emoji). */

const S = "h-5 w-5 shrink-0";

export function TradeIconBots({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="13" r="1.2" fill="currentColor" />
      <circle cx="15" cy="13" r="1.2" fill="currentColor" />
      <path d="M12 4v3M8 6l4-2 4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TradeIconFutures({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 18l4-6 4 3 4-8 4 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TradeIconPractice({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.5 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TradeIconLive({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TradeIconShield({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TradeIconAlert({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4L3 20h18L12 4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TradeIconWallet({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h14a3 3 0 013 3v6a2 2 0 01-2 2H4a2 2 0 01-2-2V10a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M17 14h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TradeIconLong({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 19V5M7 10l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TradeIconShort({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M7 14l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TradeIconBadge({
  children,
  tone = "mint",
  size = "md",
}: {
  children: ReactNode;
  tone?: "mint" | "primary" | "live" | "rose";
  size?: "md" | "lg";
}) {
  const bg =
    tone === "primary"
      ? "bg-[color:var(--fd-primary)] text-white"
      : tone === "live"
        ? "bg-[color:var(--fd-live,#ea580c)] text-white"
        : tone === "rose"
          ? "bg-rose-500 text-white"
          : "bg-[color:var(--fd-mint-deep)] text-[color:var(--fd-primary)]";
  const sz = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl ${sz} ${bg}`}
    >
      {children}
    </span>
  );
}
