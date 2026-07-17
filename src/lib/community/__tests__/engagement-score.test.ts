import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeTrendingScore,
  rawEngagement,
  ENGAGEMENT_WEIGHTS,
} from "../engagement-score";

describe("engagement score", () => {
  it("weights tips above plain views", () => {
    const viewsOnly = rawEngagement({ viewCount: 100 });
    const tipOnly = rawEngagement({ tipBpTotal: 20 });
    assert.ok(tipOnly > viewsOnly * 0.5);
    assert.equal(ENGAGEMENT_WEIGHTS.tipBp, 4);
    assert.equal(ENGAGEMENT_WEIGHTS.share, 5);
  });

  it("decays with age", () => {
    const now = Date.now();
    const fresh = computeTrendingScore({
      likeCount: 10,
      commentCount: 5,
      shareCount: 2,
      viewCount: 100,
      tipBpTotal: 50,
      publishedAt: new Date(now - 2 * 3_600_000),
      createdAt: new Date(now - 2 * 3_600_000),
    });
    const stale = computeTrendingScore({
      likeCount: 10,
      commentCount: 5,
      shareCount: 2,
      viewCount: 100,
      tipBpTotal: 50,
      publishedAt: new Date(now - 48 * 3_600_000),
      createdAt: new Date(now - 48 * 3_600_000),
    });
    assert.ok(fresh > stale);
  });
});
