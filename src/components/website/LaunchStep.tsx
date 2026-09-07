import React from "react";
import { Check, Globe, Eye, ArrowRight } from "lucide-react";

interface LaunchStepProps {
  lang: string;
  currentUrl: string;
}

export const LaunchStep: React.FC<LaunchStepProps> = ({ lang, currentUrl }) => {
  const isTr = lang === "tr";

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-6">
      <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-50">
        <Check className="h-10 w-10" />
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
          {isTr ? "YAYINA HAZIRSINIZ!" : "READY TO LAUNCH!"}
        </h3>
        <p className="text-xs font-bold text-slate-400 mt-2 leading-relaxed">
          {isTr 
            ? "Tüm ayarlarınız optimize edildi. Şimdi portföyünüzü dünyayla paylaşma vakti." 
            : "Your settings are optimized. Time to share your portfolio with the world."}
        </p>
      </div>
      
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>{isTr ? "AKTİF ADRES" : "ACTIVE URL"}</span>
          <span className="text-emerald-500">{isTr ? "ÇEVRİMİÇİ" : "ONLINE"}</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl">
          <Globe className="h-4 w-4 text-slate-300" />
          <span className="text-xs font-black text-slate-900 flex-1 truncate">{currentUrl}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => window.open(`https://${currentUrl}`, "_blank")}
          className="w-full py-4 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          {isTr ? "SİTEYİ GÖRÜNTÜLE" : "VIEW WEBSITE"}
        </button>
        <button
          onClick={() => {
            const el = document.createElement('textarea');
            el.value = currentUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            alert(isTr ? "Adres kopyalandı!" : "URL copied!");
          }}
          className="w-full py-4 bg-slate-100 text-slate-600 text-xs font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
        >
          {isTr ? "LİNKİ KOPYALA" : "COPY LINK"}
        </button>
      </div>
    </div>
  );
};
