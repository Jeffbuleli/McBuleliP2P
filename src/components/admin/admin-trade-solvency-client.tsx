"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCls } from "@/components/admin/admin-ui";
import type { AdminFuturesTradeStats } from "@/lib/trade-futures-stats";
import type { HouseRiskSnapshot } from "@/lib/trade-house-risk";

type Payload = {
  ok: boolean;
  stats: AdminFuturesTradeStats;
  house: HouseRiskSnapshot;
};

type Dict = {
  admin_trade_solvency_title: string;
  admin_trade_solvency_subtitle: string;
  admin_trade_solvency_reserve: string;
  admin_trade_solvency_treasury: string;
  admin_trade_solvency_fees_pool: string;
  admin_trade_solvency_floor: string;
  admin_trade_solvency_mtm: string;
  admin_trade_solvency_stress: string;
  admin_trade_solvency_utilization: string;
  admin_trade_solvency_stress_util: string;
  admin_trade_solvency_circuit: string;
  admin_trade_solvency_circuit_on: string;
  admin_trade_solvency_circuit_off: string;
  admin_trade_solvency_max_lev: string;
  admin_trade_solvency_haircut: string;
  admin_trade_solvency_refresh: string;
  admin_trade_solvency_loading: string;
  admin_trade_solvency_error: string;
  admin_kpi_futures_live_open: string;
  admin_kpi_futures_liq_24h: string;
  admin_kpi_futures_fees_24h: string;
};

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function usdt(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function meterColor(level: HouseRiskSnapshot["alertLevel"]) {
  if (level === "danger") return "bg-rose-500";
  if (level === "warn") return "bg-amber-500";
  return "bg-emerald-500";
}

function Meter({
  label,
  value,
  level,
}: {
  label: string;
  value: number;
  level: HouseRiskSnapshot["alertLevel"];
}) {
  const w = Math.min(100, Math.max(0, value * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-semibold text-[color:var(--fd-text)]">{label}</span>
        <span className="tabular-nums font-bold text-[color:var(--fd-primary)]">
          {pct(value)}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[color:var(--fd-mint)]">
        <div
          className={`h-full rounded-full transition-all ${meterColor(level)}`}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}

export function AdminTradeSolvencyClient({ d }: { d: Dict }) {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/trade/futures-stats", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("fetch_failed");
      const json = (await res.json()) as Payload;
      setData(json);
      setErr(null);
    } catch {
      setErr(d.admin_trade_solvency_error);
    } finally {
      setLoading(false);
    }
  }, [d.admin_trade_solvency_error]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const house = data?.house;
  const stats = data?.stats;

  return (
    <div className={adminCls.page}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={adminCls.h1}>{d.admin_trade_solvency_title}</h2>
          <p className={`mt-1 ${adminCls.muted}`}>{d.admin_trade_solvency_subtitle}</p>
        </div>
        <button
          type="button"
          className={adminCls.btnSecondary}
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          {d.admin_trade_solvency_refresh}
        </button>
      </div>

      {loading && !data ? (
        <p className={adminCls.muted}>{d.admin_trade_solvency_loading}</p>
      ) : null}
      {err ? <p className={adminCls.error}>{err}</p> : null}

      {house ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={adminCls.card}>
              <p className={adminCls.kpiLabel}>{d.admin_trade_solvency_reserve}</p>
              <p className={adminCls.kpiValue}>{usdt(house.reserveUsdt)}</p>
              <p className={adminCls.kpiSub}>
                {d.admin_trade_solvency_treasury}: {usdt(house.reserveBreakdown.treasuryBalanceUsdt)}
                <br />
                {d.admin_trade_solvency_fees_pool}: {usdt(house.reserveBreakdown.liveFeesUsdt)}
                <br />
                {d.admin_trade_solvency_floor}: {usdt(house.reserveBreakdown.floorUsdt)}
              </p>
            </div>
            <div className={adminCls.card}>
              <p className={adminCls.kpiLabel}>{d.admin_trade_solvency_mtm}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-sky-700">
                {usdt(house.markToMarketLiabilityUsdt)}
              </p>
            </div>
            <div className={adminCls.card}>
              <p className={adminCls.kpiLabel}>{d.admin_trade_solvency_stress}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
                {usdt(house.stressLiabilityUsdt)}
              </p>
              <p className={adminCls.kpiSub}>
                +{(house.stressMovePct * 100).toFixed(1)}% adverse move
              </p>
            </div>
            <div className={adminCls.card}>
              <p className={adminCls.kpiLabel}>{d.admin_trade_solvency_circuit}</p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  house.circuitTripped ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {house.circuitTripped
                  ? d.admin_trade_solvency_circuit_on
                  : d.admin_trade_solvency_circuit_off}
              </p>
              <p className={adminCls.kpiSub}>
                {d.admin_trade_solvency_max_lev}: {house.maxLeverageWhileStressed}×
              </p>
            </div>
          </div>

          <section className={`${adminCls.card} space-y-4`}>
            <Meter
              label={d.admin_trade_solvency_utilization}
              value={house.utilizationPct}
              level={house.alertLevel}
            />
            <Meter
              label={d.admin_trade_solvency_stress_util}
              value={house.stressUtilizationPct}
              level={house.alertLevel}
            />
            <p className={adminCls.muted}>
              {d.admin_trade_solvency_haircut}: &gt; {usdt(house.haircutThresholdUsdt)} @{" "}
              {(house.haircutRate * 100).toFixed(0)}% on excess
            </p>
          </section>
        </>
      ) : null}

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={adminCls.card}>
            <p className={adminCls.kpiLabel}>{d.admin_kpi_futures_live_open}</p>
            <p className={adminCls.kpiValue}>{stats.liveOpenPositions}</p>
          </div>
          <div className={adminCls.card}>
            <p className={adminCls.kpiLabel}>{d.admin_kpi_futures_liq_24h}</p>
            <p className="mt-1 text-2xl font-bold text-rose-700">{stats.liquidations24h}</p>
          </div>
          <div className={adminCls.card}>
            <p className={adminCls.kpiLabel}>{d.admin_kpi_futures_fees_24h}</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {usdt(stats.platformFees24hUsdt)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
