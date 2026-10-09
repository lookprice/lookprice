import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, AlertCircle, ShoppingBasket, Truck, MapPin, CheckCircle2,
  ShieldCheck, CreditCard, Building2,
  Loader2, RotateCcw, Plus, Minus, Trash2
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: any;
  lang: string;
  currency: string;
  customerInfo: any;
  setCustomerInfo: (info: any) => void;
  basketByBranch: Record<string, any[]>;
  basketTotal: number;
  basketSubtotal?: number;
  basketShippingTotal?: number;
  setBasket?: React.Dispatch<React.SetStateAction<any[]>>;
  paymentMethod: string;
  setPaymentMethod: (method: any) => void;
  checkoutStatus: 'idle' | 'loading' | 'success' | 'error';
  orderError: string | null;
  orderSummary: any;
  handleCheckout: (e: React.FormEvent) => void;
  iyzicoPaymentUrl: string | null;
  theme?: {
    primaryColor?: string;
    borderFocusColor?: string;
  };
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  store,
  lang,
  currency,
  customerInfo,
  setCustomerInfo,
  basketByBranch,
  basketTotal,
  basketSubtotal,
  basketShippingTotal,
  setBasket,
  paymentMethod,
  setPaymentMethod,
  checkoutStatus,
  orderError,
  orderSummary,
  handleCheckout,
  iyzicoPaymentUrl,
  theme
}) => {
  if (!isOpen) return null;

  const subtotal = basketSubtotal !== undefined ? basketSubtotal : basketTotal;
  const shipping = basketShippingTotal !== undefined ? basketShippingTotal : 0;

  const updateQuantity = (cartKey: string | undefined, id: number | string, delta: number) => {
    if (!setBasket) return;
    setBasket((prev: any[]) =>
      prev
        .map((item: any) => {
          const isMatch = cartKey ? item.cart_key === cartKey : item.id === id;
          if (isMatch) {
            const newQty = (item.quantity || 1) + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (cartKey: string | undefined, id: number | string) => {
    if (!setBasket) return;
    setBasket((prev: any[]) =>
      prev.filter((item: any) => (cartKey ? item.cart_key !== cartKey : item.id !== id))
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0"
        />
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-slate-50 w-full h-full md:h-auto md:max-h-[88vh] md:max-w-4xl md:rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden will-change-transform"
        >
          {/* Header */}
          <div className="px-4 md:px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <ShoppingBasket className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                 <h2 className="text-sm md:text-base font-black text-slate-900 leading-tight">
                   {lang === 'tr' ? 'Güvenli Ödeme' : 'Secure Checkout'}
                 </h2>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                   {store?.name}
                 </p>
              </div>
            </div>
            <button
               onClick={onClose}
               className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 scrollbar-none pb-20 md:pb-4">
            {checkoutStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center h-full p-6 md:p-8 text-center">
                 <motion.div 
                   initial={{ scale: 0 }} 
                   animate={{ scale: 1 }} 
                   transition={{ type: "spring", bounce: 0.5 }}
                   className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                 >
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                 </motion.div>
                 <h3 className="text-xl font-black text-slate-900 mb-2">{lang === 'tr' ? 'Siparişiniz Alındı!' : 'Order Received!'}</h3>
                 <p className="text-xs text-slate-600 max-w-md mx-auto mb-6 leading-relaxed font-medium">
                   {lang === 'tr' 
                     ? (orderSummary?.paymentMethod === 'bank_transfer' ? 'Siparişiniz başarıyla oluşturuldu. Lütfen banka havalenizi tamamlayın.' : 'Siparişiniz başarıyla alındı. Teşekkür ederiz.') 
                     : (orderSummary?.paymentMethod === 'bank_transfer' ? 'Your order has been created successfully. Please complete your bank transfer.' : 'Your order has been received successfully. Thank you.')}
                 </p>
                 <div className="bg-white p-4 rounded-xl border border-slate-200 text-left w-full max-w-md">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">{lang === 'tr' ? 'SİPARİŞ ÖZETİ' : 'ORDER SUMMARY'}</p>
                   <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                     {orderSummary?.items?.map((item: any, idx: number) => (
                       <div key={`order-sum-${item.id || idx}-${idx}`} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                         <span className="truncate pr-4">{item.quantity}x {item.title || item.name}</span>
                         <span className="whitespace-nowrap font-bold">{currency} {(item.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                       </div>
                     ))}
                   </div>
                   <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                     <span className="text-xs font-black text-slate-900">{lang === 'tr' ? 'TOPLAM' : 'TOTAL'}</span>
                     <span className="font-black text-base" style={{ color: theme?.primaryColor || '#0ea5e9' }}>
                       {currency} {orderSummary?.totalAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                     </span>
                   </div>
                 </div>
                 <button 
                   onClick={() => window.location.reload()}
                   className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold tracking-wide transition-all hover:bg-slate-800 cursor-pointer"
                 >
                   {lang === 'tr' ? 'Alışverişe Dön' : 'Return to Store'}
                 </button>
              </div>
            ) : iyzicoPaymentUrl ? (
              <div className="h-[70vh] min-h-[450px]">
                 <iframe 
                   src={iyzicoPaymentUrl} 
                   className="w-full h-full border-none rounded-xl"
                   title="Iyzico Secure Payment"
                 />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-5xl mx-auto items-start">
                 {/* Left Column: Forms */}
                 <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-3">
                    {/* Error Banner */}
                    <AnimatePresence>
                      {orderError && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0 }}
                          className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2.5"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <p className="text-xs font-semibold">{orderError}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Form Component */}
                    <form id="checkout-form" onSubmit={handleCheckout} className="space-y-3">
                      
                      {/* 1. Contact & Address Info */}
                      <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200 shadow-2xs">
                         <div className="flex items-center gap-2 mb-3">
                           <div className="p-1.5 bg-slate-100 rounded-md text-slate-700">
                             <MapPin className="w-3.5 h-3.5" />
                           </div>
                           <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                             {lang === 'tr' ? 'İletişim ve Teslimat' : 'Contact & Delivery'}
                           </h3>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-0.5">
                                {lang === 'tr' ? 'E-POSTA ADRESİ' : 'EMAIL'} *
                              </label>
                              <input 
                                type="email" required
                                value={customerInfo.email}
                                onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                                placeholder={lang === 'tr' ? "ornek@mail.com" : "example@mail.com"}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-900 transition-shadow outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-0.5">
                                {lang === 'tr' ? 'AD' : 'NAME'} *
                              </label>
                              <input 
                                type="text" required
                                value={customerInfo.name}
                                onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-0.5">
                                {lang === 'tr' ? 'SOYAD' : 'SURNAME'} *
                              </label>
                              <input 
                                type="text" required
                                value={customerInfo.surname}
                                onChange={e => setCustomerInfo({...customerInfo, surname: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-0.5">
                                {lang === 'tr' ? 'CEP TELEFONU' : 'PHONE'} *
                              </label>
                              <input 
                                type="tel" required
                                value={customerInfo.phone}
                                onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                placeholder="05xx xxx xx xx"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                              />
                            </div>
                         </div>
                      </div>

                      {/* Address conditional (if not pickup) */}
                      {paymentMethod !== 'store_reservation' && (
                        <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200 shadow-2xs">
                           <div className="flex items-center gap-2 mb-3">
                             <div className="p-1.5 bg-slate-100 rounded-md text-slate-700">
                               <Truck className="w-3.5 h-3.5" />
                             </div>
                             <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                               {lang === 'tr' ? 'Adres Bilgileri' : 'Address Details'}
                             </h3>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-0.5">
                                  {lang === 'tr' ? 'Açık Adres' : 'Full Address'} *
                                </label>
                                <textarea 
                                  required={paymentMethod !== 'store_reservation'}
                                  rows={2}
                                  value={customerInfo.address}
                                  onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                                  placeholder={lang === 'tr' ? "Mahalle, Sokak, No..." : "Street, Apt, etc."}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-900 outline-none resize-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-0.5">
                                  {lang === 'tr' ? 'İL/ŞEHİR' : 'CITY'} *
                                </label>
                                <input 
                                  type="text" required={paymentMethod !== 'store_reservation'}
                                  value={customerInfo.city}
                                  onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-0.5">
                                  {lang === 'tr' ? 'ÜLKE' : 'COUNTRY'} *
                                </label>
                                <input 
                                  type="text" required={paymentMethod !== 'store_reservation'}
                                  value={customerInfo.country}
                                  onChange={e => setCustomerInfo({...customerInfo, country: e.target.value})}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                                />
                              </div>

                              <div className="space-y-1 md:col-span-2 pt-1">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex-shrink-0">
                                      <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={customerInfo.is_corporate}
                                        onChange={(e) => setCustomerInfo({...customerInfo, is_corporate: e.target.checked})}
                                      />
                                      <div className="w-4 h-4 border border-slate-300 rounded peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-colors flex items-center justify-center">
                                         <svg className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                                             <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                         </svg>
                                      </div>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                                      {lang === 'tr' ? 'Kurumsal Fatura İstiyorum' : 'I want Corporate Invoice'}
                                    </span>
                                 </label>
                              </div>

                              {customerInfo.is_corporate && (
                                <div className="space-y-1 md:col-span-2 mt-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-0.5">
                                    {lang === 'tr' ? 'TC / VERGİ NO' : 'TAX ID / IDENTITY NO'} *
                                  </label>
                                  <input 
                                    type="text" required={customerInfo.is_corporate}
                                    value={customerInfo.tc_id}
                                    onChange={e => setCustomerInfo({...customerInfo, tc_id: e.target.value})}
                                    maxLength={11}
                                    placeholder={lang === 'tr' ? "11 Haneli TC veya Vergi No" : "Tax ID or Identity Number"}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-900 outline-none"
                                  />
                                </div>
                              )}
                           </div>
                        </div>
                      )}

                      {/* 3. Payment Method Selection */}
                      <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200 shadow-2xs">
                         <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-slate-100 rounded-md text-slate-700">
                               <ShieldCheck className="w-3.5 h-3.5" />
                             </div>
                             <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                               {lang === 'tr' ? 'Ödeme Yöntemi' : 'Payment Method'}
                             </h3>
                           </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {/* 1. Iyzico (Primary Credit Card if enabled) */}
                            {store?.payment_settings?.iyzico_enabled && (
                              <label className={`relative p-2.5 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'credit_card' ? 'border-slate-900 bg-slate-50 shadow-2xs' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input 
                                  type="radio" name="paymentMethod" value="credit_card" 
                                  checked={paymentMethod === 'credit_card'} 
                                  onChange={() => setPaymentMethod('credit_card')} 
                                  className="sr-only" 
                                />
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'credit_card' ? 'border-slate-900' : 'border-slate-300'}`}>
                                    {paymentMethod === 'credit_card' && <div className="w-2 h-2 bg-slate-900 rounded-full" />}
                                  </div>
                                  <div>
                                    <span className="block text-xs font-bold text-slate-900">{lang === 'tr' ? 'Kredi Kartı (Iyzico)' : 'Credit Card (Iyzico)'}</span>
                                    <span className="block text-[9px] text-slate-500 font-medium">Güvenli Online Ödeme</span>
                                  </div>
                                </div>
                              </label>
                            )}

                            {/* 2. Generic Credit Card */}
                            {!store?.payment_settings?.iyzico_enabled && Object.keys(store?.payment_settings || {}).some(k => k.endsWith('_enabled') && k !== 'bank_transfer_enabled' && k !== 'cod_enabled' && k !== 'store_reservation' && store?.payment_settings[k]) && (
                              <label className={`relative p-2.5 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'credit_card' ? 'border-slate-900 bg-slate-50 shadow-2xs' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input 
                                  type="radio" name="paymentMethod" value="credit_card" 
                                  checked={paymentMethod === 'credit_card'} 
                                  onChange={() => setPaymentMethod('credit_card')} 
                                  className="sr-only" 
                                />
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'credit_card' ? 'border-slate-900' : 'border-slate-300'}`}>
                                    {paymentMethod === 'credit_card' && <div className="w-2 h-2 bg-slate-900 rounded-full" />}
                                  </div>
                                  <div>
                                    <span className="block text-xs font-bold text-slate-900">{lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}</span>
                                    <span className="block text-[9px] text-slate-500 font-medium">Secure Payment</span>
                                  </div>
                                </div>
                              </label>
                            )}

                            {/* Bank Transfer */}
                            {store?.payment_settings?.bank_transfer_enabled && (
                               <label className={`relative p-2.5 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-slate-900 bg-slate-50 shadow-2xs' : 'border-slate-200 hover:border-slate-300'}`}>
                                 <input 
                                   type="radio" name="paymentMethod" value="bank_transfer" 
                                   checked={paymentMethod === 'bank_transfer'} 
                                   onChange={() => setPaymentMethod('bank_transfer')} 
                                   className="sr-only" 
                                 />
                                 <div className="flex items-center gap-2.5">
                                   <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'bank_transfer' ? 'border-slate-900' : 'border-slate-300'}`}>
                                     {paymentMethod === 'bank_transfer' && <div className="w-2 h-2 bg-slate-900 rounded-full" />}
                                   </div>
                                   <div>
                                     <span className="block text-xs font-bold text-slate-900">{lang === 'tr' ? 'Banka Havalesi / EFT' : 'Bank Transfer'}</span>
                                     <span className="block text-[9px] text-slate-500 font-medium">{lang === 'tr' ? 'Hesaba Havale' : 'Direct Transfer'}</span>
                                   </div>
                                 </div>
                               </label>
                            )}

                            {/* Cash on Delivery */}
                            {store?.payment_settings?.cod_enabled && (
                               <label className={`relative p-2.5 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-slate-900 bg-slate-50 shadow-2xs' : 'border-slate-200 hover:border-slate-300'}`}>
                                 <input 
                                   type="radio" name="paymentMethod" value="cod" 
                                   checked={paymentMethod === 'cod'} 
                                   onChange={() => setPaymentMethod('cod')} 
                                   className="sr-only" 
                                 />
                                 <div className="flex items-center gap-2.5">
                                   <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'border-slate-900' : 'border-slate-300'}`}>
                                     {paymentMethod === 'cod' && <div className="w-2 h-2 bg-slate-900 rounded-full" />}
                                   </div>
                                   <div>
                                     <span className="block text-xs font-bold text-slate-900">{lang === 'tr' ? 'Kapıda Ödeme' : 'Cash on Delivery'}</span>
                                     <span className="block text-[9px] text-slate-500 font-medium">{lang === 'tr' ? 'Nakit veya Kart' : 'Cash or Card'}</span>
                                   </div>
                                 </div>
                               </label>
                            )}

                            {/* Store Reservation */}
                            {store?.payment_settings?.store_reservation && (
                               <label className={`relative p-2.5 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'store_reservation' ? 'border-slate-900 bg-slate-50 shadow-2xs' : 'border-slate-200 hover:border-slate-300'}`}>
                                 <input 
                                   type="radio" name="paymentMethod" value="store_reservation" 
                                   checked={paymentMethod === 'store_reservation'} 
                                   onChange={() => setPaymentMethod('store_reservation')} 
                                   className="sr-only" 
                                 />
                                 <div className="flex items-center gap-2.5">
                                   <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'store_reservation' ? 'border-slate-900' : 'border-slate-300'}`}>
                                     {paymentMethod === 'store_reservation' && <div className="w-2 h-2 bg-slate-900 rounded-full" />}
                                   </div>
                                   <div>
                                     <span className="block text-xs font-bold text-slate-900">{lang === 'tr' ? 'Mağazadan Teslim & Rezervasyon' : 'Store Pickup'}</span>
                                     <span className="block text-[9px] text-slate-500 font-medium">{lang === 'tr' ? 'Mağazada Öde' : 'Pay at Store'}</span>
                                   </div>
                                 </div>
                               </label>
                            )}
                         </div>
                      </div>

                    </form>
                 </div>

                 {/* Right Column: Order Summary & Action Button */}
                 <div className="lg:col-span-5 xl:col-span-5 h-full relative">
                    <div className="sticky top-2">
                       <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col mb-3">
                         <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                           {lang === 'tr' ? 'Sipariş Özeti' : 'Order Summary'}
                         </h3>
                         
                         <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[220px] scrollbar-none">
                            {Object.entries(basketByBranch).length === 0 || Object.values(basketByBranch).every(items => !items || items.length === 0) ? (
                              <div className="py-6 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5">
                                <ShoppingBasket className="w-8 h-8 text-slate-300 stroke-1" />
                                <p className="text-xs font-bold text-slate-600">
                                  {lang === 'tr' ? 'Sepetinizde ürün bulunmuyor' : 'Your cart is empty'}
                                </p>
                                <button
                                  type="button"
                                  onClick={onClose}
                                  className="mt-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                >
                                  {lang === 'tr' ? 'Alışverişe Devam Et' : 'Continue Shopping'}
                                </button>
                              </div>
                            ) : (
                              Object.entries(basketByBranch).map(([branchName, items]: [string, any], bIdx: number) => (
                                <div key={`checkout-branch-${branchName}-${bIdx}`} className="space-y-1.5">
                                  {items.map((item: any, idx: number) => (
                                    <div key={`checkout-item-${branchName}-${item.id || idx}-${idx}`} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all">
                                      <div className="w-11 h-11 bg-white rounded-md overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                                        {item.images?.[0] || item.image_url ? (
                                          <img src={item.images?.[0] || item.image_url} alt={item.title || item.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ShieldCheck className="w-4 h-4" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-start justify-between gap-1">
                                          <span className="text-xs font-bold text-slate-900 truncate block">{item.title || item.name}</span>
                                          <button
                                            type="button"
                                            onClick={() => removeItem(item.cart_key, item.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                                            title={lang === 'tr' ? 'Ürünü Sil' : 'Remove item'}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-1 gap-1.5">
                                          {/* Quantity Controls */}
                                          <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
                                            <button
                                              type="button"
                                              onClick={() => updateQuantity(item.cart_key, item.id, -1)}
                                              className="w-4.5 h-4.5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded text-xs font-black transition-all cursor-pointer"
                                            >
                                              <Minus className="w-2.5 h-2.5" />
                                            </button>
                                            <span className="text-xs font-black text-slate-900 px-1 min-w-[16px] text-center">
                                              {item.quantity || 1}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => updateQuantity(item.cart_key, item.id, 1)}
                                              className="w-4.5 h-4.5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded text-xs font-black transition-all cursor-pointer"
                                            >
                                              <Plus className="w-2.5 h-2.5" />
                                            </button>
                                          </div>

                                          {/* Line Price */}
                                          <span className="text-xs font-black text-slate-900" style={{ color: theme?.primaryColor || '#0ea5e9' }}>
                                            {currency} {((item.price || 0) * (item.quantity || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))
                            )}
                         </div>

                         <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                           <div className="flex justify-between font-medium text-slate-500">
                             <span>{lang === 'tr' ? 'Ara Toplam' : 'Subtotal'}</span>
                             <span>{currency} {subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                           </div>
                           <div className="flex justify-between font-medium text-slate-500">
                             <span>{lang === 'tr' ? 'Kargo' : 'Shipping'}</span>
                             {shipping > 0 ? (
                               <span className="font-bold text-slate-900">{currency} {shipping.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                             ) : (
                               <span className="text-green-600 font-bold">{lang === 'tr' ? 'Ücretsiz' : 'Free'}</span>
                             )}
                           </div>
                           <div className="flex justify-between items-end pt-2 text-sm font-black text-slate-900 border-t border-slate-100">
                             <span className="text-xs uppercase tracking-wider">{lang === 'tr' ? 'Genel Toplam' : 'Total'}</span>
                             <span className="text-base" style={{ color: theme?.primaryColor || '#0ea5e9' }}>{currency} {basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                           </div>
                         </div>
                       </div>
                       
                       {/* Action Button - Desktop Stick */}
                       <div className="hidden lg:block">
                         <button 
                           form="checkout-form"
                           type="submit"
                           disabled={checkoutStatus === 'loading'}
                           className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${checkoutStatus === 'loading' ? 'opacity-70 bg-slate-800 text-white cursor-not-allowed' : 'text-white hover:bg-opacity-90 hover:shadow-lg active:scale-[0.99]'}`}
                           style={{ backgroundColor: checkoutStatus === 'loading' ? undefined : (theme?.primaryColor || '#0ea5e9') }}
                         >
                           {checkoutStatus === 'loading' ? (
                             <>
                               <Loader2 className="w-4 h-4 animate-spin" />
                               {lang === 'tr' ? 'İşleniyor...' : 'Processing...'}
                             </>
                           ) : (
                             lang === 'tr' ? 'Siparişi Tamamla' : 'Complete Order'
                           )}
                         </button>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Action Button - Mobile Fixed Bottom */}
          {checkoutStatus !== 'success' && !iyzicoPaymentUrl && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-50">
               <button 
                 form="checkout-form"
                 type="submit"
                 disabled={checkoutStatus === 'loading'}
                 className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 ${checkoutStatus === 'loading' ? 'opacity-70 bg-slate-800 text-white' : 'text-white active:scale-[0.98]'}`}
                 style={{ backgroundColor: checkoutStatus === 'loading' ? undefined : (theme?.primaryColor || '#0ea5e9') }}
               >
                 {checkoutStatus === 'loading' ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin" />
                     {lang === 'tr' ? 'İşleniyor...' : 'Processing...'}
                   </>
                 ) : (
                   <div className="flex items-center justify-between w-full px-2">
                     <span>{currency} {basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                     <span>{lang === 'tr' ? 'Siparişi Tamamla' : 'Pay Now'}</span>
                   </div>
                 )}
               </button>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
