import React from "react";
import { motion } from "motion/react";
import { X, DollarSign, AlertCircle, ChevronRight } from "lucide-react";

interface BulkPriceModalProps {
  showBulkPriceModal: boolean;
  setShowBulkPriceModal: (show: boolean) => void;
  bulkPriceForm: any;
  setBulkPriceForm: (form: any) => void;
  handleBulkPriceSubmit: (e: React.FormEvent) => void;
  branding: any;
  translations: any;
  lang: string;

  // Quick Product Add
  showQuickProductModal?: boolean;
  setShowQuickProductModal?: (show: boolean) => void;
  quickProductForm?: any;
  setQuickProductForm?: (form: any) => void;
  handleQuickAddProduct?: (e: React.FormEvent) => void;
}

export const BulkPriceModal: React.FC<BulkPriceModalProps> = ({
  showBulkPriceModal,
  setShowBulkPriceModal,
  bulkPriceForm,
  setBulkPriceForm,
  handleBulkPriceSubmit,
  branding,
  translations: t,
  lang,

  showQuickProductModal,
  setShowQuickProductModal,
  quickProductForm,
  setQuickProductForm,
  handleQuickAddProduct
}) => {
  const isTr = lang === 'tr';

  return (
    <>
      {/* Bulk Price Update Modal */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 rounded-xl">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  {isTr ? 'Toplu Fiyat Güncelleme' : 'Bulk Price Update'}
                </h3>
              </div>
              <button 
                onClick={() => setShowBulkPriceModal(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleBulkPriceSubmit} className="p-8 space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4">
                <div className="p-2 bg-amber-100 rounded-xl shrink-0 h-fit">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-900 uppercase tracking-tighter mb-1">
                    {isTr ? 'Önemli Uyarı' : 'Important Note'}
                  </p>
                  <p className="text-[11px] font-medium text-amber-700 leading-relaxed">
                    {isTr 
                      ? 'Bu işlem seçilen tüm ürünlerin fiyatlarını kalıcı olarak değiştirecektir. Değişiklikler geri alınamaz.'
                      : 'This action will permanently change prices of selected products. This action cannot be undone.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Hedef Ürünler' : 'Target Products'}</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none cursor-pointer text-xs"
                      value={bulkPriceForm.target}
                      onChange={(e) => setBulkPriceForm({...bulkPriceForm, target: e.target.value})}
                    >
                      <option value="all">{isTr ? 'Tüm Ürünler' : 'All Products'}</option>
                      <option value="selected">{isTr ? 'Seçili Ürünler' : 'Selected Products'}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'İşlem Tipi' : 'Action Type'}</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none cursor-pointer text-xs"
                      value={bulkPriceForm.direction}
                      onChange={(e) => setBulkPriceForm({...bulkPriceForm, direction: e.target.value})}
                    >
                      <option value="increase">{isTr ? 'Fiyat Artışı (+)' : 'Price Increase (+)'}</option>
                      <option value="decrease">{isTr ? 'Fiyat İndirimi (-)' : 'Price Discount (-)'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Değer Tipi' : 'Value Type'}</label>
                    <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={() => setBulkPriceForm({...bulkPriceForm, type: 'percent'})}
                         className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase transition-all cursor-pointer ${
                           bulkPriceForm.type === 'percent' 
                             ? 'bg-slate-900 text-white' 
                             : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                         }`}
                       >
                         {isTr ? 'Yüzde (%)' : 'Percent (%)'}
                       </button>
                       <button
                         type="button"
                         onClick={() => setBulkPriceForm({...bulkPriceForm, type: 'amount'})}
                         className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase transition-all cursor-pointer ${
                           bulkPriceForm.type === 'amount' 
                             ? 'bg-slate-900 text-white' 
                             : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                         }`}
                       >
                         {isTr ? 'Miktar (₺)' : 'Amount ($)'}
                       </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Değişim Oranı / Miktarı' : 'Change Rate / Amount'}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-black text-slate-900 text-xs"
                        value={bulkPriceForm.value}
                        onChange={(e) => setBulkPriceForm({...bulkPriceForm, value: e.target.value})}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
                        {bulkPriceForm.type === 'percent' ? '%' : branding?.default_currency || 'TRY'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Yuvarlama Seçenekleri' : 'Rounding Options'}</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none cursor-pointer text-xs"
                    value={bulkPriceForm.rounding}
                    onChange={(e) => setBulkPriceForm({...bulkPriceForm, rounding: e.target.value})}
                  >
                    <option value="none">{isTr ? 'Yuvarlama Yapma' : 'No Rounding'}</option>
                    <option value="up">{isTr ? 'Yukarı Yuvarla (.00)' : 'Round Up (.00)'}</option>
                    <option value="down">{isTr ? 'Aşağı Yuvarla (.00)' : 'Round Down (.00)'}</option>
                    <option value="smart">{isTr ? 'Psikolojik Fiyatlama (.99)' : 'Psychological Pricing (.99)'}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowBulkPriceModal(false)}
                  className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-[2] px-4 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {isTr ? 'Güncellemeyi Uygula' : 'Apply Update'}
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Quick Add Product Modal */}
      {showQuickProductModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-sm font-black uppercase tracking-wider">{isTr ? 'Kataloğa Hızlı Ekle' : 'Catalog Quick Add'}</h3>
              <button
                type="button"
                onClick={() => setShowQuickProductModal && setShowQuickProductModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                if (handleQuickAddProduct) handleQuickAddProduct(e);
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Ürün Adı *' : 'Product Name *'}</label>
                <input
                  type="text"
                  required
                  placeholder={isTr ? "örn: Profa Kiremit" : "e.g., Tile Brick"}
                  value={quickProductForm?.name || ""}
                  onChange={(e) => setQuickProductForm && setQuickProductForm({ ...quickProductForm, name: e.target.value })}
                  className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'KDV Dahil Fiyat *' : 'VAT Incl. Price *'}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={quickProductForm?.price || ""}
                    onChange={(e) => setQuickProductForm && setQuickProductForm({ ...quickProductForm, price: e.target.value })}
                    className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'KDV Oranı (%)' : 'VAT Rate (%)'}</label>
                  <input
                    type="number"
                    required
                    value={quickProductForm?.tax_rate || "20"}
                    onChange={(e) => setQuickProductForm && setQuickProductForm({ ...quickProductForm, tax_rate: e.target.value })}
                    className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Barkod / Kod' : 'Barcode / Code'}</label>
                <input
                  type="text"
                  placeholder={isTr ? "Barkod numarasını girin veya okutun" : "Enter barcode"}
                  value={quickProductForm?.barcode || ""}
                  onChange={(e) => setQuickProductForm && setQuickProductForm({ ...quickProductForm, barcode: e.target.value })}
                  className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuickProductModal && setShowQuickProductModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  {isTr ? 'Ekle' : 'Add'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
};
