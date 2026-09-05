"use client";

import { useState } from "react";
import { IconSpark } from "@/components/icons";

export function PolishButton({
  text,
  locale,
  label,
  busyLabel,
  unavailableLabel,
  errorLabel,
  onPolished,
  discrete = false,
  disabled = false,
  compact = false,
  className = "",
}: {
  text: string;
  locale: string;
  label: string;
  busyLabel: string;
  /** Shown when OpenAI polish is unavailable (local mode / no key). */
  unavailableLabel: string;
  errorLabel: string;
  onPolished: (next: string) => void;
  discrete?: boolean;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function run() {
    if (busy || disabled || text.trim().length < 3) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        text?: string;
        provider?: "openai" | "local";
      };
      if (!res.ok) {
        setNotice(errorLabel);
        return;
      }
      const next = typeof data.text === "string" ? data.text.trim() : "";
      if (!next) {
        setNotice(errorLabel);
        return;
      }
      // Local / no-key mode echoes input — be honest instead of fake success.
      if (data.provider === "local" || next === text.trim()) {
        setNotice(unavailableLabel);
        return;
      }
      onPolished(next);
    } catch {
      setNotice(errorLabel);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={`inline-flex flex-col items-stretch gap-1 ${className}`}>
      <button
        type="button"
        disabled={busy || disabled || text.trim().length < 3}
        onClick={() => void run()}
        title={busy ? busyLabel : label}
        aria-label={busy ? busyLabel : label}
        className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl disabled:opacity-50 ${
          compact
            ? "w-full px-1.5 text-[10px] font-semibold leading-tight sm:px-2 sm:text-xs"
            : "px-3 text-xs font-semibold"
        } ${
          discrete
            ? "border border-white/15 bg-white/5 text-[#e8d4e3]"
            : "border border-[var(--ng-border)] bg-ng-primary-muted text-ng-primary"
        }`}
      >
        <IconSpark
          className={`shrink-0 ${busy ? "animate-pulse" : ""} ${compact ? "size-4" : "size-5"}`}
        />
        <span className={compact ? "truncate" : undefined}>
          {busy ? busyLabel : label}
        </span>
      </button>
      {notice ? (
        <span
          className={`text-[10px] leading-snug ${
            discrete ? "text-[#c9a0bc]" : "text-ng-muted"
          }`}
          role="status"
        >
          {notice}
        </span>
      ) : null}
    </span>
  );
}
