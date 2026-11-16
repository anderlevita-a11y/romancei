-- ==============================================================================
-- CORRIGIR LOGIN DO ADMINISTRADOR
-- Cole tudo no SQL Editor → Run. Pode rodar quantas vezes quiser.
-- ==============================================================================

-- 1. Confirma o e-mail (sem isso o Supabase recusa o login)
UPDATE auth.users
   SET email_confirmed_at = COALESCE(email_confirmed_at, now())
 WHERE lower(email) = lower('anderlevita@gmail.com');

-- 2. Dá acesso de administrador a essa conta
INSERT INTO public.admins (user_id, email, nome)
SELECT id, email, 'Anderson Rodrigues'
  FROM auth.users
 WHERE lower(email) = lower('anderlevita@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Resultado: deve aparecer 1 linha com confirmado = true e admin = true
SELECT u.email,
       u.email_confirmed_at IS NOT NULL AS confirmado,
       a.user_id IS NOT NULL            AS admin
  FROM auth.users u
  LEFT JOIN public.admins a ON a.user_id = u.id
 ORDER BY u.created_at;
