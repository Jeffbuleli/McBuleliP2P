"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { HackathonSlide } from "@/lib/hackathon/slides/types";
import { slidePaletteStyle } from "@/lib/hackathon/slides/palette";
import { SlideIllustration } from "@/components/hackathon/slide-illustrations";

function BulletList({ items }: { items: Array<{ text: string }> }) {
  return (
    <ul className="space-y-2.5">
      {items.map((b) => (
        <li
          key={b.text}
          className="flex gap-2 text-[clamp(0.95rem,1.6vw,1.25rem)] leading-snug text-[color:var(--hk-text,#222)]"
        >
          <span
            className="mt-0.5 shrink-0 font-bold"
            style={{ color: "var(--slide-accent)" }}
          >
            -
          </span>
          <span>{b.text}</span>
        </li>
      ))}
    </ul>
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
  const pad = compact ? "p-5 sm:p-6" : "p-6 sm:p-10 lg:p-12";
  const titleSize = compact
    ? "text-xl sm:text-2xl"
    : "text-[clamp(1.6rem,4vw,3.2rem)]";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-[color:var(--hk-surface,#fff)] shadow-lg ring-1 ring-[color:var(--hk-border,#e5e5e0)] ${className ?? ""}`}
      style={slidePaletteStyle(slide.palette)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 100% 0%, var(--slide-soft), transparent 55%),
            radial-gradient(ellipse 50% 40% at 0% 100%, var(--slide-soft), transparent 50%)`,
        }}
      />
      <div className={`relative ${pad}`}>
        {slide.eyebrow ? (
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "var(--slide-accent)" }}
          >
            {slide.eyebrow}
          </p>
        ) : null}

        <h2
          className={`mt-2 font-black tracking-tight text-[color:var(--hk-text,#222)] ${titleSize}`}
        >
          {slide.title}
        </h2>

        {slide.subtitle ? (
          <p className="mt-3 max-w-3xl text-[clamp(0.95rem,1.5vw,1.2rem)] leading-relaxed text-[color:var(--hk-muted,#8a8a8a)]">
            {slide.subtitle}
          </p>
        ) : null}

        <div
          className={`mt-6 grid gap-6 ${
            slide.illustration && slide.layout !== "agenda"
              ? "lg:grid-cols-[1.2fr_0.8fr] lg:items-center"
              : ""
          }`}
        >
          <div className="space-y-4">
            {slide.body?.map((p) => (
              <p
                key={p}
                className="text-[clamp(0.95rem,1.5vw,1.2rem)] leading-relaxed text-[color:var(--hk-text,#222)]"
              >
                {p}
              </p>
            ))}

            {slide.bullets?.length ? <BulletList items={slide.bullets} /> : null}

            {slide.layout === "tools" && slide.tools ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {slide.tools.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl bg-white/80 p-4 ring-1 ring-[color:var(--hk-border,#e5e5e0)]"
                    style={slidePaletteStyle(t.accent)}
                  >
                    <p
                      className="text-sm font-black"
                      style={{ color: "var(--slide-accent)" }}
                    >
                      {t.name}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--hk-muted,#8a8a8a)]">
                      {t.role}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {slide.layout === "steps" && slide.steps ? (
              <ol className="space-y-3">
                {slide.steps.map((st) => (
                  <li
                    key={st.num}
                    className="flex gap-3 rounded-2xl bg-white/70 p-3.5 ring-1 ring-[color:var(--hk-border,#e5e5e0)]"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                      style={{ background: "var(--slide-accent)" }}
                    >
                      {st.num}
                    </span>
                    <div>
                      <p className="font-bold text-[color:var(--hk-text,#222)]">
                        {st.title}
                      </p>
                      <p className="mt-0.5 text-sm text-[color:var(--hk-muted,#8a8a8a)]">
                        {st.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}

            {slide.layout === "agenda" && slide.agenda ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {slide.agenda.map((a) => (
                  <div
                    key={a.num}
                    className={`rounded-2xl px-3.5 py-3 ring-1 ${
                      a.highlight
                        ? "ring-2"
                        : "ring-[color:var(--hk-border,#e5e5e0)] bg-white/60"
                    }`}
                    style={
                      a.highlight
                        ? {
                            background: "var(--slide-soft)",
                            borderColor: "var(--slide-accent)",
                            boxShadow: `0 0 0 2px var(--slide-accent)`,
                          }
                        : undefined
                    }
                  >
                    <p
                      className="text-[11px] font-bold uppercase tracking-wide"
                      style={{ color: "var(--slide-accent)" }}
                    >
                      {a.num < 10 ? `0${a.num}` : a.num}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[color:var(--hk-text,#222)]">
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[color:var(--hk-muted,#8a8a8a)]">
                      {a.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {slide.layout === "quiz" && slide.quiz ? (
              <div className="space-y-4">
                <p className="text-[clamp(1.05rem,1.8vw,1.35rem)] font-bold text-[color:var(--hk-text,#222)]">
                  {slide.quiz.question}
                </p>
                <ul className="space-y-2">
                  {slide.quiz.options.map((opt) => {
                    const showCorrect = revealQuiz && opt.correct;
                    return (
                      <li
                        key={opt.id}
                        className={`rounded-xl px-4 py-3 text-[clamp(0.95rem,1.4vw,1.1rem)] ring-1 transition ${
                          showCorrect
                            ? "bg-[color:var(--slide-soft)] font-bold"
                            : "bg-white/70 ring-[color:var(--hk-border,#e5e5e0)]"
                        }`}
                        style={
                          showCorrect
                            ? {
                                boxShadow: `inset 0 0 0 2px var(--slide-accent)`,
                              }
                            : undefined
                        }
                      >
                        <span className="mr-2 font-bold opacity-60">
                          {opt.id.toUpperCase()}.
                        </span>
                        {opt.text}
                      </li>
                    );
                  })}
                </ul>
                <AnimatePresence>
                  {revealQuiz ? (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl px-4 py-3 text-sm font-medium"
                      style={{
                        background: "var(--slide-soft)",
                        color: "var(--slide-deep)",
                      }}
                    >
                      - {slide.quiz.explanation}
                    </motion.p>
                  ) : hideQuizHint ? null : (
                    <p className="text-xs text-[color:var(--hk-muted,#8a8a8a)]">
                      Espace pour révéler la réponse
                    </p>
                  )}
                </AnimatePresence>
              </div>
            ) : null}

            {slide.layout === "homework" && slide.homework ? (
              <div className="space-y-3">
                {slide.homework.deadlineHint ? (
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--slide-accent)" }}
                  >
                    {slide.homework.deadlineHint}
                  </p>
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
                    className="rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-sm"
                    style={{ background: "var(--slide-accent)" }}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {slide.illustration && slide.layout !== "agenda" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              className={compact ? "mx-auto max-w-[220px]" : "mx-auto"}
            >
              <SlideIllustration id={slide.illustration} />
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
