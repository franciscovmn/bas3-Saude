-- Criar tabela para histórico do assistente (chat)
CREATE TABLE IF NOT EXISTS public.assistente_historico (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.assistente_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para assistente_historico
CREATE POLICY "Users can view their own chat history"
  ON public.assistente_historico
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own messages"
  ON public.assistente_historico
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own chat history"
  ON public.assistente_historico
  FOR DELETE
  USING (user_id = auth.uid());

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_assistente_historico_user_id ON public.assistente_historico(user_id, created_at);

-- Criar tabela para relatórios salvos
CREATE TABLE IF NOT EXISTS public.relatorios_salvos (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  resultado TEXT NOT NULL,
  tipo_visualizacao TEXT NOT NULL DEFAULT 'texto' CHECK (tipo_visualizacao IN ('texto', 'grafico_pizza', 'grafico_barras', 'grafico_linha', 'tabela')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.relatorios_salvos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para relatorios_salvos
CREATE POLICY "Users can view their own saved reports"
  ON public.relatorios_salvos
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reports"
  ON public.relatorios_salvos
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reports"
  ON public.relatorios_salvos
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reports"
  ON public.relatorios_salvos
  FOR DELETE
  USING (user_id = auth.uid());

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_relatorios_salvos_user_id ON public.relatorios_salvos(user_id, created_at DESC);