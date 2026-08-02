"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { HackathonSlide } from "@/lib/hackathon/slides/types";
import { slidePaletteStyle } from "@/lib/hackathon/slides/palette";
import { SlideIllustration } from "@/components/hackathon/slide-illustrations";
import { HackathonAtmosphere } from "@/components/hackathon/hackathon-atmosphere";

function BulletList({ items }: { items: Array<{ text: string }> }) {
  return (
    <ul className="space-y-2.5">
      {items.map((b, i) => (
        <motion.li
          key={b.text}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.28 }}
          className="flex gap-2.5 text-[clamp(0.95rem,1.55vw,1.22rem)] leading-snug text-[color:var(--hk-text)]"
        >
          <span
            className="shrink-0 font-black text-[color:var(--slide-accent)]"
            aria-hidden
          >
            -
          </span>
          <span>{b.text}</span>
        </motion.li>
      ))}
    </ul>
  );
}

/** Nested panel — same language as badge chips / ticket meta cards. */
function SoftCard({
  children,
  className = "",
  highlight = false,
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3.5 py-3 shadow-[0_10px_28px_-18px_var(--hk-shadow)] backdrop-blur-sm transition ${
        highlight
          ? "border-[color:var(--slide-accent)] bg-[color:var(--slide-soft)]"
          : "border-[color:var(--hk-border)] bg-[color:var(--hk-surface)]"
      } ${className}`}
      style={
        highlight
          ? { boxShadow: `0 0 0 1px var(--slide-accent), 0 12px 28px -16px var(--slide-glow)` }
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function HackathonSlideFrame({
  slide,
  revealQuiz = false,
  compact = false,
  hideQuizHint = false,
  className,
}: {
  slide: HackathonSlide;
  revealQuiz?: boolean;
  compact?: boolean;
  hideQuizHint?: boolean;
  className?: string;
}) {
  const isHero = slide.layout === "title" || slide.layout === "section";
  const pad = compact
    ? "p-5 sm:p-6"
    : isHero
      ? "p-7 sm:p-11 lg:p-12"
      : "p-6 sm:p-9 lg:p-11";
  const titleSize = compact
    ? "text-xl sm:text-2xl"
    : isHero
      ? "text-[clamp(1.85rem,4.6vw,3.5rem)]"
      : "text-[clamp(1.55rem,3.8vw,2.9rem)]";

  const showSideArt =
    Boolean(slide.illustration) &&
    slide.layout !== "agenda" &&
    slide.layout !== "tools";

  return (
    <div
      className={`hk-slide-card relative overflow-hidden rounded-[28px] border border-[color:var(--hk-border)] bg-[color:var(--hk-page)] shadow-[0_24px_64px_-30px_var(--hk-shadow)] ${className ?? ""}`}
      style={slidePaletteStyle(slide.palette)}
    >
      <HackathonAtmosphere decorated />

      {/* Accent rail — ticket/badge stripe */}
      <div
        className="absolute inset-y-0 left-0 z-[1] w-[5px]"
        style={{ background: "var(--slide-accent)" }}
      />

      <div
        className={`relative z-10 ${pad} pl-[calc(1.25rem+5px)] sm:pl-[calc(2rem+5px)]`}
      >
        {slide.eyebrow ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--slide-accent)] shadow-sm backdrop-blur-sm"
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--slide-accent)]"
              aria-hidden
            />
            <span className="truncate">{slide.eyebrow}</span>
          </motion.p>
        ) : null}

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className={`mt-3 font-black tracking-tight text-[color:var(--hk-text)] ${titleSize}`}
        >
          {slide.title}
        </motion.h2>

        {slide.subtitle ? (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 max-w-3xl text-[clamp(0.95rem,1.45vw,1.18rem)] leading-relaxed text-[color:var(--hk-muted)]"
          >
            {slide.subtitle}
          </motion.p>
        ) : null}

        <div
          className={`mt-7 grid gap-6 ${
            showSideArt ? "lg:grid-cols-[1.15fr_0.85fr] lg:items-center" : ""
          }`}
        >
          <div className="min-w-0 space-y-4">
            {slide.body?.map((p, i) => (
              <motion.p
                key={p}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.04 }}
                className="text-[clamp(0.95rem,1.45vw,1.15rem)] leading-relaxed text-[color:var(--hk-text)]"
              >
                {p}
              </motion.p>
            ))}

            {slide.bullets?.length ? <BulletList items={slide.bullets} /> : null}

            {slide.layout === "tools" && slide.tools ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {slide.tools.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i }}
                    style={slidePaletteStyle(t.accent)}
                    className="hk-slide-card"
                  >
                    <SoftCard className="h-full !py-3.5">
                      <div
                        className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-white"
                        style={{ background: "var(--slide-accent)" }}
                      >
                        {t.name.slice(0, 1)}
                      </div>
                      <p className="text-base font-black tracking-tight text-[color:var(--slide-accent)]">
                        {t.name}
                      </p>
                      <p className="mt-1.5 text-sm leading-snug text-[color:var(--hk-muted)]">
                        {t.role}
                      </p>
                    </SoftCard>
                  </motion.div>
                ))}
              </div>
            ) : null}

            {slide.layout === "steps" && slide.steps ? (
              <ol className="space-y-3">
                {slide.steps.map((st, i) => (
                  <motion.li
                    key={st.num}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <SoftCard className="flex gap-3.5 !py-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white"
                        style={{ background: "var(--slide-accent)" }}
                      >
                        {st.num}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-bold text-[color:var(--hk-text)]">
                          {st.title}
                        </p>
                        <p className="mt-0.5 text-sm leading-snug text-[color:var(--hk-muted)]">
                          {st.body}
                        </p>
                      </div>
                    </SoftCard>
                  </motion.li>
                ))}
              </ol>
            ) : null}

            {slide.layout === "agenda" && slide.agenda ? (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {slide.agenda.map((a, i) => (
                  <motion.div
                    key={a.num}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i }}
                  >
                    <SoftCard highlight={Boolean(a.highlight)} className="!py-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black tabular-nums text-white"
                          style={{ background: "var(--slide-accent)" }}
                        >
                          {a.num < 10 ? `0${a.num}` : a.num}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold leading-snug text-[color:var(--hk-text)]">
                            {a.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-snug text-[color:var(--hk-muted)]">
                            {a.subtitle}
                          </p>
                        </div>
                      </div>
                    </SoftCard>
                  </motion.div>
                ))}
              </div>
            ) : null}

            {slide.layout === "quiz" && slide.quiz ? (
              <div className="space-y-4">
                <p className="text-[clamp(1.05rem,1.75vw,1.32rem)] font-bold leading-snug text-[color:var(--hk-text)]">
                  {slide.quiz.question}
                </p>
                <ul className="space-y-2.5">
                  {slide.quiz.options.map((opt, i) => {
                    const showCorrect = revealQuiz && opt.correct;
                    const showWrong = revealQuiz && !opt.correct;
                    return (
                      <motion.li
                        key={opt.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i }}
                      >
                        <SoftCard
                          highlight={showCorrect}
                          className={`flex items-start gap-3 !py-3 ${
                            showWrong ? "opacity-50" : ""
                          } ${showCorrect ? "font-bold" : ""}`}
                        >
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                            style={{
                              background: showCorrect
                                ? "var(--slide-accent)"
                                : "var(--slide-soft)",
                              color: showCorrect
                                ? "#fff"
                                : "var(--slide-accent)",
                            }}
                          >
                            {opt.id.toUpperCase()}
                          </span>
                          <span className="pt-0.5 text-[clamp(0.95rem,1.35vw,1.08rem)] text-[color:var(--hk-text)]">
                            {opt.text}
                          </span>
                        </SoftCard>
                      </motion.li>
                    );
                  })}
                </ul>
                <AnimatePresence>
                  {revealQuiz ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <SoftCard
                        highlight
                        className="text-sm font-medium leading-relaxed text-[color:var(--hk-text)]"
                      >
                        <span className="mr-1.5 font-black text-[color:var(--slide-accent)]">
                          -
                        </span>
                        {slide.quiz.explanation}
                      </SoftCard>
                    </motion.div>
                  ) : hideQuizHint ? null : (
                    <p className="text-xs font-medium tracking-wide text-[color:var(--hk-muted)]">
                      Espace pour révéler la réponse
                    </p>
                  )}
                </AnimatePresence>
              </div>
            ) : null}

            {slide.layout === "homework" && slide.homework ? (
              <div className="space-y-4">
                {slide.homework.deadlineHint ? (
                  <SoftCard className="!py-3">
                    <p className="text-sm font-bold text-[color:var(--slide-accent)]">
                      {slide.homework.deadlineHint}
                    </p>
                  </SoftCard>
                ) : null}
                <BulletList
                  items={slide.homework.tasks.map((t) => ({ text: t }))}
                />
              </div>
            ) : null}

            {slide.layout === "closing" && slide.ctas?.length ? (
              <div className="flex flex-wrap gap-3 pt-2">
                {slide.ctas.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="rounded-full border border-[color:var(--hk-border)] bg-[color:var(--slide-accent)] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_-12px_var(--slide-glow)] transition hover:brightness-110"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {showSideArt && slide.illustration ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={
                compact
                  ? "mx-auto w-full max-w-[240px]"
                  : "mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end"
              }
            >
              <div className="hk-slide-illu overflow-hidden rounded-[22px] border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-1.5 shadow-[0_10px_28px_-18px_var(--hk-shadow)]">
                <SlideIllustration id={slide.illustration} />
              </div>
            </motion.div>
          ) : null}

          {slide.layout === "tools" && slide.illustration ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto w-full max-w-lg pt-1"
            >
              <div className="hk-slide-illu overflow-hidden rounded-[22px] border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-1.5 shadow-[0_10px_28px_-18px_var(--hk-shadow)]">
                <SlideIllustration id={slide.illustration} />
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
