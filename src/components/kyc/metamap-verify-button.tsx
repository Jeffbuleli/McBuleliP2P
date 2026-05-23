"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { KycIllustrationShield } from "@/components/kyc/kyc-progress";
import { loadMetamapSdk, METAMAP_ERROR_SCREENS } from "@/lib/metamap/load-sdk";
import { isMetamapAlreadyVerifiedSignal } from "@/lib/metamap/signals";

export function MetamapVerifyButton({
  clientId,
  flowId,
  metadata,
  language,
  identityId,
  verificationId,
  onStarted,
  onFinished,
  onExited,
  onError,
  onAlreadyVerified,
}: {
  clientId: string;
  flowId: string;
  metadata: Record<string, string>;
  language?: string;
  identityId?: string | null;
  verificationId?: string | null;
  onStarted?: (detail: { identityId?: string; verificationId?: string }) => void;
  onFinished?: (detail: { identityId?: string; verificationId?: string }) => void;
  onExited?: () => void;
  onError?: (screen?: string) => void;
  onAlreadyVerified?: (detail: { identityId?: string; verificationId?: string }) => void;
}) {
  const { t } = useI18n();
  const verificationRef = useRef<MetamapVerificationInstance | null>(null);
  const callbacksRef = useRef({ onStarted, onFinished, onExited, onError, onAlreadyVerified });
  callbacksRef.current = { onStarted, onFinished, onExited, onError, onAlreadyVerified };
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let instance: MetamapVerificationInstance | null = null;

    const onStart = (ev: MetamapSdkEvent) => {
      setStarting(false);
      callbacksRef.current.onStarted?.(ev.detail ?? {});
    };
    const onFinish = (ev: MetamapSdkEvent) => {
      setStarting(false);
      callbacksRef.current.onFinished?.(ev.detail ?? {});
    };
    const onExit = () => {
      setStarting(false);
      callbacksRef.current.onExited?.();
    };
    const onScreen = (ev: MetamapSdkEvent) => {
      const detail = ev.detail ?? {};
      if (isMetamapAlreadyVerifiedSignal(detail)) {
        setStarting(false);
        callbacksRef.current.onAlreadyVerified?.(detail);
        return;
      }
      const screen = detail.screen;
      if (screen && METAMAP_ERROR_SCREENS.has(screen)) {
        setStarting(false);
        callbacksRef.current.onError?.(screen);
      }
    };

    setReady(false);
    setLoadFailed(false);

    void loadMetamapSdk()
      .then(() => {
        if (cancelled || !window.MetamapVerification) {
          throw new Error("metamap_class_missing");
        }
        instance = new window.MetamapVerification({
          clientId,
          flowId,
          metadata,
          language: language ?? "fr",
          color: "#305f33",
          ...(identityId ? { identityId } : {}),
          ...(identityId && verificationId ? { verificationId } : {}),
        });
        instance.on("metamap:userStartedSdk", onStart);
        instance.on("metamap:userFinishedSdk", onFinish);
        instance.on("metamap:exitedSdk", onExit);
        instance.on("metamap:screen", onScreen);
        verificationRef.current = instance;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
      if (instance) {
        instance.off("metamap:userStartedSdk", onStart);
        instance.off("metamap:userFinishedSdk", onFinish);
        instance.off("metamap:exitedSdk", onExit);
        instance.off("metamap:screen", onScreen);
      }
      verificationRef.current = null;
    };
  }, [clientId, flowId, metadata, language, identityId, verificationId]);

  const start = useCallback(() => {
    if (!verificationRef.current) return;
    setStarting(true);
    try {
      verificationRef.current.start();
    } catch {
      setStarting(false);
      callbacksRef.current.onError?.("commonError");
    }
  }, []);

  if (loadFailed) {
    return (
      <p className="text-center text-[10px] text-rose-700">{t("kyc_sdk_load_failed")}</p>
    );
  }

  return (
    <button
      type="button"
      disabled={!ready || starting}
      onClick={start}
      className="flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-[color:var(--fd-primary)] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[color:var(--fd-primary)]/25 transition active:scale-[0.99] disabled:opacity-60"
    >
      <KycIllustrationShield className="h-5 w-5 shrink-0 text-white" />
      <span>{starting ? "…" : ready ? t("kyc_verify_cta") : "…"}</span>
    </button>
  );
}
