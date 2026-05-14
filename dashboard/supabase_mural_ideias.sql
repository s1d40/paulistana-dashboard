-- Tabela para o Mural de Ideias (Trello Interno)
CREATE TABLE IF NOT EXISTS public.mural_ideias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'ideia', -- 'ideia', 'fazendo', 'concluido'
  autor_email TEXT,
  autor_nome TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Opcional, mas recomendado. Se não usar, remova ou comente as policies)
ALTER TABLE public.mural_ideias ENABLE ROW LEVEL SECURITY;

-- Política simples: qualquer um autenticado pode ver, criar, editar e excluir (já que a whitelist protege o app)
CREATE POLICY "Permitir tudo para usuários autenticados" ON public.mural_ideias
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
