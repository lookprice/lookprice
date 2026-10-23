import React, { useState } from "react";
import { 
  X, 
  Truck, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  MapPin, 
  Hash, 
  Send,
  Building2
} from "lucide-react";
import { motion } from "motion/react";
import { formatDateTR } from "../../utils/formatUtils";

interface WaybillDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTr: boolean;
  selectedWaybill: any;
}

export const WaybillDetailsModal: React.FC<WaybillDetailsModalProps> = ({
  isOpen, onClose, isTr, selectedWaybill
}) => {
  const [copiedEttn, setCopiedEttn] = useState(false);

  if (!isOpen || !selectedWaybill) return null;

  const status = (selectedWaybill.status || 'draft').toLowerCase();
  const ettn = selectedWaybill.ettn;
  const message = selectedWaybill.message;

  const handleCopyEttn = () => {
    if (ettn) {
      navigator.clipboard.writeText(ettn);
      setCopiedEttn(true);
      setTimeout(() => setCopiedEttn(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Truck className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide uppercase">
                {isTr ? `İRSALİYE DETAYI & YAŞAM DÖNGÜSÜ` : `WAYBILL DETAILS & LIFECYCLE`}
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedWaybill.waybill_number}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 bg-slate-50/70 dark:bg-slate-950/40">
          
          {/* GİB & Entegrasyon Yaşam Döngüsü Kartı */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-500" />
                {isTr ? "GİB & Entegrasyon Durumu" : "GIB & Integration Status"}
              </span>

              {/* Status Badge */}
              {status === 'draft' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {isTr ? "TASLAK" : "DRAFT"}
                </span>
              )}
              {status === 'queued' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                  <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                  {isTr ? "KUYRUKTA / İLETİLİYOR" : "QUEUED / TRANSMITTING"}
                </span>
              )}
              {status === 'success' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {isTr ? "GİB'E İLETİLDİ (ONAYLANDI)" : "SUCCESS (GIB APPROVED)"}
                </span>
              )}
              {status === 'error' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  {isTr ? "GÖNDERİM HATASI" : "TRANSMISSION ERROR"}
                </span>
              )}
            </div>

            {/* Error or Success Message Banner */}
            {message && (
              <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                status === 'error' 
                  ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
                  : "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
              }`}>
                {status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-[11px] uppercase tracking-wider">
                    {status === 'error' ? (isTr ? "Entegratör / GİB Hata Mesajı:" : "Integrator Error:") : (isTr ? "GİB Sonuç Bilgisi:" : "GIB Response:")}
                  </div>
                  <div className="font-mono text-xs mt-0.5 break-words">{message}</div>
                </div>
              </div>
            )}

            {/* ETTN & Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">ETTN (UUID)</span>
                {ettn ? (
                  <div className="flex items-center justify-between gap-1 mt-0.5 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    <span className="truncate">{ettn}</span>
                    <button 
                      onClick={handleCopyEttn}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-800 shrink-0 cursor-pointer"
                      title={isTr ? "ETTN Kopyala" : "Copy ETTN"}
                    >
                      {copiedEttn ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">{isTr ? "Henüz üretilmedi (Taslak)" : "Not generated yet"}</span>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">{isTr ? "Senaryo & Tip" : "Scenario & Type"}</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
                  {selectedWaybill.scenario || "TEMEL IRSALİYE"} • {selectedWaybill.waybill_type || "SEVK"}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">{isTr ? "Fatura Durumu" : "Billing Status"}</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
                  {selectedWaybill.is_invoiced ? (
                    <span className="text-indigo-600 font-semibold">{isTr ? `Faturalandı (${selectedWaybill.linked_invoice_number || 'REF'})` : "Billed"}</span>
                  ) : (
                    <span className="text-slate-500">{isTr ? "Henüz Faturalandırılmadı" : "Unbilled"}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Cari & Sevkiyat Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">{isTr ? "ALICI / CARİ" : "RECIPIENT"}</span>
              <span className="text-xs text-slate-900 dark:text-slate-100 block font-medium">
                {selectedWaybill.company_title || selectedWaybill.company_name || `${selectedWaybill.customer_name || ''} ${selectedWaybill.customer_surname || ''}`}
              </span>
              <span className="text-[11px] text-slate-500 block font-mono">{isTr ? "VKN/TCKN:" : "Tax ID:"} {selectedWaybill.company_tax_number || "-"}</span>
              {selectedWaybill.company_tax_office && (
                <span className="text-[11px] text-slate-400 block">{isTr ? "V.D.:" : "Office:"} {selectedWaybill.company_tax_office}</span>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">{isTr ? "SEVK & TESLİM TARİHİ" : "SHIPMENT DATE"}</span>
              <span className="text-xs text-slate-900 dark:text-slate-100 block font-medium">
                {formatDateTR(selectedWaybill.waybill_date)} • {selectedWaybill.waybill_time || '12:00'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {isTr ? "Fiili Sevk:" : "Actual:"} {formatDateTR(selectedWaybill.actual_date)} {selectedWaybill.actual_time || ''}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
              {selectedWaybill.is_cargo_shipment ? (
                <>
                  <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">{isTr ? "KARGO / SEVKİYAT" : "CARGO DETAILS"}</span>
                  <span className="text-xs text-slate-900 dark:text-slate-100 block uppercase font-medium">{selectedWaybill.carrier_name || "-"}</span>
                  <span className="text-[11px] text-indigo-600 block font-normal">
                    {selectedWaybill.delivery_term || "CFR"} • {selectedWaybill.transport_mode === '1' ? 'KARAYOLU' : 'DİĞER'}
                  </span>
                  {selectedWaybill.tracking_number && (
                    <span className="text-[10px] font-mono text-slate-400 block">{isTr ? "Takip No:" : "Tracking:"} {selectedWaybill.tracking_number}</span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">{isTr ? "ARAÇ & SÜRÜCÜ" : "VEHICLE & DRIVER"}</span>
                  <span className="text-xs text-slate-900 dark:text-slate-100 block font-medium uppercase font-mono">
                    {selectedWaybill.plate_number || "-"} {selectedWaybill.trailer_plate ? `/ Dorse: ${selectedWaybill.trailer_plate}` : ''}
                  </span>
                  <span className="text-[11px] text-slate-500 block uppercase font-normal">
                    {selectedWaybill.driver_name ? `${selectedWaybill.driver_name} ${selectedWaybill.driver_surname}` : "-"}
                    {selectedWaybill.driver_vkn && ` (${selectedWaybill.driver_vkn})`}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Teslimat Adresi */}
          {selectedWaybill.delivery_address && (
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-start gap-2 text-xs">
              <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">{isTr ? "SEVK / TESLİMAT ADRESİ" : "DELIVERY ADDRESS"}</span>
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed block mt-0.5">{selectedWaybill.delivery_address}</span>
              </div>
            </div>
          )}

          {/* Kalem Detayları */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-1">{isTr ? "KALEM DETAYLARI" : "LINE ITEMS"}</h4>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5 px-3">{isTr ? "ÜRÜN ADI / TANIMI" : "PRODUCT"}</th>
                    <th className="p-2.5 text-center w-24">{isTr ? "MİKTAR" : "QTY"}</th>
                    <th className="p-2.5 px-3 w-28">{isTr ? "BİRİM" : "UNIT"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedWaybill.items || []).map((it: any) => (
                    <tr key={it.id}>
                      <td className="p-2.5 px-3 font-normal text-slate-800 dark:text-slate-200">{it.product_name}</td>
                      <td className="p-2.5 text-center font-medium text-indigo-600 dark:text-indigo-400 tabular-nums">{it.quantity}</td>
                      <td className="p-2.5 px-3 font-normal text-slate-500 uppercase">{it.unit_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notlar */}
          {selectedWaybill.notes && (
            <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-medium text-slate-400 uppercase block mb-1 tracking-wider">{isTr ? "İRSALİYE NOTU (DÖKÜMANDA GÖZÜKÜR)" : "NOTES"}</span>
              <p className="text-xs text-slate-200">{selectedWaybill.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end shrink-0">
          <button 
            onClick={onClose} 
            className="px-6 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
          >
            {isTr ? "KAPAT" : "CLOSE"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
