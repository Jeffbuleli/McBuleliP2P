"use client";

import Link from "next/link";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { messages } from "@/lib/i18n";
import {
  getStaticPage,
  type PageKey,
} from "@/lib/static-pages-i18n";
import { citizenShellMaxWidth, useDeviceClass } from "@/lib/ui/device";

export function StaticPageView({
  page,
  initialLocale,
}: {
  page: PageKey;
  initialLocale?: string;
}) {
  const { locale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();
  const content = getStaticPage(page, locale);

  return (
    <main
      className={`ng-shell mx-auto min-h-dvh py-6 ${citizenShellMaxWidth(device)}`}
    >
      <Link
        href={href("/")}
        className="text-sm font-semibold text-ng-primary underline-offset-2 hover:underline"
      >
        ← {t.back}
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ng-text">
        {content.title}
      </h1>
      <div className="mt-6 space-y-6">
        {content.sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4"
          >
            <h2 className="text-sm font-bold text-ng-primary">{section.title}</h2>
            {section.body.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {section.body.map((line) => (
                  <li
                    key={line}
                    className="text-sm leading-relaxed text-ng-muted before:mr-2 before:content-['•']"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-ng-muted">
        NGEMBA · McBuleli ·{" "}
        <Link href={href("/legal/confidentialite")} className="text-ng-primary">
          {t.privacyLink}
        </Link>
        {" · "}
        <Link href={href("/legal/cgu")} className="text-ng-primary">
          {t.cguLink}
        </Link>
        {" · "}
        <Link href={href("/legal/charte-ong")} className="text-ng-primary">
          {t.charterLink}
        </Link>
      </p>
    </main>
  );
}
