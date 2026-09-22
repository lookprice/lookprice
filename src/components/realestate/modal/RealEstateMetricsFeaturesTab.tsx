import React from "react";
import { Layers } from "lucide-react";
import { RealEstateProperty } from "../../../types";

interface RealEstateMetricsFeaturesTabProps {
  formData: Partial<RealEstateProperty>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<RealEstateProperty>>>;
  formatPriceDisplay: (val: number | string | undefined | null) => string;
  parsePriceInput: (val: string) => number;
}

export const RealEstateMetricsFeaturesTab: React.FC<RealEstateMetricsFeaturesTabProps> = ({
  formData,
  setFormData,
  formatPriceDisplay,
  parsePriceInput
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <span className="text-[11px] font-black uppercase text-sky-950 flex items-center gap-1.5 tracking-wide">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          3. Teknik Metrikler, Alanlar & Donanım Özellikleri
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase">
          {formData.type === "land"
            ? "Arsa & İmar"
            : formData.type === "commercial"
            ? "Ticari & Kapasite"
            : "Konut & Donanım"}
        </span>
      </div>

      {/* LAND (ARSA) FIELDS */}
      {formData.type === "land" ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Arsa Alanı (m²)
              </label>
              <input
                type="number"
                placeholder="500"
                className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={formData.square_meters || ""}
                onChange={(e) =>
                  setFormData({ ...formData, square_meters: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                İmar Durumu
              </label>
              <select
                className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={(formData as any).imar_durumu || ""}
                onChange={(e) =>
                  setFormData({ ...formData, imar_durumu: e.target.value } as any)
                }
              >
                <option value="">Seçiniz</option>
                <option value="Konut İmarlı">Konut İmarlı</option>
                <option value="Ticari İmarlı">Ticari İmarlı</option>
                <option value="Konut + Ticari">Konut + Ticari</option>
                <option value="Tarla / Tarım">Tarla / Tarım</option>
                <option value="Zeytinlik">Zeytinlik</option>
                <option value="Sanayi İmarlı">Sanayi İmarlı</option>
                <option value="Turizm İmarlı">Turizm İmarlı</option>
                <option value="İmarsız / Ham Arsa">İmarsız / Ham Arsa</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Emsal / Kaks
              </label>
              <input
                type="text"
                placeholder="0.35 / 0.70"
                className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={(formData as any).kaks || ""}
                onChange={(e) =>
                  setFormData({ ...formData, kaks: e.target.value } as any)
                }
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Gabari / Kat Sınırı
              </label>
              <input
                type="text"
                placeholder="2 Kat (6.5m)"
                className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={(formData as any).gabari || ""}
                onChange={(e) =>
                  setFormData({ ...formData, gabari: e.target.value } as any)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!(formData as any).elektrik_var}
                onChange={(e) =>
                  setFormData({ ...formData, elektrik_var: e.target.checked } as any)
                }
                className="w-3.5 h-3.5 text-sky-600 rounded"
              />
              <span>⚡ Elektrik Altyapısı</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!(formData as any).su_var}
                onChange={(e) =>
                  setFormData({ ...formData, su_var: e.target.checked } as any)
                }
                className="w-3.5 h-3.5 text-sky-600 rounded"
              />
              <span>💧 Su Altyapısı</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!(formData as any).yol_var}
                onChange={(e) =>
                  setFormData({ ...formData, yol_var: e.target.checked } as any)
                }
                className="w-3.5 h-3.5 text-sky-600 rounded"
              />
              <span>🛣️ Kadastro Yolu</span>
            </label>
          </div>
        </div>
      ) : formData.type === "commercial" ? (
        /* COMMERCIAL (TİCARİ) FIELDS */
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Devir Durumu
              </label>
              <select
                className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={formData.commercial_devir_status || "empty"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commercial_devir_status: e.target.value as any
                  })
                }
              >
                <option value="empty">🔑 Boş / Hazır</option>
                <option value="devren">🔄 Devren Satılık</option>
                <option value="tenant">📈 Hazır Kiracılı</option>
              </select>
            </div>

            {formData.commercial_devir_status === "tenant" ? (
              <div>
                <label className="block text-[10px] font-bold text-emerald-800 mb-0.5">
                  Aylık Kira Geliri
                </label>
                <input
                  type="text"
                  placeholder="2.500"
                  className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-emerald-300 rounded-lg text-xs font-bold"
                  value={formatPriceDisplay(formData.monthly_rent_income)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_rent_income: parsePriceInput(e.target.value)
                    })
                  }
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Cephe / Vitrin (m)
                </label>
                <input
                  type="number"
                  placeholder="12"
                  className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  value={formData.frontage_width || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, frontage_width: Number(e.target.value) })
                  }
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Tavan Yüksekliği (m)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="4.5"
                className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={formData.ceiling_height || ""}
                onChange={(e) =>
                  setFormData({ ...formData, ceiling_height: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Net / Brüt Alan (m²)
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Net"
                  className="w-1/2 px-1.5 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  value={formData.square_meters || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, square_meters: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  placeholder="Brüt"
                  className="w-1/2 px-1.5 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  value={formData.sqm_gross || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, sqm_gross: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          {/* Commercial Facility Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.is_main_road_frontage}
                onChange={(e) =>
                  setFormData({ ...formData, is_main_road_frontage: e.target.checked })
                }
                className="w-3.5 h-3.5 text-indigo-600 rounded"
              />
              <span>🛣️ Cadde Üzeri</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.has_chimney}
                onChange={(e) =>
                  setFormData({ ...formData, has_chimney: e.target.checked })
                }
                className="w-3.5 h-3.5 text-indigo-600 rounded"
              />
              <span>🌬️ Sanayi Bacası</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.has_industrial_electricity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    has_industrial_electricity: e.target.checked
                  })
                }
                className="w-3.5 h-3.5 text-indigo-600 rounded"
              />
              <span>⚡ Sanayi Elektriği</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.has_parking}
                onChange={(e) =>
                  setFormData({ ...formData, has_parking: e.target.checked })
                }
                className="w-3.5 h-3.5 text-indigo-600 rounded"
              />
              <span>🅿️ Otopark</span>
            </label>
          </div>
        </div>
      ) : (
        /* RESIDENCE (KONUT) FIELDS */
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Net Alan (m²)
              </label>
              <input
                type="number"
                placeholder="120"
                className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={formData.square_meters || ""}
                onChange={(e) =>
                  setFormData({ ...formData, square_meters: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Brüt Alan (m²)
              </label>
              <input
                type="number"
                placeholder="140"
                className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={formData.sqm_gross || ""}
                onChange={(e) =>
                  setFormData({ ...formData, sqm_gross: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Oda Sayısı
              </label>
              <input
                type="text"
                placeholder="2+1, 3+1"
                className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={formData.room_count || ""}
                onChange={(e) =>
                  setFormData({ ...formData, room_count: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Bina Yaşı
              </label>
              <input
                type="text"
                placeholder="0 (Sıfır)"
                className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={formData.building_age || ""}
                onChange={(e) =>
                  setFormData({ ...formData, building_age: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Kat / Kat Sayısı
              </label>
              <input
                type="text"
                placeholder="3. Kat"
                className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={formData.floor || ""}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Isıtma
              </label>
              <select
                className="w-full px-1.5 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                value={formData.heating || ""}
                onChange={(e) => setFormData({ ...formData, heating: e.target.value })}
              >
                <option value="">Seçiniz</option>
                <option value="Klima">Klima (KKTC)</option>
                <option value="Yerden Isıtma">Yerden Isıtma</option>
                <option value="Kombi">Kombi</option>
                <option value="Merkezi Sistem">Merkezi</option>
                <option value="Yok">Yok</option>
              </select>
            </div>
          </div>

          {/* Residence Toggles (Trafo, KDV, Çatı Terası, Site İçi) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.trafo_bedeli}
                onChange={(e) =>
                  setFormData({ ...formData, trafo_bedeli: e.target.checked })
                }
                className="w-3.5 h-3.5 text-indigo-600 rounded"
              />
              <span>⚡ Trafo Bedeli Ödendi</span>
            </label>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">KDV:</span>
              <select
                className="px-1.5 py-0.5 border border-slate-200 rounded text-xs font-bold bg-white"
                value={formData.kdv_status}
                onChange={(e) =>
                  setFormData({ ...formData, kdv_status: e.target.value as any })
                }
              >
                <option value="to_be_paid">Ödenecek</option>
                <option value="paid">Ödendi</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.cati_terasi}
                onChange={(e) =>
                  setFormData({ ...formData, cati_terasi: e.target.checked })
                }
                className="w-3.5 h-3.5 text-indigo-600 rounded"
              />
              <span>🌅 Çatı Terası</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.in_gated_community}
                onChange={(e) =>
                  setFormData({ ...formData, in_gated_community: e.target.checked })
                }
                className="w-3.5 h-3.5 text-indigo-600 rounded"
              />
              <span>🏡 Site İçi</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
