"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconBook,
  IconDownload,
  IconEye,
  IconGraduation,
  IconShield,
  IconUsers,
} from "@/components/icons";
import { PoweredByMcbuleli } from "@/components/powered-by-mcbuleli";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { ngembaApkUrl } from "@/lib/apk";
import {
  localeLabels,
  locales,
  messages,
  type Locale,
} from "@/lib/i18n";
import { useTripleTap } from "@/lib/discrete/triple-tap";
import {
  citizenPagePad,
  citizenShellMaxWidth,
  sosButtonSize,
  sosIconSize,
  sosLabelClass,
  useDeviceClass,
  type DeviceClass,
} from "@/lib/ui/device";

function IconLink({
  icon,
  label,
  href,
  device,
}: {
  icon: ReactNode;
  label: string;
  href: string;
  device: DeviceClass;
}) {
  const box =
    device === "desktop"
      ? "size-12"
      : device === "tablet"
        ? "size-11"
        : "size-10";
  const text =
    device === "desktop"
      ? "text-xs"
      : "text-[11px]";
  return (
    <Link
      href={href}
      className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-ng-primary transition hover:bg-ng-primary-muted/60"
    >
      <span
        className={`inline-flex ${box} items-center justify-center rounded-xl bg-ng-primary-muted text-ng-primary`}
      >
        {icon}
      </span>
      <span className={`${text} font-semibold tracking-tight`}>{label}</span>
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

  const logoSize =
    device === "desktop"
      ? "size-14"
      : device === "tablet"
        ? "size-[3.25rem]"
        : "size-12";

  return (
    <main
      className={`ng-shell relative mx-auto flex min-h-dvh flex-col ${citizenPagePad(device)} ${citizenShellMaxWidth(device)}`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,_rgba(136,35,100,0.08),_transparent_60%)]"
        aria-hidden
      />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3">
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
              alt="Ngemba RDC"
              width={56}
              height={56}
              className={`${logoSize} rounded-xl object-contain`}
            />
          </button>
          <div>
            <p
              className={`font-semibold tracking-[0.2em] text-ng-primary uppercase ${
                device === "desktop" ? "text-xs" : "text-[11px]"
              }`}
            >
              Ngemba RDC
            </p>
            <p
              className={`mt-0.5 font-medium text-ng-muted ${
                device === "desktop" ? "text-base" : "text-sm"
              }`}
            >
              {t.tagline}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center">
          <select
            value={locale}
            onChange={(e) => changeLocale(e.target.value as Locale)}
            aria-label={t.language}
            className="min-h-9 max-w-[10.5rem] appearance-none rounded-full border border-[var(--ng-border)] bg-ng-surface py-1.5 pl-3 pr-8 text-xs font-semibold text-ng-primary outline-none focus-visible:ring-2 focus-visible:ring-ng-primary sm:max-w-none"
          >
            {locales.map((code) => (
              <option key={code} value={code}>
                {localeLabels[code]}
              </option>
            ))}
          </select>
        </label>
      </header>

      {/* SOS hero — centered in remaining upper space */}
      <section className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center py-6">
        <Link
          href={href("/sos")}
          aria-label={`${t.sos} - ${t.sosHint}`}
          className={`ng-sos-pulse relative mx-auto flex ${sosButtonSize(device)} flex-col items-center justify-center rounded-full bg-ng-urgent text-white`}
        >
          <IconShield className={`mb-1.5 ${sosIconSize(device)} text-white/90`} />
          <span
            className={`${sosLabelClass(device)} font-bold leading-none tracking-wide`}
          >
            {t.sos}
          </span>
          <span
            className={`mt-1.5 font-medium opacity-90 ${
              device === "desktop" ? "text-xs" : "text-[10px]"
            }`}
          >
            {t.sosHint}
          </span>
        </Link>
      </section>

      {/* Secondary actions — pushed toward bottom; SOS keeps vertical center */}
      <section className="relative z-10 mt-auto flex w-full flex-col items-center gap-6 pt-4 pb-1">
        <nav
          className="flex w-full max-w-md items-start justify-center gap-1 sm:max-w-lg"
          aria-label="Actions"
        >
          <IconLink
            icon={<IconEye className="size-5" />}
            label={t.witness}
            href={href("/witness")}
            device={device}
          />
          <IconLink
            icon={<IconGraduation className="size-5" />}
            label={t.school}
            href={href("/school")}
            device={device}
          />
          <IconLink
            icon={<IconUsers className="size-5" />}
            label={t.youth}
            href={href("/jeunesse")}
            device={device}
          />
        </nav>

        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] text-ng-muted md:text-xs">
          <Link
            href={href("/resources")}
            className="inline-flex items-center gap-1 hover:text-ng-primary"
          >
            <IconBook className="size-3" />
            {t.resources}
          </Link>
          <Link
            href={href("/prevent")}
            className="inline-flex items-center gap-1 hover:text-ng-primary"
          >
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

        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[10px] text-ng-muted md:text-[11px]">
          <a
            href={ngembaApkUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-ng-primary hover:underline"
          >
            <IconDownload className="size-3.5" />
            {t.installAndroid}
          </a>
          <span aria-hidden>·</span>
          <Link href={href("/legal/confidentialite")} className="underline">
            {t.privacyLink}
          </Link>
          <span aria-hidden>·</span>
          <Link href={href("/legal/cgu")} className="underline">
            {t.cguLink}
          </Link>
        </p>

        <PoweredByMcbuleli className="pt-1" />
      </section>
    </main>
  );
}
