import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Printer } from 'lucide-react';

interface PosSuccessModalProps {
  isOpen: boolean;
  lang: string;
  lastSaleId: number | null;
  branding: any;
  storeId?: number;
  lastCart: any[];
  paymentMethod: 'cash' | 'credit_card' | 'room';
  lastFiscal: any;
  onPrintReceipt: () => void;
  onContinue: () => void;
}

export const PosSuccessModal: React.FC<PosSuccessModalProps> = ({
  isOpen,
  lang,
  lastSaleId,
  branding,
  storeId,
  lastCart,
  paymentMethod,
  lastFiscal,
  onPrintReceipt,
  onContinue,
}) => {
  if (!isOpen) return null;

  const totalAmount = lastCart.reduce((sum, i) => sum + ((parseFloat(i.price) || 0) * i.quantity), 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
      >
        <div>
          <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">
            {lang === 'tr' ? 'Satış Başarılı!' : 'Sale Successful!'}
          </h2>
          <p className="text-slate-400 font-medium text-xs mb-4">
            {lang === 'tr' ? `Satış #${lastSaleId} başarıyla kaydedildi.` : `Sale #${lastSaleId} recorded successfully.`}
          </p>
        </div>

        {/* Thermal Receipt Visual Preview (On Screen) */}
        <div className="mb-6 max-h-64 overflow-y-auto bg-amber-50/40 border border-amber-200/40 rounded-2xl p-5 text-left font-mono text-xs leading-relaxed text-slate-800 shadow-inner scrollbar-thin">
          <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
            <h4 className="font-extrabold text-sm uppercase text-slate-900 tracking-tight">
              {branding?.store_name || branding?.name || (lang === 'tr' ? "Seçkin Mağaza" : "Premium Store")}
            </h4>
            <p className="text-[10px] text-amber-800 font-bold mt-1 tracking-widest">
              {lang === 'tr' ? 'SİPARİŞ FİŞİ' : 'ORDER RECEIPT'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Mağaza ID: {storeId} | Fiş: #{lastSaleId}
            </p>
            <p className="text-[10px] text-slate-400">
              {new Date().toLocaleString('tr-TR')}
            </p>
          </div>
          
          <div className="space-y-1.5 mb-3 text-[11px] text-slate-700">
            {lastCart.map((item, idx) => (
              <div key={idx} className="flex justify-between gap-2">
                <span className="truncate flex-1 font-semibold">{item.quantity}x {item.name}</span>
                <span className="font-bold text-slate-900">{(parseFloat(item.price) * item.quantity).toFixed(2)} ₺</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-dashed border-slate-300 pt-3 font-bold text-xs">
            <div className="flex justify-between text-slate-900 text-sm">
              <span>TOPLAM</span>
              <span>{totalAmount.toFixed(2)} ₺</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[10px] mt-1 font-medium">
              <span>Ödeme Tipi</span>
              <span className="uppercase text-slate-700 font-bold">
                {paymentMethod === 'cash' ? (lang === 'tr' ? 'NAKİT' : 'CASH') : 
                 paymentMethod === 'credit_card' ? (lang === 'tr' ? 'KREDİ KARTI' : 'CREDIT CARD') : 
                 (lang === 'tr' ? 'ODA AKTARIMI' : 'ROOM CHARGE')}
              </span>
            </div>
          </div>

          {lastFiscal && (
            <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-[9px] text-center text-slate-400">
              <p>FİŞ NO: {lastFiscal.receiptNo}</p>
              <p>Z NO: {lastFiscal.zNo}</p>
              <p>CİHAZ: {lastFiscal.brand} - {lastFiscal.terminal}</p>
              <p className="mt-1 font-bold">MALİ MÜHÜR</p>
            </div>
          )}
          
          <div className="mt-4 text-center text-[9px] text-slate-400">
            <p>{lang === 'tr' ? 'Bizi tercih ettiğiniz için teşekkürler!' : 'Thank you for choosing us!'}</p>
          </div>
        </div>

        {/* Hidden Clean HTML for Thermal Printer Output */}
        <div id="pos-receipt-printable" className="hidden">
          <div className="text-center border-b">
            <h3 className="font-bold" style={{ fontSize: '13px', margin: '0' }}>
              {branding?.store_name || branding?.name || 'LOOKPRICE TERMINAL'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>SİPARİŞ FİŞİ</p>
            <p style={{ margin: '2px 0 0 0' }}>Mağaza ID: {storeId} | Fiş No: #{lastSaleId}</p>
            <p style={{ margin: '2px 0 0 0' }}>{new Date().toLocaleString('tr-TR')}</p>
          </div>
          
          <div style={{ margin: '8px 0' }}>
            {lastCart.map((item, idx) => (
              <div key={idx} className="flex-between" style={{ fontSize: '11px', marginBottom: '2px' }}>
                <span>{item.quantity}x {item.name}</span>
                <span>{(parseFloat(item.price) * item.quantity).toFixed(2)} ₺</span>
              </div>
            ))}
          </div>
          
          <div className="font-bold" style={{ borderTop: '1px dashed black', paddingTop: '6px', fontSize: '11px' }}>
            <div className="flex-between">
              <span>TOPLAM:</span>
              <span>{totalAmount.toFixed(2)} ₺</span>
            </div>
            <div className="flex-between" style={{ fontWeight: 'normal', fontSize: '10px', marginTop: '4px' }}>
              <span>Ödeme Yöntemi:</span>
              <span>
                {paymentMethod === 'cash' ? 'NAKİT' : 
                 paymentMethod === 'credit_card' ? 'KREDİ KARTI' : 'ODA AKTARIMI'}
              </span>
            </div>
          </div>

          {lastFiscal && (
            <div style={{ marginTop: '12px', paddingTop: '6px', borderTop: '1px dashed black', fontSize: '9px', textAlign: 'center' }}>
              <p style={{ margin: '2px 0' }}>FİŞ NO: {lastFiscal.receiptNo}</p>
              <p style={{ margin: '2px 0' }}>Z NO: {lastFiscal.zNo}</p>
              <p style={{ margin: '2px 0' }}>CİHAZ: {lastFiscal.brand} - {lastFiscal.terminal}</p>
              <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>MALİ MÜHÜR</p>
            </div>
          )}
          
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '9px', borderTop: '1px dashed black', paddingTop: '6px' }}>
            <p style={{ margin: '0' }}>Bizi tercih ettiğiniz için teşekkürler!</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={onPrintReceipt}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <Printer className="h-5 w-5" />
            {lang === 'tr' ? 'Fiş Yazdır' : 'Print Receipt'}
          </button>
          <button 
            onClick={onContinue}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-[0.98] cursor-pointer"
          >
            {lang === 'tr' ? 'Devam Et' : 'Continue'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
