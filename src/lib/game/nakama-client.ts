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
