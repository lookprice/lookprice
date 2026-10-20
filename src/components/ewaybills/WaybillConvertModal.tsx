import React from "react";
import { X, FileText, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface WaybillConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTr: boolean;
  selectedIds: number[];
  convertForm: any;
  setConvertForm: (form: any) => void;
  handleBulkConversionSubmit: (e: React.FormEvent) => void;
}

export const WaybillConvertModal: React.FC<WaybillConvertModalProps> = ({
  isOpen, onClose, isTr, selectedIds, convertForm, setConvertForm, handleBulkConversionSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-900 flex justify-between items-center">
          <h2 className="text-[11px] font-black text-white flex items-center gap-2 uppercase tracking-widest">
            <FileText className="h-4 w-4 text-indigo-400" />
            {isTr ? "E-FATURA DÖNÜŞÜMÜ" : "CONVERT TO E-INVOICE"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-all">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleBulkConversionSubmit} className="p-4 space-y-4 bg-slate-50/50">
          <div className="text-[10px] font-bold leading-relaxed bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 text-indigo-800 uppercase tracking-tight">
            {isTr 
              ? `${selectedIds.length} ADET İRSALİYE TEK BİR SATIŞ FATURASINDA BİRLEŞTİRİLECEKTİR.`
              : `${selectedIds.length} WAYBILLS WILL BE CONSOLIDATED INTO ONE INVOICE.`}
          </div>

          <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">{isTr ? "Fatura Senaryosu" : "Invoice Profile"}</label>
                <select
                  value={convertForm.invoiceProfile}
                  onChange={(e) => setConvertForm((prev: any) => ({ ...prev, invoiceProfile: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-black bg-white focus:border-indigo-500 outline-none text-slate-700"
                >
                  <option value="TICARIFATURA">{isTr ? "TİCARİ FATURA" : "TICARIFATURA"}</option>
                  <option value="TEMELFATURA">{isTr ? "TEMEL FATURA" : "TEMELFATURA"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">{isTr ? "Fatura Tipi" : "Billing Category"}</label>
                <select
                  value={convertForm.giInvoiceType}
                  onChange={(e) => setConvertForm((prev: any) => ({ ...prev, giInvoiceType: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-black bg-white focus:border-indigo-500 outline-none text-slate-700"
                >
                  <option value="SATIS">{isTr ? "SATIŞ FATURASI" : "SATIS"}</option>
                  <option value="ISTISNA">{isTr ? "İSTİSNA FATURASI" : "ISTISNA"}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">{isTr ? "Ödeme Şekli" : "Payment Method"}</label>
              <select
                value={convertForm.paymentMethod}
                onChange={(e) => setConvertForm((prev: any) => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-black bg-white focus:border-indigo-500 outline-none text-slate-700"
              >
                <option value="cash">{isTr ? "NAKİT" : "CASH"}</option>
                <option value="credit_card">{isTr ? "KREDİ KARTI" : "CREDIT CARD"}</option>
                <option value="bank">{isTr ? "HAVALE / EFT" : "BANK TRANSFER"}</option>
                <option value="term">{isTr ? "VADELİ / AÇIK HESAP" : "TERM"}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">{isTr ? "Özel Fatura Notu" : "Invoice Notes"}</label>
              <textarea
                value={convertForm.notes}
                onChange={(e) => setConvertForm((prev: any) => ({ ...prev, notes: e.target.value }))}
                rows={1}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium bg-white focus:border-indigo-500 outline-none resize-none placeholder:text-slate-300"
                placeholder={isTr ? "Opsiyonel açıklama..." : "Optional notes..."}
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest transition text-slate-500"
            >
              {isTr ? "İptal" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-6 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[10px] font-black transition flex items-center gap-1.5 shadow-md shadow-indigo-200 active:scale-95 uppercase tracking-widest"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isTr ? "Dönüştür ve Taslak Oluştur" : "Convert & Create Draft"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
