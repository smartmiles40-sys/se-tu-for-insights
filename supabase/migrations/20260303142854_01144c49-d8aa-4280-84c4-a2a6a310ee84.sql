
-- Add setores column to negocios table
ALTER TABLE public.negocios ADD COLUMN IF NOT EXISTS setores text;

-- Add setores column to staging_negocios table
ALTER TABLE public.staging_negocios ADD COLUMN IF NOT EXISTS setores text;
