"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { messages } from "@/lib/i18n";
import { getYouthScenario } from "@/lib/youth/scenarios";
import { citizenShellMaxWidth, useDeviceClass } from "@/lib/ui/device";

type Turn = { role: "user" | "assistant"; content: string };

export function YouthScenarioChat({
  scenarioId,
  initialLocale,
}: {
  scenarioId: string;
  initialLocale?: string;
}) {
  const { locale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();
  const scenario = getYouthScenario(scenarioId);
  const [history, setHistory] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestSos, setSuggestSos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const booted = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scenario || booted.current) return;
    booted.current = true;
    setHistory([{ role: "assistant", content: scenario.intro[locale] }]);
  }, [scenario, locale]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, busy]);

  if (!scenario) {
    return (
      <main className="ng-shell mx-auto px-4 py-10 text-sm text-ng-muted">
        <Link href={href("/jeunesse")}>{t.youthBackToList}</Link>
        <p className="mt-4">{t.errorGeneric}</p>
      </main>
    );
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const nextHistory: Turn[] = [...history, { role: "user", content: text }];
    setHistory(nextHistory);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/youth/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          locale,
          history: nextHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) {
        setError(t.errorGeneric);
        setBusy(false);
        return;
      }
      setHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.reply as string },
      ]);
      setSuggestSos(Boolean(data.suggestSos));
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className={`ng-shell mx-auto flex min-h-dvh flex-col pb-4 pt-5 ${citizenShellMaxWidth(device)}`}
    >
      <header className="flex items-center justify-between gap-3">
        <Link href={href("/jeunesse")} className="text-sm font-medium text-ng-muted">
          {t.youthBackToList}
        </Link>
        <span className="text-xs font-semibold text-ng-primary">
          {scenario.title[locale]}
        </span>
      </header>

      {suggestSos ? (
        <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-ng-urgent">
          {t.youthSosHint}{" "}
          <Link href={href("/sos")} className="underline font-bold">
            SOS
          </Link>
        </div>
      ) : null}

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pb-4">
        {history.map((turn, i) => (
          <div
            key={`${turn.role}-${i}`}
            className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              turn.role === "user"
                ? "ml-auto bg-ng-primary text-white"
                : "bg-ng-surface border border-[var(--ng-border)] text-ng-text"
            }`}
          >
            {turn.content}
          </div>
        ))}
        {busy ? (
          <p className="text-xs text-ng-muted">{t.sending}</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="mb-2 text-sm font-medium text-ng-urgent">{error}</p>
      ) : null}

      <div className="sticky bottom-0 border-t border-[var(--ng-border)] bg-ng-bg pt-3">
        <label className="text-xs font-semibold text-ng-muted">{t.youthYourTurn}</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.youthPlaceholder}
          rows={3}
          className="mt-1.5 w-full resize-none rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-3 text-sm text-ng-text outline-none focus:ring-2 ring-ng-primary"
        />
        <button
          type="button"
          disabled={!input.trim() || busy}
          onClick={() => void send()}
          className="mt-2 min-h-11 w-full rounded-2xl bg-ng-secondary px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t.youthSend}
        </button>
      </div>
    </main>
  );
}
