/** Minimal McBuleli Academy icons (no emoji). */

export type AcademyIconName =
  | "wallet"
  | "p2p"
  | "tutor"
  | "live"
  | "calendar"
  | "chat"
  | "audio"
  | "video"
  | "mic"
  | "camera"
  | "screen"
  | "hand"
  | "signal";

export function AcademyIcon({
  name,
  className = "h-5 w-5",
}: {
  name: AcademyIconName;
  className?: string;
}) {
  const props = {
    className: `${className} text-[#305f33]`,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
  };
  const s = "currentColor";

  switch (name) {
    case "wallet":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="14" rx="3" stroke={s} strokeWidth="1.8" />
          <circle cx="12" cy="13" r="3" stroke={s} strokeWidth="1.6" />
        </svg>
      );
    case "p2p":
      return (
        <svg {...props}>
          <circle cx="7" cy="12" r="3" fill={s} opacity="0.35" />
          <circle cx="17" cy="12" r="3" fill={s} opacity="0.35" />
          <path d="M10 12h4" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "tutor":
      return (
        <svg {...props}>
          <circle cx="12" cy="9" r="4" stroke={s} strokeWidth="1.8" />
          <path d="M6 19c0-3 2.7-5 6-5s6 2 6 5" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 8l2-1 1 2" stroke={s} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "live":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" fill="#dc2626" />
          <circle cx="12" cy="12" r="7" stroke="#dc2626" strokeWidth="1.5" opacity="0.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="4" y="5" width="16" height="15" rx="2" stroke={s} strokeWidth="1.8" />
          <path d="M4 9h16M8 3v4M16 3v4" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "chat":
      return (
        <svg {...props}>
          <path
            d="M5 6h14a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3V8a2 2 0 012-2z"
            stroke={s}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "audio":
      return (
        <svg {...props}>
          <path d="M9 10v4a3 3 0 006 0v-4" stroke={s} strokeWidth="1.8" />
          <path d="M12 14v3M8 18h8" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "video":
      return (
        <svg {...props}>
          <path d="M5 7h10v10H5z" stroke={s} strokeWidth="1.8" />
          <path d="M15 10l4-2v8l-4-2" stroke={s} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "mic":
      return (
        <svg {...props}>
          <rect x="9" y="4" width="6" height="10" rx="3" stroke={s} strokeWidth="1.8" />
          <path d="M6 11a6 6 0 0012 0M12 17v3" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "camera":
      return (
        <svg {...props}>
          <rect x="3" y="7" width="14" height="10" rx="2" stroke={s} strokeWidth="1.8" />
          <circle cx="10" cy="12" r="2.5" stroke={s} strokeWidth="1.6" />
          <path d="M17 9h4v6h-4l-2-2z" stroke={s} strokeWidth="1.6" />
        </svg>
      );
    case "screen":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="11" rx="2" stroke={s} strokeWidth="1.8" />
          <path d="M8 19h8" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "hand":
      return (
        <svg {...props}>
          <path
            d="M8 12V8a2 2 0 114 0v1M12 7V5a2 2 0 114 0v6l-1 5H9l-1-4"
            stroke={s}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "signal":
      return (
        <svg {...props}>
          <path d="M4 16h2M8 13h2M12 10h2M16 7h2" stroke={s} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
