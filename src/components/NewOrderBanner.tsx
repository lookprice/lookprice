import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useLanguage } from "../contexts/LanguageContext";

export const NewOrderBanner = ({ count, onClick }: { count: number; onClick: () => void }) => {
  const { lang } = useLanguage();
  if (count === 0) return null;

  return (
    <div 
      onClick={onClick}
      className="bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-between shadow-lg cursor-pointer animate-pulse mb-6"
    >
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-6 w-6" />
        <span className="font-bold text-sm">
          {lang === 'tr' ? `Tebrikler.. ${count} Yeni Siparişiniz Var!` : `Congratulations.. You have ${count} new orders!`}
        </span>
      </div>
      <button className="text-xs font-bold bg-white text-emerald-600 px-3 py-1.5 rounded-lg">
        {lang === 'tr' ? 'Görüntüle' : 'View'}
      </button>
    </div>
  );
};
