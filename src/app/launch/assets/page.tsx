import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/get-locale";

const ASSETS = [
  {
    file: "social-square.png",
    titleFr: "Carré · Instagram / Facebook",
    titleEn: "Square · Instagram / Facebook",
    size: "1080×1080",
  },
  {
    file: "social-landscape.png",
    titleFr: "Paysage · X / Facebook lien",
    titleEn: "Landscape · X / Facebook link",
    size: "1200×630",
  },
  {
    file: "social-story.png",
    titleFr: "Story · WhatsApp / Instagram",
    titleEn: "Story · WhatsApp / Instagram",
    size: "1080×1920",
  },
  {
    file: "jeff-portrait.png",
    titleFr: "Portrait Jeff (source)",
    titleEn: "Jeff portrait (source)",
    size: "photo",
  },
] as const;

export const metadata = {
  title: "Visuels lancement McBuleli",
  robots: { index: false, follow: false },
};

export default async function LaunchAssetsPage() {
  const locale = await getLocale();
  const fr = locale === "fr";

  return (
    <div className="home-theme fd-public-light min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-sm font-semibold text-[color:var(--fd-primary)]">
          ← mcbuleli.org
        </Link>
        <h1 className="mt-4 text-2xl font-black text-[color:var(--fd-text)]">
          {fr ? "Visuels réseaux sociaux" : "Social media assets"}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--fd-muted)]">
          {fr
            ? "Téléchargez les PNG (WhatsApp et Instagram n’affichent pas toujours les SVG). Régénérer : npm run launch:generate-social"
            : "Download PNGs (WhatsApp/Instagram often ignore SVG). Regenerate: npm run launch:generate-social"}
        </p>

        <div className="mt-6 space-y-6">
          {ASSETS.map((a) => (
            <article
              key={a.file}
              className="overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] shadow-sm"
            >
              <div className="relative aspect-video w-full bg-[color:var(--fd-mint)]">
                <Image
                  src={`/launch/${a.file}`}
                  alt={fr ? a.titleFr : a.titleEn}
                  fill
                  className="object-contain p-2"
                  unoptimized
                  sizes="100vw"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <div>
                  <p className="text-sm font-bold text-[color:var(--fd-text)]">
                    {fr ? a.titleFr : a.titleEn}
                  </p>
                  <p className="text-xs text-[color:var(--fd-muted)]">{a.size}</p>
                </div>
                <a
                  href={`/launch/${a.file}`}
                  download={a.file}
                  className="shrink-0 rounded-xl bg-[color:var(--fd-primary)] px-4 py-2 text-xs font-extrabold text-white"
                >
                  {fr ? "Télécharger" : "Download"}
                </a>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 p-4">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">
            {fr ? "Logo McBuleli (net)" : "Sharp McBuleli logo"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Image
              src="/brand/logo-512.png"
              alt="McBuleli"
              width={96}
              height={96}
              unoptimized
              className="h-24 w-24 object-contain"
            />
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="/brand/logo-512.png"
                download="mcbuleli-logo-512.png"
                className="font-semibold text-[color:var(--fd-primary)]"
              >
                logo-512.png
              </a>
              <a
                href="/brand/logo-256.png"
                download="mcbuleli-logo-256.png"
                className="font-semibold text-[color:var(--fd-primary)]"
              >
                logo-256.png
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
