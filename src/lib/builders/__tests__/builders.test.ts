import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BUILDERS_TIER_PRICE_MCB,
  BUILDERS_TIER_PRICE_USD,
  BUILDERS_TIERS,
  buildersTierPriceMcb,
  buildersTierPriceUsd,
  isBuildersTier,
} from "../builders-config";
import {
  mcbAmountForUsdNotional,
  membershipFeePerksEligible,
  quoteBuildersTier,
} from "../builders-pricing";
import {
  buildersBoostLimits,
  isAmbassadorCharterEligible,
  softPerksForTier,
} from "../builders-soft-perks";
import { buildMcbClaimPoolStats } from "../../mcb-token-config";

describe("builders config", () => {
  it("has five tiers with positive USD prices", () => {
    assert.equal(BUILDERS_TIERS.length, 5);
    for (const tier of BUILDERS_TIERS) {
      assert.ok(isBuildersTier(tier));
      assert.ok(buildersTierPriceUsd(tier) > 0);
      assert.equal(BUILDERS_TIER_PRICE_USD[tier], buildersTierPriceUsd(tier));
      assert.ok(BUILDERS_TIER_PRICE_MCB[tier] > 0);
      assert.ok(buildersTierPriceMcb(tier) > 0);
    }
  });

  it("rejects invalid tier strings", () => {
    assert.equal(isBuildersTier("iron"), false);
    assert.equal(isBuildersTier("bronze"), true);
  });
});

describe("builders USD anchor pricing", () => {
  it("scales McB amount when token is cheap", () => {
    // $200 Gold at $0.00002/McB → 10_000_000 McB
    assert.equal(mcbAmountForUsdNotional(200, 0.000_02), 10_000_000);
    // $200 Gold at $0.25/McB → 800 McB (legacy sticker coincidence)
    assert.equal(mcbAmountForUsdNotional(200, 0.25), 800);
  });

  it("locks fee perks when rate or USD notional is insufficient", () => {
    assert.equal(
      membershipFeePerksEligible({
        tier: "gold",
        paidUsdNotional: 200,
        mcbUsdRateAtPurchase: 0.001,
      }),
      false,
    );
    assert.equal(
      membershipFeePerksEligible({
        tier: "gold",
        paidUsdNotional: 200,
        mcbUsdRateAtPurchase: 0.05,
      }),
      true,
    );
    assert.equal(
      membershipFeePerksEligible({
        tier: "gold",
        paidUsdNotional: 50,
        mcbUsdRateAtPurchase: 0.05,
      }),
      false,
    );
  });

  it("quotes USD even when rate env is missing", () => {
    const prev = process.env.MCB_USD_RATE;
    delete process.env.MCB_USD_RATE;
    delete process.env.MCB_USD_TWAP;
    delete process.env.BUILDERS_MCB_USD_RATE;
    const q = quoteBuildersTier("gold");
    assert.equal(q.priceUsd, 200);
    assert.equal(q.priceMcb, null);
    assert.equal(q.feePerksUnlocked, false);
    if (prev !== undefined) process.env.MCB_USD_RATE = prev;
  });
});

describe("builders soft perks", () => {
  it("raises boost limits for Gold+ and marks ambassador eligibility", () => {
    assert.equal(softPerksForTier("bronze").ambassadorEligible, false);
    assert.equal(softPerksForTier("gold").ambassadorEligible, true);
    assert.equal(isAmbassadorCharterEligible("platinum"), true);
    assert.equal(isAmbassadorCharterEligible("silver"), false);

    const baseline = buildersBoostLimits(null);
    assert.equal(baseline.maxPerDay, 3);
    assert.equal(baseline.maxActivePerUser, 1);

    const gold = buildersBoostLimits("gold");
    assert.equal(gold.maxPerDay, 5);
    assert.equal(gold.maxActivePerUser, 2);

    const platinum = buildersBoostLimits("platinum");
    assert.equal(platinum.maxPerDay, 8);
    assert.equal(platinum.maxActivePerUser, 3);
  });
});

describe("claim pool stats", () => {
  it("computes remaining and closes when exhausted", () => {
    const open = buildMcbClaimPoolStats({
      mintedMcb: 1_000,
      pendingMcb: 500,
      monthlyUsedMcb: 0,
    });
    assert.equal(open.capMcb, 40_000_000);
    assert.equal(open.remainingMcb, 40_000_000 - 1_500);
    assert.equal(open.claimOpen, true);

    const closed = buildMcbClaimPoolStats({
      mintedMcb: 39_000_000,
      pendingMcb: 1_000_000,
      monthlyUsedMcb: 0,
    });
    assert.equal(closed.remainingMcb, 0);
    assert.equal(closed.claimOpen, false);
  });
});
