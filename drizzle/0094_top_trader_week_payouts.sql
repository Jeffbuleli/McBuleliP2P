-- Top Trader weekly winner payouts (Sunday 01:00 GMT cron)

CREATE TABLE IF NOT EXISTS top_trader_week_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_at timestamptz NOT NULL,
  week_end_at timestamptz NOT NULL,
  week_label varchar(16) NOT NULL,
  winner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  weekly_pnl_usdt numeric(36, 18),
  prize_usdt numeric(36, 18) NOT NULL DEFAULT '10',
  trade_count integer NOT NULL DEFAULT 0,
  status varchar(24) NOT NULL DEFAULT 'paid',
  paid_at timestamptz,
  ledger_batch_id uuid,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS top_trader_week_payouts_week_start_idx
  ON top_trader_week_payouts (week_start_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS top_trader_week_payouts_winner_idx
  ON top_trader_week_payouts (winner_user_id);
