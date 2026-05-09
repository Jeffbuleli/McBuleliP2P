-- Optional user-declared amount + note for USDT deposit wizard (Binance address flow).
ALTER TABLE "deposits" ADD COLUMN IF NOT EXISTS "declared_amount_usdt" numeric(36, 18);
ALTER TABLE "deposits" ADD COLUMN IF NOT EXISTS "user_note" text;
