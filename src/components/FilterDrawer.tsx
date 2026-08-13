import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Filter, Tag, Key, Building2, Layers, MapPin, RotateCcw, Home, DollarSign, ShieldCheck, Check } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSector: 'emlak' | 'araclar';
  reFihristTab: string;
  setReFihristTab: (tab: string) => void;
  rePropertyType: string;
  setRePropertyType: (type: string) => void;
  reSubPropertyType: string;
  setReSubPropertyType: (type: string) => void;
  reRegion: string;
  setReRegion: (region: string) => void;
  reSubRegion?: string;
  setReSubRegion?: (sub: string) => void;
  reRooms?: string;
  setReRooms?: (rooms: string) => void;
  priceRange?: string;
  setPriceRange?: (pr: string) => void;
  minPrice?: string;
  setMinPrice?: (val: string) => void;
  maxPrice?: string;
  setMaxPrice?: (val: string) => void;
  reFurnished?: string;
  setReFurnished?: (f: string) => void;
  reKocanType?: string;
  setReKocanType?: (k: string) => void;
  activeTags: string[];
  setActiveTags: (tags: (prev: string[]) => string[]) => void;
  EMLAK_TIPI_SUB_TIPLERI?: Record<string, string[]>;
  REAL_ESTATE_REGIONS?: Record<string, string[]>;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ 
  isOpen, onClose, activeSector,
  reFihristTab, setReFihristTab,
  rePropertyType, setRePropertyType,
  reSubPropertyType, setReSubPropertyType,
  reRegion, setReRegion,
  reSubRegion = "all", setReSubRegion,
  reRooms = "all", setReRooms,
  priceRange = "all", setPriceRange,
  minPrice = "", setMinPrice,
  maxPrice = "", setMaxPrice,
  reFurnished = "all", setReFurnished,
  reKocanType = "all", setReKocanType,
  activeTags, setActiveTags,
  EMLAK_TIPI_SUB_TIPLERI = {},
  REAL_ESTATE_REGIONS = {}
}) => {
  const resetFilters = () => {
    setReFihristTab("all");
    setRePropertyType("all");
    setReSubPropertyType("all");
    setReRegion("all");
    if (setReSubRegion) setReSubRegion("all");
    if (setReRooms) setReRooms("all");
    if (setPriceRange) setPriceRange("all");
    if (setMinPrice) setMinPrice("");
    if (setMaxPrice) setMaxPrice("");
    if (setReFurnished) setReFurnished("all");
    if (setReKocanType) setReKocanType("all");
    setActiveTags(() => []);
  };

  const getButtonClass = (isActive: boolean) => 
    `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
      isActive
        ? "bg-blue-600 text-white border-blue-400 shadow-lg ring-2 ring-blue-500/30"
        : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
    }`;

  const availableSubTypes = rePropertyType !== "all" && EMLAK_TIPI_SUB_TIPLERI[rePropertyType]
    ? EMLAK_TIPI_SUB_TIPLERI[rePropertyType]
    : Object.values(EMLAK_TIPI_SUB_TIPLERI).flat();

  const availableSubRegions = reRegion !== "all" && REAL_ESTATE_REGIONS[reRegion]
    ? REAL_ESTATE_REGIONS[reRegion]
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-slate-950 z-50 shadow-2xl border-l border-slate-800 overflow-y-auto"
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur-md z-10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-400" /> Emlak Portföy Filtreleri
              </h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-5 space-y-6">
              {activeSector === 'emlak' && (
                <>
                  {/* 1. İLAN NİYETİ */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-400" /> 1. İlan Niyeti (Satılık / Kiralık)
                    </span>
                    <div className="flex items-center gap-2">
                      {[
                        { id: "all", label: "TÜMÜ" },
                        { id: "satilik", label: "🏷️ SATILIK" },
                        { id: "kiralik", label: "🔑 KİRALIK" }
                      ].map((tab) => (
                        <button key={tab.id} onClick={() => setReFihristTab(tab.id)} className={getButtonClass(reFihristTab === tab.id)}>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 2. MÜLK TİPİ */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" /> 2. Mülk Tipi
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: "TÜM TİPLER" },
                        { id: "residence", label: "🏢 KONUT" },
                        { id: "commercial", label: "🏪 TİCARİ" },
                        { id: "land", label: "🏞️ ARSA" }
                      ].map((pt) => (
                        <button key={pt.id} onClick={() => { setRePropertyType(pt.id); setReSubPropertyType("all"); }} className={getButtonClass(rePropertyType === pt.id)}>
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. ALT TİP */}
                  {availableSubTypes.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" /> 3. Mülk Alt Tipi
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-900/50 rounded-xl border border-slate-800">
                        <button onClick={() => setReSubPropertyType("all")} className={getButtonClass(reSubPropertyType === "all")}>
                          Tüm Alt Tipler
                        </button>
                        {availableSubTypes.map((st) => (
                          <button key={st} onClick={() => setReSubPropertyType(st)} className={getButtonClass(reSubPropertyType === st)}>
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. ŞEHİR & BÖLGE */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" /> 4. Şehir
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {["all", "girne", "lefkoşa", "gazimağusa", "iskele", "lefke", "güzelyurt"].map((reg) => (
                        <button key={reg} onClick={() => { setReRegion(reg); if (setReSubRegion) setReSubRegion("all"); }} className={getButtonClass(reRegion === reg)}>
                          {reg === "all" ? "TÜM ŞEHİRLER" : reg.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. SEMT / MAHALLE */}
                  {availableSubRegions.length > 0 && setReSubRegion && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        📍 5. Semt / Mahalle ({reRegion.toUpperCase()})
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-900/50 rounded-xl border border-slate-800">
                        <button onClick={() => setReSubRegion("all")} className={getButtonClass(reSubRegion === "all")}>
                          Tüm Mahalleler
                        </button>
                        {availableSubRegions.map((sub) => (
                          <button key={sub} onClick={() => setReSubRegion(sub)} className={getButtonClass(reSubRegion === sub)}>
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. ODA SAYISI */}
                  {setReRooms && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-cyan-400" /> 6. Oda Sayısı
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {["all", "1+0", "1+1", "2+1", "3+1", "4+1", "5+", "Penthouse"].map((rm) => (
                          <button key={rm} onClick={() => setReRooms(rm)} className={getButtonClass(reRooms === rm)}>
                            {rm === "all" ? "TÜM ODALAR" : rm}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 7. FİYAT ARALIĞI */}
                  {setPriceRange && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> 7. Fiyat Aralığı
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { id: "all", label: "TÜM FİYATLAR" },
                          { id: "0-150000", label: "£150.000 Altı" },
                          { id: "150000-300000", label: "£150k - £300k" },
                          { id: "300000-500000", label: "£300k - £500k" },
                          { id: "500000+", label: "£500.000 Üstü Lüks" }
                        ].map((pr) => (
                          <button key={pr.id} onClick={() => setPriceRange(pr.id)} className={getButtonClass(priceRange === pr.id)}>
                            {pr.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 8. EŞYA DURUMU */}
                  {setReFurnished && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        🛋️ 8. Eşya Durumu
                      </span>
                      <div className="flex items-center gap-2">
                        {[
                          { id: "all", label: "HEPSİ" },
                          { id: "yes", label: "EŞYALI" },
                          { id: "no", label: "BOŞ / EŞYASIZ" }
                        ].map((f) => (
                          <button key={f.id} onClick={() => setReFurnished(f.id)} className={getButtonClass(reFurnished === f.id)}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 9. KOÇAN / TAPU TÜRÜ (Sadece Satılık Portföyler İçin) */}
                  {setReKocanType && reFihristTab !== "kiralik" && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> 9. Tapu / Koçan Türü
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { id: "all", label: "TÜM KOÇANLAR" },
                          { id: "Türk Koçanlı", label: "Türk Koçanlı" },
                          { id: "Eşdeğer Koçan", label: "Eşdeğer Koçan" },
                          { id: "Tahsis Koçan", label: "Tahsis Koçan" }
                        ].map((k) => (
                          <button key={k.id} onClick={() => setReKocanType(k.id)} className={getButtonClass(reKocanType === k.id)}>
                            {k.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 10. ÖZELLİK ETİKETLERİ */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      ✨ 10. Hızlı Öne Çıkan Etiketler
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "öğrenci", "eşyalı", "kampüs", "hemen", "deniz", "kredi", "koçan", "havuz", "manzara", "sıfır"
                      ].map((tag) => {
                        const isSel = activeTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => {
                              setActiveTags((prev) => 
                                isSel ? prev.filter((t) => t !== tag) : [...prev, tag]
                              );
                            }}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              isSel 
                                ? "bg-amber-500 text-slate-950 border-amber-300 font-black shadow-sm" 
                                : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <button 
                  onClick={resetFilters}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Sıfırla
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Sonuçları Gör
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
