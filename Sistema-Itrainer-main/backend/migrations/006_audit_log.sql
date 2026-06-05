-- Audit log: rastreio de mutacoes sensiveis p/ forense + LGPD
CREATE TABLE IF NOT EXISTS audit_log (
  audit_id   BIGSERIAL PRIMARY KEY,
  user_id    BIGINT,
  user_tipo  VARCHAR(20),
  action     VARCHAR(60) NOT NULL,
  target     VARCHAR(120),
  meta       JSONB,
  ip         INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_log(user_id, user_tipo);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
