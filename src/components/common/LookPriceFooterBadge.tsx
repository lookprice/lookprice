import React from "react";
import { Sparkles, Zap } from "lucide-react";

interface LookPriceFooterBadgeProps {
  className?: string;
}

export const LookPriceFooterBadge: React.FC<LookPriceFooterBadgeProps> = ({ className = "" }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center pt-6 pb-2 select-none ${className}`}>
      <a
        href="https://lookprice.net"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative inline-flex items-center justify-center rounded-full p-[2px] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        title="lookprice.net - Profesyonel Yönetim Sistemleri"
      >
        {/* Parlak Yanıp-Sönen Neon Aura / Glow Katmanı */}
        <span
          className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-amber-400 opacity-80 blur-md animate-pulse group-hover:opacity-100 group-hover:blur-lg transition-all duration-500"
          aria-hidden="true"
        />
        <span
          className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-blue-400 to-amber-400 animate-pulse"
          aria-hidden="true"
        />

        {/* İç Kapsül (Yüksek Kontrastlı #050508 lookprice.net Zemini) */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#050508] text-white shadow-[0_0_30px_rgba(99,102,241,0.75)] border border-white/20">
          {/* Canlı Yanıp-Sönen Işık Noktası */}
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-90" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
          </span>

          {/* lookprice.net Logosu & Vurgusu */}
          <div className="flex items-baseline tracking-tight font-black text-sm sm:text-base">
            <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]">look</span>
            <span className="text-indigo-400 drop-shadow-[0_0_14px_rgba(129,140,248,1)] animate-pulse">price</span>
            <span className="text-cyan-300 font-extrabold text-xs sm:text-sm ml-0.5 drop-shadow-[0_0_10px_rgba(34,211,238,0.9)]">.net</span>
          </div>

          <span className="text-white/30 font-black hidden sm:inline">•</span>

          {/* Profesyonel Yönetim Sistemleri Parlak Yanıp-Sönen Slogan */}
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-bounce shrink-0 drop-shadow-[0_0_10px_rgba(251,191,36,0.95)]" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] bg-gradient-to-r from-amber-300 via-white to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(251,191,36,0.85)] animate-pulse">
              Profesyonel Yönetim Sistemleri
            </span>
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0 fill-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.95)]" />
          </div>
        </div>
      </a>
    </div>
  );
};

export default LookPriceFooterBadge;
