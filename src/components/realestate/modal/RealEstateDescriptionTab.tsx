import React from "react";
import { AlignLeft } from "lucide-react";
import { LiteRichEditor } from "../../LiteRichEditor";
import { RealEstateProperty } from "../../../types";

interface RealEstateDescriptionTabProps {
  formData: Partial<RealEstateProperty>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<RealEstateProperty>>>;
}

export const RealEstateDescriptionTab: React.FC<RealEstateDescriptionTabProps> = ({
  formData,
  setFormData
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 space-y-2 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <span className="text-[11px] font-black uppercase text-slate-900 flex items-center gap-1.5 tracking-wide">
          <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
          5. Detaylı İlan Metni & Yatırım Açıklamaları
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase">
          UK & TR Yatırımcı Odaklı
        </span>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <LiteRichEditor
          value={formData.description || ""}
          onChange={(newContent) =>
            setFormData((prev) => ({ ...prev, description: newContent }))
          }
          placeholder="Gayrimenkulün yatırım potansiyeli, konumu, kira çarpanı ve avantajlarını buraya yazın..."
          minHeight="140px"
        />
      </div>
    </div>
  );
};
