
CREATE TABLE public.yoy_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes integer NOT NULL,
  ano integer NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (mes, ano)
);

ALTER TABLE public.yoy_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view yoy_data" ON public.yoy_data
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and gestores can insert yoy_data" ON public.yoy_data
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admins and gestores can update yoy_data" ON public.yoy_data
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admins and gestores can delete yoy_data" ON public.yoy_data
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor'));
