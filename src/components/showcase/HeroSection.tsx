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

  // Retrieve banners array
  const banners = React.useMemo(() => {
    const rawBanners = (store as any)?.branding?.banners || (store as any)?.banners;
    if (Array.isArray(rawBanners) && rawBanners.length > 0) {
      return rawBanners;
    }
    // Fallback to legacy single banner
    return [{
      id: "legacy",
      image_url: store.hero_image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80",
      title: store.hero_title || "Keşfetmeye Başlayın",
      subtitle: store.hero_subtitle || "Size en uygun portföyleri ve ürünleri en iyi fiyatlarla keşfedin.",
      text_position: "center",
      show_store_name: true,
      button_text: "Portföyleri İncele",
      button_link: "#portfolio"
    }];
  }, [store]);

  const [currentSlideIdx, setCurrentSlideIdx] = React.useState(0);

  React.useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  return (
    <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
      {banners.map((slide: any, index: number) => {
        const isActive = index === currentSlideIdx;
        return (
          <motion.div
            key={slide.id || index}
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: isActive ? "auto" : "none", zIndex: isActive ? 10 : 0 }}
          >
            <img
              src={slide.image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80"}
              className="absolute inset-0 w-full h-full object-cover brightness-[0.7] contrast-[1.05]"
              alt={slide.title || "Hero Banner"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent" />
            <div className="absolute inset-0 bg-black/20" />

            {/* Slide Content with Text Alignment */}
            <div className={`absolute inset-0 flex items-center px-8 md:px-16 py-12 ${
              slide.text_position === 'left' 
                ? 'justify-start text-left' 
                : slide.text_position === 'right' 
                  ? 'justify-end text-right' 
                  : 'justify-center text-center'
            }`}>
              <div className={`max-w-4xl flex flex-col ${
                slide.text_position === 'left' 
                  ? 'items-start' 
                  : slide.text_position === 'right' 
                    ? 'items-end' 
                    : 'items-center'
              }`}>
                {/* Store Name - only show if show_store_name is not false */}
                {slide.show_store_name !== false && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : -20 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex items-center gap-2 mb-6"
                  >
                    <div className="h-[1px] w-6 bg-white/40" />
                    <span className={`text-xs font-black uppercase tracking-[0.4em] ${isLuxury ? "text-amber-400" : "text-white/80"}`}>
                      {displayName}
                    </span>
                    <div className="h-[1px] w-6 bg-white/40" />
                  </motion.div>
                )}

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-4xl md:text-6xl xl:text-7xl font-bold font-display tracking-tight text-white mb-6 leading-tight drop-shadow-lg"
                >
                  {slide.title || "Keşfetmeye Başlayın"}
                </motion.h1>

                {slide.subtitle && (
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-base md:text-lg xl:text-xl text-slate-200 font-medium leading-relaxed max-w-2xl drop-shadow mb-10"
                  >
                    {slide.subtitle}
                  </motion.p>
                )}

                {/* Buttons */}
                {slide.button_text && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="flex flex-col sm:flex-row items-center gap-4"
                  >
                    <a
                      href={slide.button_link || "#portfolio"}
                      className="flex items-center gap-3 px-8 py-3.5 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-100 hover:scale-105 transition-all shadow-xl text-sm"
                    >
                      {slide.button_text}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Slide dots indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 right-8 z-20 flex gap-2">
          {banners.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentSlideIdx(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlideIdx ? "bg-white scale-125" : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Decorative scroll arrow */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce text-white/50 z-20">
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
      </div>
    </section>
  );
};
