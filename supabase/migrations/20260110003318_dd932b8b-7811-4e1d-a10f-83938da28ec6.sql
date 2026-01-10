-- Corrigir políticas RLS para colaboradores (mudar de RESTRICTIVE para PERMISSIVE)
DROP POLICY IF EXISTS "Admins and gestores can delete colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Admins and gestores can insert colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Admins and gestores can update colaboradores" ON public.colaboradores;
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

-- Corrigir políticas RLS para negocios
DROP POLICY IF EXISTS "Admins can delete negocios" ON public.negocios;
DROP POLICY IF EXISTS "Admins and gestores can insert negocios" ON public.negocios;
DROP POLICY IF EXISTS "Admins and gestores can update negocios" ON public.negocios;
DROP POLICY IF EXISTS "Authenticated users can view negocios" ON public.negocios;

CREATE POLICY "Authenticated users can view negocios" 
ON public.negocios 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and gestores can insert negocios" 
ON public.negocios 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can update negocios" 
ON public.negocios 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins can delete negocios" 
ON public.negocios 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Corrigir políticas RLS para staging_negocios
DROP POLICY IF EXISTS "Admins can delete staging" ON public.staging_negocios;
DROP POLICY IF EXISTS "Admins and gestores can insert staging" ON public.staging_negocios;
DROP POLICY IF EXISTS "Admins and gestores can update staging" ON public.staging_negocios;
DROP POLICY IF EXISTS "Admins and gestores can view staging" ON public.staging_negocios;
DROP POLICY IF EXISTS "Service role can insert staging" ON public.staging_negocios;

CREATE POLICY "Admins and gestores can view staging" 
ON public.staging_negocios 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can insert staging" 
ON public.staging_negocios 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins and gestores can update staging" 
ON public.staging_negocios 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admins can delete staging" 
ON public.staging_negocios 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert staging" 
ON public.staging_negocios 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Corrigir políticas RLS para user_roles e profiles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Corrigir políticas RLS para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);