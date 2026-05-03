import crypto from "node:crypto";
import type { NetworkId } from "./networks";
import { USDT_NETWORKS } from "./networks";

const BASE = process.env.OKX_API_BASE ?? "https://www.okx.com";

function okxSign(
  timestamp: string,
  method: string,
  pathWithQuery: string,
  body: string,
  secret: string,
) {
  const prehash = timestamp + method + pathWithQuery + body;
  return crypto.createHmac("sha256", secret).update(prehash).digest("base64");
}

async function okxFetch<T>(
  method: "GET" | "POST",
  path: string,
  opts: { query?: string; jsonBody?: Record<string, unknown> },
) {
  const key = process.env.OKX_API_KEY;
  const secret = process.env.OKX_API_SECRET;
  const passphrase = process.env.OKX_PASSPHRASE;
  if (!key || !secret || !passphrase) {
    throw new Error("OKX API credentials are not configured");
  }
  const timestamp = new Date().toISOString();
  const query = opts.query ?? "";
  const pathWithQuery = query ? `${path}?${query}` : path;
  const bodyStr =
    method === "POST" && opts.jsonBody
      ? JSON.stringify(opts.jsonBody)
      : "";
  const sign = okxSign(timestamp, method, pathWithQuery, bodyStr, secret);
  const url = query ? `${BASE}${pathWithQuery}` : `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "OK-ACCESS-KEY": key,
      "OK-ACCESS-SIGN": sign,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": passphrase,
      "Content-Type": "application/json",
    },
    body: method === "POST" && opts.jsonBody ? bodyStr : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as {
    code: string;
    msg: string;
    data?: T;
  };
  if (json.code !== "0") {
    throw new Error(`OKX error ${json.code}: ${json.msg}`);
  }
  return json.data as T;
}

export async function okxDepositAddress(args: { ccy: string; network: NetworkId }) {
  const chain = USDT_NETWORKS[args.network].okxChain;
  const query = new URLSearchParams({ ccy: args.ccy, chain }).toString();
  const list = await okxFetch<{ addr: string; tag?: string; chain: string }[]>(
    "GET",
    "/api/v5/asset/deposit-address",
    { query },
  );
  const first = list?.[0];
  if (!first?.addr) {
    throw new Error("OKX did not return a deposit address");
  }
  return { address: first.addr, tag: first.tag, chain: first.chain };
}

export type OkxDepositRow = {
  amt: string;
  ccy: string;
  chain: string;
  state: string;
  to?: string;
  toAddr?: string;
  depId?: string;
  txId?: string;
  tag?: string;
};

export async function okxDepositHistoryByTxid(args: { ccy: string; txId: string }) {
  const query = new URLSearchParams({
    ccy: args.ccy,
    txId: args.txId,
  }).toString();
  const list = await okxFetch<OkxDepositRow[]>(
    "GET",
    "/api/v5/asset/deposit-history",
    { query },
  );
  return Array.isArray(list) ? list : [];
}

/** OKX deposit state: 2 = success */
export function okxDepositIsSuccessful(row: OkxDepositRow): boolean {
  return row.state === "2";
}

export function okxDepositDestination(row: OkxDepositRow): string {
  return row.to ?? row.toAddr ?? "";
}

export async function okxWithdraw(args: {
  ccy: string;
  amt: string;
  chain: string;
  toAddr: string;
  tag?: string;
}) {
  /** `dest` selects withdrawal rail — OKX uses numeric codes for address withdrawals */
  const body: Record<string, unknown> = {
    ccy: args.ccy,
    amt: args.amt,
    dest: "4",
    toAddr: args.toAddr,
    chain: args.chain,
  };
  if (args.tag) body.tag = args.tag;
  return okxFetch<{ wdId: string }>("POST", "/api/v5/asset/withdrawal", {
    jsonBody: body,
  });
}
