import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Filter, Tag, Key, Building2, Layers, MapPin, RotateCcw, Car, Gauge, Fuel } from 'lucide-react';

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
  activeTags: string[];
  setActiveTags: (tags: (prev: string[]) => string[]) => void;
  EMLAK_TIPI_SUB_TIPLERI: Record<string, string[]>;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ 
  isOpen, onClose, activeSector,
  reFihristTab, setReFihristTab,
  rePropertyType, setRePropertyType,
  reSubPropertyType, setReSubPropertyType,
  reRegion, setReRegion,
  activeTags, setActiveTags,
  EMLAK_TIPI_SUB_TIPLERI
}) => {
  const resetFilters = () => {
    setReFihristTab("all");
    setRePropertyType("all");
    setReSubPropertyType("all");
    setReRegion("all");
  };

  const getButtonClass = (isActive: boolean) => 
    `flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
      isActive
        ? "bg-blue-600 text-white border-blue-400 shadow-lg ring-2 ring-blue-500/30"
        : "bg-slate-950/90 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500"
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-slate-950 z-50 shadow-2xl border-l border-slate-800 overflow-y-auto"
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Filter className="w-5 h-5" /> Detaylı Arama
              </h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-8">
              {activeSector === 'emlak' ? (
                // EMLAK FİLTRELERİ
                <>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-400" />
                      1. Emlak Niyeti:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: "HEPSİ" },
                        { id: "satilik", label: "SATILIK" },
                        { id: "kiralik", label: "KİRALIK" }
                      ].map((tab) => (
                        <button key={tab.id} onClick={() => setReFihristTab(tab.id)} className={getButtonClass(reFihristTab === tab.id)}>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      2. Mülk Tipi:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: "HEPSİ" },
                        { id: "residence", label: "KONUT" },
                        { id: "commercial", label: "TİCARİ" },
                        { id: "land", label: "ARSA" }
                      ].map((pt) => (
                        <button key={pt.id} onClick={() => { setRePropertyType(pt.id); setReSubPropertyType("all"); }} className={getButtonClass(rePropertyType === pt.id)}>
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      3. Bölge:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {["all", "girne", "lefkoşa", "gazimağusa", "iskele", "lefke", "güzelyurt"].map((reg) => (
                        <button key={reg} onClick={() => setReRegion(reg)} className={getButtonClass(reRegion === reg)}>
                          {reg === "all" ? "TÜMÜ" : reg.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                // ARAÇ FİLTRELERİ
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-blue-400" />
                      KM Aralığı:
                    </span>
                    <input 
                      type="number" 
                      placeholder="Max KM" 
                      className="w-full p-3 bg-slate-900 rounded-xl border border-slate-700 text-white text-xs" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-amber-400" />
                      Yakıt Tipi:
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {['Benzin', 'Dizel', 'Hibrit', 'Elektrik'].map(f => (
                           <button key={f} className={getButtonClass(false)}>{f}</button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={resetFilters}
                className="w-full mt-10 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                FİLTRELERİ TEMİZLE
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
