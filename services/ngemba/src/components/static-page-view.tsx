"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  IconAlert,
  IconBook,
  IconCheck,
  IconEye,
  IconGraduation,
  IconHeart,
  IconPhone,
  IconShield,
  IconSpark,
  IconUsers,
} from "@/components/icons";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { messages } from "@/lib/i18n";
import {
  getStaticPage,
  type PageKey,
} from "@/lib/static-pages-i18n";
import { citizenPagePad, citizenShellMaxWidth, useDeviceClass } from "@/lib/ui/device";
import { PoweredByMcbuleli } from "@/components/powered-by-mcbuleli";

function sectionIcon(page: PageKey, index: number): ReactNode {
  if (page === "resources") {
    const icons = [
      <IconPhone key="p" className="size-5" />,
      <IconShield key="s" className="size-5" />,
      <IconHeart key="h" className="size-5" />,
      <IconGraduation key="g" className="size-5" />,
      <IconUsers key="u" className="size-5" />,
    ];
    return icons[index] ?? <IconSpark className="size-5" />;
  }
  if (page === "prevent") {
    const icons = [
      <IconCheck key="c" className="size-5" />,
      <IconEye key="e" className="size-5" />,
      <IconAlert key="a" className="size-5" />,
    ];
    return icons[index] ?? <IconBook className="size-5" />;
  }
  return <IconBook className="size-5" />;
}

function IconSectionCard({
  title,
  body,
  icon,
  defaultOpen = false,
}: {
  title: string;
  body: string[];
  icon: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const summary = body[0] ?? "";

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="w-full rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4 text-left transition hover:border-ng-primary/25"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-ng-primary-muted text-ng-primary">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ng-primary">{title}</p>
          {!open && summary ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ng-muted">
              {summary}
            </p>
          ) : null}
          {open && body.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {body.map((line) => (
                <li
                  key={line}
                  className="text-xs leading-relaxed text-ng-muted"
                >
                  - {line}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </button>
  );
}

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
  const iconMode = page === "resources" || page === "prevent";

  return (
    <main
      className={`ng-shell mx-auto min-h-dvh ${citizenPagePad(device)} ${citizenShellMaxWidth(device)}`}
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

      {iconMode ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {content.sections.map((section, index) => (
            <IconSectionCard
              key={section.title}
              title={section.title}
              body={section.body}
              icon={sectionIcon(page, index)}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      ) : (
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
                      className="text-sm leading-relaxed text-ng-muted"
                    >
                      - {line}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-ng-muted">
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
      <PoweredByMcbuleli />
    </main>
  );
}
