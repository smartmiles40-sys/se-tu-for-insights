-- Create metas table for storing goals/targets
CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('global', 'sdr', 'especialista')),
  responsavel TEXT, -- Name of SDR or Especialista (null for global)
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
  meta_faturamento NUMERIC DEFAULT 0,
  meta_vendas INTEGER DEFAULT 0,
  meta_reunioes INTEGER DEFAULT 0,
  meta_agendamentos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (tipo, responsavel, mes, ano)
);

-- Enable RLS
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view metas" 
ON public.metas 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and gestores can insert metas" 
ON public.metas 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can update metas" 
ON public.metas 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins can delete metas" 
ON public.metas 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_metas_updated_at
BEFORE UPDATE ON public.metas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();