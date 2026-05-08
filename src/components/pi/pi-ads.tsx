"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { piInit } from "@/lib/pi-browser";
import { useI18n } from "@/components/i18n-provider";

type AdType = "interstitial" | "rewarded";

function isPiAdsSupported(Pi: NonNullable<Window["Pi"]>): boolean {
  return (
    typeof Pi.nativeFeaturesList === "function" &&
    typeof Pi.Ads?.showAd === "function" &&
    typeof Pi.Ads?.isAdReady === "function" &&
    typeof Pi.Ads?.requestAd === "function"
  );
}

export function PiAdsSection() {
  const { t } = useI18n();
  const [busy, setBusy] = useState<AdType | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  const rewardHint = useMemo(() => t("pi_ads_rewarded_hint"), [t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const Pi = await piInit();
        if (!isPiAdsSupported(Pi)) {
          if (!cancelled) setSupported(false);
          return;
        }
        const features: string[] = await Pi.nativeFeaturesList!().catch(
          (): string[] => [],
        );
        const ok = features.includes("ad_network");
        if (!cancelled) setSupported(ok);
      } catch {
        if (!cancelled) setSupported(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function showAd(type: AdType) {
    setMsg(null);
    setBusy(type);
    try {
      const Pi = await piInit();
      if (!isPiAdsSupported(Pi)) {
        setMsg(t("pi_ads_not_supported"));
        return;
      }

      const ready = await Pi.Ads!.isAdReady(type).catch(() => ({ ready: false }));
      if (!ready?.ready) {
        const req = await Pi.Ads!.requestAd(type);
        if (req?.result !== "AD_LOADED") {
          setMsg(`${t("pi_ads_unavailable")} (${req?.result ?? "unknown"})`);
          return;
        }
      }

      const res = await Pi.Ads!.showAd(type);
      if (res?.type === "interstitial") {
        setMsg(`${t("pi_ads_done")} (${res.result})`);
        return;
      }

      // rewarded
      if (res?.type === "rewarded") {
        if (res.result === "USER_UNAUTHENTICATED") {
          setMsg(t("pi_ads_auth_required"));
          return;
        }
        if (res.result === "ADS_NOT_SUPPORTED") {
          setMsg(t("pi_ads_not_supported"));
          return;
        }
        if (res.result !== "AD_REWARDED") {
          setMsg(`${t("pi_ads_done")} (${res.result})`);
          return;
        }

        const adId = typeof res.adId === "string" ? res.adId : "";
        if (!adId) {
          setMsg(t("pi_ads_rewarded_no_adid"));
          return;
        }

        // Verify with Platform API (server-key protected).
        const vr = await fetchWithDeadline(
          "/api/pi/ads/rewarded-status",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adId }),
            credentials: "same-origin",
          },
          28_000,
        );
        const data = await vr.json().catch(() => ({}));
        if (!vr.ok) {
          const m =
            typeof data === "object" &&
            data !== null &&
            "message" in data &&
            typeof (data as { message: unknown }).message === "string"
              ? (data as { message: string }).message
              : "reward_verify_failed";
          setMsg(`${t("pi_ads_rewarded_verify_failed")}: ${m}`);
          return;
        }

        const st =
          typeof data === "object" && data !== null && "status" in data
            ? (data as { status?: { mediator_ack_status?: unknown } }).status
            : null;
        const ack = st?.mediator_ack_status;
        if (ack === "granted") {
          setMsg(t("pi_ads_rewarded_granted"));
        } else {
          setMsg(`${t("pi_ads_rewarded_not_granted")} (${String(ack)})`);
        }
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : t("pi_ads_failed");
      setMsg(m);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-stone-200">
        <span aria-hidden>📣</span>
        {t("pi_ads_title")}
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-stone-400">
        {t("pi_ads_hint")}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-stone-500">{rewardHint}</p>

      {supported === false ? (
        <p className="mt-3 rounded-xl border border-amber-700/25 bg-amber-950/30 px-3 py-2 text-xs text-amber-200/90">
          {t("pi_ads_not_supported")}
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy !== null || supported === false}
          onClick={() => void showAd("interstitial")}
          className="min-h-[44px] rounded-xl border border-stone-700 bg-stone-950/40 text-xs font-semibold text-stone-100 disabled:opacity-50"
        >
          {busy === "interstitial" ? t("pi_ads_busy") : t("pi_ads_interstitial")}
        </button>
        <button
          type="button"
          disabled={busy !== null || supported === false}
          onClick={() => void showAd("rewarded")}
          className="min-h-[44px] rounded-xl border border-emerald-700/40 bg-emerald-950/30 text-xs font-semibold text-emerald-200 disabled:opacity-50"
        >
          {busy === "rewarded" ? t("pi_ads_busy") : t("pi_ads_rewarded")}
        </button>
      </div>

      {msg ? <p className="mt-3 text-xs text-stone-300">{msg}</p> : null}
    </section>
  );
}

