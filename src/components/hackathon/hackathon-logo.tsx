/** McBuleli Hackathon mark — lightbulb × brain (circuit + binary), inspired by SIH motif. */

export function HackathonLogo({
  className,
  title = "McBuleli Hackathon",
}: {
  className?: string;
  title?: string;
}) {
  const uid = "mhk";
  return (
    <svg
      className={className}
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={`${uid}-orange`} x1="28" y1="20" x2="58" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e07a2f" />
          <stop offset="1" stopColor="#c45a18" />
        </linearGradient>
        <linearGradient id={`${uid}-green`} x1="62" y1="20" x2="92" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3d7a42" />
          <stop offset="1" stopColor="#305f33" />
        </linearGradient>
      </defs>

      {/* Rays */}
      <rect x="14" y="38" width="10" height="3.5" rx="1.5" transform="rotate(-28 14 38)" fill="#3f3f46" />
      <rect x="10" y="54" width="11" height="3.5" rx="1.5" fill="#3f3f46" />
      <rect x="15" y="70" width="10" height="3.5" rx="1.5" transform="rotate(28 15 70)" fill="#3f3f46" />
      <rect x="96" y="38" width="10" height="3.5" rx="1.5" transform="rotate(28 106 38)" fill="#3f3f46" />
      <rect x="99" y="54" width="11" height="3.5" rx="1.5" fill="#3f3f46" />
      <rect x="95" y="70" width="10" height="3.5" rx="1.5" transform="rotate(-28 105 70)" fill="#3f3f46" />

      {/* Brain outline as bulb */}
      <path
        d="M60 14c-22 0-38 16-38 38 0 14 7 26 18 33v6h40v-6c11-7 18-19 18-33 0-22-16-38-38-38Z"
        fill="#f4f4f5"
        stroke="#27272a"
        strokeWidth="2.2"
      />

      {/* Left hemisphere — circuit */}
      <clipPath id={`${uid}-left`}>
        <path d="M60 16c-20 0-36 15-36 36 0 13 6 24 16 31V83H60V16Z" />
      </clipPath>
      <g clipPath={`url(#${uid}-left)`}>
        <path
          d="M60 16c-20 0-36 15-36 36 0 13 6 24 16 31V83H60V16Z"
          fill={`url(#${uid}-orange)`}
        />
        <path d="M34 36h18M40 48h22M32 60h20M42 72h16" stroke="#fff7ed" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
        <path d="M42 36v12M52 48v12M38 60v12" stroke="#fff7ed" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
        <circle cx="34" cy="36" r="2.2" fill="#fff7ed" />
        <circle cx="52" cy="36" r="2.2" fill="#fff7ed" />
        <circle cx="40" cy="48" r="2.2" fill="#fff7ed" />
        <circle cx="62" cy="48" r="2.2" fill="#fff7ed" />
        <circle cx="32" cy="60" r="2.2" fill="#fff7ed" />
        <circle cx="52" cy="60" r="2.2" fill="#fff7ed" />
        <circle cx="42" cy="72" r="2.2" fill="#fff7ed" />
        <circle cx="58" cy="72" r="2.2" fill="#fff7ed" />
      </g>

      {/* Right hemisphere — binary */}
      <clipPath id={`${uid}-right`}>
        <path d="M60 16c20 0 36 15 36 36 0 13-6 24-16 31V83H60V16Z" />
      </clipPath>
      <g clipPath={`url(#${uid}-right)`}>
        <path
          d="M60 16c20 0 36 15 36 36 0 13-6 24-16 31V83H60V16Z"
          fill={`url(#${uid}-green)`}
        />
        <text x="66" y="34" fill="#ecfdf5" fontSize="7" fontFamily="ui-monospace,monospace" fontWeight="700" opacity="0.95">101</text>
        <text x="64" y="44" fill="#ecfdf5" fontSize="7" fontFamily="ui-monospace,monospace" fontWeight="700" opacity="0.95">01010</text>
        <text x="63" y="54" fill="#ecfdf5" fontSize="7" fontFamily="ui-monospace,monospace" fontWeight="700" opacity="0.95">101010</text>
        <text x="64" y="64" fill="#ecfdf5" fontSize="7" fontFamily="ui-monospace,monospace" fontWeight="700" opacity="0.95">010101</text>
        <text x="66" y="74" fill="#ecfdf5" fontSize="7" fontFamily="ui-monospace,monospace" fontWeight="700" opacity="0.95">10101</text>
      </g>

      {/* Center fold */}
      <path d="M60 18v64" stroke="#27272a" strokeWidth="1.4" strokeOpacity="0.35" />

      {/* Screw base */}
      <rect x="42" y="88" width="36" height="28" rx="5" fill="#27272a" />
      <text
        x="60"
        y="107"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="13"
        fontWeight="800"
        fontFamily="system-ui,-apple-system,sans-serif"
        letterSpacing="0.06em"
      >
        MH
      </text>
      <rect x="48" y="118" width="24" height="5" rx="2" fill="#3f3f46" />
      <rect x="52" y="125" width="16" height="4" rx="2" fill="#52525b" />
    </svg>
  );
}

/** Compact horizontal lockup for cards / nav. */
export function HackathonLogoMark({ className }: { className?: string }) {
  return <HackathonLogo className={className} />;
}
