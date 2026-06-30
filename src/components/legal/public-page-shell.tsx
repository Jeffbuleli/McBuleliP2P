import Image from "next/image";
import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export async function PublicPageShell({
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
    <div className="min-h-dvh bg-[#fafaf9] text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/logo-256.png" alt="" width={32} height={32} className="h-8 w-8 rounded-full ring-2 ring-[#305F33]/20" />
            <span className="text-sm font-extrabold">{d.brand}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs font-semibold text-[#305F33] hover:underline">
              ← {d.auth_back_home}
            </Link>
            <LangSwitch />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 pb-14">
        <h1 className="text-2xl font-black tracking-tight text-stone-900">{d[titleKey] as string}</h1>
        {leadKey ? (
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{d[leadKey] as string}</p>
        ) : null}
        <div className="mt-6">{children}</div>

        <nav className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-stone-200 pt-6 text-xs font-semibold text-[#305F33]">
          <Link href="/about" className="hover:underline">
            {d.landing_footer_about}
          </Link>
          <Link href="/contact" className="hover:underline">
            {d.landing_footer_contact}
          </Link>
          <Link href="/terms" className="hover:underline">
            {d.landing_footer_terms}
          </Link>
          <Link href="/privacy" className="hover:underline">
            {d.landing_footer_privacy}
          </Link>
        </nav>
      </main>
    </div>
  );
}

export function PublicBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 rounded-xl border border-stone-200/80 bg-white px-4 py-3 text-sm leading-relaxed text-stone-700 shadow-sm">
          <span className="mt-0.5 shrink-0 font-black text-[#305F33]">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
