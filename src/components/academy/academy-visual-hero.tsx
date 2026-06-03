"use client";

import Image from "next/image";
import type { AcademyJourneyLevelKey } from "@/lib/academy-journey";

function heroSrc(levelKey: AcademyJourneyLevelKey): string {
  if (
    levelKey === "ecosystem" ||
    levelKey === "trading" ||
    levelKey === "bots" ||
    levelKey === "advanced"
  ) {
    return "/academy/hero-ecosystem.svg";
  }
  return "/academy/hero-explorer.svg";
}

export function AcademyVisualHero({
  levelKey,
  alt,
}: {
  levelKey: AcademyJourneyLevelKey;
  alt: string;
}) {
  return (
    <div className="flex justify-center">
      <Image
        src={heroSrc(levelKey)}
        alt={alt}
        width={96}
        height={96}
        className="h-20 w-20 rounded-2xl shadow-sm"
        priority
      />
    </div>
  );
}
