import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isWalletCryptoAsset } from "@/lib/wallet-crypto-assets";
import {
  fetchOpenDepositForAsset,
  fetchWalletActivitiesForAsset,
} from "@/lib/wallet-activity-feed";
import { getWalletUserState } from "@/lib/wallet-user-state";
import { formatWalletAssetBalance } from "@/lib/wallet-balance-format";
import { getLocale } from "@/lib/get-locale";

const PAGE_SIZES = [10, 20, 30] as const;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ asset: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { asset: assetParam } = await ctx.params;
  if (!isWalletCryptoAsset(assetParam)) {
    return NextResponse.json({ error: "Unknown asset" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const rawSize = Number(searchParams.get("pageSize") ?? "10") || 10;
  const pageSize = (PAGE_SIZES as readonly number[]).includes(rawSize)
    ? rawSize
    : 10;

  const locale = await getLocale();
  const state = await getWalletUserState(userId, locale);
  const line = state?.lines.find((l) => l.asset === assetParam);

  const [feed, openDeposit] = await Promise.all([
    fetchWalletActivitiesForAsset({
      userId,
      asset: assetParam,
      sort,
      page,
      pageSize,
    }),
    fetchOpenDepositForAsset(userId, assetParam),
  ]);

  return NextResponse.json({
    asset: assetParam,
    balance: line
      ? {
          amount: line.balance,
          display: formatWalletAssetBalance(line.balanceNum, line.asset, locale),
          valueUsd: line.valueUsdDisplay,
        }
      : null,
    openDeposit,
    ...feed,
  });
}
