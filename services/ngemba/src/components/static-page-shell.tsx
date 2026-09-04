import Link from "next/link";
import { PoweredByMcbuleli } from "@/components/powered-by-mcbuleli";
import type { StaticSection } from "@/lib/static-pages";

export function StaticPageShell({
  title,
  sections,
  backHref = "/",
}: {
  title: string;
  sections: StaticSection[];
  backHref?: string;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <Link
        href={backHref}
        className="text-sm font-semibold text-ng-primary underline-offset-2 hover:underline"
      >
        ← Retour
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ng-text">
        {title}
      </h1>
      <div className="mt-6 space-y-6">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4"
          >
            <h2 className="text-sm font-bold text-ng-primary">{section.title}</h2>
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
          </section>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-ng-muted">
        <Link href="/legal/confidentialite" className="text-ng-primary">
          Confidentialité
        </Link>
        {" · "}
        <Link href="/legal/cgu" className="text-ng-primary">
          CGU
        </Link>
        {" · "}
        <Link href="/legal/charte-ong" className="text-ng-primary">
          Charte ONG
        </Link>
      </p>
      <PoweredByMcbuleli />
    </main>
  );
}
