# Guia de ativação da segurança — Romance Itapema

**Tempo:** uns 15 minutos. **Siga nesta ordem.** Cada passo foi pensado para o site continuar funcionando durante a troca.

## O que muda
| Antes | Depois |
|---|---|
| Qualquer visitante baixava TODOS os pré-cadastros (com CPF), sacolas, cupons, vendedoras e usuários do admin | O visitante só lê configurações, fotos, linhas e depoimentos aprovados |
| Painel admin abria com `admin` / `romance2026` / PIN | Painel só abre com **e-mail e senha do Supabase** de quem está na lista de administradores |
| Senhas guardadas em texto puro (e a troca de senha virava "PIN" público) | Senhas criptografadas no servidor; nenhuma senha fica nas configurações |
| Vendedora entrava com `123` em qualquer conta | Senha conferida no servidor; contas antigas com `123` precisam criar senha nova confirmando o telefone |
| Firestore aberto com CPF e senha das vendedoras | Firestore sem dados pessoais e coleções sensíveis bloqueadas |

---

## Passo 1 — Criar o seu login de administrador (Supabase)
1. Abra **supabase.com/dashboard** → projeto do site → **Authentication → Users**.
2. **Add user → Create new user**: seu e-mail (`anderlevita@gmail.com`) e uma **senha forte** (12+ caracteres). Marque **Auto Confirm User**.
3. Em **Authentication → Sign In / Providers → Email**, **desative "Allow new users to sign up"** (ninguém de fora cria conta).

## Passo 2 — Rodar a ETAPA 1 (não quebra nada)
**SQL Editor → New query** → cole todo o arquivo `seguranca-etapa1.sql` → **Run**.

## Passo 3 — Dizer quem é administrador
Ainda no SQL Editor: cole `seguranca-admin.sql` (já está com o seu e-mail) → **Run**. O resultado deve listar o seu e-mail.

## Passo 4 — Publicar o site novo
Me avise que eu publico. Daqui em diante:
- Painel: entre com **e-mail + senha do Passo 1**.
- A biometria continua funcionando depois do primeiro login com senha no aparelho.

**Teste agora**, antes do passo 5:
- [ ] Entrar no painel com o e-mail e a senha nova
- [ ] Fazer um pré-cadastro de teste pelo site (aba anônima) e ver se aparece no painel
- [ ] Entrar no Portal da Vendedora com uma conta de teste

## Passo 5 — Rodar a ETAPA 2 (fecha o banco)
SQL Editor → cole `seguranca-etapa2.sql` → **Run**.
A partir daqui o banco só entrega dados privados ao administrador logado.

## Passo 6 — Fechar o Firestore (Firebase)
**console.firebase.google.com** → projeto → **Firestore → Regras** → cole o conteúdo de `firestore.rules` (na raiz do projeto) → **Publicar**.
Depois, em **Firestore → Dados**, apague as coleções antigas `leads`, `orders`, `admin_users` e `settings` (o site não usa mais).

---

## Como fica para as vendedoras
- Quem já criou senha própria: entra normalmente.
- Quem ainda usava `123`: vê o aviso *"crie uma nova senha na aba Primeiro Acesso"*. Lá informa nome, CPF e **o mesmo WhatsApp do cadastro**; o sistema confere o telefone e cria a senha nova (mínimo 6 caracteres).
- Se o telefone mudou: a distribuidora atualiza o telefone da vendedora no painel (aba Vendedoras) e ela tenta de novo.

## Novos administradores
1. Supabase → Authentication → Users → **Add user** (e-mail + senha, Auto Confirm).
2. Abra `seguranca-admin.sql`, troque o e-mail e o nome, rode no SQL Editor.

## Se algo der errado
- **Não consigo entrar no painel:** confira o Passo 3 (o e-mail tem que estar na lista de admins) e se o usuário está confirmado no Supabase.
- **Pré-cadastros pararam de chegar:** confira se a Etapa 1 foi rodada (o site tem um caminho de transição, mas depois da Etapa 2 só a função segura funciona).
- **Voltar atrás (emergência):** rodar no SQL Editor
  ```sql
  -- reabre o acesso como era antes (use só em emergência e me chame)
  DO $$ DECLARE t text; BEGIN
    FOREACH t IN ARRAY ARRAY['leads','consignment_orders','admin_users','business_settings','media_items','commercial_lines','testimonials','referral_coupons','reseller_users','reseller_sales_profiles','reseller_devices','automacao_cadastros'] LOOP
      EXECUTE format('CREATE POLICY "emergencia acesso completo" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP; END $$;
  ```

## O que ainda vale melhorar depois
- **Fotos/arquivos (Storage do Supabase):** conferir se o bucket permite que qualquer um envie ou apague arquivos.
- **Chaves antigas:** os dados já baixados por visitantes antes desta correção podem estar em cópias antigas de navegadores. Não há como recolher isso, mas a partir de agora nada novo sai.
- **LGPD:** como CPFs ficaram expostos, avalie com um advogado se é caso de comunicar a ANPD e os titulares.
