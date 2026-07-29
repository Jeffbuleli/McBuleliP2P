/** Logo silhouette for consistent grid / badge ordering. */
export type PartnerLogoShape = "wide" | "wide-bleed" | "square-bleed" | "round";

export type PartnerLogoSurface = "ecosystem" | "badge" | "detail";

export type PartnerLogoTileInput = {
  shape: PartnerLogoShape;
  tileBgClass: string;
  imageScaleClass?: string;
  fit?: "contain" | "cover";
};

const SHAPE_ORDER: Record<PartnerLogoShape, number> = {
  wide: 0,
  "wide-bleed": 1,
  "square-bleed": 2,
  round: 3,
};

export function sortFeaturedPartnersByShape<T extends { shape: PartnerLogoShape }>(
  logos: T[],
): T[] {
  return [...logos].sort(
    (a, b) => SHAPE_ORDER[a.shape] - SHAPE_ORDER[b.shape],
  );
}

export function partnerLogoBorderless(logo: PartnerLogoTileInput): boolean {
  return (
    logo.shape === "wide-bleed" ||
    logo.shape === "square-bleed" ||
    logo.shape === "round"
  );
}

function squareBleedImg(logo: PartnerLogoTileInput, surface: PartnerLogoSurface): string {
  const scale = logo.imageScaleClass ?? "";
  if (logo.fit === "contain") {
    const fallback =
      surface === "ecosystem"
        ? "scale-[1.06]"
        : surface === "badge"
          ? "scale-[1.08]"
          : "scale-[1.12]";
    return `h-full w-full object-contain object-center ${scale || fallback}`;
  }
  return "h-full w-full object-cover object-center";
}

/**
 * Uniform tile sizes per surface so ecosystem / tickets / badges stay visually ordered
 * (wide strip → wide-bleed → square → round).
 */
export function partnerLogoTileStyles(
  logo: PartnerLogoTileInput,
  surface: PartnerLogoSurface,
): { tile: string; img: string } {
  const scale = logo.imageScaleClass ?? "";

  if (logo.shape === "round") {
    const tile =
      surface === "detail"
        ? "aspect-square h-auto w-[8rem] shrink-0 sm:w-[9rem]"
        : surface === "ecosystem"
          ? "aspect-square h-[5.5rem] w-[5.5rem] shrink-0 sm:h-[6.25rem] sm:w-[6.25rem]"
          : "aspect-square h-11 w-11 shrink-0";
    const imgScale =
      surface === "detail"
        ? scale || "scale-[1.18]"
        : surface === "ecosystem"
          ? scale || "scale-[1.1]"
          : scale || "scale-[1.12]";
    return {
      tile: `${tile} p-0 border-0 shadow-none ring-0`,
      img: `h-full w-full object-contain object-center ${imgScale}`,
    };
  }

  if (logo.shape === "square-bleed") {
    const tile =
      surface === "detail"
        ? "aspect-square h-auto w-[8rem] shrink-0 sm:w-[9rem]"
        : surface === "ecosystem"
          ? "aspect-square h-[5.5rem] w-[5.5rem] shrink-0 sm:h-[6.25rem] sm:w-[6.25rem]"
          : "aspect-square h-11 w-11 shrink-0";
    return {
      tile: `${tile} p-0 border-0 shadow-none ring-0`,
      img: squareBleedImg(logo, surface),
    };
  }

  if (logo.shape === "wide-bleed") {
    const tile =
      surface === "detail"
        ? "h-[4.25rem] w-full max-w-[15rem] shrink-0 sm:h-[4.75rem] sm:max-w-[17rem]"
        : surface === "ecosystem"
          ? "h-16 w-full"
          : "h-11 w-[6.75rem] shrink-0";
    return {
      tile: `${tile} p-0 border-0 shadow-none ring-0`,
      img: "h-full w-full object-cover object-center",
    };
  }

  // wide (wordmarks with padding + border)
  const tile =
    surface === "detail"
      ? "h-[4.25rem] w-full max-w-[15rem] shrink-0 sm:h-[4.75rem] sm:max-w-[17rem]"
      : surface === "ecosystem"
        ? "h-16 w-full"
        : "h-11 w-[6.75rem] shrink-0";
  const pad =
    surface === "detail" ? "px-3 py-2" : surface === "ecosystem" ? "px-2.5" : "px-1.5";
  const bordered = surface === "detail" || surface === "ecosystem" || surface === "badge";
  return {
    tile: bordered
      ? `${tile} ${pad} border border-[color:var(--hk-border)] shadow-[0_8px_22px_-12px_var(--hk-shadow)]`
      : `${tile} ${pad}`,
    img:
      surface === "ecosystem"
        ? `max-h-[3.25rem] w-full object-contain object-center ${scale || "scale-[1.06]"}`
        : `h-full w-full object-contain object-center ${scale || (surface === "detail" ? "scale-[1.08]" : "scale-[1.05]")}`,
  };
}

export function partnerLogoBadgeBox(logo: PartnerLogoTileInput): string {
  if (partnerLogoBorderless(logo)) {
    return `border-0 shadow-none ring-0 ${logo.tileBgClass}`;
  }
  return `border border-[#E5E5E0] shadow-[0_10px_28px_-14px_rgba(34,34,34,0.35)] ${logo.tileBgClass}`;
}

/** Square avatar frame + image classes for partner chat roster. */
export function partnerLogoChatStyles(logo: PartnerLogoTileInput): {
  frame: string;
  img: string;
} {
  const scale = logo.imageScaleClass ?? "";
  const borderless =
    partnerLogoBorderless(logo) ||
    /bg-\[#0c0a09\]|bg-\[#0B0E11\]|bg-\[#2e5506\]/i.test(logo.tileBgClass);
  const frame = borderless
    ? `${logo.tileBgClass} ring-0`
    : `${logo.tileBgClass} ring-1 ring-[color:var(--hk-border)]`;

  if (logo.shape === "round") {
    return {
      frame,
      img: `h-full w-full object-contain object-center ${scale || "scale-[1.15]"}`,
    };
  }
  if (logo.shape === "square-bleed") {
    return {
      frame,
      img:
        logo.fit === "contain"
          ? `h-full w-full object-contain object-center ${scale || "scale-[1.1]"}`
          : "h-full w-full object-cover object-center",
    };
  }
  if (logo.shape === "wide-bleed") {
    return {
      frame,
      img: "h-full w-full object-cover object-center",
    };
  }
  return {
    frame,
    img: "h-full w-full object-contain object-center p-0.5",
  };
}
