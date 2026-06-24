"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { FlowInput, FlowTextarea } from "@/components/p2p/p2p-flow-ui";
import { P2pConfirmSheet } from "@/components/p2p/p2p-confirm-sheet";
import { clientErrorText } from "@/lib/client-error-text";
import type { P2pMyAd } from "@/components/p2p/p2p-my-ad-card";

export function P2pAdEditSheet({
  ad,
  open,
  onClose,
  onSaved,
}: {
  ad: P2pMyAd | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [price, setPrice] = useState("");
  const [minFiat, setMinFiat] = useState("");
  const [maxFiat, setMaxFiat] = useState("");
  const [terms, setTerms] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ad || !open) return;
    setPrice(ad.price);
    setMinFiat(ad.minFiat);
    setMaxFiat(ad.maxFiat);
    setTerms(ad.terms ?? "");
    setErr(null);
  }, [ad, open]);

  async function save() {
    if (!ad) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/p2p/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price,
          minFiat,
          maxFiat,
          terms: terms.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const key = typeof data.error === "string" ? data.error : "p2p_action_not_allowed";
        setErr(clientErrorText(t, key));
        return;
      }
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  if (!ad) return null;

  return (
    <P2pConfirmSheet
      open={open}
      variant="info"
      title={t("p2p_ad_edit_title")}
      subtitle={t("p2p_ad_edit_sub")}
      confirmLabel={t("p2p_ad_save")}
      cancelLabel={t("p2p_confirm_common_cancel")}
      busy={busy}
      onConfirm={() => void save()}
      onClose={onClose}
    >
      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("p2p_price_per_unit")}
          </span>
          <FlowInput value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("p2p_min_fiat")}
            </span>
            <FlowInput
              value={minFiat}
              onChange={(e) => setMinFiat(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("p2p_max_fiat")}
            </span>
            <FlowInput
              value={maxFiat}
              onChange={(e) => setMaxFiat(e.target.value)}
              inputMode="decimal"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("p2p_ad_terms")}
          </span>
          <FlowTextarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder={t("p2p_ad_terms_placeholder")}
            rows={3}
          />
        </label>
        {err ? <p className="text-xs font-semibold text-rose-700">{err}</p> : null}
      </div>
    </P2pConfirmSheet>
  );
}
