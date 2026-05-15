-- Adiciona campos de agendamento na tabela de posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS data_agendamento TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status_agendamento TEXT DEFAULT 'nao_agendado';

COMMENT ON COLUMN posts.data_agendamento IS 'Data e hora programada para publicação automática via webhook';
COMMENT ON COLUMN posts.status_agendamento IS 'Estado do agendamento de publicação (nao_agendado, agendado, publicado, falhou)';
