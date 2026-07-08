-- Execute este script no SQL Editor do Supabase (https://app.supabase.com)
-- Ele habilita o envio de eventos (INSERT, UPDATE, DELETE) em tempo real via WebSockets.
-- IDEMPOTENT: Pode ser rodado várias vezes sem erro.

-- Adiciona todas as tabelas necessárias à publicação supabase_realtime.
-- Se a tabela já estiver na publicação, o DO block ignora o erro silenciosamente.

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE posts; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE imagens; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE audios; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE videos; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE videos_cenas; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE mural_ideias; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE production_lists; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE production_batches; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE content_presets; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
