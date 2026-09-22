import React from "react";
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Coffee, 
  ArrowLeftRight, 
  MessageSquare, 
  Split, 
  Building2, 
  Gift, 
  Printer 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translateText } from "../../utils/translator";

export interface PosCartPanelProps {
  lang: string;
  isCafeRestaurant: boolean;
  selectedTable: string | null;
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  markCartAsIkram: () => void;
  updatePrice: (index: number, val: string) => void;
  updateQuantity: (index: number, delta: number) => void;
  markAsIkram: (index: number) => void;
  removeFromCart: (index: number) => void;
  updateNote: (index: number, note: string) => void;
  total: number;
  activeStaffRole: 'manager' | 'cashier' | 'waiter';
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  isHotelActive: boolean;
  setShowRoomTransferModal: (show: boolean) => void;
  completing: boolean;
  handleSaveToTable: () => void;
  activeSaleId: number | null;
  setIsChangingTable: (changing: boolean) => void;
  handlePrintReceipt: (saleData?: any) => void;
  executeWithIkramCheck: (action: () => void) => void;
  openSplitPaymentModal: () => void;
  handleFinalizeSale: () => void;
}

export const PosCartPanel: React.FC<PosCartPanelProps> = ({
  lang,
  isCafeRestaurant,
  selectedTable,
  cart,
  setCart,
  markCartAsIkram,
  updatePrice,
  updateQuantity,
  markAsIkram,
  removeFromCart,
  updateNote,
  total,
  activeStaffRole,
  paymentMethod,
  setPaymentMethod,
  isHotelActive,
  setShowRoomTransferModal,
  completing,
  handleSaveToTable,
  activeSaleId,
  setIsChangingTable,
  handlePrintReceipt,
  executeWithIkramCheck,
  openSplitPaymentModal,
  handleFinalizeSale
}) => {
  return (
    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-indigo-600" />
          <h3 className="font-extrabold text-sm text-slate-800">
            {isCafeRestaurant && selectedTable !== null ? `${selectedTable} ${lang === 'tr' ? 'Adisyonu' : 'Bill'}` : (lang === 'tr' ? 'Satış Sepeti' : 'Sales Cart')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <>
              <button 
                onClick={markCartAsIkram} 
                className="text-xs font-bold text-amber-500 hover:text-amber-700 hover:bg-amber-50 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer" 
                title={lang === 'tr' ? "Tüm Sepeti İkram Yap" : "Mark Cart as Complimentary"}
              >
                <Gift className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'tr' ? "İkram Yap" : "Gift All"}</span>
              </button>
              <button 
                onClick={() => setCart([])} 
                className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer" 
                title={lang === 'tr' ? "Sepeti Temizle" : "Clear Cart"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'tr' ? "Temizle" : "Clear"}</span>
              </button>
            </>
          )}
          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-black">
            {cart.length} {lang === 'tr' ? 'Kalem' : 'Items'}
          </span>
        </div>
      </div>

      {/* Scrollable Cart Items */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 min-h-0">
        <AnimatePresence initial={false}>
          {cart.map((item, index) => (
            <motion.div 
              key={item.cart_item_id || `${item.id}_${item.selected_variant_name || 'base'}_${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 flex flex-col shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{translateText(item.name, lang as any)}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updatePrice(index, e.target.value)}
                      className="w-18 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 transition-colors"
                    />
                    <span className="text-[11px] font-medium text-slate-500">{item.currency || 'TRY'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                    <button 
                      onClick={() => updateQuantity(index, -1)}
                      className="p-1 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(index, 1)}
                      className="p-1 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => markAsIkram(index)}
                    className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                    title={lang === 'tr' ? 'İkram Olarak İşaretle' : 'Mark as Complimentary'}
                  >
                    <Gift className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => removeFromCart(index)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Item level special request/note input */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-2xs">
                <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder={lang === 'tr' ? 'Özel istek / Mutfağa not (örn: Demli, Açık)' : 'Special note for kitchen (e.g. strong, light)'}
                  value={item.note || ''}
                  onChange={(e) => updateNote(index, e.target.value)}
                  className="w-full bg-transparent border-none text-[11px] font-medium text-slate-600 outline-none placeholder-slate-400"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {cart.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
            <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-xs font-semibold">{lang === 'tr' ? 'Sepet henüz boş' : 'Cart is empty'}</p>
            <p className="text-[11px] text-slate-400 mt-1">{lang === 'tr' ? 'Soldaki ürünlere tıklayarak ekleyin' : 'Click products on left to add'}</p>
          </div>
        )}
      </div>

      {/* Checkout Footer Pinned at Bottom */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2 shrink-0">
        {/* Total Amount & Payment Method Selection Row */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/60">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{lang === 'tr' ? 'TOPLAM TUTAR' : 'TOTAL AMOUNT'}</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">{total.toFixed(2)} ₺</span>
          </div>

          {activeStaffRole !== 'waiter' && (
            <div className="flex items-center p-0.5 bg-slate-200/70 rounded-xl">
              <button 
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  paymentMethod === 'cash' 
                    ? 'bg-white text-emerald-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                <span>{lang === 'tr' ? 'Nakit' : 'Cash'}</span>
              </button>
              <button 
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  paymentMethod === 'credit_card' 
                    ? 'bg-white text-blue-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                <span>{lang === 'tr' ? 'Kart' : 'Card'}</span>
              </button>
              {isHotelActive && (
                <button 
                  type="button"
                  onClick={() => {
                    setPaymentMethod('room');
                    setShowRoomTransferModal(true);
                  }}
                  className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    paymentMethod === 'room' 
                      ? 'bg-amber-400 text-slate-950 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title={lang === 'tr' ? "Masa adisyonunu otele / odaya aktar" : "Transfer to hotel room"}
                >
                  <Building2 className="h-3.5 w-3.5 text-amber-700" />
                  <span>{lang === 'tr' ? 'Odaya Yaz' : 'Room'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {activeStaffRole === 'waiter' ? (
          /* Waiter specific view */
          <div className="space-y-1.5">
            <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-200/60 text-amber-800 text-[10px] font-semibold flex items-center gap-1">
              <span>⚠️ {lang === 'tr' ? 'Garson Modu: Sipariş masaya aktarılabilir.' : 'Waiter Mode: Send order to table.'}</span>
            </div>

            <div className={`grid ${isHotelActive ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
              <button
                disabled={cart.length === 0 || completing}
                onClick={handleSaveToTable}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Coffee className="h-3.5 w-3.5" />
                {lang === 'tr' ? 'Masaya Kaydet' : 'Save to Table'}
              </button>

              {isCafeRestaurant && selectedTable !== null && (
                <button
                  disabled={activeSaleId === null || completing}
                  onClick={() => setIsChangingTable(true)}
                  className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  {lang === 'tr' ? 'Masa Değiştir' : 'Change Table'}
                </button>
              )}

              {isHotelActive && (
                <button
                  disabled={cart.length === 0 || completing}
                  onClick={() => setShowRoomTransferModal(true)}
                  className="py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <Building2 className="h-3.5 w-3.5 text-slate-950" />
                  {lang === 'tr' ? 'Odaya Aktar' : 'To Room'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Manager & Cashier View */
          <>
            {/* Compact Toolbar Row for Table / Auxiliary Actions */}
            {isCafeRestaurant && selectedTable !== null ? (
              <div className={`grid ${isHotelActive ? 'grid-cols-5' : 'grid-cols-4'} gap-1.5`}>
                <button
                  type="button"
                  disabled={cart.length === 0 || completing}
                  onClick={handleSaveToTable}
                  className="py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 rounded-xl font-bold text-[11px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1 disabled:opacity-40 cursor-pointer active:scale-95"
                  title={lang === 'tr' ? "Siparişi masaya kaydet (Açık tut)" : "Save to table"}
                >
                  <Coffee className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{lang === 'tr' ? 'Kaydet' : 'Save'}</span>
                </button>

                <button
                  type="button"
                  disabled={cart.length === 0 || completing}
                  onClick={() => handlePrintReceipt()}
                  className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 rounded-xl font-bold text-[11px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1 disabled:opacity-40 cursor-pointer active:scale-95"
                  title={lang === 'tr' ? "Masanın güncel adisyon fişini yazdır" : "Print bill slip"}
                >
                  <Printer className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                  <span className="truncate">{lang === 'tr' ? 'Fiş Yaz' : 'Print'}</span>
                </button>

                <button
                  type="button"
                  disabled={activeSaleId === null || completing}
                  onClick={() => setIsChangingTable(true)}
                  className="py-2 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 rounded-xl font-bold text-[11px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1 disabled:opacity-40 cursor-pointer active:scale-95"
                  title={lang === 'tr' ? "Masa değiştir / siparişi başka masaya aktar" : "Transfer table"}
                >
                  <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">{lang === 'tr' ? 'Masa Değiş' : 'Transfer'}</span>
                </button>

                <button 
                  type="button"
                  disabled={cart.length === 0 || completing}
                  onClick={() => executeWithIkramCheck(openSplitPaymentModal)}
                  className="py-2 px-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl font-bold text-[11px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1 disabled:opacity-40 cursor-pointer active:scale-95"
                  title={lang === 'tr' ? "Alman usulü veya parçalı ödeme yap" : "Split payment"}
                >
                  <Split className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{lang === 'tr' ? 'Parçalı' : 'Split'}</span>
                </button>
                {isHotelActive && (
                  <button 
                    type="button"
                    disabled={cart.length === 0 || completing}
                    onClick={() => executeWithIkramCheck(() => setShowRoomTransferModal(true))}
                    className="py-2 px-1 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 border border-amber-500/80 rounded-xl font-black text-[11px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1 disabled:opacity-40 cursor-pointer active:scale-95 shadow-xs"
                    title={lang === 'tr' ? "Masa adisyonunu otele / odaya aktar" : "Transfer table bill to hotel room"}
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-950 shrink-0" />
                    <span className="truncate">{lang === 'tr' ? 'Odaya Aktar' : 'To Room'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid ${isHotelActive ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
                <button 
                  type="button"
                  disabled={cart.length === 0 || completing}
                  onClick={() => executeWithIkramCheck(openSplitPaymentModal)}
                  className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  <Split className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>{lang === 'tr' ? 'Alman Usulü / Parçalı Ödeme' : 'Split / Partial Payment'}</span>
                </button>
                {isHotelActive && (
                  <button 
                    type="button"
                    disabled={cart.length === 0 || completing}
                    onClick={() => executeWithIkramCheck(() => setShowRoomTransferModal(true))}
                    className="py-2 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-950 shrink-0" />
                    <span>{lang === 'tr' ? 'Odaya Aktar' : 'Transfer to Room'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Primary Big Checkout Button */}
            <button 
              disabled={cart.length === 0 || completing}
              onClick={handleFinalizeSale}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {completing ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>
                    {isCafeRestaurant && selectedTable !== null 
                      ? (lang === 'tr' ? 'Hesabı Kapat / Öde' : 'Close Table & Pay') 
                      : (lang === 'tr' ? 'Satışı Tamamla' : 'Complete Sale')}
                  </span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
