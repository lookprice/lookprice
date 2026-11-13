import React from "react";
import { Calculator } from "lucide-react";
import { formatGbp, getSectionBandTheme } from "./developerProjectUtils";

interface DeveloperCompareTabProps {
  projects: any[];
  compareLeftId: number;
  setCompareLeftId: (id: number) => void;
  compareRightId: number;
  setCompareRightId: (id: number) => void;
  simulatorPriceGbp: number;
  setSimulatorPriceGbp: (price: number) => void;
  leftCompareProject: any;
  rightCompareProject: any;
  onPrintProjectSheet: (project: any) => void;
}

export const DeveloperCompareTab: React.FC<DeveloperCompareTabProps> = ({
  projects,
  compareLeftId,
  setCompareLeftId,
  compareRightId,
  setCompareRightId,
  simulatorPriceGbp,
  setSimulatorPriceGbp,
  leftCompareProject,
  rightCompareProject,
  onPrintProjectSheet
}) => {
  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Tüm Projeler Karşılaştırma Tablosu ({projects.length} Proje)
            </h3>
            <p className="text-[11px] text-slate-500">
              Tüm projelerin bölge, teslim tarihi, inşaat ilerlemesi, stok ve ödeme planı özeti
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-200 text-[10px] font-semibold uppercase">
                <th className="py-2 px-2.5 rounded-tl-lg">Proje</th>
                <th className="py-2 px-2.5">Bölge</th>
                <th className="py-2 px-2.5">Teslim & İnşaat</th>
                <th className="py-2 px-2.5">Müsait / Toplam</th>
                <th className="py-2 px-2.5">Başlangıç Fiyatı</th>
                <th className="py-2 px-2.5">Peşinat & Vade</th>
                <th className="py-2 px-2.5 rounded-tr-lg text-right">Bilgi Formu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {projects.map((p, pIdx) => {
                const rowTheme = getSectionBandTheme(pIdx);
                return (
                  <tr key={p.id} className={`transition-colors ${rowTheme.rowBg}`}>
                    <td className="py-2 px-2.5 font-semibold text-slate-900 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-medium mr-1.5 ${rowTheme.subBadgeBg}`}
                      >
                        #{pIdx + 1}
                      </span>
                      {p.folder_prefix || p.name}
                    </td>
                    <td className="py-2 px-2.5 text-slate-700 font-normal">{p.sub_region}</td>
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      <span className="font-medium text-slate-900">{p.completion_date}</span>
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                        %{p.construction_progress}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 font-mono tabular-nums whitespace-nowrap">
                      <strong className="text-emerald-700 font-semibold">{p.available_units}</strong> /{" "}
                      {p.total_units}
                    </td>
                    <td className="py-2 px-2.5 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatGbp(p.starting_price)}
                    </td>
                    <td className="py-2 px-2.5 text-slate-700 whitespace-nowrap">
                      %{p.payment_plan?.down_payment_percent || 35} Peşinat ·{" "}
                      {p.payment_plan?.installment_months || 36} Ay (%0 Faiz)
                    </td>
                    <td className="py-2 px-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onPrintProjectSheet(p)}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-600 text-slate-800 hover:text-white border border-slate-300 rounded text-[10px] font-medium cursor-pointer whitespace-nowrap transition-colors"
                      >
                        Bilgi Formu
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-950">
            İkili Proje & Ödeme Planı Simülatörü
          </h3>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <select
              value={compareLeftId}
              onChange={(e) => setCompareLeftId(Number(e.target.value))}
              className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-medium text-indigo-950 shrink-0"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  1. Proje: {p.name}
                </option>
              ))}
            </select>
            <span className="text-xs font-semibold text-slate-400 shrink-0">VS</span>
            <select
              value={compareRightId}
              onChange={(e) => setCompareRightId(Number(e.target.value))}
              className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-950 shrink-0"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  2. Proje: {p.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 shrink-0">
              <Calculator className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-[10px] font-medium text-slate-600 whitespace-nowrap">
                Bütçe (GBP):
              </span>
              <input
                type="number"
                value={simulatorPriceGbp}
                onChange={(e) => setSimulatorPriceGbp(Number(e.target.value) || 150000)}
                className="w-24 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        {leftCompareProject && rightCompareProject && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { proj: leftCompareProject, badge: "bg-indigo-600 text-white" },
              { proj: rightCompareProject, badge: "bg-amber-500 text-slate-950" }
            ].map(({ proj, badge }, i) => {
              const downPct = Number(proj.payment_plan?.down_payment_percent) || 35;
              const months = Number(proj.payment_plan?.installment_months) || 36;
              const downAmount = Math.round((simulatorPriceGbp * downPct) / 100);
              const remainAmount = simulatorPriceGbp - downAmount;
              const monthlyInstallment = Math.round(remainAmount / Math.max(1, months));
              const simTheme = getSectionBandTheme(i);

              return (
                <div
                  key={i}
                  className={`rounded-xl border border-l-4 p-3 space-y-2.5 ${simTheme.cardBg}`}
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${badge}`}>
                        {proj.folder_prefix}
                      </span>
                      <h4 className="text-base font-semibold text-slate-950 mt-1">{proj.name}</h4>
                      <p className="text-[11px] text-slate-600 font-normal">
                        {proj.sub_region} • Teslim: {proj.completion_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-medium text-slate-500">Başlangıç</div>
                      <div className="text-base font-semibold text-slate-900 font-mono">
                        {formatGbp(proj.starting_price)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-indigo-200 text-slate-900 rounded-xl p-2.5 space-y-1.5">
                    <div className="text-[10px] font-semibold text-indigo-900 uppercase">
                      {formatGbp(simulatorPriceGbp)} İçin Ödeme Planı Hesaplaması
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                        <div className="text-[9px] text-slate-600 font-medium">
                          Peşinat (%{downPct})
                        </div>
                        <div className="text-xs font-semibold text-slate-950 font-mono">
                          {formatGbp(downAmount)}
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                        <div className="text-[9px] text-slate-600 font-medium">
                          Kalan (%{100 - downPct})
                        </div>
                        <div className="text-xs font-semibold text-indigo-700 font-mono">
                          {formatGbp(remainAmount)}
                        </div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5">
                        <div className="text-[9px] text-emerald-800 font-medium">
                          {months} Ay Taksit
                        </div>
                        <div className="text-xs font-semibold text-emerald-900 font-mono">
                          {formatGbp(monthlyInstallment)}/ay
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
