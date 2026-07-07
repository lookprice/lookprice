import React from 'react';
import { motion } from 'motion/react';
import { Store as StoreInfo } from '../../types';
import { ArrowRight, Star } from 'lucide-react';

interface HeroSectionProps {
  store: StoreInfo;
  isLuxury?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ store, isLuxury = true }) => {
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

  const displayName = getDisplayStoreName(store);

  return (
    <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
      <motion.img
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        src={store.hero_image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80"}
        className="absolute inset-0 w-full h-full object-cover brightness-[0.75] contrast-[1.1] transition-transform duration-1000 group-hover:scale-105"
        alt="Hero"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="relative z-10 text-center text-white px-6 py-12 max-w-4xl mx-4 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="h-[1px] w-8 bg-white/40" />
          <span className={`text-xs font-bold uppercase tracking-[0.4em] ${isLuxury ? "text-amber-400" : "text-white/80"}`}>
            {displayName}
          </span>
          <div className="h-[1px] w-8 bg-white/40" />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-7xl font-semibold font-display tracking-tight text-white mb-6 leading-tight drop-shadow-lg"
        >
          {store.hero_title || "Keşfetmeye Başlayın"}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-slate-200 font-medium leading-relaxed max-w-2xl drop-shadow mb-10"
        >
          {store.hero_subtitle || "Size en uygun portföyleri ve ürünleri en iyi fiyatlarla keşfedin."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="#portfolio"
            className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-100 hover:scale-105 transition-all shadow-xl"
          >
            Portföyleri İncele
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#contact"
            className="flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-full hover:bg-white/20 hover:scale-105 transition-all border border-white/20"
          >
            İletişime Geç
          </a>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 animate-bounce text-white/50">
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
      </div>
    </section>
  );
};
