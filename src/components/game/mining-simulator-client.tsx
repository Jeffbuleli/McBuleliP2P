"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

type Site = {
  id: string;
  name: string;
  mineralKey: string;
  richness: number;
  riskLevel: number;
  riskLabel: string;
  riskLabelFr: string;
};

type Stock = { mineralKey: string; quantityKg: number; purityPct: number };

type TransportOption = {
  key: string;
  label: string;
  labelFr: string;
  capacityKg: number;
  fuelPerKm: number;
  maintenanceMcb: number;
};

type TransportRoute = {
  key: string;
  label: string;
  labelFr: string;
  distanceKm: number;
};

type ActiveTransport = {
  id: string;
  mineralKey: string;
  quantityKg: number;
  vehicleKey: string | null;
  routeKey: string;
  completesAt: string | null;
  rewardMcb: number;
};

type Progression = {
  stage: string;
  stageLabel: string;
  stageLabelFr: string;
  avatarEmoji: string;
  gear: string[];
  gearFr: string[];
  currentRoleLabel: string;
  currentRoleLabelFr: string;
  xpToNext: number | null;
  unlocks: string[];
  unlocksFr: string[];
};

type BpBoost = { id: string; costBp: number; label: string; labelFr: string };

type ShopItem = {
  key: string;
  category: string;
  label: string;
  labelFr: string;
  costMcb: number;
  owned: boolean;
  canBuy: boolean;
  lockReason: string | null;
  lockReasonFr: string | null;
};

type RolePromotion = {
  nextRole: string | null;
  nextRoleLabel: string;
  nextRoleLabelFr: string;
  entryFeeMcb: number;
  minXp: number;
  canPromote: boolean;
  blockReason: string | null;
  blockReasonFr: string | null;
};

type RefineryAccess = {
  available: boolean;
  reason: string;
  reasonFr: string;
  mcbPerKg: number;
  energyCost: number;
  purityBonus: number;
};

type Dashboard = {
  player: {
    role: string;
    mcbBalance: number;
    bpBalance: number;
    energy: number;
    energyCap: number;
    xp: number;
    reputation: number;
    lifestyleTier: number;
    toolDurability: number;
    community: { handle: string; displayName: string; avatarUrl: string | null };
  };
  progression: Progression;
  rolePromotion: RolePromotion;
  refinery: RefineryAccess;
  shopItems: ShopItem[];
  sites: Site[];
  stocks: Stock[];
  transportOptions: TransportOption[];
  transportRoutes: TransportRoute[];
  bpBoosts: BpBoost[];
  activeTransports: ActiveTransport[];
  worldEvents: { id: string; title: string }[];
};

type MarketPrice = {
  mineralKey: string;
  label: string;
  currentPriceMcb: number;
  demandIndex: number;
};

type TransportQuote = {
  fuelCostMcb: number;
  maintenanceMcb: number;
  totalCostMcb: number;
  riskPct: number;
  durationMin: number;
  estimatedRewardMcb: number;
  weatherDelay: boolean;
  purityBonus: boolean;
  route: { label: string; labelFr: string };
  vehicle: { label: string; labelFr: string; capacityKg: number };
};

function purityGrade(pct: number, fr: boolean): string {
  if (pct >= 90) return "Premium";
  if (pct >= 75) return fr ? "Standard" : "Standard";
  if (pct >= 55) return fr ? "Faible" : "Low grade";
  return fr ? "Rebut" : "Waste";
}

function purityColor(pct: number): string {
  if (pct >= 90) return "text-[#305f33]";
  if (pct >= 75) return "text-[#44403c]";
  if (pct >= 55) return "text-[#b45309]";
  return "text-[#b91c1c]";
}

function riskBadgeClass(level: number): string {
  if (level < 30) return "bg-[#e8f3ee] text-[#305f33]";
  if (level < 55) return "bg-[#fef3c7] text-[#b45309]";
  return "bg-[#fee2e2] text-[#b91c1c]";
}

export function MiningSimulatorClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [data, setData] = useState<Dashboard | null>(null);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [advisorQ, setAdvisorQ] = useState("");
  const [advisorA, setAdvisorA] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<"ok" | "warn" | "fail">("ok");

  const [transportOpen, setTransportOpen] = useState(false);
  const [transportStock, setTransportStock] = useState<Stock | null>(null);
  const [vehicleKey, setVehicleKey] = useState("");
  const [routeKey, setRouteKey] = useState("");
  const [transportQty, setTransportQty] = useState(5);
  const [quote, setQuote] = useState<TransportQuote | null>(null);
  const [shopCategory, setShopCategory] = useState<string>("tool");
  const [shopExpanded, setShopExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, marketRes] = await Promise.all([
        fetch("/api/game/player"),
        fetch("/api/game/market"),
      ]);
      if (dashRes.ok) setData(await dashRes.json());
      if (marketRes.ok) {
        const m = await marketRes.json();
        setPrices(m.prices ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const showMsg = (text: string, tone: "ok" | "warn" | "fail" = "ok") => {
    setMsg(text);
    setMsgTone(tone);
  };

  const act = async (
    label: string,
    fn: () => Promise<Response>,
    onSuccess?: (body: Record<string, unknown>) => string | void,
  ): Promise<Record<string, unknown> | null> => {
    setBusy(label);
    setMsg(null);
    try {
      const res = await fn();
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        showMsg(String(body.message ?? "Error"), "fail");
        return null;
      }
      const custom = onSuccess?.(body);
      if (custom) {
        const tone =
          body.outcome === "failed" ? "fail" : body.outcome === "partial" ? "warn" : "ok";
        showMsg(custom, tone);
      } else {
        showMsg(fr ? "Action réussie" : "Success");
      }
      await load();
      return body;
    } finally {
      setBusy(null);
    }
  };

  const fetchQuote = useCallback(async () => {
    if (!transportStock || !vehicleKey || !routeKey) {
      setQuote(null);
      return;
    }
    const params = new URLSearchParams({
      mineralKey: transportStock.mineralKey,
      quantityKg: String(transportQty),
      vehicleKey,
      routeKey,
    });
    const res = await fetch(`/api/game/transport/quote?${params}`);
    if (res.ok) {
      setQuote(await res.json());
    } else {
      setQuote(null);
    }
  }, [transportStock, vehicleKey, routeKey, transportQty]);

  useEffect(() => {
    if (transportOpen) void fetchQuote();
  }, [transportOpen, fetchQuote]);

  const openTransport = (stock: Stock) => {
    setTransportStock(stock);
    setTransportQty(Math.min(stock.quantityKg, 10));
    const firstVehicle = data?.transportOptions[0]?.key ?? "bicycle";
    const firstRoute = data?.transportRoutes[0]?.key ?? "village_market";
    setVehicleKey(firstVehicle);
    setRouteKey(firstRoute);
    setQuote(null);
    setTransportOpen(true);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-[#78716c]">
        {fr ? "Chargement du simulateur…" : "Loading simulator…"}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-[#78716c]">
          {fr ? "Connectez-vous pour jouer." : "Sign in to play."}
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-[#305f33]">
          {fr ? "Connexion" : "Login"}
        </Link>
      </div>
    );
  }

  const p = data.player;
  const prog = data.progression;
  const promo = data.rolePromotion;
  const refinery = data.refinery;
  const news = data.worldEvents.length > 0 ? data.worldEvents : [];
  const shopFiltered = data.shopItems.filter((i) => i.category === shopCategory);
  const shopVisible = shopExpanded ? shopFiltered : shopFiltered.slice(0, 5);

  const msgClass =
    msgTone === "fail"
      ? "bg-[#fee2e2] text-[#b91c1c]"
      : msgTone === "warn"
        ? "bg-[#fef3c7] text-[#b45309]"
        : "bg-[#e8f3ee] text-[#305f33]";

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/app/community" className="text-sm font-semibold text-[#305f33]">
          ← Community
        </Link>
      </div>

      {news.length > 0 ? (
        <div className="mb-3 overflow-hidden rounded-xl bg-[#1c1917] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8e6cf]">
            {fr ? "Actualités marché" : "Market news"}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/90">{news[0]!.title}</p>
        </div>
      ) : null}

      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#305f33] p-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8e6cf]">
              McBuleli Congo Mining
            </p>
            <h1 className="mt-1 text-xl font-bold">{p.community.displayName}</h1>
            <p className="text-xs text-white/70">@{p.community.handle}</p>
          </div>
          <span className="text-3xl" title={fr ? prog.stageLabelFr : prog.stageLabel}>
            {prog.avatarEmoji}
          </span>
        </div>

        <div className="mt-3 rounded-xl bg-white/10 px-3 py-2">
          <p className="text-xs font-semibold text-[#a8e6cf]">
            {fr ? prog.stageLabelFr : prog.stageLabel}
          </p>
          <p className="text-[10px] text-white/70">
            {fr ? prog.currentRoleLabelFr : prog.currentRoleLabel}
            {prog.xpToNext != null
              ? ` · ${prog.xpToNext} XP ${fr ? "restant" : "to next role"}`
              : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(fr ? prog.gearFr : prog.gear).map((g) => (
              <span
                key={g}
                className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/80"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-white/10 px-1 py-2">
            <p className="text-base font-bold">{p.mcbBalance.toFixed(1)}</p>
            <p className="text-[9px] opacity-80">McB</p>
          </div>
          <div className="rounded-xl bg-white/10 px-1 py-2">
            <p className="text-base font-bold">{p.bpBalance}</p>
            <p className="text-[9px] opacity-80">BP</p>
          </div>
          <div className="rounded-xl bg-white/10 px-1 py-2">
            <p className="text-base font-bold">
              {p.energy}/{p.energyCap}
            </p>
            <p className="text-[9px] opacity-80">{fr ? "Énergie" : "Energy"}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-1 py-2">
            <p className="text-base font-bold">{p.xp}</p>
            <p className="text-[9px] opacity-80">XP</p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-white/70">
          <span>
            {fr ? "Outil" : "Tool"}: {p.toolDurability}%
          </span>
          <div className="h-1.5 flex-1 mx-2 rounded-full bg-white/20">
            <div
              className={`h-full rounded-full ${
                p.toolDurability < 30
                  ? "bg-[#ef4444]"
                  : p.toolDurability < 60
                    ? "bg-[#f59e0b]"
                    : "bg-[#a8e6cf]"
              }`}
              style={{ width: `${p.toolDurability}%` }}
            />
          </div>
        </div>
      </header>

      {msg ? (
        <p className={`mt-3 rounded-lg px-3 py-2 text-center text-xs font-semibold ${msgClass}`}>
          {msg}
        </p>
      ) : null}

      {promo.nextRole ? (
        <section className="mt-4 rounded-xl border border-[#d6d3d1] bg-[#fafaf9] p-4">
          <h2 className="text-sm font-bold text-[#44403c]">
            {fr ? "Carrière minière" : "Mining career"}
          </h2>
          <p className="mt-1 text-xs text-[#78716c]">
            {fr ? "Prochain rôle :" : "Next role:"}{" "}
            <span className="font-semibold text-[#1c1917]">
              {fr ? promo.nextRoleLabelFr : promo.nextRoleLabel}
            </span>
            {" · "}
            {promo.minXp} XP · {promo.entryFeeMcb} McB
          </p>
          {!promo.canPromote && promo.blockReason ? (
            <p className="mt-1 text-[10px] text-[#b45309]">
              {fr ? promo.blockReasonFr : promo.blockReason}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!!busy || !promo.canPromote}
            onClick={() =>
              void act(
                "promote",
                () => fetch("/api/game/role/promote", { method: "POST" }),
                (body) =>
                  fr
                    ? `Promu : ${String(body.roleLabelFr ?? promo.nextRoleLabelFr)}`
                    : `Promoted to ${String(body.roleLabel ?? promo.nextRoleLabel)}`,
              )
            }
            className="mt-3 w-full rounded-lg bg-[#305f33] py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy === "promote"
              ? "…"
              : fr
                ? "Promouvoir (licence McB)"
                : "Promote (McB license fee)"}
          </button>
        </section>
      ) : null}

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-bold text-[#44403c]">
          {fr ? "Boutique McB" : "McB shop"}
        </h2>
        <p className="mb-2 text-[10px] text-[#78716c]">
          {fr
            ? "Outils, licences et upgrades — payés en McB uniquement."
            : "Tools, licenses & upgrades — McB only."}
        </p>
        <div className="mb-2 flex flex-wrap gap-1">
          {(["tool", "upgrade", "consumable", "license"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setShopCategory(cat);
                setShopExpanded(false);
              }}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
                shopCategory === cat
                  ? "bg-[#305f33] text-white"
                  : "bg-[#f5f5f4] text-[#78716c]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {shopVisible.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl border border-[#f0f4f2] bg-white px-3 py-2.5"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-bold text-[#1c1917]">
                  {fr ? item.labelFr : item.label}
                  {item.owned ? (
                    <span className="ml-1 text-[10px] text-[#305f33]">✓</span>
                  ) : null}
                </p>
                <p className="text-[10px] text-[#78716c]">
                  {item.costMcb} McB
                  {!item.canBuy && (item.lockReasonFr || item.lockReason) ? (
                    <span className="text-[#b45309]">
                      {" "}
                      · {fr ? item.lockReasonFr : item.lockReason}
                    </span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                disabled={!!busy || !item.canBuy}
                onClick={() =>
                  void act(
                    `buy-${item.key}`,
                    () =>
                      fetch("/api/game/upgrades", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ itemKey: item.key }),
                      }),
                    (body) => {
                      const label = fr ? item.labelFr : item.label;
                      const applied = Array.isArray(body.applied)
                        ? (body.applied as string[]).join(", ")
                        : "";
                      return applied ? `${label} — ${applied}` : label;
                    },
                  )
                }
                className="shrink-0 rounded-lg border border-[#305f33] px-2.5 py-1.5 text-[10px] font-bold text-[#305f33] disabled:opacity-40"
              >
                {fr ? "Acheter" : "Buy"}
              </button>
            </div>
          ))}
        </div>
        {shopFiltered.length > 5 ? (
          <button
            type="button"
            onClick={() => setShopExpanded((v) => !v)}
            className="mt-2 w-full text-center text-[10px] font-semibold text-[#305f33]"
          >
            {shopExpanded
              ? fr
                ? "Voir moins"
                : "Show less"
              : fr
                ? `Voir tout (${shopFiltered.length})`
                : `Show all (${shopFiltered.length})`}
          </button>
        ) : null}
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-bold text-[#44403c]">
          {fr ? "Sites miniers" : "Mining sites"}
        </h2>
        <div className="space-y-2">
          {data.sites.map((site) => (
            <div
              key={site.id}
              className="flex items-center justify-between rounded-xl border border-[#f0f4f2] bg-white px-4 py-3 shadow-sm"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm font-bold text-[#1c1917]">{site.name}</p>
                <p className="text-xs text-[#78716c]">
                  {site.mineralKey} · {fr ? "richesse" : "richness"}{" "}
                  {(site.richness * 100).toFixed(0)}%
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${riskBadgeClass(site.riskLevel)}`}
                >
                  {fr ? site.riskLabelFr : site.riskLabel}
                </span>
              </div>
              <button
                type="button"
                disabled={!!busy || p.energy < 8}
                onClick={() =>
                  void act(
                    "mine",
                    () =>
                      fetch("/api/game/mining", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ siteId: site.id }),
                      }),
                    (body) =>
                      fr
                        ? String(body.messageFr ?? body.message ?? "")
                        : String(body.message ?? ""),
                  )
                }
                className="shrink-0 rounded-lg bg-[#305f33] px-3 py-2 text-xs font-bold text-white active:scale-95 disabled:opacity-50"
              >
                {busy === "mine" ? "…" : fr ? "Extraire" : "Mine"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {data.activeTransports.length > 0 ? (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-bold text-[#44403c]">
            {fr ? "Transports en cours" : "Active transports"}
          </h2>
          <div className="space-y-2">
            {data.activeTransports.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-[#f0f4f2] bg-[#fafaf9] px-4 py-3"
              >
                <p className="text-sm font-bold capitalize">
                  {t.quantityKg}kg {t.mineralKey}
                </p>
                <p className="text-xs text-[#78716c]">
                  {t.vehicleKey} → ~{t.rewardMcb.toFixed(1)} McB
                  {t.completesAt
                    ? ` · ${new Date(t.completesAt).toLocaleTimeString()}`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-bold text-[#44403c]">
          {fr ? "Stock minerais" : "Mineral stock"}
        </h2>
        {data.stocks.length === 0 ? (
          <p className="text-xs text-[#78716c]">{fr ? "Aucun stock." : "No stock yet."}</p>
        ) : (
          <div className="space-y-2">
            {data.stocks.map((s) => (
              <div
                key={s.mineralKey}
                className="flex items-center justify-between rounded-xl border border-[#f0f4f2] bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold capitalize">{s.mineralKey}</p>
                  <p className="text-xs text-[#78716c]">
                    {s.quantityKg.toFixed(2)} kg ·{" "}
                    <span className={`font-semibold ${purityColor(s.purityPct)}`}>
                      {s.purityPct.toFixed(0)}% {purityGrade(s.purityPct, fr)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {refinery.available && s.purityPct < 95 && s.quantityKg >= 2 ? (
                    <button
                      type="button"
                      disabled={!!busy || p.energy < refinery.energyCost}
                      onClick={() =>
                        void act(
                          "refine",
                          () =>
                            fetch("/api/game/refinery", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                mineralKey: s.mineralKey,
                                quantityKg: Math.min(s.quantityKg, 5),
                              }),
                            }),
                          (body) =>
                            fr
                              ? String(body.messageFr ?? body.message ?? "")
                              : String(body.message ?? ""),
                        )
                      }
                      className="rounded-lg border border-[#b45309] px-2 py-2 text-[10px] font-bold text-[#b45309] disabled:opacity-50"
                    >
                      {fr ? "Raffiner" : "Refine"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={!!busy || s.quantityKg < 1}
                    onClick={() =>
                      void act("sell", () =>
                        fetch("/api/game/trade", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            mineralKey: s.mineralKey,
                            quantityKg: Math.min(s.quantityKg, 5),
                          }),
                        }),
                      )
                    }
                    className="rounded-lg border border-[#305f33] px-2 py-2 text-[10px] font-bold text-[#305f33] disabled:opacity-50"
                  >
                    {fr ? "Vendre" : "Sell"}
                  </button>
                  <button
                    type="button"
                    disabled={!!busy || s.quantityKg < 1}
                    onClick={() => openTransport(s)}
                    className="rounded-lg bg-[#1c1917] px-2 py-2 text-[10px] font-bold text-white disabled:opacity-50"
                  >
                    {fr ? "Transport" : "Ship"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-bold text-[#44403c]">
          {fr ? "Boosts BP" : "BP boosts"}
        </h2>
        <p className="mb-2 text-[10px] text-[#78716c]">
          {fr
            ? "BP = engagement communauté. Petits avantages, pas de remplacement McB."
            : "BP = community engagement. Small boosts, not McB replacement."}
        </p>
        <div className="flex flex-wrap gap-2">
          {data.bpBoosts.map((b) => (
            <button
              key={b.id}
              type="button"
              disabled={!!busy || p.bpBalance < b.costBp}
              onClick={() =>
                void act(`boost-${b.id}`, () =>
                  fetch("/api/game/boost", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ boostId: b.id }),
                  }),
                )
              }
              className="rounded-lg border border-[#d6d3d1] bg-white px-3 py-2 text-xs font-semibold text-[#44403c] disabled:opacity-50"
            >
              {fr ? b.labelFr : b.label} ({b.costBp} BP)
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-bold text-[#44403c]">
          {fr ? "Marché mondial" : "Global market"}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {prices.map((pr) => (
            <div
              key={pr.mineralKey}
              className="rounded-xl border border-[#f0f4f2] bg-[#fafaf9] px-3 py-2 text-center"
            >
              <p className="text-xs font-bold text-[#44403c]">{pr.label}</p>
              <p className="text-sm font-bold text-[#305f33]">
                {pr.currentPriceMcb.toFixed(2)} McB
              </p>
              <p className="text-[10px] text-[#78716c]">
                {fr ? "Demande" : "Demand"} {(pr.demandIndex * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>
      </section>

      {prog.unlocks.length > 0 ? (
        <section className="mt-5 rounded-xl border border-[#f0f4f2] bg-[#fafaf9] p-4">
          <h2 className="text-sm font-bold text-[#44403c]">
            {fr ? "Débloqué (XP)" : "Unlocked (XP)"}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1">
            {(fr ? prog.unlocksFr : prog.unlocks).map((u) => (
              <span
                key={u}
                className="rounded-full bg-[#e8f3ee] px-2 py-0.5 text-[10px] font-semibold text-[#305f33]"
              >
                ✓ {u}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5 rounded-xl border border-[#f0f4f2] bg-white p-4">
        <h2 className="text-sm font-bold text-[#44403c]">BULELI AI</h2>
        <p className="mt-1 text-xs text-[#78716c]">
          {fr ? "Conseiller économique minière" : "Mining economic advisor"}
        </p>
        <input
          value={advisorQ}
          onChange={(e) => setAdvisorQ(e.target.value)}
          placeholder={fr ? "Que faire avec mon cobalt ?" : "What should I do with cobalt?"}
          className="mt-3 w-full rounded-lg border border-[#e7e5e4] px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={!!busy || advisorQ.length < 3}
          onClick={async () => {
            const res = await act("advisor", () =>
              fetch("/api/game/advisor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: advisorQ }),
              }),
            );
            if (res && typeof res.answer === "string") setAdvisorA(res.answer);
          }}
          className="mt-2 w-full rounded-lg bg-[#305f33] py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {fr ? "Demander" : "Ask"}
        </button>
        {advisorA ? (
          <p className="mt-3 rounded-lg bg-[#f5f5f4] p-3 text-xs leading-relaxed text-[#44403c]">
            {advisorA}
          </p>
        ) : null}
      </section>

      {transportOpen && transportStock ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1c1917]">
                {fr ? "Planifier transport" : "Plan transport"} — {transportStock.mineralKey}
              </h3>
              <button
                type="button"
                onClick={() => setTransportOpen(false)}
                className="text-sm text-[#78716c]"
              >
                ✕
              </button>
            </div>

            <label className="text-xs font-semibold text-[#44403c]">
              {fr ? "Quantité (kg)" : "Quantity (kg)"}
            </label>
            <input
              type="number"
              min={1}
              max={transportStock.quantityKg}
              value={transportQty}
              onChange={(e) => setTransportQty(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[#e7e5e4] px-3 py-2 text-sm"
            />

            <label className="mt-3 block text-xs font-semibold text-[#44403c]">
              {fr ? "Véhicule" : "Vehicle"}
            </label>
            <div className="mt-1 space-y-1">
              {data.transportOptions.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVehicleKey(v.key)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                    vehicleKey === v.key
                      ? "border-[#305f33] bg-[#e8f3ee]"
                      : "border-[#e7e5e4]"
                  }`}
                >
                  <span className="font-bold">{fr ? v.labelFr : v.label}</span>
                  <span className="text-[#78716c]">
                    {" "}
                    · {v.capacityKg}kg · {v.maintenanceMcb} McB {fr ? "entretien" : "maint."}
                  </span>
                </button>
              ))}
            </div>

            <label className="mt-3 block text-xs font-semibold text-[#44403c]">
              {fr ? "Route" : "Route"}
            </label>
            <div className="mt-1 space-y-1">
              {data.transportRoutes.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRouteKey(r.key)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                    routeKey === r.key
                      ? "border-[#305f33] bg-[#e8f3ee]"
                      : "border-[#e7e5e4]"
                  }`}
                >
                  <span className="font-bold">{fr ? r.labelFr : r.label}</span>
                  <span className="text-[#78716c]"> · {r.distanceKm} km</span>
                </button>
              ))}
            </div>

            {quote ? (
              <div className="mt-4 rounded-xl bg-[#fafaf9] p-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[#78716c]">{fr ? "Carburant" : "Fuel"}</p>
                    <p className="font-bold">{quote.fuelCostMcb} McB</p>
                  </div>
                  <div>
                    <p className="text-[#78716c]">{fr ? "Entretien" : "Maintenance"}</p>
                    <p className="font-bold">{quote.maintenanceMcb} McB</p>
                  </div>
                  <div>
                    <p className="text-[#78716c]">{fr ? "Coût total" : "Total cost"}</p>
                    <p className="font-bold text-[#b45309]">{quote.totalCostMcb} McB</p>
                  </div>
                  <div>
                    <p className="text-[#78716c]">{fr ? "Risque" : "Risk"}</p>
                    <p className="font-bold text-[#b91c1c]">{quote.riskPct}%</p>
                  </div>
                  <div>
                    <p className="text-[#78716c]">{fr ? "Durée" : "Duration"}</p>
                    <p className="font-bold">{quote.durationMin} min</p>
                  </div>
                  <div>
                    <p className="text-[#78716c]">{fr ? "Gain estimé" : "Est. reward"}</p>
                    <p className="font-bold text-[#305f33]">{quote.estimatedRewardMcb} McB</p>
                  </div>
                </div>
                {quote.weatherDelay ? (
                  <p className="mt-2 text-[#b45309]">
                    ⚠ {fr ? "Retard météo — routes boueuses" : "Weather delay — muddy roads"}
                  </p>
                ) : null}
                {quote.purityBonus ? (
                  <p className="mt-1 text-[#305f33]">
                    ✓ {fr ? "Bonus pureté premium" : "Premium purity bonus"}
                  </p>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              disabled={!!busy || !quote}
              onClick={async () => {
                const res = await act("transport", () =>
                  fetch("/api/game/transport", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      mineralKey: transportStock.mineralKey,
                      quantityKg: transportQty,
                      vehicleKey,
                      routeKey,
                    }),
                  }),
                );
                if (res) setTransportOpen(false);
              }}
              className="mt-4 w-full rounded-lg bg-[#1c1917] py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy === "transport"
                ? "…"
                : fr
                  ? "Lancer le transport"
                  : "Start transport"}
            </button>
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-center text-[10px] text-[#a8a29e]">
        {fr
          ? "Client Godot 4 bientôt — API prête pour le jeu 3D"
          : "Godot 4 client coming — API ready for 3D game"}
      </p>
    </div>
  );
}
