-- Top Trader competition: tagged demo trades + weekly participant quotas (PG 16)

ALTER TABLE trade_futures_positions
  ADD COLUMN IF NOT EXISTS is_competition boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE trade_futures_positions
  ALTER COLUMN close_reason TYPE varchar(24);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS trade_futures_positions_competition_week_idx
  ON trade_futures_positions (user_id, closed_at)
  WHERE is_competition = true AND status IN ('closed', 'liquidated');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS top_trader_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_at timestamptz NOT NULL,
  opted_in_at timestamptz NOT NULL DEFAULT now(),
  trades_opened_today integer NOT NULL DEFAULT 0,
  trades_today_date date,
  refill_used boolean NOT NULL DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS top_trader_participants_user_week_idx
  ON top_trader_participants (user_id, week_start_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS top_trader_participants_week_idx
  ON top_trader_participants (week_start_at);
