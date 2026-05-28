-- One open deposit slot per (network, shared address, exact expected amount).
-- Prevents two users from sharing the same payable amount on the same Binance address.
CREATE UNIQUE INDEX IF NOT EXISTS "deposit_sessions_open_amount_slot_uidx"
  ON "deposit_sessions" ("network_canonical", "shared_address", "expected_amount")
  WHERE "status" IN ('ACTIVE', 'EXPIRED');
