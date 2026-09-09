"use client";

import Link from "next/link";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { messages } from "@/lib/i18n";
import {
  PUBLIC_PARTNERS,
  publicPartnerInitials,
  type PublicPartner,
} from "@/lib/public-partners";
import {
  citizenPagePad,
  opsShellMaxWidth,
  useDeviceClass,
  type DeviceClass,
} from "@/lib/ui/device";

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] ?? url;
  }
}

function StatusBadge({
  opsActive,
  isFr,
}: {
  opsActive?: boolean;
  isFr: boolean;
}) {
  if (opsActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-800 ring-1 ring-emerald-100">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
        {isFr ? "Ops actif" : "Ops live"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-amber-900 ring-1 ring-amber-100">
      {isFr ? "En cours" : "Pending"}
    </span>
  );
}

function PartnerMark({
  p,
  size,
}: {
  p: PublicPartner;
  size: "sm" | "md" | "lg";
}) {
  const initials = publicPartnerInitials(p.name);
  const box =
    size === "lg"
      ? "size-[4.25rem] sm:size-[5.25rem] text-lg sm:text-xl"
      : size === "md"
        ? "size-14 sm:size-16 text-sm sm:text-base"
        : "size-12 text-sm";

  if (p.logoUrl) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--ng-border)] ${box}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.logoUrl}
          alt=""
          className="size-full object-contain p-1.5"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl bg-ng-primary-muted font-extrabold tracking-tight text-ng-primary ${box}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function PartnerCard({
  p,
  isFr,
  variant,
}: {
  p: PublicPartner;
  isFr: boolean;
  variant: "ops" | "network";
}) {
  const href = p.website?.trim();
  const role = isFr ? p.roleFr : p.roleEn;
  const blurb = isFr ? p.blurbFr : p.blurbEn;
  const host = href ? hostFromUrl(href) : null;

  const shell =
    variant === "ops"
      ? "group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--ng-border)] bg-ng-surface p-5 shadow-[0_18px_48px_-30px_rgba(6,64,43,0.42)] transition duration-200 hover:-translate-y-0.5 hover:border-ng-primary/40 hover:shadow-[0_22px_52px_-28px_rgba(6,64,43,0.48)] sm:p-6"
      : "group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--ng-border)] bg-ng-surface p-4 shadow-[0_12px_36px_-28px_rgba(6,64,43,0.38)] transition duration-200 hover:-translate-y-0.5 hover:border-ng-primary/35 hover:shadow-[0_16px_40px_-26px_rgba(6,64,43,0.42)] sm:p-5";

  const body =
    variant === "ops" ? (
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <PartnerMark p={p} size="lg" />
        <div className="min-w-0 flex-1 pe-20 sm:pe-24">
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-ng-primary uppercase">
            {role}
          </p>
          <h3 className="mt-1.5 text-lg font-extrabold leading-snug tracking-tight text-ng-text sm:text-xl">
            {p.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ng-muted sm:line-clamp-3">
            {blurb}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="font-bold text-ng-primary">{p.zone}</span>
            <span className="text-ng-muted/50" aria-hidden>
              ·
            </span>
            <span className="font-semibold text-ng-muted">{p.angle}</span>
            {host ? (
              <>
                <span className="text-ng-muted/50" aria-hidden>
                  ·
                </span>
                <span className="truncate font-medium text-ng-muted group-hover:text-ng-primary">
                  {host}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-1 flex-col">
        <div className="flex items-start gap-3 pe-16">
          <PartnerMark p={p} size="md" />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[10px] font-extrabold tracking-[0.14em] text-ng-primary uppercase">
              {role}
            </p>
            <h3 className="mt-1 text-[15px] font-extrabold leading-snug tracking-tight text-ng-text sm:text-base">
              {p.name}
            </h3>
          </div>
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-ng-muted line-clamp-3">
          {blurb}
        </p>
        <div className="mt-3 border-t border-[var(--ng-border)] pt-3">
          <p className="text-[11px] font-bold leading-snug text-ng-primary">
            {p.zone}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-ng-muted">
            {p.angle}
            {host ? (
              <span className="font-medium text-ng-muted/80"> · {host}</span>
            ) : null}
          </p>
        </div>
      </div>
    );

  const badge = (
    <div className="absolute top-3.5 right-3.5 z-10 sm:top-4 sm:right-4">
      <StatusBadge opsActive={p.opsActive} isFr={isFr} />
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={shell}
      >
        {badge}
        {body}
      </a>
    );
  }

  return (
    <div className={shell}>
      {badge}
      {body}
    </div>
  );
}

function SectionHeading({
  title,
  hint,
  device,
}: {
  title: string;
  hint: string;
  device: DeviceClass;
}) {
  return (
    <div
      className={`mb-4 flex flex-col gap-1 ${
        device === "desktop" ? "sm:flex-row sm:items-end sm:justify-between" : ""
      }`}
    >
      <h2 className="text-xs font-bold tracking-[0.14em] text-ng-primary uppercase">
        {title}
      </h2>
      <p className="text-xs text-ng-muted sm:text-sm">{hint}</p>
    </div>
  );
}

export function PartnersDirectoryView({
  initialLocale,
}: {
  initialLocale?: string;
}) {
  const { locale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();
  const isFr = locale !== "en";
  const ops = PUBLIC_PARTNERS.filter((p) => p.opsActive);
  const network = PUBLIC_PARTNERS.filter((p) => !p.opsActive);

  return (
    <main
      className={`ng-shell mx-auto min-h-dvh ${citizenPagePad(device)} ${opsShellMaxWidth(device)}`}
    >
      <header className="flex items-center justify-between gap-3">
        <Link
          href={href("/")}
          className="text-sm font-semibold text-ng-primary"
        >
          ← {t.home}
        </Link>
        <Link
          href={href("/legal/charte-ong")}
          className="text-xs font-medium text-ng-muted underline-offset-2 hover:underline"
        >
          {t.charterLink}
        </Link>
      </header>

      <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--ng-border)] bg-ng-surface shadow-[0_16px_40px_-28px_rgba(6,64,43,0.4)]">
        <div className="h-1.5 bg-gradient-to-r from-ng-primary via-ng-primary-light to-ng-primary" />
        <div
          className={`p-5 sm:p-6 ${
            device === "desktop" ? "md:flex md:items-end md:justify-between md:gap-10 md:p-8" : ""
          }`}
        >
          <div className="max-w-2xl">
            <p className="text-[10px] font-extrabold tracking-[0.16em] text-ng-primary uppercase">
              NGEMBA
            </p>
            <h1
              className={`mt-1.5 font-extrabold tracking-tight text-ng-text ${
                device === "desktop"
                  ? "text-3xl lg:text-4xl"
                  : device === "tablet"
                    ? "text-3xl"
                    : "text-2xl"
              }`}
            >
              {t.partnersLink}
            </h1>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ng-muted sm:text-[15px]">
              {isFr
                ? "Organisations qui orientent et accompagnent les alertes citoyennes - partenaires ops confirmés et réseau droits humains."
                : "Organizations that route and support citizen alerts - confirmed ops partners and human-rights network."}
            </p>
          </div>
          <div
            className={`mt-5 flex flex-wrap gap-2 ${
              device === "desktop" ? "md:mt-0 md:shrink-0" : ""
            }`}
          >
            <span className="rounded-full bg-ng-primary-muted px-3 py-1.5 text-xs font-bold text-ng-primary">
              {ops.length} {isFr ? "ops actifs" : "ops live"}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 ring-1 ring-amber-100">
              {network.length} {isFr ? "en cours" : "pending"}
            </span>
          </div>
        </div>
      </div>

      {ops.length ? (
        <section className="mt-8 sm:mt-10">
          <SectionHeading
            title={isFr ? "Ops partenaires" : "Ops partners"}
            hint={
              isFr
                ? "Files d’alertes actives - prise en charge confirmée"
                : "Live alert queues - confirmed intake"
            }
            device={device}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {ops.map((p) => (
              <PartnerCard key={p.id} p={p} isFr={isFr} variant="ops" />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-9 sm:mt-12">
        <SectionHeading
          title={isFr ? "Réseau ONG" : "NGO network"}
          hint={
            isFr
              ? "Partenariats en cours de confirmation"
              : "Partnerships being confirmed"
          }
          device={device}
        />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
          {network.map((p) => (
            <PartnerCard key={p.id} p={p} isFr={isFr} variant="network" />
          ))}
        </div>
      </section>

      <p className="mt-12 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[10px] text-ng-muted md:text-[11px]">
        <Link href={href("/legal/confidentialite")} className="underline">
          {t.privacyLink}
        </Link>
        <span aria-hidden>-</span>
        <Link href={href("/legal/cgu")} className="underline">
          {t.cguLink}
        </Link>
        <span aria-hidden>-</span>
        <Link href={href("/legal/charte-ong")} className="underline">
          {t.charterLink}
        </Link>
      </p>
    </main>
  );
}
