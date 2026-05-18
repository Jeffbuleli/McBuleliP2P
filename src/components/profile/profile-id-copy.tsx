"use client";

import { useState } from "react";

export function CopyValueButton({
  value,
  copyLabel,
  copiedLabel,
  variant = "dark",
}: {
  value: string;
  copyLabel: string;
  copiedLabel: string;
  variant?: "dark" | "light";
}) {
  const [done, setDone] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    } catch {
      /* ignore */
    }
  }

  const btnClass =
    variant === "light"
      ? "shrink-0 rounded-full border border-[var(--fd-border)] bg-white px-2.5 py-0.5 text-[10px] font-bold text-[var(--fd-primary)]"
      : "shrink-0 rounded-lg border border-stone-600 bg-stone-900/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-200 transition hover:border-emerald-600/50 hover:text-emerald-300";

  return (
    <button type="button" onClick={() => void onCopy()} className={btnClass}>
      {done ? copiedLabel : copyLabel}
    </button>
  );
}

export function ProfileIdCopy({
  id,
  copyLabel,
  copiedLabel,
  variant = "dark",
}: {
  id: string;
  copyLabel: string;
  copiedLabel: string;
  variant?: "dark" | "light";
}) {
  return (
    <CopyValueButton
      value={id}
      copyLabel={copyLabel}
      copiedLabel={copiedLabel}
      variant={variant}
    />
  );
}
