-- Adicionar coluna data_inicio_plano_atual na tabela pacientes
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS data_inicio_plano_atual DATE DEFAULT CURRENT_DATE;