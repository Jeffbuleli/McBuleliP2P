import { NextResponse } from "next/server";
import { fetchWalletGlobalActivities } from "@/lib/wallet-activity-feed";
import { getSessionUserId } from "@/lib/session";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category")?.trim() ?? "";
  const asset = searchParams.get("asset")?.trim() ?? "";
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") ?? "10") || 10, 1),
    30,
  );

  const result = await fetchWalletGlobalActivities({
    userId,
    category: category || undefined,
    asset: asset || undefined,
    sort,
    page,
    pageSize,
  });

  return NextResponse.json(result);
}
