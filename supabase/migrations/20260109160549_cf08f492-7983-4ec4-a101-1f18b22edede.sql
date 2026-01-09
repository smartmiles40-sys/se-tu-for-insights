-- Add missing UTM fields to negocios table
ALTER TABLE public.negocios 
ADD COLUMN IF NOT EXISTS utm_content text,
ADD COLUMN IF NOT EXISTS utm_term text;

-- Create enum for staging status
DO $$ BEGIN
  CREATE TYPE public.staging_status AS ENUM ('pendente', 'aprovado', 'rejeitado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create staging_negocios table (intermediate table for review)
CREATE TABLE IF NOT EXISTS public.staging_negocios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'n8n',
  status staging_status NOT NULL DEFAULT 'pendente',
  notes text,
  imported_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- All fields from negocios
  nome text,
  pipeline text,
  contato_fonte text,
  vendedor text,
  sdr text,
  data_inicio date,
  mql boolean DEFAULT false,
  sql_qualificado boolean DEFAULT false,
  reuniao_agendada boolean DEFAULT false,
  reuniao_realizada boolean DEFAULT false,
  no_show boolean DEFAULT false,
  venda_aprovada boolean DEFAULT false,
  total numeric DEFAULT 0,
  tipo_venda text,
  motivo_perda text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  lead_fonte text,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on staging_negocios
ALTER TABLE public.staging_negocios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staging_negocios
CREATE POLICY "Admins and gestores can view staging" 
ON public.staging_negocios 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can insert staging" 
ON public.staging_negocios 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can update staging" 
ON public.staging_negocios 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins can delete staging" 
ON public.staging_negocios 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to insert (for edge function)
CREATE POLICY "Service role can insert staging"
ON public.staging_negocios
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_staging_negocios_updated_at
BEFORE UPDATE ON public.staging_negocios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();