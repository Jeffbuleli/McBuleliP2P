"use client";

import Image from "next/image";
import { HudCornerBrackets } from "@/components/ui/hud-corners";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";

/** McBuleli mark - white disc + icon, optional tiny animated HUD corners. */
export function McBuleliLogoMark({
  size = 40,
  animated = false,
  corners = false,
  className = "",
}: {
  size?: number;
  animated?: boolean;
  corners?: boolean;
  className?: string;
}) {
  const white = Math.round(size * 0.82);
  const img = Math.round(white * 0.76);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="absolute rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
        style={{ width: white, height: white }}
      />
      <Image
        src={BRAND_LOGO_256}
        alt=""
        width={img}
        height={img}
        className="relative z-[1] object-contain"
        style={{ width: img, height: img }}
        priority
        unoptimized
      />
      {corners ? (
        <HudCornerBrackets
          tone="spectral"
          size="xs"
          animated={animated}
          className="-inset-[5%]"
        />
      ) : null}
    </div>
  );
}
