/**
 * Utilitário de Autenticação Biométrica via WebAuthn (Credentials API do Navegador)
 * Suporta Touch ID, Face ID, Windows Hello e Biometria Digital em Android/iOS.
 */

export interface BiometricSecurityConfig {
  enabled: boolean;
  requireOnLogin: boolean;
  requireOnSettlement: boolean;
  autoBiometricLogin?: boolean; // Entrar diretamente com biometria no painel de login
  credentialId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  registeredAt?: string;
  deviceName?: string;
}

const STORAGE_KEY = 'romance_biometric_security_config';

// Utilitários para conversão de Base64URL e Uint8Array
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function getRandomChallenge(length = 32): Uint8Array {
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return array;
}

/**
 * Detecta se o navegador suporta Web Authentication API
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined' &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

/**
 * Detecta se o dispositivo possui autenticador biométrico local (Touch ID / Face ID / Windows Hello / Sensor Digital)
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  } catch (err) {
    console.warn('Erro ao verificar autenticador biométrico da plataforma:', err);
    return false;
  }
}

/**
 * Obtém as configurações de segurança biométrica salvas no navegador
 */
export function getBiometricConfig(): BiometricSecurityConfig {
  if (typeof window === 'undefined') {
    return { enabled: false, requireOnLogin: false, requireOnSettlement: false };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { enabled: false, requireOnLogin: false, requireOnSettlement: false };
    }
    return JSON.parse(raw);
  } catch {
    return { enabled: false, requireOnLogin: false, requireOnSettlement: false };
  }
}

/**
 * Salva as configurações de segurança biométrica
 */
export function saveBiometricConfig(config: Partial<BiometricSecurityConfig>): BiometricSecurityConfig {
  const current = getBiometricConfig();
  const updated: BiometricSecurityConfig = {
    ...current,
    ...config,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Erro ao salvar configuração biométrica:', e);
  }
  return updated;
}

/**
 * Ativa ou desativa a entrada direta automática por biometria via chave seletora
 */
export function setAutoBiometricLogin(enabled: boolean): BiometricSecurityConfig {
  return saveBiometricConfig({
    autoBiometricLogin: enabled,
    // Se ativou o login direto, também mantém enabled como true
    enabled: enabled ? true : undefined,
  });
}

/**
 * Remove o cadastro biométrico deste dispositivo
 */
export function clearBiometricConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Erro ao limpar configuração biométrica:', e);
  }
}

/**
 * Cadastra / Vincula a biometria do dispositivo (WebAuthn Registration)
 */
export async function registerDeviceBiometrics(user: {
  id?: string;
  name: string;
  email: string;
}): Promise<{
  success: boolean;
  credentialId?: string;
  error?: string;
  canceled?: boolean;
}> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: 'Seu navegador não possui suporte para autenticação biométrica (WebAuthn).',
    };
  }

  try {
    const userId = user.id || `admin-${Date.now()}`;
    const userEncoder = new TextEncoder();
    const userIdBuffer = userEncoder.encode(userId);
    const challenge = getRandomChallenge();

    const rpId = window.location.hostname;

    // Configuração de criação de credencial de chave pública
    const creationOptions: CredentialCreationOptions = {
      publicKey: {
        challenge,
        rp: {
          name: 'Romance Distribuição Oficial - Gestão',
          id: rpId === 'localhost' || rpId.endsWith('.app') || rpId.endsWith('.com.br') || rpId.includes('.') ? rpId : undefined,
        },
        user: {
          id: userIdBuffer,
          name: user.email,
          displayName: user.name || 'Administrador Romance',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256 (Padrão mais amplo)
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Touch ID / Face ID / Windows Hello / Digital
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    };

    const credential = (await navigator.credentials.create(creationOptions)) as PublicKeyCredential | null;

    if (!credential || !credential.id) {
      return { success: false, error: 'Não foi possível concluir o registro biométrico.' };
    }

    const credentialId = credential.id;

    // Detecta nome amigável do dispositivo
    const userAgent = navigator.userAgent;
    let deviceName = 'Dispositivo Atual';
    if (/iPhone|iPad|iPod/i.test(userAgent)) deviceName = 'iPhone / iPad (Touch ID ou Face ID)';
    else if (/Macintosh|Mac OS X/i.test(userAgent)) deviceName = 'Mac (Touch ID)';
    else if (/Android/i.test(userAgent)) deviceName = 'Smartphone Android (Digital)';
    else if (/Windows/i.test(userAgent)) deviceName = 'PC Windows (Windows Hello)';

    // Salva a configuração atualizada
    saveBiometricConfig({
      enabled: true,
      credentialId,
      userId,
      userName: user.name,
      userEmail: user.email,
      registeredAt: new Date().toISOString(),
      deviceName,
    });

    return {
      success: true,
      credentialId,
    };
  } catch (err: any) {
    console.warn('Erro durante registro biométrico WebAuthn:', err);
    if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
      return {
        success: false,
        canceled: true,
        error: 'O cadastro biométrico foi cancelado ou não autorizado pelo usuário.',
      };
    }
    return {
      success: false,
      error: err.message || 'Falha ao registrar biometria no dispositivo.',
    };
  }
}

/**
 * Autentica o usuário solicitando a biometria do dispositivo (WebAuthn Authentication)
 */
export async function authenticateDeviceBiometrics(options?: {
  promptReason?: string;
}): Promise<{
  success: boolean;
  error?: string;
  canceled?: boolean;
  userEmail?: string;
  userName?: string;
}> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: 'Seu navegador não possui suporte para autenticação biométrica.',
    };
  }

  const config = getBiometricConfig();

  try {
    const challenge = getRandomChallenge();
    const rpId = window.location.hostname;

    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    if (config.credentialId) {
      try {
        allowCredentials.push({
          type: 'public-key',
          id: base64UrlToBuffer(config.credentialId),
          transports: ['internal'],
        });
      } catch {
        // Se a conversão do ID falhar, tenta autenticação aberta sem restrição de credencial específica
      }
    }

    const requestOptions: CredentialRequestOptions = {
      publicKey: {
        challenge,
        rpId: rpId === 'localhost' || rpId.endsWith('.app') || rpId.endsWith('.com.br') || rpId.includes('.') ? rpId : undefined,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: 'required',
        timeout: 60000,
      },
    };

    const assertion = (await navigator.credentials.get(requestOptions)) as PublicKeyCredential | null;

    if (assertion && assertion.id) {
      return {
        success: true,
        userEmail: config.userEmail,
        userName: config.userName,
      };
    }

    return {
      success: false,
      error: 'Validação biométrica não confirmada.',
    };
  } catch (err: any) {
    console.warn('Erro durante verificação biométrica WebAuthn:', err);
    if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
      return {
        success: false,
        canceled: true,
        error: 'Validação biométrica cancelada ou expirada.',
      };
    }
    return {
      success: false,
      error: err.message || 'Não foi possível validar a biometria neste dispositivo.',
    };
  }
}
