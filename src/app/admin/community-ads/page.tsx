"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  AdminBackLink,
  AdminPageHeader,
  adminCls,
} from "@/components/admin/admin-ui";

type Campaign = {
  id: string;
  status: string;
  budgetMcb: string;
  spentMcb: string;
  brandName: string;
  productCode: string;
  createdAt: string;
};

type Pools = {
  creatorFund: number;
  burnQueue: number;
  opsTreasury: number;
};

export default function AdminCommunityAdsPage() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pools, setPools] = useState<Pools | null>(null);
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [status, setStatus] = useState("pending");
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const q = status === "all" ? "" : `?status=${status}`;
    const res = await fetch(`/api/admin/community-ads${q}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.message ?? "Error");
      return;
    }
    setCampaigns((data.campaigns ?? []) as Campaign[]);
    setPools(data.pools as Pools);
    setAdsEnabled(Boolean(data.adsEnabled));
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setCampaignStatus(
    id: string,
    next: "approved" | "active" | "paused" | "rejected",
  ) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/community-ads/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.message ?? "Error");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <AdminBackLink />
      <AdminPageHeader
        title={fr ? "Ads McB" : "McB Ads"}
        subtitle={
          fr
            ? "Campagnes · pools 50/25/25 · gated BSC"
            : "Campaigns · 50/25/25 pools · BSC-gated"
        }
      />

      <div
        className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
          adsEnabled
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        {adsEnabled
          ? fr
            ? "COMMUNITY_ADS_ENABLED = on"
            : "COMMUNITY_ADS_ENABLED = on"
          : fr
            ? "Ads off — activer après lancement BSC"
            : "Ads off — enable after BSC launch"}
      </div>

      {pools ? (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Fund", v: pools.creatorFund },
            { label: "Burn", v: pools.burnQueue },
            { label: "Ops", v: pools.opsTreasury },
          ].map((p) => (
            <div
              key={p.label}
              className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-center"
            >
              <p className="text-lg font-bold tabular-nums">{p.v}</p>
              <p className="text-[10px] font-semibold uppercase text-stone-500">
                {p.label}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {["pending", "approved", "active", "paused", "all"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`${adminCls.btnSecondary} ${
              status === s ? "!bg-stone-900 !text-white" : ""
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-stone-50 text-[10px] uppercase text-stone-500">
            <tr>
              <th className="px-3 py-2">Brand</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Budget</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-stone-400"
                >
                  {fr ? "Aucune campagne" : "No campaigns"}
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id} className="border-t border-stone-100">
                  <td className="px-3 py-2 font-medium">{c.brandName}</td>
                  <td className="px-3 py-2 text-xs text-stone-600">
                    {c.productCode}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {c.spentMcb}/{c.budgetMcb}
                  </td>
                  <td className="px-3 py-2 text-xs">{c.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        className={adminCls.btnPrimary}
                        onClick={() => void setCampaignStatus(c.id, "approved")}
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        className={adminCls.btnSecondary}
                        onClick={() => void setCampaignStatus(c.id, "paused")}
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        className={adminCls.btnSecondary}
                        onClick={() => void setCampaignStatus(c.id, "rejected")}
                      >
                        X
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
