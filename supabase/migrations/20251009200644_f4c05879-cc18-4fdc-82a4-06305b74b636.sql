-- Criar tabela para mensagens fora do escopo da IA
CREATE TABLE public.mensagens_fora_do_escopo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  nutricionista_uid UUID NOT NULL,
  mensagem TEXT NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolvido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.mensagens_fora_do_escopo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Nutricionistas podem ver e gerenciar suas próprias mensagens
CREATE POLICY "Users can view their own messages"
ON public.mensagens_fora_do_escopo
FOR SELECT
USING (nutricionista_uid = auth.uid() OR get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their own messages"
ON public.mensagens_fora_do_escopo
FOR INSERT
WITH CHECK (nutricionista_uid = auth.uid());

CREATE POLICY "Users can update their own messages"
ON public.mensagens_fora_do_escopo
FOR UPDATE
USING (nutricionista_uid = auth.uid() OR get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can delete their own messages"
ON public.mensagens_fora_do_escopo
FOR DELETE
USING (nutricionista_uid = auth.uid() OR get_user_role(auth.uid()) = 'admin');

-- Criar índices para melhor performance
CREATE INDEX idx_mensagens_nutricionista ON public.mensagens_fora_do_escopo(nutricionista_uid);
CREATE INDEX idx_mensagens_resolvido ON public.mensagens_fora_do_escopo(resolvido);
CREATE INDEX idx_mensagens_data_hora ON public.mensagens_fora_do_escopo(data_hora DESC);

-- Habilitar Realtime para notificações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_fora_do_escopo;