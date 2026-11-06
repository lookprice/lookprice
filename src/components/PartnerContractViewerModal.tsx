import React, { useState } from 'react';
import {
  X,
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Printer,
  Trash2,
  Send,
  AlertTriangle,
  LockOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  CommissionPool,
  CommissionStakeholder,
  getPartnerWhatsAppCancellationNotice,
  getPartnerWhatsAppContractInvite
} from '../utils/realEstateCommissionEngine';

interface PartnerContractViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  stakeholder: CommissionStakeholder;
  pool: CommissionPool;
  storeName?: string;
  onApproveContract?: (stakeholderId: string) => Promise<void> | void;
  onTerminateContract: (
    stakeholderId: string,
    options: {
      reason: string;
      cancelType: 'mutual' | 'unilateral_office' | 'conditions_not_met';
      removeStakeholderCompletely: boolean;
      sendWhatsAppNotice: boolean;
    }
  ) => Promise<void> | void;
}

const PRESET_CANCEL_REASONS: Array<{
  label: string;
  type: 'conditions_not_met' | 'unilateral_office' | 'mutual';
}> = [
  {
    label: 'Alıcı / Müşteri Şartları Oluşmadı — İşlem Gerçekleşmedi (Ofis Tarafından Fesih)',
    type: 'unilateral_office'
  },
  {
    label: 'Mülk / Portföy Şartları Oluşmadı — Portföy Kabul / Satış Şartları Sağlanamadı',
    type: 'conditions_not_met'
  },
  {
    label: 'Karşılıklı Anlaşma ile Sözleşme ve Paydaşlık İptali',
    type: 'mutual'
  },
  {
    label: 'Süre Aşımı / Müşteri Vazgeçti — Tek Taraflı Fesih',
    type: 'unilateral_office'
  }
];

export const PartnerContractViewerModal: React.FC<PartnerContractViewerModalProps> = ({
  isOpen,
  onClose,
  property,
  stakeholder,
  pool,
  storeName = 'Seçkin Emlak',
  onApproveContract,
  onTerminateContract
}) => {
  const [showCancelPanel, setShowCancelPanel] = useState(false);
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [customReasonNote, setCustomReasonNote] = useState('');
  const [sendWhatsAppNotice, setSendWhatsAppNotice] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !property || !stakeholder) return null;

  const isSigned = stakeholder.payout_status === 'agreement_signed' || stakeholder.payout_status === 'paid';
  const isCancelled = stakeholder.payout_status === 'cancelled';
  const effectivePercent = stakeholder.original_percentage ?? stakeholder.percentage;
  const baseAmount = pool.calculation_mode === 'net' ? pool.net_distributable_commission : pool.gross_commission;
  const effectiveAmount = isCancelled
    ? Math.round((baseAmount * effectivePercent) / 100)
    : stakeholder.calculated_amount;

  const contractNo = `GP-${property.id || '0'}-${stakeholder.id.slice(-5).toUpperCase()}`;
  const signedDateStr = stakeholder.signed_at
    ? new Date(stakeholder.signed_at).toLocaleString('tr-TR')
    : 'Henüz İmzalanmadı';

  const handlePrintContract = () => {
    const printWin = window.open('', '_blank', 'width=850,height=950');
    if (!printWin) {
      toast.error('Yazdırma penceresi açılamadı.');
      return;
    }

    const statusBanner = isCancelled
      ? `<div style="background:#fef2f2;border:2px solid #dc2626;color:#991b1b;padding:12px;border-radius:8px;margin-bottom:16px;font-weight:bold;">
           BU SÖZLEŞME FESHEDİLMİŞ / İPTAL EDİLMİŞTİR<br/>
           <span style="font-size:12px;font-weight:normal;">Fesih Tarihi: ${
             stakeholder.cancelled_at ? new Date(stakeholder.cancelled_at).toLocaleString('tr-TR') : '-'
           } | Gerekçe: ${stakeholder.cancel_reason || '-'}</span>
         </div>`
      : isSigned
      ? `<div style="background:#ecfdf5;border:2px solid #059669;color:#065f46;padding:12px;border-radius:8px;margin-bottom:16px;font-weight:bold;">
           DİJİTAL OTP & IP MÜHÜRLÜ ONAYLI SÖZLEŞME<br/>
           <span style="font-size:12px;font-weight:normal;">OTP Kodu: ${stakeholder.otp_code || 'ONAYLI'} | IP: ${
             stakeholder.signed_ip || '127.0.0.1'
           } | İmza Zamanı: ${signedDateStr}</span>
         </div>`
      : `<div style="background:#fffbeb;border:2px solid #d97706;color:#92400e;padding:12px;border-radius:8px;margin-bottom:16px;font-weight:bold;">
           TASLAK SÖZLEŞME (DİJİTAL OTP İMZASI BEKLENİYOR)
         </div>`;

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <title>Paydaş Gelir Paylaşım Sözleşmesi - ${contractNo}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; padding: 28px; line-height: 1.55; font-size: 13px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
          .title { font-size: 17px; font-weight: 800; text-transform: uppercase; }
          .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 14px; background: #f8fafc; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .clause { margin-bottom: 10px; text-align: justify; }
          .clause strong { color: #0f172a; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 28px; padding-top: 16px; border-top: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${storeName}</div>
            <div>Dış Paydaş Gelir Paylaşım ve İş Ortaklığı Protokolü</div>
          </div>
          <div style="text-align:right;font-family:monospace;">
            <strong>Sözleşme No:</strong> ${contractNo}<br/>
            <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}
          </div>
        </div>
        ${statusBanner}
        <div class="box grid">
          <div>
            <strong>1. TARAF (EMLAK OFİSİ):</strong><br/>
            Firma Adı: ${storeName}<br/>
            Sorumlu Birim: Portföy & Satış Yönetimi
          </div>
          <div>
            <strong>2. TARAF (DIŞ PAYDAŞ / İŞ ORTAĞI):</strong><br/>
            Ad Soyad / Ünvan: ${stakeholder.name}<br/>
            Telefon: ${stakeholder.phone || '-'}<br/>
            Paydaşlık Rolü: ${stakeholder.roleLabel}
          </div>
        </div>
        <div class="box">
          <strong>KONU GAYRİMENKUL & HAKEDİŞ TABLOSU:</strong><br/>
          Portföy: [${property.reference_no || 'REF'}] ${property.title}<br/>
          Hesaplama Tabanı: ${
            pool.calculation_mode === 'net'
              ? 'Masraflar Düşüldükten Sonra Net Hizmet Bedeli'
              : 'Brüt Hizmet Bedeli'
          } (${baseAmount.toLocaleString('tr-TR')} ${pool.currency})<br/>
          Anlaşılan Pay Oranı: <strong>%${effectivePercent}</strong> | Hakediş Tutarı: <strong>${effectiveAmount.toLocaleString(
            'tr-TR'
          )} ${stakeholder.currency}</strong>
        </div>
        <div class="clause">
          <strong>MADDE 1 - KONU VE ÖN ŞARTLAR:</strong> İşbu protokol, yukarıda künyesi belirtilen gayrimenkul işleminde Dış Paydaş'ın <em>"${
            stakeholder.roleLabel
          }"</em> sıfatıyla sağladığı katkıya istinaden hak kazanacağı komisyon payını düzenler. Mülk getirme senaryosunda mülkün portföye eksiksiz evrakla eklenmesi ve satış/kiralama işleminin tamamlanması; alıcı/müşteri getirme senaryosunda ise yönlendirilen müşterinin işlemi resmen tamamlaması ve hizmet bedelinin ${storeName} tarafından tahsil edilmesi zorunlu ön şarttır.
        </div>
        <div class="clause">
          <strong>MADDE 2 - ŞARTLARIN OLUŞMAMASI VE FESİH HAKKI:</strong> Paydaşın getirdiği mülk veya alıcı/müşteri için anlaşma şartlarının oluşmaması, müşterinin vazgeçmesi, mülk sahibinin satıştan cayması veya işlemin herhangi bir sebeple sonuçlanmaması halinde; ${storeName} işbu sözleşmeyi ve paydaşlık kaydını tek taraflı veya karşılıklı olarak feshetme hakkına sahiptir. Fesih halinde Dış Paydaş herhangi bir komisyon, masraf veya tazminat talebinde bulunamaz.
        </div>
        <div class="clause">
          <strong>MADDE 3 - DİJİTAL ONAY VE DELİL SÖZLEŞMESİ:</strong> Taraflar, WhatsApp/SMS üzerinden iletilen tek kullanımlık şifre (OTP) ve IP zaman damgası ile yapılan dijital onayın ıslak imza hükmünde olduğunu ve kesin delil teşkil ettiğini kabul ve beyan eder.
        </div>
        <div class="signatures">
          <div>
            <strong>EMLAK OFİSİ ONAYI</strong><br/>
            ${storeName}<br/>
            Yetkili Sistem Onayı ✓
          </div>
          <div>
            <strong>DIŞ PAYDAŞ DİJİTAL İMZASI</strong><br/>
            ${stakeholder.name}<br/>
            ${
              isCancelled
                ? `<span style="color:#dc2626;font-weight:bold;">FESHEDİLDİ (${stakeholder.cancel_reason || ''})</span>`
                : isSigned
                ? `OTP Kodu: ${stakeholder.otp_code || 'ONAYLI'}<br/>IP: ${
                    stakeholder.signed_ip || '127.0.0.1'
                  }<br/>Tarih: ${signedDateStr}`
                : 'Onay Bekleniyor'
            }
          </div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    setTimeout(() => printWin.print(), 250);
  };

  const handleConfirmTermination = async (removeStakeholderCompletely: boolean) => {
    const preset = PRESET_CANCEL_REASONS[selectedPresetIdx] || PRESET_CANCEL_REASONS[0];
    const finalReason = customReasonNote.trim()
      ? `${preset.label} (${customReasonNote.trim()})`
      : preset.label;

    setIsProcessing(true);
    try {
      await onTerminateContract(stakeholder.id, {
        reason: finalReason,
        cancelType: preset.type,
        removeStakeholderCompletely,
        sendWhatsAppNotice
      });

      if (sendWhatsAppNotice) {
        const msg = getPartnerWhatsAppCancellationNotice(property, stakeholder, storeName, finalReason);
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      }

      setShowCancelPanel(false);
      if (removeStakeholderCompletely) {
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendOtpInvite = () => {
    const otpCode = stakeholder.otp_code || String(Math.floor(100000 + Math.random() * 900000));
    const msg = getPartnerWhatsAppContractInvite(property, stakeholder, pool, storeName, otpCode);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[165] flex items-center justify-center p-2.5 bg-slate-950/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Dark High-Contrast Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileSignature className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white">
                  Paydaş Dijital Sözleşmesi & Fesih Yönetimi
                </h3>
                <span className="px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded text-[10px] font-mono font-bold border border-slate-700">
                  {contractNo}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate">
                {property.reference_no ? `[${property.reference_no}] ` : ''}{property.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePrintContract}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              title="Sözleşmeyi Yazdır / PDF İndir"
            >
              <Printer className="w-3.5 h-3.5 text-slate-200" />
              <span className="hidden sm:inline">Yazdır / PDF</span>
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
        <div className="p-3.5 overflow-y-auto space-y-3 flex-1 custom-scrollbar bg-slate-50 text-xs">
          {/* Status & OTP Seal Banner */}
          {isCancelled ? (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-black text-rose-900 text-xs uppercase flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>BU SÖZLEŞME FESHEDİLMİŞ / İPTAL EDİLMİŞTİR</span>
                </span>
                {stakeholder.cancelled_at && (
                  <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                    Fesih Zamanı: {new Date(stakeholder.cancelled_at).toLocaleString('tr-TR')}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-rose-800">
                Fesih Gerekçesi: <span className="font-black">{stakeholder.cancel_reason || 'Şartlar oluşmadı / İptal edildi'}</span>
              </p>
              <p className="text-[10px] text-rose-700">
                Paydaşın bu portföy üzerindeki komisyon hakedişi (%0) sıfırlanmış ve ofis payına iade edilmiştir.
              </p>
            </div>
          ) : isSigned ? (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-black text-emerald-950 text-xs uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>OTP İLE DİJİTAL OLARAK İMZALANDI VE MÜHÜRLENDİ</span>
                </span>
                <span className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-mono font-black">
                  OTP KODU: {stakeholder.otp_code || 'ONAYLI'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="bg-white/90 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">İmzalayan Paydaş</span>
                  <span className="font-black text-slate-900">{stakeholder.name}</span>
                </div>
                <div className="bg-white/90 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">İmza Tarihi & Saati</span>
                  <span className="font-mono font-bold text-slate-900">{signedDateStr}</span>
                </div>
                <div className="bg-white/90 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Doğrulanan IP Adresi</span>
                  <span className="font-mono font-bold text-slate-900">{stakeholder.signed_ip || '127.0.0.1'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="font-black text-amber-950 text-xs uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>PAYDAŞ DİJİTAL OTP İMZASI BEKLENİYOR</span>
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Sözleşme tanzim edildi. Paydaşa WhatsApp üzerinden OTP linki gönderebilir veya doğrudan onaylayabilirsiniz.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSendOtpInvite}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>WhatsApp OTP Gönder</span>
                </button>
                {onApproveContract && (
                  <button
                    type="button"
                    onClick={() => onApproveContract(stakeholder.id)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Şimdi Onayla</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Official Contract Document Paper */}
          <div className="bg-white rounded-xl border border-slate-300 p-3.5 space-y-3 shadow-2xs">
            <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h4 className="font-black text-slate-950 text-xs sm:text-sm uppercase">
                  DIŞ PAYDAŞ GELİR PAYLAŞIM VE İŞ ORTAKLIĞI SÖZLEŞMESİ
                </h4>
                <p className="text-[10px] text-slate-500 font-bold">
                  {storeName} · Resmi Paydaşlık ve Komisyon Taahhütnamesi
                </p>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-mono font-bold border border-slate-200">
                {stakeholder.role === 'lead_source' ? 'SENARYO: ALICI / MÜŞTERİ GETİRME' : 'SENARYO: MÜLK / PORTFÖY GETİRME'}
              </span>
            </div>

            {/* Parties & Financial Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-500 block">1. TARAF (EMLAK OFİSİ)</span>
                <div className="font-black text-slate-950">{storeName}</div>
                <div className="text-[11px] text-slate-600">
                  Portföy: <strong>{property.reference_no || 'REF'}</strong> — {property.title}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-500 block">2. TARAF (DIŞ PAYDAŞ)</span>
                <div className="font-black text-slate-950">
                  {stakeholder.name} {stakeholder.phone ? `(${stakeholder.phone})` : ''}
                </div>
                <div className="text-[11px] text-indigo-800 font-bold">
                  Görev / Rol: {stakeholder.roleLabel}
                </div>
              </div>
            </div>

            {/* Agreed Financial Share Box */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-indigo-50/70 rounded-lg border border-indigo-200">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-800 block">Hesaplama Esası</span>
                <span className="font-black text-slate-900 text-[11px]">
                  {pool.calculation_mode === 'net' ? 'Net (Masraf Sonrası)' : 'Brüt Komisyon'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-800 block">Anlaşılan Pay Oranı</span>
                <span className="font-mono font-black text-indigo-950 text-sm">
                  %{effectivePercent}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-800 block">Hakediş Tutarı</span>
                <span className={`font-mono font-black text-sm ${isCancelled ? 'line-through text-rose-600' : 'text-emerald-700'}`}>
                  {effectiveAmount.toLocaleString('tr-TR')} {stakeholder.currency}
                </span>
              </div>
            </div>

            {/* Legal Clauses tailored to Property vs Buyer Scenario */}
            <div className="space-y-2 text-[11px] text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {stakeholder.role === 'lead_source' ? (
                <p>
                  <strong className="text-slate-950">Madde 1 (Alıcı Getirme Şartı):</strong> Dış Paydaş, yukarıda belirtilen portföy için alıcı/kiracı müşteri adayını ofise yönlendirmeyi taahhüt eder. Pazarlık edilen <strong>%{effectivePercent}</strong> oranındaki hakediş, yalnızca paydaşın getirdiği müşterinin satın alma/kiralama işlemini tamamlaması ve hizmet bedelinin ofis tarafından tahsil edilmesi halinde kesinleşir.
                </p>
              ) : (
                <p>
                  <strong className="text-slate-950">Madde 1 (Mülk / Portföy Getirme Şartı):</strong> Dış Paydaş, söz konusu gayrimenkulün portföye kazandırılmasını sağlamıştır. Pazarlık edilen <strong>%{effectivePercent}</strong> oranındaki hakediş, mülkün portföy şartlarını sağlaması ve satış/kiralama işleminin başarıyla kapanıp hizmet bedelinin tahsil edilmesiyle doğar.
                </p>
              )}
              <p>
                <strong className="text-slate-950">Madde 2 (İşin Gerçekleşmemesi ve Sözleşmenin Feshi):</strong> Getirilen mülk veya alıcı/müşteri için şartların oluşmaması, pazarlığın olumsuz sonuçlanması, müşterinin veya mülk sahibinin vazgeçmesi halinde; <strong>{storeName}</strong> işbu sözleşmeyi ve paydaşlık kaydını <strong>karşılıklı veya tek taraflı olarak feshetme</strong> yetkisine sahiptir. Fesih halinde sözleşme hükümsüz kalır ve paydaş herhangi bir alacak talep edemez.
              </p>
            </div>
          </div>

          {/* Contract Cancellation / Termination Action Area */}
          {!isCancelled && (
            <div className="bg-white rounded-xl border border-rose-200 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h5 className="text-xs font-black text-rose-950 uppercase flex items-center gap-1.5">
                    <LockOpen className="w-3.5 h-3.5 text-rose-600" />
                    <span>Şartlar Oluşmadı mı? Sözleşmeyi ve Paydaşlığı Feshet / İptal Et</span>
                  </h5>
                  <p className="text-[10px] text-slate-600">
                    Mülk veya alıcı getirme işi başarısız olduğunda OTP ile imzalanmış olsa dahi sözleşmeyi gerekçesiyle feshedebilirsiniz.
                  </p>
                </div>

                {!showCancelPanel && (
                  <button
                    type="button"
                    onClick={() => setShowCancelPanel(true)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Sözleşmeyi Feshet / İptal Et</span>
                  </button>
                )}
              </div>

              {showCancelPanel && (
                <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[10px] font-black text-rose-950 uppercase mb-1">
                      Fesih / İptal Senaryosunu Seçin:
                    </label>
                    <div className="space-y-1">
                      {PRESET_CANCEL_REASONS.map((item, idx) => (
                        <label
                          key={idx}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-[11px] font-bold transition-all ${
                            selectedPresetIdx === idx
                              ? 'bg-white border-rose-500 text-rose-950 shadow-2xs'
                              : 'bg-white/60 border-rose-200 text-slate-700 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cancelReasonPreset"
                            checked={selectedPresetIdx === idx}
                            onChange={() => setSelectedPresetIdx(idx)}
                            className="accent-rose-600"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Ek Fesih Notu / Açıklama (Opsiyonel):
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Alıcı kredi onayından geçemedi / Mülk sahibi satıştan vazgeçti..."
                      value={customReasonNote}
                      onChange={(e) => setCustomReasonNote(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-rose-600"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-[11px] font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendWhatsAppNotice}
                      onChange={(e) => setSendWhatsAppNotice(e.target.checked)}
                      className="accent-rose-600 w-3.5 h-3.5"
                    />
                    <span>Fesih protokolü bildirimini paydaşa WhatsApp ile otomatik hazırla</span>
                  </label>

                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-rose-200">
                    <button
                      type="button"
                      onClick={() => setShowCancelPanel(false)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Vazgeç
                    </button>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleConfirmTermination(false)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                        title="Sözleşmeyi Feshedildi olarak mühürler, payı %0 yapar ve arşivde tutar"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Sözleşmeyi Feshet (Payı %0 Yap & Arşivle)</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleConfirmTermination(true)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                        title="Sözleşmeyi fesheder ve paydaşı bu portföyden tamamen siler"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Feshet & Paydaşlığı Tamamen Kaldır</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If already cancelled, allow completely deleting the archived record if desired */}
          {isCancelled && (
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600">
                Bu feshedilmiş sözleşme arşiv kaydı olarak tutulmaktadır. Dilerseniz tamamen kaldırabilirsiniz.
              </span>
              <button
                type="button"
                onClick={() => handleConfirmTermination(true)}
                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3 h-3" />
                <span>Arşiv Kaydını Tamamen Sil</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    </div>
  );
};
