-- Password reset tokens (hash, single-use, TTL curto)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_id    BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  user_tipo   VARCHAR(20) NOT NULL CHECK (user_tipo IN ('cliente','profissional')),
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip          INET
);
CREATE INDEX IF NOT EXISTS idx_pwreset_user ON password_reset_tokens(user_id, user_tipo);
CREATE INDEX IF NOT EXISTS idx_pwreset_hash ON password_reset_tokens(token_hash);
