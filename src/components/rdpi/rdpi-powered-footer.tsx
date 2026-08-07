"use client";

import Link from "next/link";
import { BRAND_LOGO_MARK_256 } from "@/lib/brand-logo";
import { SUPPORT_X } from "@/lib/support-contact";
import { RDPI_BRAND } from "@/lib/rdpi/survey-questions";

/** Same pattern as McBuleliPoweredFooter / hackathon badges: Powered by (logo) McBuleli → X. */
export function RdpiPoweredFooter() {
  return (
    <footer className="mt-12 flex flex-col items-center gap-2 border-t border-[#E5E5E0] pt-8 pb-2 text-center">
      <div className="flex items-center gap-2 text-[11px] text-[#78716c]">
        <span className="font-medium">Powered by</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_LOGO_MARK_256}
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] rounded-full bg-white p-0.5 ring-1 ring-[#305f33]/15"
        />
        <Link
          href={SUPPORT_X}
          target="_blank"
          rel="noopener noreferrer"
          className="font-extrabold text-[#305f33] hover:underline"
        >
          McBuleli
        </Link>
      </div>
      <p className="text-[11px] text-[#a8a29e]">
        Plateforme d&apos;enquête pour {RDPI_BRAND.name}
      </p>
    </footer>
  );
}
