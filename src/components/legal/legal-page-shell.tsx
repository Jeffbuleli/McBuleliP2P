import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export async function LegalPageShell({
  titleKey,
  leadKey,
  children,
}: {
  titleKey: keyof ReturnType<typeof getDictionary>;
  leadKey?: keyof ReturnType<typeof getDictionary>;
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className="home-theme fd-public-light min-h-dvh">
      <div className="mx-auto max-w-lg px-4 py-8 pb-12">
        <Link
          href="/"
          className="text-xs font-semibold text-[color:var(--fd-primary)] hover:underline"
        >
          ← {d.brand}
        </Link>
        <h1 className="mt-5 text-xl font-black text-[color:var(--fd-text)]">
          {d[titleKey] as string}
        </h1>
        {leadKey ? (
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
            {d[leadKey] as string}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function LegalBulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-2 text-sm leading-relaxed text-[color:var(--fd-text)]"
        >
          <span className="mt-0.5 shrink-0 font-bold text-[color:var(--fd-primary)]">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
