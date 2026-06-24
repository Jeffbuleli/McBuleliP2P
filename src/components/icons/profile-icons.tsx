/** Shared SVG icons for profile hub (exchange-style account center). */

const base = "h-5 w-5 shrink-0";

export function ProfileIconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5 shrink-0 text-[var(--fd-muted)]"} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileIconStar({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.9 6.9 7.4.6-5.6 4.8 1.7 7.2L12 18.8 5.6 21.5l1.7-7.2L1.7 9.5l7.4-.6L12 2z" />
    </svg>
  );
}

export function ProfileIconWallet({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileIconShield({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3L4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileIconShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3L4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileIconCard({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function ProfileIconGift({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="10" width="18" height="11" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10V21M3 14h18" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 10c-2-3-5-3-5 0s3 3 5 0 5-3 5 0-3-3-5 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileIconGear({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProfileIconMerchant({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 10V20h16V10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M2 10l3-6h14l3 6M9 20v-6h6v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileIconCommunity({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M3 20c0-3.3 2.7-6 6-6M14 20c0-2.2 1.8-4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProfileIconAcademy({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V5l8-3 8 3v14H4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileIconPi({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.5 8v8M9.5 12h3.2a2.3 2.3 0 100-4.6H9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileIconOps({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l2.5 7.5H22l-6 4.5 2.5 7.5L12 18l-6.5 4.5 2.5-7.5-6-4.5h7.5L12 3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileIconLogout({ className }: { className?: string }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileIconFlagEn({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-5"} viewBox="0 0 20 14" aria-hidden>
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0l20 14M20 0L0 14" stroke="#fff" strokeWidth="2.2" />
      <path d="M0 0l20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.2" />
      <path d="M10 0v14M0 7h20" stroke="#fff" strokeWidth="3.2" />
      <path d="M10 0v14M0 7h20" stroke="#C8102E" strokeWidth="1.8" />
    </svg>
  );
}

export function ProfileIconFlagFr({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-5"} viewBox="0 0 20 14" aria-hidden>
      <rect width="6.67" height="14" fill="#002395" />
      <rect x="6.67" width="6.66" height="14" fill="#fff" />
      <rect x="13.33" width="6.67" height="14" fill="#ED2939" />
    </svg>
  );
}
