// Utilitários das funções do Consigna Evolution (AbacatePay + Supabase)
import crypto from 'node:crypto';

export const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://bminunltftkmfmsnjpea.supabase.co').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ABACATE_URL = 'https://api.abacatepay.com/v2';
const ABACATE_KEY = process.env.ABACATEPAY_API_KEY || '';

// Preços (centavos). Para mudar, troque aqui ou nas variáveis do Netlify.
export const PRECO_ATIVACAO = Number(process.env.CE_PRECO_ATIVACAO || 29700);
export const PRECO_MENSAL = Number(process.env.CE_PRECO_MENSAL || 14700);

// Chave pública fixa do AbacatePay para validar X-Webhook-Signature (docs: "Segurança dos webhooks")
const ABACATEPAY_PUBLIC_KEY =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9';

export const json = (status, obj) => new Response(JSON.stringify(obj), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

export function faltaConfig() {
  const f = [];
  if (!SERVICE_KEY) f.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!ABACATE_KEY) f.push('ABACATEPAY_API_KEY');
  return f;
}

export async function rpc(nome, args) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nome}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify(args),
  });
  const txt = await r.text();
  if (!r.ok) {
    const e = new Error(`supabase ${nome} ${r.status}: ${txt.slice(0, 200)}`);
    e.sessaoInvalida = /sessao_invalida/.test(txt);
    throw e;
  }
  return txt ? JSON.parse(txt) : null;
}

export async function abacate(metodo, caminho, corpo) {
  const r = await fetch(`${ABACATE_URL}${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ABACATE_KEY}` },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const txt = await r.text();
  let j; try { j = JSON.parse(txt); } catch { j = { error: txt }; }
  if (!r.ok || j.success === false) throw new Error(`AbacatePay ${caminho} ${r.status}: ${String(j.error || txt).slice(0, 200)}`);
  return j.data;
}

// Produtos: usa o ID das variáveis do Netlify; se não houver, procura/cria pelo externalId
const cacheProdutos = {};
export async function produto(tipo) {
  const env = tipo === 'ativacao' ? process.env.ABACATEPAY_PRODUTO_ATIVACAO : process.env.ABACATEPAY_PRODUTO_MENSAL;
  if (env) return env;
  if (cacheProdutos[tipo]) return cacheProdutos[tipo];
  const ext = tipo === 'ativacao' ? 'consigna-evolution-ativacao' : 'consigna-evolution-mensal';
  const lista = await abacate('GET', `/products/list?externalId=${ext}&status=ACTIVE`);
  let p = (lista || []).find((x) => x.externalId === ext);
  if (!p) {
    p = await abacate('POST', '/products/create', tipo === 'ativacao'
      ? { externalId: ext, name: 'Consigna Evolution — Ativação', price: PRECO_ATIVACAO, currency: 'BRL',
          description: 'Configuração e ativação do robô de análise de crédito no WhatsApp (pagamento único).' }
      : { externalId: ext, name: 'Consigna Evolution — Mensalidade', price: PRECO_MENSAL, currency: 'BRL', cycle: 'MONTHLY',
          description: 'Robô de análise de crédito no WhatsApp, 1 número. Sem fidelidade.' });
  }
  cacheProdutos[tipo] = p.id;
  return p.id;
}

export function seguroIgual(a, b) {
  const A = Buffer.from(String(a || '')), B = Buffer.from(String(b || ''));
  return A.length === B.length && A.length > 0 && crypto.timingSafeEqual(A, B);
}

export function assinaturaValida(corpoBruto, assinatura) {
  if (!assinatura) return false;
  const esperado = crypto.createHmac('sha256', ABACATEPAY_PUBLIC_KEY).update(corpoBruto).digest('base64');
  return seguroIgual(esperado, assinatura);
}
