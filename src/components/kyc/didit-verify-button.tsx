"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { KycIconLaunch } from "@/components/kyc/kyc-illustrations";

export type DiditCompleteDetail = {
  sessionId?: string;
  sessionStatus?: string;
};

export function DiditVerifyButton({
  autoStart,
  onStarted,
  onFinished,
  onCancelled,
  onError,
}: {
  autoStart?: boolean;
  onStarted?: (detail: DiditCompleteDetail) => void;
  onFinished?: (detail: DiditCompleteDetail) => void;
  onCancelled?: () => void;
  onError?: (message?: string) => void;
}) {
  const { t } = useI18n();
  const callbacksRef = useRef({ onStarted, onFinished, onCancelled, onError });
  callbacksRef.current = { onStarted, onFinished, onCancelled, onError };
  const [starting, setStarting] = useState(false);

  const start = useCallback(async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/kyc/session", {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        sessionId?: string;
        error?: string;
      };
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "didit_session_failed");
      }

      const sessionId = json.sessionId;
      callbacksRef.current.onStarted?.({
        sessionId,
        sessionStatus: "In Progress",
      });

      const { DiditSdk } = await import("@didit-protocol/sdk-web");
      DiditSdk.shared.onComplete = (result) => {
        setStarting(false);
        if (result.type === "completed") {
          callbacksRef.current.onFinished?.({
            sessionId: result.session?.sessionId ?? sessionId,
            sessionStatus: result.session?.status ?? "In Review",
          });
        } else if (result.type === "cancelled") {
          callbacksRef.current.onCancelled?.();
        } else {
          callbacksRef.current.onError?.(result.error?.message ?? "commonError");
        }
      };

      DiditSdk.shared.startVerification({
        url: json.url,
        configuration: { closeModalOnComplete: true },
      });
    } catch {
      setStarting(false);
      callbacksRef.current.onError?.("commonError");
    }
  }, []);

  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    void start();
  }, [autoStart, start]);

  return (
    <button
      type="button"
      disabled={starting}
      onClick={() => void start()}
      className="flex w-full max-w-xs items-center justify-center gap-2.5 rounded-2xl bg-[color:var(--fd-primary)] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[color:var(--fd-primary)]/20 transition active:scale-[0.98] disabled:opacity-60"
    >
      <KycIconLaunch className="h-5 w-5 shrink-0 text-white" />
      <span>{starting ? "…" : t("kyc_verify_cta")}</span>
    </button>
  );
}
