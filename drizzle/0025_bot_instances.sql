-- Bot strategy instances + execution log

CREATE TABLE bot_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(32) NOT NULL,
  billing VARCHAR(8) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'paused',
  config JSONB NOT NULL DEFAULT '{}',
  last_executed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bot_instances_plan_chk CHECK (plan_id IN ('dca_spot', 'grid_spot', 'futures_um')),
  CONSTRAINT bot_instances_billing_chk CHECK (billing IN ('demo', 'live')),
  CONSTRAINT bot_instances_status_chk CHECK (status IN ('active', 'paused'))
);

CREATE UNIQUE INDEX bot_instances_user_plan_uidx ON bot_instances(user_id, plan_id);

CREATE TABLE bot_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(32) NOT NULL,
  action VARCHAR(32) NOT NULL,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bot_execution_log_instance_idx ON bot_execution_log(instance_id, created_at DESC);
