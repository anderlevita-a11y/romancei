import { UserCheck, PackageCheck, ShoppingBag, Banknote, ArrowRight, ShieldCheck } from 'lucide-react';

interface HowItWorksProps {
  onScrollToForm: () => void;
}

export function HowItWorks({ onScrollToForm }: HowItWorksProps) {
  const steps = [
    {
      number: '01',
      title: 'Pré-Cadastro Rápido e Seguro',
      description: 'Preencha o formulário nesta página com seus dados básicos (Nome, CPF, Data de Nascimento e Telefone). Respeitamos 100% as diretrizes da LGPD.',
      badge: 'Menos de 1 minuto',
      icon: UserCheck,
      color: 'rose',
    },
    {
      number: '02',
      title: 'Liberação do seu Mostruário',
      description: 'Nossa equipe entra em contato com você para combinar a entrega ou retirada da sua maleta sem investimento de lingeries + Catálogo Favorita.',
      badge: 'Zero investimento',
      icon: PackageCheck,
      color: 'amber',
    },
    {
      number: '03',
      title: '40 Dias de Vendas Livres',
      description: 'Apresente as peças para amigas, clientes do salão, vizinhas, colegas de trabalho e no WhatsApp/Instagram. As pessoas adoram ver e tocar nas peças.',
      badge: 'Prazo confortável',
      icon: ShoppingBag,
      color: 'blue',
    },
    {
      number: '04',
      title: 'Acerto de Contas & Lucro na Mão',
      description: 'No 40º dia fazemos o acerto: devolva o que não vendeu sem custo algum, receba seu lucro de 30% a 40% e renove o kit com novidades!',
      badge: '30% a 40% no bolso',
      icon: Banknote,
      color: 'emerald',
    },
  ];

  return (
    <section id="como-funciona" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs uppercase font-extrabold tracking-widest text-rose-800 bg-white/70 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/80 shadow-xs">
            Passo a Passo Simples
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900">
            Do cadastro ao lucro: veja como é fácil começar
          </h2>
          <p className="text-stone-600 text-base sm:text-lg">
            Um processo transparente feito para você ter independência financeira e trabalhar no seu próprio horário.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-white/70 backdrop-blur-lg hover:bg-white/90 p-7 rounded-3xl border border-white/80 shadow-lg shadow-rose-950/5 hover:shadow-xl hover:-translate-y-1 transition-all relative flex flex-col justify-between"
              >
                {/* Step Number Top */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-3xl font-serif-luxury font-bold text-rose-300">
                    {step.number}
                  </span>
                  <span className="text-[11px] font-semibold bg-rose-50/90 text-rose-700 border border-rose-200/60 px-2.5 py-1 rounded-full shadow-xs">
                    {step.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100/80 text-rose-700 flex items-center justify-center mb-4 border border-rose-200/50">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-lg leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100/80 flex items-center text-xs text-rose-700 font-semibold gap-1">
                  <span>Etapa {idx + 1} de 4</span>
                </div>
              </div>
            );
          })}

        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-14 text-center">
          <button
            onClick={onScrollToForm}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-rose-600/25 border border-white/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Quero Fazer Meu Pré-Cadastro Agora</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-stone-500 mt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cadastro 100% gratuito e sem compromisso</span>
          </p>
        </div>

      </div>
    </section>
  );
}
