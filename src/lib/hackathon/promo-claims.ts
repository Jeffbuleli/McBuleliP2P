import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  hackathonPromoCashbackClaims,
  hackathonPromoCodes,
  hackathonRegistrations,
} from "@/db";

async function getPromoByToken(token: string) {
  const normalized = token.trim();
  if (!normalized) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(hackathonPromoCodes)
    .where(eq(hackathonPromoCodes.dashboardToken, normalized))
    .limit(1);
  return row ?? null;
}

export async function claimableCashbackUsd(promoId: string): Promise<number> {
  const db = getDb();
  const [earned] = await db
    .select({
      total: sql<string>`coalesce(sum(${hackathonRegistrations.cashbackUsd}), 0)`,
    })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.promoCodeId, promoId),
        eq(hackathonRegistrations.paymentStatus, "paid"),
      ),
    );

  const [claimed] = await db
    .select({
      total: sql<string>`coalesce(sum(${hackathonPromoCashbackClaims.amountUsd}), 0)`,
    })
    .from(hackathonPromoCashbackClaims)
    .where(
      and(
        eq(hackathonPromoCashbackClaims.promoCodeId, promoId),
        inArray(hackathonPromoCashbackClaims.status, [
          "requested",
          "approved",
          "paid",
        ]),
      ),
    );

  const earnedN = Number(earned?.total ?? 0);
  const claimedN = Number(claimed?.total ?? 0);
  return Math.max(0, Math.round((earnedN - claimedN) * 100) / 100);
}

export async function listClaimsForPromo(promoId: string) {
  const db = getDb();
  return db
    .select()
    .from(hackathonPromoCashbackClaims)
    .where(eq(hackathonPromoCashbackClaims.promoCodeId, promoId))
    .orderBy(desc(hackathonPromoCashbackClaims.createdAt));
}

export async function requestCashbackClaim(args: {
  dashboardToken: string;
  partnerEmail: string;
}): Promise<
  | { ok: true; claimId: string; amountUsd: number }
  | { ok: false; error: string; status: number }
> {
  const promo = await getPromoByToken(args.dashboardToken);
  if (!promo || !promo.active) {
    return { ok: false, error: "not_found", status: 404 };
  }
  if (promo.partnerEmail.toLowerCase() !== args.partnerEmail.toLowerCase()) {
    return { ok: false, error: "email_mismatch", status: 403 };
  }

  const amount = await claimableCashbackUsd(promo.id);
  if (amount <= 0) {
    return { ok: false, error: "nothing_to_claim", status: 409 };
  }

  const db = getDb();
  const open = await db
    .select({ id: hackathonPromoCashbackClaims.id })
    .from(hackathonPromoCashbackClaims)
    .where(
      and(
        eq(hackathonPromoCashbackClaims.promoCodeId, promo.id),
        eq(hackathonPromoCashbackClaims.status, "requested"),
      ),
    )
    .limit(1);
  if (open[0]) {
    return { ok: false, error: "claim_pending", status: 409 };
  }

  const [row] = await db
    .insert(hackathonPromoCashbackClaims)
    .values({
      promoCodeId: promo.id,
      amountUsd: String(amount),
      status: "requested",
    })
    .returning();

  return { ok: true, claimId: row.id, amountUsd: amount };
}

export async function resolveCashbackClaim(args: {
  claimId: string;
  status: "approved" | "paid" | "rejected";
  adminUserId: string;
  note?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const db = getDb();
  const [claim] = await db
    .select()
    .from(hackathonPromoCashbackClaims)
    .where(eq(hackathonPromoCashbackClaims.id, args.claimId))
    .limit(1);
  if (!claim) return { ok: false, error: "not_found", status: 404 };

  await db
    .update(hackathonPromoCashbackClaims)
    .set({
      status: args.status,
      resolvedAt: new Date(),
      resolvedBy: args.adminUserId,
      note: args.note?.trim() || claim.note,
      updatedAt: new Date(),
    })
    .where(eq(hackathonPromoCashbackClaims.id, claim.id));

  return { ok: true };
}

export async function listAdminPromoOverview(editionId?: string | null) {
  const db = getDb();
  const promos = editionId
    ? await db
        .select()
        .from(hackathonPromoCodes)
        .where(eq(hackathonPromoCodes.editionId, editionId))
        .orderBy(desc(hackathonPromoCodes.createdAt))
    : await db
        .select()
        .from(hackathonPromoCodes)
        .orderBy(desc(hackathonPromoCodes.createdAt));

  const out = [];
  for (const p of promos) {
    const regs = await db
      .select({
        paymentStatus: hackathonRegistrations.paymentStatus,
        cashbackUsd: hackathonRegistrations.cashbackUsd,
      })
      .from(hackathonRegistrations)
      .where(eq(hackathonRegistrations.promoCodeId, p.id));
    const confirmed = regs.filter((r) => r.paymentStatus === "paid").length;
    const cashbackUsd = regs.reduce((sum, r) => {
      if (r.paymentStatus !== "paid") return sum;
      return (
        sum +
        (r.cashbackUsd != null ? Number(r.cashbackUsd) : Number(p.cashbackUsd))
      );
    }, 0);
    const claimable = await claimableCashbackUsd(p.id);
    const claims = await listClaimsForPromo(p.id);
    out.push({
      id: p.id,
      editionId: p.editionId,
      code: p.code,
      orgName: p.orgName,
      partnerEmail: p.partnerEmail,
      partnerName: p.partnerName,
      discountPercent: Number(p.discountPercent),
      cashbackUsd: Number(p.cashbackUsd),
      active: p.active,
      dashboardToken: p.dashboardToken,
      totals: {
        signups: regs.length,
        confirmed,
        pending: regs.length - confirmed,
        cashbackUsd,
      },
      claimableUsd: claimable,
      claims: claims.map((c) => ({
        id: c.id,
        amountUsd: Number(c.amountUsd),
        status: c.status,
        requestedAt: c.requestedAt.toISOString(),
        resolvedAt: c.resolvedAt?.toISOString() ?? null,
        note: c.note,
      })),
    });
  }
  return out;
}
