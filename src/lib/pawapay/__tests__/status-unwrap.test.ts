import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapPawapayStatus,
  normalizePawapayStatusPayload,
  unwrapPawapayStatusLookup,
} from "../provider";

describe("unwrapPawapayStatusLookup", () => {
  it("unwraps v2 FOUND + data.status COMPLETED", () => {
    const payment = unwrapPawapayStatusLookup({
      status: "FOUND",
      data: {
        depositId: "dep-1",
        status: "COMPLETED",
        amount: "10",
        currency: "USD",
      },
    });
    assert.ok(payment);
    assert.equal(payment.status, "COMPLETED");
    assert.equal(payment.depositId, "dep-1");
  });

  it("returns null for NOT_FOUND", () => {
    assert.equal(unwrapPawapayStatusLookup({ status: "NOT_FOUND" }), null);
  });

  it("keeps flat callback payment objects", () => {
    const payment = unwrapPawapayStatusLookup({
      payoutId: "pay-1",
      status: "COMPLETED",
      amount: "5",
      currency: "USD",
    });
    assert.ok(payment);
    assert.equal(payment.status, "COMPLETED");
  });
});

describe("normalizePawapayStatusPayload", () => {
  it("maps FOUND wrapper to COMPLETED for reconcile", () => {
    const n = normalizePawapayStatusPayload(
      "deposit",
      {
        status: "FOUND",
        data: {
          depositId: "dep-2",
          status: "COMPLETED",
          amount: "12.5",
          currency: "USD",
        },
      },
      { reference: "dep-2", currency: "USD", amount: "12.5" },
    );
    assert.equal(n.status, "COMPLETED");
    assert.equal(n.reference, "dep-2");
    assert.equal(mapPawapayStatus("FOUND"), "PROCESSING");
  });
});
