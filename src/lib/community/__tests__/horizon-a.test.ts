import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyQualityToBpGrant,
  computeRulesQualityScore,
} from "../quality-score";
import { utilityTagFromContentKind, isUtilityTag, utilityTagLabel } from "../utility-tags";
import { COMMUNITY_POST_BOOST } from "../../reward-points-config";
import { isPostBoosted } from "../boost-utils";

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

describe("post boost A4", () => {
  it("has product costs", () => {
    assert.equal(COMMUNITY_POST_BOOST.costBp, 80);
    assert.equal(COMMUNITY_POST_BOOST.hours, 24);
    assert.equal(COMMUNITY_POST_BOOST.maxActivePerUser, 1);
    assert.equal(COMMUNITY_POST_BOOST.maxPerDay, 3);
  });

  it("detects active boost window", () => {
    assert.equal(isPostBoosted(null), false);
    assert.equal(
      isPostBoosted(new Date(Date.now() - 1000).toISOString()),
      false,
    );
    assert.equal(
      isPostBoosted(new Date(Date.now() + 60_000).toISOString()),
      true,
    );
  });
});

describe("creator profile A5", () => {
  it("exposes utility tag labels for stats chips", () => {
    assert.equal(utilityTagLabel("p2p", true), "P2P");
    assert.equal(utilityTagLabel("learn", false), "Learn");
  });

  it("keeps like-given at 1 BP (A3)", async () => {
    const { REWARD_POINTS, REWARD_GRANT } = await import(
      "../../reward-points-config"
    );
    assert.equal(REWARD_POINTS[REWARD_GRANT.COMMUNITY_LIKE], 1);
  });
});

describe("horizon B tips + ads split", () => {
  it("defines tip amounts", async () => {
    const { COMMUNITY_TIP_BP } = await import("../../reward-points-config");
    assert.deepEqual([...COMMUNITY_TIP_BP.amounts], [20, 50, 100]);
    assert.equal(COMMUNITY_TIP_BP.maxPerDay, 10);
  });

  it("splits ads spend 50/25/25", async () => {
    const { splitAdsSpendMcb } = await import("../ads-config");
    assert.deepEqual(splitAdsSpendMcb(100), {
      creatorFund: 50,
      burn: 25,
      ops: 25,
    });
  });

  it("rejects ads spend when flag off", async () => {
    const prev = process.env.COMMUNITY_ADS_ENABLED;
    process.env.COMMUNITY_ADS_ENABLED = "false";
    const { spendAdsMcb } = await import("../mcb-custodial-service");
    const r = await spendAdsMcb({
      brandId: "00000000-0000-4000-8000-000000000001",
      campaignId: "00000000-0000-4000-8000-000000000002",
      amount: 10,
    });
    process.env.COMMUNITY_ADS_ENABLED = prev;
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, "ads_disabled");
  });
});
