# Ativar o Painel Consigna Evolution

Página: **https://romancei.netlify.app/painel-evolution.html** (botão "Painel Consigna Evolution" no rodapé do site).

O distribuidor cria a conta com o WhatsApp pessoal (código de 6 dígitos enviado pelo robô), preenche o
cadastro no próprio painel (o antigo "Formulário para Automação" agora leva para lá) e paga.
**A ativação é automática:** o robô salva o distribuidor, testa o login do Vendas Plus, cria o número na
Evolution e mostra no painel o código de 8 letras para conectar o WhatsApp. Quando conecta, fica "ativo".
A senha do Vendas Plus é trancada no navegador com a chave do robô (`config/painel-chave.pem`):
nem o Supabase nem o administrador conseguem ler. **Faça backup desse arquivo** — sem ele, os
distribuidores precisam salvar a senha de novo.
Na 1ª mensalidade paga, o painel libera um cupom de **R$ 50 de cashback** (CE50-XXXXX) para o Consigna On Demand.
O painel mostra se o robô está ativo, as conversas da semana e do mês, aprovadas e reprovadas,
o cadastro e o plano (ativação R$ 297 + R$ 147/mês, por Pix ou cartão, no AbacatePay).
Quando o pagamento é confirmado, o robô daquele distribuidor é liberado sozinho.

## 1. Banco (Supabase → SQL Editor)
1. Cole o arquivo `supabase/painel-evolution.sql` → **Run**.
2. Rode `SELECT public.ce_gerar_token_robo();` e **copie o resultado** (começa com `ce_robo_`). Ele vai para o robô.
3. Deixe a Romance Itapema isenta de pagamento:
   ```sql
   INSERT INTO public.ce_distribuidores (telefone, nome, instancia, isento)
   VALUES ('5547997626121', 'Romance Itapema', 'romanceitapema', true)
   ON CONFLICT (telefone) DO UPDATE SET isento = true, instancia = 'romanceitapema';
   ```

## 2. Netlify → Site configuration → Environment variables
| Variável | Onde pegar |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → chave **secret / service_role** |
| `ABACATEPAY_API_KEY` | AbacatePay → Integração → Chaves de API (v2). Permissões: PRODUCT:CREATE, PRODUCT:READ, CHECKOUT:CREATE, SUBSCRIPTION:CREATE. Para testar, use a chave `abc_dev_` (Modo Teste) |
| `ABACATEPAY_WEBHOOK_SECRET` | Um texto aleatório de 32+ caracteres (o mesmo do passo 3) |

Depois de salvar: **Deploys → Trigger deploy → Deploy site** (as funções só leem as variáveis num deploy novo).
Os produtos "Consigna Evolution — Ativação" (R$ 297) e "— Mensalidade" (R$ 147/mês) são criados sozinhos no AbacatePay no primeiro pagamento.

## 3. AbacatePay → Integração → Webhooks → Criar webhook (Webhook v2)
- **URL:** `https://romancei.netlify.app/.netlify/functions/ce-webhook`
- **Secret:** o mesmo `ABACATEPAY_WEBHOOK_SECRET`
- **Eventos:** `checkout.completed`, `subscription.completed`, `subscription.renewed`, `subscription.payment_failed`, `subscription.cancelled`

## 4. Robô
No `.env` do robô:
```
PAINEL_ROBO_TOKEN=ce_robo_...          (do passo 1.2)
PAINEL_INSTANCIA_ENVIO=romanceitapema  (número que envia os códigos de acesso)
```
Distribuidores novos entram no painel pelo `./admin.sh novo` (pergunta o WhatsApp do dono).
Para ligar um já cadastrado: `./admin.sh painel <instancia> <whatsapp do dono>`.

## Regras de liberação
- Robô **ativo** = robô ligado + WhatsApp conectado + plano em dia (ou isento).
- Distribuidor **sem pagamento** fica pausado; quem não está no painel continua funcionando como antes.
- Assinatura cancelada (pelo distribuidor ou após 3 cobranças recusadas) pausa o robô no minuto seguinte.
