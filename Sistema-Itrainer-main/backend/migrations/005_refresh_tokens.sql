-- Garante gen_random_uuid() disponivel
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Refresh tokens com rotation + family tracking p/ detectar reuse (token theft)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL,
  user_id      BIGINT NOT NULL,
  user_tipo    VARCHAR(20) NOT NULL CHECK (user_tipo IN ('cliente','profissional')),
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  replaced_by  UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip           INET,
  user_agent   TEXT
);
CREATE INDEX IF NOT EXISTS idx_refresh_user   ON refresh_tokens(user_id, user_tipo);
CREATE INDEX IF NOT EXISTS idx_refresh_family ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_hash   ON refresh_tokens(token_hash);
