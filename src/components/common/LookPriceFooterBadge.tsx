import React from "react";

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
        className="group relative inline-flex items-center justify-center rounded-full p-[1.5px] transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
        title="lookprice.net - Profesyonel Yönetim Sistemleri"
      >
        {/* Kurumsal Parlak Aura / Glow Katmanı */}
        <span
          className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500/70 via-blue-400/70 to-indigo-500/70 opacity-75 blur-md animate-pulse group-hover:opacity-100 transition-all duration-500"
          aria-hidden="true"
        />
        <span
          className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/80 via-slate-300/60 to-indigo-500/80 animate-pulse"
          aria-hidden="true"
        />

        {/* İç Kapsül (Ciddi & Kurumsal #050508 Zemin) */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 px-5 sm:px-7 py-2 rounded-full bg-[#050508] text-white shadow-[0_0_25px_rgba(99,102,241,0.55)] border border-white/15">
          {/* Resmi LookPrice.net Logosu & Kurumsal Tipografi */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/assets/aistudio/1784196421165-Photoroom__3__8e18c7da.png"
                alt="LookPrice.net"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-baseline tracking-tight font-black text-sm sm:text-base">
              <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.75)]">look</span>
              <span className="text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.95)] animate-pulse">price</span>
              <span className="text-slate-300 font-bold text-xs sm:text-sm ml-0.5">.net</span>
            </div>
          </div>

          <span className="text-white/25 font-light hidden sm:inline">|</span>

          {/* Profesyonel Yönetim Sistemleri Kurumsal Slogan */}
          <span className="text-[10.5px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-slate-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.65)] animate-pulse">
            Profesyonel Yönetim Sistemleri
          </span>
        </div>
      </a>
    </div>
  );
};

export default LookPriceFooterBadge;
