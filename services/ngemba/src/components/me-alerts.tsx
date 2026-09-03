"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLocale, messages, type Locale } from "@/lib/i18n";
import { citizenShellMaxWidth, useDeviceClass } from "@/lib/ui/device";

type Row = {
  id: string;
  statusLabel: string;
  urgencyLabel: string;
  createdAt: string;
  locationLabel: string | null;
  messagePreview: string;
};

export function MeAlertsView({ initialLocale }: { initialLocale?: string }) {
  const locale: Locale =
    initialLocale && isLocale(initialLocale) ? initialLocale : "fr";
  const t = messages[locale];
  const device = useDeviceClass();
  const [rows, setRows] = useState<Row[]>([]);
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    void fetch("/api/me/alerts", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setRows(d.sessions ?? []);
        setHasAccount(Boolean(d.hasAccount));
      })
      .catch(() => undefined);
  }, []);

  return (
    <main
      className={`ng-shell mx-auto min-h-dvh py-6 ${citizenShellMaxWidth(device)}`}
    >
      <Link
        href={`/?lang=${locale}`}
        className="text-sm font-semibold text-ng-primary"
      >
        ← {t.home}
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ng-text">{t.myAlerts}</h1>
      {!hasAccount || rows.length === 0 ? (
        <p className="mt-6 text-sm text-ng-muted">
          Aucune alerte enregistrée sur cet appareil. Utilisez SOS pour créer une
          alerte - elle apparaîtra ici automatiquement.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/session/${r.id}?lang=${locale}`}
                className="block rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-ng-urgent">
                    {r.urgencyLabel}
                  </span>
                  <span className="text-xs text-ng-muted">{r.statusLabel}</span>
                </div>
                <p className="mt-2 text-sm text-ng-text">{r.messagePreview}</p>
                {r.locationLabel ? (
                  <p className="mt-1 text-xs text-ng-muted">{r.locationLabel}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
