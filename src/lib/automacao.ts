import { getSupabaseClient } from './supabase';
// O próprio arquivo .sql é embutido para o botão "Copiar SQL" do painel
import AUTOMACAO_SQL from './supabase-automacao.sql?raw';

export { AUTOMACAO_SQL };

export type AutomacaoStatus = 'novo' | 'em_ativacao' | 'ativado' | 'cancelado';

export interface AutomacaoCadastro {
  id: string;
  created_at: string;
  status: AutomacaoStatus;
  nome_completo: string;
  nome_operacao: string;
  cidade_uf?: string | null;
  email?: string | null;
  whatsapp_pessoal?: string | null;
  whatsapp_automacao: string;
  tipo_whatsapp?: string | null;
  aparelhos_conectados?: string | null;
  avisos_para?: string | null;
  whatsapp_avisos?: string | null;
  vp_usuario?: string | null;
  vp_analise_credito?: string | null;
  apos_aprovacao?: string | null;
  horario_atendimento?: string | null;
  observacoes?: string | null;
  melhor_horario?: string | null;
  celular_na_ativacao?: string | null;
  aceite_login?: boolean | null;
  aceite_lgpd?: boolean | null;
  aceite_whatsapp?: boolean | null;
  instancia?: string | null;
  anotacoes?: string | null;
}

export type ResultadoBusca =
  | { ok: true; dados: AutomacaoCadastro[] }
  | { ok: false; tabelaNaoExiste: boolean; erro: string };

const TABELA = 'automacao_cadastros';

export async function buscarCadastrosAutomacao(): Promise<ResultadoBusca> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, tabelaNaoExiste: false, erro: 'Supabase não configurado.' };
  const { data, error } = await client.from(TABELA).select('*').order('created_at', { ascending: false });
  if (error) {
    const naoExiste = error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message);
    return { ok: false, tabelaNaoExiste: naoExiste, erro: error.message };
  }
  return { ok: true, dados: (data || []) as AutomacaoCadastro[] };
}

export async function atualizarCadastroAutomacao(id: string, campos: Partial<AutomacaoCadastro>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from(TABELA).update(campos).eq('id', id);
  if (error) console.warn('Erro ao atualizar cadastro de automação:', error.message);
  return !error;
}

export async function excluirCadastroAutomacao(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from(TABELA).delete().eq('id', id);
  return !error;
}

/** Escuta novos cadastros em tempo real. Retorna a função para parar. */
export function ouvirCadastrosAutomacao(aoMudar: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const canal = client
    .channel('automacao_cadastros_admin')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABELA }, () => aoMudar())
    .subscribe();
  return () => { client.removeChannel(canal); };
}
