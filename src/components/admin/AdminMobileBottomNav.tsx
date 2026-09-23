import { 
  Users, 
  PackageCheck, 
  Film, 
  BarChart3, 
  Settings, 
  Plus, 
  Menu,
  Sparkles
} from 'lucide-react';
import { AdminTabType } from '../../types';

interface AdminMobileBottomNavProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  newLeadsCount: number;
  activeOrdersCount: number;
  totalActiveMedia: number;
  onOpenQuickActionModal: () => void;
  onOpenMobileMenu: () => void;
}

export function AdminMobileBottomNav({
  activeTab,
  setActiveTab,
  newLeadsCount,
  activeOrdersCount,
  totalActiveMedia,
  onOpenQuickActionModal,
  onOpenMobileMenu,
}: AdminMobileBottomNavProps) {
  return (
    <nav 
      aria-label="Navegação Rápida do Painel Admin"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-stone-950/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl px-2 py-1.5 safe-area-pb"
    >
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto text-white">
        
        {/* 1. Pré-Cadastros (Leads) */}
        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all flex-1 relative ${
            activeTab === 'leads' ? 'text-rose-400 bg-white/10' : 'text-stone-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Leads</span>
          {newLeadsCount > 0 && (
            <span className="absolute top-0.5 right-2 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-stone-950">
              {newLeadsCount}
            </span>
          )}
        </button>

        {/* 2. Sacolas & Acertos */}
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all flex-1 relative ${
            activeTab === 'orders' ? 'text-rose-400 bg-white/10' : 'text-stone-400 hover:text-white'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Sacolas</span>
          {activeOrdersCount > 0 && (
            <span className="absolute top-0.5 right-2 bg-amber-500 text-stone-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-stone-950">
              {activeOrdersCount}
            </span>
          )}
        </button>

        {/* 3. Central Fast Action Button */}
        <button
          type="button"
          onClick={onOpenQuickActionModal}
          className="flex flex-col items-center justify-center -mt-3.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white shadow-lg shadow-rose-600/50 border border-white/25 active:scale-95 transition-all shrink-0"
          title="Nova Ação Rápida"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-[9px] font-black uppercase tracking-tight mt-0.5 whitespace-nowrap">
            Novo
          </span>
        </button>

        {/* 4. Mídias */}
        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all flex-1 relative ${
            activeTab === 'media' ? 'text-rose-400 bg-white/10' : 'text-stone-400 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Mídias</span>
          {totalActiveMedia > 0 && (
            <span className="absolute top-0.5 right-2 bg-purple-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-stone-950">
              {totalActiveMedia}
            </span>
          )}
        </button>

        {/* 5. Menu Drawer Trigger (Metrics, Settings, Site) */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all flex-1 ${
            activeTab === 'metrics' || activeTab === 'settings' ? 'text-rose-400 bg-white/10' : 'text-stone-400 hover:text-white'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Menu</span>
        </button>

      </div>
    </nav>
  );
}
