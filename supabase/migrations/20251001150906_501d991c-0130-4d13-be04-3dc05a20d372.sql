-- ============================================
-- FIX SECURITY LINTER ISSUES
-- ============================================

-- 1. FIX FUNCTION SEARCH PATH (handle_updated_at)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. ENABLE RLS ON N8N TABLES
-- ============================================
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_fila_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_historico_mensagens ENABLE ROW LEVEL SECURITY;

-- 3. CREATE RLS POLICIES FOR N8N TABLES (Admin only access)
-- ============================================
-- n8n_chat_histories policies
CREATE POLICY "Admins can view n8n chat histories"
ON public.n8n_chat_histories FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert n8n chat histories"
ON public.n8n_chat_histories FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update n8n chat histories"
ON public.n8n_chat_histories FOR UPDATE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete n8n chat histories"
ON public.n8n_chat_histories FOR DELETE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- n8n_fila_mensagens policies
CREATE POLICY "Admins can view n8n fila mensagens"
ON public.n8n_fila_mensagens FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert n8n fila mensagens"
ON public.n8n_fila_mensagens FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update n8n fila mensagens"
ON public.n8n_fila_mensagens FOR UPDATE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete n8n fila mensagens"
ON public.n8n_fila_mensagens FOR DELETE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- n8n_historico_mensagens policies
CREATE POLICY "Admins can view n8n historico mensagens"
ON public.n8n_historico_mensagens FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert n8n historico mensagens"
ON public.n8n_historico_mensagens FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update n8n historico mensagens"
ON public.n8n_historico_mensagens FOR UPDATE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete n8n historico mensagens"
ON public.n8n_historico_mensagens FOR DELETE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');