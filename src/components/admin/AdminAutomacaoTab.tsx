import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Search,
  RefreshCw,
  MessageCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Database,
  Copy,
  CheckCircle2,
  MapPin,
  Clock,
  Smartphone,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { buildWhatsAppLink, formatDateBR } from '../../utils/validators';
import {
  AutomacaoCadastro,
  AutomacaoStatus,
  AUTOMACAO_SQL,
  buscarCadastrosAutomacao,
  atualizarCadastroAutomacao,
  excluirCadastroAutomacao,
  ouvirCadastrosAutomacao,
} from '../../lib/automacao';

const STATUS: { id: AutomacaoStatus; label: string; badge: string; ativo: string }[] = [
  { id: 'novo', label: 'Novo', badge: 'bg-blue-100 text-blue-800', ativo: 'bg-blue-600 border-blue-600' },
  { id: 'em_ativacao', label: 'Em ativação', badge: 'bg-amber-100 text-amber-800', ativo: 'bg-amber-600 border-amber-600' },
  { id: 'ativado', label: 'Ativado', badge: 'bg-emerald-100 text-emerald-800', ativo: 'bg-emerald-600 border-emerald-600' },
  { id: 'cancelado', label: 'Cancelado', badge: 'bg-stone-200 text-stone-700', ativo: 'bg-stone-700 border-stone-700' },
];
const infoStatus = (s: string) => STATUS.find((x) => x.id === s) || STATUS[0];

function Linha({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2 text-xs">
      <span className="text-stone-500 sm:w-48 shrink-0">{rotulo}</span>
      <span className="text-stone-800 font-medium break-words">{valor}</span>
    </div>
  );
}

export function AdminAutomacaoTab() {
  const [cadastros, setCadastros] = useState<AutomacaoCadastro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tabelaNaoExiste, setTabelaNaoExiste] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | AutomacaoStatus>('todos');
  const [aberto, setAberto] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const r = await buscarCadastrosAutomacao();
    if (r.ok) {
      setCadastros(r.dados);
      setErro(null);
      setTabelaNaoExiste(false);
    } else {
      const falha = r as Extract<typeof r, { ok: false }>;
      setErro(falha.erro);
      setTabelaNaoExiste(falha.tabelaNaoExiste);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
    return ouvirCadastrosAutomacao(() => carregar());
  }, [carregar]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return cadastros.filter((c) => {
      const okStatus = filtro === 'todos' || c.status === filtro;
      const okBusca = !t || [c.nome_completo, c.nome_operacao, c.cidade_uf, c.whatsapp_automacao, c.whatsapp_pessoal, c.email]
        .some((v) => (v || '').toLowerCase().includes(t));
      return okStatus && okBusca;
    });
  }, [cadastros, busca, filtro]);

  const mudarStatus = async (c: AutomacaoCadastro, status: AutomacaoStatus) => {
    setCadastros((lista) => lista.map((x) => (x.id === c.id ? { ...x, status } : x)));
    const ok = await atualizarCadastroAutomacao(c.id, { status });
    if (!ok) carregar();
  };

  const salvarCampo = async (c: AutomacaoCadastro, campo: 'instancia' | 'anotacoes', valor: string) => {
    if ((c[campo] || '') === valor) return;
    setCadastros((lista) => lista.map((x) => (x.id === c.id ? { ...x, [campo]: valor } : x)));
    await atualizarCadastroAutomacao(c.id, { [campo]: valor });
  };

  const excluir = async (c: AutomacaoCadastro) => {
    if (!window.confirm(`Excluir o cadastro de ${c.nome_operacao}? Não dá para desfazer.`)) return;
    setCadastros((lista) => lista.filter((x) => x.id !== c.id));
    if (!(await excluirCadastroAutomacao(c.id))) carregar();
  };

  const exportarCsv = () => {
    const colunas: (keyof AutomacaoCadastro)[] = ['created_at', 'status', 'nome_completo', 'nome_operacao', 'cidade_uf', 'email',
      'whatsapp_pessoal', 'whatsapp_automacao', 'tipo_whatsapp', 'aparelhos_conectados', 'avisos_para', 'whatsapp_avisos',
      'vp_usuario', 'vp_analise_credito', 'apos_aprovacao', 'horario_atendimento', 'melhor_horario', 'celular_na_ativacao',
      'instancia', 'observacoes', 'anotacoes'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [colunas.join(';'), ...filtrados.map((c) => colunas.map((k) => esc(c[k])).join(';'))].join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadastros-automacao-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copiarSql = async () => {
    try {
      await navigator.clipboard.writeText(AUTOMACAO_SQL);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt('Copie o SQL abaixo:', AUTOMACAO_SQL);
    }
  };

  // Tabela ainda não criada no Supabase
  if (!carregando && tabelaNaoExiste) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-amber-200 p-6 space-y-4 shadow-md">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-amber-600" />
          <h2 className="text-base font-bold text-stone-900">Falta criar a tabela dos cadastros de automação</h2>
        </div>
        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-stone-700">
          <li>Clique em <b>Copiar SQL</b>.</li>
          <li>Abra o painel do Supabase → <b>SQL Editor</b> → <b>New query</b>.</li>
          <li>Cole, clique em <b>Run</b> e volte aqui em <b>Tentar de novo</b>.</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copiarSql}
            className="px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            {copiado ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copiado ? 'SQL copiado!' : 'Copiar SQL'}
          </button>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs font-bold">Abrir Supabase</a>
          <button type="button" onClick={carregar}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#3B0764] flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-pink-300" />
        </div>
        <div>
          <h2 className="text-lg font-black text-stone-900 leading-tight">Consigna Evolution · Cadastros</h2>
          <p className="text-xs text-stone-500">Distribuidores que enviaram o Formulário para Automação</p>
        </div>
      </div>

      {/* Contadores / filtros */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <button type="button" onClick={() => setFiltro('todos')}
          className={`p-3 rounded-2xl border text-left cursor-pointer backdrop-blur-md transition-all ${filtro === 'todos' ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-white/70 text-stone-800 border-white/80 hover:bg-white'}`}>
          <span className="text-xs font-semibold opacity-75 block">Total</span>
          <span className="text-2xl font-black">{cadastros.length}</span>
        </button>
        {STATUS.map((s) => (
          <button key={s.id} type="button" onClick={() => setFiltro(s.id)}
            className={`p-3 rounded-2xl border text-left cursor-pointer backdrop-blur-md transition-all ${filtro === s.id ? `${s.ativo} text-white shadow-md` : 'bg-white/70 text-stone-800 border-white/80 hover:bg-white'}`}>
            <span className="text-xs font-semibold opacity-75 block">{s.label}</span>
            <span className="text-2xl font-black">{cadastros.filter((c) => c.status === s.id).length}</span>
          </button>
        ))}
      </div>

      {/* Busca e ações */}
      <div className="bg-white/70 backdrop-blur-xl p-4 rounded-2xl border border-white/80 flex flex-col sm:flex-row items-center gap-3 shadow-md shadow-rose-950/5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, operação, cidade ou WhatsApp..."
            aria-label="Buscar cadastros de automação"
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-white/80 bg-white/80 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 shadow-inner" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button type="button" onClick={carregar}
            className="px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/80 hover:bg-white text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          <button type="button" onClick={exportarCsv} disabled={!filtrados.length}
            className="px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/80 hover:bg-white text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> CSV
          </button>
        </div>
      </div>

      {erro && !tabelaNaoExiste && (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">Não consegui carregar os cadastros: {erro}</p>
      )}

      {/* Lista */}
      {!carregando && !filtrados.length && !erro && (
        <div className="text-center py-14 bg-white/60 rounded-2xl border border-white/80">
          <Bot className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <p className="text-sm text-stone-600 font-semibold">Nenhum cadastro {filtro !== 'todos' ? 'com esse status' : 'ainda'}.</p>
          <p className="text-xs text-stone-500 mt-1">Os envios do formulário aparecem aqui na hora.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtrados.map((c) => {
          const st = infoStatus(c.status);
          const expandido = aberto === c.id;
          return (
            <article key={c.id} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/80 shadow-md shadow-rose-950/5 overflow-hidden">
              <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-stone-900 truncate">{c.nome_operacao}</h3>
                    <span className={`${st.badge} text-[11px] font-bold px-2.5 py-0.5 rounded-full`}>{st.label}</span>
                  </div>
                  <p className="text-xs text-stone-600">{c.nome_completo}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-500">
                    {c.cidade_uf && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.cidade_uf}</span>}
                    <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" />Automação: {c.whatsapp_automacao}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateBR(c.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="sr-only" htmlFor={`st-${c.id}`}>Status</label>
                  <select id={`st-${c.id}`} value={c.status} onChange={(e) => mudarStatus(c, e.target.value as AutomacaoStatus)}
                    className="text-xs font-semibold rounded-xl border border-stone-200 bg-white px-3 py-2 cursor-pointer">
                    {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  {c.whatsapp_pessoal && (
                    <a href={buildWhatsAppLink(c.whatsapp_pessoal, `Olá ${c.nome_completo.split(' ')[0]}! Recebi seu cadastro da automação Consigna Evolution (${c.nome_operacao}). Vamos combinar a ativação?`)}
                      target="_blank" rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}
                  <button type="button" onClick={() => setAberto(expandido ? null : c.id)} aria-expanded={expandido}
                    className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer">
                    {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} Detalhes
                  </button>
                </div>
              </div>

              {expandido && (
                <div className="border-t border-stone-100 bg-stone-50/60 p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Linha rotulo="E-mail" valor={c.email} />
                    <Linha rotulo="WhatsApp pessoal" valor={c.whatsapp_pessoal} />
                    <Linha rotulo="WhatsApp da automação" valor={`${c.whatsapp_automacao}${c.tipo_whatsapp ? ` (${c.tipo_whatsapp})` : ''}`} />
                    <Linha rotulo="Aparelhos já conectados" valor={c.aparelhos_conectados} />
                    <Linha rotulo="Avisos vão para" valor={c.avisos_para === 'Outro número' ? `Outro número: ${c.whatsapp_avisos || '-'}` : c.avisos_para} />
                    <Linha rotulo="Usuário Vendas Plus" valor={c.vp_usuario} />
                    <Linha rotulo="Tem Análise de Crédito?" valor={c.vp_analise_credito} />
                    <Linha rotulo="Após a aprovação" valor={c.apos_aprovacao} />
                    <Linha rotulo="Horário de atendimento" valor={c.horario_atendimento} />
                    <Linha rotulo="Melhor horário p/ ativação" valor={c.melhor_horario} />
                    <Linha rotulo="Celular na ativação?" valor={c.celular_na_ativacao} />
                    <Linha rotulo="Observações" valor={c.observacoes} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Termos aceitos: login {c.aceite_login ? '✓' : '✗'} · LGPD {c.aceite_lgpd ? '✓' : '✗'} · WhatsApp não oficial {c.aceite_whatsapp ? '✓' : '✗'}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="text-xs font-semibold text-stone-700 space-y-1">
                      <span>Identificador no robô (instância)</span>
                      <input type="text" defaultValue={c.instancia || ''} placeholder="ex.: romance-bc"
                        onBlur={(e) => salvarCampo(c, 'instancia', e.target.value.trim())}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-normal" />
                    </label>
                    <label className="text-xs font-semibold text-stone-700 space-y-1">
                      <span>Anotações internas</span>
                      <input type="text" defaultValue={c.anotacoes || ''} placeholder="ex.: ativado por ligação dia 20/11"
                        onBlur={(e) => salvarCampo(c, 'anotacoes', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-normal" />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => excluir(c)}
                      className="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Excluir cadastro
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
