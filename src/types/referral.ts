export interface ReferralCoupon {
  id: string;
  code: string; // ex: "ROMANCE-AND123" ou "IND-CPF"
  fullName: string;
  cpf: string; // Unico: apenas 1 cupom por CPF
  phone: string;
  creditBalance: number; // R$ 10,00 por indicação aprovada/entregue
  totalReferralsCount: number; // Total de cadastros usando este cupom
  deliveredReferralsCount: number; // Total que teve kit entregue / aprovado
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface ReferralStatementItem {
  id: string;
  couponCode: string;
  leadName: string;
  leadProtocol: string;
  leadCity: string;
  status: 'pendente' | 'creditado_kit_entregue' | 'cancelado';
  creditAmount: number; // 10.00 quando kit entregue
  registeredAt: string;
  deliveredAt?: string;
}
