-- Trading bots: encrypted user Binance API keys + plan subscriptions

CREATE TABLE user_binance_api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  environment VARCHAR(8) NOT NULL,
  api_key_hint VARCHAR(24) NOT NULL,
  credentials_ciphertext TEXT NOT NULL,
  spot_ok BOOLEAN NOT NULL DEFAULT false,
  futures_ok BOOLEAN NOT NULL DEFAULT false,
  last_validation_error TEXT,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_binance_api_credentials_env_chk CHECK (environment IN ('demo', 'live'))
);

CREATE UNIQUE INDEX user_binance_api_credentials_user_env_uidx
  ON user_binance_api_credentials(user_id, environment);

CREATE TABLE bot_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(32) NOT NULL,
  billing VARCHAR(8) NOT NULL,
  price_paid NUMERIC(18, 8) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bot_subscriptions_billing_chk CHECK (billing IN ('demo', 'live')),
  CONSTRAINT bot_subscriptions_plan_chk CHECK (plan_id IN ('dca_spot', 'grid_spot', 'futures_um'))
);

CREATE INDEX bot_subscriptions_user_active_idx
  ON bot_subscriptions(user_id, status, expires_at);
