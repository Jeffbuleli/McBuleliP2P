ALTER TABLE "user_binance_api_credentials"
ADD COLUMN IF NOT EXISTS "futures_api_kind" varchar(8);
