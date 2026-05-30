import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/get-locale";
import { getLandingPromosConfig, resolveLandingPromos } from "@/lib/landing-promos";

export async function LandingPromoStrip() {
  const locale = await getLocale();
  const config = await getLandingPromosConfig();
  const { heading, promos } = resolveLandingPromos(config, locale);

  if (promos.length === 0) return null;

  return (
    <section className="mt-5" aria-labelledby="landing-promos-h">
      <h2
        id="landing-promos-h"
        className="text-center text-sm font-black text-[color:var(--fd-text)]"
      >
        {heading}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {promos.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            prefetch={false}
            className="group overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] shadow-sm transition hover:border-[color:var(--fd-primary)]/30 hover:shadow-md active:scale-[0.99]"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image
                src={p.image}
                alt={p.title}
                fill
                className="object-cover transition group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 50vw, 25vw"
                unoptimized={p.image.startsWith("http")}
              />
            </div>
            <div className="px-2 py-2">
              <p className="text-[11px] font-extrabold leading-tight text-[color:var(--fd-text)]">
                {p.title}
              </p>
              <p className="mt-0.5 text-[9px] font-medium text-[color:var(--fd-muted)]">
                {p.tag}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
