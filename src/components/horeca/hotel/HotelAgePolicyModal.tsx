import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

interface HotelAgePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  ageDiscountPolicy: any;
  saveAgePolicy: (newPolicy: any) => void;
}

export const HotelAgePolicyModal: React.FC<HotelAgePolicyModalProps> = ({
  isOpen,
  onClose,
  ageDiscountPolicy,
  saveAgePolicy,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Tesis Fiyat & Yaş İndirim Politikası
              </h3>
              <p className="text-xs text-slate-500">Konaklama ve restoran adisyonlarında otomatik yaş indirimi kuralları</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* TOGGLE: GENERAL AGE DISCOUNT POLICY ENABLED */}
          <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/50 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-indigo-950 dark:text-indigo-100 block">Tesis Geneli Yaş İndirimleri</span>
              <span className="text-[11px] text-slate-500 font-medium">Aktif edilirse yaş grubuna göre otomatik indirim uygulanır.</span>
            </div>
            <button
              type="button"
              onClick={() => saveAgePolicy({ ...ageDiscountPolicy, enabled: !ageDiscountPolicy.enabled })}
              className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                ageDiscountPolicy.enabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {ageDiscountPolicy.enabled ? '🟢 AKTİF' : '🔴 PASİF (İndirimsiz)'}
            </button>
          </div>

          {/* APPLICABILITY TOGGLES */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">Konaklamada İndirim</span>
              <button
                type="button"
                onClick={() => saveAgePolicy({ ...ageDiscountPolicy, apply_to_room: !ageDiscountPolicy.apply_to_room })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold w-full cursor-pointer ${
                  ageDiscountPolicy.apply_to_room ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {ageDiscountPolicy.apply_to_room ? '✅ Konaklamada Uygula' : '❌ Uygulama'}
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">Restoranda İndirim</span>
              <button
                type="button"
                onClick={() => saveAgePolicy({ ...ageDiscountPolicy, apply_to_restaurant: !ageDiscountPolicy.apply_to_restaurant })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold w-full cursor-pointer ${
                  ageDiscountPolicy.apply_to_restaurant ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {ageDiscountPolicy.apply_to_restaurant ? '✅ Restoranda Uygula' : '❌ Uygulama'}
              </button>
            </div>
          </div>

          {/* AGE BRACKET RATES */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Yaş Grubu İndirim Oranları (%)</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase block">0 - 2 Yaş Bebek İndirimi (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ageDiscountPolicy.infant_0_2_rate}
                  onChange={(e) => saveAgePolicy({ ...ageDiscountPolicy, infant_0_2_rate: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase block">3 - 6 Yaş Çocuk İndirimi (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ageDiscountPolicy.toddler_3_6_rate}
                  onChange={(e) => saveAgePolicy({ ...ageDiscountPolicy, toddler_3_6_rate: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase block">7 - 12 Yaş Çocuk İndirimi (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ageDiscountPolicy.child_7_12_rate}
                  onChange={(e) => saveAgePolicy({ ...ageDiscountPolicy, child_7_12_rate: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase block">65+ Yaş Kıdemli İndirimi (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ageDiscountPolicy.senior_65_plus_rate}
                  onChange={(e) => saveAgePolicy({ ...ageDiscountPolicy, senior_65_plus_rate: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => saveAgePolicy({
                enabled: false,
                apply_to_room: false,
                apply_to_restaurant: false,
                infant_0_2_rate: 0,
                toddler_3_6_rate: 0,
                child_7_12_rate: 0,
                senior_65_plus_rate: 0
              })}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Tüm İndirimleri Sıfırla (İndirimsiz Yap)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
            >
              Ayarları Kaydet ve Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
