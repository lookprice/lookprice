import React from "react";
import { Globe, ArrowRight, Settings } from "lucide-react";

interface InfrastructureStepProps {
  lang: string;
  useCustomDomain: boolean;
  setUseCustomDomain: (u: boolean) => void;
  customDomain: string;
  setCustomDomain: (d: string) => void;
  storeSlug: string;
}

export const InfrastructureStep: React.FC<InfrastructureStepProps> = ({
  lang,
  useCustomDomain,
  setUseCustomDomain,
  customDomain,
  setCustomDomain,
  storeSlug,
}) => {
  const isTr = lang === "tr";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-500" />
            {isTr ? "YAYIN BAĞLANTISI" : "PUBLISH LINK"}
          </h3>
        </div>

        <div className="space-y-6">
          {/* LookPrice Slug Link */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isTr ? "Standart Mağaza Linki (Ücretsiz)" : "Standard Store Link (Free)"}
              </label>
              <div
                className={`h-4 w-8 rounded-full flex items-center transition-colors p-0.5 cursor-pointer ${!useCustomDomain ? "bg-indigo-500" : "bg-slate-200"}`}
                onClick={() => setUseCustomDomain(false)}
              >
                <div className={`h-3 w-3 bg-white rounded-full shadow-sm transition-transform ${!useCustomDomain ? "translate-x-4" : "translate-x-0"}`}></div>
              </div>
            </div>
            <div className={`p-4 rounded-2xl border transition-all ${!useCustomDomain ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-100 opacity-50"}`}>
              <div className="flex items-center">
                <span className="text-xs font-bold text-slate-400">lookprice.net/s/</span>
                <span className="text-xs font-black text-slate-900 ml-1">{storeSlug}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Custom Domain Link */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isTr ? "Özel Alan Adı (Premium)" : "Custom Domain (Premium)"}
                </label>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-[8px] font-black tracking-widest">PRO</span>
              </div>
              <div
                className={`h-4 w-8 rounded-full flex items-center transition-colors p-0.5 cursor-pointer ${useCustomDomain ? "bg-indigo-500" : "bg-slate-200"}`}
                onClick={() => setUseCustomDomain(true)}
              >
                <div className={`h-3 w-3 bg-white rounded-full shadow-sm transition-transform ${useCustomDomain ? "translate-x-4" : "translate-x-0"}`}></div>
              </div>
            </div>
            <div className={`p-4 rounded-2xl border transition-all ${useCustomDomain ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100 opacity-50"}`}>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-amber-500" />
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  disabled={!useCustomDomain}
                  placeholder="www.isminiz.com"
                  className="bg-transparent border-none p-0 text-xs font-black text-slate-900 placeholder:text-slate-300 outline-none flex-1"
                />
              </div>
              {useCustomDomain && (
                <div className="mt-4 pt-4 border-t border-amber-100 space-y-2">
                  <p className="text-[9px] font-bold text-amber-800 leading-relaxed">
                    {isTr 
                      ? "Alan adınızı bağlamak için DNS ayarlarınızda @ ve www kayıtlarını IP: 172.67.168.107 adresine yönlendirmeniz gerekmektedir." 
                      : "Point your A record to 172.67.168.107 to link your custom domain."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Settings className="h-4 w-4 text-indigo-500" />
          {isTr ? "SEO & META VERİLERİ" : "SEO & METADATA"}
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? "Google Önizleme" : "Google Preview"}</p>
            </div>
            <p className="text-sm font-bold text-blue-600 truncate">{storeSlug} | {isTr ? "Emlak Portföyü" : "Real Estate Portfolio"}</p>
            <p className="text-[11px] text-emerald-700 truncate">https://lookprice.net/s/{storeSlug}</p>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Kuzey Kıbrıs'ın en seçkin mülklerini ve yatırım fırsatlarını keşfedin. Güvenilir emlak danışmanlığı...</p>
          </div>
        </div>
      </div>
    </div>
  );
};
