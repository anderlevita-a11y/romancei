import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  UserCheck, 
  AlertCircle, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  UserPlus, 
  Bell, 
  Smartphone, 
  CheckCircle,
  Laptop,
  Check
} from 'lucide-react';
import { ResellerUser, Lead } from '../../types';
import { 
  getDeviceDetails, 
  requestPushPermission, 
  checkPushPermission, 
  registerCurrentDeviceForReseller, 
  showNativePushNotification,
  recordPushLog,
  hasResellerAuthorizedPush,
  markResellerPushAuthorized 
} from '../../utils/webPushHelper';

interface ResellerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  resellers: ResellerUser[];
  leads?: Lead[];
  onLoginSuccess: (user: ResellerUser) => void;
  onRegisterReseller: (newUser: ResellerUser) => void;
}

export const ResellerLoginModal: React.FC<ResellerLoginModalProps> = ({
  isOpen,
  onClose,
  resellers,
  leads = [],
  onLoginSuccess,
  onRegisterReseller,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState(''); // CPF or Phone
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [regFullName, setRegFullName] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Etapa de Vínculo de Aparelho & Autorização de Web Push para acessar o painel
  const [pendingUser, setPendingUser] = useState<ResellerUser | null>(null);
  const [isAuthorizingPush, setIsAuthorizingPush] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  if (!isOpen) return null;

  const currentDevice = getDeviceDetails();

  // Formatação de CPF e Telefone
  const formatCpf = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const cleanDigits = (str: string) => str.replace(/\D/g, '');

  // Submissão do Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanId = cleanDigits(loginIdentifier);
    if (!cleanId) {
      setErrorMsg('Informe seu CPF ou telefone cadastrado.');
      return;
    }

    if (!loginPassword) {
      setErrorMsg('Informe sua senha.');
      return;
    }

    // Busca vendedora pelo CPF ou telefone
    const found = resellers.find((r) => {
      const rCpf = cleanDigits(r.cpf);
      const rPhone = cleanDigits(r.phone);
      return (rCpf === cleanId || rPhone === cleanId);
    });

    if (!found) {
      const foundLead = leads.find((l) => cleanDigits(l.cpf) === cleanId || cleanDigits(l.phone) === cleanId);
      if (foundLead) {
        setErrorMsg('Encontramos seu pré-cadastro! Clique na aba "Primeiro Acesso / Ativar" para cadastrar sua senha.');
        return;
      }
      setErrorMsg('Cadastro não encontrado com este CPF ou telefone. Se for seu primeiro acesso, clique na aba "Primeiro Acesso".');
      return;
    }

    // Valida senha (ou senha inicial 123)
    if (found.password && found.password !== loginPassword && found.password !== '123' && loginPassword !== '123') {
      setErrorMsg('Senha incorreta. Tente novamente ou use a senha padrão inicial (123).');
      return;
    }

    const updatedUser: ResellerUser = {
      ...found,
      lastLogin: new Date().toISOString(),
    };

    // Uma vez autorizado, não deve ser necessário ativar novamente ao fazer login
    const alreadyAuthorized =
      hasResellerAuthorizedPush(found.id, found.cpf) ||
      (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted');

    if (alreadyAuthorized) {
      registerCurrentDeviceForReseller(updatedUser, 'granted');
      onLoginSuccess(updatedUser);
      onClose();
      return;
    }

    // Se ainda não autorizado, exibe a etapa de vínculo ou encaminha ao painel onde há a caixa de aviso
    setPendingUser(updatedUser);
  };

  // Submissão do Cadastro / Ativação
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regFullName.trim()) {
      setErrorMsg('Informe seu nome completo.');
      return;
    }
    const cleanRegCpf = cleanDigits(regCpf);
    if (cleanRegCpf.length !== 11) {
      setErrorMsg('Informe um CPF válido com 11 dígitos.');
      return;
    }
    const cleanRegPhone = cleanDigits(regPhone);
    if (cleanRegPhone.length < 10) {
      setErrorMsg('Informe um WhatsApp válido com DDD.');
      return;
    }
    if (!regPassword || regPassword.length < 3) {
      setErrorMsg('A senha deve ter pelo menos 3 dígitos.');
      return;
    }

    const existing = resellers.find((r) => cleanDigits(r.cpf) === cleanRegCpf);
    if (existing) {
      const updated: ResellerUser = {
        ...existing,
        fullName: regFullName.trim() || existing.fullName,
        phone: regPhone || existing.phone,
        city: regCity.trim() || existing.city,
        password: regPassword,
        lastLogin: new Date().toISOString(),
      };
      onRegisterReseller(updated);
      const alreadyAuthorized =
        hasResellerAuthorizedPush(updated.id, updated.cpf) ||
        (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted');

      if (alreadyAuthorized) {
        registerCurrentDeviceForReseller(updated, 'granted');
        onLoginSuccess(updated);
        onClose();
        return;
      }
      setPendingUser(updated);
      return;
    }

    const newReseller: ResellerUser = {
      id: `reseller-${Date.now()}`,
      fullName: regFullName.trim(),
      cpf: regCpf,
      phone: regPhone,
      city: regCity.trim() || 'Itapema / Região - SC',
      password: regPassword,
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    onRegisterReseller(newReseller);
    const alreadyAuthorizedNew =
      typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';

    if (alreadyAuthorizedNew) {
      markResellerPushAuthorized(newReseller.id, newReseller.cpf);
      registerCurrentDeviceForReseller(newReseller, 'granted');
      onLoginSuccess(newReseller);
      onClose();
      return;
    }
    setPendingUser(newReseller);
  };

  // Demonstração rápida
  const handleQuickDemoLogin = () => {
    const demo = resellers[0] || {
      id: 'reseller-demo',
      fullName: 'Camila Silveira (Demonstração)',
      cpf: '123.456.789-01',
      phone: '(47) 99876-5432',
      city: 'Itapema - SC',
      password: '123',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    const alreadyAuthorized =
      hasResellerAuthorizedPush(demo.id, demo.cpf) ||
      (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted');

    if (alreadyAuthorized) {
      registerCurrentDeviceForReseller(demo, 'granted');
      onLoginSuccess(demo);
      onClose();
      return;
    }
    setPendingUser(demo);
  };

  // Ação de Autorização e Vínculo do Aparelho para Acesso ao Painel
  const handleAuthorizeAndEnter = async () => {
    if (!pendingUser) return;
    setIsAuthorizingPush(true);

    try {
      // 1. Solicita permissão nativa de notificações no navegador
      const perm = await requestPushPermission();

      // 2. Registra o aparelho vinculado ao nome e CPF da revendedora
      const deviceSub = registerCurrentDeviceForReseller(pendingUser, perm);

      // 3. Se autorizado, marca permanentemente para nunca mais pedir e dispara boas-vindas
      if (perm === 'granted') {
        markResellerPushAuthorized(pendingUser.id, pendingUser.cpf);
        showNativePushNotification('Romance Itapema: Aparelho Conectado!', {
          body: `Olá ${pendingUser.fullName.split(' ')[0]}! Notificações ativadas com sucesso. Você receberá os avisos de retorno do mostruário aqui.`,
          tag: `welcome-${pendingUser.id}`,
        });

        recordPushLog({
          id: `log-auth-${Date.now()}`,
          resellerId: pendingUser.id,
          resellerName: pendingUser.fullName,
          resellerCpf: pendingUser.cpf,
          deviceId: deviceSub.id,
          deviceName: deviceSub.deviceName,
          title: 'Romance Itapema: Aparelho Conectado!',
          body: 'Aparelho vinculado e autorizado para notificações de atendimento.',
          sentAt: new Date().toISOString(),
          triggerType: 'manual_distributor',
          status: 'delivered',
        });
      }

      setAuthSuccess(true);

      // 4. Conclui o login e abre o painel da revendedora
      setTimeout(() => {
        onLoginSuccess(pendingUser);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Erro na autorização do aparelho:', err);
      // Mesmo se houver rejeição de permissão no browser, vincula o aparelho com status padrão
      registerCurrentDeviceForReseller(pendingUser, 'default');
      onLoginSuccess(pendingUser);
      onClose();
    } finally {
      setIsAuthorizingPush(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/30">
            {pendingUser ? (
              <Bell className="w-6 h-6 text-white animate-bounce" />
            ) : (
              <UserCheck className="w-6 h-6 text-white" />
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {pendingUser ? 'Vínculo do Aparelho & Notificações' : 'Portal da Revendedora'}
          </h2>
          <p className="text-xs text-rose-100 mt-1 max-w-xs mx-auto">
            {pendingUser
              ? 'Autorize o Web Push para receber alertas de retorno de atendimento e novidades'
              : 'Acesse seu espaço exclusivo para definir seu Perfil de Vendas e orientar a montagem da sacola'}
          </p>
        </div>

        {/* ETAPA MANDATÓRIA DE VÍNCULO DE APARELHO E AUTORIZAÇÃO DE PUSH */}
        {pendingUser ? (
          <div className="p-6 space-y-5 animate-fade-in">
            <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Revendedora:</span>
                <span className="text-rose-800 font-semibold">{pendingUser.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">CPF:</span>
                <span className="text-slate-600 font-mono">{pendingUser.cpf}</span>
              </div>
            </div>

            {/* Aparelho Detectado */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Smartphone className="w-4 h-4 text-rose-600" />
                <span>Aparelho Detectado para Vínculo:</span>
              </div>
              <div className="pl-6 space-y-0.5 text-slate-600">
                <p className="font-semibold text-slate-900">{currentDevice.deviceName}</p>
                <p className="text-[11px] text-slate-500">{currentDevice.os} • {currentDevice.browser}</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80">
              <p>
                🔔 <strong>Diretriz Romance Itapema:</strong> Para acessar o painel, este aparelho será vinculado ao seu nome para envio automático das datas de retorno do atendimento e acerto da sacola diretamente na sua área de notificações.
              </p>
            </div>

            {authSuccess ? (
              <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-center gap-2 animate-fade-in">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Aparelho vinculado e notificações ativadas com sucesso! Entrando...</span>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleAuthorizeAndEnter}
                  disabled={isAuthorizingPush}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-60"
                >
                  <Bell className="w-4 h-4" />
                  <span>
                    {isAuthorizingPush ? 'Autorizando aparelho...' : 'Autorizar Notificações & Acessar Meu Painel'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    registerCurrentDeviceForReseller(pendingUser, 'default');
                    onLoginSuccess(pendingUser);
                    onClose();
                  }}
                  className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Continuar com permissão padrão do aparelho
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 bg-rose-50/70 p-1 border-b border-rose-100 text-sm font-medium">
              <button
                type="button"
                onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`py-2.5 rounded-xl transition-all ${
                  tab === 'login'
                    ? 'bg-white text-rose-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Já sou Revendedora
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`py-2.5 rounded-xl transition-all ${
                  tab === 'register'
                    ? 'bg-white text-rose-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Primeiro Acesso / Ativar
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6">
              {errorMsg && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      CPF ou Telefone Cadastrado
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Seu CPF ou WhatsApp cadastrado"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-slate-50 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Sua Senha
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Digite sua senha (padrão: 123)"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-slate-50 focus:bg-white transition-all"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      * Senha padrão de primeiro acesso: <strong>123</strong>
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-200 active:scale-95"
                  >
                    <span>Entrar & Vincular Aparelho</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                      <span>Testar Acesso com Revendedora Demonstração</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs bg-slate-50 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        CPF *
                      </label>
                      <input
                        type="text"
                        value={regCpf}
                        onChange={(e) => setRegCpf(formatCpf(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs bg-slate-50 focus:bg-white transition-all font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        WhatsApp *
                      </label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(formatPhone(e.target.value))}
                        placeholder="(47) 90000-0000"
                        maxLength={15}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs bg-slate-50 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Cidade / Bairro
                    </label>
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="Ex: Itapema - SC (Meia Praia)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Criar Senha de Acesso *
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Crie uma senha (mínimo 3 dígitos)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs bg-slate-50 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-200 active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Ativar Cadastro & Vincular Aparelho</span>
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
