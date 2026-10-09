import React from 'react';
import { motion } from 'motion/react';
import { 
  Split, 
  X, 
  Coffee, 
  Divide, 
  Plus, 
  Minus, 
  Banknote, 
  CreditCard, 
  CheckCircle2, 
  Trash2 
} from 'lucide-react';

interface PosSplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  selectedTable: string | null;
  splitTab: 'item_split' | 'amount_split';
  setSplitTab: (tab: 'item_split' | 'amount_split') => void;
  total: number;
  cart: any[];
  selectedSplitItems: Record<number, number>;
  setSelectedSplitItems: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  itemSplitMethod: 'cash' | 'credit_card';
  setItemSplitMethod: (method: 'cash' | 'credit_card') => void;
  completing: boolean;
  handlePartialItemPayment: () => void;
  splitPayments: Array<{ method: 'cash' | 'credit_card'; amount: string }>;
  setSplitPayments: React.Dispatch<React.SetStateAction<Array<{ method: 'cash' | 'credit_card'; amount: string }>>>;
  handleEqualSplit: (num: number) => void;
  handleFinalizeSplitSale: () => void;
  handlePartialAmountPayment: (paidAmount: number) => void;
}

export const PosSplitPaymentModal: React.FC<PosSplitPaymentModalProps> = ({
  isOpen,
  onClose,
  lang,
  selectedTable,
  splitTab,
  setSplitTab,
  total,
  cart,
  selectedSplitItems,
  setSelectedSplitItems,
  itemSplitMethod,
  setItemSplitMethod,
  completing,
  handlePartialItemPayment,
  splitPayments,
  setSplitPayments,
  handleEqualSplit,
  handleFinalizeSplitSale,
  handlePartialAmountPayment,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
              <Split className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                {lang === 'tr' ? 'Alman Usulü / Parçalı Ödeme' : 'Split / Partial Payment'}
                {selectedTable && (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                    {selectedTable}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {lang === 'tr' ? 'Adisyondan erken kalkanın hesabını ödeyin veya tutarı bölüşün' : 'Pay early items or split the total bill'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setSplitTab('item_split')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              splitTab === 'item_split'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coffee className="h-3.5 w-3.5 text-amber-500" />
            {lang === 'tr' ? '📦 Ürün Bazlı (Kişi Namına)' : '📦 Itemized Split'}
          </button>
          <button
            type="button"
            onClick={() => setSplitTab('amount_split')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              splitTab === 'amount_split'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Divide className="h-3.5 w-3.5 text-indigo-500" />
            {lang === 'tr' ? '⚖️ Tutar / Eşit Bölüşme' : '⚖️ Amount / Equal Split'}
          </button>
        </div>

        {/* Total Order Info */}
        <div className="bg-slate-50 rounded-2xl p-3.5 mb-4 flex items-center justify-between border border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'tr' ? 'Masa Adisyon Toplamı' : 'Total Table Order'}
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900">
            {total.toFixed(2)} ₺
          </span>
        </div>

        {/* TAB 1: ITEM-BASED PARÇALI ÖDEME */}
        {splitTab === 'item_split' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                {lang === 'tr' ? 'Ödenecek Ürünleri Seçin' : 'Select Items To Pay Now'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const allSelected: Record<number, number> = {};
                  cart.forEach((item, idx) => { allSelected[idx] = item.quantity; });
                  setSelectedSplitItems(allSelected);
                }}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                {lang === 'tr' ? 'Tümünü Seç' : 'Select All'}
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4 scrollbar-thin">
              {cart.map((item, idx) => {
                const itemPrice = parseFloat(item.price) || 0;
                const selectedQty = selectedSplitItems[idx] || 0;

                return (
                  <div 
                    key={idx}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                      selectedQty > 0 
                        ? 'border-indigo-500 bg-indigo-50/40' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-xs text-slate-800 truncate">
                        {item.name}
                        {item.variant_name && (
                          <span className="ml-1 text-[10px] text-indigo-600 font-bold">
                            ({item.variant_name})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold">
                        {item.quantity} adet x {itemPrice.toFixed(2)} ₺ = {(item.quantity * itemPrice).toFixed(2)} ₺
                      </div>
                    </div>

                    {/* Selector Controls */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSplitItems(prev => {
                            const current = prev[idx] || 0;
                            if (current <= 1) {
                              const next = { ...prev };
                              delete next[idx];
                              return next;
                            }
                            return { ...prev, [idx]: current - 1 };
                          });
                        }}
                        disabled={selectedQty <= 0}
                        className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-black flex items-center justify-center text-xs transition-all cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>

                      <span className="w-6 text-center text-xs font-black text-slate-900">
                        {selectedQty}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSplitItems(prev => ({
                            ...prev,
                            [idx]: Math.min((prev[idx] || 0) + 1, item.quantity)
                          }));
                        }}
                        disabled={selectedQty >= item.quantity}
                        className="h-7 w-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-black flex items-center justify-center text-xs transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculated Paid Amount & Payment Method Selector */}
            {(() => {
              const paidTotal = Object.entries(selectedSplitItems).reduce((sum, [idxStr, qty]) => {
                const item = cart[parseInt(idxStr)];
                if (!item) return sum;
                return sum + (parseFloat(item.price) || 0) * qty;
              }, 0);

              const remainingTotal = Math.max(0, total - paidTotal);

              return (
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="bg-slate-900 text-white rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                        {lang === 'tr' ? 'Seçilen Ürünlerin Tutarı' : 'Selected Items Total'}
                      </span>
                      <span className="text-lg font-black text-amber-400">
                        {paidTotal.toFixed(2)} ₺
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                        {lang === 'tr' ? 'Kalan Adisyon Balansı' : 'Remaining Balance'}
                      </span>
                      <span className="text-sm font-bold text-slate-200">
                        {remainingTotal.toFixed(2)} ₺
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Option */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      {lang === 'tr' ? 'Kısmi Ödeme Yöntemi' : 'Partial Payment Method'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setItemSplitMethod('cash')}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          itemSplitMethod === 'cash'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Banknote className="h-4 w-4" />
                        {lang === 'tr' ? 'Nakit' : 'Cash'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemSplitMethod('credit_card')}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          itemSplitMethod === 'credit_card'
                            ? 'border-blue-500 bg-blue-50 text-blue-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <CreditCard className="h-4 w-4" />
                        {lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
                    >
                      {lang === 'tr' ? 'İptal' : 'Cancel'}
                    </button>

                    {paidTotal > 0 && remainingTotal > 0 ? (
                      <button
                        type="button"
                        disabled={completing}
                        onClick={handlePartialItemPayment}
                        className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-98 disabled:opacity-50"
                      >
                        {completing ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Coffee className="h-4 w-4 text-emerald-200" />
                            {lang === 'tr' ? `Kısmi Öde & Açık Tut (${paidTotal.toFixed(2)} ₺)` : `Pay Partial & Keep Open (${paidTotal.toFixed(2)} ₺)`}
                          </>
                        )}
                      </button>
                    ) : paidTotal > 0 && remainingTotal <= 0 ? (
                      <button
                        type="button"
                        disabled={completing}
                        onClick={handlePartialItemPayment}
                        className="py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md active:scale-98 disabled:opacity-50"
                      >
                        {completing ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            {lang === 'tr' ? `Tüm Hesabı Kapat (${paidTotal.toFixed(2)} ₺)` : `Close All (${paidTotal.toFixed(2)} ₺)`}
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={true}
                        className="py-3 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs text-center cursor-not-allowed"
                      >
                        {lang === 'tr' ? 'Ürün Seçiniz' : 'Select Items'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 2: EQUAL / AMOUNT-BASED SPLIT */}
        {splitTab === 'amount_split' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Equal Split Quick Tools */}
            <div className="mb-4">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'tr' ? 'Hızlı Eşit Bölüşme' : 'Quick Equal Split'}
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleEqualSplit(num)}
                    className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Divide className="h-3 w-3 text-slate-400" />
                    {num} {lang === 'tr' ? 'Kişi' : 'People'}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Rows */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  {lang === 'tr' ? 'Ödeme Kalemleri' : 'Payment Breakdowns'}
                </h4>
                <button
                  type="button"
                  onClick={() => setSplitPayments([...splitPayments, { method: 'cash', amount: '0' }])}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {lang === 'tr' ? 'Ödeme Satırı Ekle' : 'Add Payment Row'}
                </button>
              </div>

              {splitPayments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  {lang === 'tr' ? 'Henüz ödeme satırı eklenmedi.' : 'No payment rows added yet.'}
                </div>
              ) : (
                splitPayments.map((p, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    {/* Payment Method */}
                    <select
                      value={p.method}
                      onChange={(e) => {
                        const newPayments = [...splitPayments];
                        newPayments[idx].method = e.target.value as 'cash' | 'credit_card';
                        setSplitPayments(newPayments);
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="cash">{lang === 'tr' ? '💵 Nakit' : '💵 Cash'}</option>
                      <option value="credit_card">{lang === 'tr' ? '💳 Kredi Kartı' : '💳 Credit Card'}</option>
                    </select>

                    {/* Amount input */}
                    <div className="relative w-36">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={p.amount}
                        onChange={(e) => {
                          const newPayments = [...splitPayments];
                          newPayments[idx].amount = e.target.value;
                          setSplitPayments(newPayments);
                        }}
                        className="w-full text-right bg-white border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₺</span>
                    </div>

                    {/* Delete Button */}
                    {splitPayments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newPayments = splitPayments.filter((_, i) => i !== idx);
                          setSplitPayments(newPayments);
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Status & Validation calculation */}
            {(() => {
              const paidAmount = splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
              const diff = total - paidAmount;
              const isMatch = Math.abs(diff) < 0.01;
              const isOverpaid = diff < -0.01;
              const isPartialAmount = paidAmount > 0 && paidAmount < total;

              return (
                <div className="border-t border-slate-100 pt-4 mb-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-2">
                    <span>{lang === 'tr' ? 'Girilen Toplam' : 'Total Entered'}:</span>
                    <span>{paidAmount.toFixed(2)} ₺</span>
                  </div>

                  {isMatch ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 mb-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{lang === 'tr' ? 'Tutar Tamamlandı! Tüm masanın ödemesini onaylayabilirsiniz.' : 'Total matches! You can confirm full payment.'}</span>
                    </div>
                  ) : isOverpaid ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 mb-3">
                      <X className="h-4 w-4 shrink-0 animate-bounce" />
                      <span>{lang === 'tr' ? `Fazla Ödeme: ${Math.abs(diff).toFixed(2)} ₺` : `Overpaid: ${Math.abs(diff).toFixed(2)} ₺`}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 mb-3">
                      <span className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                        <span>{lang === 'tr' ? `Kalan Tutar:` : `Remaining:`}</span>
                      </span>
                      <span>{diff.toFixed(2)} ₺</span>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
                    >
                      {lang === 'tr' ? 'İptal Et' : 'Cancel'}
                    </button>

                    {isMatch ? (
                      <button
                        type="button"
                        disabled={completing}
                        onClick={handleFinalizeSplitSale}
                        className="w-full py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 font-bold rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md"
                      >
                        {completing ? (
                          <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            {lang === 'tr' ? 'Tüm Hesabı Kapat' : 'Close All'}
                          </>
                        )}
                      </button>
                    ) : isPartialAmount ? (
                      <button
                        type="button"
                        disabled={completing}
                        onClick={() => handlePartialAmountPayment(paidAmount)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
                      >
                        {completing ? (
                          <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Coffee className="h-3.5 w-3.5 text-emerald-200" />
                            {lang === 'tr' ? `Kısmi Al & Açık Tut (${paidAmount.toFixed(2)} ₺)` : `Pay Partial (${paidAmount.toFixed(2)} ₺)`}
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={true}
                        className="w-full py-2.5 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs text-center cursor-not-allowed"
                      >
                        {lang === 'tr' ? 'Tutar Giriniz' : 'Enter Amount'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
