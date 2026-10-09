import React from "react";
import { Globe } from "lucide-react";

interface MultiTenancyDomainTabProps {
  configForm: any;
  setConfigForm: React.Dispatch<React.SetStateAction<any>>;
}

export const MultiTenancyDomainTab: React.FC<MultiTenancyDomainTabProps> = ({
  configForm,
  setConfigForm
}) => {
  return (
    <div className="space-y-4 pt-2">
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-sky-500" />
          <h4 className="text-xs font-black text-slate-900 dark:text-white">
            Özel Alan Adı (Custom Domain) Tanımlama
          </h4>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
            Domain Adı (örn. www.markaniz.com)
          </label>
          <input
            type="text"
            placeholder="magaza.com veya www.magaza.com"
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono"
            value={configForm.custom_domain || ""}
            onChange={(e) => setConfigForm({ ...configForm, custom_domain: e.target.value })}
          />
        </div>

        <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-xs space-y-1 text-slate-700 dark:text-slate-300">
          <p className="font-bold text-indigo-700 dark:text-indigo-300">DNS Yönlendirme Bilgileri:</p>
          <p className="font-mono text-[11px]">A Kaydı: @ -&gt; 216.24.57.1</p>
          <p className="font-mono text-[11px]">CNAME Kaydı: www -&gt; lookprice-2bpv.onrender.com</p>
        </div>
      </div>
    </div>
  );
};
