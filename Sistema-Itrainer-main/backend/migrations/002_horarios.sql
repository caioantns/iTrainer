-- Horarios de disponibilidade por profissional
CREATE TABLE IF NOT EXISTS horarios_profissionais (
  horario_id      BIGSERIAL PRIMARY KEY,
  profissional_id BIGINT NOT NULL REFERENCES profissionais(profissional_id) ON DELETE CASCADE,
  dia_semana      SMALLINT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio     TIME NOT NULL,
  hora_fim        TIME NOT NULL,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profissional_id, dia_semana, hora_inicio, hora_fim)
);
CREATE INDEX IF NOT EXISTS idx_horarios_profissional ON horarios_profissionais(profissional_id, dia_semana);
