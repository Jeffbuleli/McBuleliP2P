/** P2P scene illustrations — inline SVG, no emoji. */

type IllusProps = { className?: string };

export function P2pIllusEscrow({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="14" y="28" width="36" height="28" rx="6" fill="#4a7350" fillOpacity="0.15" />
      <rect x="18" y="32" width="28" height="20" rx="4" stroke="#3d5f42" strokeWidth="2" />
      <path
        d="M32 24v12m-6-6h12"
        stroke="#3d5f42"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="20" r="10" fill="#4a7350" fillOpacity="0.2" />
      <path
        d="M28 20a4 4 0 018 0v2h-8v-2z"
        stroke="#3d5f42"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="14" r="8" fill="#fbbf24" fillOpacity="0.35" />
      <text x="44" y="17" textAnchor="middle" fontSize="8" fontWeight="700" fill="#b45309">
        $
      </text>
    </svg>
  );
}

export function P2pIllusPayFiat({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="18" y="8" width="28" height="48" rx="6" fill="#4a7350" fillOpacity="0.12" />
      <rect x="20" y="10" width="24" height="44" rx="5" stroke="#3d5f42" strokeWidth="2" />
      <rect x="24" y="16" width="16" height="3" rx="1.5" fill="#3d5f42" fillOpacity="0.4" />
      <rect x="24" y="22" width="16" height="14" rx="3" fill="#4a7350" fillOpacity="0.25" />
      <path
        d="M28 29h8M28 33h5"
        stroke="#3d5f42"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="44" r="6" fill="#22c55e" fillOpacity="0.3" />
      <path d="M29 44l2 2 4-4" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function P2pIllusVerify({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="10" y="18" width="32" height="22" rx="4" fill="#c47a1a" fillOpacity="0.15" />
      <rect x="12" y="20" width="28" height="18" rx="3" stroke="#b45309" strokeWidth="2" />
      <path d="M16 28h20M16 32h14" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="46" cy="38" r="14" fill="#fef3c7" />
      <circle cx="46" cy="38" r="10" stroke="#d97706" strokeWidth="2" />
      <path d="M42 38l3 3 6-7" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function P2pIllusDispute({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        d="M32 8l22 10v14c0 12-9.5 18.5-22 22C19.5 50.5 10 44 10 32V18L32 8z"
        fill="#4a7350"
        fillOpacity="0.15"
        stroke="#3d5f42"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24 30h16M24 36h10"
        stroke="#3d5f42"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="44" cy="44" r="10" fill="#dbeafe" />
      <path
        d="M44 38v8m0 4h.01"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function P2pIllusOffPlatform({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="8" y="20" width="28" height="28" rx="6" fill="#4a7350" fillOpacity="0.12" />
      <rect x="10" y="22" width="24" height="24" rx="5" stroke="#3d5f42" strokeWidth="2" />
      <path d="M16 32h16M16 38h10" stroke="#3d5f42" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M40 28l16 16M56 28L40 44"
        stroke="#dc2626"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="48" cy="36" r="12" fill="#fef2f2" fillOpacity="0.8" />
    </svg>
  );
}

export function P2pIllusBuy({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="24" fill="#4a7350" fillOpacity="0.12" />
      <circle cx="24" cy="28" r="10" fill="#fbbf24" fillOpacity="0.45" />
      <path
        d="M20 28h8v8h-8z"
        stroke="#b45309"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M36 40l8-16h-6l4-8"
        stroke="#3d5f42"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 48V36" stroke="#3d5f42" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 42l6 6 6-6" stroke="#3d5f42" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function P2pIllusSell({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="24" fill="#78350f" fillOpacity="0.1" />
      <circle cx="24" cy="36" r="10" fill="#fbbf24" fillOpacity="0.45" />
      <path
        d="M20 36h8v-8h-8z"
        stroke="#b45309"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M38 24l8 16h-6l4 8"
        stroke="#78350f"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 16v12" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 22l6-6 6 6" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function P2pIllusKyc({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="14" y="12" width="36" height="40" rx="4" fill="#dbeafe" fillOpacity="0.5" />
      <rect x="16" y="14" width="32" height="36" rx="3" stroke="#2563eb" strokeWidth="2" />
      <circle cx="32" cy="26" r="8" stroke="#2563eb" strokeWidth="2" />
      <path d="M22 42c2-6 6-8 10-8s8 2 10 8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
      <circle cx="48" cy="48" r="10" fill="#22c55e" fillOpacity="0.3" />
      <path d="M44 48l3 3 6-7" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function P2pIllusFakeReceipt({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="16" y="10" width="32" height="44" rx="4" fill="#fef3c7" />
      <rect x="18" y="12" width="28" height="40" rx="3" stroke="#d97706" strokeWidth="2" />
      <path d="M22 20h20M22 26h16M22 32h20" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M38 42l10 10M48 42L38 52" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function P2pIllusPostCancel({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="22" fill="#fef2f2" />
      <path d="M20 32h24" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 20v24" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" transform="rotate(45 32 32)" />
      <rect x="38" y="38" width="16" height="12" rx="2" fill="#4a7350" fillOpacity="0.2" stroke="#3d5f42" strokeWidth="1.5" />
    </svg>
  );
}

export function P2pIllusTriangle({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M32 10L54 50H10L32 10z" fill="#fffbeb" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="22" cy="42" r="6" fill="#fbbf24" fillOpacity="0.5" />
      <circle cx="42" cy="42" r="6" fill="#fbbf24" fillOpacity="0.5" />
      <path d="M28 38h8" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function P2pIllusChargeback({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="12" y="20" width="40" height="26" rx="4" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
      <path d="M18 30h12M18 36h8" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M44 28l-6 6 6 6" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="16" r="8" fill="#fef2f2" stroke="#dc2626" strokeWidth="2" />
      <path d="M48 12v8M44 16h8" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function P2pIllusImpersonate({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="28" cy="26" r="10" stroke="#3d5f42" strokeWidth="2" />
      <path d="M14 48c2-8 8-12 14-12s12 4 14 12" stroke="#3d5f42" strokeWidth="2" strokeLinecap="round" />
      <rect x="36" y="34" width="20" height="14" rx="3" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
      <path d="M40 42h12M40 46h8" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M52 30l4 4-4 4" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function P2pIllusReport({ className = "h-12 w-12" }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M32 8l22 10v14c0 12-9.5 18.5-22 22C19.5 50.5 10 44 10 32V18L32 8z" fill="#fef2f2" stroke="#dc2626" strokeWidth="2" />
      <path d="M32 24v10m0 6h.01" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
