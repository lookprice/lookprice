import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2 } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  store: any;
}

const getDisplayStoreName = (store: any) => {
  const rawName = store?.branding?.store_name || store?.branding?.name || store?.name || "";
  if (!rawName || rawName.toLowerCase().includes("lookprice")) {
    const type = store?.store_type || store?.branding?.store_type;
    if (type === 'real_estate') {
      return "Premium VIP Emlak";
    } else if (type === 'motor_vehicle' || type === 'automotive') {
      return "Seçkin Otomotiv";
    }
    return "Seçkin Mağaza";
  }
  return rawName;
};

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  lang,
  store
}) => {
  const displayName = getDisplayStoreName(store);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl md:rounded-[4rem] overflow-hidden shadow-lg max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-40 md:h-48 bg-slate-900 overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-30">
                <img
                  src={
                    store?.hero_image_url ||
                    "https://images.unsplash.com/photo-1441986300917-64674bd600d8"
                  }
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  alt="Store Hero"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-xl bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-all z-20 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-6 left-6 md:left-10 z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tighter">
                  {lang === "tr" ? "Hikayemiz" : "Our Story"}
                </h2>
              </div>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 text-base md:text-lg leading-relaxed font-semibold whitespace-pre-wrap">
                  {store?.about_text ||
                    (lang === "tr"
                      ? "Henüz hakkımızda yazısı eklenmedi."
                      : "No about text added yet.")}
                </p>
              </div>
              <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100 flex items-center gap-4 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold text-sm tracking-tight">
                    {lang === "tr"
                      ? "Güvenilir Alışveriş"
                      : "Trusted Shopping"}
                  </h4>
                  <p className="text-slate-400 text-xs md:text-sm font-medium">
                    {displayName}{" "}
                    {lang === "tr" ? "güvencesiyle." : "guarantee."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
