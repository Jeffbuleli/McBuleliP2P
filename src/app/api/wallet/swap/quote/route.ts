import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { fetchReferenceRates } from "@/lib/reference-rates";
import { assetAmountToUsd, quoteSwap, usdToAssetAmount } from "@/lib/wallet-convert";
import { SWAP_FEE_USD } from "@/lib/wallet-fees";
import { isWalletAsset, type WalletAsset } from "@/lib/wallet-types";

function unitRateLabel(from: WalletAsset, to: WalletAsset, cdfPerUsd: number, piUsd: number): string {
  const rates = { usdtUsd: 1, cdfPerUsd, piUsd };
  const grossTo = usdToAssetAmount(assetAmountToUsd(1, from, rates), to, rates);
  if (!Number.isFinite(grossTo) || grossTo <= 0) return "";
  const fmt = grossTo >= 100 ? Math.round(grossTo).toLocaleString("en-US") : grossTo.toPrecision(6);
  return `1 ${from} ≈ ${fmt} ${to}`;
}

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const amountStr = searchParams.get("amount") ?? "";
  if (!isWalletAsset(from) || !isWalletAsset(to)) {
    return NextResponse.json({ error: "wallet_swap_invalid_asset" }, { status: 400 });
  }
  const fromAmount = Number(amountStr);
  if (!Number.isFinite(fromAmount) || fromAmount <= 0) {
    return NextResponse.json({ error: "wallet_swap_invalid_amount" }, { status: 400 });
  }
  const rates = await fetchReferenceRates();
  const q = quoteSwap({ from, to, fromAmount, rates });
  if (!q.ok) {
    return NextResponse.json({ error: q.message }, { status: 400 });
  }
  const involvesCdf = from === "CDF" || to === "CDF";
  return NextResponse.json({
    fromAmount: q.fromAmount,
    toAmount: q.toAmount,
    feeUsd: q.feeUsd,
    grossUsd: q.grossUsd,
    netUsdAfterFee: q.netUsdAfterFee,
    flatFeeUsd: SWAP_FEE_USD,
    cdfPerUsd: rates.cdfPerUsd,
    piUsd: rates.piUsd,
    involvesCdf,
    rateLabel: unitRateLabel(from, to, rates.cdfPerUsd, rates.piUsd),
    fetchedAt: Date.now(),
    quoteTtlSec: involvesCdf ? 30 : 60,
  });
}
