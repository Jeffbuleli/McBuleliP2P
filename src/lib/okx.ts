import crypto from "node:crypto";

const DEFAULT_BASE = "https://www.okx.com";

function baseUrl() {
  return (process.env.OKX_API_BASE ?? DEFAULT_BASE).replace(/\/$/, "");
}

function credentials() {
  const key = process.env.OKX_API_KEY?.trim();
  const secret = process.env.OKX_API_SECRET?.trim();
  const passphrase = process.env.OKX_API_PASSPHRASE?.trim();
  if (!key || !secret || !passphrase) {
    throw new Error("OKX API credentials are not configured");
  }
  return { key, secret, passphrase };
}

function sign(secret: string, ts: string, method: string, path: string, body: string) {
  const prehash = ts + method.toUpperCase() + path + body;
  return crypto.createHmac("sha256", secret).update(prehash).digest("base64");
}

type OkxEnvelope<T> = {
  code: string;
  msg: string;
  data: T;
};

async function okxPrivateJson<T>(method: "GET" | "POST", pathWithQuery: string, body = ""): Promise<T> {
  const { key, secret, passphrase } = credentials();
  const ts = new Date().toISOString();
  const sig = sign(secret, ts, method, pathWithQuery, body);
  const url = `${baseUrl()}${pathWithQuery}`;
  const res = await fetch(url, {
    method,
    headers: {
      "OK-ACCESS-KEY": key,
      "OK-ACCESS-SIGN": sig,
      "OK-ACCESS-TIMESTAMP": ts,
      "OK-ACCESS-PASSPHRASE": passphrase,
      "Content-Type": "application/json",
    },
    body: method === "POST" ? body : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as OkxEnvelope<T>;
  if (!res.ok || json.code !== "0") {
    throw new Error(
      `OKX ${pathWithQuery}: ${json.msg ?? res.statusText} (code ${json.code})`,
    );
  }
  return json.data;
}

export async function okxDepositAddress(args: { ccy: string; chain: string }) {
  const q = new URLSearchParams({
    ccy: args.ccy,
    chain: args.chain,
  });
  const path = `/api/v5/asset/deposit-address?${q}`;
  const rows = await okxPrivateJson<
    { addr: string; tag?: string; selected?: string }[]
  >("GET", path);
  const row = rows[0];
  if (!row?.addr) {
    throw new Error("OKX returned no deposit address");
  }
  return {
    address: row.addr.trim(),
    tag: row.tag?.trim() ? row.tag.trim() : null,
  };
}

export type OkxDepositHistoryRow = {
  txId?: string;
  to?: string;
  ccy?: string;
  chain?: string;
  /** 0 pending, 1 credited, 2 success (varies by OKX docs) */
  state?: string;
  actualDepAmt?: string;
  amt?: string;
};

export async function okxDepositHistoryByTxid(args: { ccy: string; txId: string }) {
  const q = new URLSearchParams({
    ccy: args.ccy,
    txId: args.txId,
  });
  const path = `/api/v5/asset/deposit-history?${q}`;
  const rows = await okxPrivateJson<OkxDepositHistoryRow[]>("GET", path);
  return Array.isArray(rows) ? rows : [];
}

/** Public (unsigned) last trade price, e.g. PI-USDT. */
export async function okxPublicTickerLast(instId: string): Promise<string | null> {
  const q = new URLSearchParams({ instId });
  const url = `${baseUrl()}/api/v5/market/ticker?${q}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as OkxEnvelope<{ last: string }[]>;
  if (!res.ok || json.code !== "0" || !json.data?.[0]) {
    return null;
  }
  return json.data[0].last ?? null;
}

export function okxDepositStateIsFinal(state: string | undefined): boolean {
  const s = (state ?? "").trim();
  return s === "1" || s === "2";
}
