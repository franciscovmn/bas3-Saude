-- ============================================
-- CLINICFLOW SECURITY IMPLEMENTATION
-- Phase 1: Emergency Database Security
-- ============================================

-- 1. CREATE USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. CREATE USER ROLES SYSTEM
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'professional');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'professional',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. CREATE SECURITY DEFINER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_roles.user_id = $1 LIMIT 1;
$$;

-- 4. ADD USER_ID TO TABLES THAT NEED IT
-- ============================================
-- Add user_id to pacientes table
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to consultas table
ALTER TABLE public.consultas 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to fluxo_de_caixa table
ALTER TABLE public.fluxo_de_caixa 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to disponibilidade table
ALTER TABLE public.disponibilidade 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to bloqueios_agenda table
ALTER TABLE public.bloqueios_agenda 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to historico_consultas table
ALTER TABLE public.historico_consultas 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_fidelizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxo_de_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disponibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_consultas ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES FOR PROFILES
-- ============================================
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 7. CREATE RLS POLICIES FOR USER_ROLES
-- ============================================
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 8. CREATE RLS POLICIES FOR PACIENTES
-- ============================================
CREATE POLICY "Users can view their own patients"
ON public.pacientes FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their own patients"
ON public.pacientes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own patients"
ON public.pacientes FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can delete their own patients"
ON public.pacientes FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- 9. CREATE RLS POLICIES FOR CONSULTAS
-- ============================================
CREATE POLICY "Users can view their own consultas"
ON public.consultas FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their own consultas"
ON public.consultas FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own consultas"
ON public.consultas FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can delete their own consultas"
ON public.consultas FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- 10. CREATE RLS POLICIES FOR PLANOS_FIDELIZACAO
-- ============================================
CREATE POLICY "Authenticated users can view planos"
ON public.planos_fidelizacao FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert planos"
ON public.planos_fidelizacao FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update planos"
ON public.planos_fidelizacao FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete planos"
ON public.planos_fidelizacao FOR DELETE
TO authenticated
USING (true);

-- 11. CREATE RLS POLICIES FOR FLUXO_DE_CAIXA
-- ============================================
CREATE POLICY "Users can view their own transactions"
ON public.fluxo_de_caixa FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their own transactions"
ON public.fluxo_de_caixa FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own transactions"
ON public.fluxo_de_caixa FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can delete their own transactions"
ON public.fluxo_de_caixa FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- 12. CREATE RLS POLICIES FOR DISPONIBILIDADE
-- ============================================
CREATE POLICY "Users can view their own availability"
ON public.disponibilidade FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their own availability"
ON public.disponibilidade FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own availability"
ON public.disponibilidade FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can delete their own availability"
ON public.disponibilidade FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- 13. CREATE RLS POLICIES FOR BLOQUEIOS_AGENDA
-- ============================================
CREATE POLICY "Users can view their own bloqueios"
ON public.bloqueios_agenda FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their own bloqueios"
ON public.bloqueios_agenda FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bloqueios"
ON public.bloqueios_agenda FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can delete their own bloqueios"
ON public.bloqueios_agenda FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- 14. CREATE RLS POLICIES FOR CATEGORIAS_DESPESA
-- ============================================
CREATE POLICY "Authenticated users can view categorias"
ON public.categorias_despesa FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert categorias"
ON public.categorias_despesa FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update categorias"
ON public.categorias_despesa FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete categorias"
ON public.categorias_despesa FOR DELETE
TO authenticated
USING (true);

-- 15. CREATE RLS POLICIES FOR HISTORICO_CONSULTAS
-- ============================================
CREATE POLICY "Users can view their own historico"
ON public.historico_consultas FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can insert their own historico"
ON public.historico_consultas FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own historico"
ON public.historico_consultas FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can delete their own historico"
ON public.historico_consultas FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- 16. CREATE TRIGGER FOR AUTO-CREATING PROFILES
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'professional');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 17. CREATE UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();