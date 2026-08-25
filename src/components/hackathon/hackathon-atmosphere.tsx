"use client";

import { useId } from "react";

/**
 * Single Kinshasa landmark row — pixel / ticket-watermark glyphs.
 * Drawn as integer rectangles (not photo assets). viewBox 0 0 960 300.
 */
function KinshasaPixelSkylineOnce({
  fill = "#1F6B43",
  opacity = 0.11,
}: {
  fill?: string;
  opacity?: number;
}) {
  return (
    <g fill={fill} opacity={opacity}>
      {/* Ground */}
      <rect x="0" y="286" width="960" height="4" />
      <rect x="0" y="292" width="960" height="8" opacity={0.35} />

      {/* Place de l’Échangeur — canopy + star */}
      <rect x="28" y="210" width="4" height="76" />
      <rect x="72" y="210" width="4" height="76" />
      <rect x="40" y="210" width="4" height="76" />
      <rect x="60" y="210" width="4" height="76" />
      <rect x="24" y="206" width="56" height="6" />
      <rect x="28" y="198" width="48" height="8" />
      <rect x="34" y="190" width="36" height="8" />
      <rect x="44" y="168" width="16" height="22" />
      <rect x="48" y="156" width="8" height="12" />
      <rect x="40" y="176" width="24" height="4" />
      <rect x="36" y="180" width="4" height="4" />
      <rect x="64" y="180" width="4" height="4" />
      <rect x="50" y="148" width="4" height="8" />

      {/* Cathédrale Notre-Dame — nave + clock tower */}
      <rect x="108" y="230" width="72" height="56" />
      <rect x="112" y="238" width="8" height="16" />
      <rect x="128" y="238" width="8" height="16" />
      <rect x="152" y="238" width="8" height="16" />
      <rect x="168" y="238" width="8" height="16" />
      <rect x="130" y="168" width="28" height="62" />
      <rect x="134" y="148" width="20" height="20" />
      <rect x="138" y="136" width="12" height="12" />
      <rect x="142" y="120" width="4" height="16" />
      <rect x="140" y="178" width="8" height="8" />
      <rect x="108" y="224" width="72" height="6" />

      {/* Palais de la Nation — pediment + columns */}
      <rect x="200" y="232" width="120" height="54" />
      <rect x="204" y="220" width="112" height="12" />
      <rect x="236" y="200" width="48" height="20" />
      <rect x="248" y="188" width="24" height="12" />
      <rect x="212" y="242" width="6" height="36" />
      <rect x="228" y="242" width="6" height="36" />
      <rect x="244" y="242" width="6" height="36" />
      <rect x="260" y="242" width="6" height="36" />
      <rect x="276" y="242" width="6" height="36" />
      <rect x="292" y="242" width="6" height="36" />
      <rect x="308" y="242" width="6" height="36" />

      {/* Tour contrôle / petite tour */}
      <rect x="340" y="200" width="28" height="86" />
      <rect x="336" y="196" width="36" height="8" />
      <rect x="348" y="176" width="12" height="20" />
      <rect x="352" y="164" width="4" height="12" />

      {/* Sainte-Anne — arches + steeple */}
      <rect x="388" y="228" width="56" height="58" />
      <rect x="392" y="236" width="10" height="20" />
      <rect x="410" y="236" width="10" height="20" />
      <rect x="428" y="236" width="10" height="20" />
      <rect x="432" y="160" width="16" height="68" />
      <rect x="436" y="140" width="8" height="20" />
      <rect x="438" y="124" width="4" height="16" />
      <rect x="388" y="222" width="56" height="6" />

      {/* Tour Limete / Échangeur — mast + platforms */}
      <rect x="492" y="48" width="10" height="238" />
      <rect x="480" y="72" width="34" height="8" />
      <rect x="484" y="92" width="26" height="6" />
      <rect x="486" y="110" width="22" height="6" />
      <rect x="488" y="128" width="18" height="6" />
      <rect x="490" y="40" width="14" height="8" />
      <rect x="496" y="16" width="2" height="24" />
      <rect x="494" y="8" width="6" height="8" />

      {/* Pont haubané — pylons + cables */}
      <rect x="540" y="168" width="8" height="118" />
      <rect x="620" y="168" width="8" height="118" />
      <rect x="536" y="164" width="16" height="8" />
      <rect x="616" y="164" width="16" height="8" />
      <rect x="548" y="176" width="72" height="4" />
      <rect x="552" y="184" width="8" height="4" />
      <rect x="564" y="192" width="8" height="4" />
      <rect x="576" y="200" width="8" height="4" />
      <rect x="588" y="192" width="8" height="4" />
      <rect x="600" y="184" width="8" height="4" />
      <rect x="556" y="208" width="4" height="4" />
      <rect x="568" y="220" width="4" height="4" />
      <rect x="580" y="232" width="4" height="4" />
      <rect x="592" y="220" width="4" height="4" />
      <rect x="604" y="208" width="4" height="4" />
      <rect x="532" y="268" width="104" height="6" />
      <rect x="532" y="278" width="104" height="4" />

      {/* Tour Gombe / Sozacom — façade pixels */}
      <rect x="680" y="120" width="56" height="166" />
      <rect x="686" y="128" width="4" height="148" />
      <rect x="698" y="128" width="4" height="148" />
      <rect x="710" y="128" width="4" height="148" />
      <rect x="722" y="128" width="4" height="148" />
      <rect x="684" y="112" width="48" height="8" />
      <rect x="688" y="148" width="40" height="2" />
      <rect x="688" y="172" width="40" height="2" />
      <rect x="688" y="196" width="40" height="2" />
      <rect x="688" y="220" width="40" height="2" />
      <rect x="688" y="244" width="40" height="2" />

      {/* Petit immeuble classique (fin de rangée) */}
      <rect x="760" y="220" width="44" height="66" />
      <rect x="764" y="208" width="36" height="12" />
      <rect x="772" y="196" width="20" height="12" />
      <rect x="768" y="236" width="6" height="28" />
      <rect x="780" y="236" width="6" height="28" />
      <rect x="792" y="236" width="6" height="28" />

      {/* Immeuble bas de clôture */}
      <rect x="820" y="248" width="100" height="38" />
      <rect x="828" y="256" width="8" height="14" />
      <rect x="848" y="256" width="8" height="14" />
      <rect x="868" y="256" width="8" height="14" />
      <rect x="888" y="256" width="8" height="14" />
      <rect x="908" y="256" width="8" height="14" />
    </g>
  );
}

/** Compact tiled skyline for badge / ticket cards. */
function KinshasaPixelSkylineTile({
  id,
  opacity = 0.07,
}: {
  id: string;
  opacity?: number;
}) {
  const fill = "#1F6B43";
  return (
    <pattern
      id={id}
      width="168"
      height="56"
      patternUnits="userSpaceOnUse"
    >
      <g fill={fill} opacity={opacity}>
        <rect x="0" y="52" width="168" height="2" />
        <rect x="6" y="28" width="2" height="24" />
        <rect x="4" y="26" width="6" height="2" />
        <rect x="5" y="22" width="4" height="4" />
        <rect x="6" y="18" width="2" height="4" />
        <rect x="18" y="34" width="14" height="18" />
        <rect x="22" y="22" width="6" height="12" />
        <rect x="23" y="16" width="4" height="6" />
        <rect x="24" y="12" width="2" height="4" />
        <rect x="38" y="36" width="28" height="16" />
        <rect x="40" y="32" width="24" height="4" />
        <rect x="48" y="28" width="8" height="4" />
        <rect x="42" y="40" width="2" height="10" />
        <rect x="48" y="40" width="2" height="10" />
        <rect x="54" y="40" width="2" height="10" />
        <rect x="60" y="40" width="2" height="10" />
        <rect x="74" y="6" width="3" height="46" />
        <rect x="70" y="14" width="11" height="2" />
        <rect x="71" y="20" width="9" height="2" />
        <rect x="72" y="26" width="7" height="2" />
        <rect x="90" y="32" width="12" height="20" />
        <rect x="94" y="18" width="4" height="14" />
        <rect x="95" y="12" width="2" height="6" />
        <rect x="110" y="30" width="2" height="22" />
        <rect x="128" y="30" width="2" height="22" />
        <rect x="110" y="30" width="20" height="2" />
        <rect x="140" y="20" width="12" height="32" />
        <rect x="142" y="24" width="1" height="24" />
        <rect x="145" y="24" width="1" height="24" />
        <rect x="148" y="24" width="1" height="24" />
      </g>
    </pattern>
  );
}

/** Soft mint wash + Kinshasa watermark (badges / tickets / Live). */
export function HackathonAtmosphere({
  className = "",
  decorated = false,
  /** `card` = badge tile. `page` = one skyline from bottom to mid. */
  variant = "card",
}: {
  className?: string;
  decorated?: boolean;
  variant?: "card" | "page";
}) {
  const uid = useId().replace(/:/g, "");
  const wash = `hk-wash-${uid}`;
  const dots = `hk-dots-${uid}`;
  const hex = `hk-hex-${uid}`;
  const kin = `hk-kin-${uid}`;

  if (variant === "page") {
    return (
      <div
        className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "radial-gradient(circle, rgba(31,107,67,0.045) 1.1px, transparent 1.35px)",
              "linear-gradient(180deg, rgba(234,246,238,0.55) 0%, transparent 28%, transparent 58%, rgba(234,246,238,0.35) 100%)",
              "linear-gradient(135deg, rgba(234,246,238,0.2) 0%, transparent 42%, rgba(238,242,255,0.08) 100%)",
            ].join(", "),
            backgroundSize: "20px 20px, 100% 100%, 100% 100%",
            backgroundRepeat: "repeat, no-repeat, no-repeat",
          }}
        />
        {/* Single skyline — bottom → mid, not a mosaic */}
        <svg
          className="absolute inset-x-0 bottom-0 h-[58%] w-full min-h-[240px]"
          viewBox="0 0 960 300"
          preserveAspectRatio="xMidYMax meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <KinshasaPixelSkylineOnce opacity={0.16} />
        </svg>
        {/* Soft top mist — leave skyline readable in lower half */}
        <div
          className="absolute inset-x-0 top-0 h-[28%]"
          style={{
            background:
              "linear-gradient(180deg, #FAFAF8 0%, rgba(250,250,248,0.55) 55%, transparent 100%)",
          }}
        />
      </div>
    );
  }

  return (
    <svg
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${className}`}
      viewBox="0 0 400 680"
      fill="none"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={dots} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="0.9" fill="#1F6B43" opacity="0.07" />
        </pattern>
        <linearGradient id={wash} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EAF6EE" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#FAFAF8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0.28" />
        </linearGradient>
        <pattern id={hex} width="28" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M14 2l10 6v8l-10 6L4 16V8z"
            stroke="#1F6B43"
            strokeOpacity="0.05"
            fill="none"
          />
        </pattern>
        <KinshasaPixelSkylineTile id={kin} opacity={0.08} />
      </defs>
      <rect width="400" height="680" fill={`url(#${wash})`} />
      <rect width="400" height="680" fill={`url(#${dots})`} />
      <rect width="400" height="680" fill={`url(#${hex})`} />
      <rect width="400" height="680" fill={`url(#${kin})`} />
      {decorated ? (
        <>
          <rect y="100" width="400" height="72" fill={`url(#${kin})`} opacity="1.5" />
          <rect y="560" width="400" height="80" fill={`url(#${kin})`} opacity="1.25" />
          <circle cx="348" cy="220" r="64" stroke="#1F6B43" strokeOpacity="0.06" />
          <circle cx="52" cy="420" r="46" stroke="#1F6B43" strokeOpacity="0.08" />
        </>
      ) : null}
    </svg>
  );
}
