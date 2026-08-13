import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Filter, Tag, Key, Building2, Layers, MapPin, Check } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
  isOpen, onClose, 
  reFihristTab, setReFihristTab,
  rePropertyType, setRePropertyType,
  reSubPropertyType, setReSubPropertyType,
  reRegion, setReRegion,
  activeTags, setActiveTags,
  EMLAK_TIPI_SUB_TIPLERI
}) => {
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
            <div className="p-4 space-y-6">
              {/* Filter Content Migrated from Marketplace.tsx */}
              {reFihristTab === "all" && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    1. Emlak Niyeti Seçin:
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    {[
                      { id: "satilik", label: "SATILIK EMLAK", icon: Tag },
                      { id: "kiralik", label: "KİRALIK EMLAK", icon: Key }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setReFihristTab(tab.id)}
                          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black transition-all border cursor-pointer bg-blue-600 text-white border-blue-400 hover:bg-blue-500"
                        >
                          <Icon className="w-4 h-4 text-amber-300" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* STEP 2: MÜLK TİPİ SEÇİMİ */}
              {rePropertyType === "all" && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    2. Mülk Tipi Seçin:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "residence", label: "Konut / Residence" },
                      { id: "commercial", label: "Ticari / Commercial" },
                      { id: "land", label: "Arsa / Land" }
                    ].map((pt) => (
                      <button
                        key={pt.id}
                        onClick={() => { setRePropertyType(pt.id); setReSubPropertyType("all"); }}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer bg-slate-950/90 border-slate-700 text-slate-200 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-400 shadow-sm"
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: ŞEHİR / BÖLGE SEÇİMİ */}
              {reRegion === "all" && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    3. Şehir / Bölge Seçin:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {["Girne", "Lefkoşa", "Gazimağusa", "İskele", "Lefke", "Güzelyurt"].map((reg) => (
                      <button
                        key={reg}
                        onClick={() => setReRegion(reg.toLowerCase())}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-rose-600 hover:text-white hover:border-rose-400 shadow-sm"
                      >
                        📍 {reg}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
