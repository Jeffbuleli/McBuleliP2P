import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { checkKycGate } from "@/lib/kyc-guard";
import { EAVEC_MARKET_CATEGORIES, EAVEC_MARKET_DESCRIPTION_MAX } from "@/lib/eavec-market/categories";
import {
  createEavecMarketListing,
  listEavecMarketListings,
} from "@/lib/eavec-market/service";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";

const createZ = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(EAVEC_MARKET_DESCRIPTION_MAX).optional().nullable(),
  category: z.enum(EAVEC_MARKET_CATEGORIES),
  currency: z.enum(["CDF"]).default("CDF"),
  price: z.string().min(1).max(32),
  quantity: z.number().int().min(1).max(9999).optional(),
  locationLabel: z.string().max(128).optional().nullable(),
  countryCode: z.string().max(8).optional().nullable(),
  imageUrl: z.string().max(550_000).min(32),
  kind: z.enum(["product", "service"]).optional(),
  groupId: z.string().uuid().optional().nullable(),
});

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? "24");
  const offset = Number(url.searchParams.get("offset") ?? "0");

  const result = await listEavecMarketListings({
    q,
    category: category || undefined,
    limit: Number.isFinite(limit) ? limit : 24,
    offset: Number.isFinite(offset) ? offset : 0,
  });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = enforceApiRateLimit("eavec_market_create", userId, req);
  if (limited) return limited;
  const kyc = await checkKycGate(userId, "groups");
  if (!kyc.ok) {
    return NextResponse.json({ error: kyc.error }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "eavec_market_invalid" }, { status: 400 });
  }
  const d = parsed.data;
  const r = await createEavecMarketListing({
    sellerUserId: userId,
    title: d.title,
    description: d.description,
    category: d.category,
    currency: d.currency,
    price: d.price,
    quantity: d.quantity,
    locationLabel: d.locationLabel,
    countryCode: d.countryCode ?? kyc.countryCode,
    imageUrl: d.imageUrl,
    kind: d.kind,
    groupId: d.groupId,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: r.id });
}
