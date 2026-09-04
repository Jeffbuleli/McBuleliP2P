"use client";

import Link from "next/link";
import { IconUsers } from "@/components/icons";
import { YOUTH_SCENARIO_ICONS } from "@/components/youth-scenario-icons";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { messages } from "@/lib/i18n";
import { YOUTH_SCENARIOS } from "@/lib/youth/scenarios";
import {
  citizenPagePad,
  citizenShellMaxWidth,
  useDeviceClass,
} from "@/lib/ui/device";

export function YouthHub({ initialLocale }: { initialLocale?: string }) {
  const { locale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();

  return (
    <main
      className={`ng-shell mx-auto flex min-h-dvh flex-col ${citizenPagePad(device)} ${citizenShellMaxWidth(device)}`}
    >
      <Link href={href("/")} className="text-sm font-medium text-ng-muted">
        {t.back}
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-ng-primary-muted text-ng-primary">
          <IconUsers className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-ng-primary">{t.youthTitle}</h1>
          <p className="text-xs text-ng-muted">{t.youthDisclaimer}</p>
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3">
        {YOUTH_SCENARIOS.map((scenario, index) => {
          const Icon = YOUTH_SCENARIO_ICONS[scenario.id];
          return (
            <li key={scenario.id}>
              <Link
                href={href(`/jeunesse/${scenario.id}`)}
                className="flex h-full flex-col gap-2.5 rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-3 transition hover:border-ng-primary/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-ng-secondary-muted text-ng-secondary">
                    <Icon className="size-5" />
                  </span>
                  <span className="tabular-nums text-[10px] font-bold text-ng-muted">
                    {index + 1}/10
                  </span>
                </div>
                <p className="text-xs font-semibold leading-snug text-ng-text">
                  {scenario.title[locale]}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-center text-[11px] text-ng-muted">
        {t.youthSosHint}{" "}
        <Link href={href("/sos")} className="font-semibold text-ng-urgent">
          {t.sos}
        </Link>
      </p>
    </main>
  );
}
