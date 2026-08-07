import { RDPI_BRAND } from "@/lib/rdpi/survey-questions";

type IlluProps = { className?: string; title?: string };

/** Soft research / sunburst motif matching RDPI blue+gold. */
export function RdpiIlluSunburst({ className = "", title }: IlluProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="60" cy="60" r="52" stroke={RDPI_BRAND.blue} strokeWidth="1.5" opacity="0.25" />
      <circle cx="60" cy="60" r="34" stroke={RDPI_BRAND.gold} strokeWidth="1.2" opacity="0.45" />
      <path
        d="M60 14 L64 46 L96 46 L70 64 L80 96 L60 78 L40 96 L50 64 L24 46 L56 46 Z"
        fill={RDPI_BRAND.gold}
        opacity="0.9"
      />
      <circle cx="60" cy="60" r="10" fill={RDPI_BRAND.blue} />
    </svg>
  );
}

export function RdpiIlluChart({ className = "" }: IlluProps) {
  return (
    <svg className={className} viewBox="0 0 120 88" fill="none" aria-hidden>
      <rect x="8" y="8" width="104" height="72" rx="14" stroke="#E5E5E0" strokeWidth="2" fill="white" />
      <rect x="22" y="48" width="14" height="20" rx="4" fill={RDPI_BRAND.blue} opacity="0.85" />
      <rect x="42" y="34" width="14" height="34" rx="4" fill={RDPI_BRAND.gold} />
      <rect x="62" y="24" width="14" height="44" rx="4" fill={RDPI_BRAND.blue} />
      <rect x="82" y="40" width="14" height="28" rx="4" fill="#0A0A0A" opacity="0.85" />
      <path
        d="M24 30 C40 28 48 18 60 20 C74 22 82 34 96 28"
        stroke={RDPI_BRAND.gold}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RdpiIlluShield({ className = "" }: IlluProps) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <path
        d="M48 10 L78 24 V46 C78 66 64 80 48 86 C32 80 18 66 18 46 V24 Z"
        fill={RDPI_BRAND.blue}
        opacity="0.12"
        stroke={RDPI_BRAND.blue}
        strokeWidth="2"
      />
      <path
        d="M34 48 L44 58 L64 36"
        stroke={RDPI_BRAND.gold}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RdpiIlluNetwork({ className = "" }: IlluProps) {
  return (
    <svg className={className} viewBox="0 0 120 80" fill="none" aria-hidden>
      <circle cx="24" cy="40" r="8" fill={RDPI_BRAND.blue} />
      <circle cx="60" cy="18" r="7" fill={RDPI_BRAND.gold} />
      <circle cx="96" cy="40" r="8" fill="#0A0A0A" />
      <circle cx="60" cy="62" r="7" fill={RDPI_BRAND.blue} opacity="0.7" />
      <path d="M30 36 L54 22 M66 22 L90 36 M30 44 L54 58 M66 58 L90 44" stroke="#C4C0B8" strokeWidth="1.8" />
    </svg>
  );
}

export function RdpiIlluDoc({ className = "" }: IlluProps) {
  return (
    <svg className={className} viewBox="0 0 88 104" fill="none" aria-hidden>
      <rect x="14" y="8" width="60" height="84" rx="10" fill="white" stroke="#E5E5E0" strokeWidth="2" />
      <path d="M50 8 V28 H70" stroke={RDPI_BRAND.gold} strokeWidth="2" />
      <rect x="26" y="40" width="36" height="4" rx="2" fill={RDPI_BRAND.blue} opacity="0.75" />
      <rect x="26" y="52" width="28" height="4" rx="2" fill="#D6D3D1" />
      <rect x="26" y="64" width="32" height="4" rx="2" fill="#D6D3D1" />
      <circle cx="64" cy="76" r="10" fill={RDPI_BRAND.gold} />
      <path d="M60 76 H68 M64 72 V80" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function RdpiIlluCheck({ className = "" }: IlluProps) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <circle cx="48" cy="48" r="36" fill={RDPI_BRAND.blue} />
      <path
        d="M30 49 L42 61 L66 35"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="48" r="42" stroke={RDPI_BRAND.gold} strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

const SECTION_ILLUS = {
  profil: RdpiIlluNetwork,
  perception: RdpiIlluChart,
  impact: RdpiIlluDoc,
  climat: RdpiIlluShield,
  opportunites: RdpiIlluSunburst,
  reformes: RdpiIlluChart,
  ouvertes: RdpiIlluDoc,
} as const;

export function RdpiSectionIllu({
  sectionId,
  className = "h-14 w-14",
}: {
  sectionId: string;
  className?: string;
}) {
  const Comp =
    SECTION_ILLUS[sectionId as keyof typeof SECTION_ILLUS] ?? RdpiIlluSunburst;
  return <Comp className={className} />;
}
