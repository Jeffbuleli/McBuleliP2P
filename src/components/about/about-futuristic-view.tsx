"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { useI18n } from "@/components/i18n-provider";
import { HudFrame, HudOrbit } from "@/components/about/about-ui";
import { buildAboutFuturisticCopy } from "@/lib/about-futuristic-copy";
import { getDictionary } from "@/i18n/messages";

const ACCENTS = ["cyan", "magenta", "green", "cyan"] as const;

export function AboutFuturisticView() {
  const { locale } = useI18n();
  const copy = useMemo(
    () => buildAboutFuturisticCopy(locale, getDictionary(locale)),
    [locale],
  );

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#050810] text-stone-100">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-size-[40px_40px]" />
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-[90px]" />
        <div className="absolute -right-16 top-1/4 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-[80px]" />
        <div className="absolute bottom-0 left-1/3 h-48 w-96 rounded-full bg-emerald-500/8 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/50 to-transparent" />
      </div>

      <header className="relative z-20 border-b border-white/6 bg-[#050810]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md" />
              <Image
                src="/brand/logo-256.png"
                alt=""
                width={36}
                height={36}
                className="relative h-9 w-9 rounded-full ring-1 ring-emerald-400/40"
              />
            </span>
            <span className="text-sm font-bold tracking-wide">{copy.brand}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden text-[10px] font-semibold uppercase tracking-wider text-cyan-400/90 hover:text-cyan-300 sm:inline"
            >
              ← {copy.backHome}
            </Link>
            <LangSwitch variant="dark" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/5 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {copy.eyebrow}
          </p>

          <h1 className="mt-5 text-balance bg-linear-to-br from-white via-cyan-100 to-emerald-400/90 bg-clip-text text-3xl font-black leading-[1.1] tracking-tight text-transparent sm:text-4xl">
            {copy.title}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-stone-400">
            {copy.lead}
          </p>
        </div>

        <div className="mt-10">
          <HudOrbit label="RDC · AFRICA · FINTECH" />
        </div>

        <section className="mt-12">
          <p className="text-center font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-stone-500">
            {copy.pillarsLabel}
          </p>

          <ul className="mt-5 space-y-4">
            {copy.items.map((item, i) => (
              <li key={`${i}-${item.slice(0, 24)}`}>
                <HudFrame
                  accent={ACCENTS[i % ACCENTS.length]}
                  className="rounded-xl border border-white/8 bg-[#0a1018]/90 p-4 backdrop-blur-sm transition hover:border-cyan-400/25"
                >
                  <div className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-mono text-[11px] font-bold text-cyan-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="pt-0.5 text-sm leading-relaxed text-stone-300">{item}</p>
                  </div>
                </HudFrame>
              </li>
            ))}
          </ul>
        </section>

        <nav className="mt-14 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-white/8 pt-8">
          {(
            [
              ["/about", copy.footer.about],
              ["/contact", copy.footer.contact],
              ["/terms", copy.footer.terms],
              ["/privacy", copy.footer.privacy],
            ] as const
          ).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="font-mono text-[10px] font-semibold uppercase tracking-wider text-stone-500 transition hover:text-cyan-400"
            >
              {label}
            </Link>
          ))}
        </nav>

        <p className="mt-8 text-center font-mono text-[8px] uppercase tracking-[0.3em] text-stone-700">
          McBuleli · {copy.brand}
        </p>
      </main>
    </div>
  );
}
