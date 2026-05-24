"use client";

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function b({ size = 18, className = "", ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    className,
    "aria-hidden": true as const,
    ...rest,
  };
}

export function IconChevronLeft(p: P) {
  const s = b({ size: 16, ...p });
  return (
    <svg {...s}>
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronRight(p: P) {
  const s = b({ size: 16, ...p });
  return (
    <svg {...s}>
      <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSort(p: P) {
  const s = b({ size: 12, ...p });
  return (
    <svg {...s}>
      <path d="M8 9l4-4 4 4M8 15l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type AdminNavIconKey =
  | "dashboard"
  | "support"
  | "deposits"
  | "withdrawals"
  | "groups"
  | "p2p"
  | "expenses"
  | "team"
  | "users"
  | "finance"
  | "bots"
  | "audit"
  | "pi"
  | "kyc";

export function AdminNavIcon({ name, size = 20 }: { name: AdminNavIconKey; size?: number }) {
  const s = b({ size });
  switch (name) {
    case "dashboard":
      return (
        <svg {...s}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "support":
      return (
        <svg {...s}>
          <path d="M4 6h16v10a2 2 0 01-2 2H8l-4 3V6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "deposits":
      return (
        <svg {...s}>
          <path d="M12 5v14M8 11l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "withdrawals":
      return (
        <svg {...s}>
          <path d="M12 19V5M8 13l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "groups":
      return (
        <svg {...s}>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
          <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
          <path d="M3 19c0-3 3-5 6-5s6 2 6 5M14 19c0-2 2.5-4 5-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "p2p":
      return (
        <svg {...s}>
          <path d="M7 10h10M7 14h6M6 6h12v12H6V6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "expenses":
      return (
        <svg {...s}>
          <path d="M4 8h16M4 12h10M4 16h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "team":
      return (
        <svg {...s}>
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
          <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg {...s}>
          <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
          <path d="M5 20c0-4 3-7 7-7s7 3 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "finance":
      return (
        <svg {...s}>
          <path d="M4 18V8l8-4 8 4v10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "bots":
      return (
        <svg {...s}>
          <path d="M13 3L4 14h7l-1 7 9-12h-7l1-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "audit":
      return (
        <svg {...s}>
          <path d="M6 4h12v16H6V4z" stroke="currentColor" strokeWidth="2" />
          <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "pi":
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "kyc":
      return (
        <svg {...s}>
          <path
            d="M12 3L4 7v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7L12 3z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
  }
}
