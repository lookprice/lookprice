import React, { useState } from "react";
import { AlignLeft, Sparkles, Loader2 } from "lucide-react";
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
  const [generatingLang, setGeneratingLang] = useState<"tr" | "en" | null>(null);

  const handleGenerateVipListing = async (targetLang: "tr" | "en") => {
    try {
      setGeneratingLang(targetLang);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/store/ai/generate-real-estate-desc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: formData.title || "",
          type: formData.type || "Konut",
          listing_intent: formData.listing_intent || "sale",
          location: formData.location || formData.kktc_region || "",
          price: formData.price || "",
          currency: formData.currency || "GBP",
          room_count: formData.room_count || "",
          square_meters: formData.square_meters || "",
          sqm_gross: formData.sqm_gross || "",
          kktc_title_type: formData.kktc_title_type || "",
          furnished: formData.furnished,
          in_gated_community: formData.in_gated_community,
          zoning_status: (formData as any).zoning_status || "",
          kaks: (formData as any).kaks || "",
          vat_status: (formData as any).vat_status || "",
          trafo_fee: (formData as any).trafo_fee || "",
          lang: targetLang
        })
      });
      const data = await res.json();
      if (data?.description) {
        setFormData((prev) => ({ ...prev, description: data.description }));
      } else {
        alert(data?.error || "İlan metni üretilemedi.");
      }
    } catch (err) {
      console.error("Real estate AI desc error:", err);
      alert("Yapay zeka ilan metni üretilirken hata oluştu.");
    } finally {
      setGeneratingLang(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 space-y-2 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 gap-2 flex-wrap">
        <span className="text-[11px] font-black uppercase text-slate-900 flex items-center gap-1.5 tracking-wide">
          <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
          5. Detaylı İlan Metni & Yatırım Açıklamaları
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            disabled={generatingLang !== null}
            onClick={() => handleGenerateVipListing("tr")}
            className="text-[10px] font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
            title="Koçan, imar, bölge ve m² bilgilerine göre Türkçe VIP yatırım ilan metni üret"
          >
            {generatingLang === "tr" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span>{generatingLang === "tr" ? "Yazılıyor..." : "✨ VIP İlan Metni Üret (TR)"}</span>
          </button>
          <button
            type="button"
            disabled={generatingLang !== null}
            onClick={() => handleGenerateVipListing("en")}
            className="text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
            title="Generate English ROI & Lifestyle Investment Listing for UK/Foreign Buyers"
          >
            {generatingLang === "en" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span>{generatingLang === "en" ? "Writing..." : "🇬🇧 UK Investor Copy (EN)"}</span>
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <LiteRichEditor
          value={formData.description || ""}
          onChange={(newContent) =>
            setFormData((prev) => ({ ...prev, description: newContent }))
          }
          placeholder="Gayrimenkulün yatırım potansiyeli, konumu, kira çarpanı ve avantajlarını buraya yazın veya üstteki AI butonlarıyla tek tıkla oluşturun..."
          minHeight="140px"
        />
      </div>
    </div>
  );
};
