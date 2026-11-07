import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  Receipt,
  Users,
  FileSignature,
  Ban
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { 
  CommissionPool, 
  CommissionStakeholder, 
  DealExpense, 
  recalculateCommissionPool,
  getPartnerWhatsAppContractInvite
} from '../utils/realEstateCommissionEngine';
import { PartnerContractViewerModal } from './PartnerContractViewerModal';

interface DealCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  storeName?: string;
  onSavePool: (updatedPool: CommissionPool) => Promise<void>;
}

export const DealCommissionModal: React.FC<DealCommissionModalProps> = ({
  isOpen,
  onClose,
  property,
  storeName = 'Seçkin Emlak',
  onSavePool
}) => {
  if (!isOpen || !property) return null;

  const propPrice = Number(property.price) || 0;
  const currency = property.currency || 'GBP';
  const defaultGross = property.listing_intent === 'rent' ? propPrice : (Math.round(propPrice * 0.05) || 0);

  // Clean real pool (no fake demo records)
  const existingPool: CommissionPool = property.sector_data?.commission_pool || {
    property_id: property.id,
    gross_commission: defaultGross,
    currency,
    calculation_mode: 'net',
    expenses: [],
    total_expenses: 0,
    net_distributable_commission: defaultGross,
    stakeholders: property.responsible_agent
      ? [
          {
            id: 'stk_internal_1',
            name: property.responsible_agent,
            role: 'portfolio_source',
            roleLabel: 'Sorumlu Danışman',
            is_external: false,
            percentage: 25,
            calculated_amount: 0,
            currency,
            payout_status: 'agreement_signed',
            is_locked: false
          }
        ]
      : [],
    company_share_percent: property.responsible_agent ? 75 : 100,
    company_share_amount: 0,
    all_external_signed: true,
    pending_signatures_count: 0
  };

  const [pool, setPool] = useState<CommissionPool>(recalculateCommissionPool(existingPool));
  const [isSaving, setIsSaving] = useState(false);
  const [viewingStakeholderId, setViewingStakeholderId] = useState<string | null>(null);

  // New expense form
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');

  // New stakeholder form
  const [showAddStakeholder, setShowAddStakeholder] = useState(false);
  const [stkName, setStkName] = useState('');
  const [stkPhone, setStkPhone] = useState('');
  const [stkRole, setStkRole] = useState<'portfolio_source' | 'lead_source' | 'closing_agent' | 'custom_partner'>('portfolio_source');
  const [stkPercent, setStkPercent] = useState('20');
  const [stkIsExternal, setStkIsExternal] = useState(true);

  const viewingStakeholder = pool.stakeholders.find(s => s.id === viewingStakeholderId) || null;

  const handleModeChange = (mode: 'net' | 'gross') => {
    setPool(recalculateCommissionPool({ ...pool, calculation_mode: mode }));
  };

  const handleGrossCommissionChange = (val: string) => {
    const num = Math.max(0, Number(val.replace(/[^0-9.-]+/g, '')) || 0);
    setPool(recalculateCommissionPool({ ...pool, gross_commission: num }));
  };

  const handleAddExpense = () => {
    if (!expTitle || !expAmount) {
      toast.error('Masraf adı ve tutarı giriniz.');
      return;
    }
    const newExp: DealExpense = {
      id: `exp_${Date.now()}`,
      title: expTitle,
      amount: Number(expAmount) || 0,
      currency: pool.currency,
      deductible: true,
      created_at: new Date().toISOString()
    };
    setPool(recalculateCommissionPool({ ...pool, expenses: [...pool.expenses, newExp] }));
    setExpTitle('');
    setExpAmount('');
    setShowAddExpense(false);
  };

  const handleRemoveExpense = (id: string) => {
    setPool(recalculateCommissionPool({ ...pool, expenses: pool.expenses.filter(e => e.id !== id) }));
  };

  const handleAddStakeholder = () => {
    if (!stkName || !stkPercent) {
      toast.error('Paydaş adı ve oran giriniz.');
      return;
    }
    const newStk: CommissionStakeholder = {
      id: `stk_${Date.now()}`,
      name: stkName.trim(),
      phone: stkPhone.trim(),
      role: stkRole,
      roleLabel:
        stkRole === 'portfolio_source'
          ? 'Portföy Getiren'
          : stkRole === 'lead_source'
          ? 'Müşteri Getiren'
          : stkRole === 'closing_agent'
          ? 'Satış Kapatan'
          : 'Paydaş',
      is_external: stkIsExternal,
      percentage: Number(stkPercent) || 0,
      calculated_amount: 0,
      currency: pool.currency,
      payout_status: stkIsExternal ? 'pending_agreement' : 'agreement_signed',
      is_locked: false
    };
    setPool(recalculateCommissionPool({ ...pool, stakeholders: [...pool.stakeholders, newStk] }));
    setStkName('');
    setStkPhone('');
    setStkPercent('20');
    setShowAddStakeholder(false);
  };

  const handleImmediateSign = async (stakeholderId: string) => {
    const targetStk = pool.stakeholders.find(s => s.id === stakeholderId);
    if (!targetStk) return;

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const nowD = new Date();
    let resolvedIp = '127.0.0.1';

    try {
      const res = await fetch(`/api/public/real-estate/${property.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: targetStk.name,
          clientIdentity: 'PAYDAŞ-ONAYLI',
          clientPhone: targetStk.phone || '+905330000000',
          commissionRate: `%${targetStk.percentage}`,
          templateId: 'external_partner_revenue_share',
          partnerId: targetStk.id,
          otpCode,
          decision: 'approved',
          signatureImage: ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ipAddress) resolvedIp = data.ipAddress;
      }
    } catch (e) {
      // Non-blocking
    }

    const updatedStks = pool.stakeholders.map(s =>
      s.id === stakeholderId
        ? {
            ...s,
            payout_status: 'agreement_signed' as const,
            is_locked: true,
            signed_at: nowD.toISOString(),
            signed_ip: resolvedIp,
            otp_code: otpCode
          }
        : s
    );
    const updatedPool = recalculateCommissionPool({ ...pool, stakeholders: updatedStks });
    setPool(updatedPool);
    await onSavePool(updatedPool);
    toast.success(`${targetStk.name} OTP onayı tamamlandı.`);
  };

  const handleTerminateStakeholderContract = async (
    stakeholderId: string,
    options: {
      reason: string;
      cancelType: 'mutual' | 'unilateral_office' | 'conditions_not_met';
      removeStakeholderCompletely: boolean;
      sendWhatsAppNotice: boolean;
    }
  ) => {
    const targetStk = pool.stakeholders.find(s => s.id === stakeholderId);
    if (!targetStk) return;

    const nowIso = new Date().toISOString();
    let updatedStks: CommissionStakeholder[];

    if (options.removeStakeholderCompletely) {
      updatedStks = pool.stakeholders.filter(s => s.id !== stakeholderId);
    } else {
      updatedStks = pool.stakeholders.map(s =>
        s.id === stakeholderId
          ? {
              ...s,
              original_percentage: s.original_percentage ?? s.percentage,
              percentage: 0,
              calculated_amount: 0,
              payout_status: 'cancelled' as const,
              is_locked: false,
              cancelled_at: nowIso,
              cancel_reason: options.reason,
              cancel_type: options.cancelType
            }
          : s
      );
    }

    const updatedPool = recalculateCommissionPool({
      ...pool,
      stakeholders: updatedStks,
      revision_history: [
        ...(pool.revision_history || []),
        {
          date: nowIso,
          revised_by: storeName,
          reason: `Paydaş Sözleşme Feshi (${targetStk.name}): ${options.reason}`,
          previous_state: targetStk
        }
      ]
    });

    setPool(updatedPool);
    await onSavePool(updatedPool);

    if (options.removeStakeholderCompletely) {
      setViewingStakeholderId(null);
      toast.success(`${targetStk.name} sözleşmesi feshedildi ve paydaşlık kaldırıldı.`);
    } else {
      toast.success(`${targetStk.name} sözleşmesi feshedildi ve hakedişi %0 yapıldı.`);
    }
  };

  const handleSendWhatsAppInvite = (stk: CommissionStakeholder) => {
    const otpCode = stk.otp_code || String(Math.floor(100000 + Math.random() * 900000));
    const msg = getPartnerWhatsAppContractInvite(property, stk, pool, storeName, otpCode);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDeleteStakeholder = (stk: CommissionStakeholder) => {
    if (stk.is_locked && stk.payout_status !== 'cancelled') {
      // Open the contract viewer / termination modal so they can formally cancel it
      setViewingStakeholderId(stk.id);
      toast.info('İmzalı sözleşmeyi iptal etmek için açılan pencereden Fesih işlemini onaylayınız.');
      return;
    }
    setPool(recalculateCommissionPool({ ...pool, stakeholders: pool.stakeholders.filter(s => s.id !== stk.id) }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePool(pool);
      toast.success('Paydaş ve hakediş bilgileri kaydedildi.');
      onClose();
    } catch (err) {
      toast.error('Kaydedilirken hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-2.5 bg-slate-900/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Compact Header */}
        <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs font-black uppercase tracking-tight truncate">
                Paydaş & Hakediş
              </h3>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {property.reference_no || 'REF'} · {property.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 overflow-y-auto space-y-3 flex-1 custom-scrollbar bg-slate-50 text-xs">
          {/* 3 Compact Summary Boxes */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[9px] font-black uppercase text-slate-500 block">Toplam Komisyon</span>
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="text"
                  value={pool.gross_commission}
                  onChange={(e) => handleGrossCommissionChange(e.target.value)}
                  className="text-sm font-black text-slate-950 w-full outline-none border-b border-dashed border-slate-300 focus:border-indigo-600 font-mono"
                />
                <span className="font-black text-slate-600 font-mono text-[11px]">{pool.currency}</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[9px] font-black uppercase text-slate-500 block">Masraflar</span>
              <div className="text-sm font-black text-rose-600 font-mono mt-0.5">
                -{pool.total_expenses.toLocaleString('tr-TR')} {pool.currency}
              </div>
            </div>

            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-[9px] font-black uppercase text-indigo-800 block">Net Dağıtılacak</span>
              <div className="text-sm font-black text-indigo-950 font-mono mt-0.5">
                {pool.net_distributable_commission.toLocaleString('tr-TR')} {pool.currency}
              </div>
            </div>
          </div>

          {/* Calculation Base Switcher */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-700">Hesaplama Tabanı:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => handleModeChange('net')}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                  pool.calculation_mode === 'net' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                }`}
              >
                Net (Masraf Sonrası)
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('gross')}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                  pool.calculation_mode === 'gross' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                }`}
              >
                Brüt
              </button>
            </div>
          </div>

          {/* Stakeholders Section */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Paydaşlar ({pool.stakeholders.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAddStakeholder(!showAddStakeholder)}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Paydaş Ekle</span>
              </button>
            </div>

            {showAddStakeholder && (
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    value={stkName}
                    onChange={(e) => setStkName(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Telefon (+90...)"
                    value={stkPhone}
                    onChange={(e) => setStkPhone(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold outline-none"
                  />
                  <select
                    value={stkRole}
                    onChange={(e) => setStkRole(e.target.value as any)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="portfolio_source">Mülk / Portföy Getiren</option>
                    <option value="lead_source">Alıcı / Müşteri Getiren</option>
                    <option value="closing_agent">Satış Kapatan</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-700">Oran (%):</span>
                    <input
                      type="number"
                      value={stkPercent}
                      onChange={(e) => setStkPercent(e.target.value)}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-black"
                    />
                    <label className="flex items-center gap-1 text-[10px] text-slate-800 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stkIsExternal}
                        onChange={(e) => setStkIsExternal(e.target.checked)}
                      />
                      <span>Dış Paydaş</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleAddStakeholder}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-black text-[11px] cursor-pointer"
                    >
                      Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddStakeholder(false)}
                      className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px] font-bold cursor-pointer"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {pool.stakeholders.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-1">
                Henüz paydaş eklenmemiş. "+ Paydaş Ekle" butonu ile iç danışman veya dış paydaş ekleyebilirsiniz.
              </p>
            ) : (
              <div className="space-y-1.5">
                {pool.stakeholders.map((stk) => {
                  const isSigned = stk.payout_status === 'agreement_signed' || stk.payout_status === 'paid';
                  const isCancelled = stk.payout_status === 'cancelled';
                  const isPosted = !isCancelled && (stk.payout_status === 'paid' || pool.accounting_posted);
                  return (
                    <div
                      key={stk.id}
                      className={`p-2 rounded-lg border flex items-center justify-between gap-2 flex-wrap ${
                        isCancelled ? 'bg-rose-50/40 border-rose-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-black ${isCancelled ? 'line-through text-slate-500' : 'text-slate-950'}`}>
                            {stk.name}
                          </span>
                          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded text-[9px] font-bold">
                            {stk.roleLabel}
                          </span>
                          {stk.is_external && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[9px] font-black">
                              Dış Paydaş
                            </span>
                          )}
                          {isPosted && (
                            <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded text-[9px] font-black">
                              Cariye İşlendi ✓
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-600 font-bold mt-0.5">
                          {isCancelled ? (
                            <span className="text-rose-700 font-black">
                              Sözleşme Feshedildi (Önceki Pay: %{stk.original_percentage ?? stk.percentage}) — {stk.cancel_reason || 'İptal'}
                            </span>
                          ) : (
                            <>
                              Pay: <strong>%{stk.percentage}</strong> · Tutar:{' '}
                              <strong className="text-emerald-700 font-mono">
                                {stk.calculated_amount.toLocaleString('tr-TR')} {stk.currency}
                              </strong>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        {stk.is_external && (
                          <button
                            type="button"
                            onClick={() => setViewingStakeholderId(stk.id)}
                            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer"
                            title={isSigned ? 'İmzalı Sözleşmeyi Gör / Fesih' : isCancelled ? 'Fesih Belgesi' : 'Sözleşmeyi Gör / Fesih'}
                          >
                            <FileSignature className="w-4 h-4 shrink-0" />
                          </button>
                        )}

                        {stk.is_external && (
                          isCancelled ? (
                            <span className="p-2 bg-rose-600 text-white rounded-lg text-[10px] font-black flex items-center justify-center" title="Feshedildi">
                              <Ban className="w-4 h-4 shrink-0" />
                            </span>
                          ) : isSigned ? (
                            <span className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black flex items-center justify-center" title="OTP Onaylı">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppInvite(stk)}
                                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer"
                                title="WhatsApp ile Sözleşme Gönder"
                              >
                                <Send className="w-3.5 h-3.5 shrink-0" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleImmediateSign(stk.id)}
                                className="p-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer"
                                title="Hemen Onayla"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                              </button>
                            </>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteStakeholder(stk)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title={stk.is_locked ? 'Sözleşmeyi Feshet / İptal Et' : 'Sil'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Office Net Share */}
            <div className="p-2 bg-slate-900 text-white rounded-lg flex items-center justify-between text-xs font-black">
              <span>Ofis Payı (%{pool.company_share_percent})</span>
              <span className="font-mono text-emerald-400">
                {pool.company_share_amount.toLocaleString('tr-TR')} {pool.currency}
              </span>
            </div>
          </div>

          {/* Expenses Section (Compact) */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                <span>Masraflar ({pool.expenses.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAddExpense(!showAddExpense)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Masraf Ekle</span>
              </button>
            </div>

            {showAddExpense && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Masraf adı"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold outline-none"
                />
                <input
                  type="number"
                  placeholder="Tutar"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddExpense}
                  className="py-1 bg-slate-900 text-white rounded font-black text-xs cursor-pointer"
                >
                  Ekle
                </button>
              </div>
            )}

            {pool.expenses.length > 0 && (
              <div className="space-y-1">
                {pool.expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded text-[11px]">
                    <span className="font-bold text-slate-800">{e.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-rose-600">
                        -{e.amount.toLocaleString('tr-TR')} {e.currency}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpense(e.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-3.5 py-2.5 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
          >
            Kapat
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </motion.div>

      {/* Signed OTP Contract Viewer & Cancellation Modal */}
      {viewingStakeholder && (
        <PartnerContractViewerModal
          isOpen={!!viewingStakeholder}
          onClose={() => setViewingStakeholderId(null)}
          property={property}
          stakeholder={viewingStakeholder}
          pool={pool}
          storeName={storeName}
          onApproveContract={(stkId) => handleImmediateSign(stkId)}
          onTerminateContract={(stkId, options) => handleTerminateStakeholderContract(stkId, options)}
        />
      )}
    </div>
  );
};
