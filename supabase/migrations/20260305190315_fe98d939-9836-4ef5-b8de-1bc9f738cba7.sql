
CREATE TABLE public.clientes_relacionamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente text NOT NULL,
  valor_total_cliente numeric NOT NULL DEFAULT 0,
  quantidade_viagens integer NOT NULL DEFAULT 0,
  data_primeira_viagem date,
  data_ultima_viagem date,
  status text NOT NULL DEFAULT 'ativo',
  segmento text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  imported_by uuid
);

ALTER TABLE public.clientes_relacionamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clientes_relacionamento"
  ON public.clientes_relacionamento FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and gestores can insert clientes_relacionamento"
  ON public.clientes_relacionamento FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can update clientes_relacionamento"
  ON public.clientes_relacionamento FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can delete clientes_relacionamento"
  ON public.clientes_relacionamento FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE TRIGGER update_clientes_relacionamento_updated_at
  BEFORE UPDATE ON public.clientes_relacionamento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
