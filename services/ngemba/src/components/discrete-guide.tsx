"use client";

import Link from "next/link";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { messages } from "@/lib/i18n";
import {
  citizenPagePad,
  citizenShellMaxWidth,
  useDeviceClass,
} from "@/lib/ui/device";

function SvgTripleTap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 88"
      className={className}
      fill="none"
      aria-hidden
    >
      <rect
        x="38"
        y="14"
        width="44"
        height="44"
        rx="22"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="60" cy="36" r="10" fill="currentColor" fillOpacity="0.85" />
      <path
        d="M78 28c6-2 12 2 14 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M80 22c8-3 16 3 18 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle cx="34" cy="72" r="4" fill="currentColor" opacity="0.35" />
      <circle cx="48" cy="72" r="4" fill="currentColor" opacity="0.55" />
      <circle cx="62" cy="72" r="4" fill="currentColor" />
      <text
        x="78"
        y="76"
        fill="currentColor"
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        ×3
      </text>
    </svg>
  );
}

function SvgLongPress({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 88"
      className={className}
      fill="none"
      aria-hidden
    >
      <rect
        x="38"
        y="14"
        width="44"
        height="44"
        rx="22"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="60" cy="36" r="10" fill="currentColor" fillOpacity="0.85" />
      <path
        d="M60 8a28 28 0 0 1 28 28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M60 14a22 22 0 0 1 22 22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <text
        x="60"
        y="76"
        textAnchor="middle"
        fill="currentColor"
        fontSize="12"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        ~0,65 s
      </text>
    </svg>
  );
}

function SvgCorners({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 88"
      className={className}
      fill="none"
      aria-hidden
    >
      <rect
        x="22"
        y="10"
        width="76"
        height="58"
        rx="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <circle cx="30" cy="60" r="6" fill="currentColor" />
      <text
        x="30"
        y="78"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        1
      </text>
      <circle cx="90" cy="60" r="6" fill="currentColor" opacity="0.85" />
      <text
        x="90"
        y="78"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        2
      </text>
      <circle cx="30" cy="18" r="6" fill="currentColor" opacity="0.7" />
      <text
        x="42"
        y="21"
        fill="currentColor"
        fontSize="9"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        3
      </text>
      <path
        d="M36 58h48M84 54l-48-36"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        opacity="0.45"
      />
    </svg>
  );
}

const STEPS = [
  {
    id: "tap",
    Svg: SvgTripleTap,
    titleFr: "Triple appui sur le logo",
    titleEn: "Triple tap the logo",
    bodyFr: "Trois appuis rapides sur le logo NGEMBA en haut à gauche.",
    bodyEn: "Three quick taps on the NGEMBA logo at the top left.",
  },
  {
    id: "hold",
    Svg: SvgLongPress,
    titleFr: "Appui long sur le logo",
    titleEn: "Long-press the logo",
    bodyFr: "Maintenez le logo environ 0,65 seconde.",
    bodyEn: "Hold the logo for about 0.65 seconds.",
  },
  {
    id: "corners",
    Svg: SvgCorners,
    titleFr: "Séquence des coins",
    titleEn: "Corner sequence",
    bodyFr:
      "Bas-gauche → bas-droit → haut-gauche, en moins de 2,8 secondes.",
    bodyEn:
      "Bottom-left → bottom-right → top-left, within about 2.8 seconds.",
  },
] as const;

export function DiscreteGuideView({
  initialLocale,
}: {
  initialLocale?: string;
}) {
  const { locale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();
  const isFr = locale !== "en";

  return (
    <main
      className={`ng-shell mx-auto min-h-dvh ${citizenPagePad(device)} ${citizenShellMaxWidth(device)}`}
    >
      <header className="flex items-center justify-between gap-3">
        <Link
          href={href("/")}
          className="text-sm font-semibold text-ng-primary"
        >
          ← {t.home}
        </Link>
      </header>

      <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--ng-border)] bg-ng-surface shadow-[0_16px_40px_-28px_rgba(6,64,43,0.4)]">
        <div className="h-1.5 bg-gradient-to-r from-ng-secondary via-[#a84d86] to-ng-secondary" />
        <div className="p-5 sm:p-6">
          <p className="text-[10px] font-extrabold tracking-[0.16em] text-ng-secondary uppercase">
            NGEMBA
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ng-text sm:text-3xl">
            {t.discrete}
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-ng-muted">
            {isFr
              ? "En danger extrême, utilisez l’un de ces gestes sur l’accueil pour ouvrir l’alerte sobre (sans flash rouge). Ce lien explique seulement comment faire."
              : "In extreme danger, use one of these home-screen gestures to open the sober alert (no red flash). This page only explains how."}
          </p>
        </div>
      </div>

      <ol className="mt-6 space-y-3.5">
        {STEPS.map((step, i) => (
          <li
            key={step.id}
            className="overflow-hidden rounded-[20px] border border-[var(--ng-border)] bg-ng-surface p-4 shadow-[0_12px_32px_-28px_rgba(6,64,43,0.35)] sm:p-5"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-ng-secondary-muted text-xs font-extrabold text-ng-secondary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold tracking-tight text-ng-text">
                  {isFr ? step.titleFr : step.titleEn}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ng-muted">
                  {isFr ? step.bodyFr : step.bodyEn}
                </p>
                <step.Svg className="mt-3 h-20 w-full max-w-[11rem] text-ng-secondary" />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-[20px] border border-amber-200/80 bg-amber-50/80 p-4 sm:p-5">
        <p className="text-sm font-bold text-amber-950">
          {isFr ? "Danger extrême" : "Extreme danger"}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-amber-900/90">
          {isFr
            ? "Choisir ce parcours signifie que vous êtes en danger grave. NGEMBA collecte alors position, IP et infos utiles (y compris proches enregistrés) sans étape de consentement supplémentaire, pour alerter d’urgence les partenaires ops."
            : "Choosing this path means you are in serious danger. NGEMBA then collects location, IP and useful info (including saved trusted contacts) without an extra consent step, to urgently alert ops partners."}
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-ng-muted">
        {isFr
          ? "Astuce PWA : appui long sur l’icône Ngemba → raccourci « Mode discret »."
          : "PWA tip: long-press the Ngemba icon → “Discrete mode” shortcut."}
      </p>
    </main>
  );
}
