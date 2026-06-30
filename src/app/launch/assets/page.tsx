import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/get-locale";

const ASSETS = [
  {
    file: "hero-mobile.png",
    aspect: "aspect-[4/5]",
    titleFr: "Accueil mobile (PWA)",
    titleEn: "Mobile homepage (PWA)",
    size: "1080×1350",
    hintFr: "Bannière pleine largeur — rien ne se coupe",
    hintEn: "Full-width banner — no cropping",
  },
  {
    file: "social-story.png",
    aspect: "aspect-[9/16] max-h-[min(70vh,640px)]",
    titleFr: "Story · WhatsApp / Instagram",
    titleEn: "Story · WhatsApp / Instagram",
    size: "1080×1920",
    hintFr: "Statut WhatsApp, reels, stories",
    hintEn: "WhatsApp status, reels, stories",
  },
  {
    file: "social-square.png",
    aspect: "aspect-square max-h-[min(70vh,480px)]",
    titleFr: "Carré · Instagram / Facebook",
    titleEn: "Square · Instagram / Facebook",
    size: "1080×1080",
    hintFr: "Post feed carré",
    hintEn: "Square feed post",
  },
  {
    file: "social-landscape.png",
    aspect: "aspect-[1200/630]",
    titleFr: "Paysage · X / Facebook",
    titleEn: "Landscape · X / Facebook",
    size: "1200×630",
    hintFr: "Lien partagé, couverture event",
    hintEn: "Link preview, event cover",
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
    <div className="home-theme fd-public-light min-h-dvh pb-12">
      <div className="border-b border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Image
            src="/brand/logo-256.png"
            alt="McBuleli"
            width={48}
            height={48}
            unoptimized
            className="h-12 w-12 shrink-0 rounded-full bg-white object-contain p-0.5 shadow-sm ring-2 ring-[color:var(--fd-primary)]/20"
          />
          <div className="min-w-0 flex-1">
            <Link
              href="/"
              className="text-xs font-semibold text-[color:var(--fd-primary)]"
            >
              ← mcbuleli.org
            </Link>
            <h1 className="truncate text-lg font-black text-[color:var(--fd-text)]">
              {fr ? "Visuels lancement" : "Launch assets"}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-6">
        <p className="text-sm leading-relaxed text-[color:var(--fd-muted)]">
          {fr
            ? "PNG haute définition — téléchargez et publiez directement. Les fichiers SVG restent dans public/launch/ pour édition sur Mac."
            : "High-definition PNGs — download and publish directly. SVG sources remain in public/launch/ for editing on Mac."}
        </p>

        <div className="mt-6 space-y-8">
          {ASSETS.map((a) => (
            <article
              key={a.file}
              className="overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] shadow-md"
            >
              <div
                className={`relative w-full bg-[#1a2e1c] ${a.aspect} mx-auto`}
              >
                <Image
                  src={`/launch/${a.file}`}
                  alt={fr ? a.titleFr : a.titleEn}
                  fill
                  className="object-contain"
                  unoptimized
                  quality={100}
                  sizes="(max-width: 672px) 100vw, 672px"
                />
              </div>
              <div className="border-t border-[color:var(--fd-border)] p-4">
                <p className="text-base font-extrabold text-[color:var(--fd-text)]">
                  {fr ? a.titleFr : a.titleEn}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[color:var(--fd-muted)]">
                  {a.size} · {fr ? a.hintFr : a.hintEn}
                </p>
                <a
                  href={`/launch/${a.file}`}
                  download={a.file}
                  className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[color:var(--fd-primary)] text-sm font-extrabold text-white shadow-md active:scale-[0.99]"
                >
                  {fr ? "Télécharger PNG" : "Download PNG"}
                </a>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-10 rounded-2xl border-2 border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)]/50 p-5">
          <p className="text-sm font-extrabold text-[color:var(--fd-text)]">
            {fr ? "Logo McBuleli (1024px)" : "McBuleli logo (1024px)"}
          </p>
          <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
            {fr
              ? "Version nette pour partage et impression"
              : "Sharp version for sharing and print"}
          </p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
            <Image
              src="/brand/logo-512.png"
              alt="McBuleli"
              width={128}
              height={128}
              unoptimized
              className="h-32 w-32 rounded-2xl bg-white object-contain p-2 shadow-lg"
            />
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              {[
                ["logo-1024.png", "/brand/logo-1024.png"],
                ["logo-512.png", "/brand/logo-512.png"],
                ["logo-256.png", "/brand/logo-256.png"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  download={label}
                  className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-4 py-2.5 text-center text-sm font-bold text-[color:var(--fd-primary)]"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-[11px] text-[color:var(--fd-muted)]">
          {fr ? "Régénérer : " : "Regenerate: "}
          <code className="rounded bg-[color:var(--fd-mint)] px-1.5 py-0.5 text-[color:var(--fd-primary)]">
            npm run launch:generate-social
          </code>
        </p>
      </div>
    </div>
  );
}
