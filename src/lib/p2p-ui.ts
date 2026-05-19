/**
 * P2P UI helpers — copy keys and amounts aligned with OTC/P2P standards:
 * - Fiat quote (USD/CDF/…): payer sends via local methods off-platform; proof + mark paid.
 * - Crypto quote (USDT/PI): payer debits McBuleli wallet; atomic release.
 */

import type { Messages } from "@/i18n/messages";
import {
  isP2pCryptoQuoteCurrency,
  minCryptoForAsset,
  type P2pCryptoAsset,
  type P2pSide,
} from "@/lib/p2p-config";

export function p2pQuoteIsCrypto(quoteCurrency: string): boolean {
  return isP2pCryptoQuoteCurrency(quoteCurrency);
}

/** Taker-facing flow hint on marketplace / trade preview. */
export function p2pTakerFlowHintKey(
  adSide: P2pSide,
  quoteCurrency: string,
): keyof Messages {
  const wallet = p2pQuoteIsCrypto(quoteCurrency);
  if (adSide === "sell") {
    return wallet ? "p2p_flow_taker_buy_wallet" : "p2p_flow_taker_buy_fiat";
  }
  return wallet ? "p2p_flow_taker_sell_wallet" : "p2p_flow_taker_sell_fiat";
}

/** Active order — viewer role + quote type. */
export function p2pOrderFlowHintKey(args: {
  youAreBuyer: boolean;
  quoteCurrency: string;
}): keyof Messages {
  const wallet = p2pQuoteIsCrypto(args.quoteCurrency);
  if (args.youAreBuyer) {
    return wallet ? "p2p_flow_order_buy_wallet" : "p2p_flow_order_buy_fiat";
  }
  return wallet ? "p2p_flow_order_sell_wallet" : "p2p_flow_order_sell_fiat";
}

/** Platform minimum trade size in quote currency (min crypto × price). */
export function minQuoteAmountForAd(asset: P2pCryptoAsset, price: string | number): number {
  const p = Number(price);
  if (!Number.isFinite(p) || p <= 0) return minCryptoForAsset(asset);
  return minCryptoForAsset(asset) * p;
}

export function p2pAdTradeLimits(
  ad: { minFiat: string; maxFiat: string; price: string },
  asset: P2pCryptoAsset,
): {
  minAd: number;
  maxAd: number;
  platformMin: number;
  effectiveMin: number;
  untradeable: boolean;
} {
  const minAd = Number(ad.minFiat);
  const maxAd = Number(ad.maxFiat);
  const platformMin = minQuoteAmountForAd(asset, ad.price);
  const effectiveMin = Math.max(
    Number.isFinite(minAd) && minAd > 0 ? minAd : 0,
    platformMin,
  );
  const untradeable =
    !Number.isFinite(maxAd) || maxAd <= 0 || maxAd < effectiveMin;
  return { minAd, maxAd, platformMin, effectiveMin, untradeable };
}

/** Flow hint with optional `{quote}` interpolation. */
export function p2pFlowHint(
  t: (key: keyof Messages) => string,
  key: keyof Messages,
  quoteCurrency: string,
): string {
  const raw = t(key);
  return raw.includes("{quote}") ? raw.replaceAll("{quote}", quoteCurrency) : raw;
}
