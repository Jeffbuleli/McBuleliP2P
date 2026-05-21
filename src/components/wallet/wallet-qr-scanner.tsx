"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useI18n } from "@/components/i18n-provider";

const READER_PREFIX = "mcbuleli-pay-reader-";

export function WalletQrScanner({
  open,
  onClose,
  onScan,
}: {
  open: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}) {
  const { t } = useI18n();
  const uid = useId().replace(/:/g, "");
  const regionId = `${READER_PREFIX}${uid}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let stopped = false;
    setCamErr(null);
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (text) => {
          if (stopped) return;
          stopped = true;
          void scanner.stop().finally(() => {
            scannerRef.current = null;
            onScan(text);
          });
        },
        () => {},
      )
      .catch(() => {
        setCamErr(t("wallet_scan_camera_denied"));
      });

    return () => {
      stopped = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s?.isScanning) {
        void s.stop().catch(() => {});
      }
    };
  }, [open, onScan, regionId, t]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-stone-950/95"
      role="dialog"
      aria-modal
      aria-label={t("wallet_scan_pay")}
    >
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90">
            McBuleli Pay
          </p>
          <p className="text-sm font-bold text-white">{t("wallet_scan_pay")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white"
          aria-label={t("wallet_scan_close")}
        >
          ×
        </button>
      </div>

      <div className="relative mx-4 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black">
        <div id={regionId} className="w-full [&_video]:rounded-2xl" />
        <div
          className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-[color:var(--fd-primary)] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
          aria-hidden
        />
      </div>

      {camErr ? (
        <p className="mx-4 mt-3 rounded-xl bg-rose-950/80 px-3 py-2 text-center text-sm text-rose-100">
          {camErr}
        </p>
      ) : (
        <p className="mx-4 mt-3 text-center text-xs text-stone-400">{t("wallet_scan_hint")}</p>
      )}
    </div>
  );
}
