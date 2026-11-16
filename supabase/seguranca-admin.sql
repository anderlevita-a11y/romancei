-- ==============================================================================
-- CADASTRAR UM ADMINISTRADOR
-- 1. Supabase → Authentication → Users → "Add user" → "Create new user"
--    (e-mail + senha forte, marque "Auto Confirm User")
-- 2. Troque o e-mail abaixo pelo mesmo e rode aqui no SQL Editor.
-- ==============================================================================
INSERT INTO public.admins (user_id, email, nome)
SELECT id, email, 'Anderson Rodrigues'
  FROM auth.users
 WHERE lower(email) = lower('anderlevita@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- Conferir quem é admin:
SELECT a.email, a.nome, a.created_at FROM public.admins a ORDER BY a.created_at;
