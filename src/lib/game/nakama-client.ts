/**
 * Nakama integration stub — Godot 4 client connects directly in production.
 * Backend uses this for session validation and match metadata.
 */

export type NakamaConfig = {
  host: string;
  port: number;
  serverKey: string;
  useSsl: boolean;
};

export function getNakamaConfig(): NakamaConfig | null {
  const host = process.env.NAKAMA_HOST?.trim();
  const serverKey = process.env.NAKAMA_SERVER_KEY?.trim();
  if (!host || !serverKey) return null;

  return {
    host,
    port: Number(process.env.NAKAMA_PORT ?? 7350),
    serverKey,
    useSsl: process.env.NAKAMA_USE_SSL !== "0",
  };
}

export function nakamaEnabled(): boolean {
  return getNakamaConfig() !== null;
}

export function nakamaConnectionInfo(): {
  enabled: boolean;
  host: string | null;
  port: number | null;
  useSsl: boolean;
} {
  const cfg = getNakamaConfig();
  if (!cfg) {
    return { enabled: false, host: null, port: null, useSsl: true };
  }
  return {
    enabled: true,
    host: cfg.host,
    port: cfg.port,
    useSsl: cfg.useSsl,
  };
}

/** Manifest for Godot 4 / external game clients using the same REST API. */
export function godotClientManifest() {
  return {
    version: "0.3.0",
    game: "mcbuleli_congo_mining",
    api: {
      basePath: "/api/game",
      endpoints: {
        player: { method: "GET", path: "/api/game/player" },
        market: { method: "GET", path: "/api/game/market" },
        mining: { method: "POST", path: "/api/game/mining" },
        transportQuote: { method: "GET", path: "/api/game/transport/quote" },
        transport: { method: "POST", path: "/api/game/transport" },
        trade: { method: "POST", path: "/api/game/trade" },
        upgrades: { method: "GET", path: "/api/game/upgrades" },
        worldTravel: { method: "POST", path: "/api/game/world/travel" },
        vehiclesRepair: { method: "POST", path: "/api/game/vehicles/repair" },
        advisor: { method: "POST", path: "/api/game/advisor" },
        client: { method: "GET", path: "/api/game/client" },
      },
    },
    nakama: nakamaConnectionInfo(),
    notes:
      "Authenticate with the same session cookie as the web app. Nakama is optional for Phase 4 multiplayer.",
  };
}
