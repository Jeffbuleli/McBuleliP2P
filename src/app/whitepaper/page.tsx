import Image from "next/image";
import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import {
  getWhitepaper,
  type WhitepaperBlock,
} from "@/lib/whitepaper/content";

export const metadata = {
  title: "Whitepaper · McBuleli",
  description:
    "McBuleli Constitution Lite v1.0 - Africa-first financial super app vision, principles, and utility economy.",
};

function Block({ block }: { block: WhitepaperBlock }) {
  if (block.type === "p") {
    return (
      <p className="text-sm leading-relaxed text-stone-700">{block.text}</p>
    );
  }
  if (block.type === "ul") {
    return (
      <ul className="space-y-2">
        {block.items.map((item) => (
          <li
            key={item}
            className="flex gap-3 text-sm leading-relaxed text-stone-700"
          >
            <span className="mt-0.5 shrink-0 font-black text-[#305F33]">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "ol") {
    return (
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
        {block.items.map((item) => (
          <li key={item} className="pl-1">
            {item}
          </li>
        ))}
      </ol>
    );
  }
  if (block.type === "callout") {
    return (
      <p className="rounded-xl border border-[#305F33]/25 bg-[#305F33]/5 px-4 py-3 text-sm font-semibold leading-relaxed text-[#234a26]">
        {block.text}
      </p>
    );
  }
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
      <span className="font-bold uppercase tracking-wide text-amber-800">
        Draft ·{" "}
      </span>
      {block.text}
    </p>
  );
}

export default async function WhitepaperPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const doc = getWhitepaper(locale);

  return (
    <div className="min-h-dvh bg-[#fafaf9] text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/logo-256.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full ring-2 ring-[#305F33]/20"
            />
            <span className="text-sm font-extrabold">{d.brand}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-semibold text-[#305F33] hover:underline"
            >
              ← {d.auth_back_home}
            </Link>
            <LangSwitch />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#305F33]">
          {d.landing_footer_whitepaper} · v{doc.version}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">
          McBuleli
        </h1>
        <p className="mt-2 text-base font-semibold text-stone-700">
          {doc.tagline}
        </p>
        <p className="mt-1 text-xs text-stone-500">{doc.revised}</p>

        <p className="mt-6 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-stone-600 shadow-sm">
          {doc.disclaimer}
        </p>

        <nav aria-label={doc.tocLabel} className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500">
            {doc.tocLabel}
          </h2>
          <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {doc.sections.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-lg px-2 py-1.5 text-sm font-semibold text-[#305F33] hover:bg-[#305F33]/8"
                >
                  {i + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-12">
          {doc.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 border-t border-stone-200 pt-8"
            >
              <h2 className="text-xl font-black tracking-tight text-stone-900">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4">
                {section.blocks.map((block, idx) => (
                  <Block key={`${section.id}-${idx}`} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <nav className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-stone-200 pt-6 text-xs font-semibold text-[#305F33]">
          <Link href="/about" className="hover:underline">
            {d.landing_footer_about}
          </Link>
          <Link href="/whitepaper" className="hover:underline">
            {d.landing_footer_whitepaper}
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
