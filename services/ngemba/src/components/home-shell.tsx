"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconBook,
  IconEye,
  IconGlobe,
  IconMic,
  IconShield,
  IconSpark,
} from "@/components/icons";
import {
  isLocale,
  localeLabels,
  locales,
  messages,
  type Locale,
} from "@/lib/i18n";

function Tile({
  icon,
  label,
  accent = "primary",
  href,
}: {
  icon: ReactNode;
  label: string;
  accent?: "primary" | "secondary";
  href?: string;
}) {
  const tone =
    accent === "secondary"
      ? "text-ng-secondary bg-ng-secondary-muted/60"
      : "text-ng-primary bg-ng-primary-muted";

  const className =
    "flex min-h-[var(--ng-touch-min)] flex-col items-start gap-3 rounded-2xl border border-[var(--ng-border)] bg-ng-surface/90 p-4 text-left shadow-[0_8px_30px_rgba(6,64,43,0.06)] backdrop-blur-sm disabled:opacity-60";

  const inner = (
    <>
      <span
        className={`inline-flex size-10 items-center justify-center rounded-xl ${tone}`}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold tracking-tight">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" disabled className={className}>
      {inner}
    </button>
  );
}

export function HomeShell({ initialLocale }: { initialLocale?: string }) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(
    initialLocale && isLocale(initialLocale) ? initialLocale : "fr",
  );
  const t = messages[locale];

  useEffect(() => {
    if (initialLocale && isLocale(initialLocale)) setLocale(initialLocale);
  }, [initialLocale]);

  function changeLocale(code: Locale) {
    setLocale(code);
    router.replace(`/?lang=${code}`, { scroll: false });
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-5">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,_rgba(136,35,100,0.08),_transparent_60%)]"
        aria-hidden
      />

      <header className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/brand/ngemba-logo.png"
            alt="NGEMBA"
            width={48}
            height={48}
            className="size-12 rounded-xl object-contain"
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-ng-primary uppercase">
              NGEMBA
            </p>
            <p className="mt-0.5 text-sm font-medium text-ng-muted">{t.tagline}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ng-border)] bg-ng-surface px-2.5 py-1.5 text-ng-primary">
          <IconSpark className="size-3.5" />
          <span className="text-[11px] font-semibold">{t.powered}</span>
        </div>
      </header>

      <div className="relative z-10 mt-5 flex items-center gap-2 overflow-x-auto pb-1">
        <IconGlobe className="size-4 shrink-0 text-ng-muted" aria-hidden />
        {locales.map((code) => {
          const active = code === locale;
          return (
            <button
              key={code}
              type="button"
              onClick={() => changeLocale(code)}
              aria-pressed={active}
              aria-label={code}
              className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold transition ${
                active
                  ? "bg-ng-primary text-white"
                  : "bg-ng-surface text-ng-muted ring-1 ring-[var(--ng-border)]"
              }`}
            >
              {localeLabels[code]}
            </button>
          );
        })}
      </div>

      <section className="relative z-10 mt-8 flex flex-1 flex-col items-center justify-center gap-7">
        <div className="grid w-full grid-cols-2 gap-3">
          <Tile
            icon={<IconMic className="size-5" />}
            label={t.speak}
            href={`/sos?lang=${locale}`}
          />
          <Tile
            icon={<IconEye className="size-5" />}
            label={t.witness}
            accent="secondary"
            href={`/witness?lang=${locale}`}
          />
        </div>

        <Link
          href={`/sos?lang=${locale}`}
          aria-label={`${t.sos} - ${t.sosHint}`}
          className="ng-sos-pulse relative flex size-[var(--ng-sos-size)] flex-col items-center justify-center rounded-full bg-ng-urgent text-white"
        >
          <IconShield className="mb-1 size-5 text-white/90" />
          <span className="text-base font-bold leading-none tracking-wide">
            {t.sos}
          </span>
          <span className="mt-1 text-[10px] font-medium opacity-90">
            {t.sosHint}
          </span>
        </Link>

        <div className="grid w-full grid-cols-2 gap-3">
          <Tile icon={<IconBook className="size-5" />} label={t.prevent} />
          <Tile icon={<IconSpark className="size-5" />} label={t.resources} />
        </div>

        <p className="max-w-[16rem] text-center text-sm font-medium leading-snug text-ng-primary">
          {t.line}
        </p>
      </section>
    </main>
  );
}
