/** Inline SVG accents for launch poster & social assets (McBuleli palette). */

export function LaunchIconCrypto({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
      fill="none"
    >
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path
        d="M18 30l6-14 6 8 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="16" r="3" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export function LaunchIconTrading({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none">
      <rect x="8" y="28" width="6" height="12" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="18" y="20" width="6" height="20" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="28" y="12" width="6" height="28" rx="1" fill="currentColor" />
      <path d="M10 14l12-6 10 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LaunchIconAi({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none">
      <rect x="10" y="14" width="28" height="22" rx="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="25" r="3" fill="currentColor" />
      <circle cx="30" cy="25" r="3" fill="currentColor" />
      <path d="M24 8v4M16 8h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 32h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function LaunchIconP2p({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none">
      <circle cx="16" cy="20" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="28" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M22 24h4l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M24 32v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
