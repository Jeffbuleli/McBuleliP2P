import Image from "next/image";
import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import {
  getWhitepaper,
  type WhitepaperBlock,
  type WhitepaperSection,
} from "@/lib/whitepaper/content";

export const metadata = {
  title: "Whitepaper · McBuleli",
  description:
    "McBuleli Constitution Lite v1.0 - Africa-first financial super app vision, principles, and utility economy.",
};

function sectionLabel(title: string) {
  return title.replace(/^\d+\.\s*/, "");
}

function Block({ block }: { block: WhitepaperBlock }) {
  if (block.type === "p") {
    return (
      <p className="text-[15px] leading-[1.75] text-stone-600">{block.text}</p>
    );
  }

  if (block.type === "ul") {
    return (
      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/90 bg-white">
        {block.items.map((item) => {
          const sep = item.indexOf(" - ");
          const hasSplit = sep > 0 && sep < 48;
          const head = hasSplit ? item.slice(0, sep) : null;
          const body = hasSplit ? item.slice(sep + 3) : item;
          return (
            <li
              key={item}
              className="flex gap-3 px-4 py-3.5 text-[14px] leading-relaxed text-stone-600 sm:px-5"
            >
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#305F33]"
                aria-hidden
              />
              <span className="min-w-0">
                {head ? (
                  <>
                    <span className="font-semibold text-stone-800">{head}</span>
                    <span className="text-stone-400"> - </span>
                    <span>{body}</span>
                  </>
                ) : (
                  body
                )}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (block.type === "ol") {
    return (
      <ol className="space-y-2.5">
        {block.items.map((item, i) => (
          <li
            key={item}
            className="flex gap-3 rounded-2xl border border-stone-200/80 bg-white px-4 py-3.5 text-[14px] leading-relaxed text-stone-600 shadow-[0_1px_0_rgba(28,25,23,0.03)]"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f3ee] text-[11px] font-bold tabular-nums text-[#305F33]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "callout") {
    return (
      <aside className="relative overflow-hidden rounded-2xl border border-[#305F33]/20 bg-[#e8f3ee]/70 px-5 py-4">
        <div
          className="absolute inset-y-0 left-0 w-1 bg-[#305F33]"
          aria-hidden
        />
        <p className="pl-2 text-[14px] font-medium leading-relaxed text-[#234a26]">
          {block.text}
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-dashed border-amber-300/80 bg-amber-50/80 px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800">
        Draft
      </p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-amber-950/90">
        {block.text}
      </p>
    </aside>
  );
}

function SectionView({
  section,
  index,
}: {
  section: WhitepaperSection;
  index: number;
}) {
  const label = sectionLabel(section.title);
  const n = String(index + 1).padStart(2, "0");

  return (
    <section
      id={section.id}
      className="scroll-mt-28 overflow-hidden rounded-3xl border border-stone-200/90 bg-white/90 shadow-[0_1px_0_rgba(28,25,23,0.04)] backdrop-blur-sm"
    >
      <div className="flex items-start gap-4 border-b border-stone-100 px-5 py-5 sm:gap-5 sm:px-7 sm:py-6">
        <span
          className="font-black tabular-nums leading-none text-[#305F33]/20"
          style={{ fontSize: "2.25rem" }}
          aria-hidden
        >
          {n}
        </span>
        <div className="min-w-0 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
            {n}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-stone-900 sm:text-[1.35rem]">
            {label}
          </h2>
        </div>
      </div>
      <div className="space-y-5 px-5 py-6 sm:px-7 sm:py-7">
        {section.blocks.map((block, idx) => (
          <Block key={`${section.id}-${idx}`} block={block} />
        ))}
      </div>
    </section>
  );
}

export default async function WhitepaperPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const doc = getWhitepaper(locale);
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#f4f7f5] text-stone-900">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,_rgba(48,95,51,0.12),_transparent_60%),linear-gradient(180deg,#eef5f0_0%,#f4f7f5_70%)]"
        aria-hidden
      />

      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#f4f7f5]/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/brand/logo-256.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full ring-2 ring-[#305F33]/15"
            />
            <span className="text-sm font-extrabold tracking-tight">
              {d.brand}
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="hidden text-xs font-semibold text-[#305F33] hover:underline sm:inline"
            >
              ← {d.auth_back_home}
            </Link>
            <LangSwitch />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-white px-6 py-8 shadow-[0_12px_40px_-24px_rgba(36,74,39,0.35)] sm:px-9 sm:py-10">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#305F33]/8 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-[#e8f3ee] blur-2xl"
            aria-hidden
          />

          <div className="relative flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e8f3ee] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#305F33]">
              {d.landing_footer_whitepaper}
            </span>
            <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
              v{doc.version}
            </span>
            <span className="text-[11px] font-medium text-stone-400">
              {doc.revised}
            </span>
          </div>

          <h1 className="relative mt-5 text-4xl font-black tracking-tight text-stone-900 sm:text-5xl">
            McBuleli
          </h1>
          <p className="relative mt-3 max-w-xl text-base font-medium leading-snug text-stone-600 sm:text-lg">
            {doc.tagline}
          </p>
          <p className="relative mt-5 max-w-2xl border-t border-stone-100 pt-4 text-[12px] leading-relaxed text-stone-500">
            {doc.disclaimer}
          </p>
        </header>

        {/* TOC */}
        <nav
          aria-label={doc.tocLabel}
          className="mt-8 rounded-[1.5rem] border border-stone-200/80 bg-white/70 p-5 backdrop-blur-sm sm:p-6"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
              {doc.tocLabel}
            </h2>
            <span className="text-[11px] tabular-nums text-stone-400">
              {doc.sections.length}
            </span>
          </div>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {doc.sections.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-stone-200 hover:bg-white"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f3ee] text-[11px] font-bold tabular-nums text-[#305F33] transition group-hover:bg-[#305F33] group-hover:text-white">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] font-semibold leading-snug text-stone-700 group-hover:text-[#305F33]">
                    {sectionLabel(section.title)}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Chapters */}
        <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
          {doc.sections.map((section, i) => (
            <SectionView key={section.id} section={section} index={i} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative mt-6 border-t border-stone-200/80 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <Image
                  src="/brand/logo-256.png"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full"
                />
                <span className="text-sm font-extrabold">{d.brand}</span>
              </div>
              <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-stone-500">
                {d.landing_footer_tagline}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex w-fit items-center rounded-full bg-[#305F33] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#244a27]"
            >
              ← {d.auth_back_home}
            </Link>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 border-t border-stone-100 pt-6 text-[12px] font-semibold text-stone-500">
            <Link href="/about" className="hover:text-[#305F33]">
              {d.landing_footer_about}
            </Link>
            <Link href="/whitepaper" className="text-[#305F33]">
              {d.landing_footer_whitepaper}
            </Link>
            <Link href="/contact" className="hover:text-[#305F33]">
              {d.landing_footer_contact}
            </Link>
            <Link href="/terms" className="hover:text-[#305F33]">
              {d.landing_footer_terms}
            </Link>
            <Link href="/privacy" className="hover:text-[#305F33]">
              {d.landing_footer_privacy}
            </Link>
          </nav>

          <p className="text-[11px] text-stone-400">
            © {year} {d.brand} · Constitution Lite v{doc.version}
          </p>
        </div>
      </footer>
    </div>
  );
}
