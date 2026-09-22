import React from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

interface PurchaseInvoiceDetailsModalProps {
  showPurchaseInvoiceDetailsModal: boolean;
  setShowPurchaseInvoiceDetailsModal: (show: boolean) => void;
  selectedPurchaseInvoice: any;
  translations: any;
  lang: string;
}

export const PurchaseInvoiceDetailsModal: React.FC<PurchaseInvoiceDetailsModalProps> = ({
  showPurchaseInvoiceDetailsModal,
  setShowPurchaseInvoiceDetailsModal,
  selectedPurchaseInvoice,
  translations: t,
  lang
}) => {
  if (!showPurchaseInvoiceDetailsModal || !selectedPurchaseInvoice) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{t.purchaseDetails || "Alış Faturası Detayları"}</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              #{selectedPurchaseInvoice.invoice_number || selectedPurchaseInvoice.id} • {new Date(selectedPurchaseInvoice.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
            </p>
          </div>
          <button 
            onClick={() => setShowPurchaseInvoiceDetailsModal(false)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="p-4 bg-slate-900 rounded-2xl text-white">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold opacity-80 uppercase tracking-widest">{t.total?.toUpperCase() || 'TOTAL'}</span>
              <span className="text-xl font-bold">
                {Number(selectedPurchaseInvoice.total_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedPurchaseInvoice.currency?.slice(0, 3)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t.supplier || "Tedarikçi"}</p>
            <p className="text-sm font-bold text-gray-900">{selectedPurchaseInvoice.supplier_name || selectedPurchaseInvoice.company_title}</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t.products || "Ürünler"}</p>
            {(selectedPurchaseInvoice.items || []).map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.product_name}</p>
                  <p className="text-xs text-gray-500">{item.quantity} x {Number(item.unit_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedPurchaseInvoice.currency?.slice(0, 3)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {Number(item.total_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedPurchaseInvoice.currency?.slice(0, 3)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
