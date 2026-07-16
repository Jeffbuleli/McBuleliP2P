import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BUILDERS_TIER_PRICE_MCB,
  BUILDERS_TIERS,
  buildersTierPriceMcb,
  isBuildersTier,
} from "../builders-config";
import { buildMcbClaimPoolStats } from "../../mcb-token-config";

describe("builders config", () => {
  it("has five tiers with positive McB prices", () => {
    assert.equal(BUILDERS_TIERS.length, 5);
    for (const tier of BUILDERS_TIERS) {
      assert.ok(isBuildersTier(tier));
      assert.ok(buildersTierPriceMcb(tier) > 0);
      assert.equal(BUILDERS_TIER_PRICE_MCB[tier], buildersTierPriceMcb(tier));
    }
  });

  it("rejects invalid tier strings", () => {
    assert.equal(isBuildersTier("iron"), false);
    assert.equal(isBuildersTier("bronze"), true);
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
