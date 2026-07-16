import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyQualityToBpGrant,
  computeRulesQualityScore,
} from "../quality-score";
import { utilityTagFromContentKind, isUtilityTag } from "../utility-tags";

describe("utility tags", () => {
  it("maps content kinds", () => {
    assert.equal(utilityTagFromContentKind("news"), "local");
    assert.equal(utilityTagFromContentKind("analysis"), "trade_edu");
    assert.ok(isUtilityTag("p2p"));
    assert.equal(isUtilityTag("foo"), false);
  });
});

describe("quality score v0", () => {
  it("scores higher for KYC + structured text", () => {
    const low = computeRulesQualityScore({
      body: "hi",
      authorKycApproved: false,
    });
    const high = computeRulesQualityScore({
      body: "Voici une analyse claire du marché USDT. Les volumes P2P restent stables en RDC.",
      authorKycApproved: true,
      authorEmailVerified: true,
    });
    assert.ok(high.score > low.score);
    assert.ok(high.score >= 50);
  });

  it("penalizes scam hints", () => {
    const bad = computeRulesQualityScore({
      body: "Guaranteed profit send seed phrase now. Double your USDT.",
      authorKycApproved: true,
    });
    assert.equal(bad.factors.safety, 0);
  });

  it("applies BP quality multiplier", () => {
    assert.equal(applyQualityToBpGrant(25, 100), 25);
    assert.equal(applyQualityToBpGrant(25, 0), Math.floor(25 * 0.3));
    assert.equal(applyQualityToBpGrant(25, 80), Math.floor(25 * 0.86));
  });
});
