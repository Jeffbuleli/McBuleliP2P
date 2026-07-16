import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AMBASSADOR_CHARTER_BULLET_KEYS,
  AMBASSADOR_CHARTER_VERSION,
  AMBASSADOR_STATUS,
  isAmbassadorStatus,
} from "../ambassador-config";
import { isAmbassadorCharterEligible } from "../../builders/builders-soft-perks";

describe("ambassador charter config", () => {
  it("has a versioned charter with five bullets", () => {
    assert.ok(AMBASSADOR_CHARTER_VERSION.length >= 4);
    assert.equal(AMBASSADOR_CHARTER_BULLET_KEYS.length, 5);
  });

  it("recognizes mandate statuses", () => {
    assert.equal(isAmbassadorStatus(AMBASSADOR_STATUS.PENDING), true);
    assert.equal(isAmbassadorStatus(AMBASSADOR_STATUS.ACTIVE), true);
    assert.equal(isAmbassadorStatus("iron"), false);
  });

  it("requires Gold+ for eligibility gate", () => {
    assert.equal(isAmbassadorCharterEligible("bronze"), false);
    assert.equal(isAmbassadorCharterEligible("silver"), false);
    assert.equal(isAmbassadorCharterEligible("gold"), true);
    assert.equal(isAmbassadorCharterEligible("platinum"), true);
  });
});
