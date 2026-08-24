"use client";

import Image from "next/image";
import { BRAND_LOGO_MARK_256 } from "@/lib/brand-logo";

export function LiveRemoteMeet({
  meetSlug,
  partnerName,
}: {
  meetSlug: string;
  partnerName?: string | null;
}) {
  const hostPath = `/meet/${meetSlug}/host`;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#050a08] text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src={BRAND_LOGO_MARK_256}
            alt=""
            width={36}
            height={36}
            unoptimized
            className="h-9 w-9 object-contain"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
              McBuleli Meet · Live
            </p>
            <p className="truncate text-sm font-bold">
              {partnerName ? `${partnerName} · visio` : "Visio partenaire"}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-sky-400/40 bg-sky-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-200">
          ON AIR
        </span>
      </header>
      <iframe
        title={`McBuleli Meet ${meetSlug}`}
        src={hostPath}
        className="min-h-0 flex-1 w-full border-0 bg-black"
        allow="camera; microphone; display-capture; autoplay"
      />
      <p className="shrink-0 px-4 py-2 text-center text-[10px] text-white/45">
        PC projecteur connecté staff · contrôle : /hackathon/mc
      </p>
    </div>
  );
}
