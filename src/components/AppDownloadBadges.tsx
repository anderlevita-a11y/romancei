export const ROMANCE_APP_PLAYSTORE_URL = 'https://play.google.com/store/apps/details?id=br.com.romancemoda.photobook&pcampaignid=web_share';
export const ROMANCE_APP_APPSTORE_URL = 'https://apps.apple.com/br/app/romance/id1453580807';

interface AppDownloadBadgesProps {
  variant?: 'compact' | 'full' | 'header-pill' | 'dark';
  className?: string;
}

export function GooglePlayIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.609 1.814L13.793 12 3.61 22.186c-.37-.367-.61-.926-.61-1.602V3.416c0-.676.24-1.235.609-1.602zM15.207 13.414l2.586 2.586-12.827 7.42 10.241-10.006zM15.207 10.586L4.966.58 17.793 8l-2.586 2.586zm1.414 1.414l3.897-2.253a1.493 1.493 0 010 2.593l-3.897 2.253-1.414-1.414 1.414-1.179z" />
    </svg>
  );
}

export function AppleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.74 1.03-1.77.92-2.81-.89.04-1.99.6-2.63 1.34-.56.65-1.05 1.7-1.05 2.76.99.08 2.01-.5 2.76-1.29z" />
    </svg>
  );
}

export function AppDownloadBadges({ variant = 'full', className = '' }: AppDownloadBadgesProps) {
  if (variant === 'header-pill') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="text-[11px] font-semibold text-rose-200 hidden xl:inline">Baixar App:</span>
        <a
          href={ROMANCE_APP_PLAYSTORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-md border border-white/20 transition-all"
          title="Baixar App Romance na Google Play Store"
        >
          <GooglePlayIcon className="w-3 h-3 text-emerald-400" />
          <span>Google Play</span>
        </a>
        <a
          href={ROMANCE_APP_APPSTORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-md border border-white/20 transition-all"
          title="Baixar App Romance na Apple App Store"
        >
          <AppleIcon className="w-3 h-3 text-stone-100" />
          <span>App Store</span>
        </a>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        <a
          href={ROMANCE_APP_PLAYSTORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md border border-white/10 transition-all transform hover:-translate-y-0.5"
        >
          <GooglePlayIcon className="w-4 h-4 text-emerald-400" />
          <span>Google Play</span>
        </a>

        <a
          href={ROMANCE_APP_APPSTORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md border border-white/10 transition-all transform hover:-translate-y-0.5"
        >
          <AppleIcon className="w-4 h-4 text-stone-100" />
          <span>App Store</span>
        </a>
      </div>
    );
  }

  // Full / Premium Store Buttons
  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className}`}>
      {/* Google Play Button */}
      <a
        href={ROMANCE_APP_PLAYSTORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-stone-950 hover:bg-stone-900 text-white px-4 py-2.5 rounded-2xl border border-white/15 shadow-lg shadow-black/20 transition-all transform hover:-translate-y-0.5 group shrink-0"
      >
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
          <GooglePlayIcon className="w-5 h-5" />
        </div>
        <div className="text-left leading-tight">
          <span className="block text-[9px] uppercase tracking-wider text-stone-400 font-semibold">Disponível na</span>
          <span className="block text-xs font-extrabold text-white">Google Play</span>
        </div>
      </a>

      {/* Apple App Store Button */}
      <a
        href={ROMANCE_APP_APPSTORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-stone-950 hover:bg-stone-900 text-white px-4 py-2.5 rounded-2xl border border-white/15 shadow-lg shadow-black/20 transition-all transform hover:-translate-y-0.5 group shrink-0"
      >
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
          <AppleIcon className="w-5 h-5" />
        </div>
        <div className="text-left leading-tight">
          <span className="block text-[9px] uppercase tracking-wider text-stone-400 font-semibold">Baixar na</span>
          <span className="block text-xs font-extrabold text-white">App Store</span>
        </div>
      </a>
    </div>
  );
}
