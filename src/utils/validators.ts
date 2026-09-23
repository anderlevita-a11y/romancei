/**
 * Utility functions for masks, validations, calculations and formatting
 */

// Validador matemático do CPF Brasileiro
export function isValidCPF(cpf: string): boolean {
  if (!cpf || typeof cpf !== 'string') return false;
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Elimina CPFs conhecidos inválidos como 111.111.111-11
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Valida 1º dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9), 10)) return false;
  
  // Valida 2º dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10), 10)) return false;
  
  return true;
}

// Máscara de CPF: 000.000.000-00
export function maskCPF(value: string): string {
  if (!value || typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Máscara de Telefone: (00) 00000-0000 ou (00) 0000-0000
export function maskPhone(value: string): string {
  if (!value || typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2');
}

export function formatPhone(value: string): string {
  return maskPhone(value);
}

// Máscara de Data: DD/MM/AAAA
export function maskDate(value: string): string {
  if (!value || typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

// Calcula idade a partir da data de nascimento (DD/MM/AAAA ou YYYY-MM-DD)
export function calculateAge(birthDateStr: string): number | null {
  if (!birthDateStr || typeof birthDateStr !== 'string') return null;
  
  let birthDate: Date;
  if (birthDateStr.includes('/')) {
    const [day, month, year] = birthDateStr.split('/').map(Number);
    if (!day || !month || !year || year < 1920) return null;
    birthDate = new Date(year, month - 1, day);
  } else {
    birthDate = new Date(birthDateStr);
  }

  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

// Formata moeda Real (BRL)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Formata data ISO para PT-BR
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

// Calcula dias restantes para o acerto (40 dias)
export function getDaysRemaining(dueDateStr: string): {
  days: number;
  label: string;
  isOverdue: boolean;
  isUrgent: boolean;
} {
  const due = new Date(dueDateStr);
  const now = new Date();
  // Zera horas para comparar apenas datas
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: Math.abs(diffDays),
      label: `${Math.abs(diffDays)} dias atrasado`,
      isOverdue: true,
      isUrgent: true,
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      label: 'Acerto é Hoje!',
      isOverdue: false,
      isUrgent: true,
    };
  } else if (diffDays <= 7) {
    return {
      days: diffDays,
      label: `Faltam ${diffDays} dias (Atenção)`,
      isOverdue: false,
      isUrgent: true,
    };
  } else {
    return {
      days: diffDays,
      label: `Faltam ${diffDays} dias`,
      isOverdue: false,
      isUrgent: false,
    };
  }
}

// Gera código de cupom de indicação padronizado a partir do nome e CPF
export function generateCouponCode(fullName: string = '', cpf: string = ''): string {
  const cleanCpf = (cpf || '').replace(/\D/g, '');
  const last4 = cleanCpf.slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
  const firstName = (fullName || '')
    .trim()
    .split(' ')[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const prefix = firstName.slice(0, 5) || 'ROMANCE';
  return `${prefix}${last4}`;
}

export function sanitizeCouponCode(code: string = ''): string {
  if (!code || typeof code !== 'string') return '';
  return code
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9-]/g, '');
}

export function generateProtocol(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ROM-${random}`;
}

// Formata link de WhatsApp direto com mensagem
export function buildWhatsAppLink(phone: string = '', message: string = ''): string {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

// Formata link do perfil do Instagram
export function buildInstagramLink(handle: string = '@romanceitapema'): string {
  const target = handle || '@romanceitapema';
  const cleanHandle = (typeof target === 'string' ? target : '@romanceitapema').replace('@', '').trim();
  return `https://www.instagram.com/${cleanHandle}/`;
}

// Converte URLs gs:// do Firebase Storage para links HTTP válidos no navegador
export function resolveStorageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('gs://')) {
    const withoutPrefix = url.replace('gs://', '');
    const firstSlash = withoutPrefix.indexOf('/');
    if (firstSlash !== -1) {
      const bucket = withoutPrefix.substring(0, firstSlash);
      const filePath = encodeURIComponent(withoutPrefix.substring(firstSlash + 1));
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${filePath}?alt=media`;
    }
  }
  return url;
}

