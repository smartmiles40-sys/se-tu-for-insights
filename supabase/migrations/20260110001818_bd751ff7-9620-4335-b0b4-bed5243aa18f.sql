-- Drop existing restrictive policies on metas
DROP POLICY IF EXISTS "Admins and gestores can delete metas" ON public.metas;
DROP POLICY IF EXISTS "Admins and gestores can insert metas" ON public.metas;
DROP POLICY IF EXISTS "Admins and gestores can update metas" ON public.metas;
DROP POLICY IF EXISTS "Authenticated users can view metas" ON public.metas;

-- Recreate as PERMISSIVE policies (default behavior)
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