"use client";

import { useState } from "react";
import { IconSpark } from "@/components/icons";

export function PolishButton({
  text,
  locale,
  label,
  busyLabel,
  onPolished,
  discrete = false,
  disabled = false,
}: {
  text: string;
  locale: string;
  label: string;
  busyLabel: string;
  onPolished: (next: string) => void;
  discrete?: boolean;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy || disabled || text.trim().length < 3) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        text?: string;
      };
      if (res.ok && typeof data.text === "string" && data.text.trim()) {
        onPolished(data.text);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy || disabled || text.trim().length < 3}
      onClick={() => void run()}
      className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold disabled:opacity-50 ${
        discrete
          ? "border border-white/15 bg-white/5 text-[#e8d4e3]"
          : "border border-[var(--ng-border)] bg-ng-primary-muted text-ng-primary"
      }`}
    >
      <IconSpark className="size-3.5" />
      {busy ? busyLabel : label}
    </button>
  );
}
