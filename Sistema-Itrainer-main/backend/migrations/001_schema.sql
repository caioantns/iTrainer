-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  cliente_id   BIGSERIAL PRIMARY KEY,
  nome         VARCHAR(100) NOT NULL,
  email        VARCHAR(120) UNIQUE NOT NULL,
  senha        VARCHAR(255) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profissionais
CREATE TABLE IF NOT EXISTS profissionais (
  profissional_id BIGSERIAL PRIMARY KEY,
  nome            VARCHAR(100) NOT NULL,
  email           VARCHAR(120) UNIQUE NOT NULL,
  senha           VARCHAR(255) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Depoimentos
CREATE TABLE IF NOT EXISTS depoimentos (
  depoimento_id BIGSERIAL PRIMARY KEY,
  cliente_id    BIGINT NOT NULL REFERENCES clientes(cliente_id) ON DELETE CASCADE,
  texto         TEXT NOT NULL,
  data_criacao  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_depoimentos_cliente ON depoimentos(cliente_id);

-- Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  agendamento_id  BIGSERIAL PRIMARY KEY,
  data_hora       TIMESTAMPTZ NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDENTE'
                  CHECK (status IN ('PENDENTE','CONFIRMADO','CANCELADO','CONCLUIDO')),
  cliente_id      BIGINT NOT NULL REFERENCES clientes(cliente_id) ON DELETE CASCADE,
  profissional_id BIGINT NOT NULL REFERENCES profissionais(profissional_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente      ON agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional ON agendamentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora    ON agendamentos(data_hora);

-- Avaliacoes
CREATE TABLE IF NOT EXISTS avaliacoes (
  avaliacao_id    BIGSERIAL PRIMARY KEY,
  cliente_id      BIGINT NOT NULL REFERENCES clientes(cliente_id) ON DELETE CASCADE,
  profissional_id BIGINT NOT NULL REFERENCES profissionais(profissional_id) ON DELETE CASCADE,
  nota            SMALLINT NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario      TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cliente_id, profissional_id)
);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_profissional ON avaliacoes(profissional_id);

-- Chat
CREATE TABLE IF NOT EXISTS chat_mensagens (
  mensagem_id     BIGSERIAL PRIMARY KEY,
  agendamento_id  BIGINT NOT NULL REFERENCES agendamentos(agendamento_id) ON DELETE CASCADE,
  remetente_id    BIGINT NOT NULL,
  tipo_remetente  VARCHAR(20) NOT NULL CHECK (tipo_remetente IN ('CLIENTE','PROFISSIONAL')),
  conteudo        TEXT NOT NULL,
  data_hora       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_agendamento ON chat_mensagens(agendamento_id, data_hora);
