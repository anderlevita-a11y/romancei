import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  ExternalLink, 
  Sparkles, 
  UserPlus, 
  MessageCircle, 
  MapPin, 
  Clock, 
  CheckCheck, 
  Volume2, 
  VolumeX, 
  ChevronRight,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { Lead, RealtimeLeadNotification } from '../../types';
import { formatPhone } from '../../utils/validators';

interface AdminLeadToastProps {
  notifications: RealtimeLeadNotification[];
  onDismiss: (id: string) => void;
  onOpenLead: (lead: Lead) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

// Subtle pleasant web audio chime for real-time alerts
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First tone (G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.25);

    // Second tone (C6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.45);
  } catch {
    // Ignore audio context autoplay limitations
  }
}

interface ToastCardProps {
  notification: RealtimeLeadNotification;
  onDismiss: () => void;
  onOpenLead: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

function ToastCard({
  notification,
  onDismiss,
  onOpenLead,
  soundEnabled,
  onToggleSound,
}: ToastCardProps) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = 9000; // 9 seconds

  useEffect(() => {
    if (isPaused) return;

    const interval = 50;
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, onDismiss]);

  const lead = notification.lead || ({} as any);
  const cleanPhone = (lead.phone || '').replace(/\D/g, '');
  const firstName = lead.fullName ? lead.fullName.split(' ')[0] : 'Revendedora';
  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
    `Olá ${firstName}! Aqui é da Distribuição Romance Oficial. Recebemos seu pré-cadastro e gostaríamos de agendar a entrega do seu mostruário consignado sem investimento inicial!`
  )}`;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="pointer-events-auto bg-stone-950/95 text-white rounded-2xl shadow-2xl border border-rose-500/30 overflow-hidden backdrop-blur-xl transition-all duration-300 transform translate-y-0 hover:scale-[1.01] relative animate-in fade-in slide-in-from-top-4"
    >
      {/* Glow highlight */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Progress Bar Header */}
      <div className="h-1 bg-stone-800 w-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-3.5 sm:p-4 space-y-3">
        {/* Header Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300">
                {notification.sourceType === 'realtime_api' ? '⚡ Novo Lead em Tempo Real' : 'Novo Pré-Cadastro'}
              </span>
              <span className="text-[9px] bg-white/10 px-1.5 py-0.2 rounded font-semibold text-stone-300">
                API Supabase
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSound}
              type="button"
              className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Silenciar alertas' : 'Ativar som de alertas'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onDismiss}
              type="button"
              className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lead Content Preview */}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight">
              {lead.fullName || 'Nova Candidata'}
            </h4>
            {lead.wantsFavorita40 === 'sim' ? (
              <span className="text-[10px] font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                Favorita (40%)
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-rose-950/80 text-rose-200 border border-rose-500/30 px-2 py-0.5 rounded-full shrink-0">
                Consignado (30-40%)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-stone-300">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{lead.city || 'Santa Catarina'} {lead.neighborhood ? `• ${lead.neighborhood}` : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lead.phone ? formatPhone(lead.phone) : 'Sem telefone'}</span>
            </div>
            {lead.protocol && (
              <span className="font-mono text-[10px] text-stone-400 bg-white/5 px-1.5 py-0.5 rounded">
                {lead.protocol}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDismiss}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/30 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => {
              onDismiss();
              onOpenLead();
            }}
            className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/30 cursor-pointer"
          >
            <span>Ver Cadastro</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminLeadToastContainer({
  notifications,
  onDismiss,
  onOpenLead,
  soundEnabled,
  onToggleSound,
}: AdminLeadToastProps) {
  // Only display unread / active toast cards (up to 3 stacked)
  const activeToasts = notifications.slice(0, 3);

  if (activeToasts.length === 0) return null;

  return (
    <div 
      className="fixed top-18 right-3 sm:right-6 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {activeToasts.map((item) => (
        <ToastCard
          key={item.id}
          notification={item}
          onDismiss={() => onDismiss(item.id)}
          onOpenLead={() => onOpenLead(item.lead)}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
        />
      ))}
    </div>
  );
}

// Notification Drawer / Panel for the Header Bell Button
interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: RealtimeLeadNotification[];
  onOpenLead: (lead: Lead) => void;
  onDismiss?: (id: string) => void;
  onClearAll: () => void;
  onTriggerTestNotification?: () => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onOpenLead,
  onDismiss,
  onClearAll,
  onTriggerTestNotification,
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-md bg-stone-950 text-white h-full shadow-2xl border-l border-white/10 flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Alertas em Tempo Real</span>
                <span className="text-xs bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                  {notifications.length}
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Notificações de novos leads recebidos via API
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2.5 bg-stone-900 border-b border-white/5 flex items-center justify-between text-xs">
          {onTriggerTestNotification && (
            <button
              type="button"
              onClick={onTriggerTestNotification}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simular Novo Lead</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-stone-400 hover:text-rose-400 transition-colors ml-auto cursor-pointer"
            >
              Limpar Histórico
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 space-y-3 text-stone-500">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-white/5 flex items-center justify-center mx-auto text-stone-600">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-400">Nenhum alerta recente</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Assim que uma nova revendedora se cadastrar no site ou via API, você receberá um alerta sonoro e visual instantâneo aqui.
              </p>
              {onTriggerTestNotification && (
                <button
                  type="button"
                  onClick={onTriggerTestNotification}
                  className="mt-2 text-xs bg-rose-600/80 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Testar Alerta Agora</span>
                </button>
              )}
            </div>
          ) : (
            notifications.map((item) => {
              const leadItem = item.lead || ({} as any);
              const cleanPhone = (leadItem.phone || '').replace(/\D/g, '');
              const whatsappUrl = `https://wa.me/55${cleanPhone}`;
              const timeFormatted = item.timestamp ? new Date(item.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }) : '';

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-stone-900 border border-white/10 hover:border-rose-500/40 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {leadItem.fullName || 'Nova Candidata'}
                      </h4>
                      <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span>{leadItem.city || 'Santa Catarina'}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3 text-stone-500" />
                        <span>{timeFormatted}</span>
                      </p>
                    </div>

                    <span className="text-[10px] font-bold bg-rose-950 text-rose-200 border border-rose-500/30 px-2 py-0.5 rounded-full shrink-0">
                      {leadItem.wantsFavorita40 === 'sim' ? 'Favorita 40%' : 'Consignado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
                    <span className="text-stone-400 font-mono text-[11px]">
                      {leadItem.phone ? formatPhone(leadItem.phone) : 'Sem telefone'}
                    </span>

                    <div className="flex items-center gap-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/30 transition-colors"
                        title="Chamar no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLead(leadItem);
                        }}
                        className="bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs py-1 px-2.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
