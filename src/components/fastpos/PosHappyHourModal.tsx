import React from 'react';
import { motion } from 'framer-motion';
import { Flame, X } from 'lucide-react';

interface HappyHourConfig {
  isEnabled: boolean;
  startHour: number;
  endHour: number;
}

interface PosHappyHourModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  isHappyHourActive: boolean;
  happyHourConfig: HappyHourConfig;
  setHappyHourConfig: React.Dispatch<React.SetStateAction<HappyHourConfig>>;
  forceHappyHour: boolean | null;
  setForceHappyHour: (val: boolean | null) => void;
  allProducts: any[];
}

export const PosHappyHourModal: React.FC<PosHappyHourModalProps> = ({
  isOpen,
  onClose,
  lang,
  isHappyHourActive,
  happyHourConfig,
  setHappyHourConfig,
  forceHappyHour,
  setForceHappyHour,
  allProducts,
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
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100">
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">
                {lang === 'tr' ? 'Happy Hour (Mutlu Saatler) Kampanyası' : 'Happy Hour Campaign'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {lang === 'tr' ? 'Düşük talep saatlerini canlandırmak için özel fiyatlar' : 'Special prices to boost low-demand hours'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 overflow-y-auto pr-1 flex-1 min-h-0 text-slate-600">
          
          {/* Active Indicator status banner */}
          <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
            isHappyHourActive
              ? 'bg-rose-50 border-rose-100 text-rose-900'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isHappyHourActive ? 'bg-rose-500 animate-ping' : 'bg-slate-300'}`} />
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  {lang === 'tr' ? 'KAMPANYA DURUMU' : 'CAMPAIGN STATUS'}
                </span>
                <span className="text-sm font-bold">
                  {isHappyHourActive
                    ? (lang === 'tr' ? 'Şu An Happy Hour Fiyatları Aktif!' : 'Happy Hour Prices Are Active Right Now!')
                    : (lang === 'tr' ? 'Kampanya Şu Anda Aktif Değil' : 'Campaign is Currently Inactive')}
                </span>
              </div>
            </div>
            
            {/* Countdown helper */}
            {isHappyHourActive && !forceHappyHour && (
              <span className="text-xs bg-rose-600 text-white font-extrabold px-2.5 py-1 rounded-full">
                {lang === 'tr' ? `Saat ${happyHourConfig.endHour}:00'a kadar` : `Until ${happyHourConfig.endHour}:00`}
              </span>
            )}
          </div>

          {/* Configuration Controls */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              {lang === 'tr' ? 'Kampanya Zamanlama Ayarları' : 'Campaign Schedule Settings'}
            </h4>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
              <span className="text-xs font-bold text-slate-700">{lang === 'tr' ? 'Zamanlama Etkinleştir' : 'Enable Schedule'}</span>
              <button
                onClick={() => setHappyHourConfig(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
                className={`w-11 h-6 rounded-full transition-all relative ${happyHourConfig.isEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-all ${happyHourConfig.isEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {happyHourConfig.isEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    {lang === 'tr' ? 'Başlangıç Saati' : 'Start Hour'}
                  </label>
                  <select
                    value={happyHourConfig.startHour}
                    onChange={(e) => setHappyHourConfig(prev => ({ ...prev, startHour: parseInt(e.target.value) }))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>{i < 10 ? `0${i}` : i}:00</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    {lang === 'tr' ? 'Bitiş Saati' : 'End Hour'}
                  </label>
                  <select
                    value={happyHourConfig.endHour}
                    onChange={(e) => setHappyHourConfig(prev => ({ ...prev, endHour: parseInt(e.target.value) }))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>{i < 10 ? `0${i}` : i}:00</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Manual Override controls */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
              {lang === 'tr' ? 'Manuel Müdahale / Ezme Modu' : 'Manual Override / Force Mode'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setForceHappyHour(null)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${forceHappyHour === null ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                🕒 {lang === 'tr' ? 'Zamanlamaya Bırak' : 'Use Schedule'}
              </button>
              <button
                onClick={() => setForceHappyHour(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${forceHappyHour === true ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                🔥 {lang === 'tr' ? 'Her Zaman Aktif Et' : 'Force Always On'}
              </button>
              <button
                onClick={() => setForceHappyHour(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${forceHappyHour === false ? 'bg-slate-700 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                ❌ {lang === 'tr' ? 'Tamamen Devre Dışı' : 'Force Always Off'}
              </button>
            </div>
          </div>

          {/* Affected Products Quick list */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
              {lang === 'tr' ? 'Happy Hour Fiyatı Tanımlı Ürünler (Alternatif Fiyat 2)' : 'Happy Hour Priced Products (Alternative Price 2)'}
            </span>

            <div className="border border-slate-150 rounded-2xl overflow-hidden max-h-[160px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase border-b border-slate-150">
                    <th className="p-2.5">{lang === 'tr' ? 'Ürün Adı' : 'Product'}</th>
                    <th className="p-2.5 text-right">{lang === 'tr' ? 'Normal Fiyat' : 'Regular'}</th>
                    <th className="p-2.5 text-right text-rose-600">{lang === 'tr' ? 'Happy Hour' : 'Promo'}</th>
                    <th className="p-2.5 text-right">{lang === 'tr' ? 'İndirim' : 'Discount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {allProducts.filter(p => p.price_2 && parseFloat(p.price_2.toString()) > 0).length > 0 ? (
                    allProducts
                      .filter(p => p.price_2 && parseFloat(p.price_2.toString()) > 0)
                      .map((p) => {
                        const disc = (((parseFloat(p.price) - parseFloat(p.price_2)) / parseFloat(p.price)) * 100).toFixed(0);
                        return (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 font-semibold text-slate-700">
                            <td className="p-2.5 truncate max-w-[150px]">{p.name}</td>
                            <td className="p-2.5 text-right line-through text-slate-400">{p.price} {p.currency}</td>
                            <td className="p-2.5 text-right text-rose-600 font-bold">{p.price_2} {p.currency}</td>
                            <td className="p-2.5 text-right text-emerald-600 font-extrabold">%{disc}</td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 font-medium">
                        {lang === 'tr' ? 'Fiyat 2 (Alternatif Fiyat) girilmiş ürün bulunmamaktadır.' : 'No products have alternative price 2 configured.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all active:scale-[0.98]"
          >
            {lang === 'tr' ? 'Kaydet ve Kapat' : 'Save & Close'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
