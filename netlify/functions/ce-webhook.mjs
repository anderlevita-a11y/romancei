// Webhook do AbacatePay → libera/suspende o robô do distribuidor.
// Cadastre no AbacatePay (Integração → Webhooks → Webhook v2):
//   URL: https://romancei.netlify.app/.netlify/functions/ce-webhook
//   Secret: o mesmo valor de ABACATEPAY_WEBHOOK_SECRET no Netlify (32+ caracteres)
//   Eventos: checkout.completed, subscription.completed, subscription.renewed,
//            subscription.payment_failed, subscription.cancelled
import { json, rpc, seguroIgual, assinaturaValida } from '../lib/ce.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { erro: 'metodo' });
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET || '';
  if (secret.length < 32 || !process.env.SUPABASE_SERVICE_ROLE_KEY) return json(503, { erro: 'nao_configurado' });

  const bruto = await req.text();
  const url = new URL(req.url);
  const recebido = req.headers.get('x-webhook-secret') || url.searchParams.get('webhookSecret');
  if (!seguroIgual(recebido, secret)) return json(401, { erro: 'secret' });
  if (!assinaturaValida(bruto, req.headers.get('x-webhook-signature'))) return json(401, { erro: 'assinatura' });

  let evento;
  try { evento = JSON.parse(bruto); } catch { return json(400, { erro: 'json' }); }
  try {
    const r = await rpc('ce_webhook_aplicar', { p: evento });
    console.log(`ce-webhook ${evento.event} ${evento.id}: ${r}`);
    return json(200, { ok: true, resultado: r });
  } catch (e) {
    console.error('ce-webhook:', e.message);
    return json(500, { erro: 'falha_banco' }); // AbacatePay tenta de novo
  }
};
