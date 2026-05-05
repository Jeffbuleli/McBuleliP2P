CREATE TABLE IF NOT EXISTS platform_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(80) NOT NULL,
  resource_type varchar(32),
  resource_id varchar(64),
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_admin_audit_created_idx ON platform_admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_admin_audit_actor_idx ON platform_admin_audit_log (actor_user_id);
