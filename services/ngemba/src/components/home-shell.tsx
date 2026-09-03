"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconBook,
  IconEye,
  IconGlobe,
  IconGraduation,
  IconShield,
  IconSpark,
  IconUsers,
} from "@/components/icons";
import { PwaInstallButton } from "@/components/pwa-install";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import {
  localeLabels,
  locales,
  messages,
  type Locale,
} from "@/lib/i18n";
import { useTripleTap } from "@/lib/discrete/triple-tap";
import {
  citizenShellMaxWidth,
  sosButtonSize,
  useDeviceClass,
} from "@/lib/ui/device";

function IconLink({
  icon,
  label,
  href,
}: {
  icon: ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-ng-primary transition hover:bg-ng-primary-muted/60"
    >
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-ng-primary-muted text-ng-primary">
        {icon}
      </span>
      <span className="text-[11px] font-semibold tracking-tight">{label}</span>
    </Link>
  );
}

export function HomeShell({ initialLocale }: { initialLocale?: string }) {
  const router = useRouter();
  const { locale, setLocale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();
  const onLogoTap = useTripleTap(() => {
    router.push(href("/discrete"));
  });

  function changeLocale(code: Locale) {
    setLocale(code);
  }

  return (
    <main
      className={`ng-shell relative mx-auto flex min-h-dvh flex-col pb-8 pt-5 ${citizenShellMaxWidth(device)}`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,_rgba(136,35,100,0.08),_transparent_60%)]"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLogoTap}
            className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ng-primary"
            aria-label={t.discrete}
            title={t.discreteTap}
          >
            <img
              src="/brand/ngemba-logo.png"
              alt="NGEMBA"
              width={48}
              height={48}
              className="size-12 rounded-xl object-contain"
            />
          </button>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-ng-primary uppercase">
              NGEMBA
            </p>
            <p className="mt-0.5 text-sm font-medium text-ng-muted">{t.tagline}</p>
          </div>
        </div>
        <label className="relative inline-flex items-center gap-1.5">
          <IconGlobe className="size-4 shrink-0 text-ng-muted" aria-hidden />
          <span className="sr-only">{t.language}</span>
          <select
            value={locale}
            onChange={(e) => changeLocale(e.target.value as Locale)}
            aria-label={t.language}
            className="min-h-9 appearance-none rounded-full border border-[var(--ng-border)] bg-ng-surface py-1.5 pl-3 pr-8 text-xs font-semibold text-ng-primary outline-none focus-visible:ring-2 focus-visible:ring-ng-primary"
          >
            {locales.map((code) => (
              <option key={code} value={code}>
                {localeLabels[code]}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="relative z-10 mt-10 flex flex-1 flex-col items-center justify-center gap-8">
        <div className="flex max-w-sm flex-col items-center gap-2 text-center">
          <div className="inline-flex items-center gap-2 text-ng-primary">
            <IconSpark className="size-5" />
            <span className="text-sm font-bold tracking-tight">{t.powered}</span>
          </div>
          <p className="text-sm font-medium leading-snug text-ng-muted">
            {t.line}
          </p>
        </div>

        <Link
          href={href("/sos")}
          aria-label={`${t.sos} - ${t.sosHint}`}
          className={`ng-sos-pulse relative flex ${sosButtonSize(device)} flex-col items-center justify-center rounded-full bg-ng-urgent text-white`}
        >
          <IconShield className="mb-1 size-5 text-white/90" />
          <span className="text-base font-bold leading-none tracking-wide">
            {t.sos}
          </span>
          <span className="mt-1 text-[10px] font-medium opacity-90">
            {t.sosHint}
          </span>
        </Link>

        <nav
          className="flex w-full max-w-md items-start justify-center gap-1"
          aria-label="Actions"
        >
          <IconLink
            icon={<IconEye className="size-5" />}
            label={t.witness}
            href={href("/witness")}
          />
          <IconLink
            icon={<IconGraduation className="size-5" />}
            label={t.school}
            href={href("/school")}
          />
          <IconLink
            icon={<IconUsers className="size-5" />}
            label={t.youth}
            href={href("/jeunesse")}
          />
        </nav>

        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] text-ng-muted">
          <Link href={href("/resources")} className="inline-flex items-center gap-1 hover:text-ng-primary">
            <IconSpark className="size-3" />
            {t.resources}
          </Link>
          <Link href={href("/prevent")} className="inline-flex items-center gap-1 hover:text-ng-primary">
            <IconBook className="size-3" />
            {t.prevent}
          </Link>
          <Link href={href("/me")} className="hover:text-ng-primary">
            {t.myAlerts}
          </Link>
          <Link href={href("/discrete")} className="hover:text-ng-primary">
            {t.discrete}
          </Link>
        </p>

        <PwaInstallButton label={t.installApp} iosHint={t.installIos} />

        <p className="text-center text-[10px] text-ng-muted">
          <Link href={href("/legal/confidentialite")} className="underline">
            {t.privacyLink}
          </Link>
          {" - "}
          <Link href={href("/legal/cgu")} className="underline">
            {t.cguLink}
          </Link>
        </p>
      </section>
    </main>
  );
}
