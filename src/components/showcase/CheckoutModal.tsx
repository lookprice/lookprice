import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, AlertCircle, ShoppingBasket, Truck, MapPin, CheckCircle2,
  ShieldCheck, CreditCard, Building2,
  Loader2, RotateCcw
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
          className="bg-slate-50 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden will-change-transform"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <ShoppingBasket className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                 <h2 className="text-lg font-black text-slate-900 leading-tight">
                   {lang === 'tr' ? 'Güvenli Ödeme' : 'Secure Checkout'}
                 </h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                   {store?.name}
                 </p>
              </div>
            </div>
            <button
               onClick={onClose}
               className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden md:p-2 scrollbar-none pb-24 md:pb-2">
            {checkoutStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center h-full p-8 md:p-12 text-center">
                 <motion.div 
                   initial={{ scale: 0 }} 
                   animate={{ scale: 1 }} 
                   transition={{ type: "spring", bounce: 0.5 }}
                   className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
                 >
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                 </motion.div>
                 <h3 className="text-2xl font-black text-slate-900 mb-4">{lang === 'tr' ? 'Siparişiniz Alındı!' : 'Order Received!'}</h3>
                 <p className="text-sm text-slate-600 max-w-md mx-auto mb-8 leading-relaxed font-medium">
                   {lang === 'tr' 
                     ? (orderSummary?.paymentMethod === 'bank_transfer' ? 'Siparişiniz başarıyla oluşturuldu. Lütfen banka havalenizi tamamlayın.' : 'Siparişiniz başarıyla alındı. Teşekkür ederiz.') 
                     : (orderSummary?.paymentMethod === 'bank_transfer' ? 'Your order has been created successfully. Please complete your bank transfer.' : 'Your order has been received successfully. Thank you.')}
                 </p>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left w-full max-w-md">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">{lang === 'tr' ? 'SİPARİŞ ÖZETİ' : 'ORDER SUMMARY'}</p>
                   <div className="space-y-2">
                     {orderSummary?.items?.map((item: any, idx: number) => (
                       <div key={idx} className="flex justify-between items-center text-sm font-semibold text-slate-700">
                         <span className="truncate pr-4">{item.quantity}x {item.title || item.name}</span>
                         <span className="whitespace-nowrap">{currency} {(item.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                       </div>
                     ))}
                   </div>
                   <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                     <span className="text-xs font-black text-slate-900">{lang === 'tr' ? 'TOPLAM' : 'TOTAL'}</span>
                     <span className="font-black text-lg" style={{ color: theme?.primaryColor || '#0ea5e9' }}>
                       {currency} {orderSummary?.totalAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                     </span>
                   </div>
                 </div>
                 <button 
                   onClick={() => window.location.reload()}
                   className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-xl text-sm font-bold tracking-wide transition-all hover:bg-slate-800"
                 >
                   {lang === 'tr' ? 'Alışverişe Dön' : 'Return to Store'}
                 </button>
              </div>
            ) : iyzicoPaymentUrl ? (
              <div className="h-[70vh] min-h-[500px]">
                 <iframe 
                   src={iyzicoPaymentUrl} 
                   className="w-full h-full border-none rounded-xl"
                   title="Iyzico Secure Payment"
                 />
              </div>
            ) : (
              <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 max-w-7xl mx-auto items-start">
                 {/* Left Column: Forms */}
                 <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                    {/* Error Banner */}
                    <AnimatePresence>
                      {orderError && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0 }}
                          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3"
                        >
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                          <p className="text-sm font-semibold">{orderError}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Form Component */}
                    <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                      
                      {/* 1. Contact & Address Info */}
                      <div className="bg-white p-6 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm">
                         <div className="flex items-center gap-3 mb-6">
                           <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                             <MapPin className="w-5 h-5" />
                           </div>
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                             {lang === 'tr' ? 'İletişim ve Teslimat' : 'Contact & Delivery'}
                           </h3>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                {lang === 'tr' ? 'E-POSTA ADRESİ' : 'EMAIL'} *
                              </label>
                              <input 
                                type="email" required
                                value={customerInfo.email}
                                onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                                placeholder={lang === 'tr' ? "ornek@mail.com" : "example@mail.com"}
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-slate-900 transition-shadow outline-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                {lang === 'tr' ? 'AD' : 'NAME'} *
                              </label>
                              <input 
                                type="text" required
                                value={customerInfo.name}
                                onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                {lang === 'tr' ? 'SOYAD' : 'SURNAME'} *
                              </label>
                              <input 
                                type="text" required
                                value={customerInfo.surname}
                                onChange={e => setCustomerInfo({...customerInfo, surname: e.target.value})}
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
                              />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                {lang === 'tr' ? 'CEP TELEFONU' : 'PHONE'} *
                              </label>
                              <input 
                                type="tel" required
                                value={customerInfo.phone}
                                onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                placeholder="05xx xxx xx xx"
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
                              />
                            </div>
                         </div>
                      </div>

                      {/* Address conditional (if not pickup) */}
                      {paymentMethod !== 'store_reservation' && (
                        <div className="bg-white p-6 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                           <div className="flex items-center gap-3 mb-6">
                             <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                               <Truck className="w-5 h-5" />
                             </div>
                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                               {lang === 'tr' ? 'Adres Bilgileri' : 'Address Details'}
                             </h3>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                  {lang === 'tr' ? 'Açık Adres' : 'Full Address'} *
                                </label>
                                <textarea 
                                  required={paymentMethod !== 'store_reservation'}
                                  rows={3}
                                  value={customerInfo.address}
                                  onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                                  placeholder={lang === 'tr' ? "Mahalle, Sokak, No..." : "Street, Apt, etc."}
                                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-slate-900 outline-none resize-none"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                  {lang === 'tr' ? 'İL/ŞEHİR' : 'CITY'} *
                                </label>
                                <input 
                                  type="text" required={paymentMethod !== 'store_reservation'}
                                  value={customerInfo.city}
                                  onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})}
                                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                  {lang === 'tr' ? 'ÜLKE' : 'COUNTRY'} *
                                </label>
                                <input 
                                  type="text" required={paymentMethod !== 'store_reservation'}
                                  value={customerInfo.country}
                                  onChange={e => setCustomerInfo({...customerInfo, country: e.target.value})}
                                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
                                />
                              </div>

                              <div className="space-y-1.5 md:col-span-2 pt-2">
                                  <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex-shrink-0 mt-0.5">
                                      <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={customerInfo.is_corporate}
                                        onChange={(e) => setCustomerInfo({...customerInfo, is_corporate: e.target.checked})}
                                      />
                                      <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-colors flex items-center justify-center">
                                         <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                                             <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                         </svg>
                                      </div>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                                      {lang === 'tr' ? 'Kurumsal Fatura İstiyorum' : 'I want Corporate Invoice'}
                                    </span>
                                 </label>
                              </div>

                              {customerInfo.is_corporate && (
                                <div className="space-y-1.5 md:col-span-2 animate-in fade-in zoom-in-95 mt-2">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                    {lang === 'tr' ? 'TC / VERGİ NO' : 'TAX ID / IDENTITY NO'} *
                                  </label>
                                  <input 
                                    type="text" required={customerInfo.is_corporate}
                                    value={customerInfo.tc_id}
                                    onChange={e => setCustomerInfo({...customerInfo, tc_id: e.target.value})}
                                    maxLength={11}
                                    placeholder={lang === 'tr' ? "11 Haneli TC veya Vergi No" : "Tax ID or Identity Number"}
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
                                  />
                                </div>
                              )}
                           </div>
                        </div>
                      )}

                      {/* 3. Payment Method Selection */}
                      <div className="bg-white p-6 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm">
                         <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                               <ShieldCheck className="w-5 h-5" />
                             </div>
                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                               {lang === 'tr' ? 'Ödeme Yöntemi' : 'Payment Method'}
                             </h3>
                           </div>
                           <ShieldCheck className="w-10 h-auto text-slate-300" />
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* 1. Iyzico (Primary Credit Card if enabled) */}
                            {store?.payment_settings?.iyzico_enabled && (
                              <label className={`relative p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'credit_card' ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input 
                                  type="radio" name="paymentMethod" value="credit_card" 
                                  checked={paymentMethod === 'credit_card'} 
                                  onChange={() => setPaymentMethod('credit_card')} 
                                  className="sr-only" 
                                />
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'credit_card' ? 'border-slate-900' : 'border-slate-300'}`}>
                                    {paymentMethod === 'credit_card' && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                                  </div>
                                  <div>
                                    <span className="block text-sm font-bold text-slate-900">{lang === 'tr' ? 'Kredi Kartı (Iyzico)' : 'Credit Card (Iyzico)'}</span>
                                    <span className="block text-[10px] text-slate-500 font-medium">Güvenli Online Ödeme</span>
                                  </div>
                                </div>
                              </label>
                            )}

                            {/* 2. Generic Credit Card - ONLY if iyzico is NOT enabled AND some other POS is enabled */}
                            {!store?.payment_settings?.iyzico_enabled && Object.keys(store?.payment_settings || {}).some(k => k.endsWith('_enabled') && k !== 'bank_transfer_enabled' && k !== 'cod_enabled' && k !== 'store_reservation' && store?.payment_settings[k]) && (
                              <label className={`relative p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'credit_card' ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input 
                                  type="radio" name="paymentMethod" value="credit_card" 
                                  checked={paymentMethod === 'credit_card'} 
                                  onChange={() => setPaymentMethod('credit_card')} 
                                  className="sr-only" 
                                />
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'credit_card' ? 'border-slate-900' : 'border-slate-300'}`}>
                                    {paymentMethod === 'credit_card' && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                                  </div>
                                  <div>
                                    <span className="block text-sm font-bold text-slate-900">{lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}</span>
                                    <span className="block text-[10px] text-slate-500 font-medium">Secure Payment</span>
                                  </div>
                                </div>
                              </label>
                            )}

                            {/* 3. Payoneer */}
                            {store?.payment_settings?.payoneer_enabled && (
                              <label className={`relative p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'payoneer' ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input 
                                  type="radio" name="paymentMethod" value="payoneer" 
                                  checked={paymentMethod === 'payoneer'} 
                                  onChange={() => setPaymentMethod('payoneer')} 
                                  className="sr-only" 
                                />
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'payoneer' ? 'border-slate-900' : 'border-slate-300'}`}>
                                    {paymentMethod === 'payoneer' && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                                  </div>
                                  <span className="block text-sm font-bold text-slate-900">Payoneer</span>
                                </div>
                              </label>
                            )}

                            {/* 4. PayPal */}
                            {store?.payment_settings?.paypal_enabled && (
                              <label className={`relative p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'paypal' ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input 
                                  type="radio" name="paymentMethod" value="paypal" 
                                  checked={paymentMethod === 'paypal'} 
                                  onChange={() => setPaymentMethod('paypal')} 
                                  className="sr-only" 
                                />
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'paypal' ? 'border-slate-900' : 'border-slate-300'}`}>
                                    {paymentMethod === 'paypal' && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                                  </div>
                                  <span className="block text-sm font-bold text-slate-900">PayPal</span>
                                </div>
                              </label>
                            )}

                            {/* Bank Transfer */}
                            {store?.payment_settings?.bank_transfer_enabled && (
                               <label className={`relative p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                                 <input 
                                   type="radio" name="paymentMethod" value="bank_transfer" 
                                   checked={paymentMethod === 'bank_transfer'} 
                                   onChange={() => setPaymentMethod('bank_transfer')} 
                                   className="sr-only" 
                                 />
                                 <div className="flex items-center gap-3">
                                   <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'bank_transfer' ? 'border-slate-900' : 'border-slate-300'}`}>
                                     {paymentMethod === 'bank_transfer' && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                                   </div>
                                   <div>
                                     <span className="block text-sm font-bold text-slate-900">{lang === 'tr' ? 'Banka Havalesi / EFT' : 'Bank Transfer'}</span>
                                     {paymentMethod === 'bank_transfer' && <span className="block text-[10px] text-slate-500 font-medium">Banka bilgileri aşağıda</span>}
                                   </div>
                                 </div>
                               </label>
                            )}

                            {/* Cash on Delivery */}
                            {store?.payment_settings?.cod_enabled && (
                               <label className={`relative p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cash_on_delivery' ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                                 <input 
                                   type="radio" name="paymentMethod" value="cash_on_delivery" 
                                   checked={paymentMethod === 'cash_on_delivery'} 
                                   onChange={() => setPaymentMethod('cash_on_delivery')} 
                                   className="sr-only" 
                                 />
                                 <div className="flex items-center gap-3">
                                   <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'cash_on_delivery' ? 'border-slate-900' : 'border-slate-300'}`}>
                                     {paymentMethod === 'cash_on_delivery' && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                                   </div>
                                   <span className="block text-sm font-bold text-slate-900">{lang === 'tr' ? 'Kapıda Ödeme' : 'Cash on Delivery'}</span>
                                 </div>
                               </label>
                            )}

                            {/* In-Store Pickup */}
                            {store?.branding?.reservation_enabled && (
                               <label className={`relative p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'store_reservation' ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                                 <input 
                                   type="radio" name="paymentMethod" value="store_reservation" 
                                   checked={paymentMethod === 'store_reservation'} 
                                   onChange={() => setPaymentMethod('store_reservation')} 
                                   className="sr-only" 
                                 />
                                 <div className="flex items-center gap-3">
                                   <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'store_reservation' ? 'border-amber-500' : 'border-slate-300'}`}>
                                     {paymentMethod === 'store_reservation' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                                   </div>
                                   <div>
                                     <span className="block text-sm font-bold text-amber-900">{lang === 'tr' ? 'Mağazadan Teslim' : 'In-Store Pickup'}</span>
                                     <span className="block text-[10px] text-amber-700 font-medium">Hemen Ayırt!</span>
                                   </div>
                                 </div>
                               </label>
                            )}
                         </div>

                         {/* Bank Details Display */}
                         <AnimatePresence>
                           {paymentMethod === 'bank_transfer' && store?.payment_settings?.bank_details && (
                             <motion.div 
                               initial={{ opacity: 0, height: 0 }} 
                               animate={{ opacity: 1, height: 'auto' }} 
                               exit={{ opacity: 0, height: 0 }}
                               className="overflow-hidden"
                             >
                               <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl whitespace-pre-line text-sm font-medium text-slate-700">
                                 {store.payment_settings.bank_details}
                               </div>
                             </motion.div>
                           )}
                         </AnimatePresence>

                         {/* Store Locator Selection */}
                         <AnimatePresence>
                           {paymentMethod === 'store_reservation' && store?.branding?.locations?.length > 0 && (
                             <motion.div 
                               initial={{ opacity: 0, height: 0 }} 
                               animate={{ opacity: 1, height: 'auto' }} 
                               exit={{ opacity: 0, height: 0 }}
                               className="overflow-hidden"
                             >
                               <div className="mt-4 space-y-3">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                   {lang === 'tr' ? 'TESLİMAT MAĞAZASI SEÇİN' : 'SELECT STORE LOCATION'}
                                 </label>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                   {store.branding.locations.filter((l:any) => l.active).map((loc: any, idx: number) => (
                                     <label key={idx} className={`relative p-3 border rounded-xl cursor-pointer transition-all ${customerInfo.selected_store_location === loc.name ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300'}`}>
                                       <input 
                                         type="radio" name="store_location" value={loc.name}
                                         checked={customerInfo.selected_store_location === loc.name}
                                         onChange={(e) => setCustomerInfo({...customerInfo, selected_store_location: e.target.value})}
                                         className="sr-only" required={paymentMethod === 'store_reservation'}
                                       />
                                       <div className="flex gap-3">
                                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex flex-shrink-0 items-center justify-center ${customerInfo.selected_store_location === loc.name ? 'border-amber-500' : 'border-slate-300'}`}>
                                            {customerInfo.selected_store_location === loc.name && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                                          </div>
                                          <div>
                                            <span className="block text-sm font-bold text-slate-900">{loc.name}</span>
                                            <span className="block text-xs text-slate-500 line-clamp-2 mt-0.5">{loc.address}</span>
                                          </div>
                                       </div>
                                     </label>
                                   ))}
                                 </div>
                               </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                      </div>

                    </form>
                 </div>

                 {/* Right Column: Order Summary & Sticky Button */}
                 <div className="lg:col-span-5 xl:col-span-4 h-full relative">
                    <div className="sticky top-[76px] xl:top-[84px]">
                       <div className="bg-white p-6 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col mb-4">
                         <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                           {lang === 'tr' ? 'Sipariş Özeti' : 'Order Summary'}
                         </h3>
                         
                         <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 max-h-[300px] scrollbar-none">
                            {Object.entries(basketByBranch).map(([branchName, items]: [string, any]) => (
                               <div key={branchName}>
                                  {items.map((item: any, idx: number) => (
                                     <div key={`${branchName}-${idx}`} className="flex gap-4 py-2">
                                       <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                         {item.images?.[0] ? (
                                           <img src={item.images[0]} alt={item.title || item.name} className="w-full h-full object-cover" />
                                         ) : (
                                           <div className="w-full h-full flex items-center justify-center text-slate-300">
                                             <ShieldCheck className="w-6 h-6" />
                                           </div>
                                         )}
                                       </div>
                                       <div className="flex-1 min-w-0 flex flex-col justify-center">
                                         <span className="text-sm font-bold text-slate-900 truncate block">{item.title || item.name}</span>
                                         <span className="text-[10px] text-slate-500 font-semibold mt-0.5">Adet: {item.quantity}</span>
                                         <span className="text-xs font-black text-slate-900 mt-1" style={{ color: theme?.primaryColor || '#0ea5e9' }}>
                                           {currency} {(item.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                         </span>
                                       </div>
                                     </div>
                                  ))}
                               </div>
                            ))}
                         </div>

                         <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                           <div className="flex justify-between text-sm font-semibold text-slate-500">
                             <span>{lang === 'tr' ? 'Ara Toplam' : 'Subtotal'}</span>
                             <span>{currency} {basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                           </div>
                           <div className="flex justify-between text-sm font-semibold text-slate-500">
                             <span>{lang === 'tr' ? 'Kargo' : 'Shipping'}</span>
                             <span className="text-green-600">{lang === 'tr' ? 'Ücretsiz' : 'Free'}</span>
                           </div>
                           <div className="flex justify-between items-end pt-3 text-lg font-black text-slate-900">
                             <span className="text-sm uppercase tracking-widest">{lang === 'tr' ? 'Genel Toplam' : 'Total'}</span>
                             <span style={{ color: theme?.primaryColor || '#0ea5e9' }}>{currency} {basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                           </div>
                         </div>
                       </div>
                       
                       {/* Action Button - Desktop Stick */}
                       <div className="hidden lg:block">
                         <button 
                           form="checkout-form"
                           type="submit"
                           disabled={checkoutStatus === 'loading'}
                           className={`w-full py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${checkoutStatus === 'loading' ? 'opacity-70 bg-slate-800 text-white cursor-not-allowed' : 'text-white hover:bg-opacity-90 hover:shadow-2xl hover:-translate-y-1'}`}
                           style={{ backgroundColor: checkoutStatus === 'loading' ? undefined : (theme?.primaryColor || '#0ea5e9') }}
                         >
                           {checkoutStatus === 'loading' ? (
                             <>
                               <Loader2 className="w-5 h-5 animate-spin" />
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
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-50">
               <button 
                 form="checkout-form"
                 type="submit"
                 disabled={checkoutStatus === 'loading'}
                 className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${checkoutStatus === 'loading' ? 'opacity-70 bg-slate-800 text-white' : 'text-white active:scale-[0.98]'}`}
                 style={{ backgroundColor: checkoutStatus === 'loading' ? undefined : (theme?.primaryColor || '#0ea5e9') }}
               >
                 {checkoutStatus === 'loading' ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin" />
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
