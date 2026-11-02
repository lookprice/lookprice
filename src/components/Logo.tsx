import React from "react";

export const LOOKPRICE_LOGO_URL = "/assets/aistudio/1784196421165-Photoroom__3__8e18c7da.png";

export function Logo({
  size = 36,
  className = "",
  showText = false
}: {
  size?: number;
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="bg-white rounded-xl p-1 shadow-sm border border-slate-200/70 flex items-center justify-center shrink-0 overflow-hidden"
      >
        <img
          src={LOOKPRICE_LOGO_URL}
          alt="LookPrice.net"
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <span className="font-black text-slate-900 dark:text-white tracking-tight text-xl leading-none font-sans">
          Look<span className="text-indigo-600 dark:text-indigo-400">Price</span>
        </span>
      )}
    </div>
  );
}

export default Logo;
