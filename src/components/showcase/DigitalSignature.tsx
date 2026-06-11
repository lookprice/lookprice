import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface DigitalSignatureProps {
  storeName: string;
  lang: string;
  isPortfolio?: boolean;
}

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  storeName,
  lang,
  isPortfolio
}) => {
  if (isPortfolio) return null;
  return (
    <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <ShieldCheck className="w-24 h-24 text-slate-900" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-lg bg-green-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-slate-400 tracking-wide">
            {lang === "tr" ? "DOĞRULANMIŞ ÜRÜN" : "VERIFIED PRODUCT"}
          </span>
        </div>
        <p className="text-xss font-bold text-slate-600 leading-tight">
          {lang === "tr"
            ? `Bu ürün ${storeName} tarafından kalite kontrolünden geçmiştir.`
            : `This product has been quality-checked by ${storeName}.`}
        </p>
      </div>
      <div className="relative z-10 text-right">
        <span className="text-[10px] font-semibold text-slate-900 tracking-wide block mb-1 opacity-20 underline decoration-slate-900/10 decoration-dotted">
          SECURE_PASS_ID
        </span>
        <div className="flex gap-0.5 justify-end">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-1 h-4 bg-slate-900/10 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
};
