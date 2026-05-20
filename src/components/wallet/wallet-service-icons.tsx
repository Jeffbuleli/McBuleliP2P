const S = "h-5 w-5";

export function WalletIconStaking({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 10a4 4 0 118 0v2M7 14h10M9 18h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function WalletIconPool({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 14c2 2 4 2 6 0s4-2 6 0 4 2 6 0M4 10c2 2 4 2 6 0s4-2 6 0 4 2 6 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WalletIconGroup({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 19c0-2.5 2.2-4 5-4M14 19c0-1.8 1.6-3.2 4-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WalletIconLoans({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10V8a2 2 0 012-2h12a2 2 0 012 2v2M4 10h16v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 14h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
