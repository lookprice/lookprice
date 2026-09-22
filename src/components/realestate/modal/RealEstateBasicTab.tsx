import React from "react";
import { DollarSign } from "lucide-react";
import { REAL_ESTATE_REGIONS, EMLAK_TIPI_SUB_TIPLERI } from "../../../data/realEstateConfig";
import { RealEstateProperty } from "../../../types";

interface RealEstateBasicTabProps {
  formData: Partial<RealEstateProperty>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<RealEstateProperty>>>;
  formatPriceDisplay: (val: number | string | undefined | null) => string;
  parsePriceInput: (val: string) => number;
  setValidationError: (val: string | null) => void;
}

export const RealEstateBasicTab: React.FC<RealEstateBasicTabProps> = ({
  formData,
  setFormData,
  formatPriceDisplay,
  parsePriceInput,
  setValidationError
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <span className="text-[11px] font-black uppercase text-indigo-950 flex items-center gap-1.5 tracking-wide">
          <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
          1. Temel İlan Detayları & Fiyatlandırma
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase">
          {formData.listing_intent === "sale" ? "Satılık İlan" : "Kiralık İlan"} • {formData.country}
        </span>
      </div>

      {/* Reference & Title */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="w-full sm:w-36 shrink-0">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
            Portföy Ref No *
          </label>
          <input
            type="text"
            required
            placeholder="TR-1002"
            className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-black text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
            value={formData.reference_no || ""}
            onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
            İlan Başlığı *
          </label>
          <input
            type="text"
            placeholder="Örn: Girne Alsancak Dağ ve Deniz Manzaralı 2+1 Lüks Daire"
            className="w-full px-2.5 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
      </div>

      {/* Price, Currency, Type, Subtype, Status in one neat high-density row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2 items-end">
        {/* Price & Currency (Integrated Group with binlik ayraç) */}
        <div className="md:col-span-4">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
            Fiyat ({formData.currency}) *
          </label>
          <div className="flex gap-1 items-center">
            <input
              type="text"
              inputMode="numeric"
              placeholder="850.000"
              className="flex-1 min-w-[100px] px-2 py-1 h-8 bg-white border border-slate-300 focus:border-indigo-600 rounded-lg text-xs font-black text-slate-900 shadow-2xs outline-none"
              value={formatPriceDisplay(formData.price)}
              onChange={(e) =>
                setFormData({ ...formData, price: parsePriceInput(e.target.value) })
              }
            />
            <select
              className="w-22 px-1.5 py-1 h-8 border border-slate-300 rounded-lg text-xs font-black bg-slate-100 text-slate-800 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              <option value="GBP">GBP (£)</option>
              <option value="TRY">TRY (₺)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>

        {/* Emlak Tipi */}
        <div className="md:col-span-3">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
            Emlak Tipi
          </label>
          <select
            className="w-full px-2 py-1 h-8 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as any, subtype: "" })
            }
          >
            <option value="residence">🏠 Konut</option>
            <option value="commercial">🏬 Ticari</option>
            <option value="land">🌾 Arsa & Arazi</option>
          </select>
        </div>

        {/* Alt Tip */}
        <div className="md:col-span-3">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
            Alt Tip
          </label>
          <select
            className="w-full px-2 py-1 h-8 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
            value={formData.subtype || ""}
            onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
          >
            <option value="">Alt tip seçiniz</option>
            {EMLAK_TIPI_SUB_TIPLERI[
              formData.type === "residence"
                ? "Konut"
                : formData.type === "commercial"
                ? "Ticari"
                : "Arsa"
            ]?.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* İlan Durumu */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
            İlan Durumu
          </label>
          <select
            className="w-full px-1.5 py-1 h-8 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          >
            {formData.listing_intent === "sale" ? (
              <>
                <option value="active">🟢 Satışta</option>
                <option value="optioned">🟡 Opsiyonlu</option>
                <option value="sold">🔴 Satıldı</option>
              </>
            ) : (
              <>
                <option value="active">🟢 Kiralık</option>
                <option value="optioned">🟡 Opsiyonlu</option>
                <option value="rented">🔴 Kiralandı</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* KKTC / TR Bölge ve Koçan Seçimi (Sleek minimalist bar) */}
      <div className="border border-indigo-100 rounded-lg p-2 bg-indigo-50/30">
        {formData.country === "KKTC" ? (
          <div
            className={`grid grid-cols-1 ${
              formData.listing_intent === "rent" ? "sm:grid-cols-2" : "sm:grid-cols-3"
            } gap-2`}
          >
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                KKTC Bölgesi
              </label>
              <select
                className="w-full px-2 py-1 h-7.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                value={formData.kktc_region}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kktc_region: e.target.value as any,
                    kktc_sub_region: ""
                  })
                }
              >
                {Object.keys(REAL_ESTATE_REGIONS).map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Alt Bölge
              </label>
              <select
                className="w-full px-2 py-1 h-7.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                value={formData.kktc_sub_region}
                onChange={(e) =>
                  setFormData({ ...formData, kktc_sub_region: e.target.value })
                }
              >
                <option value="">Alt bölge seçiniz</option>
                {REAL_ESTATE_REGIONS[
                  formData.kktc_region as keyof typeof REAL_ESTATE_REGIONS
                ]?.map((subRegion) => (
                  <option key={subRegion} value={subRegion}>
                    {subRegion}
                  </option>
                ))}
              </select>
            </div>
            {formData.listing_intent !== "rent" && (
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Koçan Tipi
                </label>
                <select
                  className="w-full px-2 py-1 h-7.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  value={formData.kktc_title_type}
                  onChange={(e) =>
                    setFormData({ ...formData, kktc_title_type: e.target.value as any })
                  }
                >
                  <option value="Türk Koçanı">Türk Koçanı</option>
                  <option value="Eşdeğer Koçan">Eşdeğer Koçan</option>
                  <option value="Tahsis Koçan">Tahsis Koçan</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-600 font-medium">
            Türkiye pazarı standart gayrimenkul bölge yönetimi devrede.
          </p>
        )}
      </div>

      {/* Kiralık Özel Alanları (Depozito & Periyot) */}
      {formData.listing_intent === "rent" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-amber-50/50 p-2 rounded-lg border border-amber-200/60">
          <div>
            <label className="block text-[10px] font-black text-rose-700 mb-0.5">
              Depozito Tutarı (Zorunlu) *
            </label>
            <input
              type="number"
              min="1"
              placeholder="2000"
              className="w-full px-2 py-1 h-7.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
              value={formData.deposit || ""}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Number(e.target.value);
                setFormData({ ...formData, deposit: val });
                if (val > 0) setValidationError(null);
              }}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
              Ödeme Periyodu
            </label>
            <select
              className="w-full px-2 py-1 h-7.5 border border-amber-300 rounded-lg text-xs font-bold bg-white"
              value={formData.billing_period || "monthly"}
              onChange={(e) =>
                setFormData({ ...formData, billing_period: e.target.value as any })
              }
            >
              <option value="monthly">Aylık</option>
              <option value="3-monthly">3 Aylık</option>
              <option value="6-monthly">6 Aylık</option>
              <option value="yearly">Yıllık</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
