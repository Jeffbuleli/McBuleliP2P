import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, withdrawalAddressWhitelist } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { isValidAddressForNetwork } from "@/lib/address-format";
import type { NetworkId } from "@/lib/networks";

const COOLDOWN_HOURS = 24;

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db
    .select({
      id: withdrawalAddressWhitelist.id,
      asset: withdrawalAddressWhitelist.asset,
      networkCanonical: withdrawalAddressWhitelist.networkCanonical,
      address: withdrawalAddressWhitelist.address,
      memoTo: withdrawalAddressWhitelist.memoTo,
      label: withdrawalAddressWhitelist.label,
      status: withdrawalAddressWhitelist.status,
      cooldownUntil: withdrawalAddressWhitelist.cooldownUntil,
      approvedAt: withdrawalAddressWhitelist.approvedAt,
    })
    .from(withdrawalAddressWhitelist)
    .where(eq(withdrawalAddressWhitelist.userId, userId))
    .orderBy(desc(withdrawalAddressWhitelist.createdAt))
    .limit(50);
  return NextResponse.json({ addresses: rows });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const asset = raw?.asset === "USDT" ? "USDT" : null;
  const network = typeof raw?.network === "string" ? raw.network : null;
  const address = typeof raw?.address === "string" ? raw.address.trim() : "";
  const label = typeof raw?.label === "string" ? raw.label.trim().slice(0, 64) : null;
  const memoTo = typeof raw?.memo === "string" ? raw.memo.trim() : null;

  if (!asset || !network || !address) {
    return NextResponse.json({ message: "withdraw_address_invalid" }, { status: 400 });
  }
  if (!isValidAddressForNetwork(address, network as NetworkId)) {
    return NextResponse.json({ message: "withdraw_address_invalid" }, { status: 400 });
  }

  const db = getDb();
  const cooldownUntil = new Date(Date.now() + COOLDOWN_HOURS * 3600_000);
  const now = new Date();

  const [existing] = await db
    .select({ id: withdrawalAddressWhitelist.id })
    .from(withdrawalAddressWhitelist)
    .where(
      and(
        eq(withdrawalAddressWhitelist.userId, userId),
        eq(withdrawalAddressWhitelist.asset, asset),
        eq(withdrawalAddressWhitelist.networkCanonical, network),
        eq(withdrawalAddressWhitelist.address, address),
      ),
    )
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(withdrawalAddressWhitelist)
      .set({
        label: label || null,
        memoTo: memoTo || null,
        status: "approved",
        approvedAt: now,
        cooldownUntil,
        updatedAt: now,
      })
      .where(eq(withdrawalAddressWhitelist.id, existing.id))
      .returning();
    return NextResponse.json({ address: row });
  }

  const [row] = await db
    .insert(withdrawalAddressWhitelist)
    .values({
      userId,
      asset,
      networkCanonical: network,
      address,
      memoTo: memoTo || null,
      label: label || null,
      status: "approved",
      approvedAt: now,
      cooldownUntil,
    })
    .returning();

  return NextResponse.json({ address: row });
}
