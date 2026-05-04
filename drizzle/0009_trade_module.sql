-- Futures & simplified binary-style options (custodial USDT)

CREATE TABLE trade_futures_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(16) NOT NULL,
  side VARCHAR(8) NOT NULL,
  leverage INTEGER NOT NULL,
  margin_usdt NUMERIC(36, 18) NOT NULL,
  entry_price NUMERIC(36, 18) NOT NULL,
  liquidation_price NUMERIC(36, 18) NOT NULL,
  stop_loss_price NUMERIC(36, 18),
  qty_base NUMERIC(36, 18) NOT NULL,
  fee_open_usdt NUMERIC(36, 18) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  close_price NUMERIC(36, 18),
  realized_pnl_usdt NUMERIC(36, 18),
  fee_close_usdt NUMERIC(36, 18) DEFAULT '0',
  close_reason VARCHAR(16),
  meta JSONB
);

CREATE INDEX trade_futures_positions_user_idx ON trade_futures_positions(user_id);
CREATE INDEX trade_futures_positions_open_idx ON trade_futures_positions(status)
  WHERE status = 'open';

CREATE TABLE trade_simple_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(16) NOT NULL,
  direction VARCHAR(8) NOT NULL,
  stake_usdt NUMERIC(36, 18) NOT NULL,
  payout_pct NUMERIC(12, 6) NOT NULL,
  duration_sec INTEGER NOT NULL,
  expiry_at TIMESTAMPTZ NOT NULL,
  entry_price NUMERIC(36, 18) NOT NULL,
  fee_usdt NUMERIC(36, 18) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  settled_at TIMESTAMPTZ,
  settlement_price NUMERIC(36, 18),
  outcome VARCHAR(8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB
);

CREATE INDEX trade_simple_options_user_idx ON trade_simple_options(user_id);
CREATE INDEX trade_simple_options_pending_idx ON trade_simple_options(status, expiry_at);
