"use client";

import Link from "next/link";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { messages } from "@/lib/i18n";
import { YOUTH_SCENARIOS } from "@/lib/youth/scenarios";
import { citizenShellMaxWidth, useDeviceClass } from "@/lib/ui/device";

export function YouthHub({ initialLocale }: { initialLocale?: string }) {
  const { locale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();

  return (
    <main
      className={`ng-shell mx-auto flex min-h-dvh flex-col pb-8 pt-5 ${citizenShellMaxWidth(device)}`}
    >
      <Link href={href("/")} className="text-sm font-medium text-ng-muted">
        {t.back}
      </Link>

      <h1 className="mt-6 text-xl font-semibold text-ng-primary">{t.youthTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ng-muted">{t.youthSubtitle}</p>
      <p className="mt-3 rounded-xl bg-ng-secondary-muted px-3 py-2 text-xs font-medium text-ng-secondary">
        {t.youthDisclaimer}
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {YOUTH_SCENARIOS.map((scenario, index) => (
          <li key={scenario.id}>
            <Link
              href={href(`/jeunesse/${scenario.id}`)}
              className="block rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4 shadow-sm transition hover:border-ng-primary/30"
            >
              <span className="text-[11px] font-bold text-ng-muted">
                {index + 1}/10
              </span>
              <p className="mt-1 text-sm font-semibold text-ng-text">
                {scenario.title[locale]}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ng-muted line-clamp-2">
                {scenario.intro[locale]}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
