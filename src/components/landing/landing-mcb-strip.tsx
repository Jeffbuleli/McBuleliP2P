import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getMcbClaimPublicConfig } from "@/lib/mcb-token-config";

function McbTokenSvg({ className }: { className?: string }) {
  const primary = "var(--fd-primary)";
  const mint = "var(--fd-mint)";

  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden>
      <circle cx="60" cy="60" r="52" fill={mint} fillOpacity="0.5" />
      <circle cx="60" cy="60" r="38" fill="white" stroke={primary} strokeWidth="2.5" />
      <text x="60" y="56" textAnchor="middle" fill={primary} fontSize="16" fontWeight="900">
        McB
      </text>
      <text x="60" y="74" textAnchor="middle" fill={primary} fontSize="9" fontWeight="700" opacity="0.7">
        BEP-20
      </text>
    </svg>
  );
}

export async function LandingMcbStrip() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const cfg = getMcbClaimPublicConfig();

  if (!cfg.preview && !cfg.contractAddress) return null;

  const ratioLabel = d.landing_mcb_ratio.replace("{n}", String(cfg.bpPerMcb));

  return (
    <section
      id="mcb"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-[color:var(--fd-primary)]/20 bg-gradient-to-r from-[color:var(--fd-mint)] via-white to-[color:var(--fd-mint)] p-5 sm:p-6"
      aria-labelledby="mcb-h"
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <McbTokenSvg className="h-24 w-24 shrink-0" />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
            {d.landing_mcb_eyebrow}
          </p>
          <h2 id="mcb-h" className="mt-1 text-lg font-black text-[color:var(--fd-text)]">
            {d.landing_mcb_heading}
          </h2>
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-primary)]/20">
              {ratioLabel}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[color:var(--fd-muted)] ring-1 ring-[color:var(--fd-border)]">
              {d.landing_mcb_chain}
            </span>
          </div>
        </div>
        <Link
          href="/register"
          prefetch={false}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[color:var(--fd-primary)] px-5 text-xs font-extrabold text-white shadow-lg shadow-[color:var(--fd-primary)]/20 active:scale-[0.99]"
        >
          {d.landing_cta_primary}
        </Link>
      </div>
    </section>
  );
}
