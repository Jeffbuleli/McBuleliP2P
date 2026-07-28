/** Logo silhouette for consistent grid / badge ordering. */
export type PartnerLogoShape = "wide" | "wide-bleed" | "square-bleed" | "round";

export type PartnerLogoSurface = "ecosystem" | "badge";

export type PartnerLogoTileInput = {
  shape: PartnerLogoShape;
  tileBgClass: string;
  imageScaleClass?: string;
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

export function partnerLogoTileStyles(
  logo: PartnerLogoTileInput,
  surface: PartnerLogoSurface,
): { tile: string; img: string } {
  const scale = logo.imageScaleClass ?? "";

  if (logo.shape === "round") {
    const tile =
      surface === "ecosystem"
        ? "aspect-square h-auto w-full max-w-[6.5rem] sm:max-w-[7.5rem]"
        : "aspect-square h-auto w-[4.5rem]";
    const imgScale =
      surface === "ecosystem"
        ? "scale-[1.1]"
        : scale || "scale-[1.26]";
    return {
      tile: `${tile} p-0 border-0 shadow-none ring-0`,
      img: `h-full w-full object-contain object-center ${imgScale}`,
    };
  }

  if (logo.shape === "square-bleed") {
    const tile =
      surface === "ecosystem"
        ? "aspect-square h-auto w-full max-w-[5.5rem] sm:max-w-[6.5rem]"
        : "aspect-square h-auto w-16";
    return {
      tile: `${tile} p-0 border-0 shadow-none ring-0`,
      img: "h-full w-full object-cover object-center",
    };
  }

  if (logo.shape === "wide-bleed") {
    const tile = surface === "ecosystem" ? "h-16" : "h-14 w-[7.5rem]";
    return {
      tile: `${tile} p-0 border-0 shadow-none ring-0`,
      img: "h-full w-full object-cover object-center",
    };
  }

  const tile = surface === "ecosystem" ? "h-16" : "h-14 w-[7.5rem]";
  const pad = surface === "ecosystem" ? "px-3" : "px-2";
  return {
    tile: `${tile} ${pad} border border-[color:var(--hk-border)] shadow-[0_10px_28px_-14px_var(--hk-shadow)]`,
    img:
      surface === "ecosystem"
        ? `max-h-[3.75rem] w-full max-w-[9rem] object-contain object-center ${scale || "scale-[1.14]"}`
        : `h-full w-full object-contain object-center ${scale || "scale-110"}`,
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
  if (logo.shape === "square-bleed" || logo.shape === "wide-bleed") {
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
