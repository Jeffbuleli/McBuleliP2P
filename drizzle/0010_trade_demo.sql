-- Paper trading: virtual USDT for futures/options; live requires explicit opt-in

ALTER TABLE users
  ADD COLUMN trade_demo_usdt_balance NUMERIC(36, 18) NOT NULL DEFAULT '10000',
  ADD COLUMN trade_live_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE trade_futures_positions
  ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE trade_simple_options
  ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX trade_futures_positions_user_demo_open_idx
  ON trade_futures_positions (user_id, is_demo)
  WHERE status = 'open';

CREATE INDEX trade_simple_options_user_demo_idx
  ON trade_simple_options (user_id, is_demo);
