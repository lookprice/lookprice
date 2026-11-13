import React from "react";
import {
  X,
  Play,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Download
} from "lucide-react";

interface DeveloperMediaLightboxModalProps {
  previewAsset: any | null;
  setPreviewAsset: React.Dispatch<React.SetStateAction<any | null>>;
  downloadingMedia: boolean;
  onDeleteMediaFromProject: (mediaId: string, mediaName?: string) => void;
  onDirectLocalDownload: (url?: string, rawFileName?: string, fallbackCover?: string) => void;
}

export const DeveloperMediaLightboxModal: React.FC<DeveloperMediaLightboxModalProps> = ({
  previewAsset,
  setPreviewAsset,
  downloadingMedia,
  onDeleteMediaFromProject,
  onDirectLocalDownload
}) => {
  if (!previewAsset) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3"
      onClick={() => setPreviewAsset(null)}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-50 border-b border-slate-200 text-slate-900 px-4 py-3 flex items-center justify-between">
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-slate-950">
              {previewAsset.name}
            </h4>
            <p className="text-[11px] text-slate-600">
              {previewAsset.projectName} · {previewAsset.category}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewAsset(null)}
            className="p-1.5 text-slate-500 hover:text-slate-950 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {previewAsset.url &&
          (previewAsset.url.endsWith(".mp4") ||
            previewAsset.url.endsWith(".mov") ||
            previewAsset.url.endsWith(".webm") ||
            previewAsset.url.startsWith("/api/storage/")) &&
          previewAsset.type === "video" ? (
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200 flex items-center justify-center">
              <video
                src={previewAsset.url}
                controls
                autoPlay
                className="w-full max-h-[68vh] object-contain"
              />
            </div>
          ) : (
            previewAsset.cover && (
              <div className="w-full max-h-[70vh] min-h-[340px] rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 relative flex items-center justify-center p-2">
                <img
                  src={previewAsset.cover}
                  alt={previewAsset.name}
                  className="max-h-[66vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
                />
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-white/95 text-slate-950 text-[11px] font-medium border border-slate-200 shadow-xs">
                  {previewAsset.projectName} — {previewAsset.category}
                </div>
              </div>
            )
          )}

          {Array.isArray(previewAsset.gallery) && previewAsset.gallery.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase text-slate-500">
                Etkinlik Medya Galerisi ({previewAsset.gallery.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {previewAsset.gallery.map((gItem: any) => (
                  <button
                    key={gItem.id}
                    type="button"
                    onClick={() =>
                      setPreviewAsset({
                        ...previewAsset,
                        url: gItem.url,
                        type: gItem.type === "video" ? "video" : "photos",
                        cover: gItem.type === "image" ? gItem.url : previewAsset.cover
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-800 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {gItem.type === "video" ? (
                      <Play className="w-3 h-3 text-amber-500" />
                    ) : (
                      <ImageIcon className="w-3 h-3 text-indigo-600" />
                    )}
                    <span>{gItem.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Proje Klasöründe Kayıtlı</span>
            </span>
            <div className="flex items-center gap-2">
              {(previewAsset.id || previewAsset.rawName) && (
                <button
                  type="button"
                  onClick={() =>
                    onDeleteMediaFromProject(previewAsset.id, previewAsset.rawName)
                  }
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sil</span>
                </button>
              )}

              {(previewAsset.url || previewAsset.cover) && (
                <button
                  type="button"
                  disabled={downloadingMedia}
                  onClick={() =>
                    onDirectLocalDownload(
                      previewAsset.url || previewAsset.cover,
                      previewAsset.rawName || previewAsset.name,
                      previewAsset.cover
                    )
                  }
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Yerel Dosyalara İndir</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
