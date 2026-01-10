-- Add 3-level goal columns for global metas (faturamento and conversao)
ALTER TABLE public.metas 
ADD COLUMN IF NOT EXISTS meta_faturamento_minimo numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_faturamento_satisfatorio numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_faturamento_excelente numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_conversao_minimo numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_conversao_satisfatorio numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_conversao_excelente numeric DEFAULT 0;

-- Add 3-level goal columns for individual metas (faturamento, reunioes, agendamentos)
ALTER TABLE public.metas 
ADD COLUMN IF NOT EXISTS meta_reunioes_minimo integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_reunioes_satisfatorio integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_reunioes_excelente integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_agendamentos_minimo integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_agendamentos_satisfatorio integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_agendamentos_excelente integer DEFAULT 0;

-- Comment explaining the structure
COMMENT ON TABLE public.metas IS 'Metas com 3 níveis: mínimo, satisfatório e excelente para faturamento, conversão (global) e faturamento, reuniões, agendamentos (individual)';