import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  List, 
  LayoutGrid, 
  Sparkles, 
  X, 
  Compass, 
  AlertTriangle,
  Flame,
  FileText,
  BadgeAlert
} from "lucide-react";

interface RadarNewsItem {
  id: string | number;
  title: string;
  summary: string;
  source?: string;
  date?: string;
  intensity?: "high" | "medium" | "low" | string;
  image_url?: string;
  imageUrl?: string;
  tags?: string[] | string;
  sector_data?: any;
  store_name?: string;
}

interface RadarShowcaseSliderProps {
  radarNews: RadarNewsItem[];
  lang?: string;
  theme?: "light" | "dark";
  title?: string;
  subtitle?: string;
  subBadge?: string;
  sector?: "automotive" | "real_estate" | string;
}

export const RadarShowcaseSlider: React.FC<RadarShowcaseSliderProps> = ({
  radarNews = [],
  lang = "tr",
  theme = "light",
  title,
  subtitle,
  subBadge,
  sector = "real_estate",
}) => {
  const [viewMode, setViewMode] = useState<"banner" | "list">("banner");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<RadarNewsItem | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isDark = theme === "dark";

  const isAutomotive = sector === "automotive";

  const defaultTitle = isAutomotive
    ? (lang === "tr" ? "Otomotiv Dünyasından Gelişmeler" : "Automotive World Updates")
    : (lang === "tr" ? "İmar & Bölgesel Gelişmeler" : "Legal & Regional Alerts");

  const defaultSubtitle = isAutomotive
    ? (lang === "tr" ? "Sektörel Takip ve Analizler" : "Industry Insights & Analysis")
    : (lang === "tr" ? "Mevzuat ve İmar Takip" : "Zoning Tracking");

  const defaultSubBadge = isAutomotive
    ? (lang === "tr" ? "CANLI OTOMOTİV RADARI" : "LIVE AUTOMOTIVE RADAR")
    : (lang === "tr" ? "BÖLGESEL CANLI RADAR" : "LIVE REGIONAL RADAR");

  const displayTitle = title || defaultTitle;
  const displaySubtitle = subtitle || defaultSubtitle;
  const displaySubBadge = subBadge || defaultSubBadge;

  // Dynamic fallback image selector based on keywords to prevent empty boxes and look ultra professional!
  const getNewsImage = (item: RadarNewsItem): string | null => {
    if (!item) return null;
    if (item.image_url && item.image_url.trim().length > 10) return item.image_url;
    if (item.imageUrl && item.imageUrl.trim().length > 10) return item.imageUrl;

    const query = ((item.title || "") + " " + (item.summary || "")).toLowerCase();

    // If no good match, return null to show branded placeholder
    return null;
  };

  const NewsMedia: React.FC<{ item: RadarNewsItem; className?: string }> = ({ item, className }) => {
    const imageUrl = getNewsImage(item);
    
    if (!imageUrl) {
      return (
        <div className={`${className} flex flex-col items-center justify-center p-6 text-center ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
           <div className="mb-3 p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
             <Sparkles className="w-8 h-8 text-white" />
           </div>
           <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>LookPrice News</h3>
           <p className={`mt-2 text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
             {lang === 'tr' ? 'Canlı Haber Akışı' : 'Live News Stream'}
           </p>
        </div>
      );
    }

    return (
      <img 
        src={imageUrl} 
        alt={item?.title || "LookPrice News"} 
        className={className}
        referrerPolicy="no-referrer"
      />
    );
  };

  // Normalize tags helper
  const getTags = (item: RadarNewsItem): string[] => {
    if (!item.tags) return [];
    if (Array.isArray(item.tags)) return item.tags;
    try {
      return JSON.parse(item.tags);
    } catch {
      return typeof item.tags === "string" ? item.tags.split(",") : [];
    }
  };

  // Safe navigation helpers
  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + radarNews.length) % radarNews.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % radarNews.length);
  };

  // Autoplay functionality
  useEffect(() => {
    if (isAutoPlaying && radarNews.length > 1) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % radarNews.length);
      }, 5000); // Transitions every 5 seconds
    }
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [isAutoPlaying, radarNews.length]);

  if (!radarNews || radarNews.length === 0) return null;

  const currentNews = radarNews[currentIndex];

  return (
    <div 
      className={`rounded-3xl border transition-all duration-500 overflow-hidden relative ${
        isDark 
          ? "bg-slate-950/70 border-slate-800 shadow-2xl shadow-indigo-950/20" 
          : "bg-gradient-to-tr from-slate-50 to-white border-slate-200/60 shadow-xl shadow-slate-100/50"
      }`}
    >
      {/* Absolute Decorative Grid Background */}
      <div className={`absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] ${isDark ? "opacity-[0.05]" : ""}`} />

      {/* Control / Info Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 ${isDark ? "border-b border-slate-900" : "border-b border-slate-100"} gap-4 z-10 relative`}>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {/* Pulsing Outer Indicator ring */}
            <span className="absolute inline-flex h-6 w-6 rounded-full bg-indigo-500/20 animate-ping" />
            <span className="relative flex h-3 w-3 rounded-full bg-indigo-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                🔥 {displaySubBadge}
              </span>
              <span className={`text-[10px] font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"} flex items-center gap-1`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {displaySubtitle}
              </span>
            </div>
            <h3 className={`text-lg font-black tracking-tight mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              {displayTitle}
            </h3>
          </div>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setViewMode("banner")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              viewMode === "banner"
                ? isDark 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "bg-slate-900 text-white shadow-md"
                : isDark 
                  ? "hover:bg-slate-900 text-slate-400 hover:text-white" 
                  : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            {lang === "tr" ? "Dinamik Akış" : "Dynamic Stream"}
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              viewMode === "list"
                ? isDark 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "bg-slate-900 text-white shadow-md"
                : isDark 
                  ? "hover:bg-slate-900 text-slate-400 hover:text-white" 
                  : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            {lang === "tr" ? "Geniş Liste" : "Full List"}
          </button>
        </div>
      </div>

      {/* Rendering Modes */}
      <div className="p-6 relative z-10">
        {viewMode === "banner" ? (
          /* Dyn Banner Mode: single focus, slide, autoplay, visual progress indicator */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[220px]">
            {/* Visual block */}
            <div className="lg:col-span-4 relative rounded-2xl overflow-hidden shadow-md group aspect-[16/10] lg:aspect-auto">
              <NewsMedia 
                item={currentNews} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
              
              {/* Glassmorphic Brand Stamp Overlay */}
              <div className="absolute bottom-3 right-3 z-10 bg-slate-950/75 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-lg">
                <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[8px] font-black text-white tracking-[0.12em]">LOOKPRICE LIVE NEWS</span>
              </div>

              {/* Overlay Glass Intensity Pill */}
              <div className="absolute top-4 left-4 flex gap-1.5 items-center">
                {currentNews.intensity === "high" && (
                  <span className="bg-rose-500/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg animate-pulse flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {lang === "tr" ? "Yüksek Önem" : "High Alert"}
                  </span>
                )}
                {currentNews.source && (
                  <span className={`backdrop-blur-md text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                    isDark ? "bg-black/70 text-slate-300 border border-slate-800" : "bg-white/90 text-slate-700 border border-slate-200"
                  }`}>
                    {currentNews.source}
                  </span>
                )}
              </div>
            </div>

            {/* Content info */}
            <div className="lg:col-span-8 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{currentNews.date}</span>
                  {currentNews.store_name && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-indigo-500">🏢 {currentNews.store_name}</span>
                    </>
                  )}
                </div>

                <motion.h4 
                  key={currentNews.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xl font-black leading-snug tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {currentNews.title}
                </motion.h4>

                <motion.p 
                  key={`sum-${currentNews.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`text-xs md:text-sm leading-relaxed line-clamp-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  {currentNews.summary}
                </motion.p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {getTags(currentNews).map((tag, idx) => (
                    <span 
                      key={idx} 
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                        isDark 
                          ? "bg-slate-900/50 border-slate-800 text-slate-400" 
                          : "bg-slate-100 border-slate-200 text-slate-500"
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Slider Interaction Overlay panel */}
              <div className="flex items-center justify-between border-t pt-4 border-slate-100/10 gap-4 mt-auto">
                <button
                  onClick={() => setSelectedItem(currentNews)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer ${
                    isDark 
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20" 
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {lang === "tr" ? "HABER DETAYINI OKU" : "READ DETAILS"}
                </button>

                {/* Manual triggers & Visual pagination dots */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {radarNews.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsAutoPlaying(false);
                          setCurrentIndex(idx);
                        }}
                        className={`transition-all duration-300 rounded-full ${
                          currentIndex === idx 
                            ? "w-5 h-2 bg-indigo-500" 
                            : `w-2 h-2 ${isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-200 hover:bg-slate-300"}`
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrev}
                      className={`p-2 rounded-xl transition-all border ${
                        isDark 
                          ? "border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white" 
                          : "border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      className={`p-2 rounded-xl transition-all border ${
                        isDark 
                          ? "border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white" 
                          : "border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Large List Mode with expanding details */
          <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {radarNews.map((item, index) => {
              const tags = getTags(item);
              const isHighRating = item.intensity === "high";
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-start gap-4 hover:-translate-y-0.5 ${
                    isDark 
                      ? "bg-slate-900/40 border-slate-850 hover:bg-indigo-950/20 hover:border-indigo-900/60" 
                      : "bg-white border-slate-150/80 hover:bg-slate-50 hover:border-slate-250 hover:shadow-md"
                  }`}
                >
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider ${
                        isHighRating 
                          ? "bg-rose-500/15 text-rose-400" 
                          : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                      }`}>
                        {item.source || "lookprice AI"}
                      </span>
                      <span>{item.date}</span>
                      {item.store_name && (
                        <span className="text-indigo-400 font-extrabold">🏢 {item.store_name}</span>
                      )}
                    </div>
                    <h4 className={`text-sm font-black truncate ${isDark ? "text-white group-hover:text-indigo-400" : "text-slate-900"}`}>
                      {item.title}
                    </h4>
                    <p className={`text-xs leading-relaxed truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {item.summary}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 mt-2 flex-shrink-0 ${isDark ? "text-slate-650" : "text-slate-400"}`} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Detailed Overlay Modal Panel */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={`relative w-full max-w-2xl rounded-[2.5rem] border overflow-hidden shadow-2xl z-10 flex flex-col ${
                isDark 
                  ? "bg-slate-950 border-slate-850 text-white" 
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              {/* Header block with image or banner */}
              <div className="h-52 w-full relative overflow-hidden bg-slate-100 flex-shrink-0 border-b border-slate-100/10">
                <NewsMedia 
                  item={selectedItem} 
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-slate-950 via-slate-950/45" : "from-white via-white/45"} to-transparent`} />
                
                {/* Glassmorphic Brand Stamp Overlay */}
                <div className="absolute bottom-4 right-4 z-10 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-lg">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-black text-white tracking-[0.12em]">LOOKPRICE LIVE NEWS</span>
                </div>

                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-6 right-6 p-2 rounded-full backdrop-blur-md bg-black/40 text-white hover:bg-black/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable description panel */}
              <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
                    <span className={`px-2.5 py-1 rounded-lg text-xss font-black uppercase tracking-wider ${
                      selectedItem.intensity === "high" 
                        ? "bg-rose-500/15 text-rose-400" 
                        : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"
                    }`}>
                      {selectedItem.source || "Milli Haber Servisi"}
                    </span>
                    <span>{selectedItem.date}</span>
                    {selectedItem.store_name && (
                      <span className="text-indigo-400 font-extrabold">🏢 {selectedItem.store_name}</span>
                    )}
                  </div>

                  <h3 className={`text-2xl font-black leading-tight tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    {selectedItem.title}
                  </h3>
                </div>

                <div className="space-y-4">
                  <p className={`text-sm md:text-base leading-relaxed whitespace-pre-line ${isDark ? "text-slate-350" : "text-slate-700"}`}>
                    {selectedItem.summary}
                  </p>

                  {/* AI Smart analysis indicator badge alert */}
                  <div className={`p-5 rounded-3xl flex items-start gap-4 border ${
                    isDark 
                      ? "bg-indigo-950/15 border-indigo-900/30 text-indigo-300" 
                      : "bg-indigo-50/50 border-indigo-150 text-indigo-950"
                  }`}>
                    <Sparkles className="w-5 h-5 mt-1 text-indigo-500 flex-shrink-0" />
                    <div className="space-y-1">
                      <h5 className="text-xs font-black uppercase tracking-widest">{lang === "tr" ? "LOOKPRICE AI RADAR ÖNERİSİ" : "AI GROUNDING RECOMMENDATION"}</h5>
                      <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {lang === "tr" 
                          ? "Mevzuat değişiklikleri Kıbrıs genelinde gayrimenkul birim fiyatlarını doğrudan etkileyebilir. İlgili bölgede yatırım yapmayı düşünüyorsanız bu gelişmeyi yakından izleyen danışmanlarımıza danışın." 
                          : "Zoning regulations can directly fluctuate land valuations on multiple axes. For investment security, trace regulation timelines or contact our regional advisors."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subtag pills */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {getTags(selectedItem).map((tag, idx) => (
                    <span 
                      key={idx} 
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border ${
                        isDark 
                          ? "bg-slate-900 border-slate-800 text-slate-400" 
                          : "bg-slate-100 border-slate-200 text-slate-500"
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Back out Button footer */}
              <div className={`p-6 border-t flex items-center justify-end ${isDark ? "border-slate-850" : "border-slate-150"}`}>
                <button
                  onClick={() => setSelectedItem(null)}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer ${
                    isDark 
                      ? "bg-slate-900 hover:bg-slate-800 text-white" 
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                  }`}
                >
                  {lang === "tr" ? "Pencereli Kapat" : "Dismiss Report"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
