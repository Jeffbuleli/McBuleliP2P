import type { UtilityTag } from "@/lib/community/utility-tags";

/** Compact SVG marks for utility tags (icon-first UI). */
export function UtilityTagIcon({
  tag,
  className = "h-3.5 w-3.5",
}: {
  tag: UtilityTag | "all";
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (tag) {
    case "all":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
        </svg>
      );
    case "learn":
      return (
        <svg {...common}>
          <path d="M4 19V6a1 1 0 011-1h6v14H5a1 1 0 01-1-1z" />
          <path d="M12 5h7a1 1 0 011 1v12a1 1 0 01-1 1h-7" />
        </svg>
      );
    case "trade_edu":
      return (
        <svg {...common}>
          <path d="M4 16l5-5 4 4 7-7" />
          <path d="M14 8h6v6" />
        </svg>
      );
    case "avec":
      return (
        <svg {...common}>
          <circle cx="9" cy="10" r="3" />
          <circle cx="16" cy="10" r="3" />
          <path d="M4 19c1.5-3 3.5-4 5-4s3.5 1 5 4" />
          <path d="M11 19c1-2 2.5-3 5-3s3.5 1 4 3" />
        </svg>
      );
    case "p2p":
      return (
        <svg {...common}>
          <path d="M7 7h10v4" />
          <path d="M17 7l-3 3M17 7l-3-3" />
          <path d="M17 17H7v-4" />
          <path d="M7 17l3-3M7 17l3 3" />
        </svg>
      );
    case "local":
      return (
        <svg {...common}>
          <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "create":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "signal":
      return (
        <svg {...common}>
          <path d="M5 12a7 7 0 0114 0" />
          <path d="M8 12a4 4 0 018 0" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
