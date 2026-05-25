"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { adminCls } from "@/components/admin/admin-ui";
import {
  LANDING_PROMO_SLOT_IDS,
  type LandingPromoSlotId,
  type LandingPromosConfig,
} from "@/lib/landing-promos-config";

const SLOT_LABELS: Record<LandingPromoSlotId, string> = {
  wallet: "Wallet",
  p2p: "P2P",
  futures: "Futures",
  avec: "AVEC",
  bots: "Bots",
  staking: "Staking",
};

export default function LandingPromosSettingsClient() {
  const { t } = useI18n();
  const [config, setConfig] = useState<LandingPromosConfig | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/settings/landing-promos", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.config) {
        setConfig(data.config as LandingPromosConfig);
      } else {
        setMsg(typeof data.error === "string" ? data.error : t("admin_landing_ads_load_failed"));
      }
    })();
  }, [t]);

  function updatePromo(id: LandingPromoSlotId, patch: Partial<LandingPromosConfig["promos"][0]>) {
    if (!config) return;
    setConfig({
      ...config,
      promos: config.promos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  }

  async function save() {
    if (!config) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings/landing-promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setMsg(
          typeof data.error === "string" ? data.error : t("admin_landing_ads_save_failed"),
        );
        return;
      }
      if (data.config) setConfig(data.config as LandingPromosConfig);
      setMsg(t("admin_landing_ads_saved"));
    } finally {
      setBusy(false);
    }
  }

  async function resetDefaults() {
    if (!confirm(t("admin_landing_ads_reset_confirm"))) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings/landing-promos", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setMsg(t("admin_landing_ads_save_failed"));
        return;
      }
      if (data.config) setConfig(data.config as LandingPromosConfig);
      setMsg(t("admin_landing_ads_reset_done"));
    } finally {
      setBusy(false);
    }
  }

  if (!config) {
    return <p className={adminCls.muted}>…</p>;
  }

  const ordered = [...config.promos].sort(
    (a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99),
  );

  return (
    <div className="space-y-4">
      <p className={`text-sm ${adminCls.muted}`}>{t("admin_landing_ads_hint")}</p>

      <div className={`${adminCls.card} grid gap-3 sm:grid-cols-2`}>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
            {t("admin_landing_ads_heading_en")}
          </span>
          <input
            value={config.headingEn ?? ""}
            onChange={(e) => setConfig({ ...config, headingEn: e.target.value })}
            className={adminCls.input}
            placeholder={t("landing_promo_heading")}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
            {t("admin_landing_ads_heading_fr")}
          </span>
          <input
            value={config.headingFr ?? ""}
            onChange={(e) => setConfig({ ...config, headingFr: e.target.value })}
            className={adminCls.input}
          />
        </label>
      </div>

      <ul className="space-y-3">
        {LANDING_PROMO_SLOT_IDS.map((slotId) => {
          const p = ordered.find((x) => x.id === slotId);
          if (!p) return null;
          return (
            <li key={slotId} className={`${adminCls.card} space-y-3`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-[color:var(--fd-text)]">
                  {SLOT_LABELS[slotId]}
                </p>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) => updatePromo(slotId, { enabled: e.target.checked })}
                  />
                  {t("admin_landing_ads_enabled")}
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
                    {t("admin_landing_ads_image")}
                  </span>
                  <input
                    value={p.image}
                    onChange={(e) => updatePromo(slotId, { image: e.target.value })}
                    className={adminCls.input}
                    placeholder="/ads/mcbuleli-ad-….jpg"
                  />
                </label>
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
                    {t("admin_landing_ads_href")}
                  </span>
                  <input
                    value={p.href}
                    onChange={(e) => updatePromo(slotId, { href: e.target.value })}
                    className={adminCls.input}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
                    {t("admin_landing_ads_title_en")}
                  </span>
                  <input
                    value={p.titleEn ?? ""}
                    onChange={(e) => updatePromo(slotId, { titleEn: e.target.value })}
                    className={adminCls.input}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
                    {t("admin_landing_ads_title_fr")}
                  </span>
                  <input
                    value={p.titleFr ?? ""}
                    onChange={(e) => updatePromo(slotId, { titleFr: e.target.value })}
                    className={adminCls.input}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
                    {t("admin_landing_ads_tag_en")}
                  </span>
                  <input
                    value={p.tagEn ?? ""}
                    onChange={(e) => updatePromo(slotId, { tagEn: e.target.value })}
                    className={adminCls.input}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
                    {t("admin_landing_ads_tag_fr")}
                  </span>
                  <input
                    value={p.tagFr ?? ""}
                    onChange={(e) => updatePromo(slotId, { tagFr: e.target.value })}
                    className={adminCls.input}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
                    {t("admin_landing_ads_sort")}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={p.sortOrder ?? 0}
                    onChange={(e) =>
                      updatePromo(slotId, { sortOrder: Number(e.target.value) || 0 })
                    }
                    className={adminCls.input}
                  />
                </label>
              </div>

              {p.image ? (
                <div className="relative h-24 overflow-hidden rounded-xl border border-[color:var(--fd-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {msg ? (
        <p
          className={`text-sm ${msg.includes("fail") || msg.includes("échou") ? "text-rose-700" : "text-emerald-800"}`}
        >
          {msg}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className={adminCls.btnPrimary}
        >
          {busy ? "…" : t("admin_landing_ads_save")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void resetDefaults()}
          className={adminCls.btnSecondary}
        >
          {t("admin_landing_ads_reset")}
        </button>
        <a href="/" target="_blank" rel="noopener noreferrer" className={adminCls.back}>
          {t("admin_landing_ads_preview")} ↗
        </a>
      </div>
    </div>
  );
}
