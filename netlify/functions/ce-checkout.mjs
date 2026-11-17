// Cria o pagamento do Consigna Evolution no AbacatePay para o distribuidor logado no painel.
// POST { token, tipo: 'ativacao' | 'mensalidade', metodo: 'PIX' | 'CARD' }  →  { url }
import { json, rpc, abacate, produto, faltaConfig } from '../lib/ce.mjs';

const SITE = (process.env.URL || 'https://romancei.netlify.app').replace(/\/$/, '');

export default async (req) => {
  if (req.method !== 'POST') return json(405, { erro: 'metodo' });
  const falta = faltaConfig();
  if (falta.length) return json(503, { erro: 'pagamento_nao_configurado', detalhe: `Configure no Netlify: ${falta.join(', ')}` });

  let corpo;
  try { corpo = await req.json(); } catch { return json(400, { erro: 'corpo_invalido' }); }
  const { token, tipo, metodo } = corpo || {};
  if (typeof token !== 'string' || token.length < 20) return json(401, { erro: 'sessao_invalida' });
  if (!['ativacao', 'mensalidade'].includes(tipo)) return json(400, { erro: 'tipo_invalido' });
  if (!['PIX', 'CARD'].includes(metodo)) return json(400, { erro: 'metodo_invalido' });

  let d;
  try { d = await rpc('ce_sessao_info', { p_token: token }); }
  catch (e) { return json(e.sessaoInvalida ? 401 : 500, { erro: e.sessaoInvalida ? 'sessao_invalida' : 'falha_banco' }); }

  if (d.isento) return json(409, { erro: 'isento' });
  if (tipo === 'ativacao' && d.ativacao_paga) return json(409, { erro: 'ativacao_ja_paga' });
  if (tipo === 'mensalidade' && !d.ativacao_paga) return json(409, { erro: 'pague_ativacao_primeiro' });
  if (tipo === 'mensalidade' && d.assinatura_status === 'ACTIVE') return json(409, { erro: 'assinatura_ja_ativa' });

  const sufixo = `${metodo.toLowerCase()}-${Date.now().toString(36)}`;
  const voltar = `${SITE}/painel-evolution.html`;
  try {
    const idProduto = await produto(tipo);
    const r = tipo === 'ativacao'
      ? await abacate('POST', '/checkouts/create', {
          items: [{ id: idProduto, quantity: 1 }],
          methods: [metodo],
          externalId: `ce-ativ-${d.id}-${sufixo}`,
          returnUrl: voltar,
          completionUrl: `${voltar}?pago=ativacao`,
          metadata: { distribuidor: d.id, tipo },
        })
      : await abacate('POST', '/subscriptions/create', {
          items: [{ id: idProduto, quantity: 1 }],
          methods: [metodo],
          externalId: `ce-mens-${d.id}-${sufixo}`,
          returnUrl: voltar,
          completionUrl: `${voltar}?pago=mensalidade`,
          retryPolicy: { maxRetry: 3, retryEvery: 2 },
          metadata: { distribuidor: d.id, tipo },
        });
    return json(200, { url: r.url });
  } catch (e) {
    console.error('ce-checkout:', e.message);
    return json(502, { erro: 'falha_abacatepay' });
  }
};
