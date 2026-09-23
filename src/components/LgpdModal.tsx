import { useState, useEffect } from 'react';
import { 
  Shield, 
  X, 
  Lock, 
  CheckCircle2, 
  FileText, 
  UserCheck, 
  Cookie, 
  Scale, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { BusinessSettings } from '../types';

export type LegalTab = 'privacy' | 'terms' | 'cookies';

interface LgpdModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  initialTab?: LegalTab;
}

export function LgpdModal({ isOpen, onClose, settings, initialTab = 'privacy' }: LgpdModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-white/80 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-900 via-rose-950 to-stone-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-700/60 flex items-center justify-center text-rose-200 border border-white/20 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Termos Legais, Privacidade & LGPD
              </h3>
              <p className="text-xs text-rose-200">
                Romance Itapema • Transparência e Segurança Jurídica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-2 sm:px-6 bg-stone-100/90 border-b border-stone-200/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Termos de Uso & Revenda Sem Investimento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Política de Privacidade (LGPD)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cookies')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'cookies'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>Política de Cookies</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-stone-700 text-sm leading-relaxed">
          
          {/* TAB 1: TERMOS DE USO & CONTRATO DE REVENDA SEM INVESTIMENTO */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              <div className="bg-rose-50/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-200/80 flex items-start gap-3 text-xs text-rose-950">
                <Scale className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>
                  Estes Termos regulamentam as condições comerciais do modelo de revenda sem investimento prévio de lingeries, moda íntima e Catálogo Favorita distribuídos pela <strong>Romance Itapema</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Modelo 100% Sem Investimento Inicial</span>
                </h4>
                <p className="text-xs text-stone-600 pl-8">
                  A revendedora recebe a maleta ou mostruário de lingeries sem investimento, sem necessidade de pagamento antecipado, compra de kit ou taxa de matrícula. A propriedade dos produtos permanece com a distribuidora até a liquidação no acerto.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Ciclo de Vendas e Acerto de 40 Dias</span>
                </h4>
                <p className="text-xs text-stone-600 pl-8">
                  O ciclo padrão de revenda tem duração de <strong>40 (quarenta) dias corridos</strong> a partir da data de entrega do mostruário. Ao final deste período:
                </p>
                <ul className="text-xs space-y-1 list-disc list-inside text-stone-600 pl-9">
                  <li>A revendedora realiza o acerto financeiro exclusivamente sobre as peças efetivamente vendidas;</li>
                  <li>Todas as peças não vendidas podem ser devolvidas integralmente, sem qualquer custo ou penalidade;</li>
                  <li>A revendedora pode renovar o mostruário retirando novas peças e lançamentos para o ciclo seguinte.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Margem de Lucro & Regra do Catálogo Favorita</span>
                </h4>
                <div className="text-xs text-stone-600 pl-8 space-y-2">
                  <p>
                    • <strong>Lucro Base (30%):</strong> Aplicado sobre o total de vendas do mostruário sem investimento de lingerie.
                  </p>
                  <p>
                    • <strong>Lucro Máximo (40%):</strong> Ativado mediante a inclusão de pedido no <strong>Catálogo Favorita</strong> com valor entre <strong>R$ 400,00 (mínimo)</strong> e <strong>R$ 600,00 (limite no primeiro pedido)</strong>. Ao atingir essa meta, toda a margem do ciclo passa para 40% de lucro líquido.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">4</span>
                  <span>Requisitos de Elegibilidade e Guarda dos Produtos</span>
                </h4>
                <ul className="text-xs space-y-1 list-disc list-inside text-stone-600 pl-8">
                  <li>Ter idade mínima de 18 anos completos na data do cadastro;</li>
                  <li>Apresentar CPF próprio e válido e comprovante de residência;</li>
                  <li>Residir nas cidades e regiões atendidas pela distribuidora;</li>
                  <li>Zelar pela perfeita conservação, etiquetas e integridade das peças recebidas.</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 2: POLÍTICA DE PRIVACIDADE & LGPD */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              <div className="bg-rose-50/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-200/80 flex items-start gap-3 text-xs text-rose-950">
                <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>
                  A <strong>Romance Itapema</strong> valoriza e respeita a privacidade de suas revendedoras e candidatas. Tratamos seus dados pessoais com total transparência, sigilo e rigor técnico em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>1. Dados Coletados no Pré-Cadastro e Finalidade</span>
                </h4>
                <p className="text-xs text-stone-600">
                  Para viabilizar a entrega de mercadorias sem investimento prévio, coletamos estritamente os dados necessários:
                </p>
                <ul className="text-xs space-y-1.5 list-disc list-inside text-stone-600 pl-1">
                  <li><strong>Nome Completo:</strong> Identificação individual da titular do cadastro e emissão dos termos de revenda sem investimento.</li>
                  <li><strong>CPF:</strong> Análise cadastral de crédito e elaboração dos recibos de acerto a cada 40 dias.</li>
                  <li><strong>Data de Nascimento:</strong> Comprovação da maioridade legal (18+ anos) exigida para a revenda.</li>
                  <li><strong>Telefone / WhatsApp:</strong> Contato direto para agendamento de entrega do mostruário e lembretes de ciclo.</li>
                  <li><strong>Cidade / Região:</strong> Roteirização de entrega da distribuidora em Santa Catarina.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>2. Bases Legais do Tratamento (Art. 7º da LGPD)</span>
                </h4>
                <p className="text-xs text-stone-600">
                  O tratamento é amparado pelo Consentimento explícito da titular (inciso I), execução de procedimentos pré-contratuais para liberação de mostruário (inciso V) e Legítimo Interesse (inciso IX). Os dados nunca são comercializados com terceiros.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-rose-600" />
                  <span>3. Direitos da Titular dos Dados (Art. 18)</span>
                </h4>
                <p className="text-xs text-stone-600">
                  Você pode a qualquer momento confirmar a existência do tratamento, solicitar correção de dados inexatos, revogar o consentimento ou pedir a exclusão dos dados através do canal oficial de atendimento.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/70 border border-stone-200/80 text-xs text-stone-600 space-y-1">
                <p className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                  <span>Encarregado de Proteção de Dados (DPO):</span>
                </p>
                <p>Distribuição Oficial Romance Itapema • WhatsApp: <strong>{settings.displayWhatsApp}</strong></p>
                <p>Distribuidor Responsável: <strong>{settings.distributorName || 'Anderson Rodrigues'}</strong></p>
              </div>

            </div>
          )}

          {/* TAB 3: POLÍTICA DE COOKIES */}
          {activeTab === 'cookies' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              <div className="bg-rose-50/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-200/80 flex items-start gap-3 text-xs text-rose-950">
                <Cookie className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>
                  Esta Política esclarece como utilizamos cookies e tecnologias de armazenamento local para garantir a melhor experiência de navegação e segurança na plataforma da <strong>Romance Itapema</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">Categorias de Cookies Utilizados:</h4>
                
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">1. Cookies Estritamente Necessários</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-200 text-stone-800">Obrigatório</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Essenciais para navegação segura com certificado SSL, envio do pré-cadastro, integridade dos formulários e segurança do painel administrativo.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">2. Cookies de Funcionalidade & Preferências</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">Opcional</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Armazenam o plano de lucro selecionado no simulador de lucros (30% ou 40%) para preenchimento ágil no formulário de pré-cadastro.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">3. Comunicação Direta</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">Opcional</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Facilitam a conexão imediata com o WhatsApp da Distribuição Romance Itapema com mensagens pré-formatadas para suporte rápido.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 text-sm">Como gerenciar seus Cookies:</h4>
                <p className="text-xs text-stone-600">
                  Você pode alterar ou revogar suas preferências a qualquer momento clicando no link <strong>"Preferências de Cookies"</strong> no rodapé da página ou configurando seu navegador.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-stone-500">
            Atualizado em conformidade com as diretrizes da ANPD e Código de Defesa do Consumidor.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/20 border border-white/20 cursor-pointer"
            >
              Concordar e Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
