import { useState, useEffect, useCallback, useRef } from 'react';
import { defaultSettings, initialLeads, initialOrders, defaultAdminUsers, initialMediaItems, initialTestimonials, productCategories, initialResellers, initialSalesProfiles } from './data/initialData';
import { Lead, ConsignmentOrder, BusinessSettings, LeadStatus, AdminUser, MediaItem, TestimonialItem, TestimonialStatus, CommercialLine, RealtimeLeadNotification, ReferralCoupon, ResellerUser, ResellerSalesProfile } from './types';
import { playNotificationChime } from './components/admin/AdminLeadToast';
import {
  syncLeadToSupabase,
  deleteLeadFromSupabase,
  fetchLeadsFromSupabase,
  syncOrderToSupabase,
  deleteOrderFromSupabase,
  fetchOrdersFromSupabase,
  syncAdminUserToSupabase,
  deleteAdminUserFromSupabase,
  fetchAdminUsersFromSupabase,
  syncSettingsToSupabase,
  fetchSettingsFromSupabase,
  fetchMediaItemsFromSupabase,
  syncMediaItemToSupabase,
  deleteMediaItemFromSupabase,
  fetchTestimonialsFromSupabase,
  syncTestimonialToSupabase,
  deleteTestimonialFromSupabase,
  submitPublicTestimonialToSupabase,
  syncAllTestimonialsToSupabase,
  fetchCommercialLinesFromSupabase,
  syncCommercialLineToSupabase,
  deleteCommercialLineFromSupabase,
  syncAllCommercialLinesToSupabase,
  syncAllMediaItemsToSupabase,
  syncReferralCouponToSupabase,
  deleteReferralCouponFromSupabase,
  fetchReferralCouponsFromSupabase,
  fetchResellerUsersFromSupabase,
  saveResellerUserToSupabase,
  fetchSalesProfilesFromSupabase,
  saveSalesProfileToSupabase,
  subscribeToSupabaseRealtime,
  fetchAllCloudData
} from './lib/supabase';

// Public Components
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MediaCarousel } from './components/MediaCarousel';
import { VideoShowcase } from './components/VideoShowcase';
import { BusinessRuleHighlights } from './components/BusinessRuleHighlights';
import { HowItWorks } from './components/HowItWorks';
import { ProfitCalculator } from './components/ProfitCalculator';
import { CatalogExplanation } from './components/CatalogExplanation';
import { ProductShowcase } from './components/ProductShowcase';
import { RomanceEstrelas } from './components/RomanceEstrelas';
import { Testimonials } from './components/Testimonials';
import { InstagramPromoSection } from './components/InstagramPromoSection';
import { SharePromoSection } from './components/SharePromoSection';
import { LeadForm } from './components/LeadForm';
import { ReferralModal } from './components/ReferralModal';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { LgpdModal, LegalTab } from './components/LgpdModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { WhatsAppFloating } from './components/WhatsAppFloating';
import { MobileBottomNav } from './components/MobileBottomNav';
import { InstagramGiftModal } from './components/InstagramGiftModal';
import { ShareModal } from './components/ShareModal';
import { SearchBar } from './components/SearchBar';

// Reseller Portal Components
import { ResellerLoginModal } from './components/reseller/ResellerLoginModal';
import { ResellerDashboard } from './components/reseller/ResellerDashboard';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/admin/AdminLoginModal';

export default function App() {
  // Persistent State via LocalStorage as immediate local cache
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('romance_itapema_leads') || localStorage.getItem('romance_modaitajai_leads');
    if (saved) {
      try {
        const parsed: Lead[] = JSON.parse(saved);
        const filtered = parsed.filter((l) => !['lead-1', 'lead-2', 'lead-3', 'lead-4', 'lead-5'].includes(l.id));
        return filtered;
      } catch (e) {
        console.error('Error loading leads', e);
      }
    }
    return initialLeads;
  });

  const [orders, setOrders] = useState<ConsignmentOrder[]>(() => {
    const saved = localStorage.getItem('romance_itapema_orders') || localStorage.getItem('romance_modaitajai_orders');
    if (saved) {
      try {
        const parsed: ConsignmentOrder[] = JSON.parse(saved);
        const filtered = parsed.filter((o) => !['ord-101', 'ord-102', 'ord-103'].includes(o.id));
        return filtered;
      } catch (e) {
        console.error('Error loading orders', e);
      }
    }
    return initialOrders;
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('romance_itapema_media_items') || localStorage.getItem('romance_modaitajai_media_items');
    if (saved) {
      try {
        const parsed: MediaItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error loading media items from local storage', e);
      }
    }
    return initialMediaItems;
  });

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(() => {
    const saved = localStorage.getItem('romance_itapema_testimonials') || localStorage.getItem('romance_modaitajai_testimonials');
    if (saved) {
      try {
        const parsed: TestimonialItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error loading testimonials from local storage', e);
      }
    }
    return initialTestimonials;
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem('romance_itapema_settings') || localStorage.getItem('romance_modaitajai_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const isOldBranding = parsed.businessName === 'Romance Moda Itajaí' || parsed.instagramHandle === '@romancemodasitajai' || !parsed.cityRegion?.includes('Itapema');
        
        // Clean legacy hardcoded Itajaí fallback links if present in stale cache
        const cleanLojaMapsUrl = parsed.lojaFisicaMapsUrl === 'https://maps.google.com/?q=Rua+Vereador+Ailton+de+Souza,+257+-+São+Vicente,+Itajaí+-+SC' 
          ? '' 
          : (parsed.lojaFisicaMapsUrl ?? defaultSettings.lojaFisicaMapsUrl);

        const cleanLojaEndereco = parsed.lojaFisicaEndereco === 'Rua Vereador Ailton de Souza, 257, Sala 03 - São Vicente, Itajaí - SC'
          ? ''
          : (parsed.lojaFisicaEndereco ?? defaultSettings.lojaFisicaEndereco);

        const cleanGoogleReviewsUrl = (parsed.googleReviewsUrl === 'https://maps.app.goo.gl/mLmv1hszhVnTWvNG7' || parsed.googleReviewsUrl === 'https://maps.app.goo.gl/p7upzXR2Zhxr24MJA')
          ? ''
          : (parsed.googleReviewsUrl ?? defaultSettings.googleReviewsUrl);

        const cleanSupabaseUrl = (!parsed.supabaseUrl || parsed.supabaseUrl === 'https://sojvyojpvdlwmokkqpbf.supabase.co')
          ? defaultSettings.supabaseUrl
          : parsed.supabaseUrl;

        const cleanSupabaseAnonKey = (!parsed.supabaseAnonKey || parsed.supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvanZ5b2pwdmRsd21va2txcGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NjI1NzAsImV4cCI6MjEwMzIzODU3MH0.AwJCySuo7IN0kjIERkHQgp7hFmUaxn-Jvk4kKw8LZag')
          ? defaultSettings.supabaseAnonKey
          : parsed.supabaseAnonKey;

        return {
          ...defaultSettings,
          ...parsed,
          supabaseUrl: cleanSupabaseUrl,
          supabaseAnonKey: cleanSupabaseAnonKey,
          businessName: isOldBranding ? defaultSettings.businessName : (parsed.businessName || defaultSettings.businessName),
          instagramHandle: isOldBranding ? defaultSettings.instagramHandle : (parsed.instagramHandle || defaultSettings.instagramHandle),
          cityRegion: isOldBranding ? defaultSettings.cityRegion : (parsed.cityRegion || defaultSettings.cityRegion),
          distributorName: parsed.distributorName || defaultSettings.distributorName,
          officialWhatsApp: parsed.officialWhatsApp || defaultSettings.officialWhatsApp,
          displayWhatsApp: parsed.displayWhatsApp || defaultSettings.displayWhatsApp,
          lojaFisicaEndereco: cleanLojaEndereco,
          lojaFisicaMapsUrl: cleanLojaMapsUrl,
          lojaFisicaWhatsApp: parsed.lojaFisicaWhatsApp || defaultSettings.lojaFisicaWhatsApp,
          lojaFisicaDisplayWhatsApp: parsed.lojaFisicaDisplayWhatsApp || defaultSettings.lojaFisicaDisplayWhatsApp,
          lojaJoinvilleVendedora: parsed.lojaJoinvilleVendedora || defaultSettings.lojaJoinvilleVendedora,
          lojaJoinvilleWhatsApp: parsed.lojaJoinvilleWhatsApp || defaultSettings.lojaJoinvilleWhatsApp,
          lojaJoinvilleDisplayWhatsApp: parsed.lojaJoinvilleDisplayWhatsApp || defaultSettings.lojaJoinvilleDisplayWhatsApp,
          lojaFlorianopolisVendedora: parsed.lojaFlorianopolisVendedora || defaultSettings.lojaFlorianopolisVendedora,
          lojaFlorianopolisWhatsApp: parsed.lojaFlorianopolisWhatsApp || defaultSettings.lojaFlorianopolisWhatsApp,
          lojaFlorianopolisDisplayWhatsApp: parsed.lojaFlorianopolisDisplayWhatsApp || defaultSettings.lojaFlorianopolisDisplayWhatsApp,
          welcomeTemplate: parsed.welcomeTemplate || defaultSettings.welcomeTemplate,
          kitReadyTemplate: parsed.kitReadyTemplate || defaultSettings.kitReadyTemplate,
          settlementReminderTemplate: parsed.settlementReminderTemplate || defaultSettings.settlementReminderTemplate,
          leadRejectedTemplate: parsed.leadRejectedTemplate || defaultSettings.leadRejectedTemplate,
          googleReviewsUrl: cleanGoogleReviewsUrl,
          heroBannerUrl: parsed.heroBannerUrl || defaultSettings.heroBannerUrl,
          logoUrl: parsed.logoUrl || defaultSettings.logoUrl,
        };
      } catch (e) {
        console.error('Error loading settings', e);
      }
    }
    return defaultSettings;
  });

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('romance_itapema_admin_users') || localStorage.getItem('romance_modaitajai_admin_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error loading admin users from cache', e);
      }
    }
    return defaultAdminUsers;
  });

  const [commercialLines, setCommercialLines] = useState<CommercialLine[]>(() => {
    const OFFICIAL_MAP: Record<string, string> = {
      fitness: 'Fitness',
      seamless: 'Seamless',
      casual: 'Casual',
      intima: 'Moda Íntima',
      cosmeticos: 'Cosméticos',
      rmc_casa: 'RMC Casa',
      sex_shop: 'Sex Shop',
    };
    const saved = localStorage.getItem('romance_itapema_commercial_lines') || localStorage.getItem('romance_modaitajai_commercial_lines');
    if (saved) {
      try {
        const parsed: CommercialLine[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garante a nomenclatura oficial das 7 linhas
          return parsed.map((item) => ({
            ...item,
            title: OFFICIAL_MAP[item.id] || item.title,
          }));
        }
      } catch (e) {
        console.error('Error loading commercial lines from local storage', e);
      }
    }
    return productCategories;
  });

  // Admin and Modal states
  const [coupons, setCoupons] = useState<ReferralCoupon[]>(() => {
    const saved = localStorage.getItem('romance_itapema_coupons');
    if (saved) {
      try {
        const parsed: ReferralCoupon[] = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error loading coupons from local storage', e);
      }
    }
    return [];
  });

  const [isAdminView, setIsAdminView] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser | null>(null);

  // Reseller Portal States
  const [resellers, setResellers] = useState<ResellerUser[]>(() => {
    const saved = localStorage.getItem('romance_itapema_resellers');
    if (saved) {
      try {
        const parsed: ResellerUser[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading resellers from local storage', e);
      }
    }
    return initialResellers;
  });

  const [salesProfiles, setSalesProfiles] = useState<ResellerSalesProfile[]>(() => {
    const saved = localStorage.getItem('romance_itapema_sales_profiles');
    if (saved) {
      try {
        const parsed: ResellerSalesProfile[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading sales profiles from local storage', e);
      }
    }
    return initialSalesProfiles;
  });

  const [currentReseller, setCurrentReseller] = useState<ResellerUser | null>(() => {
    const saved = localStorage.getItem('romance_itapema_current_reseller');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading current reseller from local storage', e);
      }
    }
    return null;
  });

  const [isResellerLoginModalOpen, setIsResellerLoginModalOpen] = useState(false);
  const [isResellerDashboardView, setIsResellerDashboardView] = useState(false);

  const [isLgpdModalOpen, setIsLgpdModalOpen] = useState(false);
  const [isInstagramModalOpen, setIsInstagramModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('privacy');
  const [preselectedFavorita, setPreselectedFavorita] = useState<'sim' | 'nao'>('sim');
  const [isSyncing, setIsSyncing] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('CONNECTING');

  // Realtime Lead Notifications & Sound Alerts State
  const [notifications, setNotifications] = useState<RealtimeLeadNotification[]>(() => {
    const saved = localStorage.getItem('romance_itapema_notifications') || localStorage.getItem('romance_modaitajai_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('romance_itapema_notif_sound') || localStorage.getItem('romance_modaitajai_notif_sound');
    return saved !== null ? saved === 'true' : true;
  });

  // Keep notification sound ref for realtime async callbacks
  const soundEnabledRef = useRef(notificationSoundEnabled);
  useEffect(() => {
    soundEnabledRef.current = notificationSoundEnabled;
  }, [notificationSoundEnabled]);

  // Track recently deleted media IDs locally to avoid resurrecting deleted items during cloud polling
  const recentlyDeletedMediaIds = useRef<Set<string>>(new Set());

  const handleToggleSound = () => {
    setNotificationSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('romance_itapema_notif_sound', String(next));
      return next;
    });
  };

  const handleDismissNotification = (notifId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const triggerLeadNotification = useCallback((lead: Lead, sourceType: 'realtime_api' | 'form_submission' | 'test' = 'realtime_api') => {
    const newNotif: RealtimeLeadNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      lead,
      timestamp: new Date().toISOString(),
      read: false,
      sourceType,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
    if (soundEnabledRef.current) {
      playNotificationChime();
    }
  }, []);

  const handleTriggerTestNotification = () => {
    const sampleNames = ['Juliana Souza', 'Camila Ribeiro', 'Beatriz Lima', 'Fernanda Silva', 'Patrícia Rocha'];
    const sampleCities = ['Itapema', 'Itajaí', 'Balneário Camboriú', 'Navegantes', 'Camboriú', 'Penha'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomCity = sampleCities[Math.floor(Math.random() * sampleCities.length)];
    const randomPhone = `4799${Math.floor(1000000 + Math.random() * 9000000)}`;

    const testLead: Lead = {
      id: `test-lead-${Date.now()}`,
      protocol: `ROM-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: `${randomName} (Demonstração)`,
      cpf: '000.000.000-00',
      birthDate: '1995-05-15',
      phone: randomPhone,
      city: randomCity,
      neighborhood: 'Centro',
      hasExperience: 'sim',
      wantsFavorita40: Math.random() > 0.5 ? 'sim' : 'nao',
      consentLgpd: true,
      termsAccepted: true,
      status: 'novo',
      createdAt: new Date().toISOString(),
      notes: [
        {
          id: `note-${Date.now()}`,
          author: 'Sistema Realtime',
          text: 'Lead de teste simulado para validação de alertas instantâneos e notificações.',
          createdAt: new Date().toISOString(),
        }
      ],
      source: 'Demonstração em Tempo Real',
    };

    triggerLeadNotification(testLead, 'test');
  };

  useEffect(() => {
    localStorage.setItem('romance_itapema_notifications', JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  const handleOpenLegalModal = (tab: LegalTab = 'privacy') => {
    setLegalModalTab(tab);
    setIsLgpdModalOpen(true);
  };

  const handleScrollToSection = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Real-time local broadcast channel for instantaneous zero-latency sync across all tabs/windows
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('romance_itapema_realtime');
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
          const { type, data } = event.data || {};
          if (type === 'COMMERCIAL_LINES_UPDATE' && Array.isArray(data)) {
            setCommercialLines(data);
          } else if (type === 'MEDIA_UPDATE' && Array.isArray(data)) {
            setMediaItems(data);
          } else if (type === 'TESTIMONIALS_UPDATE' && Array.isArray(data)) {
            setTestimonials(data);
          } else if (type === 'LEADS_UPDATE' && Array.isArray(data)) {
            setLeads(data);
          } else if (type === 'ORDERS_UPDATE' && Array.isArray(data)) {
            setOrders(data);
          } else if (type === 'SETTINGS_UPDATE' && data) {
            setSettings((prev) => ({ ...prev, ...data }));
          } else if (type === 'RESELLERS_UPDATE' && Array.isArray(data)) {
            setResellers(data);
          } else if (type === 'SALES_PROFILES_UPDATE' && Array.isArray(data)) {
            setSalesProfiles(data);
          }
        };

        return () => {
          channel.close();
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in current environment:', e);
    }
  }, []);

  // Reseller and Sales Profile LocalStorage Sync
  useEffect(() => {
    try {
      localStorage.setItem('romance_itapema_resellers', JSON.stringify(resellers));
    } catch {}
  }, [resellers]);

  useEffect(() => {
    try {
      localStorage.setItem('romance_itapema_sales_profiles', JSON.stringify(salesProfiles));
    } catch {}
  }, [salesProfiles]);

  useEffect(() => {
    try {
      if (currentReseller) {
        localStorage.setItem('romance_itapema_current_reseller', JSON.stringify(currentReseller));
      } else {
        localStorage.removeItem('romance_itapema_current_reseller');
      }
    } catch {}
  }, [currentReseller]);

  // Window Storage Event Listener (Cross-tab instant sync fallback)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'romance_itapema_commercial_lines' || e.key === 'romance_modaitajai_commercial_lines') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setCommercialLines(parsed);
        } catch {}
      } else if ((e.key === 'romance_itapema_media_items' || e.key === 'romance_modaitajai_media_items') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setMediaItems(parsed);
        } catch {}
      } else if ((e.key === 'romance_itapema_testimonials' || e.key === 'romance_modaitajai_testimonials') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setTestimonials(parsed);
        } catch {}
      } else if (e.key === 'romance_itapema_resellers' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setResellers(parsed);
        } catch {}
      } else if (e.key === 'romance_itapema_sales_profiles' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setSalesProfiles(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper to broadcast commercial lines changes immediately
  const broadcastLinesState = useCallback((updatedItems: CommercialLine[]) => {
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'COMMERCIAL_LINES_UPDATE', data: updatedItems });
      }
    } catch {}
  }, []);

  // Helper to broadcast media changes immediately
  const broadcastMediaState = useCallback((updatedItems: MediaItem[]) => {
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'MEDIA_UPDATE', data: updatedItems });
      }
    } catch {}
  }, []);

  // Helper to broadcast testimonial changes immediately
  const broadcastTestimonialsState = useCallback((updatedItems: TestimonialItem[]) => {
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'TESTIMONIALS_UPDATE', data: updatedItems });
      }
    } catch {}
  }, []);

  // Initial Cloud Sync on Startup, Background Polling & Supabase Real-time WebSocket Subscription
  useEffect(() => {
    let isMounted = true;

    // Busca consolidada de todos os dados do banco de dados na nuvem com reconciliação resiliente
    const refreshAllData = async (showSyncIndicator = false) => {
      if (showSyncIndicator) setIsSyncing(true);
      try {
        const cloudData = await fetchAllCloudData(settings.supabaseUrl, settings.supabaseAnonKey);
        if (!isMounted) return;

        if (Array.isArray(cloudData.leads)) {
          setLeads((prev) => {
            if (cloudData.leads!.length === 0) return prev;
            const cloudMap = new Map(cloudData.leads!.map((l) => [l.id, l]));
            const merged = [...cloudData.leads!];
            for (const localLead of prev) {
              if (!cloudMap.has(localLead.id)) {
                merged.push(localLead);
              }
            }
            return merged;
          });
        }
        if (Array.isArray(cloudData.orders)) {
          setOrders((prev) => {
            if (cloudData.orders!.length === 0) return prev;
            const cloudMap = new Map(cloudData.orders!.map((o) => [o.id, o]));
            const merged = [...cloudData.orders!];
            for (const localOrder of prev) {
              if (!cloudMap.has(localOrder.id)) {
                merged.push(localOrder);
              }
            }
            return merged;
          });
        }
        if (Array.isArray(cloudData.coupons)) {
          setCoupons((prev) => {
            if (cloudData.coupons!.length === 0) return prev;
            const cloudMap = new Map(cloudData.coupons!.map((c) => [c.id, c]));
            const merged = [...cloudData.coupons!];
            for (const localCoupon of prev) {
              if (!cloudMap.has(localCoupon.id)) {
                merged.push(localCoupon);
              }
            }
            return merged;
          });
        }
        if (Array.isArray(cloudData.adminUsers)) {
          setAdminUsers((prev) => {
            if (cloudData.adminUsers!.length === 0) return prev;
            const cloudMap = new Map(cloudData.adminUsers!.map((u) => [u.id, u]));
            const merged = [...cloudData.adminUsers!];
            for (const localUser of prev) {
              if (!cloudMap.has(localUser.id)) {
                merged.push(localUser);
              }
            }
            return merged;
          });
        }
        if (Array.isArray(cloudData.mediaItems)) {
          setMediaItems((prev) => {
            if (cloudData.mediaItems!.length === 0) {
              // Se o Supabase estiver vazio, mantém itens locais e tenta enviá-los em lote para a nuvem
              if (prev.length > 0) {
                syncAllMediaItemsToSupabase(prev, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
              }
              return prev;
            }
            // Filtra mídias que foram excluídas recentemente pelo usuário nesta sessão
            const validCloud = cloudData.mediaItems!.filter((m) => !recentlyDeletedMediaIds.current.has(m.id));
            const cloudMap = new Map(validCloud.map((m) => [m.id, m]));
            const merged = [...validCloud];

            for (const localItem of prev) {
              if (recentlyDeletedMediaIds.current.has(localItem.id)) {
                continue;
              }
              // Item criado/editado localmente que ainda não chegou na nuvem: preserva e sincroniza
              if (!cloudMap.has(localItem.id)) {
                merged.push(localItem);
                syncMediaItemToSupabase(localItem, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
              }
            }
            return merged;
          });
        }
        if (Array.isArray(cloudData.testimonials)) {
          setTestimonials((prev) => {
            if (cloudData.testimonials!.length === 0) {
              if (prev.length > 0) {
                syncAllTestimonialsToSupabase(prev, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
              }
              return prev;
            }
            const cloudMap = new Map(cloudData.testimonials!.map((t) => [t.id, t]));
            const merged = [...cloudData.testimonials!];
            for (const localItem of prev) {
              if (!cloudMap.has(localItem.id)) {
                merged.push(localItem);
                syncTestimonialToSupabase(localItem, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
              }
            }
            return merged;
          });
        }
        if (Array.isArray(cloudData.commercialLines)) {
          const OFFICIAL_MAP: Record<string, string> = {
            fitness: 'Fitness',
            seamless: 'Seamless',
            casual: 'Casual',
            intima: 'Moda Íntima',
            cosmeticos: 'Cosméticos',
            rmc_casa: 'RMC Casa',
            sex_shop: 'Sex Shop',
          };
          const mappedCloud = cloudData.commercialLines.map((line) => ({
            ...line,
            title: OFFICIAL_MAP[line.id] || line.title,
          }));

          setCommercialLines((prev) => {
            if (mappedCloud.length === 0) return prev;
            const cloudMap = new Map(mappedCloud.map((l) => [l.id, l]));
            const merged = [...mappedCloud];
            for (const localLine of prev) {
              if (!cloudMap.has(localLine.id)) {
                merged.push(localLine);
              }
            }
            return merged;
          });
        }
        if (Array.isArray(cloudData.resellers)) {
          setResellers((prev) => {
            if (cloudData.resellers!.length === 0) return prev;
            const cloudMap = new Map(cloudData.resellers!.map((r) => [r.id, r]));
            const merged = [...cloudData.resellers!];
            for (const localReseller of prev) {
              if (!cloudMap.has(localReseller.id)) {
                merged.push(localReseller);
              }
            }
            return merged;
          });
        }
        if (Array.isArray(cloudData.salesProfiles)) {
          setSalesProfiles((prev) => {
            if (cloudData.salesProfiles!.length === 0) return prev;
            const cloudMap = new Map(cloudData.salesProfiles!.map((p) => [p.id, p]));
            const merged = [...cloudData.salesProfiles!];
            for (const localProfile of prev) {
              if (!cloudMap.has(localProfile.id)) {
                merged.push(localProfile);
              }
            }
            return merged;
          });
        }
        if (cloudData.settings && Object.keys(cloudData.settings).length > 0) {
          setSettings((prev) => ({
            ...prev,
            ...cloudData.settings,
            supabaseUrl: prev.supabaseUrl,
            supabaseAnonKey: prev.supabaseAnonKey,
            supabaseConnected: true,
          }));
        }
      } catch (err) {
        console.warn('Realtime cloud sync notice:', err);
      } finally {
        if (showSyncIndicator && isMounted) {
          setIsSyncing(false);
        }
      }
    };

    // 1. Sincronização inicial instantânea
    refreshAllData(false);

    // 2. 📡 Conexão Realtime Supabase (WebSocket) para sincronização instantânea
    const unsubscribeRealtime = subscribeToSupabaseRealtime(
      {
        onStatusChange: (status) => {
          if (!isMounted) return;
          setRealtimeStatus(status);
        },
        onCommercialLineChange: ({ eventType, line, lineId }) => {
          if (!isMounted) return;
          setCommercialLines((prev) => {
            let updated: CommercialLine[];
            if (eventType === 'DELETE' && lineId) {
              updated = prev.filter((l) => l.id !== lineId);
            } else if (line) {
              const exists = prev.some((l) => l.id === line.id);
              if (exists) {
                updated = prev.map((l) => (l.id === line.id ? line : l));
              } else {
                updated = [...prev, line];
              }
            } else {
              return prev;
            }
            broadcastLinesState(updated);
            return updated;
          });
        },
        onMediaChange: ({ eventType, item, itemId }) => {
          if (!isMounted) return;
          setMediaItems((prev) => {
            let updated: MediaItem[];
            if (eventType === 'DELETE' && itemId) {
              recentlyDeletedMediaIds.current.add(itemId);
              updated = prev.filter((m) => m.id !== itemId);
            } else if (item) {
              if (recentlyDeletedMediaIds.current.has(item.id)) {
                return prev;
              }
              const exists = prev.some((m) => m.id === item.id);
              if (exists) {
                updated = prev.map((m) => (m.id === item.id ? item : m));
              } else {
                updated = [item, ...prev];
              }
            } else {
              return prev;
            }
            try {
              localStorage.setItem('romance_itapema_media_items', JSON.stringify(updated));
            } catch {}
            broadcastMediaState(updated);
            return updated;
          });
        },
        onTestimonialChange: ({ eventType, item, itemId }) => {
          if (!isMounted) return;
          setTestimonials((prev) => {
            let updated: TestimonialItem[];
            if (eventType === 'DELETE' && itemId) {
              updated = prev.filter((t) => t.id !== itemId);
            } else if (item) {
              const exists = prev.some((t) => t.id === item.id);
              if (exists) {
                updated = prev.map((t) => (t.id === item.id ? item : t));
              } else {
                updated = [item, ...prev];
              }
            } else {
              return prev;
            }
            broadcastTestimonialsState(updated);
            return updated;
          });
        },
        onLeadChange: ({ eventType, lead, leadId }) => {
          if (!isMounted) return;
          setLeads((prev) => {
            if (eventType === 'DELETE' && leadId) {
              return prev.filter((l) => l.id !== leadId);
            } else if (lead) {
              const exists = prev.some((l) => l.id === lead.id);
              if (!exists && eventType !== 'UPDATE') {
                triggerLeadNotification(lead, 'realtime_api');
              }
              return exists ? prev.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...prev];
            }
            return prev;
          });
        },
        onOrderChange: ({ eventType, order, orderId }) => {
          if (!isMounted) return;
          setOrders((prev) => {
            if (eventType === 'DELETE' && orderId) {
              return prev.filter((o) => o.id !== orderId);
            } else if (order) {
              const exists = prev.some((o) => o.id === order.id);
              return exists ? prev.map((o) => (o.id === order.id ? order : o)) : [order, ...prev];
            }
            return prev;
          });
        },
        onCouponChange: ({ eventType, coupon, couponId }) => {
          if (!isMounted) return;
          setCoupons((prev) => {
            if (eventType === 'DELETE' && couponId) {
              return prev.filter((c) => c.id !== couponId);
            } else if (coupon) {
              const couponCpfClean = (coupon.cpf || '').replace(/\D/g, '');
              const exists = prev.some((c) => c.id === coupon.id || (couponCpfClean && (c.cpf || '').replace(/\D/g, '') === couponCpfClean));
              return exists
                ? prev.map((c) => (c.id === coupon.id || (couponCpfClean && (c.cpf || '').replace(/\D/g, '') === couponCpfClean) ? coupon : c))
                : [coupon, ...prev];
            }
            return prev;
          });
        },
        onAdminUserChange: ({ eventType, user, userId }) => {
          if (!isMounted) return;
          setAdminUsers((prev) => {
            if (eventType === 'DELETE' && userId) {
              return prev.filter((u) => u.id !== userId);
            } else if (user) {
              const exists = prev.some((u) => u.id === user.id);
              return exists ? prev.map((u) => (u.id === user.id ? user : u)) : [...prev, user];
            }
            return prev;
          });
        },
        onSettingsChange: (newSettings) => {
          if (!isMounted) return;
          setSettings((prev) => ({ ...prev, ...newSettings }));
        },
      },
      settings.supabaseUrl,
      settings.supabaseAnonKey
    );

    // 3. Auto-reconciliação quando a janela/aba ganha foco
    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshAllData(false);
      }
    };
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    // 4. Polling periódico de segurança (a cada 10s) para garantir sincronismo no ambiente de desenvolvimento
    const pollingInterval = setInterval(() => {
      refreshAllData(false);
    }, 10000);

    return () => {
      isMounted = false;
      unsubscribeRealtime();
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      clearInterval(pollingInterval);
    };
  }, [settings.supabaseUrl, settings.supabaseAnonKey, broadcastLinesState, broadcastMediaState, broadcastTestimonialsState]);

  // Sync to LocalStorage (Instant local persistence)
  useEffect(() => {
    localStorage.setItem('romance_itapema_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('romance_itapema_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('romance_itapema_media_items', JSON.stringify(mediaItems));
  }, [mediaItems]);

  useEffect(() => {
    localStorage.setItem('romance_itapema_testimonials', JSON.stringify(testimonials));
  }, [testimonials]);

  useEffect(() => {
    localStorage.setItem('romance_itapema_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('romance_itapema_admin_users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    localStorage.setItem('romance_itapema_commercial_lines', JSON.stringify(commercialLines));
  }, [commercialLines]);

  useEffect(() => {
    localStorage.setItem('romance_itapema_coupons', JSON.stringify(coupons));
  }, [coupons]);

  // Coupon Actions
  const handleSaveCoupon = (coupon: ReferralCoupon) => {
    setCoupons((prev) => {
      const couponCpfClean = (coupon.cpf || '').replace(/\D/g, '');
      const exists = prev.some((c) => c.id === coupon.id || (couponCpfClean && (c.cpf || '').replace(/\D/g, '') === couponCpfClean));
      if (exists) {
        return prev.map((c) => (c.id === coupon.id || (couponCpfClean && (c.cpf || '').replace(/\D/g, '') === couponCpfClean) ? coupon : c));
      }
      return [coupon, ...prev];
    });

    syncReferralCouponToSupabase(coupon, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase coupon sync notice:', err);
    });
  };

  const handleDeleteCoupon = (couponId: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    deleteReferralCouponFromSupabase(couponId, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase coupon delete notice:', err);
    });
  };

  // Lead Actions
  const handleAddLead = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
    // Asynchronously sync to Supabase
    syncLeadToSupabase(newLead, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase lead sync notice:', err);
    });
    triggerLeadNotification(newLead, 'form_submission');
  };

  const handleUpdateLeadStatus = (leadId: string, status: LeadStatus) => {
    let updatedLead: Lead | null = null;
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          updatedLead = { ...l, status };
          return updatedLead;
        }
        return l;
      })
    );

    if (updatedLead) {
      syncLeadToSupabase(updatedLead, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
    }
  };

  const handleAddLeadNote = (leadId: string, text: string) => {
    const newNote = {
      id: `note-${Date.now()}`,
      author: settings.distributorName || 'Distribuidora',
      text,
      createdAt: new Date().toISOString(),
    };
    let updatedLead: Lead | null = null;
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          updatedLead = { ...l, notes: [newNote, ...l.notes] };
          return updatedLead;
        }
        return l;
      })
    );

    if (updatedLead) {
      syncLeadToSupabase(updatedLead, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
    }
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    deleteLeadFromSupabase(leadId, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
  };

  // Order Actions
  const handleSaveOrder = (newOrder: ConsignmentOrder) => {
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === newOrder.id);
      if (exists) {
        return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
      }
      return [newOrder, ...prev];
    });

    syncOrderToSupabase(newOrder, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});

    // If order was created from a lead, mark that lead as 'kit_entregue'
    if (newOrder.leadId && newOrder.leadId !== 'manual') {
      handleUpdateLeadStatus(newOrder.leadId, 'kit_entregue');
    }
  };

  const handleSettlementComplete = (
    orderId: string,
    soldAmount: number,
    returnedAmount: number,
    resellerProfit: number,
    netCompanyAmount: number,
    notes: string
  ) => {
    let finalOrder: ConsignmentOrder | null = null;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          finalOrder = {
            ...ord,
            status: 'finalizado',
            settlementDate: new Date().toISOString(),
            soldAmount,
            returnedAmount,
            resellerProfit,
            netCompanyAmount,
            settlementNotes: notes,
          };
          return finalOrder;
        }
        return ord;
      })
    );

    if (finalOrder) {
      syncOrderToSupabase(finalOrder, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    deleteOrderFromSupabase(orderId, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
  };

  const handleUpdateSettings = async (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    localStorage.setItem('romance_itapema_settings', JSON.stringify(newSettings));
    
    // Instant cross-tab broadcast
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'SETTINGS_UPDATE', data: newSettings });
      }
    } catch {}

    try {
      await syncSettingsToSupabase(newSettings, newSettings.supabaseUrl, newSettings.supabaseAnonKey);
    } catch (err) {
      console.warn('Supabase settings sync notice:', err);
    }
  };

  // Admin User Actions
  const handleSaveAdminUser = (user: AdminUser) => {
    setAdminUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.map((u) => (u.id === user.id ? user : u));
      }
      return [...prev, user];
    });

    syncAdminUserToSupabase(user, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase admin user sync notice:', err);
    });
  };

  const handleDeleteAdminUser = (userId: string) => {
    setAdminUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteAdminUserFromSupabase(userId, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
  };

  // Commercial Line Actions (Gestão das Linhas Comerciais)
  const handleAddCommercialLine = (newLine: CommercialLine) => {
    setCommercialLines((prev) => {
      const updated = [...prev, newLine];
      broadcastLinesState(updated);
      return updated;
    });

    syncCommercialLineToSupabase(newLine, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase line sync notice:', err);
    });
  };

  const handleUpdateCommercialLine = (updatedLine: CommercialLine) => {
    setCommercialLines((prev) => {
      const updated = prev.map((l) => (l.id === updatedLine.id ? updatedLine : l));
      broadcastLinesState(updated);
      return updated;
    });

    syncCommercialLineToSupabase(updatedLine, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase line update notice:', err);
    });
  };

  const handleDeleteCommercialLine = (lineId: string) => {
    setCommercialLines((prev) => {
      const updated = prev.filter((l) => l.id !== lineId);
      broadcastLinesState(updated);
      return updated;
    });

    deleteCommercialLineFromSupabase(lineId, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase line delete notice:', err);
    });
  };

  const handleReorderCommercialLines = (reorderedLines: CommercialLine[]) => {
    setCommercialLines(reorderedLines);
    broadcastLinesState(reorderedLines);
    syncAllCommercialLinesToSupabase(reorderedLines, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase reorder lines sync notice:', err);
    });
  };

  const handleSyncCommercialLinesWithSupabase = async () => {
    try {
      await syncAllCommercialLinesToSupabase(commercialLines, settings.supabaseUrl, settings.supabaseAnonKey);
    } catch (e) {
      console.error('Erro ao sincronizar linhas comerciais com o Supabase:', e);
      throw e;
    }
  };

  // Media Actions
  const handleSaveMediaItem = (item: MediaItem) => {
    recentlyDeletedMediaIds.current.delete(item.id);

    setMediaItems((prev) => {
      const exists = prev.some((m) => m.id === item.id);
      const updated = exists
        ? prev.map((m) => (m.id === item.id ? item : m))
        : [item, ...prev];
      
      try {
        localStorage.setItem('romance_itapema_media_items', JSON.stringify(updated));
      } catch {}

      broadcastMediaState(updated);
      try {
        window.dispatchEvent(new CustomEvent('romance_media_sync', { detail: updated }));
      } catch {}
      return updated;
    });

    syncMediaItemToSupabase(item, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase media sync notice:', err);
    });
  };

  const handleDeleteMediaItem = (itemId: string) => {
    recentlyDeletedMediaIds.current.add(itemId);

    setMediaItems((prev) => {
      const updated = prev.filter((m) => m.id !== itemId);
      try {
        localStorage.setItem('romance_itapema_media_items', JSON.stringify(updated));
      } catch {}

      broadcastMediaState(updated);
      try {
        window.dispatchEvent(new CustomEvent('romance_media_sync', { detail: updated }));
      } catch {}
      return updated;
    });

    deleteMediaItemFromSupabase(itemId, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase media delete notice:', err);
    });
  };

  const handleToggleMediaActive = (item: MediaItem) => {
    const updated = { ...item, active: !item.active };
    handleSaveMediaItem(updated);
  };

  const handleToggleMediaFeatured = (item: MediaItem) => {
    const updated = { ...item, featured: !item.featured };
    handleSaveMediaItem(updated);
  };

  const handleSyncMediaWithSupabase = async () => {
    try {
      await syncAllMediaItemsToSupabase(mediaItems, settings.supabaseUrl, settings.supabaseAnonKey);
    } catch (e) {
      console.error('Erro ao sincronizar mídias com o Supabase:', e);
      throw e;
    }
  };

  // Testimonial Actions (Moderação do Distribuidor & Envio Público)
  const handleSaveTestimonial = (item: TestimonialItem) => {
    setTestimonials((prev) => {
      const exists = prev.some((t) => t.id === item.id);
      const updated = exists
        ? prev.map((t) => (t.id === item.id ? item : t))
        : [item, ...prev];
      
      broadcastTestimonialsState(updated);
      return updated;
    });

    syncTestimonialToSupabase(item, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase testimonial sync notice:', err);
    });
  };

  const handleDeleteTestimonial = (itemId: string) => {
    setTestimonials((prev) => {
      const updated = prev.filter((t) => t.id !== itemId);
      broadcastTestimonialsState(updated);
      return updated;
    });

    deleteTestimonialFromSupabase(itemId, settings.supabaseUrl, settings.supabaseAnonKey).catch((err) => {
      console.warn('Supabase testimonial delete notice:', err);
    });
  };

  const handleUpdateTestimonialStatus = (testimonialId: string, status: TestimonialStatus) => {
    let updatedItem: TestimonialItem | null = null;
    setTestimonials((prev) => {
      const updated = prev.map((t) => {
        if (t.id === testimonialId) {
          updatedItem = {
            ...t,
            status,
            approvedAt: status === 'approved' ? (t.approvedAt || new Date().toISOString()) : t.approvedAt,
            approvedBy: status === 'approved' ? (t.approvedBy || currentAdminUser?.name || settings.distributorName || 'Distribuidor') : t.approvedBy,
          };
          return updatedItem;
        }
        return t;
      });
      broadcastTestimonialsState(updated);
      return updated;
    });

    if (updatedItem) {
      syncTestimonialToSupabase(updatedItem, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
    }
  };

  const handleToggleTestimonialFeatured = (item: TestimonialItem) => {
    const updated = { ...item, featured: !item.featured };
    handleSaveTestimonial(updated);
  };

  const handleToggleTestimonialVerified = (item: TestimonialItem) => {
    const updated = { ...item, verified: !item.verified };
    handleSaveTestimonial(updated);
  };

  const handleSubmitPublicTestimonial = async (
    data: Omit<TestimonialItem, 'id' | 'status' | 'createdAt'>
  ): Promise<boolean> => {
    try {
      const res = await submitPublicTestimonialToSupabase(data, settings.supabaseUrl, settings.supabaseAnonKey);
      const newTestimonial: TestimonialItem = {
        ...data,
        id: res.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setTestimonials((prev) => {
        const updated = [newTestimonial, ...prev];
        broadcastTestimonialsState(updated);
        return updated;
      });
      return true;
    } catch (e) {
      console.error('Erro ao enviar depoimento público:', e);
      return false;
    }
  };

  const handleResetToDemoData = () => {
    setLeads(initialLeads);
    setOrders(initialOrders);
    setSettings(defaultSettings);
    setAdminUsers(defaultAdminUsers);
    setCommercialLines(productCategories);
    setMediaItems(initialMediaItems);
    setTestimonials(initialTestimonials);
    setResellers(initialResellers);
    setSalesProfiles(initialSalesProfiles);
    setCurrentReseller(null);
    localStorage.removeItem('romance_itapema_leads');
    localStorage.removeItem('romance_itapema_orders');
    localStorage.removeItem('romance_itapema_settings');
    localStorage.removeItem('romance_itapema_admin_users');
    localStorage.removeItem('romance_itapema_media_items');
    localStorage.removeItem('romance_modaitajai_testimonials');
    localStorage.removeItem('romance_modaitajai_commercial_lines');
    localStorage.removeItem('romance_itapema_resellers');
    localStorage.removeItem('romance_itapema_sales_profiles');
    localStorage.removeItem('romance_itapema_current_reseller');
  };

  const handleForceRefreshAll = async () => {
    setIsSyncing(true);
    try {
      const cloudData = await fetchAllCloudData(settings.supabaseUrl, settings.supabaseAnonKey);
      
      if (Array.isArray(cloudData.leads) && cloudData.leads.length > 0) {
        setLeads((prev) => {
          const cloudMap = new Map(cloudData.leads!.map((l) => [l.id, l]));
          const merged = [...cloudData.leads!];
          for (const localLead of prev) {
            if (!cloudMap.has(localLead.id)) merged.push(localLead);
          }
          return merged;
        });
      }
      if (Array.isArray(cloudData.orders) && cloudData.orders.length > 0) {
        setOrders((prev) => {
          const cloudMap = new Map(cloudData.orders!.map((o) => [o.id, o]));
          const merged = [...cloudData.orders!];
          for (const localOrder of prev) {
            if (!cloudMap.has(localOrder.id)) merged.push(localOrder);
          }
          return merged;
        });
      }
      if (Array.isArray(cloudData.resellers) && cloudData.resellers.length > 0) {
        setResellers((prev) => {
          const cloudMap = new Map(cloudData.resellers!.map((r) => [r.id, r]));
          const merged = [...cloudData.resellers!];
          for (const localReseller of prev) {
            if (!cloudMap.has(localReseller.id)) merged.push(localReseller);
          }
          return merged;
        });
      }
      if (Array.isArray(cloudData.salesProfiles) && cloudData.salesProfiles.length > 0) {
        setSalesProfiles((prev) => {
          const cloudMap = new Map(cloudData.salesProfiles!.map((p) => [p.id, p]));
          const merged = [...cloudData.salesProfiles!];
          for (const localProfile of prev) {
            if (!cloudMap.has(localProfile.id)) merged.push(localProfile);
          }
          return merged;
        });
      }
      if (Array.isArray(cloudData.adminUsers) && cloudData.adminUsers.length > 0) {
        setAdminUsers((prev) => {
          const cloudMap = new Map(cloudData.adminUsers!.map((u) => [u.id, u]));
          const merged = [...cloudData.adminUsers!];
          for (const localUser of prev) {
            if (!cloudMap.has(localUser.id)) merged.push(localUser);
          }
          return merged;
        });
      }
      if (Array.isArray(cloudData.mediaItems)) {
        setMediaItems((prev) => {
          if (cloudData.mediaItems!.length === 0) return prev;
          const validCloud = cloudData.mediaItems!.filter((m) => !recentlyDeletedMediaIds.current.has(m.id));
          const cloudMap = new Map(validCloud.map((m) => [m.id, m]));
          const merged = [...validCloud];
          for (const localItem of prev) {
            if (!recentlyDeletedMediaIds.current.has(localItem.id) && !cloudMap.has(localItem.id)) {
              merged.push(localItem);
            }
          }
          try {
            localStorage.setItem('romance_itapema_media_items', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
      if (Array.isArray(cloudData.testimonials)) {
        setTestimonials((prev) => {
          if (cloudData.testimonials!.length === 0) return prev;
          const cloudMap = new Map(cloudData.testimonials!.map((t) => [t.id, t]));
          const merged = [...cloudData.testimonials!];
          for (const localItem of prev) {
            if (!cloudMap.has(localItem.id)) merged.push(localItem);
          }
          return merged;
        });
      }
      if (Array.isArray(cloudData.commercialLines) && cloudData.commercialLines.length > 0) {
        setCommercialLines(cloudData.commercialLines);
      }
      if (cloudData.settings && Object.keys(cloudData.settings).length > 0) {
        setSettings((prev) => ({
          ...prev,
          ...cloudData.settings,
          supabaseUrl: prev.supabaseUrl,
          supabaseAnonKey: prev.supabaseAnonKey,
          supabaseConnected: true,
        }));
      }
    } catch (err) {
      console.warn('Manual refresh failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Navigation and scroll helpers
  const scrollToForm = (presetMessage?: string) => {
    const el = document.getElementById('cadastro');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('como-funciona');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToVideos = () => {
    const el = document.getElementById('sessao-videos') || document.getElementById('videos-oficiais');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToPhotos = () => {
    const el = document.getElementById('galeria-fotos') || document.getElementById('galeria-novidades');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPlanAndScroll = (wantsFavorita: 'sim' | 'nao') => {
    setPreselectedFavorita(wantsFavorita);
    scrollToForm();
  };

  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      setIsAdminView(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentAdminUser(user);
    setIsAdminAuthenticated(true);
    setIsLoginModalOpen(false);
    setIsAdminView(true);
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentAdminUser(null);
    setIsAdminView(false);
  };

  // Reseller Portal Handlers
  const handleOpenResellerPortal = () => {
    if (currentReseller) {
      setIsResellerDashboardView(true);
    } else {
      setIsResellerLoginModalOpen(true);
    }
  };

  const handleResellerLoginSuccess = (reseller: ResellerUser) => {
    setCurrentReseller(reseller);
    setIsResellerLoginModalOpen(false);
    setIsResellerDashboardView(true);
    setResellers((prev) => {
      const idx = prev.findIndex((r) => r.id === reseller.id || r.cpf.replace(/\D/g, '') === reseller.cpf.replace(/\D/g, ''));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...reseller, lastLogin: new Date().toISOString() };
        return next;
      }
      return [reseller, ...prev];
    });
    saveResellerUserToSupabase(reseller, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
  };

  const handleResellerRegister = (newReseller: ResellerUser) => {
    setResellers((prev) => {
      const filtered = prev.filter((r) => r.id !== newReseller.id && r.cpf.replace(/\D/g, '') !== newReseller.cpf.replace(/\D/g, ''));
      return [newReseller, ...filtered];
    });
    setCurrentReseller(newReseller);
    setIsResellerLoginModalOpen(false);
    setIsResellerDashboardView(true);
    saveResellerUserToSupabase(newReseller, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
  };

  const handleSaveSalesProfile = (profile: ResellerSalesProfile) => {
    setSalesProfiles((prev) => {
      const idx = prev.findIndex((p) => p.id === profile.id || p.resellerId === profile.resellerId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = profile;
        return updated;
      }
      return [profile, ...prev];
    });

    setResellers((prev) =>
      prev.map((r) =>
        r.id === profile.resellerId || (profile.resellerCpf && r.cpf.replace(/\D/g, '') === profile.resellerCpf.replace(/\D/g, ''))
          ? { ...r, hasSalesProfile: true, updatedAt: new Date().toISOString() }
          : r
      )
    );

    saveSalesProfileToSupabase(profile, settings.supabaseUrl, settings.supabaseAnonKey).catch(() => {});
  };

  const handleResellerLogout = () => {
    setCurrentReseller(null);
    setIsResellerDashboardView(false);
  };

  // Render Admin View if active
  if (isAdminView && isAdminAuthenticated) {
    return (
      <AdminDashboard
        leads={leads}
        orders={orders}
        coupons={coupons}
        resellers={resellers}
        salesProfiles={salesProfiles}
        settings={settings}
        commercialLines={commercialLines}
        mediaItems={mediaItems}
        testimonials={testimonials}
        adminUsers={adminUsers}
        currentAdminUser={currentAdminUser}
        isSyncing={isSyncing}
        realtimeStatus={realtimeStatus}
        onForceSyncLeads={handleForceRefreshAll}
        onUpdateLeadStatus={handleUpdateLeadStatus}
        onAddLeadNote={handleAddLeadNote}
        onDeleteLead={handleDeleteLead}
        onAddLead={handleAddLead}
        onSaveOrder={handleSaveOrder}
        onDeleteOrder={handleDeleteOrder}
        onSaveCoupon={handleSaveCoupon}
        onDeleteCoupon={handleDeleteCoupon}
        onSettlementComplete={handleSettlementComplete}
        onUpdateSettings={handleUpdateSettings}
        onAddLine={handleAddCommercialLine}
        onUpdateLine={handleUpdateCommercialLine}
        onDeleteLine={handleDeleteCommercialLine}
        onReorderLines={handleReorderCommercialLines}
        onSyncLinesWithSupabase={handleSyncCommercialLinesWithSupabase}
        onSyncMediaWithSupabase={handleSyncMediaWithSupabase}
        onSaveMediaItem={handleSaveMediaItem}
        onDeleteMediaItem={handleDeleteMediaItem}
        onToggleMediaActive={handleToggleMediaActive}
        onToggleMediaFeatured={handleToggleMediaFeatured}
        onSaveTestimonial={handleSaveTestimonial}
        onDeleteTestimonial={handleDeleteTestimonial}
        onUpdateTestimonialStatus={handleUpdateTestimonialStatus}
        onToggleTestimonialFeatured={handleToggleTestimonialFeatured}
        onToggleTestimonialVerified={handleToggleTestimonialVerified}
        onSaveAdminUser={handleSaveAdminUser}
        onDeleteAdminUser={handleDeleteAdminUser}
        onResetToDemoData={handleResetToDemoData}
        onSaveProfile={handleSaveSalesProfile}
        notifications={notifications}
        soundEnabled={notificationSoundEnabled}
        onToggleSound={handleToggleSound}
        onDismissNotification={handleDismissNotification}
        onClearAllNotifications={handleClearAllNotifications}
        onTriggerTestNotification={handleTriggerTestNotification}
        onBackToPublicSite={() => setIsAdminView(false)}
        onLogout={handleLogout}
      />
    );
  }

  // Render Reseller Dashboard View if active
  if (isResellerDashboardView && currentReseller) {
    const myProfile = salesProfiles.find(
      (p) =>
        p.resellerId === currentReseller.id ||
        (p.resellerCpf && p.resellerCpf.replace(/\D/g, '') === currentReseller.cpf.replace(/\D/g, ''))
    );

    return (
      <ResellerDashboard
        currentReseller={currentReseller}
        salesProfile={myProfile}
        settings={settings}
        onSaveProfile={handleSaveSalesProfile}
        onLogout={handleResellerLogout}
        onBackToSite={() => setIsResellerDashboardView(false)}
      />
    );
  }

  // Render Public Landing Page
  return (
    <div className="min-h-screen bg-[#fcf5f8] text-stone-900 flex flex-col font-sans selection:bg-rose-600 selection:text-white relative overflow-hidden pb-16 md:pb-0">
      {/* Decorative ambient glowing glass background orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-rose-200/35 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-0 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-0 w-[450px] h-[450px] bg-purple-100/35 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <Header
        settings={settings}
        onOpenAdmin={handleOpenAdmin}
        onScrollToForm={scrollToForm}
        onOpenLgpd={() => setIsLgpdModalOpen(true)}
        onOpenInstagramPromo={() => setIsInstagramModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenReferralModal={() => setIsReferralModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenResellerPortal={handleOpenResellerPortal}
        currentReseller={currentReseller}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          settings={settings}
          onScrollToForm={scrollToForm}
          onScrollToHowItWorks={scrollToHowItWorks}
          onScrollToVideos={scrollToVideos}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenReferralModal={() => setIsReferralModalOpen(true)}
        />

        {/* Exclusive Photo & Collection Carousel: Novidades 2026, Lingeries & Catálogo */}
        <MediaCarousel
          mediaItems={mediaItems}
          settings={settings}
          onScrollToForm={scrollToForm}
          onScrollToVideos={scrollToVideos}
        />

        {/* Exclusive Official Video Exhibition Suite: Romance Play */}
        <VideoShowcase 
          settings={settings}
          customVideos={mediaItems.filter((m) => m.type === 'video')}
          onScrollToForm={scrollToForm}
        />

        {/* 4 Pillars Rule Highlights */}
        <BusinessRuleHighlights onScrollToForm={scrollToForm} />

        {/* How It Works (Step by Step) */}
        <HowItWorks onScrollToForm={scrollToForm} />

        {/* Interactive Profit Simulator */}
        <ProfitCalculator onSelectPlanAndScroll={handleSelectPlanAndScroll} />

        {/* Deep explanation of Catálogo Favorita (40% commission with R$ 400 - R$ 600 first order) */}
        <CatalogExplanation settings={settings} onScrollToForm={scrollToForm} />

        {/* Visual Lingerie Showcase */}
        <ProductShowcase 
          settings={settings} 
          onScrollToForm={scrollToForm} 
          commercialLines={commercialLines}
        />

        {/* Promoção Estrelas Romance 2026: Concorra a Carro, Motos e Mais de R$ 450 Mil em Prêmios */}
        <RomanceEstrelas settings={settings} onScrollToForm={scrollToForm} />

        {/* Testimonials from Itajaí & SC */}
        <Testimonials 
          settings={settings} 
          testimonialsList={testimonials} 
          onSubmitTestimonial={handleSubmitPublicTestimonial}
        />

        {/* Instagram Promotion & Gift Campaign */}
        <InstagramPromoSection
          settings={settings}
          onScrollToForm={scrollToForm}
          onOpenModal={() => setIsInstagramModalOpen(true)}
        />

        {/* Indique & Ganhe (R$ 10,00 por Kit Entregue) */}
        <SharePromoSection
          settings={settings}
          onOpenReferralModal={() => setIsReferralModalOpen(true)}
        />

        {/* Pre-Registration Lead Form (LGPD Compliant) */}
        <LeadForm
          settings={settings}
          onAddLead={handleAddLead}
          onOpenLgpdModal={(tab) => handleOpenLegalModal(tab || 'privacy')}
          onOpenReferralModal={() => setIsReferralModalOpen(true)}
          preselectedFavorita={preselectedFavorita}
        />

        {/* FAQs */}
        <FaqSection 
          settings={settings}
          onScrollToForm={scrollToForm}
        />
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={handleOpenAdmin}
        onOpenLgpd={(tab) => handleOpenLegalModal(tab || 'privacy')}
        onScrollToForm={scrollToForm}
        onOpenReferralModal={() => setIsReferralModalOpen(true)}
        onOpenResellerPortal={handleOpenResellerPortal}
      />

      {/* Floating WhatsApp Button */}
      <WhatsAppFloating settings={settings} />

      {/* Floating Mobile Bottom Quick Action Bar */}
      <MobileBottomNav
        settings={settings}
        onScrollToForm={scrollToForm}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenReferralModal={() => setIsReferralModalOpen(true)}
      />

      {/* Compartilhe & Ganhe Modal (Opcional) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        settings={settings}
        onScrollToForm={scrollToForm}
      />

      {/* Instagram Gift Promotion Modal */}
      <InstagramGiftModal
        isOpen={isInstagramModalOpen}
        onClose={() => setIsInstagramModalOpen(false)}
        settings={settings}
        onScrollToForm={scrollToForm}
      />

      {/* LGPD & Legal Terms Modal */}
      <LgpdModal
        isOpen={isLgpdModalOpen}
        onClose={() => setIsLgpdModalOpen(false)}
        settings={settings}
        initialTab={legalModalTab}
      />

      {/* Cookie Consent Banner (LGPD Compliant) */}
      <CookieConsentBanner
        settings={settings}
        onOpenLegalModal={(tab) => handleOpenLegalModal(tab || 'cookies')}
      />

      {/* Interactive Global Search Modal & Topic Finder */}
      <SearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpen={() => setIsSearchOpen(true)}
        settings={settings}
        onScrollToSection={handleScrollToSection}
        onOpenInstagramPromo={() => setIsInstagramModalOpen(true)}
        onOpenLgpd={() => setIsLgpdModalOpen(true)}
        onOpenReferralModal={() => setIsReferralModalOpen(true)}
      />

      {/* Indique & Ganhe (Cupons e Créditos) Modal */}
      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        settings={settings}
        coupons={coupons}
        leads={leads}
        onSaveCoupon={handleSaveCoupon}
        onScrollToForm={scrollToForm}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        settings={settings}
        adminUsers={adminUsers}
        onCreateAdminUser={handleSaveAdminUser}
      />

      {/* Reseller Login & Registration Modal */}
      <ResellerLoginModal
        isOpen={isResellerLoginModalOpen}
        onClose={() => setIsResellerLoginModalOpen(false)}
        resellers={resellers}
        leads={leads}
        onLoginSuccess={handleResellerLoginSuccess}
        onRegisterReseller={handleResellerRegister}
      />
    </div>
  );
}
