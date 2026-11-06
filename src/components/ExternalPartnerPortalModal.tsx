import React, { useState, useMemo } from 'react';
import { 
  X, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  History, 
  Receipt,
  Plus,
  Send,
  FileSignature,
  Ban
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  CommissionPool, 
  CommissionStakeholder, 
  recalculateCommissionPool, 
  maskClientNameForPartner, 
  getPartnerWhatsAppContractInvite
} from '../utils/realEstateCommissionEngine';
import { PartnerContractViewerModal } from './PartnerContractViewerModal';

interface ExternalPartnerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: any[];
  tasks: any[];
  deals?: any[];
  storeName?: string;
  onUpdatePropertyPool?: (property: any, updatedPool: CommissionPool) => Promise<void>;
}

export const ExternalPartnerPortalModal: React.FC<ExternalPartnerPortalModalProps> = ({
  isOpen,
  onClose,
  properties,
  tasks,
  storeName = 'Seçkin Emlak',
  onUpdatePropertyPool
}) => {
  if (!isOpen) return null;

  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('all');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [activeContractItem, setActiveContractItem] = useState<{
    property: any;
    stakeholder: CommissionStakeholder;
    pool: CommissionPool;
  } | null>(null);

  // Quick Assign Form states
  const [assignPropertyId, setAssignPropertyId] = useState<string>(properties[0]?.id ? String(properties[0].id) : '');
  const [assignPartnerName, setAssignPartnerName] = useState('');
  const [assignPartnerPhone, setAssignPartnerPhone] = useState('');
  const [assignRole, setAssignRole] = useState<'portfolio_source' | 'lead_source'>('portfolio_source');
  const [assignPercent, setAssignPercent] = useState('20');
  const [isAssigning, setIsAssigning] = useState(false);

  // Collect all real external partner records across properties (No fake demo data!)
  const allPartnerRecords = useMemo(() => {
    const list: Array<{
      property: any;
      stakeholder: CommissionStakeholder;
      pool: CommissionPool;
      propertyTasks: any[];
      stage: string;
    }> = [];

    for (const p of properties) {
      const existingPool: CommissionPool | undefined = p.sector_data?.commission_pool;
      const stks = existingPool?.stakeholders || [];
      for (const stk of stks) {
        if (stk.is_external && stk.name) {
          const pTasks = tasks.filter(t => Number(t.property_id) === Number(p.id));
          const stage = p.sector_data?.pipeline_stage || (p.status === 'sold' || p.status === 'rented' ? 'closed' : 'planned');
          list.push({ property: p, stakeholder: stk, pool: existingPool!, propertyTasks: pTasks, stage });
        }
      }
    }
    return list;
  }, [properties, tasks]);

  // Unique partner names for filter dropdown
  const partnerNames = useMemo(() => {
    return Array.from(new Set(allPartnerRecords.map(r => r.stakeholder.name.trim())));
  }, [allPartnerRecords]);

  const filteredRecords = useMemo(() => {
    if (selectedPartnerFilter === 'all') return allPartnerRecords;
    return allPartnerRecords.filter(
      r => r.stakeholder.name.trim().toLowerCase() === selectedPartnerFilter.trim().toLowerCase()
    );
  }, [allPartnerRecords, selectedPartnerFilter]);

  // Summary Metrics (Cancelled contracts do not add to pending or confirmed balance)
  const walletMetrics = useMemo(() => {
    let confirmedBalance = 0;
    let pendingBalance = 0;
    let unsignedCount = 0;
    let cancelledCount = 0;
    let currency = 'GBP';

    for (const item of filteredRecords) {
      currency = item.stakeholder.currency || item.pool.currency || 'GBP';
      if (item.stakeholder.payout_status === 'cancelled') {
        cancelledCount++;
        continue;
      }
      const isClosed = item.stage === 'closed' || item.property.status === 'sold' || item.property.status === 'rented' || item.stakeholder.payout_status === 'paid';
      if (isClosed) {
        confirmedBalance += Number(item.stakeholder.calculated_amount) || 0;
      } else {
        pendingBalance += Number(item.stakeholder.calculated_amount) || 0;
      }
      if (item.stakeholder.payout_status === 'pending_agreement') {
        unsignedCount++;
      }
    }

    return { confirmedBalance, pendingBalance, unsignedCount, cancelledCount, currency };
  }, [filteredRecords]);

  // Assign a partner to a property in 1 click
  const handleQuickAssignPartner = async () => {
    const targetProp = properties.find(p => String(p.id) === String(assignPropertyId));
    if (!targetProp) {
      toast.error('Lütfen bir portföy seçiniz.');
      return;
    }
    if (!assignPartnerName.trim()) {
      toast.error('Lütfen paydaş adını giriniz.');
      return;
    }

    setIsAssigning(true);
    try {
      const propPrice = Number(targetProp.price) || 0;
      const curr = targetProp.currency || 'GBP';
      const existingPool: CommissionPool = targetProp.sector_data?.commission_pool || {
        property_id: targetProp.id,
        gross_commission: targetProp.listing_intent === 'rent' ? propPrice : Math.round(propPrice * 0.05),
        currency: curr,
        calculation_mode: 'net',
        expenses: [],
        total_expenses: 0,
        net_distributable_commission: targetProp.listing_intent === 'rent' ? propPrice : Math.round(propPrice * 0.05),
        stakeholders: [],
        company_share_percent: 100,
        company_share_amount: 0,
        all_external_signed: false,
        pending_signatures_count: 1
      };

      const newStk: CommissionStakeholder = {
        id: `stk_ext_${Date.now()}`,
        name: assignPartnerName.trim(),
        phone: assignPartnerPhone.trim(),
        role: assignRole,
        roleLabel: assignRole === 'lead_source' ? 'Müşteri Getiren' : 'Portföy Getiren',
        is_external: true,
        percentage: Number(assignPercent) || 20,
        calculated_amount: 0,
        currency: curr,
        payout_status: 'pending_agreement',
        is_locked: false
      };

      const updatedPool = recalculateCommissionPool({
        ...existingPool,
        stakeholders: [...(existingPool.stakeholders || []), newStk]
      });

      if (onUpdatePropertyPool) {
        await onUpdatePropertyPool(targetProp, updatedPool);
      }

      toast.success(`${assignPartnerName} portföye paydaş olarak atandı.`);
      setAssignPartnerName('');
      setAssignPartnerPhone('');
      setShowAssignForm(false);
    } catch (e) {
      toast.error('Paydaş atanırken hata oluştu.');
    } finally {
      setIsAssigning(false);
    }
  };

  // 1-Click Approve Contract
  const handleQuickApprove = async (item: { property: any; stakeholder: CommissionStakeholder; pool: CommissionPool }) => {
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const nowD = new Date();
    let resolvedIp = '127.0.0.1';

    try {
      const res = await fetch(`/api/public/real-estate/${item.property.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: item.stakeholder.name,
          clientIdentity: 'PAYDAŞ-ONAYLI',
          clientPhone: item.stakeholder.phone || '+905330000000',
          commissionRate: `%${item.stakeholder.percentage}`,
          templateId: 'external_partner_revenue_share',
          partnerId: item.stakeholder.id,
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

    const updatedStks = item.pool.stakeholders.map(s =>
      s.id === item.stakeholder.id
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

    const updatedPool = recalculateCommissionPool({
      ...item.pool,
      stakeholders: updatedStks
    });

    if (onUpdatePropertyPool) {
      await onUpdatePropertyPool(item.property, updatedPool);
    }

    if (activeContractItem && activeContractItem.stakeholder.id === item.stakeholder.id) {
      const refreshedStk = updatedPool.stakeholders.find(s => s.id === item.stakeholder.id);
      if (refreshedStk) {
        setActiveContractItem({
          property: item.property,
          stakeholder: refreshedStk,
          pool: updatedPool
        });
      }
    }

    toast.success('Paydaş sözleşmesi OTP ile onaylandı ve mühürlendi.');
  };

  // Terminate / Cancel Signed or Pending Contract
  const handleTerminateContract = async (
    item: { property: any; stakeholder: CommissionStakeholder; pool: CommissionPool },
    options: {
      reason: string;
      cancelType: 'mutual' | 'unilateral_office' | 'conditions_not_met';
      removeStakeholderCompletely: boolean;
      sendWhatsAppNotice: boolean;
    }
  ) => {
    const nowIso = new Date().toISOString();
    let updatedStks: CommissionStakeholder[];

    if (options.removeStakeholderCompletely) {
      updatedStks = item.pool.stakeholders.filter(s => s.id !== item.stakeholder.id);
    } else {
      updatedStks = item.pool.stakeholders.map(s =>
        s.id === item.stakeholder.id
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
      ...item.pool,
      stakeholders: updatedStks,
      revision_history: [
        ...(item.pool.revision_history || []),
        {
          date: nowIso,
          revised_by: storeName,
          reason: `Paydaş Sözleşme Feshi (${item.stakeholder.name}): ${options.reason}`,
          previous_state: item.stakeholder
        }
      ]
    });

    if (onUpdatePropertyPool) {
      await onUpdatePropertyPool(item.property, updatedPool);
    }

    if (options.removeStakeholderCompletely) {
      setActiveContractItem(null);
      toast.success(`${item.stakeholder.name} sözleşmesi feshedildi ve paydaşlık portföyden kaldırıldı.`);
    } else {
      const refreshedStk = updatedPool.stakeholders.find(s => s.id === item.stakeholder.id);
      if (refreshedStk) {
        setActiveContractItem({
          property: item.property,
          stakeholder: refreshedStk,
          pool: updatedPool
        });
      }
      toast.success(`${item.stakeholder.name} sözleşmesi feshedildi ve hakedişi %0 olarak kapatıldı.`);
    }
  };

  const handleSendWhatsApp = (item: { property: any; stakeholder: CommissionStakeholder; pool: CommissionPool }) => {
    const otpCode = item.stakeholder.otp_code || String(Math.floor(100000 + Math.random() * 900000));
    const msg = getPartnerWhatsAppContractInvite(item.property, item.stakeholder, item.pool, storeName, otpCode);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[145] flex items-center justify-center p-2.5 bg-slate-900/75 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Clean Short Header */}
        <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white">
              Paydaş Portföyleri & Bakiye
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {partnerNames.length > 0 && (
              <select
                value={selectedPartnerFilter}
                onChange={(e) => setSelectedPartnerFilter(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="all">Tüm Paydaşlar ({partnerNames.length})</option>
                {partnerNames.map((name, idx) => (
                  <option key={idx} value={name}>{name}</option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setShowAssignForm(prev => !prev)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Portföye Paydaş Ata</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 overflow-y-auto space-y-3 flex-1 custom-scrollbar bg-slate-50 text-xs">
          {/* Quick Assign Partner to Property Box */}
          {showAssignForm && (
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-indigo-950 uppercase">
                  Portföye Paydaş Ata
                </span>
                <button
                  type="button"
                  onClick={() => setShowAssignForm(false)}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Kapat ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-end">
                <div className="sm:col-span-4">
                  <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Portföy Seçin (Önce Portföyde Olmalı)</label>
                  <select
                    value={assignPropertyId}
                    onChange={(e) => setAssignPropertyId(e.target.value)}
                    className="w-full px-2 py-1 h-8 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.reference_no ? `[${p.reference_no}] ` : ''}{p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Paydaş Adı</label>
                  <input
                    type="text"
                    placeholder="Örn: Ahmet Çetin"
                    value={assignPartnerName}
                    onChange={(e) => setAssignPartnerName(e.target.value)}
                    className="w-full px-2 py-1 h-8 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Telefon</label>
                  <input
                    type="tel"
                    placeholder="+90 533..."
                    value={assignPartnerPhone}
                    onChange={(e) => setAssignPartnerPhone(e.target.value)}
                    className="w-full px-2 py-1 h-8 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Senaryo / Rolü</label>
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value as any)}
                    className="w-full px-1.5 py-1 h-8 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
                  >
                    <option value="portfolio_source">Mülk / Portföy Getiren</option>
                    <option value="lead_source">Alıcı / Müşteri Getiren</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[9px] font-bold text-slate-600 mb-0.5">%</label>
                  <input
                    type="number"
                    value={assignPercent}
                    onChange={(e) => setAssignPercent(e.target.value)}
                    className="w-full px-1.5 py-1 h-8 bg-white border border-slate-300 rounded-lg text-xs font-mono font-black text-indigo-700 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isAssigning}
                  onClick={handleQuickAssignPartner}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer"
                >
                  {isAssigning ? 'Kaydediliyor...' : 'Atamayı Kaydet & Sözleşme Tanzim Et'}
                </button>
              </div>
            </div>
          )}

          {/* 3 Short Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-white rounded-xl border border-emerald-300">
              <span className="text-[9px] font-black uppercase text-emerald-800 block">
                Kesinleşen Alacak
              </span>
              <div className="text-sm sm:text-base font-black text-slate-950 font-mono mt-0.5">
                {walletMetrics.confirmedBalance.toLocaleString('tr-TR')} {walletMetrics.currency}
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-indigo-200">
              <span className="text-[9px] font-black uppercase text-indigo-800 block">
                Bekleyen Hakediş
              </span>
              <div className="text-sm sm:text-base font-black text-indigo-950 font-mono mt-0.5">
                {walletMetrics.pendingBalance.toLocaleString('tr-TR')} {walletMetrics.currency}
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-amber-300">
              <span className="text-[9px] font-black uppercase text-amber-900 block">
                Sözleşme Durumu
              </span>
              <div className="text-xs sm:text-sm font-black text-slate-950 font-mono mt-0.5">
                {walletMetrics.unsignedCount > 0
                  ? `${walletMetrics.unsignedCount} İmza Bekliyor`
                  : 'Aktif Sözleşmeler Onaylı'}
                {walletMetrics.cancelledCount > 0 && (
                  <span className="block text-[10px] text-rose-600 font-bold">
                    {walletMetrics.cancelledCount} Feshedildi
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Partner's Portfolios List */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-950 uppercase flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Paydaşa Ait Portföyler & Sözleşmeler ({filteredRecords.length})</span>
            </h4>

            {filteredRecords.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                <p className="text-xs font-black text-slate-800">
                  Henüz paydaş atanmış portföy bulunmuyor.
                </p>
                <p className="text-[11px] text-slate-500">
                  Mülk portföye eklendikten sonra <strong>"+ Portföye Paydaş Ata"</strong> butonundan veya İlan Düzenleme ekranından paydaş atayarak sözleşme tanzim edebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAssignForm(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Şimdi Portföye Paydaş Ata</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecords.map((item, idx) => {
                  const { property, stakeholder, pool, propertyTasks, stage } = item;
                  const isSigned = stakeholder.payout_status === 'agreement_signed' || stakeholder.payout_status === 'paid';
                  const isCancelled = stakeholder.payout_status === 'cancelled';
                  const isPaidToLedger = !isCancelled && (stakeholder.payout_status === 'paid' || pool.accounting_posted || stage === 'closed');

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-2.5 space-y-2 transition-all ${
                        isCancelled
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Row 1: Property & Partner Summary */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {property.reference_no && (
                              <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[9px] font-mono font-black">
                                {property.reference_no}
                              </span>
                            )}
                            <span className={`font-black text-xs truncate ${isCancelled ? 'line-through text-slate-500' : 'text-slate-950'}`}>
                              {property.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold text-slate-600 mt-0.5">
                            <span className="text-indigo-800 font-black">
                              Paydaş: {stakeholder.name}
                            </span>
                            <span>·</span>
                            <span>
                              {stakeholder.roleLabel} (%{stakeholder.original_percentage ?? stakeholder.percentage})
                            </span>
                            <span>·</span>
                            {isCancelled ? (
                              <span className="font-mono font-black text-rose-600">
                                Hakediş İptal (%0)
                              </span>
                            ) : (
                              <span className="font-mono font-black text-emerald-700">
                                Hakediş: {stakeholder.calculated_amount.toLocaleString('tr-TR')} {stakeholder.currency}
                              </span>
                            )}
                            {isSigned && stakeholder.otp_code && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded font-mono text-[9px] font-black">
                                OTP: {stakeholder.otp_code}
                              </span>
                            )}
                          </div>
                          {isCancelled && stakeholder.cancel_reason && (
                            <div className="text-[10px] font-bold text-rose-700 mt-0.5">
                              Fesih Gerekçesi: {stakeholder.cancel_reason}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Primary Button: View Signed OTP Contract / Terminate (Icon Only) */}
                          <button
                            type="button"
                            onClick={() => setActiveContractItem(item)}
                            className={`p-2 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer border transition-colors ${
                              isCancelled
                                ? 'bg-white hover:bg-rose-50 text-rose-800 border-rose-300'
                                : isSigned
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            }`}
                            title={isSigned ? 'İmzalı Sözleşmeyi Gör / Fesih' : isCancelled ? 'Fesih Belgesini Gör' : 'Sözleşmeyi Gör / Fesih'}
                          >
                            <FileSignature className="w-4 h-4 shrink-0" />
                          </button>

                          {isCancelled ? (
                            <span className="p-2 bg-rose-600 text-white rounded-lg text-[10px] font-black flex items-center justify-center" title="Feshedildi">
                              <Ban className="w-4 h-4 shrink-0" />
                            </span>
                          ) : isPaidToLedger ? (
                            <span className="p-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black flex items-center justify-center" title="Cariye İşlendi">
                              <Receipt className="w-4 h-4 shrink-0" />
                            </span>
                          ) : isSigned ? (
                            <span className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black flex items-center justify-center" title="OTP Onaylı">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSendWhatsApp(item)}
                                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer"
                                title="WhatsApp ile Gönder"
                              >
                                <Send className="w-3.5 h-3.5 shrink-0" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickApprove(item)}
                                className="p-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer"
                                title="Hızlı Onayla"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Compact Showing Logs (if any) */}
                      {propertyTasks.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-100 flex items-center gap-2 flex-wrap text-[10px] text-slate-600">
                          <span className="font-black text-slate-700 flex items-center gap-1">
                            <History className="w-3 h-3 text-indigo-600" />
                            <span>Geziler ({propertyTasks.length}):</span>
                          </span>
                          {propertyTasks.slice(0, 2).map((t: any, tIdx: number) => (
                            <span key={tIdx} className="px-1.5 py-0.5 bg-slate-50 rounded border border-slate-200 font-semibold">
                              {maskClientNameForPartner(t.customer_name || 'Müşteri')} ({t.due_date ? format(parseISO(t.due_date), 'd MMM HH:mm', { locale: tr }) : 'Planlı'})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-3.5 py-2 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </motion.div>

      {/* Signed OTP Contract Viewer & Cancellation Modal */}
      {activeContractItem && (
        <PartnerContractViewerModal
          isOpen={!!activeContractItem}
          onClose={() => setActiveContractItem(null)}
          property={activeContractItem.property}
          stakeholder={activeContractItem.stakeholder}
          pool={activeContractItem.pool}
          storeName={storeName}
          onApproveContract={() => handleQuickApprove(activeContractItem)}
          onTerminateContract={(_stkId, options) => handleTerminateContract(activeContractItem, options)}
        />
      )}
    </div>
  );
};
