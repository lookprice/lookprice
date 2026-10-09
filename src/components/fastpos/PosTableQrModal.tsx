import React from "react";
import { motion } from "motion/react";
import { Coffee, X, Printer, Minus, Plus, RefreshCw, CheckCircle2 } from "lucide-react";

export interface PosTableQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  storeId?: string;
  branding?: any;
  allTables: any[];
  qrModalTab: 'single' | 'all' | 'manage';
  setQrModalTab: (tab: 'single' | 'all' | 'manage') => void;
  singleQrTable: string;
  setSingleQrTable: (table: string) => void;
  newTableCount: number;
  setNewTableCount: React.Dispatch<React.SetStateAction<number>>;
  savingTableCount: boolean;
  onSaveTableCount: () => void;
  onPrintSingleQr: (tableNum: string) => void;
  onPrintAllQrs: () => void;
}

export const PosTableQrModal: React.FC<PosTableQrModalProps> = ({
  isOpen,
  onClose,
  lang,
  storeId,
  branding,
  allTables,
  qrModalTab,
  setQrModalTab,
  singleQrTable,
  setSingleQrTable,
  newTableCount,
  setNewTableCount,
  savingTableCount,
  onSaveTableCount,
  onPrintSingleQr,
  onPrintAllQrs
}) => {
  if (!isOpen) return null;

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
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">
                {lang === 'tr' ? 'Masalar & Dijital Menü QR Kodları' : 'Tables & Digital Menu QR Codes'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">{branding?.store_name || branding?.name || 'LOOKPRICE'}</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/30 p-2 gap-2">
          <button
            type="button"
            onClick={() => setQrModalTab('single')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              qrModalTab === 'single'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {lang === 'tr' ? 'Tek Masa QR' : 'Single Table QR'}
          </button>
          <button
            type="button"
            onClick={() => setQrModalTab('all')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              qrModalTab === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {lang === 'tr' ? 'Tüm Masalar Kataloğu' : 'All Tables Catalogue'}
          </button>
          <button
            type="button"
            onClick={() => setQrModalTab('manage')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              qrModalTab === 'manage'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {lang === 'tr' ? 'Masa Sayısı & Yönetimi' : 'Table Count & Management'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {qrModalTab === 'single' && (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-sm mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1 flex justify-between items-center">
                  <span>{lang === 'tr' ? 'Yazdırılacak Masayı Seçin' : 'Select Table to Print'}</span>
                  {allTables.length > 0 && (
                    <span className="text-[10px] text-rose-500 font-extrabold normal-case bg-rose-50 px-2 py-0.5 rounded-md">
                      {lang === 'tr' ? `${allTables.length} Masa` : `${allTables.length} Tables`}
                    </span>
                  )}
                </label>
                <select
                  value={singleQrTable}
                  onChange={(e) => setSingleQrTable(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer mb-3"
                >
                  {allTables.map((t) => (
                    <option key={t.id} value={t.table_number}>
                      {lang === 'tr' ? `Masa ${t.table_number}` : `Table ${t.table_number}`}
                    </option>
                  ))}
                  {allTables.length === 0 && (
                    <option value="">{lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}</option>
                  )}
                </select>

                {/* Visual interactive table selection grid */}
                {allTables.length > 0 && (
                  <div className="bg-slate-100/60 border border-slate-200/50 p-2 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold mb-1.5 px-1 uppercase tracking-wider">
                      {lang === 'tr' ? 'Hızlı Masa Seçimi:' : 'Quick Table Selection:'}
                    </p>
                    <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-100">
                      {allTables.map((t) => {
                        const cleanNum = t.table_number.replace(/Masa/gi, '').trim();
                        const isSelected = singleQrTable === t.table_number;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSingleQrTable(t.table_number)}
                            className={`py-2 px-1 rounded-lg text-xs font-black transition-all text-center cursor-pointer ${
                              isSelected
                                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/10'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                            }`}
                          >
                            {cleanNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div id="pos-qr-card-printable-content" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center max-w-xs w-full">
                {branding?.logo_url ? (
                  <img src={branding.logo_url} alt="" className="max-h-12 max-w-full mb-3 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mb-3 font-black text-base">
                    {branding?.store_name?.[0] || branding?.name?.[0] || 'M'}
                  </div>
                )}
                <h4 className="text-base font-black text-slate-800 uppercase tracking-tight mb-1 text-center truncate max-w-full">
                  {branding?.store_name || branding?.name || 'Seçkin Restoran'}
                </h4>
                <h3 className="text-xl font-black text-rose-600 mb-2">
                  {lang === 'tr' ? `MASA ${singleQrTable.replace(/Masa/gi, '').trim()}` : `TABLE ${singleQrTable.replace(/Masa/gi, '').trim()}`}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mb-4 text-center tracking-wide uppercase">
                  {lang === 'tr' ? 'DİJİTAL MENÜ' : 'DIGITAL MENU'}
                </p>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 flex items-center justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : '') + "/digital-menu/" + (storeId || '') + "/" + singleQrTable.replace(/Masa/gi, '').trim())}`} 
                    alt="Digital Menu QR" 
                    className="h-36 w-36 object-contain"
                  />
                </div>

                <p className="text-[11px] font-bold text-slate-500 leading-relaxed text-center">
                  {lang === 'tr' ? 'Sipariş vermek ve menüyü incelemek için cep telefonunuzla taratın.' : 'Scan with your phone to view menu and order.'}
                </p>
                
                <span className="text-[8px] text-slate-300 font-black mt-4 tracking-widest uppercase">
                  POWERED BY LOOKPRICE
                </span>
              </div>
            </div>
          )}

          {qrModalTab === 'all' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h4 className="text-sm font-bold text-slate-700">
                    {lang === 'tr' ? 'Tüm Masa QR Kartları' : 'All Table QR Cards'}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {lang === 'tr' ? `${allTables.length} masanın tamamına ait QR katalog çıktılarını alın.` : `Get QR catalogue printouts for all ${allTables.length} tables.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onPrintAllQrs}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm shadow-indigo-100 active:scale-95 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  {lang === 'tr' ? 'Hepsini Yazdır (A4)' : 'Print All (A4)'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-1">
                {allTables.map((table) => {
                  const cleanNum = table.table_number.replace(/Masa/gi, '').trim();
                  return (
                    <div 
                      key={table.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-rose-200 transition-all flex flex-col items-center text-center relative group"
                    >
                      <h5 className="font-extrabold text-xs text-slate-400 tracking-wider mb-1 uppercase">
                        {lang === 'tr' ? `MASA ${cleanNum}` : `TABLE ${cleanNum}`}
                      </h5>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 mb-3 flex items-center justify-center">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : '') + "/digital-menu/" + (storeId || '') + "/" + cleanNum)}`} 
                          alt="" 
                          className="h-20 w-20 object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onPrintSingleQr(cleanNum)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 w-full justify-center cursor-pointer"
                      >
                        <Printer className="h-3 w-3" />
                        {lang === 'tr' ? 'Yazdır' : 'Print'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {qrModalTab === 'manage' && (
            <div className="flex flex-col items-center py-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center">
                <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100 mx-auto mb-4">
                  <Coffee className="h-6 w-6" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-lg mb-2">
                  {lang === 'tr' ? 'Masa Sayısını Arttırın / Azaltın' : 'Increase / Decrease Table Count'}
                </h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                  {lang === 'tr' 
                    ? 'Masa sayısını güncellediğinizde sistem yeni masaları otomatik olarak ekler ve QR kodlarını anında oluşturur. Mevcut siparişi (doluluğu) olan masalar korunur.'
                    : 'When you update the table count, the system automatically adds new tables and creates QR codes instantly. Tables with active orders remain protected.'}
                </p>

                <div className="flex items-center justify-center gap-6 mb-8">
                  <button
                    type="button"
                    onClick={() => setNewTableCount(prev => Math.max(1, prev - 1))}
                    className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all font-black text-xl active:scale-95 cursor-pointer"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="text-4xl font-black text-slate-800 tracking-tight font-sans min-w-[80px]">
                    {newTableCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewTableCount(prev => Math.min(200, prev + 1))}
                    className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all font-black text-xl active:scale-95 cursor-pointer"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onSaveTableCount}
                  disabled={savingTableCount}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  {savingTableCount ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {lang === 'tr' ? 'Masalar Güncelleniyor...' : 'Updating Tables...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {lang === 'tr' ? 'Masa Sayısını Güncelle & Kaydet' : 'Update & Save Table Count'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
          {qrModalTab === 'single' && (
            <button 
              type="button"
              onClick={() => onPrintSingleQr(singleQrTable.replace(/Masa/gi, '').trim())}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              {lang === 'tr' ? 'Seçili Masayı Yazdır' : 'Print Selected Table'}
            </button>
          )}
          {qrModalTab === 'all' && (
            <button 
              type="button"
              onClick={onPrintAllQrs}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              {lang === 'tr' ? 'Tüm Kataloğu Yazdır (A4)' : 'Print All Catalogue (A4)'}
            </button>
          )}
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-[0.98] cursor-pointer"
          >
            {lang === 'tr' ? 'Kapat' : 'Close'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
