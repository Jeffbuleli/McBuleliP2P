"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

export function MetamapVerifyButton({
  clientId,
  flowId,
  metadata,
  language,
  onStarted,
  onFinished,
  onExited,
}: {
  clientId: string;
  flowId: string;
  metadata: Record<string, string>;
  language?: string;
  onStarted?: (detail: { identityId?: string; verificationId?: string }) => void;
  onFinished?: (detail: { identityId?: string; verificationId?: string }) => void;
  onExited?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const callbacksRef = useRef({ onStarted, onFinished, onExited });
  callbacksRef.current = { onStarted, onFinished, onExited };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.replaceChildren();
    const btn = document.createElement("metamap-button");
    btn.setAttribute("clientid", clientId);
    btn.setAttribute("flowid", flowId);
    btn.setAttribute("metadata", JSON.stringify(metadata));
    btn.setAttribute("color", "#305f33");
    btn.setAttribute("language", language ?? "fr");
    host.appendChild(btn);

    const onStart = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        identityId?: string;
        verificationId?: string;
      };
      callbacksRef.current.onStarted?.(detail);
    };
    const onFinish = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        identityId?: string;
        verificationId?: string;
      };
      callbacksRef.current.onFinished?.(detail);
    };
    const onExit = () => callbacksRef.current.onExited?.();

    btn.addEventListener("metamap:userStartedSdk", onStart);
    btn.addEventListener("metamap:userFinishedSdk", onFinish);
    btn.addEventListener("metamap:exitedSdk", onExit);

    return () => {
      btn.removeEventListener("metamap:userStartedSdk", onStart);
      btn.removeEventListener("metamap:userFinishedSdk", onFinish);
      btn.removeEventListener("metamap:exitedSdk", onExit);
      host.replaceChildren();
    };
  }, [clientId, flowId, metadata, language]);

  return (
    <>
      <Script src="https://web-button.metamap.com/button.js" strategy="lazyOnload" />
      <div ref={hostRef} className="metamap-host flex w-full max-w-sm justify-center" />
    </>
  );
}
