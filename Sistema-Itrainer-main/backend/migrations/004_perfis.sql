-- Perfil estendido do profissional (1:1 com profissionais)
CREATE TABLE IF NOT EXISTS perfis_profissionais (
  profissional_id BIGINT PRIMARY KEY REFERENCES profissionais(profissional_id) ON DELETE CASCADE,
  telefone        VARCHAR(30),
  cref            VARCHAR(50),
  foto_url        TEXT,
  especialidades  TEXT[],
  experiencia     INTEGER,
  descricao       TEXT,
  preco_hora      INTEGER,
  localizacao     VARCHAR(120),
  online          BOOLEAN DEFAULT TRUE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_perfis_local ON perfis_profissionais(localizacao);

-- Perfil estendido do cliente
CREATE TABLE IF NOT EXISTS perfis_clientes (
  cliente_id       BIGINT PRIMARY KEY REFERENCES clientes(cliente_id) ON DELETE CASCADE,
  telefone         VARCHAR(30),
  data_nascimento  DATE,
  objetivos        TEXT[],
  nivel            VARCHAR(30),
  restricoes       TEXT,
  preferencias     TEXT[],
  localizacao      VARCHAR(120),
  foto_url         TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
