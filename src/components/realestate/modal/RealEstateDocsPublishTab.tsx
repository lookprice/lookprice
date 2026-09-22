import React, { useRef } from "react";
import { FileText, Trash2, Camera, Upload, Plus } from "lucide-react";
import { RealEstateProperty } from "../../../types";

interface RealEstateDocsPublishTabProps {
  formData: Partial<RealEstateProperty>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<RealEstateProperty>>>;
  isOfficeManager: boolean;
  docName: string;
  setDocName: (val: string) => void;
  docCategory: "title_deed" | "dask" | "contract" | "auth_doc";
  setDocCategory: (val: "title_deed" | "dask" | "contract" | "auth_doc") => void;
  selectedDocFile: File | null;
  setSelectedDocFile: (file: File | null) => void;
  handleAddDocument: (e: React.FormEvent) => void;
  handleRemoveDocument: (id: string) => void;
}

export const RealEstateDocsPublishTab: React.FC<RealEstateDocsPublishTabProps> = ({
  formData,
  setFormData,
  isOfficeManager,
  docName,
  setDocName,
  docCategory,
  setDocCategory,
  selectedDocFile,
  setSelectedDocFile,
  handleAddDocument,
  handleRemoveDocument
}) => {
  const docCameraInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2.5">
      {/* Document Management Box */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 flex-wrap gap-2">
          <span className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1.5 tracking-wide">
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            6. Güvenli Resmi Evrak Yönetimi (Tapu, DASK, Sözleşme)
          </span>

          {/* Verified Badge Checkbox */}
          <label className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 cursor-pointer">
            <input
              type="checkbox"
              className="w-3 h-3 rounded text-amber-600 focus:ring-amber-500"
              checked={formData.is_verified || false}
              onChange={(e) =>
                setFormData({ ...formData, is_verified: e.target.checked })
              }
            />
            <span className="text-[11px] font-black text-amber-900">
              ⭐ Doğrulanmış Portföy Rozeti
            </span>
          </label>
        </div>

        {isOfficeManager ? (
          <div className="space-y-2">
            {/* Documents List */}
            <div>
              {!formData.documents || formData.documents.length === 0 ? (
                <div className="text-center py-2 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400 text-xs">
                  Henüz eklenmiş resmi evrak yok.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {formData.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate flex-1">
                        {doc.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {doc.size}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="text-rose-500 p-0.5 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Add Doc Input */}
            <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-200 space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    Belge Türü
                  </label>
                  <select
                    className="w-full px-2 py-1 h-7.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white"
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                  >
                    <option value="title_deed">📋 Tapu Örneği / Title Deed</option>
                    <option value="dask">🛡️ DASK / Sigorta</option>
                    <option value="contract">✍️ Yetki & Aracılık Sözleşmesi</option>
                    <option value="auth_doc">🔑 Diğer Resmî Evrak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    Evrak Adı (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Blok A-3 Tapu Örneği"
                    className="w-full px-2 py-1 h-7.5 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                </div>
              </div>

              <input
                type="file"
                ref={docCameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedDocFile(file);
                    if (!docName)
                      setDocName(file.name.split(".")[0] || "Belge Fotoğrafı");
                  }
                }}
              />

              <div className="flex flex-col sm:flex-row items-center gap-1.5">
                <input
                  type="file"
                  id="document-secure-file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedDocFile(file);
                      if (!docName) setDocName(file.name.split(".")[0]);
                    }
                  }}
                  className="hidden"
                />

                <label
                  htmlFor="document-secure-file"
                  className="w-full sm:flex-1 px-2.5 py-1 border border-dashed border-slate-300 hover:border-indigo-500 rounded-lg bg-white text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  {selectedDocFile ? selectedDocFile.name : "Dosya Seç (PDF, Resim)"}
                </label>

                <button
                  type="button"
                  onClick={() => docCameraInputRef.current?.click()}
                  className="w-full sm:w-auto px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Kamera
                </button>

                <button
                  type="button"
                  onClick={handleAddDocument}
                  disabled={!selectedDocFile && !docName}
                  className="w-full sm:w-auto px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 shadow-2xs disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  Ekle
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Güvenli evrak yönetimi sadece ofis yöneticisi yetkisindedir.
          </p>
        )}
      </div>

      {/* Publication and Marketing Toggles */}
      <div className="bg-slate-900 text-white p-2.5 sm:p-3 rounded-xl space-y-2 shadow-md">
        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
          ⚙️ İlan Yayın & Pazarlama Seçenekleri
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer bg-white/10 px-2 py-1 rounded-lg border border-white/10 hover:bg-white/15 transition-all">
            <input
              type="checkbox"
              checked={!!formData.is_trade_in_available}
              onChange={(e) =>
                setFormData({ ...formData, is_trade_in_available: e.target.checked })
              }
              className="w-3.5 h-3.5 text-indigo-500 rounded border-slate-400"
            />
            <span className="text-[11px] font-bold text-white">Takas Kabul</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-white/10 px-2 py-1 rounded-lg border border-white/10 hover:bg-white/15 transition-all">
            <input
              type="checkbox"
              checked={!!formData.is_on_enrakipsiz}
              onChange={(e) =>
                setFormData({ ...formData, is_on_enrakipsiz: e.target.checked })
              }
              className="w-3.5 h-3.5 text-indigo-500 rounded border-slate-400"
            />
            <span className="text-[11px] font-bold text-white">EnRakipsiz.com</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-white/10 px-2 py-1 rounded-lg border border-white/10 hover:bg-white/15 transition-all">
            <input
              type="checkbox"
              checked={!!formData.auto_post_instagram}
              onChange={(e) =>
                setFormData({ ...formData, auto_post_instagram: e.target.checked })
              }
              className="w-3.5 h-3.5 text-indigo-500 rounded border-slate-400"
            />
            <span className="text-[11px] font-bold text-white">Instagram Otomatik</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/30 hover:bg-rose-500/30 transition-all">
            <input
              type="checkbox"
              checked={Boolean((formData as any).is_discounted)}
              onChange={(e) =>
                setFormData({ ...formData, is_discounted: e.target.checked } as any)
              }
              className="w-3.5 h-3.5 text-rose-500 rounded border-slate-400"
            />
            <span className="text-[11px] font-bold text-rose-200">🔥 Fırsat & Kelepir</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition-all sm:col-span-2">
            <input
              type="checkbox"
              checked={Boolean((formData as any).is_featured)}
              onChange={(e) =>
                setFormData({ ...formData, is_featured: e.target.checked } as any)
              }
              className="w-3.5 h-3.5 text-amber-500 rounded border-slate-400"
            />
            <span className="text-[11px] font-bold text-amber-200">
              ⭐ Öne Çıkan / VIP Portföy
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
