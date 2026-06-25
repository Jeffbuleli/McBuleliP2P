import Image from "next/image";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { LANDING_PARTNERS } from "@/lib/partner-logos";

export async function LandingPartnersSection() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  const items = LANDING_PARTNERS.map((p) => ({
    id: p.id,
    logo: p.logo,
    label: d[p.labelKey as keyof typeof d] as string,
  }));

  const marqueeRow = [...items, ...items];

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

      <div className="landing-partners-marquee mt-6 overflow-hidden py-2">
        <div className="landing-partners-marquee-track flex w-max items-center gap-10 px-4">
          {marqueeRow.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="group flex shrink-0 flex-col items-center gap-2"
              title={p.label}
            >
              <div className="relative flex h-12 w-28 items-center justify-center opacity-80 transition group-hover:opacity-100">
                <Image
                  src={p.logo}
                  alt={p.label}
                  width={112}
                  height={48}
                  className="max-h-10 w-auto max-w-[112px] object-contain"
                  unoptimized
                />
              </div>
              <p className="max-w-[7rem] truncate text-center text-[9px] font-semibold text-[color:var(--fd-muted)] opacity-0 transition group-hover:opacity-100">
                {p.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] text-[color:var(--fd-muted)]">{d.landing_partners_footnote}</p>
    </section>
  );
}
