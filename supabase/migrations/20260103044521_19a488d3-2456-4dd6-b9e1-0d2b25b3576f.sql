-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins and gestores can insert negocios" ON public.negocios;
DROP POLICY IF EXISTS "Admins and gestores can update negocios" ON public.negocios;
DROP POLICY IF EXISTS "Admins can delete negocios" ON public.negocios;
DROP POLICY IF EXISTS "Authenticated users can view negocios" ON public.negocios;

-- Recreate as permissive policies (default)
CREATE POLICY "Authenticated users can view negocios" 
  ON public.negocios 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Admins and gestores can insert negocios" 
  ON public.negocios 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "Admins and gestores can update negocios" 
  ON public.negocios 
  FOR UPDATE 
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "Admins can delete negocios" 
  ON public.negocios 
  FOR DELETE 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));