-- Planos oferecidos por profissionais
CREATE TABLE IF NOT EXISTS planos (
  plano_id        BIGSERIAL PRIMARY KEY,
  profissional_id BIGINT NOT NULL REFERENCES profissionais(profissional_id) ON DELETE CASCADE,
  titulo          VARCHAR(120) NOT NULL,
  descricao       TEXT,
  preco_centavos  INTEGER NOT NULL CHECK (preco_centavos >= 0),
  duracao_dias    INTEGER NOT NULL CHECK (duracao_dias > 0),
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_planos_profissional ON planos(profissional_id);

-- Pagamentos (cobrancas via gateway externo)
CREATE TABLE IF NOT EXISTS pagamentos (
  pagamento_id      BIGSERIAL PRIMARY KEY,
  cliente_id        BIGINT NOT NULL REFERENCES clientes(cliente_id) ON DELETE CASCADE,
  plano_id          BIGINT NOT NULL REFERENCES planos(plano_id) ON DELETE RESTRICT,
  gateway           VARCHAR(20) NOT NULL DEFAULT 'asaas',
  gateway_charge_id VARCHAR(120) UNIQUE,
  status            VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED','CANCELED')),
  valor_centavos    INTEGER NOT NULL CHECK (valor_centavos >= 0),
  metodo            VARCHAR(20),
  invoice_url       TEXT,
  pix_qr_payload    TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pagamentos_cliente ON pagamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status  ON pagamentos(status);

-- Assinaturas ativas: liberadas quando pagamento PAID
CREATE TABLE IF NOT EXISTS assinaturas (
  assinatura_id BIGSERIAL PRIMARY KEY,
  cliente_id    BIGINT NOT NULL REFERENCES clientes(cliente_id) ON DELETE CASCADE,
  plano_id      BIGINT NOT NULL REFERENCES planos(plano_id) ON DELETE RESTRICT,
  pagamento_id  BIGINT NOT NULL REFERENCES pagamentos(pagamento_id) ON DELETE CASCADE,
  inicio        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em     TIMESTAMPTZ NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_assinaturas_cliente ON assinaturas(cliente_id, ativo);
