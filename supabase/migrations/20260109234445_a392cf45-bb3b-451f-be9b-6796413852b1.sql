-- Drop existing restrictive policies for metas
DROP POLICY IF EXISTS "Admins and gestores can insert metas" ON public.metas;
DROP POLICY IF EXISTS "Admins and gestores can update metas" ON public.metas;
DROP POLICY IF EXISTS "Admins can delete metas" ON public.metas;
DROP POLICY IF EXISTS "Authenticated users can view metas" ON public.metas;

-- Create PERMISSIVE policies (default) for metas
CREATE POLICY "Authenticated users can view metas"
ON public.metas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and gestores can insert metas"
ON public.metas
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can update metas"
ON public.metas
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can delete metas"
ON public.metas
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- Also fix colaboradores policies
DROP POLICY IF EXISTS "Admins and gestores can insert colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Admins and gestores can update colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Admins can delete colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Authenticated users can view colaboradores" ON public.colaboradores;

CREATE POLICY "Authenticated users can view colaboradores"
ON public.colaboradores
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and gestores can insert colaboradores"
ON public.colaboradores
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can update colaboradores"
ON public.colaboradores
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can delete colaboradores"
ON public.colaboradores
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));