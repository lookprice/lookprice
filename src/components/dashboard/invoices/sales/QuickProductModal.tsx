import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package } from 'lucide-react';

interface QuickProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTr: boolean;
  quickProductForm: any;
  setQuickProductForm: React.Dispatch<React.SetStateAction<any>>;
  handleQuickProductSubmit: (e: React.FormEvent) => void;
}

export const QuickProductModal: React.FC<QuickProductModalProps> = ({
  isOpen,
  onClose,
  isTr,
  quickProductForm,
  setQuickProductForm,
  handleQuickProductSubmit
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
              {isTr ? "Hızlı Ürün Ekle" : "Quick Add Product"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleQuickProductSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">{isTr ? "Ürün Adı" : "Product Name"} *</label>
              <input
                type="text"
                required
                value={quickProductForm.name}
                onChange={(e) => setQuickProductForm({ ...quickProductForm, name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">{isTr ? "Barkod" : "Barcode"}</label>
              <input
                type="text"
                value={quickProductForm.barcode}
                onChange={(e) => setQuickProductForm({ ...quickProductForm, barcode: e.target.value })}
                maxLength={14}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">{isTr ? "KDV %" : "Tax %"}</label>
              <input
                type="number"
                value={quickProductForm.tax_rate}
                onChange={(e) => setQuickProductForm({ ...quickProductForm, tax_rate: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">{isTr ? "Satış Fiyatı" : "Selling Price"} *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={quickProductForm.price}
                  onChange={(e) => setQuickProductForm({ ...quickProductForm, price: e.target.value })}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <select
                  value={quickProductForm.currency}
                  onChange={(e) => setQuickProductForm({ ...quickProductForm, currency: e.target.value })}
                  className="w-24 px-2 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm font-bold"
                >
                  <option value="TRY">TL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {isTr ? "İptal" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                {isTr ? "Kaydet" : "Save"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
