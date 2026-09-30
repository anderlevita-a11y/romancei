import React from 'react';
import { 
  Store, 
  MapPin, 
  MessageCircle, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  HeartHandshake, 
  ArrowRight,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { BusinessSettings } from '../types';
import { buildWhatsAppLink } from '../utils/validators';

interface RedeLojasFisicasProps {
  settings: BusinessSettings;
  onScrollToForm: () => void;
}

export function RedeLojasFisicas({ settings, onScrollToForm }: RedeLojasFisicasProps) {
  // Configuração dos links de WhatsApp para as vendedoras favoritas
  const whatsappItapema = buildWhatsAppLink(
    settings.officialWhatsApp || '5547997626121',
    `Olá ${settings.distributorName || 'Anderson'}! Sou revendedora e gostaria de atendimento sobre maletas e retirada na Distribuição Romance Itapema.`
  );

  const whatsappJoinville = buildWhatsAppLink(
    settings.lojaJoinvilleWhatsApp || '5547988407904',
    `Olá ${settings.lojaJoinvilleVendedora || 'Hevilin'}! Sou revendedora e gostaria de atendimento na Loja Favorita Joinville.`
  );

  const whatsappFloripa = buildWhatsAppLink(
    settings.lojaFlorianopolisWhatsApp || '5548996927999',
    `Olá ${settings.lojaFlorianopolisVendedora || 'Warla'}! Sou revendedora e gostaria de atendimento na Loja Favorita Florianópolis.`
  );

  const stores = [
    {
      id: 'itapema',
      title: 'Distribuição Oficial & Apoio Itapema',
      city: 'Itapema & Região Costa Esmeralda',
      vendedora: settings.distributorName || 'Anderson Rodrigues (Distribuidor)',
      role: 'Distribuição Central & Ponto de Apoio',
      phoneDisplay: settings.displayWhatsApp || '(47) 99762-6121',
      whatsappUrl: whatsappItapema,
      address: settings.lojaFisicaEndereco || 'Atendimento com entrega programada em domicílio ou ponto de retirada em Itapema - SC',
      mapsUrl: settings.lojaFisicaMapsUrl || '',
      badge: 'Sede Regional',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      gradient: 'from-rose-500/10 via-pink-500/10 to-amber-500/5',
      highlights: [
        'Entrega e retirada de kits sem investimento',
        'Atendimento rápido para Itapema, Porto Belo e Tijucas',
        'Suporte direto com o distribuidor oficial'
      ]
    },
    {
      id: 'joinville',
      title: 'Loja Física Favorita Joinville',
      city: 'Joinville - Santa Catarina',
      vendedora: settings.lojaJoinvilleVendedora || 'Hevilin',
      role: 'Vendedora Favorita Dedicada',
      phoneDisplay: settings.lojaJoinvilleDisplayWhatsApp || '(47) 98840-7904',
      whatsappUrl: whatsappJoinville,
      address: 'Ponto comercial e atendimento exclusivo para revendedoras em Joinville - SC',
      mapsUrl: '',
      badge: 'Loja Favorita',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      gradient: 'from-amber-500/10 via-rose-500/10 to-purple-500/5',
      highlights: [
        'Atendimento personalizado com a vendedora Hevilin',
        'Mostruário completo do Catálogo Favorita (40% de lucro)',
        'Orientação sobre prazos e parcelamento em até 3x'
      ]
    },
    {
      id: 'florianopolis',
      title: 'Loja Física Favorita Florianópolis',
      city: 'Florianópolis & Grande Floripa',
      vendedora: settings.lojaFlorianopolisVendedora || 'Warla',
      role: 'Vendedora Favorita Dedicada',
      phoneDisplay: settings.lojaFlorianopolisDisplayWhatsApp || '(48) 99692-7999',
      whatsappUrl: whatsappFloripa,
      address: 'Ponto comercial e atendimento presencial na Grande Florianópolis - SC',
      mapsUrl: '',
      badge: 'Loja Favorita',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      gradient: 'from-purple-500/10 via-pink-500/10 to-rose-500/5',
      highlights: [
        'Atendimento com a consultora especialista Warla',
        'Pronta entrega de novidades e itens mais vendidos',
        'Apoio completo para pedidos e acertos de 40 dias'
      ]
    }
  ];

  return (
    <section 
      id="rede-lojas-fisicas" 
      className="py-16 sm:py-20 relative overflow-hidden bg-gradient-to-b from-stone-50 via-white to-stone-50"
    >
      {/* Decorative background glows */}
      <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-rose-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-rose-100/80 text-rose-800 text-xs uppercase font-extrabold tracking-widest px-4 py-1.5 rounded-full border border-rose-200/80 shadow-xs">
            <Store className="w-3.5 h-3.5 text-rose-600" />
            <span>Presença Física & Atendimento Especializado</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
            Rede de Lojas Físicas & Vendedora Favorita
          </h2>

          <p className="text-stone-600 text-sm sm:text-base lg:text-lg leading-relaxed">
            Aqui você nunca está sozinha! Conte com a estrutura da nossa <strong>Rede de Lojas Físicas</strong> e o suporte direto da sua <strong>Vendedora Favorita</strong> dedicada em Santa Catarina para retirar pedidos, renovar seu mostruário e alavancar suas vendas.
          </p>
        </div>

        {/* Benefits bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-12 max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-rose-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">Vendedora Favorita Dedicada</h4>
              <p className="text-[11px] text-stone-500">Ajuda você a escolher as peças campeãs de venda</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">Retirada Rápida e Flexível</h4>
              <p className="text-[11px] text-stone-500">Pontos em Itapema, Joinville e Florianópolis</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">Suporte a Cada 40 Dias</h4>
              <p className="text-[11px] text-stone-500">Esclarecimento de prazos, parcelamento e acertos</p>
            </div>
          </div>
        </div>

        {/* Cards das Lojas e Vendedoras Favoritas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stores.map((store) => (
            <div
              key={store.id}
              className={`bg-white/90 backdrop-blur-md rounded-3xl border border-stone-200/80 shadow-md hover:shadow-2xl transition-all duration-300 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-rose-300`}
            >
              {/* Gradient card accent */}
              <div className={`absolute top-0 right-0 w-44 h-44 rounded-full bg-gradient-to-bl ${store.gradient} blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border ${store.badgeColor}`}>
                    {store.badge}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center">
                    <Store className="w-4 h-4 text-rose-600" />
                  </div>
                </div>

                <div>
                  <h3 className="font-serif-luxury text-xl font-bold text-stone-900">
                    {store.title}
                  </h3>
                  <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{store.city}</span>
                  </p>
                </div>

                {/* Vendedora Favorita Box */}
                <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                    {store.role}
                  </span>
                  <p className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{store.vendedora}</span>
                  </p>
                  <p className="text-xs text-stone-600 flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span>{store.phoneDisplay}</span>
                  </p>
                </div>

                {/* Highlights */}
                <div className="space-y-2 pt-1">
                  {store.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {/* Address */}
                {store.address && (
                  <p className="text-[11px] text-stone-500 pt-2 border-t border-stone-100 leading-relaxed">
                    <strong>Localização:</strong> {store.address}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 relative z-10 space-y-2">
                <a
                  href={store.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Falar com Vendedora Favorita</span>
                </a>

                {store.mapsUrl && (
                  <a
                    href={store.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Ver no Google Maps</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Call To Action Banner */}
        <div className="bg-gradient-to-r from-rose-900 via-stone-900 to-rose-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-white/10">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-white/10 px-3 py-1 rounded-full border border-white/15">
              Atendimento em Todo o Litoral Catarinense
            </span>
            <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold">
              Quer receber sua maleta em casa ou retirar em uma de nossas lojas?
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
              Faça seu pré-cadastro gratuito agora mesmo. Nossa equipe ou vendedora favorita entrará em contato para agendar seu kit consignado sem investimento!
            </p>
          </div>

          <button
            type="button"
            onClick={onScrollToForm}
            className="w-full md:w-auto bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-stone-950 font-black text-sm px-8 py-4 rounded-2xl shadow-xl hover:shadow-amber-500/20 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Quero Fazer Meu Pré-Cadastro</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
