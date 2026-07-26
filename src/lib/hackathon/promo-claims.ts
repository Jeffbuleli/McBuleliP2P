import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  hackathonPromoCashbackClaims,
  hackathonPromoCodes,
  hackathonRegistrations,
} from "@/db";
import { hasPawapayKeys } from "@/lib/env";
import {
  resolvePawapayProvider,
  toPawapayProviderId,
} from "@/lib/cod-mobile-providers";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";
import {
  buildCashbackFeeNote,
  parseCashbackFeeNote,
  sendHackathonCashbackPayoutEmail,
} from "@/lib/email/messages/hackathon-cashback-payout";
import { PROMO_CASHBACK_CLAIM_MIN_USD } from "@/lib/hackathon/promo-types";
import { pawapayPayOut } from "@/lib/pawapay/provider";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";

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
        sql`${hackathonRegistrations.cashbackAwardedAt} is not null`,
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

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100;
}

export function quoteCashbackPayout(grossUsd: number): {
  grossUsd: number;
  feeUsd: number;
  netUsd: number;
  feeRate: number;
} {
  const gross = roundUsd(grossUsd);
  const feeUsd = roundUsd(gross * FIAT_FEE_RATE);
  const netUsd = roundUsd(gross - feeUsd);
  return { grossUsd: gross, feeUsd, netUsd, feeRate: FIAT_FEE_RATE };
}

async function notifyCashbackPayout(args: {
  promo: typeof hackathonPromoCodes.$inferSelect;
  claim: typeof hackathonPromoCashbackClaims.$inferSelect;
  outcome: "processing" | "completed" | "failed";
  failureMessage?: string | null;
}) {
  const fees = parseCashbackFeeNote(args.claim.note);
  const gross = Number(args.claim.amountUsd);
  const feeUsd =
    fees.feeUsd != null && Number.isFinite(fees.feeUsd)
      ? fees.feeUsd
      : roundUsd(gross * FIAT_FEE_RATE);
  const netUsd =
    fees.netUsd != null && Number.isFinite(fees.netUsd)
      ? fees.netUsd
      : roundUsd(gross - feeUsd);

  await sendHackathonCashbackPayoutEmail({
    to: args.promo.partnerEmail,
    partnerName: args.promo.partnerName ?? args.promo.orgName,
    orgName: args.promo.orgName,
    promoCode: args.promo.code,
    grossUsd: gross,
    feeUsd,
    netUsd,
    phoneNumber: args.claim.phoneNumber || "",
    providerLabel: args.claim.providerLabel,
    payoutReference: args.claim.payoutReference,
    outcome: args.outcome,
    failureMessage: args.failureMessage,
    locale: "fr",
  }).catch((e) => {
    console.warn("[promo-cashback] payout email failed", e);
  });
}

export async function requestCashbackClaim(args: {
  dashboardToken: string;
  partnerEmail: string;
  amountUsd: number;
  phoneNumber: string;
  provider: string;
  providerLabel?: string | null;
}): Promise<
  | {
      ok: true;
      claimId: string;
      amountUsd: number;
      feeUsd: number;
      netUsd: number;
      feeRate: number;
      payoutReference: string;
      payoutStatus: string;
    }
  | { ok: false; error: string; status: number }
> {
  const promo = await getPromoByToken(args.dashboardToken);
  if (!promo || !promo.active) {
    return { ok: false, error: "not_found", status: 404 };
  }
  if (promo.partnerEmail.toLowerCase() !== args.partnerEmail.toLowerCase()) {
    return { ok: false, error: "email_mismatch", status: 403 };
  }

  if (!hasPawapayKeys()) {
    return { ok: false, error: "momo_unavailable", status: 503 };
  }

  const phone = normalizeCodPhoneNumber(args.phoneNumber);
  if (!isValidCodMsisdn(phone)) {
    return { ok: false, error: "invalid_phone", status: 400 };
  }

  const claimable = await claimableCashbackUsd(promo.id);
  if (claimable <= 0) {
    return { ok: false, error: "nothing_to_claim", status: 409 };
  }

  const amount = roundUsd(Number(args.amountUsd));
  if (!Number.isFinite(amount) || amount < PROMO_CASHBACK_CLAIM_MIN_USD) {
    return { ok: false, error: "invalid_amount", status: 400 };
  }
  if (amount > claimable + 0.001) {
    return { ok: false, error: "amount_exceeds_claimable", status: 400 };
  }

  const quote = quoteCashbackPayout(amount);
  if (quote.netUsd <= 0) {
    return { ok: false, error: "invalid_amount", status: 400 };
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

  const network = resolvePawapayProvider(phone, args.provider);
  const providerId = toPawapayProviderId(network.method);
  const providerLabel =
    args.providerLabel?.trim() || network.method || args.provider.trim();
  const payoutReference = randomUUID();
  const grossStr = quote.grossUsd.toFixed(2);
  const netStr = quote.netUsd.toFixed(2);
  const feeNote = buildCashbackFeeNote({
    feeUsd: quote.feeUsd,
    netUsd: quote.netUsd,
    feeRate: quote.feeRate,
  });

  const [row] = await db
    .insert(hackathonPromoCashbackClaims)
    .values({
      promoCodeId: promo.id,
      amountUsd: grossStr,
      status: "requested",
      phoneNumber: phone,
      provider: providerId,
      providerLabel,
      payoutReference,
      payoutStatus: "PROCESSING",
      note: feeNote,
    })
    .returning();

  try {
    const pr = await pawapayPayOut({
      payoutId: payoutReference,
      amount: netStr,
      currency: "USD",
      phoneNumber: phone,
      provider: providerId,
      customerMessage: "McBuleli cashback",
    });

    if (!pr.accepted) {
      const msg =
        pr.response.failureReason?.failureMessage ??
        pr.response.failureReason?.failureCode ??
        "payout_rejected";
      const [failed] = await db
        .update(hackathonPromoCashbackClaims)
        .set({
          status: "failed",
          payoutStatus: "FAILED",
          note: buildCashbackFeeNote({
            feeUsd: quote.feeUsd,
            netUsd: quote.netUsd,
            feeRate: quote.feeRate,
            extra: String(msg).slice(0, 400),
          }),
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(hackathonPromoCashbackClaims.id, row.id))
        .returning();
      if (failed) {
        void notifyCashbackPayout({
          promo,
          claim: failed,
          outcome: "failed",
          failureMessage: String(msg),
        });
      }
      return { ok: false, error: "payout_rejected", status: 502 };
    }
  } catch (e) {
    console.warn("[promo-cashback] pawapayPayOut failed", e);
    const [failed] = await db
      .update(hackathonPromoCashbackClaims)
      .set({
        status: "failed",
        payoutStatus: "FAILED",
        note: buildCashbackFeeNote({
          feeUsd: quote.feeUsd,
          netUsd: quote.netUsd,
          feeRate: quote.feeRate,
          extra: "payout_init_error",
        }),
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(hackathonPromoCashbackClaims.id, row.id))
      .returning();
    if (failed) {
      void notifyCashbackPayout({
        promo,
        claim: failed,
        outcome: "failed",
        failureMessage: "payout_init_error",
      });
    }
    return { ok: false, error: "payout_failed", status: 502 };
  }

  void notifyCashbackPayout({
    promo,
    claim: row,
    outcome: "processing",
  });

  return {
    ok: true,
    claimId: row.id,
    amountUsd: quote.grossUsd,
    feeUsd: quote.feeUsd,
    netUsd: quote.netUsd,
    feeRate: quote.feeRate,
    payoutReference,
    payoutStatus: "PROCESSING",
  };
}

export async function applyPromoCashbackPayoutCallback(args: {
  payoutReference: string;
  status: "COMPLETED" | "FAILED" | "PROCESSING";
  failureMessage?: string | null;
}): Promise<boolean> {
  const db = getDb();
  const [claim] = await db
    .select()
    .from(hackathonPromoCashbackClaims)
    .where(eq(hackathonPromoCashbackClaims.payoutReference, args.payoutReference))
    .limit(1);
  if (!claim) return false;
  if (claim.status === "paid" || claim.status === "rejected") return true;

  const [promo] = await db
    .select()
    .from(hackathonPromoCodes)
    .where(eq(hackathonPromoCodes.id, claim.promoCodeId))
    .limit(1);

  if (args.status === "COMPLETED") {
    const alreadyPaid = claim.status === "paid";
    const [updated] = await db
      .update(hackathonPromoCashbackClaims)
      .set({
        status: "paid",
        payoutStatus: "COMPLETED",
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(hackathonPromoCashbackClaims.id, claim.id))
      .returning();
    if (!alreadyPaid && updated && promo) {
      void notifyCashbackPayout({
        promo,
        claim: updated,
        outcome: "completed",
      });
    }
    return true;
  }

  if (args.status === "FAILED") {
    const alreadyFailed = claim.status === "failed";
    const fees = parseCashbackFeeNote(claim.note);
    const [updated] = await db
      .update(hackathonPromoCashbackClaims)
      .set({
        status: "failed",
        payoutStatus: "FAILED",
        note: buildCashbackFeeNote({
          feeUsd: fees.feeUsd ?? roundUsd(Number(claim.amountUsd) * FIAT_FEE_RATE),
          netUsd:
            fees.netUsd ??
            roundUsd(Number(claim.amountUsd) * (1 - FIAT_FEE_RATE)),
          feeRate: fees.feeRate ?? FIAT_FEE_RATE,
          extra: args.failureMessage?.slice(0, 400) || undefined,
        }),
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(hackathonPromoCashbackClaims.id, claim.id))
      .returning();
    if (!alreadyFailed && updated && promo) {
      void notifyCashbackPayout({
        promo,
        claim: updated,
        outcome: "failed",
        failureMessage: args.failureMessage,
      });
    }
    return true;
  }

  await db
    .update(hackathonPromoCashbackClaims)
    .set({
      payoutStatus: "PROCESSING",
      updatedAt: new Date(),
    })
    .where(eq(hackathonPromoCashbackClaims.id, claim.id));
  return true;
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
      ...(args.status === "paid"
        ? { payoutStatus: claim.payoutStatus ?? "COMPLETED" }
        : {}),
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
      kind: p.kind ?? "partner",
      ownerUserId: p.ownerUserId ?? null,
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
        phoneNumber: c.phoneNumber,
        provider: c.provider,
        providerLabel: c.providerLabel,
        payoutReference: c.payoutReference,
        payoutStatus: c.payoutStatus,
        requestedAt: c.requestedAt.toISOString(),
        resolvedAt: c.resolvedAt?.toISOString() ?? null,
        note: c.note,
      })),
    });
  }
  return out;
}
