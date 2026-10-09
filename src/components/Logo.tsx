import React from "react";

export function Logo({ size = 32, className = "", showText = true }: { size?: number, className?: string, showText?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon Mark: Green house-car contour */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 200 130" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <g fill="none" stroke="#059669" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22 58 L 52 28 L 82 58" />
          <path d="M 32 48 V 32 H 40 V 40" />
          <path d="M 52 28 C 80 28 92 58 115 58 L 165 58 C 185 58 198 68 200 80 C 202 92 195 100 182 100 L 28 100 C 20 100 16 92 16 80 C 16 68 28 58 52 28 Z" />
          <circle cx="62" cy="100" r="12" fill="#ffffff" stroke="#059669" strokeWidth="7" />
          <circle cx="162" cy="100" r="12" fill="#ffffff" stroke="#059669" strokeWidth="7" />
        </g>
      </svg>
      {showText && (
        <span className="font-black text-slate-900 dark:text-white tracking-tight text-xl leading-none font-sans">
          Enrakipsiz
        </span>
      )}
    </div>
  );
}

export default Logo;
