import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lead, ConsignmentOrder, BusinessSettings, AdminUser, MediaItem, TestimonialItem, CommercialLine, ReferralCoupon, ResellerUser, ResellerSalesProfile } from '../types';

export const DEFAULT_SUPABASE_URL = 'https://bminunltftkmfmsnjpea.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_R0re_YsLe2GIIuB-bxJZVg_WyNWTyBZ';

/**
 * Sanitiza e normaliza a URL do Supabase para evitar erros quando
 * o usuário cola caminhos como /rest/v1/ ou barras no final.
 */
export const normalizeSupabaseUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/, '');
  return url;
};

// Lê do localStorage ou das variáveis de ambiente com fallback para o projeto padrão
export const getSupabaseConfig = () => {
  let storedUrl = '';
  let storedKey = '';

  try {
    const localSettings = localStorage.getItem('romance_itapema_settings') || localStorage.getItem('romance_modaitajai_settings') || localStorage.getItem('romance_modas_settings_v3');
    if (localSettings) {
      const parsed = JSON.parse(localSettings);
      // Migrate from old dead/deprecated Supabase instances if stored in cache
      if (parsed.supabaseUrl === 'https://sojvyojpvdlwmokkqpbf.supabase.co') {
        storedUrl = DEFAULT_SUPABASE_URL;
        storedKey = DEFAULT_SUPABASE_ANON_KEY;
      } else {
        storedUrl = parsed.supabaseUrl || '';
        storedKey = parsed.supabaseAnonKey || '';
      }
    }
  } catch (e) {
    // Ignora erro de parsing
  }

  const rawUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || storedUrl || DEFAULT_SUPABASE_URL;
  const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || storedKey || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url: normalizeSupabaseUrl(rawUrl),
    key: (rawKey || '').trim(),
  };
};

let cachedClient: SupabaseClient | null = null;
let lastClientKey = '';

export const getSupabaseClient = (customUrl?: string, customKey?: string): SupabaseClient | null => {
  const normUrl = customUrl ? normalizeSupabaseUrl(customUrl) : getSupabaseConfig().url;
  const normKey = customKey ? customKey.trim() : getSupabaseConfig().key;

  if (!normUrl || !normKey) {
    return null;
  }

  const currentKey = `${normUrl}:::${normKey}`;
  if (cachedClient && lastClientKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(normUrl, normKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastClientKey = currentKey;
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
};

/**
 * Testa a conexão direta com o projeto Supabase informado
 */
export const testSupabaseConnection = async (url: string, key: string): Promise<{ success: boolean; message: string }> => {
  const normUrl = normalizeSupabaseUrl(url);
  const normKey = (key || '').trim();

  if (!normUrl || !normKey) {
    return { success: false, message: 'URL do Projeto e Chave Anônima (anon key) são obrigatórias.' };
  }

  try {
    const testClient = createClient(normUrl, normKey);
    // Tenta uma consulta simples na tabela de settings ou leads
    const { error } = await testClient.from('business_settings').select('id').limit(1);

    if (error) {
      // Se a tabela ainda não existe, avisa que a conexão autenticou mas precisa rodar o SQL
      if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('relation "public.business_settings" does not exist')) {
        return { 
          success: true, 
          message: 'Conectado com sucesso ao Supabase! Para ativar o armazenamento, execute o script SQL no SQL Editor do seu painel Supabase.' 
        };
      }
      return { success: false, message: `Erro ao conectar: ${error.message}` };
    }

    return { success: true, message: 'Conexão com o Supabase (PostgreSQL) estabelecida e validada com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Falha na conexão: ${err.message || 'Verifique as credenciais.'}` };
  }
};

/**
 * Utilitário resiliente para upsert com remoção automática de colunas inexistentes no schema cache (PGRST204)
 * Evita quebras quando a tabela no Supabase do usuário foi criada com um schema anterior ou sem alguma coluna opcional
 */
export async function resilientUpsert(
  client: any,
  tableName: string,
  payloads: Record<string, any> | Record<string, any>[],
  onConflict = 'id'
): Promise<{ data: any; error: any }> {
  const isArray = Array.isArray(payloads);
  let currentPayloads: Record<string, any>[] = isArray
    ? (payloads as Record<string, any>[]).map((p) => ({ ...p }))
    : [{ ...(payloads as Record<string, any>) }];

  let maxAttempts = 15;
  let lastError: any = null;

  while (maxAttempts > 0) {
    maxAttempts--;
    const payloadToSend = isArray ? currentPayloads : currentPayloads[0];
    
    let data: any = null;
    let error: any = null;

    try {
      // Tenta upsert com select
      const result = await client.from(tableName).upsert(payloadToSend, { onConflict }).select('id');
      data = result.data;
      error = result.error;
    } catch (fetchErr: any) {
      // Falha de rede / offline / iframe sandbox / CORS
      console.warn(`[Supabase Network/Fetch] Erro de conexão com Supabase na tabela '${tableName}':`, fetchErr?.message || fetchErr);
      return { data: null, error: { message: fetchErr?.message || 'Failed to fetch', isNetworkError: true } };
    }

    if (!error) {
      return { data, error: null };
    }

    // Se falhar no select, tenta upsert puro
    if (error && error.message && error.message.includes('permission denied for table') === false) {
      try {
        const fallbackResult = await client.from(tableName).upsert(payloadToSend, { onConflict });
        if (!fallbackResult.error) {
          return { data: [{ id: isArray ? 'multiple' : (payloadToSend as any).id }], error: null };
        }
        error = fallbackResult.error;
      } catch (fallbackErr: any) {
        return { data: null, error: { message: fallbackErr?.message || 'Failed to fetch', isNetworkError: true } };
      }
    }

    lastError = error;

    // Detecta se o erro é de rede / conexão / offline / CORS / Failed to fetch
    const errStr = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`;
    const isNetworkError = 
      error?.isNetworkError ||
      errStr.includes('Failed to fetch') ||
      errStr.includes('NetworkError') ||
      errStr.includes('fetch failed') ||
      errStr.includes('Load failed') ||
      errStr.includes('AbortError') ||
      errStr.includes('net::');

    if (isNetworkError) {
      return { data: null, error: { message: error?.message || 'Failed to fetch', isNetworkError: true } };
    }

    // Detecta se o erro é de coluna inexistente (PGRST204 ou código PostgreSQL 42703)
    const missingMatch = 
      errStr.match(/Could not find the ['"]([^'"]+)['"] column/i) ||
      errStr.match(/column ['"]([^'"]+)['"] of relation/i) ||
      errStr.match(/column ['"]([^'"]+)['"] does not exist/i) ||
      errStr.match(/column ([a-zA-Z0-9_]+) does not exist/i) ||
      (error?.code === 'PGRST204' && errStr.match(/['"]([^'"]+)['"]/i));

    const missingColumn = missingMatch ? missingMatch[1] : null;

    if (missingColumn) {
      console.warn(`[Supabase Auto-Prune] Removendo coluna '${missingColumn}' da tabela '${tableName}' para compatibilidade.`);
      currentPayloads.forEach((p) => {
        delete p[missingColumn];
      });
      continue;
    }

    // Detecta se o erro é violação de constraint NOT NULL (código 23502)
    const notNullMatch = 
      errStr.match(/null value in column ['"]([^'"]+)['"] of relation/i) ||
      errStr.match(/null value in column ['"]([^'"]+)['"] violates not-null constraint/i) ||
      (error?.code === '23502' && errStr.match(/column ['"]([^'"]+)['"]/i));

    if (notNullMatch) {
      const nullCol = notNullMatch[1];
      console.warn(`[Supabase Auto-Heal] Preenchendo coluna '${nullCol}' com valor padrão para satisfazer NOT NULL na tabela '${tableName}'.`);
      currentPayloads.forEach((p) => {
        if (nullCol === 'media_type' || nullCol === 'type') {
          p[nullCol] = p.type || p.media_type || 'photo';
        } else if (nullCol === 'category_label' || nullCol === 'categoryLabel') {
          p[nullCol] = p.category_label || p.categoryLabel || 'Geral';
        } else if (nullCol === 'category') {
          p[nullCol] = p.category || 'novidades';
        } else if (nullCol === 'media_url' || nullCol === 'url') {
          p[nullCol] = p.media_url || p.url || '';
        } else if (nullCol === 'order_index' || nullCol === 'order') {
          p[nullCol] = Number(p.order_index ?? p.order ?? 0);
        } else if (nullCol === 'status') {
          p[nullCol] = p.status || 'ativo';
        } else if (nullCol === 'created_at') {
          p[nullCol] = p.created_at || new Date().toISOString();
        } else if (nullCol === 'title' || nullCol === 'name') {
          p[nullCol] = p.title || p.name || 'Item';
        } else if (nullCol === 'badge_color') {
          p[nullCol] = p.badge_color || 'rose';
        } else if (nullCol === 'link_text') {
          p[nullCol] = p.link_text || 'Quero no Meu Mostruário';
        } else if (nullCol === 'link_action') {
          p[nullCol] = p.link_action || 'form';
        } else if (typeof p[nullCol] === 'undefined' || p[nullCol] === null) {
          p[nullCol] = '';
        }
      });
      continue;
    }

    // Se for outro erro não recuperável por remoção de coluna, interrompe
    break;
  }

  return { data: null, error: lastError };
}

/**
 * Mapeamentos e Métodos para LEADS (Pré-cadastros)
 * Compatível com múltiplos esquemas de colunas (full_name / name, phone / whatsapp)
 */
export const mapLeadToSupabase = (lead: Lead) => ({
  id: lead.id,
  full_name: lead.fullName,
  name: lead.fullName,
  cpf: lead.cpf,
  birth_date: lead.birthDate,
  phone: lead.phone,
  whatsapp: lead.phone,
  city: lead.city,
  neighborhood: lead.neighborhood || null,
  wants_favorita_40: lead.wantsFavorita40 || 'sim',
  has_experience: lead.hasExperience || 'nao',
  experience: lead.hasExperience || 'nao',
  preferred_contact: 'whatsapp',
  status: lead.status || 'novo',
  notes: lead.notes ? (typeof lead.notes === 'string' ? lead.notes : JSON.stringify(lead.notes)) : null,
  protocol: lead.protocol,
  referral_coupon_code: lead.referralCouponCode || null,
  terms_accepted: lead.termsAccepted ?? true,
  created_at: lead.createdAt || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const mapLeadFromSupabase = (data: any): Lead => {
  let parsedNotes = [];
  if (data.notes) {
    try {
      parsedNotes = typeof data.notes === 'string' ? JSON.parse(data.notes) : data.notes;
    } catch {
      parsedNotes = typeof data.notes === 'string' ? [{ id: 'note-1', author: 'Distribuição', text: data.notes, createdAt: data.created_at || new Date().toISOString() }] : [];
    }
  }

  return {
    id: data.id,
    fullName: data.full_name || data.name || 'Revendedora',
    cpf: data.cpf || '',
    birthDate: data.birth_date || '',
    phone: data.phone || data.whatsapp || '',
    city: data.city || 'Itajaí - SC',
    neighborhood: data.neighborhood || undefined,
    wantsFavorita40: (data.wants_favorita_40 || 'sim') as any,
    hasExperience: (data.has_experience || data.experience || 'nao') as any,
    status: (data.status || 'novo').toLowerCase() as any,
    notes: Array.isArray(parsedNotes) ? parsedNotes : [],
    protocol: data.protocol || `ROM-${String(data.id || '').slice(-4)}`,
    consentLgpd: true,
    termsAccepted: data.terms_accepted ?? true,
    referralCouponCode: data.referral_coupon_code || undefined,
    createdAt: data.created_at || new Date().toISOString(),
  };
};

export const syncLeadToSupabase = async (lead: Lead, customUrl?: string, customKey?: string): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;

  try {
    const payload = mapLeadToSupabase(lead);
    const { error } = await resilientUpsert(client, 'leads', payload, 'id');
    if (error) {
      console.warn('Erro ao sincronizar lead no Supabase:', error.message || error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Erro na chamada Supabase syncLead:', e);
    return false;
  }
};

export const fetchLeadsFromSupabase = async (customUrl?: string, customKey?: string): Promise<Lead[] | null> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao buscar leads do Supabase:', error.message);
      return null;
    }

    return (data || []).map(mapLeadFromSupabase);
  } catch (e) {
    console.error('Erro na chamada fetchLeadsFromSupabase:', e);
    return null;
  }
};

export const deleteLeadFromSupabase = async (leadId: string, customUrl?: string, customKey?: string): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;
  try {
    const { error } = await client.from('leads').delete().eq('id', leadId);
    return !error;
  } catch {
    return false;
  }
};

export const syncAllLeadsToSupabase = async (leads: Lead[], customUrl?: string, customKey?: string): Promise<number> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client || leads.length === 0) return 0;

  try {
    const payloads = leads.map(mapLeadToSupabase);
    const { data, error } = await resilientUpsert(client, 'leads', payloads, 'id');
    if (error) {
      if (!error.isNetworkError) {
        console.warn('Aviso batch sync leads:', error.message || error);
      }
      return 0;
    }
    return data?.length || 0;
  } catch (e) {
    console.warn('Aviso ao sincronizar todos os leads:', e);
    return 0;
  }
};

/**
 * Mapeamentos e Métodos para ORDENS / SACOLAS CONSIGNADAS
 * Compatível com múltiplos esquemas de colunas (kit_amount / kit_value, reseller_phone / reseller_whatsapp, amount_sold / sold_amount)
 */
export const mapOrderToSupabase = (order: ConsignmentOrder) => ({
  id: order.id,
  code: order.code || `SAC-${Date.now().toString().slice(-4)}`,
  lead_id: order.leadId || null,
  reseller_name: order.resellerName,
  reseller_phone: order.resellerPhone,
  reseller_whatsapp: order.resellerPhone,
  reseller_cpf: order.resellerCpf || null,
  reseller_city: order.resellerCity || null,
  kit_amount: order.kitAmount || 0,
  kit_value: order.kitAmount || 0,
  favorita_amount: order.favoritaAmount || 0,
  total_consigned: order.totalConsigned || 0,
  commission_rate: order.commissionRate || 0.30,
  delivery_date: order.deliveryDate || new Date().toISOString(),
  due_date: order.dueDate || null,
  settlement_date: order.settlementDate || null,
  status: order.status || 'ativo',
  sold_amount: order.soldAmount ?? null,
  amount_sold: order.soldAmount ?? null,
  returned_amount: order.returnedAmount ?? null,
  amount_returned: order.returnedAmount ?? null,
  reseller_profit: order.resellerProfit ?? null,
  net_company_amount: order.netCompanyAmount ?? null,
  settlement_notes: order.settlementNotes || null,
  notes: order.settlementNotes || null,
  created_at: order.deliveryDate || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const mapOrderFromSupabase = (data: any): ConsignmentOrder => ({
  id: data.id,
  code: data.code || `SAC-${String(data.id).slice(-4)}`,
  leadId: data.lead_id || 'manual',
  resellerName: data.reseller_name || 'Revendedora',
  resellerPhone: data.reseller_phone || data.reseller_whatsapp || '',
  resellerCpf: data.reseller_cpf || '',
  resellerCity: data.reseller_city || 'Itajaí - SC',
  kitAmount: Number(data.kit_amount ?? data.kit_value) || 0,
  favoritaAmount: Number(data.favorita_amount) || 0,
  totalConsigned: Number(data.total_consigned) || (Number(data.kit_amount ?? data.kit_value) || 0) + (Number(data.favorita_amount) || 0),
  commissionRate: (Number(data.commission_rate) === 0.40 || Number(data.commission_rate) === 40 ? 0.40 : 0.30),
  deliveryDate: data.delivery_date || data.created_at || new Date().toISOString(),
  dueDate: data.due_date || data.settlement_date || new Date().toISOString(),
  status: (data.status as any) || 'ativo',
  settlementDate: data.settlement_date || undefined,
  soldAmount: data.sold_amount !== null && data.sold_amount !== undefined ? Number(data.sold_amount) : (data.amount_sold !== null && data.amount_sold !== undefined ? Number(data.amount_sold) : undefined),
  returnedAmount: data.returned_amount !== null && data.returned_amount !== undefined ? Number(data.returned_amount) : (data.amount_returned !== null && data.amount_returned !== undefined ? Number(data.amount_returned) : undefined),
  resellerProfit: data.reseller_profit !== null && data.reseller_profit !== undefined ? Number(data.reseller_profit) : undefined,
  netCompanyAmount: data.net_company_amount !== null && data.net_company_amount !== undefined ? Number(data.net_company_amount) : undefined,
  settlementNotes: data.settlement_notes || data.notes || undefined,
});

export const syncOrderToSupabase = async (order: ConsignmentOrder, customUrl?: string, customKey?: string): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;

  try {
    const payload = mapOrderToSupabase(order);
    const { error } = await resilientUpsert(client, 'consignment_orders', payload, 'id');
    if (error) {
      console.warn('Erro ao salvar consignment_order no Supabase:', error.message || error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Erro em syncOrderToSupabase:', e);
    return false;
  }
};

export const fetchOrdersFromSupabase = async (customUrl?: string, customKey?: string): Promise<ConsignmentOrder[] | null> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('consignment_orders')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.warn('Erro ao buscar ordens no Supabase:', error.message);
      return null;
    }

    return (data || []).map(mapOrderFromSupabase);
  } catch (e) {
    console.error('Erro em fetchOrdersFromSupabase:', e);
    return null;
  }
};

export const deleteOrderFromSupabase = async (orderId: string, customUrl?: string, customKey?: string): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;
  try {
    const { error } = await client.from('consignment_orders').delete().eq('id', orderId);
    return !error;
  } catch {
    return false;
  }
};

/**
 * Salva ou atualiza configurações da distribuidora no Supabase
 */
export const syncSettingsToSupabase = async (settings: BusinessSettings, customUrl?: string, customKey?: string): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;

  try {
    const payload = {
      id: 'current_settings',
      business_name: settings.businessName,
      distributor_name: settings.distributorName,
      brand_subtitle: settings.brandSubtitle,
      official_whatsapp: settings.officialWhatsApp,
      display_whatsapp: settings.displayWhatsApp,
      instagram_handle: settings.instagramHandle,
      city_region: settings.cityRegion,
      cycle_days: settings.cycleDays,
      base_commission: settings.baseCommission,
      max_commission: settings.maxCommission,
      favorita_min_order: settings.favoritaMinOrder,
      favorita_max_first_order: settings.favoritaMaxFirstOrder,
      catalogo_favorita_url: settings.catalogoFavoritaUrl,
      loja_fisica_whatsapp: settings.lojaFisicaWhatsApp,
      loja_fisica_display_whatsapp: settings.lojaFisicaDisplayWhatsApp,
      loja_fisica_vendedora: settings.lojaFisicaVendedora,
      loja_fisica_maps_url: settings.lojaFisicaMapsUrl,
      loja_fisica_endereco: settings.lojaFisicaEndereco,
      google_reviews_url: settings.googleReviewsUrl,
      loja_joinville_vendedora: settings.lojaJoinvilleVendedora,
      loja_joinville_whatsapp: settings.lojaJoinvilleWhatsApp,
      loja_joinville_display_whatsapp: settings.lojaJoinvilleDisplayWhatsApp,
      loja_florianopolis_vendedora: settings.lojaFlorianopolisVendedora,
      loja_florianopolis_whatsapp: settings.lojaFlorianopolisWhatsApp,
      loja_florianopolis_display_whatsapp: settings.lojaFlorianopolisDisplayWhatsApp,
      admin_pin: settings.adminPin,
      hero_banner_url: settings.heroBannerUrl || null,
      logo_url: settings.logoUrl || null,
      welcome_template: settings.welcomeTemplate,
      kit_ready_template: settings.kitReadyTemplate,
      settlement_reminder_template: settings.settlementReminderTemplate,
      lead_rejected_template: settings.leadRejectedTemplate || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await resilientUpsert(client, 'business_settings', payload, 'id');

    if (error) {
      console.warn('Erro ao salvar settings no Supabase:', error.message || error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Erro em syncSettingsToSupabase:', e);
    return false;
  }
};

export const fetchSettingsFromSupabase = async (customUrl?: string, customKey?: string): Promise<Partial<BusinessSettings> | null> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return null;

  try {
    const { data, error } = await client.from('business_settings').select('*').limit(1);
    if (error || !data || data.length === 0) return null;

    const row = data[0];

    return {
      businessName: row.business_name !== undefined ? (row.business_name || undefined) : undefined,
      distributorName: row.distributor_name !== undefined ? (row.distributor_name || undefined) : undefined,
      brandSubtitle: row.brand_subtitle !== undefined ? (row.brand_subtitle || undefined) : undefined,
      officialWhatsApp: row.official_whatsapp !== undefined ? (row.official_whatsapp || undefined) : undefined,
      displayWhatsApp: row.display_whatsapp !== undefined ? (row.display_whatsapp || undefined) : undefined,
      instagramHandle: row.instagram_handle !== undefined ? (row.instagram_handle || undefined) : undefined,
      cityRegion: row.city_region !== undefined ? (row.city_region || undefined) : undefined,
      cycleDays: row.cycle_days ? Number(row.cycle_days) : undefined,
      baseCommission: row.base_commission ? Number(row.base_commission) : undefined,
      maxCommission: row.max_commission ? Number(row.max_commission) : undefined,
      favoritaMinOrder: row.favorita_min_order ? Number(row.favorita_min_order) : undefined,
      favoritaMaxFirstOrder: row.favorita_max_first_order ? Number(row.favorita_max_first_order) : undefined,
      catalogoFavoritaUrl: row.catalogo_favorita_url !== undefined ? (row.catalogo_favorita_url ?? '') : undefined,
      lojaFisicaWhatsApp: row.loja_fisica_whatsapp !== undefined ? (row.loja_fisica_whatsapp ?? '') : undefined,
      lojaFisicaDisplayWhatsApp: row.loja_fisica_display_whatsapp !== undefined ? (row.loja_fisica_display_whatsapp ?? '') : undefined,
      lojaFisicaVendedora: row.loja_fisica_vendedora !== undefined ? (row.loja_fisica_vendedora ?? '') : undefined,
      lojaFisicaMapsUrl: row.loja_fisica_maps_url !== undefined ? (row.loja_fisica_maps_url ?? '') : undefined,
      lojaFisicaEndereco: row.loja_fisica_endereco !== undefined ? (row.loja_fisica_endereco ?? '') : undefined,
      googleReviewsUrl: row.google_reviews_url !== undefined ? (row.google_reviews_url ?? '') : undefined,
      lojaJoinvilleVendedora: row.loja_joinville_vendedora !== undefined ? (row.loja_joinville_vendedora ?? '') : undefined,
      lojaJoinvilleWhatsApp: row.loja_joinville_whatsapp !== undefined ? (row.loja_joinville_whatsapp ?? '') : undefined,
      lojaJoinvilleDisplayWhatsApp: row.loja_joinville_display_whatsapp !== undefined ? (row.loja_joinville_display_whatsapp ?? '') : undefined,
      lojaFlorianopolisVendedora: row.loja_florianopolis_vendedora !== undefined ? (row.loja_florianopolis_vendedora ?? '') : undefined,
      lojaFlorianopolisWhatsApp: row.loja_florianopolis_whatsapp !== undefined ? (row.loja_florianopolis_whatsapp ?? '') : undefined,
      lojaFlorianopolisDisplayWhatsApp: row.loja_florianopolis_display_whatsapp !== undefined ? (row.loja_florianopolis_display_whatsapp ?? '') : undefined,
      adminPin: row.admin_pin !== undefined ? (row.admin_pin || undefined) : undefined,
      heroBannerUrl: row.hero_banner_url !== undefined ? (row.hero_banner_url || undefined) : undefined,
      logoUrl: row.logo_url !== undefined ? (row.logo_url || undefined) : undefined,
      welcomeTemplate: row.welcome_template !== undefined ? (row.welcome_template || undefined) : undefined,
      kitReadyTemplate: row.kit_ready_template !== undefined ? (row.kit_ready_template || undefined) : undefined,
      settlementReminderTemplate: row.settlement_reminder_template !== undefined ? (row.settlement_reminder_template || undefined) : undefined,
      leadRejectedTemplate: row.lead_rejected_template !== undefined ? (row.lead_rejected_template || undefined) : undefined,
    };
  } catch {
    return null;
  }
};

/**
 * Sincroniza Administradores com Supabase
 */
export const syncAdminUserToSupabase = async (user: AdminUser, customUrl?: string, customKey?: string): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;

  try {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      role: user.role,
      password: user.password,
      phone: user.phone || null,
      created_at: user.createdAt || new Date().toISOString(),
      is_default_test: Boolean(user.isDefaultTest),
    };

    const { error } = await resilientUpsert(client, 'admin_users', payload, 'id');

    if (error) {
      console.warn('Erro ao salvar admin_user no Supabase:', error.message || error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Erro em syncAdminUserToSupabase:', e);
    return false;
  }
};

export const fetchAdminUsersFromSupabase = async (customUrl?: string, customKey?: string): Promise<AdminUser[] | null> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return null;

  try {
    const { data, error } = await client.from('admin_users').select('*').order('created_at', { ascending: true });
    if (error) return null;

    return (data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      password: u.password,
      phone: u.phone || undefined,
      createdAt: u.created_at,
      lastLogin: u.last_login || undefined,
      isDefaultTest: Boolean(u.is_default_test),
    }));
  } catch (e) {
    return null;
  }
};

export const deleteAdminUserFromSupabase = async (userId: string, customUrl?: string, customKey?: string): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;
  try {
    const { error } = await client.from('admin_users').delete().eq('id', userId);
    return !error;
  } catch {
    return false;
  }
};

/**
 * Mapeamentos e Métodos para MEDIA ITEMS (Galeria de Fotos, Vídeos & Lançamentos)
 */
export const mapMediaItemToSupabase = (item: MediaItem) => {
  const mediaType = item.type || 'photo';
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle || null,
    type: mediaType,
    category: item.category || 'novidades',
    category_label: item.categoryLabel || 'Geral',
    media_url: item.mediaUrl,
    poster_url: item.posterUrl || null,
    description: item.description || '',
    tag: item.tag || null,
    badge_color: item.badgeColor || 'rose',
    duration: item.duration || null,
    link_text: item.linkText || 'Quero no Meu Mostruário',
    link_action: item.linkAction || 'form',
    external_url: item.externalUrl || null,
    featured: Boolean(item.featured),
    active: item.active !== false,
    order_index: Number(item.order) || 0,
    created_at: item.createdAt || new Date().toISOString(),
  };
};

export const mapMediaItemFromSupabase = (data: any): MediaItem => ({
  id: data.id,
  title: data.title || '',
  subtitle: data.subtitle || undefined,
  type: (data.media_type || data.type || 'photo') as any,
  category: (data.category as any) || 'novidades',
  categoryLabel: data.category_label || data.categoryLabel || 'Geral',
  mediaUrl: data.media_url || data.url || '',
  posterUrl: data.poster_url || data.posterUrl || undefined,
  description: data.description || '',
  tag: data.tag || undefined,
  badgeColor: data.badge_color || 'rose',
  duration: data.duration || undefined,
  linkText: data.link_text || 'Quero no Meu Mostruário',
  linkAction: data.link_action || 'form',
  externalUrl: data.external_url || undefined,
  featured: Boolean(data.featured),
  active: data.active !== false,
  order: Number(data.order_index ?? data.order) || 0,
  createdAt: data.created_at || new Date().toISOString(),
});

export const syncMediaItemToSupabase = async (item: MediaItem, customUrl?: string, customKey?: string): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;

  try {
    const payload = mapMediaItemToSupabase(item);
    const { error } = await resilientUpsert(client, 'media_items', payload, 'id');
    if (error) {
      if (!error.isNetworkError) {
        console.warn('Aviso ao salvar media_item no Supabase:', error.message || error);
      }
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Aviso em syncMediaItemToSupabase:', e);
    return false;
  }
};

export const fetchMediaItemsFromSupabase = async (customUrl?: string, customKey?: string): Promise<MediaItem[] | null> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('media_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Aviso ao buscar media_items do Supabase:', error.message);
      return null;
    }

    return (data || []).map(mapMediaItemFromSupabase);
  } catch (e) {
    console.warn('Aviso em fetchMediaItemsFromSupabase:', e);
    return null;
  }
};

export const deleteMediaItemFromSupabase = async (itemId: string, customUrl?: string, customKey?: string): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;
  try {
    const { error } = await client.from('media_items').delete().eq('id', itemId);
    return !error;
  } catch {
    return false;
  }
};

export const syncAllMediaItemsToSupabase = async (items: MediaItem[], customUrl?: string, customKey?: string): Promise<number> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client || items.length === 0) return 0;

  try {
    const payloads = items.map(mapMediaItemToSupabase);
    const { data, error } = await resilientUpsert(client, 'media_items', payloads, 'id');
    if (error) {
      if (!error.isNetworkError) {
        console.warn('Aviso batch sync media_items:', error.message || error);
      }
      return 0;
    }
    return data?.length || 0;
  } catch (e) {
    console.warn('Aviso ao sincronizar todas as mídias:', e);
    return 0;
  }
};

// ==============================================================================
// 6. DEPOIMENTOS & AVALIAÇÕES (Mappers e Operações Supabase)
// ==============================================================================
export const mapTestimonialToSupabase = (t: TestimonialItem) => ({
  id: t.id,
  name: t.name,
  phone: t.phone || null,
  city: t.city,
  role: t.role,
  quote: t.quote,
  rating: t.rating,
  avatar_url: t.avatarUrl || null,
  profit: t.profit || null,
  status: t.status,
  featured: t.featured || false,
  verified: t.verified || false,
  source: t.source || 'form',
  notes: t.notes || null,
  created_at: t.createdAt || new Date().toISOString(),
  approved_at: t.approvedAt || null,
  approved_by: t.approvedBy || null,
});

export const mapTestimonialFromSupabase = (row: any): TestimonialItem => ({
  id: row.id,
  name: row.name || 'Anônimo',
  phone: row.phone || undefined,
  city: row.city || 'Itajaí - SC',
  role: row.role || 'Revendedora',
  quote: row.quote || '',
  rating: Number(row.rating) || 5,
  avatarUrl: row.avatar_url || undefined,
  profit: row.profit || undefined,
  status: (row.status as any) || 'pending',
  featured: Boolean(row.featured),
  verified: Boolean(row.verified),
  source: (row.source as any) || 'form',
  notes: row.notes || undefined,
  createdAt: row.created_at || new Date().toISOString(),
  approvedAt: row.approved_at || undefined,
  approvedBy: row.approved_by || undefined,
});

export const syncTestimonialToSupabase = async (
  item: TestimonialItem,
  customUrl?: string,
  customKey?: string
): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;

  try {
    const payload = mapTestimonialToSupabase(item);
    const { error } = await resilientUpsert(client, 'testimonials', payload, 'id');

    if (error) {
      console.warn('Erro ao salvar depoimento no Supabase:', error.message || error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Erro em syncTestimonialToSupabase:', e);
    return false;
  }
};

export const submitPublicTestimonialToSupabase = async (
  item: Omit<TestimonialItem, 'id' | 'status' | 'createdAt'> & { id?: string },
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; id: string }> => {
  const newId = item.id || `testim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fullItem: TestimonialItem = {
    ...item,
    id: newId,
    status: 'pending', // Sempre pendente de aprovação do distribuidor
    createdAt: new Date().toISOString(),
  };

  const client = getSupabaseClient(customUrl, customKey);
  if (!client) {
    return { success: true, id: newId }; // Local fallback
  }

  try {
    const payload = mapTestimonialToSupabase(fullItem);
    const { error } = await client.from('testimonials').insert(payload);
    if (error) {
      console.warn('Erro ao enviar depoimento público no Supabase:', error.message);
      return { success: false, id: newId };
    }
    return { success: true, id: newId };
  } catch (e) {
    console.error('Erro em submitPublicTestimonialToSupabase:', e);
    return { success: false, id: newId };
  }
};

export const fetchTestimonialsFromSupabase = async (
  customUrl?: string,
  customKey?: string,
  onlyApproved = false
): Promise<TestimonialItem[] | null> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return null;

  try {
    let query = client.from('testimonials').select('*');
    if (onlyApproved) {
      query = query.eq('status', 'approved');
    }
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.warn('Erro ao buscar depoimentos do Supabase:', error.message);
      return null;
    }

    return (data || []).map(mapTestimonialFromSupabase);
  } catch (e) {
    console.error('Erro em fetchTestimonialsFromSupabase:', e);
    return null;
  }
};

export const deleteTestimonialFromSupabase = async (
  itemId: string,
  customUrl?: string,
  customKey?: string
): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;
  try {
    const { error } = await client.from('testimonials').delete().eq('id', itemId);
    return !error;
  } catch {
    return false;
  }
};

export const syncAllTestimonialsToSupabase = async (
  items: TestimonialItem[],
  customUrl?: string,
  customKey?: string
): Promise<number> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client || items.length === 0) return 0;

  try {
    const payloads = items.map(mapTestimonialToSupabase);
    const { data, error } = await resilientUpsert(client, 'testimonials', payloads, 'id');
    if (error) {
      if (!error.isNetworkError) {
        console.warn('Aviso batch sync testimonials:', error.message || error);
      }
      return 0;
    }
    return data?.length || 0;
  } catch (e) {
    console.warn('Aviso ao sincronizar todos os depoimentos:', e);
    return 0;
  }
};

// ==========================================
// 6. LINHAS COMERCIAIS OFICIAIS (COMMERCIAL LINES)
// ==========================================

export const mapCommercialLineToSupabase = (line: CommercialLine) => ({
  id: line.id,
  title: line.title,
  badge: line.badge || '',
  tagline: line.tagline || '',
  items: Array.isArray(line.items) ? line.items : [],
  profit_highlight: line.profitHighlight || '',
  image: line.image || '',
  accent_color: line.accentColor || 'rose',
  is_favorita: Boolean(line.isFavorita),
  active: line.active !== false,
  order_index: typeof line.order === 'number' ? line.order : 0,
  created_at: line.createdAt || new Date().toISOString(),
});

export const mapCommercialLineFromSupabase = (row: any): CommercialLine => ({
  id: row.id,
  title: row.title || 'Nova Linha',
  badge: row.badge || '',
  tagline: row.tagline || row.subtitle || '',
  items: Array.isArray(row.items) ? row.items : (typeof row.items === 'string' ? JSON.parse(row.items || '[]') : []),
  profitHighlight: row.profit_highlight || row.description || '',
  image: row.image || '',
  accentColor: row.accent_color || 'rose',
  isFavorita: Boolean(row.is_favorita),
  active: row.active !== false,
  order: typeof row.order_index === 'number' ? row.order_index : 0,
  createdAt: row.created_at || new Date().toISOString(),
});

export const syncCommercialLineToSupabase = async (
  line: CommercialLine,
  customUrl?: string,
  customKey?: string
): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;

  try {
    const payload = mapCommercialLineToSupabase(line);
    const { error } = await resilientUpsert(client, 'commercial_lines', payload, 'id');

    if (error) {
      console.warn('Erro ao salvar linha comercial no Supabase:', error.message || error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Erro em syncCommercialLineToSupabase:', e);
    return false;
  }
};

export const fetchCommercialLinesFromSupabase = async (
  customUrl?: string,
  customKey?: string
): Promise<CommercialLine[] | null> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('commercial_lines')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.warn('Erro ao buscar linhas comerciais do Supabase:', error.message);
      return null;
    }

    return (data || []).map(mapCommercialLineFromSupabase);
  } catch (e) {
    console.error('Erro em fetchCommercialLinesFromSupabase:', e);
    return null;
  }
};

export const deleteCommercialLineFromSupabase = async (
  lineId: string,
  customUrl?: string,
  customKey?: string
): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;
  try {
    const { error } = await client.from('commercial_lines').delete().eq('id', lineId);
    return !error;
  } catch {
    return false;
  }
};

export const syncAllCommercialLinesToSupabase = async (
  lines: CommercialLine[],
  customUrl?: string,
  customKey?: string
): Promise<number> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client || lines.length === 0) return 0;

  try {
    const payloads = lines.map(mapCommercialLineToSupabase);
    const { data, error } = await resilientUpsert(client, 'commercial_lines', payloads, 'id');
    if (error) {
      if (!error.isNetworkError) {
        console.warn('Aviso batch sync commercial_lines:', error.message || error);
      }
      return 0;
    }
    return data?.length || 0;
  } catch (e) {
    console.warn('Aviso ao sincronizar todas as linhas comerciais:', e);
    return 0;
  }
};

// ==========================================
// 7. CUPONS DE INDICAÇÃO & CADASTRO DE INDICADORAS (REFERRAL COUPONS)
// ==========================================

export const mapReferralCouponToSupabase = (coupon: ReferralCoupon) => ({
  id: coupon.id,
  code: coupon.code.toUpperCase().trim(),
  full_name: coupon.fullName.trim(),
  cpf: coupon.cpf.trim(),
  phone: coupon.phone ? coupon.phone.trim() : null,
  city: coupon.city || null,
  pix_key: coupon.pixKey || null,
  pix_key_type: coupon.pixKeyType || null,
  bank_name: coupon.bankName || null,
  credit_balance: Number(coupon.creditBalance) || 0,
  paid_balance: Number(coupon.paidBalance) || 0,
  total_referrals_count: Number(coupon.totalReferralsCount) || 0,
  delivered_referrals_count: Number(coupon.deliveredReferralsCount) || 0,
  status: coupon.status || 'ativo',
  notes: coupon.notes || null,
  created_at: coupon.createdAt || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const mapReferralCouponFromSupabase = (row: any): ReferralCoupon => ({
  id: row.id,
  code: (row.code || '').toUpperCase().trim(),
  fullName: row.full_name || 'Indicadora',
  cpf: row.cpf || '',
  phone: row.phone || '',
  city: row.city || undefined,
  pixKey: row.pix_key || undefined,
  pixKeyType: row.pix_key_type || undefined,
  bankName: row.bank_name || undefined,
  creditBalance: Number(row.credit_balance) || 0,
  paidBalance: Number(row.paid_balance) || 0,
  totalReferralsCount: Number(row.total_referrals_count) || 0,
  deliveredReferralsCount: Number(row.delivered_referrals_count) || 0,
  status: row.status || 'ativo',
  notes: row.notes || undefined,
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at || undefined,
});

export const syncReferralCouponToSupabase = async (
  coupon: ReferralCoupon,
  customUrl?: string,
  customKey?: string
): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;

  try {
    const payload = mapReferralCouponToSupabase(coupon);
    const { error } = await resilientUpsert(client, 'referral_coupons', payload, 'id');

    if (error) {
      console.warn('Erro ao salvar cupom de indicação no Supabase:', error.message || error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Erro em syncReferralCouponToSupabase:', e);
    return false;
  }
};

export const fetchReferralCouponsFromSupabase = async (
  customUrl?: string,
  customKey?: string
): Promise<ReferralCoupon[] | null> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('referral_coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao buscar cupons de indicação do Supabase:', error.message);
      return null;
    }

    return (data || []).map(mapReferralCouponFromSupabase);
  } catch (e) {
    console.error('Erro em fetchReferralCouponsFromSupabase:', e);
    return null;
  }
};

export const deleteReferralCouponFromSupabase = async (
  couponId: string,
  customUrl?: string,
  customKey?: string
): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;
  try {
    const { error } = await client.from('referral_coupons').delete().eq('id', couponId);
    return !error;
  } catch {
    return false;
  }
};

export const syncAllReferralCouponsToSupabase = async (
  coupons: ReferralCoupon[],
  customUrl?: string,
  customKey?: string
): Promise<number> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client || coupons.length === 0) return 0;

  try {
    const payloads = coupons.map(mapReferralCouponToSupabase);
    const { data, error } = await resilientUpsert(client, 'referral_coupons', payloads, 'id');
    if (error) {
      if (!error.isNetworkError) {
        console.warn('Aviso batch sync referral_coupons:', error.message || error);
      }
      return 0;
    }
    return data?.length || 0;
  } catch (e) {
    console.warn('Aviso ao sincronizar todos os cupons de indicação:', e);
    return 0;
  }
};

// ---------------------------------------------------------------------------
// Mapeamento e Sincronização: Vendedoras (reseller_users)
// ---------------------------------------------------------------------------
export const mapResellerUserFromSupabase = (row: any): ResellerUser => ({
  id: row.id,
  fullName: row.full_name || '',
  cpf: row.cpf || '',
  phone: row.phone || '',
  email: row.email || '',
  password: row.password || '123',
  city: row.city || '',
  leadId: row.lead_id || undefined,
  active: row.active !== false,
  createdAt: row.created_at || new Date().toISOString(),
  lastLogin: row.last_login || undefined,
});

export const mapResellerUserToSupabase = (user: ResellerUser) => ({
  id: user.id,
  full_name: user.fullName,
  cpf: user.cpf,
  phone: user.phone,
  email: user.email || '',
  password: user.password || '123',
  city: user.city || '',
  lead_id: user.leadId || null,
  active: user.active !== false,
  created_at: user.createdAt || new Date().toISOString(),
  last_login: user.lastLogin || new Date().toISOString(),
});

export const fetchResellerUsersFromSupabase = async (customUrl?: string, customKey?: string): Promise<ResellerUser[] | null> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return null;
  try {
    const { data, error } = await client.from('reseller_users').select('*').order('created_at', { ascending: false });
    if (error) return null;
    return (data || []).map(mapResellerUserFromSupabase);
  } catch {
    return null;
  }
};

export const saveResellerUserToSupabase = async (user: ResellerUser, customUrl?: string, customKey?: string): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;
  try {
    const payload = mapResellerUserToSupabase(user);
    const { error } = await resilientUpsert(client, 'reseller_users', payload, 'id');
    return !error;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Mapeamento e Sincronização: Perfis de Vendas (reseller_sales_profiles)
// ---------------------------------------------------------------------------
export const mapSalesProfileFromSupabase = (row: any): ResellerSalesProfile => ({
  id: row.id,
  resellerId: row.reseller_id || '',
  resellerCpf: row.reseller_cpf || '',
  resellerName: row.reseller_name || '',
  resellerPhone: row.reseller_phone || '',
  resellerCity: row.reseller_city || '',
  sellsMensUnderwear: Boolean(row.sells_mens_underwear),
  mensUnderwearSizes: Array.isArray(row.mens_underwear_sizes) ? row.mens_underwear_sizes : [],
  sellsMensApparel: Boolean(row.sells_mens_apparel),
  sellsKidsClothing: Boolean(row.sells_kids_clothing),
  sellsKidsUnderwear: Boolean(row.sells_kids_underwear),
  sellsBraletteNoPadding: Boolean(row.sells_bralette_no_padding),
  pantyPreference: (row.panty_preference as any) || 'equilibrado',
  topSellingSizes: Array.isArray(row.top_selling_sizes) ? row.top_selling_sizes : ['M', 'G'],
  generalClothingItems: Array.isArray(row.general_clothing_items) ? row.general_clothing_items : [],
  distributorMessage: row.distributor_message || '',
  returnDate: row.return_date || '',
  returnTime: row.return_time || '',
  returnNotes: row.return_notes || '',
  pushScheduled: row.push_scheduled !== false,
  pushNotificationTitle: row.push_notification_title || '',
  pushNotificationBody: row.push_notification_body || '',
  pushSentAt: row.push_sent_at || '',
  pushStatus: row.push_status || 'agendado',
  updatedAt: row.updated_at || new Date().toISOString(),
  createdAt: row.created_at || new Date().toISOString(),
});

export const mapSalesProfileToSupabase = (profile: ResellerSalesProfile) => ({
  id: profile.id,
  reseller_id: profile.resellerId,
  reseller_cpf: profile.resellerCpf,
  reseller_name: profile.resellerName,
  reseller_phone: profile.resellerPhone,
  reseller_city: profile.resellerCity || '',
  sells_mens_underwear: profile.sellsMensUnderwear,
  mens_underwear_sizes: profile.mensUnderwearSizes || [],
  sells_mens_apparel: profile.sellsMensApparel,
  sells_kids_clothing: profile.sellsKidsClothing,
  sells_kids_underwear: profile.sellsKidsUnderwear,
  sells_bralette_no_padding: profile.sellsBraletteNoPadding,
  panty_preference: profile.pantyPreference || 'equilibrado',
  top_selling_sizes: profile.topSellingSizes || [],
  general_clothing_items: profile.generalClothingItems || [],
  distributor_message: profile.distributorMessage || '',
  return_date: profile.returnDate || null,
  return_time: profile.returnTime || null,
  return_notes: profile.returnNotes || '',
  push_scheduled: profile.pushScheduled !== false,
  push_notification_title: profile.pushNotificationTitle || '',
  push_notification_body: profile.pushNotificationBody || '',
  push_sent_at: profile.pushSentAt || null,
  push_status: profile.pushStatus || 'agendado',
  updated_at: new Date().toISOString(),
  created_at: profile.createdAt || new Date().toISOString(),
});

export const fetchSalesProfilesFromSupabase = async (customUrl?: string, customKey?: string): Promise<ResellerSalesProfile[] | null> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return null;
  try {
    const { data, error } = await client.from('reseller_sales_profiles').select('*').order('updated_at', { ascending: false });
    if (error) return null;
    return (data || []).map(mapSalesProfileFromSupabase);
  } catch {
    return null;
  }
};

export const saveSalesProfileToSupabase = async (profile: ResellerSalesProfile, customUrl?: string, customKey?: string): Promise<boolean> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) return false;
  try {
    const payload = mapSalesProfileToSupabase(profile);
    const { error } = await resilientUpsert(client, 'reseller_sales_profiles', payload, 'id');
    return !error;
  } catch {
    return false;
  }
};

/**
 * Assinatura Real-time Supabase (WebSocket) para sincronização instantânea
 * de mídias, leads, ordens, depoimentos, linhas, usuários admin e configurações entre todos os navegadores e abas
 */
export interface RealtimeSubscriptionHandlers {
  onMediaChange?: (change: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; item?: MediaItem; itemId?: string }) => void;
  onLeadChange?: (change: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; lead?: Lead; leadId?: string }) => void;
  onOrderChange?: (change: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; order?: ConsignmentOrder; orderId?: string }) => void;
  onCouponChange?: (change: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; coupon?: ReferralCoupon; couponId?: string }) => void;
  onTestimonialChange?: (change: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; item?: TestimonialItem; itemId?: string }) => void;
  onCommercialLineChange?: (change: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; line?: CommercialLine; lineId?: string }) => void;
  onAdminUserChange?: (change: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; user?: AdminUser; userId?: string }) => void;
  onSettingsChange?: (newSettings: Partial<BusinessSettings>) => void;
  onStatusChange?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR') => void;
}

/**
 * Busca consolidada de todos os dados do banco de dados na nuvem (Supabase)
 */
export const fetchAllCloudData = async (customUrl?: string, customKey?: string) => {
  const [
    cloudLeads, 
    cloudOrders, 
    cloudCoupons, 
    cloudAdmins, 
    cloudSettings, 
    cloudMedia, 
    cloudTestimonials, 
    cloudLines,
    cloudResellers,
    cloudSalesProfiles
  ] = await Promise.all([
    fetchLeadsFromSupabase(customUrl, customKey),
    fetchOrdersFromSupabase(customUrl, customKey),
    fetchReferralCouponsFromSupabase(customUrl, customKey),
    fetchAdminUsersFromSupabase(customUrl, customKey),
    fetchSettingsFromSupabase(customUrl, customKey),
    fetchMediaItemsFromSupabase(customUrl, customKey),
    fetchTestimonialsFromSupabase(customUrl, customKey),
    fetchCommercialLinesFromSupabase(customUrl, customKey),
    fetchResellerUsersFromSupabase(customUrl, customKey),
    fetchSalesProfilesFromSupabase(customUrl, customKey),
  ]);

  return {
    leads: cloudLeads,
    orders: cloudOrders,
    coupons: cloudCoupons,
    adminUsers: cloudAdmins,
    settings: cloudSettings,
    mediaItems: cloudMedia,
    testimonials: cloudTestimonials,
    commercialLines: cloudLines,
    resellers: cloudResellers,
    salesProfiles: cloudSalesProfiles,
  };
};

export interface AllAppData {
  leads: Lead[];
  orders: ConsignmentOrder[];
  coupons?: ReferralCoupon[];
  adminUsers?: AdminUser[];
  settings: BusinessSettings;
  mediaItems?: MediaItem[];
  testimonials?: TestimonialItem[];
  commercialLines?: CommercialLine[];
  resellers?: ResellerUser[];
  salesProfiles?: ResellerSalesProfile[];
}

/**
 * Sincronização completa de todos os módulos locais para o Supabase
 */
export const syncAllDataToCloud = async (
  data: AllAppData,
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string; counts: Record<string, number> }> => {
  const counts: Record<string, number> = {
    settings: 0,
    leads: 0,
    orders: 0,
    coupons: 0,
    mediaItems: 0,
    testimonials: 0,
    commercialLines: 0,
    adminUsers: 0,
  };

  try {
    // 1. Settings
    if (data.settings) {
      const okSettings = await syncSettingsToSupabase(data.settings, customUrl, customKey);
      if (okSettings) counts.settings = 1;
    }

    // 2. Leads
    if (data.leads && data.leads.length > 0) {
      counts.leads = await syncAllLeadsToSupabase(data.leads, customUrl, customKey);
    }

    // 3. Orders
    if (data.orders && data.orders.length > 0) {
      let savedOrders = 0;
      for (const ord of data.orders) {
        const ok = await syncOrderToSupabase(ord, customUrl, customKey);
        if (ok) savedOrders++;
      }
      counts.orders = savedOrders;
    }

    // 4. Coupons
    if (data.coupons && data.coupons.length > 0) {
      counts.coupons = await syncAllReferralCouponsToSupabase(data.coupons, customUrl, customKey);
    }

    // 5. Media
    if (data.mediaItems && data.mediaItems.length > 0) {
      counts.mediaItems = await syncAllMediaItemsToSupabase(data.mediaItems, customUrl, customKey);
    }

    // 6. Testimonials
    if (data.testimonials && data.testimonials.length > 0) {
      counts.testimonials = await syncAllTestimonialsToSupabase(data.testimonials, customUrl, customKey);
    }

    // 7. Lines
    if (data.commercialLines && data.commercialLines.length > 0) {
      counts.commercialLines = await syncAllCommercialLinesToSupabase(data.commercialLines, customUrl, customKey);
    }

    // 8. Admin Users
    if (data.adminUsers && data.adminUsers.length > 0) {
      let savedAdmins = 0;
      for (const u of data.adminUsers) {
        const ok = await syncAdminUserToSupabase(u, customUrl, customKey);
        if (ok) savedAdmins++;
      }
      counts.adminUsers = savedAdmins;
    }

    // 9. Reseller Users
    if (data.resellers && data.resellers.length > 0) {
      let savedResellers = 0;
      for (const r of data.resellers) {
        const ok = await saveResellerUserToSupabase(r, customUrl, customKey);
        if (ok) savedResellers++;
      }
      counts.resellers = savedResellers;
    }

    // 10. Reseller Sales Profiles
    if (data.salesProfiles && data.salesProfiles.length > 0) {
      let savedProfiles = 0;
      for (const p of data.salesProfiles) {
        const ok = await saveSalesProfileToSupabase(p, customUrl, customKey);
        if (ok) savedProfiles++;
      }
      counts.salesProfiles = savedProfiles;
    }

    return {
      success: true,
      message: `Sincronização concluída com sucesso! (${counts.leads} leads, ${counts.orders} pedidos, ${counts.settings} config, ${counts.mediaItems} mídias, ${counts.commercialLines} linhas, ${counts.resellers || 0} vendedoras).`,
      counts,
    };
  } catch (err: any) {
    console.error('Erro na sincronização completa:', err);
    return {
      success: false,
      message: `Falha parcial na sincronização: ${err.message || 'Erro de rede ou permissões no Supabase.'}`,
      counts,
    };
  }
};

export const subscribeToSupabaseRealtime = (
  handlers: RealtimeSubscriptionHandlers,
  customUrl?: string,
  customKey?: string
): (() => void) => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) {
    handlers.onStatusChange?.('DISCONNECTED');
    return () => {};
  }

  handlers.onStatusChange?.('CONNECTING');
  const channelId = `realtime-hub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const channel = client.channel(channelId, {
    config: {
      broadcast: { self: true },
    },
  });

  // 1. Escuta mudanças em media_items
  if (handlers.onMediaChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'media_items' },
      (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            handlers.onMediaChange?.({ eventType: 'DELETE', itemId: oldId });
          } else if (payload.new) {
            const mapped = mapMediaItemFromSupabase(payload.new);
            handlers.onMediaChange?.({
              eventType: payload.eventType as 'INSERT' | 'UPDATE',
              item: mapped,
              itemId: mapped.id,
            });
          }
        } catch (e) {
          console.warn('Erro ao processar realtime media_item:', e);
        }
      }
    );
  }

  // 2. Escuta mudanças em leads
  if (handlers.onLeadChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'leads' },
      (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            handlers.onLeadChange?.({ eventType: 'DELETE', leadId: oldId });
          } else if (payload.new) {
            const mapped = mapLeadFromSupabase(payload.new);
            handlers.onLeadChange?.({
              eventType: payload.eventType as 'INSERT' | 'UPDATE',
              lead: mapped,
              leadId: mapped.id,
            });
          }
        } catch (e) {
          console.warn('Erro ao processar realtime lead:', e);
        }
      }
    );
  }

  // 3. Escuta mudanças em consignment_orders
  if (handlers.onOrderChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'consignment_orders' },
      (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            handlers.onOrderChange?.({ eventType: 'DELETE', orderId: oldId });
          } else if (payload.new) {
            const mapped = mapOrderFromSupabase(payload.new);
            handlers.onOrderChange?.({
              eventType: payload.eventType as 'INSERT' | 'UPDATE',
              order: mapped,
              orderId: mapped.id,
            });
          }
        } catch (e) {
          console.warn('Erro ao processar realtime consignment_order:', e);
        }
      }
    );
  }

  // 4. Escuta mudanças em business_settings
  if (handlers.onSettingsChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'business_settings' },
      (payload) => {
        try {
          if (payload.new) {
            const data = payload.new as any;
            handlers.onSettingsChange?.({
              businessName: data.business_name,
              distributorName: data.distributor_name,
              brandSubtitle: data.brand_subtitle,
              officialWhatsApp: data.official_whatsapp,
              displayWhatsApp: data.display_whatsapp,
              instagramHandle: data.instagram_handle,
              cityRegion: data.city_region,
              cycleDays: Number(data.cycle_days) || undefined,
              baseCommission: Number(data.base_commission) || undefined,
              maxCommission: Number(data.max_commission) || undefined,
              favoritaMinOrder: Number(data.favorita_min_order) || undefined,
              favoritaMaxFirstOrder: Number(data.favorita_max_first_order) || undefined,
              catalogoFavoritaUrl: data.catalogo_favorita_url,
              lojaFisicaWhatsApp: data.loja_fisica_whatsapp,
              lojaFisicaDisplayWhatsApp: data.loja_fisica_display_whatsapp,
              lojaFisicaVendedora: data.loja_fisica_vendedora,
              lojaFisicaMapsUrl: data.loja_fisica_maps_url,
              lojaFisicaEndereco: data.loja_fisica_endereco,
              googleReviewsUrl: data.google_reviews_url,
              lojaJoinvilleVendedora: data.loja_joinville_vendedora,
              lojaJoinvilleWhatsApp: data.loja_joinville_whatsapp,
              lojaJoinvilleDisplayWhatsApp: data.loja_joinville_display_whatsapp,
              lojaFlorianopolisVendedora: data.loja_florianopolis_vendedora,
              lojaFlorianopolisWhatsApp: data.loja_florianopolis_whatsapp,
              lojaFlorianopolisDisplayWhatsApp: data.loja_florianopolis_display_whatsapp,
              heroBannerUrl: data.hero_banner_url,
              welcomeTemplate: data.welcome_template,
              kitReadyTemplate: data.kit_ready_template,
              settlementReminderTemplate: data.settlement_reminder_template,
            });
          }
        } catch (e) {
          console.warn('Erro ao processar realtime settings:', e);
        }
      }
    );
  }

  // 5. Escuta mudanças em testimonials (Depoimentos de Revendedoras/Clientes)
  if (handlers.onTestimonialChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'testimonials' },
      (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            handlers.onTestimonialChange?.({ eventType: 'DELETE', itemId: oldId });
          } else if (payload.new) {
            const mapped = mapTestimonialFromSupabase(payload.new);
            handlers.onTestimonialChange?.({
              eventType: payload.eventType as 'INSERT' | 'UPDATE',
              item: mapped,
              itemId: mapped.id,
            });
          }
        } catch (e) {
          console.warn('Erro ao processar realtime testimonial:', e);
        }
      }
    );
  }

  // 6. Escuta mudanças em commercial_lines (Linhas Comerciais Oficiais)
  if (handlers.onCommercialLineChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'commercial_lines' },
      (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            handlers.onCommercialLineChange?.({ eventType: 'DELETE', lineId: oldId });
          } else if (payload.new) {
            const mapped = mapCommercialLineFromSupabase(payload.new);
            handlers.onCommercialLineChange?.({
              eventType: payload.eventType as 'INSERT' | 'UPDATE',
              line: mapped,
              lineId: mapped.id,
            });
          }
        } catch (e) {
          console.warn('Erro ao processar realtime commercial_line:', e);
        }
      }
    );
  }

  // 7. Escuta mudanças em admin_users (Equipe de Gestão e Logins)
  if (handlers.onAdminUserChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'admin_users' },
      (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            handlers.onAdminUserChange?.({ eventType: 'DELETE', userId: oldId });
          } else if (payload.new) {
            const row = payload.new as any;
            const mapped: AdminUser = {
              id: row.id,
              name: row.name,
              email: row.email,
              role: row.role || 'administrador',
              password: row.password || '',
              phone: row.phone || undefined,
              createdAt: row.created_at || new Date().toISOString(),
              isDefaultTest: Boolean(row.is_default_test),
            };
            handlers.onAdminUserChange?.({
              eventType: payload.eventType as 'INSERT' | 'UPDATE',
              user: mapped,
              userId: mapped.id,
            });
          }
        } catch (e) {
          console.warn('Erro ao processar realtime admin_user:', e);
        }
      }
    );
  }

  // 8. Escuta mudanças em referral_coupons (Cupons & Cadastro de Indicadoras)
  if (handlers.onCouponChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'referral_coupons' },
      (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            handlers.onCouponChange?.({ eventType: 'DELETE', couponId: oldId });
          } else if (payload.new) {
            const mapped = mapReferralCouponFromSupabase(payload.new);
            handlers.onCouponChange?.({
              eventType: payload.eventType as 'INSERT' | 'UPDATE',
              coupon: mapped,
              couponId: mapped.id,
            });
          }
        } catch (e) {
          console.warn('Erro ao processar realtime referral_coupon:', e);
        }
      }
    );
  }

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      handlers.onStatusChange?.('CONNECTED');
      console.log('📡 Conexão Realtime Supabase (WebSocket) ATIVA para todas as 8 tabelas!');
    } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
      handlers.onStatusChange?.('ERROR');
      console.warn(`📡 Supabase Realtime channel status: ${status}.`);
    } else if (status === 'CLOSED') {
      handlers.onStatusChange?.('DISCONNECTED');
    }
  });

  return () => {
    try {
      client.removeChannel(channel);
    } catch {}
  };
};

/**
 * Script SQL Completo exportado em formato String para visualização e cópia
 */
export const SUPABASE_SQL_SCHEMA_SCRIPT = `-- ==============================================================================
-- ROMANCE MODA ITAJAÍ - ESQUEMA COMPLETO DE BANCO DE DADOS SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Execute este script no SQL Editor do seu Painel Supabase (https://app.supabase.com)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA: leads (Pré-cadastros de Revendedoras Sem Investimento)
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    cpf VARCHAR(20) NOT NULL,
    birth_date VARCHAR(20),
    phone VARCHAR(30) NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    neighborhood TEXT,
    cep VARCHAR(20),
    wants_favorita_40 VARCHAR(10) DEFAULT 'sim',
    has_experience TEXT DEFAULT 'nao',
    status VARCHAR(30) DEFAULT 'novo',
    notes TEXT,
    protocol VARCHAR(50) NOT NULL,
    referral_coupon_code VARCHAR(50),
    terms_accepted BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_cpf ON public.leads(cpf);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_referral_coupon ON public.leads(referral_coupon_code);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Migração retroativa para a coluna de cupom nos leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referral_coupon_code VARCHAR(50);

-- TABELA: referral_coupons (Cupons de Indicação, Cadastro de Indicadoras e Bonificações)
CREATE TABLE IF NOT EXISTS public.referral_coupons (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    cpf VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(30),
    city TEXT,
    pix_key TEXT,
    pix_key_type VARCHAR(20),
    bank_name TEXT,
    credit_balance NUMERIC(10,2) DEFAULT 0.00,
    paid_balance NUMERIC(10,2) DEFAULT 0.00,
    total_referrals_count INTEGER DEFAULT 0,
    delivered_referrals_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ativo',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações retroativas para colunas adicionais de bonificação e Pix
ALTER TABLE public.referral_coupons ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.referral_coupons ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE public.referral_coupons ADD COLUMN IF NOT EXISTS pix_key_type VARCHAR(20);
ALTER TABLE public.referral_coupons ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.referral_coupons ADD COLUMN IF NOT EXISTS paid_balance NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.referral_coupons ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';

CREATE INDEX IF NOT EXISTS idx_referral_coupons_code ON public.referral_coupons(code);
CREATE INDEX IF NOT EXISTS idx_referral_coupons_cpf ON public.referral_coupons(cpf);

-- 2. TABELA: consignment_orders (Sacolas Consignadas & Acertos de 40 Dias)
CREATE TABLE IF NOT EXISTS public.consignment_orders (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
    reseller_name TEXT NOT NULL,
    reseller_phone VARCHAR(30) NOT NULL,
    reseller_cpf VARCHAR(20),
    reseller_city TEXT,
    kit_amount NUMERIC(10,2) DEFAULT 0.00,
    favorita_amount NUMERIC(10,2) DEFAULT 0.00,
    total_consigned NUMERIC(10,2) DEFAULT 0.00,
    commission_rate NUMERIC(4,2) DEFAULT 0.30,
    delivery_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    settlement_date TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'ativo',
    sold_amount NUMERIC(10,2),
    returned_amount NUMERIC(10,2),
    reseller_profit NUMERIC(10,2),
    net_company_amount NUMERIC(10,2),
    settlement_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.consignment_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_due_date ON public.consignment_orders(due_date);

-- 3. TABELA: admin_users (Logins & Senhas de Administradores do Painel)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role VARCHAR(30) DEFAULT 'administrador',
    password TEXT DEFAULT 'romance2026',
    phone VARCHAR(30),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_default_test BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- Migrações retroativas para admin_users
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'romance2026';
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS is_default_test BOOLEAN DEFAULT false;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'password'
  ) THEN
    ALTER TABLE public.admin_users ALTER COLUMN password DROP NOT NULL;
    ALTER TABLE public.admin_users ALTER COLUMN password SET DEFAULT 'romance2026';
  END IF;
END $$;

-- 4. TABELA: business_settings (Configurações Gerais da Distribuidora)
CREATE TABLE IF NOT EXISTS public.business_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_settings',
    business_name TEXT DEFAULT 'Romance Itapema',
    distributor_name TEXT DEFAULT 'Anderson Rodrigues',
    brand_subtitle TEXT,
    official_whatsapp VARCHAR(30) DEFAULT '5547997626121',
    display_whatsapp VARCHAR(30) DEFAULT '(47) 99762-6121',
    instagram_handle VARCHAR(100) DEFAULT '@romanceitapema',
    city_region TEXT,
    cycle_days INTEGER DEFAULT 40,
    base_commission INTEGER DEFAULT 30,
    max_commission INTEGER DEFAULT 40,
    favorita_min_order NUMERIC(10,2) DEFAULT 400.00,
    favorita_max_first_order NUMERIC(10,2) DEFAULT 600.00,
    catalogo_favorita_url TEXT DEFAULT 'https://catalogofavorita.com.br/',
    loja_fisica_whatsapp VARCHAR(30),
    loja_fisica_display_whatsapp VARCHAR(30),
    loja_fisica_vendedora TEXT DEFAULT 'Luana',
    loja_fisica_maps_url TEXT,
    loja_fisica_endereco TEXT,
    google_reviews_url TEXT DEFAULT '',
    loja_joinville_vendedora TEXT DEFAULT 'Hevilin',
    loja_joinville_whatsapp VARCHAR(30),
    loja_joinville_display_whatsapp VARCHAR(30),
    loja_florianopolis_vendedora TEXT DEFAULT 'Warla',
    loja_florianopolis_whatsapp VARCHAR(30),
    loja_florianopolis_display_whatsapp VARCHAR(30),
    hero_banner_url TEXT,
    logo_url TEXT,
    admin_pin VARCHAR(50) DEFAULT 'romance2026',
    welcome_template TEXT,
    kit_ready_template TEXT,
    settlement_reminder_template TEXT,
    lead_rejected_template TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações retroativas para business_settings
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS max_commission INTEGER DEFAULT 40;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS lead_rejected_template TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS google_reviews_url TEXT DEFAULT '';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_joinville_vendedora TEXT DEFAULT 'Hevilin';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_joinville_whatsapp VARCHAR(30);
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_joinville_display_whatsapp VARCHAR(30);
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_florianopolis_vendedora TEXT DEFAULT 'Warla';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_florianopolis_whatsapp VARCHAR(30);
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_florianopolis_display_whatsapp VARCHAR(30);
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS hero_banner_url TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 5. TABELA: media_items (Galeria de Fotos, Vídeos & Novidades)
CREATE TABLE IF NOT EXISTS public.media_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'photo',
    media_type VARCHAR(20) DEFAULT 'photo',
    category VARCHAR(50) NOT NULL DEFAULT 'novidades',
    category_label TEXT NOT NULL DEFAULT 'Geral',
    media_url TEXT NOT NULL,
    poster_url TEXT,
    description TEXT,
    tag VARCHAR(100),
    badge_color VARCHAR(30) DEFAULT 'rose',
    duration VARCHAR(30),
    link_text VARCHAR(100) DEFAULT 'Quero no Meu Mostruário',
    link_action VARCHAR(30) DEFAULT 'form',
    external_url TEXT,
    featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações retroativas para media_items
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'photo';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'photo';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS category_label TEXT DEFAULT 'Geral';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS badge_color VARCHAR(30) DEFAULT 'rose';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS link_text VARCHAR(100) DEFAULT 'Quero no Meu Mostruário';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS link_action VARCHAR(30) DEFAULT 'form';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'media_items' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE public.media_items ALTER COLUMN media_type DROP NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'media_items' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.media_items ALTER COLUMN type DROP NOT NULL;
  END IF;
END $$;

-- 6. TABELA: testimonials (Depoimentos & Avaliações Reais com Moderação)
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone VARCHAR(30),
    city TEXT NOT NULL,
    role VARCHAR(100) DEFAULT 'Revendedora',
    quote TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    avatar_url TEXT,
    profit TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    featured BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    source VARCHAR(30) DEFAULT 'form',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_testimonials_status ON public.testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON public.testimonials(featured);

-- 7. TABELA: commercial_lines (Linhas Comerciais Oficiais & Mix de Produtos)
CREATE TABLE IF NOT EXISTS public.commercial_lines (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    badge VARCHAR(100) NOT NULL,
    tagline TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    profit_highlight TEXT NOT NULL,
    image TEXT NOT NULL,
    accent_color VARCHAR(50) DEFAULT 'rose',
    is_favorita BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lines_order ON public.commercial_lines(order_index ASC);
CREATE INDEX IF NOT EXISTS idx_lines_active ON public.commercial_lines(active, order_index ASC);

-- Compatibilidade Retroativa: Garante migração de colunas e remove NOT NULL de colunas antigas (ex: subtitle, description)
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS accent_color VARCHAR(50) DEFAULT 'rose';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT '';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS profit_highlight TEXT DEFAULT '';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS badge VARCHAR(100) DEFAULT '';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS is_favorita BOOLEAN DEFAULT false;
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'commercial_lines' AND column_name = 'subtitle'
  ) THEN
    ALTER TABLE public.commercial_lines ALTER COLUMN subtitle DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'commercial_lines' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.commercial_lines ALTER COLUMN description DROP NOT NULL;
  END IF;
END $$;

-- 8. TABELA: reseller_users (Contas de Acesso das Vendedoras ao Portal)
CREATE TABLE IF NOT EXISTS public.reseller_users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    cpf VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    password TEXT NOT NULL DEFAULT '123',
    city TEXT,
    lead_id TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resellers_cpf ON public.reseller_users(cpf);
CREATE INDEX IF NOT EXISTS idx_resellers_phone ON public.reseller_users(phone);

-- 9. TABELA: reseller_sales_profiles (Perfis de Vendas para Montagem da Sacola pelo Distribuidor)
CREATE TABLE IF NOT EXISTS public.reseller_sales_profiles (
    id TEXT PRIMARY KEY,
    reseller_id TEXT NOT NULL,
    reseller_cpf VARCHAR(20) NOT NULL,
    reseller_name TEXT NOT NULL,
    reseller_phone VARCHAR(30) NOT NULL,
    reseller_city TEXT,
    
    -- 1. Cuecas masculinas
    sells_mens_underwear BOOLEAN DEFAULT false,
    mens_underwear_sizes JSONB DEFAULT '[]'::jsonb,
    
    -- 2. Bermuda e camiseta masculino
    sells_mens_apparel BOOLEAN DEFAULT false,
    
    -- 3. Roupas infantil
    sells_kids_clothing BOOLEAN DEFAULT false,
    
    -- 4. Calcinha e cueca infantil
    sells_kids_underwear BOOLEAN DEFAULT false,
    
    -- 5. Soutien sem bojo
    sells_bralette_no_padding BOOLEAN DEFAULT false,
    
    -- 6. Vende mais tanga ou fio
    panty_preference VARCHAR(30) DEFAULT 'equilibrado',
    
    -- 7. Vende mais P, M, G ou GG
    top_selling_sizes JSONB DEFAULT '["M", "G"]'::jsonb,
    
    -- 8. Roupas em geral (13 itens oficiais)
    general_clothing_items JSONB DEFAULT '[]'::jsonb,
    
    -- 9. Recado salvo para o distribuidor
    distributor_message TEXT DEFAULT '',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_profiles_cpf ON public.reseller_sales_profiles(reseller_cpf);
CREATE INDEX IF NOT EXISTS idx_sales_profiles_reseller_id ON public.reseller_sales_profiles(reseller_id);
CREATE INDEX IF NOT EXISTS idx_sales_profiles_updated_at ON public.reseller_sales_profiles(updated_at DESC);

-- 10. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_sales_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir acesso completo a leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a consignment_orders" ON public.consignment_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a referral_coupons" ON public.referral_coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a admin_users" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso a business_settings" ON public.business_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso a media_items" ON public.media_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso a testimonials" ON public.testimonials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso a commercial_lines" ON public.commercial_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a reseller_users" ON public.reseller_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a reseller_sales_profiles" ON public.reseller_sales_profiles FOR ALL USING (true) WITH CHECK (true);

-- 11. HABILITAR REALTIME (PUBLICATIONS & REPLICA IDENTITY)
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.consignment_orders REPLICA IDENTITY FULL;
ALTER TABLE public.referral_coupons REPLICA IDENTITY FULL;
ALTER TABLE public.business_settings REPLICA IDENTITY FULL;
ALTER TABLE public.media_items REPLICA IDENTITY FULL;
ALTER TABLE public.testimonials REPLICA IDENTITY FULL;
ALTER TABLE public.commercial_lines REPLICA IDENTITY FULL;
ALTER TABLE public.admin_users REPLICA IDENTITY FULL;
ALTER TABLE public.reseller_users REPLICA IDENTITY FULL;
ALTER TABLE public.reseller_sales_profiles REPLICA IDENTITY FULL;

DO $$
DECLARE
  t text;
  tbls text[] := ARRAY['leads', 'consignment_orders', 'referral_coupons', 'business_settings', 'media_items', 'testimonials', 'commercial_lines', 'admin_users', 'reseller_users', 'reseller_sales_profiles'];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $$;

-- 10. SEED DATA (DADOS INICIAIS)
INSERT INTO public.admin_users (id, name, email, role, password, phone, is_default_test) 
VALUES ('admin-master', 'Anderson Rodrigues', 'admin@romanceitapema.com.br', 'distribuidor', 'romance2026', '(47) 99762-6121', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.testimonials (id, name, city, role, quote, rating, status, verified, featured, source)
VALUES 
('testim-1', 'Patrícia Mendes', 'Itajaí - SC (São Vicente)', 'Revendedora Sem Investimento', 'Comecei sem gastar nada e a aceitação das lingeries Romance foi imediata! As peças são lindas e o prazo de 40 dias dá muita tranquilidade para atender as clientes e acertar só o que vender.', 5, 'approved', true, true, 'google'),
('testim-2', 'Juliana Fagundes', 'Balneário Camboriú - SC', 'Revendedora Diamante', 'O atendimento da distribuição Romance em Itapema e região é nota 10. O Anderson e a equipe dão todo o suporte no WhatsApp e na loja, facilitando muito as trocas e os pedidos do Catálogo Favorita.', 5, 'approved', true, true, 'google'),
('testim-3', 'Camila Santos Rocha', 'Navegantes - SC', 'Revendedora há 9 meses', 'Excelente oportunidade de ter renda extra com peças de alta qualidade. Pego o mostruário montado, apresento para as colegas e no acerto fico com o meu lucro na hora!', 5, 'approved', true, false, 'google')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.commercial_lines (id, title, badge, tagline, items, profit_highlight, image, accent_color, is_favorita, active, order_index)
VALUES
('fitness', 'Fitness', 'Alta Performance', 'Moda fitness com tecnologia de compressão e zero transparência', '["Leggings Power Modeladoras", "Tops com Alta Sustentação", "Shorts e Bermudas de Treino", "Macacões e Conjuntos Fit"]'::jsonb, 'Lucro de R$ 35 a R$ 70 por conjunto', '/images/lines/line_fitness_product.jpg', 'rose', false, true, 1),
('seamless', 'Seamless', 'Sem Costura', 'Tecnologia que não marca a roupa e traz conforto anatômico absoluto', '["Calcinhas Laser Invisíveis", "Tops e Sutiãs sem Costura", "Bermudas Modeladoras", "Bodies Segunda Pele"]'::jsonb, 'Giro rápido e recompra recorrente', '/images/lines/line_seamless_product.jpg', 'pink', false, true, 2),
('casual', 'Casual', 'Estilo & Conforto', 'Moda dia a dia versátil para compor looks modernos e práticos', '["Croppeds e T-shirts Modernas", "Bodies Tendência", "Shorts e Saias Confort", "Vestidos e Conjuntos Casuais"]'::jsonb, 'Excelente apelo visual para vendas rápidas', '/images/lines/line_casual_product.jpg', 'amber', false, true, 3),
('intima', 'Moda Íntima', 'Lingerie Nobre', 'Lingeries finas em renda nobre, bojos estruturados e linha noite sensual', '["Conjuntos Renda Francesa", "Modelos Strappy & Sensuais", "Sutiãs com Aro e Sustentação", "Baby Dolls & Camisolas"]'::jsonb, 'Lucro de 30% a 40% em cada peça', '/images/lines/line_intima_product.jpg', 'rose', false, true, 4),
('cosmeticos', 'Cosméticos', 'Catálogo Favorita', 'Perfumaria fina, maquiagem e cuidados corporais que liberam 40% de lucro', '["Perfumaria Fina Masculina & Feminina", "Maquiagem & Skincare", "Hidratantes e Cuidados Pessoais", "Pedido mín. R$ 400 / máx R$ 600"]'::jsonb, 'Ativa o lucro máximo de 40% nas lingeries sem investimento', '/images/lines/line_cosmeticos_product.jpg', 'emerald', true, true, 5),
('rmc_casa', 'RMC Casa', 'Lar & Conforto', 'Cama, mesa, banho, aromas de ambiente e utilidades práticas para o lar', '["Jogos de Cama e Toalhas Nobres", "Aromatizadores & Difusores", "Capas e Almofadas Decorativas", "Utilidades Domésticas Práticas"]'::jsonb, 'Ticket médio elevado e compras para família', '/images/lines/line_rmc_casa_product.jpg', 'blue', false, true, 6),
('sex_shop', 'Sex Shop', 'Boutique Sensual', 'Linha sensual sofisticada, cosméticos estimulantes e produtos para momentos a dois', '["Óleos de Massagem Beijáveis", "Géis Térmicos (Quente / Frio)", "Velas de Massagem Aromáticas", "Acessórios & Cosméticos Sensuais"]'::jsonb, 'Altíssima margem e procura espontânea', '/images/lines/line_sex_shop_product.jpg', 'purple', false, true, 7)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    badge = EXCLUDED.badge,
    tagline = EXCLUDED.tagline,
    items = EXCLUDED.items,
    profit_highlight = EXCLUDED.profit_highlight,
    accent_color = EXCLUDED.accent_color,
    is_favorita = EXCLUDED.is_favorita;
`;
