import { Sparkles, Heart, CheckCircle2, ArrowRight, ExternalLink, BookOpen, ShoppingBag, ShieldCheck, Flame } from 'lucide-react';
import { productCategories } from '../data/initialData';
import { BusinessSettings, CommercialLine } from '../types';
import { resolveStorageUrl } from '../utils/validators';

const OFFICIAL_LINE_TITLES: Record<string, string> = {
  fitness: 'Fitness',
  seamless: 'Seamless',
  casual: 'Casual',
  intima: 'Moda Íntima',
  cosmeticos: 'Cosméticos',
  rmc_casa: 'RMC Casa',
  sex_shop: 'Sex Shop',
};

interface ProductShowcaseProps {
  settings?: BusinessSettings;
  commercialLines?: CommercialLine[];
  onScrollToForm: (reason?: string) => void;
}

export function ProductShowcase({ settings, commercialLines, onScrollToForm }: ProductShowcaseProps) {
  const catalogoUrl = settings?.catalogoFavoritaUrl || 'https://catalogofavorita.com.br/';
  const rawLines = commercialLines && commercialLines.length > 0 ? commercialLines : productCategories;
  
  // Mapeia e garante os nomes oficiais no frontend
  const displayedLines = rawLines
    .filter((line) => line.active !== false)
    .map((line) => {
      const officialTitle = OFFICIAL_LINE_TITLES[line.id] || line.title;
      return {
        ...line,
        title: officialTitle,
      };
    });

  return (
    <section id="produtos" className="py-20 relative overflow-hidden bg-gradient-to-b from-stone-50/50 via-white to-stone-50/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200/80 text-rose-800 text-xs uppercase font-extrabold tracking-widest px-4 py-1.5 rounded-full shadow-xs">
            <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
            <span>Mix Completo de Alta Demanda</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
            Nossas Linhas Comerciais Oficiais
          </h2>
          <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
            Uma variedade pensada estrategicamente para você atender clientes de todos os perfis, aumentar o ticket médio e lucrar até 40% em cada ciclo.
          </p>
        </div>

        {/* Categories Grid - Commercial Lines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedLines.map((cat, idx) => {
            const isFavorita = Boolean(cat.isFavorita);
            return (
              <div
                key={cat.id || idx}
                className="bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden border border-stone-200/80 shadow-md shadow-rose-950/5 hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col group"
              >
                {/* Photo Container */}
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  <img
                    src={resolveStorageUrl(cat.image)}
                    alt={`Linha ${cat.title} - Romance Itapema`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback seguro caso ocorra qualquer bloqueio de rede
                      const target = e.currentTarget;
                      const fallbackPath = `/images/lines/line_${cat.id}_product.jpg`;
                      if (target.src !== fallbackPath && !target.dataset.triedFallback) {
                        target.dataset.triedFallback = 'true';
                        target.src = fallbackPath;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                  
                  {/* Top Badge */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {cat.badge && (
                      <span className="bg-stone-900/85 backdrop-blur-md text-white font-semibold px-2.5 py-1 rounded-full text-[11px] border border-white/20 shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-rose-400" />
                        <span>{cat.badge}</span>
                      </span>
                    )}
                    {isFavorita && (
                      <span className="bg-emerald-700/90 backdrop-blur-md text-white font-semibold px-2.5 py-1 rounded-full text-[11px] border border-emerald-400/40 shadow-xs">
                        Favorita
                      </span>
                    )}
                  </div>

                  {/* Bottom Profit Highlight */}
                  {cat.profitHighlight && (
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="bg-rose-600/90 backdrop-blur-md font-bold px-2.5 py-1 rounded-lg text-[11px] border border-white/20 shadow-xs">
                        {cat.profitHighlight}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-stone-900 text-lg group-hover:text-rose-700 transition-colors">
                        {cat.title}
                      </h3>
                      <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                        Linha {idx + 1}
                      </span>
                    </div>

                    {cat.tagline && (
                      <p className="text-xs text-stone-600 leading-relaxed font-normal">
                        {cat.tagline}
                      </p>
                    )}

                    {/* Item List */}
                    {cat.items && cat.items.length > 0 && (
                      <ul className="space-y-1.5 pt-2 text-xs text-stone-700">
                        {cat.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Card Footer / Action */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-rose-700">
                      {isFavorita ? 'Lucro Máximo de 40%' : 'Incluso sem investimento'}
                    </span>
                    
                    {isFavorita ? (
                      <a
                        href={catalogoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors shrink-0"
                      >
                        <BookOpen className="w-3 h-3 text-emerald-600" />
                        <span>Folhear</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onScrollToForm(`Interesse na linha: ${cat.title}`)}
                        className="text-[11px] font-bold text-stone-600 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        Solicitar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Call to Action Banner */}
        <div className="mt-14 bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 rounded-3xl p-8 sm:p-10 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-white/10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Sem taxa de adesão & Cadastro sujeito a análise</span>
            </div>
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
              Quer receber essas linhas prontas para vender?
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Solicite seu mostruário sem investimento. Você tem 40 dias para demonstrar e só paga o que vender!
            </p>
          </div>

          <button
            onClick={() => onScrollToForm('Quero receber o mostruário com as linhas comerciais')}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-sm px-7 py-4 rounded-2xl shadow-lg shadow-rose-600/30 border border-white/20 transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
          >
            <span>Quero Meu Mostruário</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
