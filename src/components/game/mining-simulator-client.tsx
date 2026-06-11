"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

type Site = {
  id: string;
  name: string;
  mineralKey: string;
  richness: string;
  status: string;
};

type Stock = { mineralKey: string; quantityKg: number; purityPct: number };

type Dashboard = {
  player: {
    role: string;
    mcbBalance: number;
    energy: number;
    energyCap: number;
    xp: number;
    reputation: number;
    lifestyleTier: number;
    community: { handle: string; displayName: string; avatarUrl: string | null };
  };
  sites: Site[];
  stocks: Stock[];
};

type MarketPrice = {
  mineralKey: string;
  label: string;
  currentPriceMcb: number;
};

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

  const act = async (
    label: string,
    fn: () => Promise<Response>,
  ): Promise<Record<string, unknown> | null> => {
    setBusy(label);
    setMsg(null);
    try {
      const res = await fn();
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setMsg(String(body.message ?? "Error"));
        return null;
      }
      setMsg(fr ? "Action réussie" : "Success");
      await load();
      return body;
    } finally {
      setBusy(null);
    }
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

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/app/community" className="text-sm font-semibold text-[#305f33]">
          ← Community
        </Link>
      </div>

      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#305f33] p-5 text-white shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8e6cf]">
          McBuleli Congo Mining
        </p>
        <h1 className="mt-1 text-xl font-bold">{p.community.displayName}</h1>
        <p className="text-xs text-white/70">@{p.community.handle}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/10 px-2 py-2">
            <p className="text-lg font-bold">{p.mcbBalance.toFixed(1)}</p>
            <p className="text-[10px] opacity-80">McB</p>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2">
            <p className="text-lg font-bold">
              {p.energy}/{p.energyCap}
            </p>
            <p className="text-[10px] opacity-80">{fr ? "Énergie" : "Energy"}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2">
            <p className="text-lg font-bold">{p.xp}</p>
            <p className="text-[10px] opacity-80">XP</p>
          </div>
        </div>
      </header>

      {msg ? (
        <p className="mt-3 rounded-lg bg-[#e8f3ee] px-3 py-2 text-center text-xs font-semibold text-[#305f33]">
          {msg}
        </p>
      ) : null}

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
              <div>
                <p className="text-sm font-bold text-[#1c1917]">{site.name}</p>
                <p className="text-xs text-[#78716c]">
                  {site.mineralKey} · {fr ? "richesse" : "richness"}{" "}
                  {(Number(site.richness) * 100).toFixed(0)}%
                </p>
              </div>
              <button
                type="button"
                disabled={!!busy}
                onClick={() =>
                  void act("mine", () =>
                    fetch("/api/game/mining", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ siteId: site.id }),
                    }),
                  )
                }
                className="rounded-lg bg-[#305f33] px-3 py-2 text-xs font-bold text-white active:scale-95 disabled:opacity-50"
              >
                {busy === "mine" ? "…" : fr ? "Extraire" : "Mine"}
              </button>
            </div>
          ))}
        </div>
      </section>

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
                    {s.quantityKg.toFixed(2)} kg · {s.purityPct.toFixed(0)}%
                  </p>
                </div>
                <div className="flex gap-2">
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
                    className="rounded-lg border border-[#305f33] px-3 py-2 text-xs font-bold text-[#305f33] disabled:opacity-50"
                  >
                    {fr ? "Vendre" : "Sell"}
                  </button>
                  <button
                    type="button"
                    disabled={!!busy || s.quantityKg < 1}
                    onClick={() =>
                      void act("transport", () =>
                        fetch("/api/game/transport", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            mineralKey: s.mineralKey,
                            quantityKg: Math.min(s.quantityKg, 10),
                            vehicleKey: "motorcycle",
                          }),
                        }),
                      )
                    }
                    className="rounded-lg bg-[#1c1917] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
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
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-[#f0f4f2] bg-white p-4">
        <h2 className="text-sm font-bold text-[#44403c]">BULEZI AI</h2>
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

      <p className="mt-6 text-center text-[10px] text-[#a8a29e]">
        {fr
          ? "Client Godot 4 bientôt — API prête pour le jeu 3D"
          : "Godot 4 client coming — API ready for 3D game"}
      </p>
    </div>
  );
}
