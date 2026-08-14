import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Filter, Tag, Key, Building2, Layers, MapPin, RotateCcw, Home, DollarSign, ShieldCheck, Check, Car, Gauge, Calendar, Fuel, Settings } from 'lucide-react';
import { normalizeVehicleCategory } from '../utils/formatUtils';
import { getAvailableSubTypes, getAvailableSubRegions, REAL_ESTATE_REGIONS as DEFAULT_REGIONS, EMLAK_TIPI_SUB_TIPLERI as DEFAULT_SUB_TIPLERI } from '../data/realEstateConfig';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSector: 'emlak' | 'araclar';
  reFihristTab: string;
  setReFihristTab: (tab: string) => void;
  rePropertyType: string;
  setRePropertyType: (type: string) => void;
  reSubPropertyType?: string;
  setReSubPropertyType?: (type: string) => void;
  reSubPropertyTypes?: string[];
  setReSubPropertyTypes?: React.Dispatch<React.SetStateAction<string[]>> | ((types: string[] | ((prev: string[]) => string[])) => void);
  reRegion: string;
  setReRegion: (region: string) => void;
  reSubRegion?: string;
  setReSubRegion?: (sub: string) => void;
  reSubRegions?: string[];
  setReSubRegions?: React.Dispatch<React.SetStateAction<string[]>> | ((subs: string[] | ((prev: string[]) => string[])) => void);
  reRooms?: string[] | string;
  setReRooms?: (rooms: any) => void;
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
  // Vehicle Filters
  activeVehicleCategory?: string;
  setActiveVehicleCategory?: (cat: string) => void;
  activeVehicleBrand?: string;
  setActiveVehicleBrand?: (brand: string) => void;
  activeVehicleModel?: string;
  setActiveVehicleModel?: (model: string) => void;
  activeVehicleTransmission?: string;
  setActiveVehicleTransmission?: (trans: string) => void;
  activeVehicleFuel?: string;
  setActiveVehicleFuel?: (fuel: string) => void;
  activeVehicleYear?: string;
  setActiveVehicleYear?: (year: string) => void;
  activeVehicleBodyType?: string;
  setActiveVehicleBodyType?: (body: string) => void;
  activeVehicleTradeIn?: string;
  setActiveVehicleTradeIn?: (trade: string) => void;
  vehicleBrands?: string[];
  vehicleModels?: string[];
  vehicleFuels?: string[];
  vehicleTransmissions?: string[];
  vehicleYears?: string[];
  vehicleBodyTypes?: string[];
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ 
  isOpen, onClose, activeSector,
  reFihristTab, setReFihristTab,
  rePropertyType, setRePropertyType,
  reSubPropertyType, setReSubPropertyType,
  reSubPropertyTypes = [], setReSubPropertyTypes,
  reRegion, setReRegion,
  reSubRegion, setReSubRegion,
  reSubRegions = [], setReSubRegions,
  reRooms = [], setReRooms,
  priceRange = "all", setPriceRange,
  minPrice = "", setMinPrice,
  maxPrice = "", setMaxPrice,
  reFurnished = "all", setReFurnished,
  reKocanType = "all", setReKocanType,
  activeTags, setActiveTags,
  EMLAK_TIPI_SUB_TIPLERI = DEFAULT_SUB_TIPLERI,
  REAL_ESTATE_REGIONS = DEFAULT_REGIONS,
  activeVehicleCategory = "all", setActiveVehicleCategory,
  activeVehicleBrand = "all", setActiveVehicleBrand,
  activeVehicleModel = "all", setActiveVehicleModel,
  activeVehicleTransmission = "all", setActiveVehicleTransmission,
  activeVehicleFuel = "all", setActiveVehicleFuel,
  activeVehicleYear = "all", setActiveVehicleYear,
  activeVehicleBodyType = "all", setActiveVehicleBodyType,
  activeVehicleTradeIn = "all", setActiveVehicleTradeIn,
  vehicleBrands = [],
  vehicleModels = [],
  vehicleFuels = [],
  vehicleTransmissions = [],
  vehicleYears = [],
  vehicleBodyTypes = []
}) => {
  // Normalize array states
  const selectedSubTypes: string[] = Array.isArray(reSubPropertyTypes) && reSubPropertyTypes.length > 0
    ? reSubPropertyTypes
    : (reSubPropertyType && reSubPropertyType !== "all" ? [reSubPropertyType] : []);

  const selectedSubRegions: string[] = Array.isArray(reSubRegions) && reSubRegions.length > 0
    ? reSubRegions
    : (reSubRegion && reSubRegion !== "all" ? [reSubRegion] : []);

  const selectedRooms: string[] = Array.isArray(reRooms)
    ? reRooms
    : (typeof reRooms === 'string' && reRooms !== "all" && reRooms !== "" ? [reRooms] : []);

  const toggleSubType = (sub: string) => {
    let next: string[];
    if (selectedSubTypes.includes(sub)) {
      next = selectedSubTypes.filter(s => s !== sub);
    } else {
      next = [...selectedSubTypes, sub];
    }
    if (setReSubPropertyTypes) {
      setReSubPropertyTypes(next);
    }
    if (setReSubPropertyType) {
      setReSubPropertyType(next.length > 0 ? next[0] : "all");
    }
  };

  const clearSubTypes = () => {
    if (setReSubPropertyTypes) setReSubPropertyTypes([]);
    if (setReSubPropertyType) setReSubPropertyType("all");
  };

  const toggleSubRegion = (sub: string) => {
    let next: string[];
    if (selectedSubRegions.includes(sub)) {
      next = selectedSubRegions.filter(s => s !== sub);
    } else {
      next = [...selectedSubRegions, sub];
    }
    if (setReSubRegions) {
      setReSubRegions(next);
    }
    if (setReSubRegion) {
      setReSubRegion(next.length > 0 ? next[0] : "all");
    }
  };

  const selectAllSubRegions = (available: string[]) => {
    if (setReSubRegions) setReSubRegions(available);
    if (setReSubRegion && available.length > 0) setReSubRegion(available[0]);
  };

  const clearSubRegions = () => {
    if (setReSubRegions) setReSubRegions([]);
    if (setReSubRegion) setReSubRegion("all");
  };

  const toggleRoom = (room: string) => {
    let next: string[];
    if (selectedRooms.includes(room)) {
      next = selectedRooms.filter(r => r !== room);
    } else {
      next = [...selectedRooms, room];
    }
    if (setReRooms) {
      setReRooms(next);
    }
  };

  const clearRooms = () => {
    if (setReRooms) {
      setReRooms([]);
    }
  };

  const resetFilters = () => {
    if (activeSector === 'emlak') {
      setReFihristTab("all");
      setRePropertyType("all");
      clearSubTypes();
      setReRegion("all");
      clearSubRegions();
      clearRooms();
      if (setPriceRange) setPriceRange("all");
      if (setMinPrice) setMinPrice("");
      if (setMaxPrice) setMaxPrice("");
      if (setReFurnished) setReFurnished("all");
      if (setReKocanType) setReKocanType("all");
      setActiveTags(() => []);
    } else {
      if (setActiveVehicleCategory) setActiveVehicleCategory("all");
      if (setActiveVehicleBrand) setActiveVehicleBrand("all");
      if (setActiveVehicleModel) setActiveVehicleModel("all");
      if (setActiveVehicleTransmission) setActiveVehicleTransmission("all");
      if (setActiveVehicleFuel) setActiveVehicleFuel("all");
      if (setActiveVehicleYear) setActiveVehicleYear("all");
      if (setActiveVehicleBodyType) setActiveVehicleBodyType("all");
      if (setActiveVehicleTradeIn) setActiveVehicleTradeIn("all");
    }
  };

  const getButtonClass = (isActive: boolean) => 
    `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
      isActive
        ? (activeSector === 'araclar' ? "bg-rose-600 text-white border-rose-400 shadow-lg ring-2 ring-rose-500/30" : "bg-blue-600 text-white border-blue-400 shadow-lg ring-2 ring-blue-500/30")
        : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
    }`;

  // Get available sub-types strictly matching selected property type
  const availableSubTypes = getAvailableSubTypes(rePropertyType);

  // Get available sub-regions for selected city
  const availableSubRegions = getAvailableSubRegions(reRegion);

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
                {activeSector === 'emlak' ? (
                  <>
                    <Filter className="w-5 h-5 text-blue-400" /> Emlak Portföy Filtreleri
                  </>
                ) : (
                  <>
                    <Car className="w-5 h-5 text-rose-400" /> Araç Detay Filtreleri
                  </>
                )}
              </h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-5 space-y-6">
              {activeSector === 'emlak' ? (
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
                        <button 
                          key={pt.id} 
                          onClick={() => { 
                            setRePropertyType(pt.id); 
                            clearSubTypes(); 
                          }} 
                          className={getButtonClass(rePropertyType === pt.id)}
                        >
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. ALT TİP (MULTI-SELECT) */}
                  {availableSubTypes.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-400" /> 3. Mülk Alt Tipi
                          {selectedSubTypes.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                              {selectedSubTypes.length} Seçili
                            </span>
                          )}
                        </span>
                        {selectedSubTypes.length > 0 && (
                          <button 
                            onClick={clearSubTypes}
                            className="text-[10px] font-bold text-slate-400 hover:text-rose-400 underline cursor-pointer"
                          >
                            Seçimi Temizle
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-900/50 rounded-xl border border-slate-800">
                        <button 
                          onClick={clearSubTypes} 
                          className={getButtonClass(selectedSubTypes.length === 0)}
                        >
                          Tüm Alt Tipler
                        </button>
                        {availableSubTypes.map((st) => {
                          const isSelected = selectedSubTypes.includes(st);
                          return (
                            <button 
                              key={st} 
                              onClick={() => toggleSubType(st)} 
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-600 text-white border-emerald-400 shadow-md"
                                  : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
                              }`}
                            >
                              <span className={`w-3 h-3 rounded flex items-center justify-center text-[9px] ${isSelected ? "bg-white text-emerald-700 font-black" : "border border-slate-600"}`}>
                                {isSelected ? "✓" : ""}
                              </span>
                              {st}
                            </button>
                          );
                        })}
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
                        <button 
                          key={reg} 
                          onClick={() => { 
                            setReRegion(reg); 
                            clearSubRegions(); 
                          }} 
                          className={getButtonClass(reRegion.toLowerCase() === reg.toLowerCase())}
                        >
                          {reg === "all" ? "TÜM ŞEHİRLER" : reg.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. ALT BÖLGE / MAHALLELER (COMPACT 2 SÜTUN ÇOKLU SEÇİM) */}
                  {availableSubRegions.length > 0 && (
                    <div className="space-y-2 p-3 bg-purple-950/20 border border-purple-900/40 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" /> 5. İlçe / Bölgeler ({reRegion.toUpperCase()})
                          {selectedSubRegions.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/80 text-purple-200 border border-purple-700">
                              {selectedSubRegions.length} Seçili
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => selectAllSubRegions(availableSubRegions)}
                            className="text-[10px] font-bold text-purple-400 hover:text-purple-200 cursor-pointer"
                          >
                            Tümünü Seç
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            onClick={clearSubRegions}
                            className="text-[10px] font-bold text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            Temizle
                          </button>
                        </div>
                      </div>
                      
                      {/* Tek Satırda 2 Bölge Kompakt Seç Kutuları */}
                      <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-slate-950/80 rounded-xl border border-slate-800">
                        {availableSubRegions.map((sub) => {
                          const isSelected = selectedSubRegions.includes(sub);
                          return (
                            <label
                              key={sub}
                              onClick={(e) => {
                                e.preventDefault();
                                toggleSubRegion(sub);
                              }}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all select-none ${
                                isSelected
                                  ? "bg-purple-950/80 border-purple-500 text-purple-200 font-bold shadow-sm"
                                  : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-3.5 h-3.5 rounded border-slate-700 text-purple-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer pointer-events-none"
                              />
                              <span className="truncate">{sub}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 6. ODA SAYISI (MULTI-SELECT) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-cyan-400" /> 6. Oda Sayısı
                        {selectedRooms.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                            {selectedRooms.length} Seçili
                          </span>
                        )}
                      </span>
                      {selectedRooms.length > 0 && (
                        <button 
                          onClick={clearRooms}
                          className="text-[10px] font-bold text-slate-400 hover:text-rose-400 underline cursor-pointer"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={clearRooms} 
                        className={getButtonClass(selectedRooms.length === 0)}
                      >
                        TÜMÜ
                      </button>
                      {["1+0", "1+1", "2+1", "3+1", "4+1", "5+", "Penthouse"].map((room) => {
                        const isSelected = selectedRooms.includes(room);
                        return (
                          <button 
                            key={room} 
                            onClick={() => toggleRoom(room)} 
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                              isSelected
                                ? "bg-cyan-600 text-white border-cyan-400 shadow-lg ring-2 ring-cyan-500/30"
                                : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <span className={`w-3 h-3 rounded flex items-center justify-center text-[9px] ${isSelected ? "bg-white text-cyan-700 font-black" : "border border-slate-600"}`}>
                              {isSelected ? "✓" : ""}
                            </span>
                            {room}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 7. EŞYA DURUMU */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      🛋️ 7. Eşya Durumu
                    </span>
                    <div className="flex items-center gap-2">
                      {[
                        { id: "all", label: "TÜMÜ" },
                        { id: "eşyalı", label: "🛋️ Eşyalı" },
                        { id: "eşyasız", label: "🏠 Eşyasız" }
                      ].map((f) => (
                        <button key={f.id} onClick={() => { if (setReFurnished) setReFurnished(f.id); }} className={getButtonClass(reFurnished === f.id)}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 8. KOÇAN TİPİ */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      📜 8. Tapu / Koçan Tipi
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: "TÜMÜ" },
                        { id: "türk", label: "🇹🇷 Türk Koçan" },
                        { id: "eşdeğer", label: "📜 Eşdeğer" },
                        { id: "tahsis", label: "🏛️ Tahsis" }
                      ].map((k) => (
                        <button key={k.id} onClick={() => { if (setReKocanType) setReKocanType(k.id); }} className={getButtonClass(reKocanType === k.id)}>
                          {k.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 9. FİYAT ARALIĞI */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> 9. Fiyat Aralığı
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="number" 
                        placeholder="Min ₺" 
                        value={minPrice} 
                        onChange={(e) => { if (setMinPrice) setMinPrice(e.target.value); }}
                        className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold focus:border-blue-500 focus:outline-none"
                      />
                      <input 
                        type="number" 
                        placeholder="Maks ₺" 
                        value={maxPrice} 
                        onChange={(e) => { if (setMaxPrice) setMaxPrice(e.target.value); }}
                        className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

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
              ) : (
                <>
                  {/* VEHICLE DETAIL FILTERS */}
                  {/* 1. İLAN KATEGORİSİ */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-rose-400" /> 1. Araç Kategorisi
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: "TÜMÜ" },
                        { id: "otomobil", label: "🚗 Otomobil" },
                        { id: "suv", label: "🚙 SUV / Arazi Aracı" },
                        { id: "hafif_ticari", label: "🚐 Hafif Ticari" },
                        { id: "pickup", label: "🛻 Pick-up" }
                      ].map((cat) => {
                        const isSelected = activeVehicleCategory === cat.id || 
                          (cat.id !== "all" && normalizeVehicleCategory(activeVehicleCategory) === normalizeVehicleCategory(cat.id));
                        return (
                          <button 
                            key={cat.id} 
                            onClick={() => { if (setActiveVehicleCategory) setActiveVehicleCategory(cat.id); }} 
                            className={getButtonClass(isSelected)}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. MARKA */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-blue-400" /> 2. Marka
                    </span>
                    <select
                      value={activeVehicleBrand}
                      onChange={(e) => { if (setActiveVehicleBrand) setActiveVehicleBrand(e.target.value); }}
                      className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Markalar</option>
                      {vehicleBrands.map(b => (
                        <option key={b} value={b}>{b.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. MODEL */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-amber-400" /> 3. Model
                    </span>
                    <select
                      value={activeVehicleModel}
                      onChange={(e) => { if (setActiveVehicleModel) setActiveVehicleModel(e.target.value); }}
                      className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Modeller</option>
                      {vehicleModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. ŞANZIMAN */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-emerald-400" /> 4. Şanzıman Tipi
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: "TÜMÜ" },
                        { id: "automatic", label: "Otomatik" },
                        { id: "manual", label: "Manuel" },
                        { id: "semi_automatic", label: "Yarı Otomatik" }
                      ].map((trans) => (
                        <button 
                          key={trans.id} 
                          onClick={() => { if (setActiveVehicleTransmission) setActiveVehicleTransmission(trans.id); }} 
                          className={getButtonClass(activeVehicleTransmission === trans.id || (trans.id === 'automatic' && activeVehicleTransmission === 'otomatik') || (trans.id === 'manual' && activeVehicleTransmission === 'manuel') || (trans.id === 'semi_automatic' && (activeVehicleTransmission === 'yarı otomatik' || activeVehicleTransmission === 'semi-automatic')))}
                        >
                          {trans.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. YAKIT TÜRÜ */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-purple-400" /> 5. Yakıt Türü
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: "TÜMÜ" },
                        { id: "gasoline", label: "Benzin" },
                        { id: "diesel", label: "Dizel" },
                        { id: "hybrid", label: "Hibrit" },
                        { id: "electric", label: "Elektrik" },
                        { id: "lpg", label: "LPG" }
                      ].map((f) => (
                        <button 
                          key={f.id} 
                          onClick={() => { if (setActiveVehicleFuel) setActiveVehicleFuel(f.id); }} 
                          className={getButtonClass(activeVehicleFuel === f.id || (f.id === 'gasoline' && activeVehicleFuel === 'benzin') || (f.id === 'diesel' && activeVehicleFuel === 'dizel') || (f.id === 'hybrid' && activeVehicleFuel === 'hibrit') || (f.id === 'electric' && activeVehicleFuel === 'elektrik'))}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6. YIL */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" /> 6. Üretim Yılı
                    </span>
                    <select
                      value={activeVehicleYear}
                      onChange={(e) => { if (setActiveVehicleYear) setActiveVehicleYear(e.target.value); }}
                      className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Yıllar</option>
                      {vehicleYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* 7. KASA TİPİ */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      🚗 7. Kasa Tipi
                    </span>
                    <select
                      value={activeVehicleBodyType}
                      onChange={(e) => { if (setActiveVehicleBodyType) setActiveVehicleBodyType(e.target.value); }}
                      className="w-full p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Kasa Tipleri</option>
                      <option value="sedan">Sedan</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="suv">SUV</option>
                      <option value="coupe">Kupe</option>
                      <option value="cabrio">Cabrio</option>
                      <option value="pickup">Pick-up</option>
                      <option value="station">Station Wagon</option>
                      {vehicleBodyTypes.filter(bt => !['sedan', 'hatchback', 'suv', 'coupe', 'cabrio', 'pickup', 'station'].includes(bt.toLowerCase())).map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>

                  {/* 8. TAKAS */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      🔄 8. Takas Durumu
                    </span>
                    <div className="flex items-center gap-2">
                      {[
                        { id: "all", label: "TÜMÜ" },
                        { id: "yes", label: "Takaslı" }
                      ].map((t) => (
                        <button 
                          key={t.id} 
                          onClick={() => { if (setActiveVehicleTradeIn) setActiveVehicleTradeIn(t.id); }} 
                          className={getButtonClass(activeVehicleTradeIn === t.id)}
                        >
                          {t.label}
                        </button>
                      ))}
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
