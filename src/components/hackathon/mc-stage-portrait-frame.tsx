"use client";

import Image from "next/image";

export type StagePortraitTone = "gold" | "ivory";

/** Framed studio portrait for Live MC (Patty / Jeff). */
export function McStagePortraitFrame({
  src,
  alt,
  tone = "gold",
  size = "stage",
}: {
  src: string;
  alt: string;
  tone?: StagePortraitTone;
  size?: "stage" | "slide";
}) {
  const ring =
    tone === "ivory"
      ? "from-[#f5ead6] via-[#d4af6a] to-[#8a6a32]"
      : "from-[#f8e7b0] via-[#c9a227] to-[#1F6B43]";
  const glow =
    tone === "ivory"
      ? "shadow-[0_0_0_1px_rgba(212,175,106,0.45),0_28px_70px_-24px_rgba(90,70,30,0.55)]"
      : "shadow-[0_0_0_1px_rgba(201,162,39,0.4),0_28px_70px_-24px_rgba(31,107,67,0.5)]";
  const box =
    size === "slide"
      ? "h-[min(52vh,380px)] w-[min(78%,300px)] sm:h-[min(56vh,420px)] sm:w-[320px]"
      : "h-[min(48vh,340px)] w-[min(72%,280px)] sm:h-[min(52vh,400px)] sm:w-[300px]";

  return (
    <div className={`relative mx-auto ${box}`}>
      <div
        aria-hidden
        className={`absolute -inset-3 rounded-[2rem] bg-gradient-to-br ${ring} opacity-80 blur-[2px]`}
      />
      <div
        className={`relative h-full w-full overflow-hidden rounded-[1.65rem] bg-[#1a1a1a] p-[3px] ${glow}`}
      >
        <div className={`h-full w-full overflow-hidden rounded-[1.5rem] bg-gradient-to-br ${ring} p-[2px]`}>
          <div className="relative h-full w-full overflow-hidden rounded-[1.4rem] bg-[#141414]">
            <Image
              src={src}
              alt={alt}
              fill
              unoptimized
              sizes="320px"
              className="object-cover object-[center_12%]"
              priority
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
