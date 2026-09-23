import { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  DollarSign, 
  Shirt, 
  FileText, 
  MessageCircle, 
  Layers, 
  HeartHandshake,
  Tag,
  ArrowRight,
  Info
} from 'lucide-react';
import { faqs } from '../data/initialData';
import { FaqItem, BusinessSettings } from '../types';
import { buildWhatsAppLink } from '../utils/validators';

interface FaqSectionProps {
  settings?: BusinessSettings;
  onScrollToForm?: () => void;
}

export function FaqSection({ settings, onScrollToForm }: FaqSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'faq-1': true, 'faq-4': true, 'faq-7': true });

  const categories = [
    { id: 'todos', label: 'Todas as Dúvidas', icon: Layers, count: faqs.length },
    { id: 'consignacao', label: 'Modelo Sem Investimento', icon: Package, count: faqs.filter(f => f.category === 'consignacao').length },
    { id: 'lucros', label: 'Lucros & Acerto 40 Dias', icon: DollarSign, count: faqs.filter(f => f.category === 'lucros').length },
    { id: 'cuidados', label: 'Cuidados com as Peças', icon: Shirt, count: faqs.filter(f => f.category === 'cuidados').length },
    { id: 'produtos', label: 'Produtos & Mala', icon: Tag, count: faqs.filter(f => f.category === 'produtos').length },
    { id: 'cadastro', label: 'Requisitos & LGPD', icon: ShieldCheck, count: faqs.filter(f => f.category === 'cadastro').length },
  ];

  // Filter FAQs based on active category and search term
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = selectedCategory === 'todos' || faq.category === selectedCategory;
      const normalizedQuery = searchQuery.toLowerCase().trim();
      
      if (!normalizedQuery) return matchesCategory;

      const matchesText = 
        faq.q.toLowerCase().includes(normalizedQuery) ||
        faq.a.toLowerCase().includes(normalizedQuery) ||
        faq.highlight?.toLowerCase().includes(normalizedQuery) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesText;
    });
  }, [selectedCategory, searchQuery]);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {};
    filteredFaqs.forEach((faq) => {
      allOpen[faq.id] = true;
    });
    setOpenIds(allOpen);
  };

  const handleCollapseAll = () => {
    setOpenIds({});
  };

  const whatsappNumber = settings?.officialWhatsApp || '5547997626121';
  const whatsappFaqUrl = buildWhatsAppLink(
    whatsappNumber,
    `Olá ${settings?.distributorName || 'Anderson'}! Estava lendo o FAQ da Romance Itapema e gostaria de tirar uma dúvida sobre a revenda sem investimento.`
  );

  return (
    <section id="faq" className="py-24 relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-rose-200/25 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md text-rose-900 text-xs font-bold px-4 py-1.5 rounded-full border border-white/90 shadow-xs">
            <HelpCircle className="w-4 h-4 text-rose-600" />
            <span>Guia Completo da Revendedora Romance Itapema</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 tracking-tight">
            Perguntas Frequentes & Regras de Negócio
          </h2>

          <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Tudo o que você precisa saber sobre o modelo de revenda sem investimento, lucros de 30% a 40%, acerto a cada 40 dias, cuidados com as peças e segurança LGPD.
          </p>
        </div>

        {/* Essential Care Notice Banner (Cuidado com as Peças e Bojos) */}
        <div className="mb-10 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-pink-500/10 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-amber-300/40 shadow-lg shadow-amber-950/5 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25 border border-white/30">
              <Sparkles className="w-6 h-6 text-amber-100" />
            </div>
            
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-base sm:text-lg">
                  Regras de Ouro: Cuidados com as Peças Sem Investimento
                </h3>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-amber-300/60">
                  Importante
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                As peças da sua maleta são 100% sem investimento prévio. Para garantir a renovação contínua e sem custos: 
                <strong> não devolva peças sujas</strong> (sem manchas de maquiagem, batom ou suor), 
                <strong> preserve os bojos dos sutiãs</strong> (nunca dobre ou amasse ao meio), 
                <strong> mantenha as etiquetas originais afixadas</strong> e proteja o mostruário contra odores.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCategory('cuidados')}
              className="bg-white/90 hover:bg-white text-stone-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-white shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-start md:self-center"
            >
              <span>Ver Recomendações</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
            </button>
          </div>
        </div>

        {/* Search Bar & Quick Controls */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Digite sua dúvida (ex: 40%, catálogo favorita, bojo, spc, devolver peças, acerto)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 text-sm rounded-2xl border border-white/80 bg-white/80 backdrop-blur-md focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-rose-500/15 focus:border-rose-400 shadow-md shadow-rose-950/5 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-md transition-colors"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer backdrop-blur-md border ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25'
                      : 'bg-white/70 hover:bg-white text-stone-700 border-white/80 shadow-xs'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-rose-600'}`} />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Expand / Collapse Controls */}
          <div className="flex items-center justify-between text-xs text-stone-500 px-1 pt-1">
            <span>
              Exibindo <strong>{filteredFaqs.length}</strong> de {faqs.length} perguntas
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExpandAll}
                className="hover:text-rose-600 font-semibold transition-colors cursor-pointer"
              >
                Expandir Todas
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="hover:text-rose-600 font-semibold transition-colors cursor-pointer"
              >
                Recolher Todas
              </button>
            </div>
          </div>
        </div>

        {/* Accordion FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white/75 backdrop-blur-xl rounded-3xl p-10 text-center border border-white/80 space-y-3 shadow-md">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-stone-800 text-base">Nenhuma pergunta encontrada</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Não encontramos nenhuma dúvida com o termo "{searchQuery}". Tente usar palavras-chave como "lucro", "acerto" ou "devolução".
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('todos');
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                Mostrar Todas as Perguntas
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = Boolean(openIds[faq.id]);
              return (
                <div
                  key={faq.id}
                  className={`bg-white/75 backdrop-blur-xl rounded-3xl border transition-all duration-300 shadow-md shadow-rose-950/5 overflow-hidden ${
                    isOpen 
                      ? 'border-rose-300/80 ring-2 ring-rose-500/10' 
                      : 'border-white/80 hover:border-rose-200/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 font-bold text-stone-900 text-sm sm:text-base hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200/80">
                          {faq.categoryLabel}
                        </span>
                        {faq.tags?.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="text-[10px] font-semibold text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h4 className="font-serif-luxury font-bold text-stone-900 text-base sm:text-lg leading-snug">
                        {faq.q}
                      </h4>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                      isOpen 
                        ? 'bg-rose-600 text-white border-rose-600 rotate-180 shadow-xs' 
                        : 'bg-white/90 text-stone-600 border-white/80'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-stone-700 text-xs sm:text-sm leading-relaxed border-t border-rose-100/60 animate-in fade-in duration-200 space-y-4">
                      
                      {/* Formatted Answer Paragraphs */}
                      <div className="space-y-2 whitespace-pre-line text-stone-700">
                        {faq.a}
                      </div>

                      {/* Highlight Tip Card */}
                      {faq.highlight && (
                        <div className="bg-rose-50/70 border border-rose-200/70 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-rose-950 font-medium shadow-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Destaque Romance:</strong> {faq.highlight}</span>
                        </div>
                      )}

                      {/* Footer tags */}
                      {faq.tags && faq.tags.length > 0 && (
                        <div className="pt-2 flex items-center gap-1.5 flex-wrap text-[11px] text-stone-400">
                          <span>Tags relacionadas:</span>
                          {faq.tags.map((tag, i) => (
                            <span key={i} className="bg-white/80 border border-stone-200/80 text-stone-600 px-2 py-0.5 rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* WhatsApp Direct Help & CTA Card */}
        <div className="mt-14 bg-white/80 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-white/90 shadow-xl shadow-rose-950/5 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25 border border-white/30">
            <MessageCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-900">
              Ainda ficou com alguma dúvida sobre a revenda?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Nossa equipe de consultoras da Romance Itapema está pronta para te atender no WhatsApp e explicar cada detalhe da sua maleta sem investimento.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={whatsappFaqUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chamar Consultora no WhatsApp</span>
            </a>

            {onScrollToForm && (
              <button
                type="button"
                onClick={onScrollToForm}
                className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-rose-600/25 border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-rose-200" />
                <span>Fazer Meu Pré-Cadastro Agora</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
