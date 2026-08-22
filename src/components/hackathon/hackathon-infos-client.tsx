"use client";

import Link from "next/link";
import { HACKATHON_PRACTICAL_SECTIONS } from "@/lib/hackathon/practical-info";
import {
  HACKATHON_DATES_LABEL_FR,
  HACKATHON_DATES_LABEL_EN,
  HACKATHON_HOURS_LABEL_FR,
  HACKATHON_HOURS_LABEL_EN,
} from "@/lib/hackathon/event-content";
import { HackathonAtmosphere } from "@/components/hackathon/hackathon-atmosphere";
import { HkPage, HkSection, HkShell, useHkLocale } from "@/components/hackathon/hk-ui";

export function HackathonInfosClient() {
  const isFr = useHkLocale();

  return (
    <HkShell authReturnPath="/hackathon/infos">
      <HackathonAtmosphere variant="page" />
      <HkPage
        eyebrow={isFr ? "Hackathon 2026" : "Hackathon 2026"}
        title={isFr ? "Infos pratiques" : "Practical info"}
        lede={
          isFr
            ? `${HACKATHON_DATES_LABEL_FR} · ${HACKATHON_HOURS_LABEL_FR} · Silikin Village, Kinshasa`
            : `${HACKATHON_DATES_LABEL_EN} · ${HACKATHON_HOURS_LABEL_EN} · Silikin Village, Kinshasa`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/hackathon/espace"
              className="rounded-2xl bg-[color:var(--hk-accent)] px-4 py-3 text-sm font-bold text-white"
            >
              {isFr ? "Mon espace" : "My hub"}
            </Link>
            <Link
              href="/hackathon"
              className="rounded-2xl bg-[color:var(--hk-surface)] px-4 py-3 text-sm font-bold text-[color:var(--hk-accent)] ring-1 ring-[color:var(--hk-border)]"
            >
              {isFr ? "Landing" : "Landing"}
            </Link>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {HACKATHON_PRACTICAL_SECTIONS.map((section) => (
            <HkSection
              key={section.id}
              title={isFr ? section.titleFr : section.titleEn}
            >
              <ul className="space-y-2 text-sm leading-relaxed text-[color:var(--hk-muted)]">
                {(isFr ? section.itemsFr : section.itemsEn).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[color:var(--hk-accent)]" aria-hidden>
                      -
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </HkSection>
          ))}
        </div>
      </HkPage>
    </HkShell>
  );
}
