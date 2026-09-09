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
  useDeviceClass,
} from "@/lib/ui/device";

function PartnerCard({
  p,
  isFr,
}: {
  p: PublicPartner;
  isFr: boolean;
}) {
  const href = p.website?.trim();
  const role = isFr ? p.roleFr : p.roleEn;
  const blurb = isFr ? p.blurbFr : p.blurbEn;
  const meta = `${p.zone} · ${p.angle}`;
  const initials = publicPartnerInitials(p.name);

  const inner = (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10">
        {p.opsActive ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            {isFr ? "Ops actif" : "Ops live"}
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
            {isFr ? "En cours" : "Pending"}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 pr-16 sm:flex-row sm:items-center sm:pr-20">
        <div className="flex shrink-0 items-center justify-center sm:w-[7.5rem]">
          {p.logoUrl ? (
            <span className="inline-flex size-[4.5rem] items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--ng-border)] sm:size-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.logoUrl}
                alt={p.name}
                className="size-full object-contain p-1.5"
              />
            </span>
          ) : (
            <span className="inline-flex size-[4.5rem] items-center justify-center rounded-2xl bg-ng-primary-muted text-lg font-extrabold tracking-tight text-ng-primary sm:size-24 sm:text-xl">
              {initials}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-ng-primary uppercase">
            {role}
          </p>
          <p className="mt-1 break-words text-base font-extrabold text-ng-text">
            {p.name}
          </p>
          <p className="mt-1 break-words text-sm leading-relaxed text-ng-muted">
            {blurb}
          </p>
          <p className="mt-2 break-words text-xs font-bold text-ng-primary">
            {meta}
            {href ? (
              <span className="font-semibold text-ng-muted">
                {" "}
                · {href.replace(/^https?:\/\//, "").split("/")[0]}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );

  const className =
    "block rounded-[22px] border border-[var(--ng-border)] bg-ng-surface p-4 shadow-[0_14px_44px_-28px_rgba(6,64,43,0.35)] transition hover:border-ng-primary/35 sm:p-5";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }

  return <div className={className}>{inner}</div>;
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
      className={`ng-shell mx-auto min-h-dvh ${citizenPagePad(device)} ${
        device === "desktop"
          ? "max-w-3xl"
          : device === "tablet"
            ? "max-w-2xl"
            : "max-w-md"
      }`}
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

      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--ng-border)] bg-ng-surface shadow-[0_12px_28px_-22px_rgba(6,64,43,0.4)]">
        <div className="h-1 bg-ng-primary" />
        <div className="p-4 sm:p-5">
          <h1
            className={`font-bold tracking-tight text-ng-text ${
              device === "desktop" ? "text-3xl" : "text-2xl"
            }`}
          >
            {t.partnersLink}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ng-muted">
            {isFr
              ? "Organisations qui orientent et accompagnent les alertes citoyennes NGEMBA — ops actifs et réseau droits humains."
              : "Organizations that route and support NGEMBA citizen alerts — live ops and human-rights network."}
          </p>
        </div>
      </div>

      {ops.length ? (
        <section className="mt-6">
          <h2 className="text-xs font-bold tracking-[0.12em] text-ng-primary uppercase">
            {isFr ? "Ops partenaires" : "Ops partners"}
          </h2>
          <div className="mt-3 space-y-4">
            {ops.map((p) => (
              <PartnerCard key={p.id} p={p} isFr={isFr} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-xs font-bold tracking-[0.12em] text-ng-primary uppercase">
          {isFr ? "Réseau ONG" : "NGO network"}
        </h2>
        <div
          className={`mt-3 ${
            device === "desktop" || device === "tablet"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
              : "space-y-4"
          }`}
        >
          {network.map((p) => (
            <PartnerCard key={p.id} p={p} isFr={isFr} />
          ))}
        </div>
      </section>

      <p className="mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[10px] text-ng-muted md:text-[11px]">
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
