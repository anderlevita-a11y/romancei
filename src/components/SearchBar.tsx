import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  ArrowRight, 
  Sparkles, 
  Package, 
  DollarSign, 
  Film, 
  Star, 
  Instagram, 
  Store, 
  HelpCircle, 
  ShieldCheck, 
  Smartphone, 
  MessageCircle, 
  TrendingUp,
  Tag,
  CheckCircle2,
  Clock,
  Gift,
  Share2
} from 'lucide-react';
import { BusinessSettings } from '../types';
import { buildWhatsAppLink } from '../utils/validators';

export interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Geral' | 'Cadastro' | 'Regras & Prazos' | 'Lucros & Ganhos' | 'Catálogos' | 'Vídeos & Fotos' | 'Prêmios & Promoções' | 'Lojas & Contato' | 'Dúvidas Frequentes';
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  targetId?: string;
  customAction?: 'instagram_modal' | 'lgpd_modal' | 'whatsapp' | 'app_download' | 'share_modal' | 'referral_modal';
  badge?: string;
  badgeColor?: string;
}

interface SearchBarProps {
  settings: BusinessSettings;
  onScrollToSection: (elementId: string) => void;
  onOpenInstagramPromo?: () => void;
  onOpenLgpd?: () => void;
  onOpenReferralModal?: () => void;
  onOpenShare?: () => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export function SearchBar({
  settings,
  onScrollToSection,
  onOpenInstagramPromo,
  onOpenLgpd,
  onOpenReferralModal,
  onOpenShare,
  isOpen,
  onClose,
  onOpen
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keyboard shortcut (Cmd+K / Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          onOpen();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpen, onClose]);

  // Comprehensive searchable topics database
  const searchTopics: SearchItem[] = useMemo(() => [
    {
      id: 'cadastro-sem-investimento',
      title: 'Quero Revender (Pré-Cadastro Sem Investimento)',
      subtitle: 'Formulário oficial 100% gratuito. Comece sem capital inicial e sem consulta prévia ao SPC/Serasa.',
      category: 'Cadastro',
      keywords: ['cadastro', 'formulario', 'pre-cadastro', 'inscrever', 'comecar', 'iniciar', 'trabalhar', 'renda extra', 'spc', 'serasa', 'sem consulta', 'gratis', 'revender', 'quero revender'],
      icon: Sparkles,
      targetId: 'cadastro',
      badge: 'Zero Custo',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      id: 'como-funciona-40-dias',
      title: 'Como Funciona o Ciclo de 40 Dias',
      subtitle: 'Entenda o passo a passo: você recebe as peças, vende durante 40 dias e devolve o que sobrar sem dívidas.',
      category: 'Regras & Prazos',
      keywords: ['como funciona', '40 dias', 'ciclo', 'prazo', 'regras', 'etapas', 'passo a passo', 'devolver', 'devolucao', 'consignado', 'sem risco', 'modelo'],
      icon: Clock,
      targetId: 'como-funciona',
      badge: '40 Dias',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
    },
    {
      id: 'simulador-lucros',
      title: 'Simulador de Lucro & Rendimentos (30% a 40%)',
      subtitle: 'Simule seus rendimentos mensais com vendas de Lingerie Romance e produtos do Catálogo Favorita.',
      category: 'Lucros & Ganhos',
      keywords: ['simulador', 'lucro', 'lucros', 'ganhos', 'quanto ganho', 'calcular', 'dinheiro', 'renda', '30%', '40%', 'porcentagem', 'tabela'],
      icon: DollarSign,
      targetId: 'simulador-lucro',
      badge: 'Até 40%',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    {
      id: 'catalogo-favorita-40',
      title: 'Catálogo Favorita (Lucro de 40%)',
      subtitle: 'Regra do catálogo impresso e digital: lucro de 40% com primeiro pedido entre R$ 400 e R$ 600.',
      category: 'Catálogos',
      keywords: ['catalogo', 'favorita', 'catalogo favorita', 'revista', '40%', 'pedido minimo', '400', '600', 'lucro 40', 'produtos favorita'],
      icon: Package,
      targetId: 'catalogo-favorita',
      badge: '40% Lucro',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    {
      id: 'indique-e-ganhe-indicacao',
      title: 'Indique & Ganhe (R$ 10,00 por Kit Entregue)',
      subtitle: 'Gere seu cupom de indicação exclusivo no CPF, indique amigas para revender e ganhe R$ 10,00 via Pix a cada mostruário entregue.',
      category: 'Prêmios & Promoções',
      keywords: ['indique', 'indicar', 'indique e ganhe', 'cupom', 'indicacao', 'pix', '10 reais', 'creditos', 'amiga', 'indique amigas', 'ganhe', 'convidar'],
      icon: Gift,
      customAction: 'referral_modal',
      badge: 'R$ 10 Pix',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    {
      id: 'promocao-estrelas-2026',
      title: 'Promoção Estrelas Romance 2026 (R$ 450 Mil em Prêmios)',
      subtitle: 'Concorra a 1 Carro 0km, 2 Motos Yamaha e diversos prêmios acumulando cupons nas suas vendas.',
      category: 'Prêmios & Promoções',
      keywords: ['estrelas', 'promocao', 'premios', 'sorteio', 'carro', 'moto', 'yamaha', '450 mil', 'cupons', 'estrelas romance', '2026', 'concorrer'],
      icon: Star,
      targetId: 'romance-estrelas',
      badge: 'R$ 450.000',
      badgeColor: 'bg-amber-500 text-stone-950 font-black border-amber-600'
    },
    {
      id: 'galeria-fotos-colecoes',
      title: 'Galeria de Fotos do Mostruário (Novidades)',
      subtitle: 'Veja fotos em alta definição das lingeries, conjuntos, linha fitness e moda íntima.',
      category: 'Vídeos & Fotos',
      keywords: ['fotos', 'mostruario', 'galeria', 'colecao', 'lingerie', 'conjuntos', 'sutia', 'calcinha', 'fitness', 'fotos do mostruario', 'alta resolucao', 'pecas'],
      icon: Tag,
      targetId: 'galeria-fotos',
      badge: 'Fotos HD',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
    },
    {
      id: 'videos-oficiais-romance-play',
      title: 'Sessão de Vídeos Oficiais (Romance Play)',
      subtitle: 'Assista a unboxings, demonstrações de peças, depoimentos e vídeos institucionais da marca.',
      category: 'Vídeos & Fotos',
      keywords: ['videos', 'romance play', 'assistir', 'unboxing', 'apresentacao', 'demonstracao', 'depoimentos em video', 'play'],
      icon: Film,
      targetId: 'sessao-videos',
      badge: 'Vídeos',
      badgeColor: 'bg-rose-600 text-white border-rose-700'
    },
    {
      id: 'produtos-lingeries',
      title: 'Linhas Comerciais Oficiais Romance (7 Linhas)',
      subtitle: 'Fitness, Seamless, Casual, Moda Íntima, Cosméticos Favorita, RMC Casa e Sex Shop.',
      category: 'Vídeos & Fotos',
      keywords: ['produtos', 'linhas', 'linhas comerciais', 'fitness', 'seamless', 'casual', 'moda intima', 'intima', 'cosmeticos', 'rmc casa', 'sex shop', 'lingerie', 'calcinhas', 'sutias', 'plus size', 'noite', 'baby doll', 'qualidade'],
      icon: Tag,
      targetId: 'produtos',
      badge: '7 Linhas Oficiais',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
    },
    {
      id: 'promocao-instagram-brinde',
      title: 'Promoção Instagram & Brinde Exclusivo',
      subtitle: `Siga @${(settings.instagramHandle || 'romanceitapema').replace('@', '')}, tire um print e ganhe um brinde na retirada do mostruário.`,
      category: 'Prêmios & Promoções',
      keywords: ['instagram', 'brinde', 'presente', 'ganhar brinde', 'promocao instagram', 'rede social', 'seguir'],
      icon: Instagram,
      customAction: 'instagram_modal',
      targetId: 'promocao-instagram',
      badge: 'Brinde Grátis',
      badgeColor: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold'
    },
    {
      id: 'depoimentos-revendedoras',
      title: 'Depoimentos de Revendedoras Romance',
      subtitle: 'Histórias reais de mulheres que transformaram sua renda com zero investimento.',
      category: 'Geral',
      keywords: ['depoimentos', 'avaliacoes', 'opiniao', 'historias de sucesso', 'clientes', 'revendedoras', 'sc'],
      icon: TrendingUp,
      targetId: 'depoimentos',
      badge: 'Depoimentos',
      badgeColor: 'bg-stone-100 text-stone-800 border-stone-300'
    },
    {
      id: 'faq-duvidas-spc',
      title: 'Posso revender mesmo com restrição no SPC/Serasa?',
      subtitle: 'Sim! Nosso modelo sem investimento é inclusivo e não exige aprovação bancária prévia.',
      category: 'Dúvidas Frequentes',
      keywords: ['spc', 'serasa', 'nome sujo', 'restricao', 'restricao no nome', 'score', 'aprovacao', 'credito'],
      icon: HelpCircle,
      targetId: 'faq',
      badge: 'FAQ',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
      id: 'faq-duvidas-devolucao',
      title: 'E se eu não vender todas as peças do mostruário?',
      subtitle: 'Você devolve 100% das peças não vendidas sem nenhuma taxa, juros ou penalidade.',
      category: 'Dúvidas Frequentes',
      keywords: ['e se nao vender', 'devolver pecas', 'sobra', 'risco', 'prejuizo', 'divida', 'taxa', 'devolucao'],
      icon: HelpCircle,
      targetId: 'faq',
      badge: 'FAQ',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
      id: 'faq-duvidas-cidades',
      title: 'Atendimento e Regiões de Distribuição',
      subtitle: 'Atendimento oficial e suporte para diversas cidades e regiões.',
      category: 'Lojas & Contato',
      keywords: ['cidades', 'onde entrega', 'regiao', 'atendimento', 'distribuicao', 'santa catarina'],
      icon: Store,
      targetId: 'faq',
      badge: 'Distribuição',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      id: 'lojas-fisicas-enderecos',
      title: 'Lojas Físicas & Pontos de Retirada (Santa Catarina)',
      subtitle: `Atendimento com vendedoras parceiras em SC. Veja endereços, contatos e catálogo.`,
      category: 'Lojas & Contato',
      keywords: ['loja fisica', 'endereco', 'onde fica', 'vendedora', 'joinville', 'hevilin', 'florianopolis', 'warla', 'localizacao', 'mapa', 'retirada', 'ponto de apoio'],
      icon: Store,
      targetId: 'faq',
      badge: 'Lojas SC',
      badgeColor: 'bg-stone-800 text-white'
    },
    {
      id: 'app-download-romance',
      title: 'Baixar Aplicativo Oficial Romance (Play Store & App Store)',
      subtitle: 'Acesse catálogo digital, faça pedidos e acompanhe seus ciclos pelo celular.',
      category: 'Geral',
      keywords: ['app', 'aplicativo', 'celular', 'baixar', 'download', 'play store', 'app store', 'android', 'iphone', 'ios'],
      icon: Smartphone,
      customAction: 'app_download',
      badge: 'Download APP',
      badgeColor: 'bg-stone-900 text-white'
    },
    {
      id: 'whatsapp-suporte-direto',
      title: 'Falar com o Distribuidor no WhatsApp',
      subtitle: `Tire dúvidas com ${settings.distributorName || 'Anderson Rodrigues'} pelo WhatsApp oficial ${settings.displayWhatsApp || '(47) 99762-6121'}.`,
      category: 'Lojas & Contato',
      keywords: ['whatsapp', 'contato', 'telefone', 'falar com atendente', 'anderson', 'suporte', 'atendimento', 'duvida no whats'],
      icon: MessageCircle,
      customAction: 'whatsapp',
      badge: 'WhatsApp',
      badgeColor: 'bg-emerald-600 text-white'
    },
    {
      id: 'termos-privacidade-lgpd',
      title: 'Termos de Uso, Privacidade e Segurança LGPD',
      subtitle: 'Conheça nossos compromissos legais de segurança de dados e privacidade da revendedora.',
      category: 'Geral',
      keywords: ['lgpd', 'privacidade', 'termos', 'seguranca', 'dados', 'contrato', 'politica de privacidade'],
      icon: ShieldCheck,
      customAction: 'lgpd_modal',
      badge: 'LGPD',
      badgeColor: 'bg-stone-200 text-stone-800'
    }
  ], [settings]);

  // Filter items based on search query
  const filteredResults = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (!raw) {
      return searchTopics.slice(0, 8); // Display popular suggestions by default
    }

    const words = raw.split(/\s+/);

    return searchTopics.filter(item => {
      const matchTitle = words.every(w => item.title.toLowerCase().includes(w));
      const matchSubtitle = words.every(w => item.subtitle.toLowerCase().includes(w));
      const matchCategory = words.every(w => item.category.toLowerCase().includes(w));
      const matchKeywords = item.keywords.some(k => words.every(w => k.includes(w) || w.includes(k)));

      return matchTitle || matchSubtitle || matchCategory || matchKeywords;
    });
  }, [query, searchTopics]);

  // Adjust selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults.length]);

  const handleSelectItem = (item: SearchItem) => {
    onClose();

    if (item.customAction === 'instagram_modal' && onOpenInstagramPromo) {
      onOpenInstagramPromo();
      return;
    }

    if (item.customAction === 'referral_modal' && onOpenReferralModal) {
      onOpenReferralModal();
      return;
    }

    if (item.customAction === 'share_modal' && onOpenShare) {
      onOpenShare();
      return;
    }

    if (item.customAction === 'lgpd_modal' && onOpenLgpd) {
      onOpenLgpd();
      return;
    }

    if (item.customAction === 'whatsapp') {
      const url = buildWhatsAppLink(
        settings.officialWhatsApp,
        `Olá ${settings.distributorName || 'Anderson'}! Encontrei o contato através da busca no site da Romance Itapema e gostaria de tirar uma dúvida.`
      );
      window.open(url, '_blank');
      return;
    }

    if (item.customAction === 'app_download') {
      const playStore = 'https://play.google.com/store/apps/details?id=com.romance.app';
      window.open(playStore, '_blank');
      return;
    }

    if (item.targetId) {
      onScrollToSection(item.targetId);
      
      // Highlight target element with an optical pulse glow
      setTimeout(() => {
        const el = document.getElementById(item.targetId!);
        if (el) {
          el.classList.add('ring-4', 'ring-rose-500/50', 'transition-all', 'duration-500', 'rounded-3xl');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-rose-500/50');
          }, 2500);
        }
      }, 400);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    }
  };

  const popularPills = [
    { label: 'Indique & Ganhe (R$ 10)', query: 'indique' },
    { label: 'Zero Investimento', query: 'investimento' },
    { label: 'Lucro de 40%', query: '40%' },
    { label: 'Ciclo 40 Dias', query: '40 dias' },
    { label: 'Catálogo Favorita', query: 'favorita' },
    { label: 'Promoção Estrelas', query: 'estrelas' },
    { label: 'Fotos do Mostruário', query: 'fotos' },
    { label: 'Vídeos Oficiais', query: 'videos' },
    { label: 'Lojas Físicas', query: 'loja fisica' },
    { label: 'SPC / Serasa', query: 'spc' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:p-12 animate-in fade-in duration-200">
      
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div 
        id="search-dialog-modal"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-200"
      >
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/70 flex items-center gap-3">
          <Search className="w-5 h-5 text-rose-600 shrink-0" />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="O que você procura? Ex: 40 dias, lucro, catálogo, SPC, fotos..."
            className="w-full bg-transparent text-base sm:text-lg text-stone-900 placeholder:text-stone-400 focus:outline-hidden font-medium"
            autoComplete="off"
            spellCheck="false"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-stone-500 bg-white border border-stone-200 px-2 py-1 rounded-lg shadow-2xs cursor-pointer hover:bg-stone-100"
          >
            <span>ESC</span>
          </button>
        </div>

        {/* Quick Topics Pills */}
        <div className="px-4 py-2.5 bg-white border-b border-stone-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-stone-600 font-bold shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Assuntos:</span>
          </span>
          {popularPills.map((pill) => (
            <button
              key={pill.label}
              onClick={() => setQuery(pill.query)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                query.toLowerCase() === pill.query.toLowerCase()
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-900 border-stone-200/80 hover:border-rose-300'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 divide-y divide-stone-50"
        >
          {filteredResults.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <HelpCircle className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-stone-800 font-bold text-base">Nenhum resultado encontrado para &quot;{query}&quot;</p>
              <p className="text-stone-500 text-xs max-w-sm mx-auto">
                Tente buscar por termos como &quot;investimento&quot;, &quot;lucro&quot;, &quot;40 dias&quot;, &quot;catálogo&quot; ou fale direto no WhatsApp.
              </p>
              <button
                onClick={() => {
                  const url = buildWhatsAppLink(settings.officialWhatsApp, `Olá! Fiz uma busca no site por "${query}" e gostaria de mais informações.`);
                  window.open(url, '_blank');
                }}
                className="mt-3 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Perguntar sobre &quot;{query}&quot; no WhatsApp</span>
              </button>
            </div>
          ) : (
            filteredResults.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-2xl flex items-start justify-between gap-3 transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-50 to-pink-50/60 border border-rose-200/80 shadow-xs scale-[0.998]'
                      : 'hover:bg-stone-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      isSelected ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'bg-stone-100 text-stone-600 group-hover:bg-rose-100 group-hover:text-rose-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-stone-900 text-sm sm:text-base leading-tight group-hover:text-rose-950">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${item.badgeColor || 'bg-stone-100 text-stone-700 border-stone-200'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {item.subtitle}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-stone-400 font-medium">
                        <span className="text-rose-700 font-semibold">{item.category}</span>
                        <span>•</span>
                        <span className="group-hover:text-stone-700 transition-colors">Clique para navegar até a seção</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-2 rounded-xl shrink-0 transition-all ${
                    isSelected ? 'text-rose-600 translate-x-0.5' : 'text-stone-300 opacity-0 group-hover:opacity-100'
                  }`}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer Hints */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 text-stone-500 text-xs flex items-center justify-between px-4">
          <div className="flex items-center gap-3 text-[11px] text-stone-400">
            <span className="hidden sm:inline">Use <kbd className="bg-white border px-1.5 py-0.5 rounded-sm text-stone-600 font-mono text-[10px]">↑</kbd> <kbd className="bg-white border px-1.5 py-0.5 rounded-sm text-stone-600 font-mono text-[10px]">↓</kbd> para navegar</span>
            <span className="hidden sm:inline">e <kbd className="bg-white border px-1.5 py-0.5 rounded-sm text-stone-600 font-mono text-[10px]">Enter</kbd> para abrir</span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-600 font-semibold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Navegação Instantânea</span>
          </div>
        </div>

      </div>
    </div>
  );
}
