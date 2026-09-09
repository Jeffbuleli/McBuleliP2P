"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconShield } from "@/components/icons";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { messages } from "@/lib/i18n";
import {
  citizenPagePad,
  useDeviceClass,
} from "@/lib/ui/device";

type Row = {
  id: string;
  statusLabel: string;
  urgencyLabel: string;
  createdAt: string;
  locationLabel: string | null;
  messagePreview: string;
};

function fmt(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale === "en" ? "en-GB" : "fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function MeAlertsView({ initialLocale }: { initialLocale?: string }) {
  const { locale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();
  const [rows, setRows] = useState<Row[]>([]);
  const [hasAccount, setHasAccount] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetch("/api/me/alerts", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setRows(d.sessions ?? []);
        setHasAccount(Boolean(d.hasAccount));
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const listClass =
    device === "desktop"
      ? "grid grid-cols-2 gap-4"
      : device === "tablet"
        ? "grid grid-cols-2 gap-3"
        : "flex flex-col gap-3";

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
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ng-muted">
          <IconShield className="size-3.5 text-ng-primary" />
          NGEMBA
        </span>
      </header>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--ng-border)] bg-ng-surface shadow-[0_12px_28px_-22px_rgba(6,64,43,0.4)]">
        <div className="h-1 bg-ng-primary" />
        <div className="p-4 sm:p-5">
          <h1
            className={`font-bold tracking-tight text-ng-text ${
              device === "desktop" ? "text-3xl" : "text-2xl"
            }`}
          >
            {t.myAlerts}
          </h1>
          <p className="mt-1 text-sm text-ng-muted">
            {loaded
              ? `${rows.length} alerte${rows.length === 1 ? "" : "s"}`
              : "…"}
          </p>
        </div>
      </div>

      {!loaded ? (
        <div className={`mt-5 ${listClass}`}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-ng-primary-muted/50"
            />
          ))}
        </div>
      ) : !hasAccount || rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--ng-border)] bg-ng-surface px-4 py-8 text-center">
          <p className="text-sm text-ng-muted">{t.myAlertsEmpty}</p>
          <Link
            href={href("/sos")}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-ng-urgent px-4 text-sm font-semibold text-white"
          >
            {t.sos}
          </Link>
        </div>
      ) : (
        <ul className={`mt-5 ${listClass}`}>
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={href(`/session/${r.id}`)}
                className="block overflow-hidden rounded-2xl border border-[var(--ng-border)] bg-ng-surface transition hover:border-ng-primary/30 hover:shadow-[0_10px_24px_-20px_rgba(6,64,43,0.45)]"
              >
                <div className="h-1 bg-ng-urgent/80" />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-ng-urgent">
                      {r.urgencyLabel}
                    </span>
                    <span className="text-xs text-ng-muted">{r.statusLabel}</span>
                  </div>
                  <p className="mt-2 text-sm leading-snug text-ng-text">
                    {r.messagePreview}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ng-muted">
                    {r.locationLabel ? <span>{r.locationLabel}</span> : null}
                    <span>{fmt(r.createdAt, locale)}</span>
                    <span className="font-mono text-[10px]">
                      {r.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
