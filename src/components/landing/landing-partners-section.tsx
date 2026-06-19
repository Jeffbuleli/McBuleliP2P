import Image from "next/image";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { LANDING_PARTNERS } from "@/lib/partner-logos";

export async function LandingPartnersSection() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <section
      id="partners"
      className="scroll-mt-24 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-5 sm:p-6"
      aria-labelledby="partners-h"
    >
      <div className="text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
          {d.landing_partners_eyebrow}
        </p>
        <h2 id="partners-h" className="mt-1 text-lg font-black text-[color:var(--fd-text)] sm:text-xl">
          {d.landing_partners_heading}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[color:var(--fd-muted)]">
          {d.landing_partners_sub}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {LANDING_PARTNERS.map((p) => {
          const label = d[p.labelKey as keyof typeof d] as string;
          return (
            <div
              key={p.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-[color:var(--fd-border)] bg-white p-3 shadow-sm transition hover:border-[color:var(--fd-primary)]/20"
            >
              <div className="relative flex h-12 w-full items-center justify-center">
                <Image
                  src={p.logo}
                  alt={label}
                  width={96}
                  height={40}
                  className="max-h-10 w-auto max-w-[96px] object-contain"
                  unoptimized
                />
              </div>
              <p className="text-center text-[10px] font-semibold text-[color:var(--fd-muted)]">{label}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[10px] text-[color:var(--fd-muted)]">{d.landing_partners_footnote}</p>
    </section>
  );
}
