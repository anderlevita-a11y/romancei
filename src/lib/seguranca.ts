// =============================================================================
// Segurança: login do admin (Supabase Auth), funções públicas seguras (RPC)
// e sessão do portal da vendedora. Ver supabase/seguranca-etapa1.sql.
// =============================================================================
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient, mapLeadToSupabase, mapReferralCouponFromSupabase, mapReferralCouponToSupabase, mapLeadFromSupabase, mapResellerUserFromSupabase, mapSalesProfileFromSupabase, mapSalesProfileToSupabase, mapResellerDeviceToSupabase } from './supabase';
import type { AdminUser, Lead, ReferralCoupon, ResellerUser, ResellerSalesProfile, ResellerDeviceSubscription } from '../types';

// ---------------------------------------------------------------- ADMIN ------

let cacheAdmin: { uid: string; ok: boolean; em: number } | null = null;

/** Retorna a sessão do Supabase se o usuário logado for administrador. */
export async function sessaoAdmin(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  const s = data.session;
  if (!s) { cacheAdmin = null; return null; }
  if (cacheAdmin && cacheAdmin.uid === s.user.id && Date.now() - cacheAdmin.em < 60_000) return cacheAdmin.ok ? s : null;
  const { data: ok, error } = await client.rpc('is_admin');
  const eAdmin = !error && ok === true;
  cacheAdmin = { uid: s.user.id, ok: eAdmin, em: Date.now() };
  return eAdmin ? s : null;
}

export async function eAdmin(): Promise<boolean> {
  return (await sessaoAdmin()) !== null;
}

export function adminDaSessao(s: Session): AdminUser {
  const meta = (s.user.user_metadata || {}) as Record<string, string>;
  return {
    id: s.user.id,
    name: meta.nome || meta.name || (s.user.email || '').split('@')[0],
    email: s.user.email || '',
    role: 'distribuidor',
    password: '',
    createdAt: s.user.created_at,
  } as AdminUser;
}

export type ResultadoLoginAdmin = { ok: true; usuario: AdminUser } | { ok: false; erro: string };

export async function entrarAdmin(email: string, senha: string): Promise<ResultadoLoginAdmin> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, erro: 'Banco de dados não configurado.' };
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
  if (error || !data.session) {
    const msg = /invalid login|invalid credentials/i.test(error?.message || '')
      ? 'E-mail ou senha incorretos.'
      : /email not confirmed/i.test(error?.message || '')
        ? 'E-mail ainda não confirmado no Supabase.'
        : 'Não foi possível entrar agora. Tente de novo.';
    return { ok: false, erro: msg };
  }
  cacheAdmin = null;
  const s = await sessaoAdmin();
  if (!s) {
    await client.auth.signOut();
    return { ok: false, erro: 'Esta conta não tem acesso de administrador.' };
  }
  return { ok: true, usuario: adminDaSessao(s) };
}

export async function sairAdmin(): Promise<void> {
  cacheAdmin = null;
  const client = getSupabaseClient();
  if (client) await client.auth.signOut().catch(() => {});
  limparCachePrivado();
}

export function aoMudarLoginAdmin(cb: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange(() => { cacheAdmin = null; cb(); });
  return () => data.subscription.unsubscribe();
}

/** Apaga do navegador os dados privados que versões antigas do site guardavam. */
export function limparCachePrivado(): void {
  const chaves = ['leads', 'orders', 'admin_users', 'coupons', 'resellers', 'sales_profiles', 'reseller_devices'];
  for (const prefixo of ['romance_itapema_', 'romance_modaitajai_', 'romance_modas_']) {
    for (const c of chaves) {
      try { localStorage.removeItem(prefixo + c); } catch { /* ignora */ }
    }
  }
}

// ------------------------------------------------------- FUNÇÕES PÚBLICAS -----

export async function enviarLeadPublico(lead: Lead): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.rpc('submit_lead', { p: mapLeadToSupabase(lead) });
  if (error && (error.code === 'PGRST202' || /could not find the function/i.test(error.message))) {
    // Transição: a função ainda não foi criada no banco (etapa 1) — usa o caminho antigo
    const { error: e2 } = await client.from('leads').upsert(mapLeadToSupabase(lead), { onConflict: 'id' });
    return !e2;
  }
  if (error) console.warn('Envio do pré-cadastro falhou:', error.message);
  return !error;
}

export async function salvarCupomPublico(cupom: ReferralCoupon): Promise<ReferralCoupon | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc('coupon_save_public', { p: mapReferralCouponToSupabase(cupom) });
  if (error || !data) { console.warn('Cupom não salvo:', error?.message); return null; }
  return mapReferralCouponFromSupabase(data);
}

export async function consultarCupomPublico(cpf: string): Promise<{ cupom: ReferralCoupon; indicadas: Lead[] } | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc('coupon_lookup', { p_cpf: cpf });
  if (error || !data) return null;
  const r = data as { coupon: unknown; leads: unknown[] };
  return {
    cupom: mapReferralCouponFromSupabase(r.coupon),
    indicadas: (r.leads || []).map((l) => mapLeadFromSupabase(l)),
  };
}

// --------------------------------------------------- PORTAL DA VENDEDORA -----

const CHAVE_TOKEN = 'romance_itapema_reseller_token';

export const tokenVendedora = (): string | null => {
  try { return localStorage.getItem(CHAVE_TOKEN); } catch { return null; }
};
const guardarToken = (t: string | null) => {
  try { if (t) localStorage.setItem(CHAVE_TOKEN, t); else localStorage.removeItem(CHAVE_TOKEN); } catch { /* ignora */ }
};

export type RespostaVendedora = {
  vendedora: ResellerUser;
  perfil: ResellerSalesProfile | null;
  precisaTrocarSenha: boolean;
};

const MENSAGENS: Record<string, string> = {
  login_invalido: 'CPF/telefone ou senha incorretos.',
  precisa_ativar: 'Por segurança, crie uma nova senha na aba "Primeiro Acesso / Ativar" (vamos conferir seu telefone).',
  ja_cadastrada: 'Este CPF já tem cadastro. Use a aba "Entrar".',
  telefone_nao_confere: 'O telefone não confere com o do seu cadastro. Use o mesmo WhatsApp do pré-cadastro ou fale com a distribuidora.',
  senha_curta: 'A senha precisa ter pelo menos 6 caracteres.',
  dados_incompletos: 'Preencha nome, CPF e telefone.',
  sessao_invalida: 'Sua sessão expirou. Entre de novo.',
};

export class ErroVendedora extends Error {}

function traduzir(e: { message?: string } | null): ErroVendedora {
  const m = e?.message || '';
  const chave = Object.keys(MENSAGENS).find((k) => m.includes(k));
  return new ErroVendedora(chave ? MENSAGENS[chave] : 'Não foi possível concluir agora. Tente de novo.');
}

function lerResposta(data: any): RespostaVendedora {
  if (data?.token) guardarToken(data.token);
  return {
    vendedora: mapResellerUserFromSupabase(data.reseller),
    perfil: data.profile ? mapSalesProfileFromSupabase(data.profile) : null,
    precisaTrocarSenha: !!data.must_change_password,
  };
}

export async function verificarCadastroVendedora(id: string): Promise<'vendedora' | 'pre_cadastro' | 'nenhum'> {
  const client = getSupabaseClient();
  if (!client) return 'nenhum';
  const { data } = await client.rpc('reseller_check', { p_id: id });
  return (data as 'vendedora' | 'pre_cadastro' | 'nenhum') || 'nenhum';
}

export async function entrarVendedora(id: string, senha: string): Promise<RespostaVendedora> {
  const client = getSupabaseClient();
  if (!client) throw new ErroVendedora('Banco de dados não configurado.');
  const { data, error } = await client.rpc('reseller_login', { p_id: id, p_password: senha });
  if (error) throw traduzir(error);
  return lerResposta(data);
}

export async function cadastrarVendedora(dados: Partial<ResellerUser> & { cpf: string; fullName: string; phone: string }, senha: string): Promise<RespostaVendedora> {
  const client = getSupabaseClient();
  if (!client) throw new ErroVendedora('Banco de dados não configurado.');
  const p = {
    id: dados.id || `rev-${Date.now()}`,
    full_name: dados.fullName,
    cpf: dados.cpf,
    phone: dados.phone,
    email: dados.email || null,
    city: dados.city || null,
    lead_id: dados.leadId || null,
  };
  const { data, error } = await client.rpc('reseller_register', { p, p_password: senha });
  if (error) throw traduzir(error);
  return lerResposta(data);
}

export async function dadosDaSessaoVendedora(): Promise<RespostaVendedora | null> {
  const token = tokenVendedora();
  const client = getSupabaseClient();
  if (!token || !client) return null;
  const { data, error } = await client.rpc('reseller_me', { p_token: token });
  if (error) { if (/sessao_invalida/.test(error.message)) guardarToken(null); return null; }
  return lerResposta(data);
}

export async function atualizarVendedora(campos: { phone?: string; email?: string; city?: string; deviceAuthorized?: boolean; lastDeviceName?: string; novaSenha?: string }): Promise<ResellerUser> {
  const token = tokenVendedora();
  const client = getSupabaseClient();
  if (!token || !client) throw traduzir({ message: 'sessao_invalida' });
  const p: Record<string, unknown> = {};
  if (campos.phone !== undefined) p.phone = campos.phone;
  if (campos.email !== undefined) p.email = campos.email;
  if (campos.city !== undefined) p.city = campos.city;
  if (campos.deviceAuthorized !== undefined) p.device_authorized = campos.deviceAuthorized;
  if (campos.lastDeviceName !== undefined) p.last_device_name = campos.lastDeviceName;
  if (campos.novaSenha) p.new_password = campos.novaSenha;
  const { data, error } = await client.rpc('reseller_update_self', { p_token: token, p });
  if (error) throw traduzir(error);
  return mapResellerUserFromSupabase(data);
}

export async function salvarPerfilVendedora(perfil: ResellerSalesProfile): Promise<boolean> {
  const token = tokenVendedora();
  const client = getSupabaseClient();
  if (!token || !client) return false;
  const { error } = await client.rpc('reseller_save_profile', { p_token: token, p: mapSalesProfileToSupabase(perfil) });
  if (error) console.warn('Perfil não salvo:', error.message);
  return !error;
}

export async function salvarAparelhoVendedora(aparelho: ResellerDeviceSubscription): Promise<boolean> {
  const token = tokenVendedora();
  const client = getSupabaseClient();
  if (!token || !client) return false;
  const { error } = await client.rpc('reseller_save_device', { p_token: token, p: mapResellerDeviceToSupabase(aparelho) });
  return !error;
}

export async function sairVendedora(): Promise<void> {
  const token = tokenVendedora();
  guardarToken(null);
  const client = getSupabaseClient();
  if (token && client) await client.rpc('reseller_logout', { p_token: token }).then(() => {}, () => {});
}
