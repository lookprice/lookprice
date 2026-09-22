import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { ImageGallery } from "../../ImageGallery";
import { MultiImageUploader } from "../../MultiImageUploader";
import { RealEstateProperty } from "../../../types";

interface RealEstateMediaTabProps {
  formData: Partial<RealEstateProperty>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<RealEstateProperty>>>;
}

export const RealEstateMediaTab: React.FC<RealEstateMediaTabProps> = ({
  formData,
  setFormData
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <span className="text-[11px] font-black uppercase text-indigo-950 flex items-center gap-1.5 tracking-wide">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
          4. Portföy Fotoğrafları & Medya Galerisi
        </span>
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
          {formData.images?.length || 0} Görsel Yüklü
        </span>
      </div>

      {/* Uploader & Gallery */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600">
            Görselleri Sırala veya Yeni Ekle
          </span>
          <MultiImageUploader
            onImagesUploaded={(urls) =>
              setFormData({
                ...formData,
                images: [...(formData.images || []), ...urls]
              })
            }
          />
        </div>

        <ImageGallery
          images={formData.images || []}
          onChange={(images) => setFormData({ ...formData, images })}
          isEditable={true}
        />
      </div>

      {/* Virtual Tour URL */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
        <div className="sm:col-span-8">
          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
            360° Sanal Tur / Video Linki
          </label>
          <input
            type="url"
            placeholder="https://my.matterport.com/show/?m=... veya YouTube linki"
            className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
            value={formData.virtual_tour_url || ""}
            onChange={(e) =>
              setFormData({ ...formData, virtual_tour_url: e.target.value })
            }
          />
        </div>
        <div className="sm:col-span-4 flex items-center pt-3 sm:pt-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={!!formData.ai_tour_enabled}
              onChange={(e) =>
                setFormData({ ...formData, ai_tour_enabled: e.target.checked })
              }
              className="w-3.5 h-3.5 text-indigo-600 rounded"
            />
            <span>✨ AI Sanal Asistan Aktif</span>
          </label>
        </div>
      </div>
    </div>
  );
};
