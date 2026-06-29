/**
 * Minimal headset + mic - matches landing icon stroke style.
 */
export function SupportAgentIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 13v-1.5a8 8 0 0116 0V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 12v2a2 2 0 002 2h1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 12v2a2 2 0 01-2 2h-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="2" y="12" width="4" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="18" y="12" width="4" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 15.5h1.5a2 2 0 012 2v.5a2.5 2.5 0 01-2.5 2.5H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="19.5" cy="19.5" r="1" fill="currentColor" />
    </svg>
  );
}
