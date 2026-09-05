import type { Metadata } from "next";
import Link from "next/link";
import { PwaInstallButton } from "@/components/pwa-install";

export const metadata: Metadata = {
  title: "Installer NGEMBA RDC",
  description:
    "Installer NGEMBA RDC sur l'écran d'accueil (PWA) - même expérience que le site.",
};

/** Install guide - PWA only (no APK). */
export default function TelechargerPage() {
  return (
    <main className="min-h-dvh bg-ng-bg px-4 py-10 text-ng-text">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <Link href="/" className="text-sm font-semibold text-ng-muted hover:text-ng-primary">
          ← Retour
        </Link>

        <div className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt="NGEMBA"
              width={56}
              height={56}
              className="rounded-xl object-contain"
            />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-ng-primary">
                Installer NGEMBA RDC
              </h1>
              <p className="text-sm text-ng-muted">Application web (PWA)</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ng-muted">
            Ajoutez NGEMBA à l&apos;écran d&apos;accueil de votre téléphone. Vous
            ouvrez la même expérience que sur{" "}
            <span className="font-semibold text-ng-primary">ngemba-rdc.org</span>
            , sans télécharger d&apos;APK.
          </p>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ng-text">
            <li>
              Android (Chrome) : menu ⋮ → <strong>Installer l&apos;application</strong>.
            </li>
            <li>
              iPhone (Safari) : Partager → <strong>Sur l&apos;écran d&apos;accueil</strong>.
            </li>
            <li>Ouvrez l&apos;icône <strong>Ngemba RDC</strong> comme une app.</li>
          </ol>

          <PwaInstallButton
            label="Installer"
            iosHint="Sur iPhone : ouvrez ce site dans Safari, puis Partager → Sur l'écran d'accueil."
            manualHint="Le navigateur propose souvent l'installation lui-même. Sinon : menu → Installer l'application / Ajouter à l'écran d'accueil."
          />
        </div>
      </div>
    </main>
  );
}
