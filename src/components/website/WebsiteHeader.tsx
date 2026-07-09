import React from "react";
import { Save } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Phase {
  id: number;
  title: string;
  icon: LucideIcon;
}

interface WebsiteHeaderProps {
  storeName: string;
  lang: string;
  activeStep: number;
  setActiveStep: (step: number) => void;
  phases: Phase[];
  handleSave: () => void;
}

export const WebsiteHeader: React.FC<WebsiteHeaderProps> = ({
  storeName,
  lang,
  activeStep,
  setActiveStep,
  phases,
  handleSave,
}) => {
  const isTr = lang === "tr";

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 uppercase">
            {storeName} PORTFÖY ENGINE
          </h2>
          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-[0.3em] leading-none">
            {isTr ? "GÜVEN ODAKLI ÇIKTI SİSTEMİ" : "TRUST-DRIVEN OUTPUT SYSTEM"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {isTr ? "GÜNCEL DURUM" : "CURRENT STATUS"}
            </p>
            <div className="flex items-center gap-2 justify-end">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                {isTr ? "CLOUDFLARE BAĞLANTISI HAZIR" : "CLOUDFLARE LINK READY"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-slate-900 text-white text-xs font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isTr ? "AYARLARI KAYDET" : "SAVE SETTINGS"}
          </button>
        </div>
      </div>

      {/* Roadmap Visualization */}
      <div className="grid grid-cols-4 gap-4 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
        {phases.map((phase) => (
          <button
            key={phase.id}
            onClick={() => setActiveStep(phase.id)}
            className="relative z-10 flex flex-col items-center gap-3 group"
          >
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                activeStep >= phase.id
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "bg-white border-slate-100 text-slate-300"
              }`}
            >
              <phase.icon className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p
                className={`text-[10px] font-black uppercase tracking-widest ${activeStep >= phase.id ? "text-slate-900" : "text-slate-300"}`}
              >
                {phase.title}
              </p>
              <p
                className={`text-[8px] font-bold uppercase transition-opacity ${activeStep === phase.id ? "opacity-100 text-indigo-500" : "opacity-0"}`}
              >
                {isTr ? "AKTİF FAZ" : "ACTIVE PHASE"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
