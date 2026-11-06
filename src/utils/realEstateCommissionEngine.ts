/**
 * Real Estate Multi-Stakeholder Commission Engine & Digital Contract Protocol
 * Dış Paydaş (Freelance/Partner) Hakediş Havuzu, Net/Brüt Masraf Ayrımı,
 * ACID Cari Hesap Entegrasyonu, OTP+IP Hukuki Mühür & Değişmezlik Koruması
 */

export type StakeholderRole = 
  | 'portfolio_source'  // Portföyü Getiren (Dış Paydaş veya İç Danışman)
  | 'lead_source'       // Alıcı/Kiracı Müşteriyi Getiren (Dış Paydaş veya İç Danışman)
  | 'closing_agent'     // Satışı Kapatan Danışman
  | 'company'           // Şirket / Ofis Kâr Payı
  | 'custom_partner';   // Özel Çözüm Ortağı / Yönlendiren

export type PayoutStatus = 
  | 'pending_agreement'   // Sözleşme taslağı oluşturuldu, dijital imza + OTP bekleniyor
  | 'agreement_signed'    // Paydaş dijital sözleşmeyi OTP & IP ile onayladı (Kilitli / Immutable)
  | 'ready_for_payout'    // İşlem kapandı, ödemeye hazır
  | 'paid'                // ACID Transaction ile Cari Hesaba (Wallet) alacak yansıtıldı
  | 'cancelled';          // Sözleşme feshedildi / şartlar oluşmadı / iptal edildi

export interface CommissionStakeholder {
  id: string;
  consultant_id?: number | null;
  name: string;
  phone?: string;
  email?: string;
  role: StakeholderRole;
  roleLabel: string;
  is_external: boolean;
  percentage: number;            // e.g. 20 (for %20)
  original_percentage?: number;  // Fesih öncesi anlaşılan oran (arşiv kaydı için)
  calculated_amount: number;     // e.g. 18,000 GBP
  currency: string;
  payout_status: PayoutStatus;
  is_locked: boolean;            // Sözleşme onaylandıktan sonra doğrudan silinmeye karşı kilitli (fesih ile açılır)
  signed_at?: string;            // ISO timestamp
  signed_ip?: string;            // Imzalayan IP adresi
  otp_code?: string;             // 6 haneli SMS/WhatsApp OTP doğrulama kodu
  legal_seal?: string;           // "Bu sözleşme [IP] üzerinden [Tarih/Saat] anında dijital olarak mühürlenmiştir"
  signed_signature?: string;     // Base64 signature image or digital stamp
  token?: string;                // Tokenized secure confirmation key
  company_id?: number;           // Cari Hesap (companies) ID
  ledger_transaction_id?: number;// current_account_transactions ID
  posted_at?: string;            // Cariye işlenme zamanı
  cancelled_at?: string;         // Sözleşme fesih tarihi
  cancel_reason?: string;        // Fesih nedeni (örn: Alıcı/Mülk şartları oluşmadı)
  cancel_type?: 'mutual' | 'unilateral_office' | 'conditions_not_met';
  iban?: string;
  company_name?: string;
  notes?: string;
}

export interface DealExpense {
  id: string;
  title: string;                 // e.g. "Drone Çekimi & Prodüksiyon", "Dijital Reklam Bütçesi"
  amount: number;
  currency: string;
  deductible: boolean;           // Havuzdan düşülecek mi?
  created_at: string;
}

export interface CommissionPool {
  property_id?: number;
  deal_id?: string | number;
  gross_commission: number;      // Toplam brüt hizmet bedeli (örn. 100,000 Birim)
  currency: string;
  calculation_mode: 'net' | 'gross'; // Masraflar düşüldükten sonra (Net) veya Brüt
  expenses: DealExpense[];
  total_expenses: number;
  net_distributable_commission: number; // Dağıtıma esas taban tutar
  stakeholders: CommissionStakeholder[];
  company_share_percent: number; // Ofis payı (%)
  company_share_amount: number;  // Ofis net kârı
  all_external_signed: boolean;  // Tüm dış paydaşlar sözleşmeyi imzaladı mı?
  pending_signatures_count: number;
  accounting_posted?: boolean;   // Kapanışta ACID Transaction ile Cari Hesaba alacak yazıldı mı?
  accounting_posted_at?: string;
  ledger_entries?: Array<{
    stakeholder_name: string;
    company_id: number;
    transaction_id: number;
    amount: number;
    currency: string;
    posted_at: string;
  }>;
  revision_history?: Array<{
    date: string;
    revised_by: string;
    reason: string;
    previous_state: any;
  }>;
}

/**
 * Default standard commission pool template
 */
export function createDefaultCommissionPool(
  grossCommission: number,
  currency = 'GBP',
  options?: {
    portfolioPartner?: { id?: number; name: string; phone?: string; is_external?: boolean; rate?: number };
    leadPartner?: { id?: number; name: string; phone?: string; is_external?: boolean; rate?: number };
    closingAgent?: { id?: number; name: string; phone?: string; is_external?: boolean; rate?: number };
    calculationMode?: 'net' | 'gross';
    expenses?: DealExpense[];
  }
): CommissionPool {
  const mode = options?.calculationMode || 'net';
  const expenses = options?.expenses || [];
  const totalExp = expenses
    .filter(e => e.deductible)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const basePool = mode === 'net' ? Math.max(0, grossCommission - totalExp) : grossCommission;

  const stakeholders: CommissionStakeholder[] = [];

  if (options?.portfolioPartner?.name) {
    const rate = options.portfolioPartner.rate ?? 20;
    const isExt = !!options.portfolioPartner.is_external;
    stakeholders.push({
      id: `stk_prop_${Date.now()}_1`,
      consultant_id: options.portfolioPartner.id || null,
      name: options.portfolioPartner.name,
      phone: options.portfolioPartner.phone,
      role: 'portfolio_source',
      roleLabel: 'Portföy Kaynağı',
      is_external: isExt,
      percentage: rate,
      calculated_amount: Math.round((basePool * rate) / 100),
      currency,
      payout_status: isExt ? 'pending_agreement' : 'agreement_signed',
      is_locked: false,
      token: generateToken()
    });
  }

  if (options?.leadPartner?.name) {
    const rate = options.leadPartner.rate ?? 20;
    const isExt = !!options.leadPartner.is_external;
    stakeholders.push({
      id: `stk_lead_${Date.now()}_2`,
      consultant_id: options.leadPartner.id || null,
      name: options.leadPartner.name,
      phone: options.leadPartner.phone,
      role: 'lead_source',
      roleLabel: 'Müşteri Kaynağı',
      is_external: isExt,
      percentage: rate,
      calculated_amount: Math.round((basePool * rate) / 100),
      currency,
      payout_status: isExt ? 'pending_agreement' : 'agreement_signed',
      is_locked: false,
      token: generateToken()
    });
  }

  if (options?.closingAgent?.name) {
    const rate = options.closingAgent.rate ?? 10;
    const isExt = !!options.closingAgent.is_external;
    stakeholders.push({
      id: `stk_close_${Date.now()}_3`,
      consultant_id: options.closingAgent.id || null,
      name: options.closingAgent.name,
      phone: options.closingAgent.phone,
      role: 'closing_agent',
      roleLabel: 'Kapanış Danışmanı',
      is_external: isExt,
      percentage: rate,
      calculated_amount: Math.round((basePool * rate) / 100),
      currency,
      payout_status: 'agreement_signed',
      is_locked: false
    });
  }

  return recalculateCommissionPool({
    gross_commission: grossCommission,
    currency,
    calculation_mode: mode,
    expenses,
    total_expenses: totalExp,
    net_distributable_commission: basePool,
    stakeholders,
    company_share_percent: 50,
    company_share_amount: 0,
    all_external_signed: true,
    pending_signatures_count: 0
  });
}

/**
 * Re-evaluates entire pool math and signing states.
 * Cancelled ('cancelled') stakeholders do not take any commission share (amount = 0).
 */
export function recalculateCommissionPool(pool: CommissionPool): CommissionPool {
  const mode = pool.calculation_mode || 'net';
  const totalExp = (pool.expenses || [])
    .filter(e => e.deductible)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const basePool = mode === 'net' ? Math.max(0, pool.gross_commission - totalExp) : pool.gross_commission;

  let totalAllocatedPercent = 0;
  let totalAllocatedAmount = 0;

  const updatedStakeholders = (pool.stakeholders || []).map(stk => {
    if (stk.payout_status === 'cancelled') {
      return {
        ...stk,
        calculated_amount: 0,
        currency: pool.currency
      };
    }
    const amount = Math.round((basePool * (Number(stk.percentage) || 0)) / 100);
    totalAllocatedPercent += Number(stk.percentage) || 0;
    totalAllocatedAmount += amount;
    return {
      ...stk,
      calculated_amount: amount,
      currency: pool.currency
    };
  });

  const companyPercent = Math.max(0, 100 - totalAllocatedPercent);
  const companyAmount = Math.max(0, basePool - totalAllocatedAmount);

  const pendingExt = updatedStakeholders.filter(s => s.is_external && s.payout_status === 'pending_agreement');

  return {
    ...pool,
    total_expenses: totalExp,
    net_distributable_commission: basePool,
    stakeholders: updatedStakeholders,
    company_share_percent: companyPercent,
    company_share_amount: companyAmount,
    all_external_signed: pendingExt.length === 0,
    pending_signatures_count: pendingExt.length
  };
}

/**
 * CRITICAL CHECKPOINT VALIDATION:
 * Validates whether an operator can move a deal/property to "5. Başarılı (Closed)".
 * If an active external partner has not signed the digital agreement, BLOCKS CLOSING!
 */
export interface CheckpointValidation {
  canProceed: boolean;
  blockingReason?: string;
  unsignedPartners: CommissionStakeholder[];
}

export function validateCheckpointForClosing(pool?: CommissionPool | null): CheckpointValidation {
  if (!pool || !pool.stakeholders || pool.stakeholders.length === 0) {
    return { canProceed: true, unsignedPartners: [] };
  }

  const unsigned = pool.stakeholders.filter(
    s => s.is_external && s.payout_status === 'pending_agreement'
  );

  if (unsigned.length > 0) {
    const names = unsigned.map(u => `${u.name} (%${u.percentage})`).join(', ');
    return {
      canProceed: false,
      blockingReason: `Paydaş Sözleşme Onayı Bekleniyor! Dış paydaş (${names}) OTP ve IP mühürlü dijital onay vermeden işlem Kapanış/Başarılı statüsüne taşınamaz.`,
      unsignedPartners: unsigned
    };
  }

  return { canProceed: true, unsignedPartners: [] };
}

/**
 * Generates WhatsApp cancellation / termination notice text for the partner
 */
export function getPartnerWhatsAppCancellationNotice(
  property: { id?: number | string; title: string; reference_no?: string },
  stakeholder: CommissionStakeholder,
  storeName: string,
  reason: string
): string {
  const ref = property.reference_no || 'REF';
  const rate = stakeholder.original_percentage ?? stakeholder.percentage;
  return `Sayın *${stakeholder.name}*,

*${storeName}* ile *${property.title}* [REF: ${ref}] portföyü kapsamında (${stakeholder.roleLabel} - %${rate} pay) tanzim edilen Dijital Gelir Paylaşım Sözleşmesi ve Paydaşlık kaydınız aşağıdaki gerekçe ile *FESHEDİLMİŞ / İPTAL EDİLMİŞTİR*:

• Fesih Gerekçesi: *${reason}*
• Fesih Tarihi: *${new Date().toLocaleString('tr-TR')}*

İlgili işlem ve sözleşme hükümleri karşılıklı/tek taraflı olarak sona ermiş olup, bu işlem özelinde herhangi bir hak ve alacak kalmadığını bilgilerinize sunarız.

_${storeName} Yönetim & Hukuk Servisi_`;
}

/**
 * Generates a secure URL for the partner to sign the agreement via WhatsApp (/contract/sign/:id)
 */
export function getPartnerDigitalContractLink(
  propertyId: number | string,
  stakeholder: CommissionStakeholder,
  host = window.location.origin
): string {
  const token = stakeholder.token || generateToken();
  const params = new URLSearchParams({
    templateId: 'external_partner_revenue_share',
    partnerId: stakeholder.id,
    client: stakeholder.name || '',
    phone: stakeholder.phone || '',
    commissionRate: `%${stakeholder.percentage}`,
    token
  });
  return `${host}/contract/sign/${propertyId}?${params.toString()}`;
}

/**
 * Generates WhatsApp invite text for digital signature with OTP code
 */
export function getPartnerWhatsAppContractInvite(
  property: { id?: number | string; title: string; reference_no?: string },
  stakeholder: CommissionStakeholder,
  pool: CommissionPool,
  storeName: string,
  otpCode?: string
): string {
  const ref = property.reference_no || 'REF';
  const propId = property.id || '1';
  const link = getPartnerDigitalContractLink(propId, stakeholder);
  const modeText = pool.calculation_mode === 'net' ? 'ortak masraflar düşüldükten sonra net' : 'brüt hizmet bedeli üzerinden';
  const otp = otpCode || stakeholder.otp_code || String(Math.floor(100000 + Math.random() * 900000));

  return `Merhaba Sn. *${stakeholder.name}*,

*${storeName}* ile ortak yürüttüğümüz *${property.title}* [REF: ${ref}] portföy işleminde, ${stakeholder.roleLabel} olarak adınıza tanımlanan *%${stakeholder.percentage} (${stakeholder.calculated_amount.toLocaleString('tr-TR')} ${pool.currency})* hakediş için dijital "Gelir Paylaşım Protokolü" hazırlanmıştır.

• Hesaplama Esası: ${modeText}
• Kesinleşecek Hakediş: *${stakeholder.calculated_amount.toLocaleString('tr-TR')} ${pool.currency}*
• Tek Kullanımlık Dijital Onay (OTP) Kodunuz: *${otp}*

İşlemin resmi sözleşme ve kapanış aşamasına geçebilmesi için lütfen aşağıdaki güvenli bağlantıdan OTP kodunuzu girerek sözleşmeyi dijital olarak mühürleyiniz:
🔗 ${link}

_LookPrice Akıllı Paydaş & Hakediş Güvence Sistemi_`;
}

/**
 * Anonymizes customer names for External Partner Portal (e.g. "Ahmet Yılmaz" -> "A**** Y****")
 */
export function maskClientNameForPartner(text: string): string {
  if (!text) return 'M**** A****';
  return text
    .split(/\s+/)
    .map(word => {
      const clean = word.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
      if (clean.length <= 1) return word;
      return `${clean.charAt(0).toUpperCase()}****`;
    })
    .join(' ');
}

/**
 * Masks sensitive client names or phone numbers inside freeform logs for Partner Dashboard
 */
export function sanitizeLogForPartner(rawLog: string): string {
  if (!rawLog) return '';
  // Mask phone numbers
  let masked = rawLog.replace(/(\+?\d{2,3}[\s-]?\d{3})[\s-]?\d{3}[\s-]?\d{2}[\s-]?(\d{2})/g, '$1 *** ** $2');
  // Mask parenthesized full names e.g. (Ahmet Demir) -> (A**** D****)
  masked = masked.replace(/\(([^)]+)\)/g, (_m, inner) => {
    if (inner.includes('Rehber:') || inner.includes('İndirim') || inner.includes('Net')) return `(${inner})`;
    return `(${maskClientNameForPartner(inner)})`;
  });
  return masked;
}

function generateToken(): string {
  return 'tkn_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
