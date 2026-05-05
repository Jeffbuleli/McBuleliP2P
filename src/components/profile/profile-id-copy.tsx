"use client";

import { useState } from "react";

export function CopyValueButton({
  value,
  copyLabel,
  copiedLabel,
}: {
  value: string;
  copyLabel: string;
  copiedLabel: string;
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

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="shrink-0 rounded-lg border border-stone-600 bg-stone-900/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-200 transition hover:border-emerald-600/50 hover:text-emerald-300"
    >
      {done ? copiedLabel : copyLabel}
    </button>
  );
}

export function ProfileIdCopy({
  id,
  copyLabel,
  copiedLabel,
}: {
  id: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <CopyValueButton value={id} copyLabel={copyLabel} copiedLabel={copiedLabel} />
  );
}
