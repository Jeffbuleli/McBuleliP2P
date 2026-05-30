import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { homeSeoCopy } from "@/lib/seo/site";

export async function LandingSeoSection() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const seo = homeSeoCopy(locale);

  return (
    <section
      id="africa"
      className="scroll-mt-24 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-5 sm:p-6"
      aria-labelledby="africa-h"
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
        {d.landing_presentation_eyebrow}
      </p>
      <h2
        id="africa-h"
        className="mt-2 text-balance text-lg font-black leading-snug text-[color:var(--fd-text)] sm:text-xl"
      >
        {seo.heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">{seo.intro}</p>
      <ul className="mt-4 space-y-2">
        {seo.bullets.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-xs leading-relaxed text-[color:var(--fd-text)]"
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--fd-primary)]"
              aria-hidden
            />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-[color:var(--fd-mint)]/50 px-3 py-2.5 text-[11px] leading-relaxed text-[color:var(--fd-primary)]">
        {seo.regions}
      </p>
    </section>
  );
}
