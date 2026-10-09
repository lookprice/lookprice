import React from "react";

interface StoreLogoProps {
  logoUrl?: string;
  storeName?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  imgClassName?: string;
}

export function StoreLogo({
  logoUrl,
  storeName,
  size = "md",
  className = "",
  imgClassName = ""
}: StoreLogoProps) {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const rawName = (storeName || "").trim();
  const displayName = (rawName && !/^lookprice$/i.test(rawName)) ? rawName : "LookPrice";

  const getStoreInitials = (name: string) => {
    if (!name || /^lookprice$/i.test(name.trim())) return "LP";
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.trim().substring(0, 2).toUpperCase();
  };

  const initials = getStoreInitials(displayName);

  const sizeMap = {
    xs: { outer: "w-6 h-6 rounded-md text-[9px]", img: "rounded-md" },
    sm: { outer: "w-8 h-8 rounded-lg text-xs", img: "rounded-lg" },
    md: { outer: "w-12 h-12 rounded-2xl text-sm", img: "rounded-xl" },
    lg: { outer: "w-16 h-16 rounded-3xl text-xl", img: "rounded-2xl" },
    xl: { outer: "w-24 h-24 rounded-[2rem] text-3xl", img: "rounded-3xl" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (logoUrl && !imgError) {
    return (
      <div className={`${currentSize.outer} bg-white/95 shadow-md p-1 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-white/15 overflow-hidden ${className}`}>
        <img 
          src={logoUrl} 
          alt={displayName} 
          onError={() => setImgError(true)}
          className={`w-full h-full object-contain ${currentSize.img} ${imgClassName}`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className={`${currentSize.outer} bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 shadow-md flex items-center justify-center text-white font-black tracking-wider shrink-0 border border-indigo-400/30 select-none ${className}`}>
      {initials}
    </div>
  );
}

export default StoreLogo;
