import type { Metadata } from "next";
import Link from "next/link";
import { NGEMBA_APK_BUILD_PAGE } from "@/lib/apk";

export const metadata: Metadata = {
  title: "Installer NGEMBA RDC (Android)",
  description: "Télécharger l'application Android NGEMBA RDC - sécurité citoyenne.",
};

/** Install guide - own-domain APK reduces third-party “dangerous link” flags. */
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
              src="/brand/ngemba-logo.png"
              alt="NGEMBA"
              width={56}
              height={56}
              className="rounded-xl bg-white object-contain p-1.5"
            />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-ng-primary">
                Installer NGEMBA RDC
              </h1>
              <p className="text-sm text-ng-muted">Android · APK officiel</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ng-muted">
            Android peut afficher un avertissement (« fichier dangereux » ou
            « source inconnue ») pour toute application installée hors Play Store.
            C&apos;est normal pour un APK pilote signé par NGEMBA.
          </p>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ng-text">
            <li>Téléchargez l&apos;APK depuis ce site (lien ci-dessous).</li>
            <li>Ouvrez le fichier dans vos Téléchargements.</li>
            <li>Autorisez l&apos;installation si Android le demande.</li>
            <li>Ouvrez <strong>Ngemba RDC</strong> et acceptez la localisation si proposé.</li>
          </ol>

          <a
            href="/downloads/ngemba-rdc.apk"
            download="ngemba-rdc.apk"
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-ng-primary px-4 text-center text-sm font-bold text-white"
          >
            Télécharger l&apos;APK NGEMBA
          </a>

          <p className="mt-3 text-center text-xs text-ng-muted">
            Fichier hébergé sur{" "}
            <span className="font-semibold text-ng-primary">ngemba-rdc.org</span>
            {" · "}
            <a
              href={NGEMBA_APK_BUILD_PAGE}
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              détails du build
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
