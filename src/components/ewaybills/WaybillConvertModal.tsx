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
        <div className="p-4 px-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            {isTr ? "Toplu İrsaliye e-Fatura Dönüşümü" : "Consolidate waybills to e-Invoice"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleBulkConversionSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-indigo-800">
            {isTr 
              ? `Seçtiğiniz ${selectedIds.length} adet sevk irsaliyesi tek bir Satış Faturası altında birleştirilecektir. Mükerrer ürünler konsolide edilip miktarları toplanacaktır.`
              : `Your ${selectedIds.length} selected waybills will be consolidated into a single draft invoice. Duplicate item quantities will be summed.`}
          </p>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">{isTr ? "Fatura Senaryosu" : "Invoice Profile"}</label>
              <select
                value={convertForm.invoiceProfile}
                onChange={(e) => setConvertForm((prev: any) => ({ ...prev, invoiceProfile: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-500 outline-none"
              >
                <option value="TICARIFATURA">{isTr ? "TİCARİ FATURA (Ortak)" : "TICARIFATURA"}</option>
                <option value="TEMELFATURA">{isTr ? "TEMEL FATURA (Bireysel/E-Arşiv)" : "TEMELFATURA"}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">{isTr ? "Fatura Tipi" : "Billing Category"}</label>
              <select
                value={convertForm.giInvoiceType}
                onChange={(e) => setConvertForm((prev: any) => ({ ...prev, giInvoiceType: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-500 outline-none"
              >
                <option value="SATIS">{isTr ? "SATIŞ FATURASI" : "SATIS"}</option>
                <option value="ISTISNA">{isTr ? "İSTİSNA FATURASI" : "ISTISNA"}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">{isTr ? "Ödeme Şekli" : "Payment Method"}</label>
              <select
                value={convertForm.paymentMethod}
                onChange={(e) => setConvertForm((prev: any) => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-500 outline-none"
              >
                <option value="cash">{isTr ? "Nakit" : "Cash"}</option>
                <option value="credit_card">{isTr ? "Kredi Kartı" : "Credit Card"}</option>
                <option value="bank">{isTr ? "Banka Havalesi / EFT" : "Bank Transfer"}</option>
                <option value="term">{isTr ? "Açık Hesap / Vadeli" : "Açık Hesap"}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">{isTr ? "Özel Fatura Notu" : "Invoice Notes"}</label>
              <textarea
                value={convertForm.notes}
                onChange={(e) => setConvertForm((prev: any) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:border-indigo-500 outline-none resize-none"
                placeholder={isTr ? "Fatura açıklaması ekleyin..." : "Notes..."}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 -mx-6 -mb-6 p-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800 rounded-xl text-xs font-bold transition text-slate-600"
            >
              {isTr ? "İptal" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isTr ? "Faturayı Oluştur (Taslak)" : "Create Bill Draft"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
