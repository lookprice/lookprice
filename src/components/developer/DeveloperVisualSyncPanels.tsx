import React, { useRef, useState } from "react";
import {
  CheckCircle2,
  Compass,
  Download,
  Eye,
  Home,
  Image as ImageIcon,
  Layers,
  Link2,
  Loader2,
  Star,
  Trash2,
  Upload,
  Waves
} from "lucide-react";
import {
  MediaRoleType,
  UNIT_SHOWCASE_SECTIONS,
  isRenderableImageUrl,
  resolveDisplayImageUrl
} from "./developerProjectUtils";

export interface SectionUploadOptions {
  unit_type_match: string;
  unit_number_match?: string;
  media_role: MediaRoleType;
  category?: string;
  setFirstAsCover?: boolean;
}

interface MasterplanGallerySyncPanelProps {
  project: any;
  uploading: boolean;
  onBatchUploadFiles: (files: FileList, options: SectionUploadOptions) => Promise<void>;
  onBatchAddUrls: (rawUrls: string, options: SectionUploadOptions) => Promise<void>;
  onSetCoverImage: (url: string) => Promise<void>;
  onDeleteMedia: (mediaId: string, mediaName?: string) => void;
  onDirectDownload: (url?: string, rawFileName?: string, fallbackCover?: string) => void;
  onPreviewAsset: (asset: any) => void;
}

export const MasterplanGallerySyncPanel: React.FC<MasterplanGallerySyncPanelProps> = ({
  project,
  uploading,
  onBatchUploadFiles,
  onBatchAddUrls,
  onSetCoverImage,
  onDeleteMedia,
  onDirectDownload,
  onPreviewAsset
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [expanded, setExpanded] = useState(true);

  if (!project) return null;

  const vault: any[] = Array.isArray(project.media_vault) ? project.media_vault : [];
  const masterplanItems = vault.filter((m) => {
    const role = String(m?.media_role || "").toLowerCase();
    const cat = String(m?.category || "").toLowerCase();
    return (
      isRenderableImageUrl(m?.url) &&
      (role === "masterplan" ||
        (m?.type === "photos" && cat.includes("masterplan")) ||
        (role === "photo" && String(m?.name || "").toLowerCase().includes("masterplan")))
    );
  });

  const currentCover = resolveDisplayImageUrl(project.cover_image, "");
  const hasSeparateCover =
    Boolean(currentCover) &&
    isRenderableImageUrl(project.cover_image) &&
    !masterplanItems.some(
      (m) => resolveDisplayImageUrl(m.url, "") === currentCover || m.url === project.cover_image
    );

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlDraft.trim()) return;
    await onBatchAddUrls(urlDraft, {
      unit_type_match: "__COMMON_AREA__",
      media_role: "masterplan",
      category: "Masterplan & Kat Planları",
      setFirstAsCover: !currentCover || String(project.cover_image || "").includes("1BByvpSoIl22UNb4De-Dgna5RyN01_TbD")
    });
    setUrlDraft("");
    setShowUrlInput(false);
  };

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-2.5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-2 text-left cursor-pointer"
        >
          <span className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </span>
          <div>
            <div className="text-xs font-semibold text-slate-950 flex items-center gap-1.5 flex-wrap">
              <span>Masterplan Proje Görselleri & Web Vitrini Senkronizasyonu</span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-indigo-200 text-indigo-800 text-[10px] font-medium">
                {masterplanItems.length + (hasSeparateCover ? 1 : 0)} Görsel
              </span>
            </div>
            <p className="text-[10px] text-slate-600">
              Web sitesindeki Masterplan kartları, Ana Masterplan Görünümü ve Tam Ekran galeri buradan beslenir.
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files.length > 0) {
                await onBatchUploadFiles(e.target.files, {
                  unit_type_match: "__COMMON_AREA__",
                  media_role: "masterplan",
                  category: "Masterplan & Kat Planları",
                  setFirstAsCover:
                    !currentCover || String(project.cover_image || "").includes("1BByvpSoIl22UNb4De-Dgna5RyN01_TbD")
                });
                e.target.value = "";
              }
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            {uploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            <span>+ Çoklu Masterplan Resmi Yükle</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUrlInput((p) => !p)}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Link2 className="w-3 h-3 text-indigo-600" />
            <span>+ URL Ekle</span>
          </button>
        </div>
      </div>

      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-1.5 pt-1">
          <input
            type="text"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="Birden fazla görsel için URL'leri virgülle ayırarak yapıştırın (https://...)"
            className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs text-slate-900"
          />
          <button
            type="submit"
            disabled={uploading}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
          >
            Masterplan'a Ekle
          </button>
        </form>
      )}

      {expanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
          {hasSeparateCover && (
            <div className="rounded-lg bg-white border-2 border-emerald-500 overflow-hidden shadow-2xs flex flex-col justify-between">
              <div
                onClick={() =>
                  onPreviewAsset({
                    name: `${project.name} — Ana Masterplan Kapak Görseli`,
                    category: "Masterplan Ana Kapak",
                    type: "photos",
                    url: project.cover_image,
                    cover: currentCover,
                    projectName: project.name
                  })
                }
                className="relative h-20 bg-slate-100 cursor-pointer overflow-hidden"
              >
                <img
                  src={currentCover}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-semibold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" />
                  <span>Ana Kapak</span>
                </span>
              </div>
              <div className="px-1.5 py-1 flex items-center justify-between gap-1 text-[10px] text-slate-700 bg-white border-t border-slate-100">
                <span className="truncate font-medium">Aktif Kapak</span>
                <button
                  type="button"
                  onClick={() => onDirectDownload(project.cover_image, `${project.name}-kapak.jpg`)}
                  className="p-0.5 rounded hover:bg-emerald-600 hover:text-white text-slate-600 cursor-pointer"
                  title="İndir"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {masterplanItems.map((item, idx) => {
            const thumb = resolveDisplayImageUrl(item.url, currentCover);
            const isCover = thumb === currentCover || item.url === project.cover_image;
            return (
              <div
                key={item.id || idx}
                className={`rounded-lg bg-white overflow-hidden shadow-2xs flex flex-col justify-between border ${
                  isCover ? "border-2 border-emerald-500" : "border-slate-200"
                }`}
              >
                <div
                  onClick={() =>
                    onPreviewAsset({
                      id: item.id,
                      rawName: item.name,
                      name: `${project.name} — ${item.name}`,
                      category: "Masterplan Görseli",
                      type: "photos",
                      url: item.url,
                      cover: thumb,
                      projectName: project.name
                    })
                  }
                  className="relative h-20 bg-slate-100 cursor-pointer overflow-hidden group"
                >
                  <img
                    src={thumb}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isCover ? (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Ana Kapak</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetCoverImage(item.url);
                      }}
                      className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/85 hover:bg-emerald-600 text-white text-[9px] font-medium cursor-pointer"
                      title="Projenin ana web kapağı yap"
                    >
                      Kapak Yap
                    </button>
                  )}
                </div>

                <div className="px-1.5 py-1 flex items-center justify-between gap-1 bg-white border-t border-slate-100">
                  <span className="text-[10px] font-medium text-slate-800 truncate flex-1" title={item.name}>
                    {item.name}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onPreviewAsset({
                          id: item.id,
                          rawName: item.name,
                          name: `${project.name} — ${item.name}`,
                          category: "Masterplan Görseli",
                          type: "photos",
                          url: item.url,
                          cover: thumb,
                          projectName: project.name
                        })
                      }
                      className="p-0.5 rounded hover:bg-indigo-600 hover:text-white text-slate-600 cursor-pointer"
                      title="Önizle"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteMedia(item.id, item.name)}
                      className="p-0.5 rounded hover:bg-rose-600 hover:text-white text-slate-500 cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {masterplanItems.length === 0 && !hasSeparateCover && (
            <div className="col-span-full py-3 px-4 rounded-lg border border-dashed border-indigo-300 bg-white/80 text-center text-[11px] text-slate-600">
              Bu proje için henüz Masterplan galeri görseli eklenmemiş. Yukarıdaki{" "}
              <span className="font-semibold text-indigo-700">+ Çoklu Masterplan Resmi Yükle</span> butonu ile web sitesi görsellerini ekleyebilirsiniz.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface UnitShowcase4SectionSyncPanelProps {
  project: any;
  targetUnitType: string;
  targetUnitNumber?: string;
  compactTitle?: string;
  uploading: boolean;
  onBatchUploadFiles: (files: FileList, options: SectionUploadOptions) => Promise<void>;
  onBatchAddUrls: (rawUrls: string, options: SectionUploadOptions) => Promise<void>;
  onDeleteMedia: (mediaId: string, mediaName?: string) => void;
  onDirectDownload: (url?: string, rawFileName?: string, fallbackCover?: string) => void;
  onPreviewAsset: (asset: any) => void;
}

export const UnitShowcase4SectionSyncPanel: React.FC<UnitShowcase4SectionSyncPanelProps> = ({
  project,
  targetUnitType,
  targetUnitNumber,
  compactTitle,
  uploading,
  onBatchUploadFiles,
  onBatchAddUrls,
  onDeleteMedia,
  onDirectDownload,
  onPreviewAsset
}) => {
  const [activeUrlRole, setActiveUrlRole] = useState<string | null>(null);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!project) return null;

  const vault: any[] = Array.isArray(project.media_vault) ? project.media_vault : [];
  const normType = String(targetUnitType || "").trim().toLowerCase();
  const normUnitNo = String(targetUnitNumber || "").trim().toLowerCase();

  const getSectionItems = (role: "exterior" | "interior" | "floorplan" | "lifestyle") => {
    return vault.filter((m) => {
      if (!isRenderableImageUrl(m?.url)) return false;
      const mRole = String(m?.media_role || "").toLowerCase();
      const mTypeMatch = String(m?.unit_type_match || "").trim().toLowerCase();
      const mUnitMatch = String(m?.unit_number_match || "").trim().toLowerCase();

      if (mRole !== role) return false;

      if (normUnitNo) {
        return mUnitMatch === normUnitNo;
      }

      if (role === "lifestyle") {
        // Sahil & Havuz can belong to this unit type OR shared project common areas
        return (
          !mUnitMatch &&
          (mTypeMatch === normType ||
            !mTypeMatch ||
            mTypeMatch === "__common_area__" ||
            mTypeMatch === "common_areas" ||
            mTypeMatch === "all")
        );
      }

      return !mUnitMatch && mTypeMatch === normType;
    });
  };

  const getSectionIcon = (role: "exterior" | "interior" | "floorplan" | "lifestyle") => {
    switch (role) {
      case "exterior":
        return <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />;
      case "interior":
        return <Home className="w-3.5 h-3.5 text-amber-600" />;
      case "floorplan":
        return <Compass className="w-3.5 h-3.5 text-sky-600" />;
      case "lifestyle":
        return <Waves className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div>
          <h5 className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
            <span>
              {compactTitle ||
                `Web Vitrini 4 Bölüm Görselleri (${targetUnitType} — Seçili Bağımsız Bölüm Vitrini ile Senkron)`}
            </span>
          </h5>
          <p className="text-[10px] text-slate-600">
            Web sitesindeki Dış Cephe, İç Mekan, 3B Kat Planı ve Sahil & Havuz sekmeleri için her bölüme birden fazla resim yükleyebilirsiniz.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {UNIT_SHOWCASE_SECTIONS.map((sec) => {
          const items = getSectionItems(sec.role);
          const isUrlOpen = activeUrlRole === sec.role;
          const uploadUnitMatch =
            sec.role === "lifestyle" && !normUnitNo && !normType
              ? "__COMMON_AREA__"
              : targetUnitType || "__COMMON_AREA__";

          return (
            <div
              key={sec.role}
              className="rounded-xl bg-white border border-slate-200 p-2.5 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getSectionIcon(sec.role)}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span>{sec.label}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                          {items.length}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{sec.shortDesc}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      ref={(el) => {
                        inputRefs.current[sec.role] = el;
                      }}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          await onBatchUploadFiles(e.target.files, {
                            unit_type_match: uploadUnitMatch,
                            unit_number_match: targetUnitNumber,
                            media_role: sec.role,
                            category: sec.defaultCategory
                          });
                          e.target.value = "";
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => inputRefs.current[sec.role]?.click()}
                      className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <Upload className="w-3 h-3" />
                      <span>+ Çoklu Resim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveUrlRole((prev) => (prev === sec.role ? null : sec.role))}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Link2 className="w-3 h-3" />
                      <span>URL</span>
                    </button>
                  </div>
                </div>

                {isUrlOpen && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={urlInputs[sec.role] || ""}
                      onChange={(e) =>
                        setUrlInputs((prev) => ({ ...prev, [sec.role]: e.target.value }))
                      }
                      placeholder={`${sec.label} görsel URL (virgülle çoklu)...`}
                      className="flex-1 px-2 py-1 bg-slate-50 border border-indigo-300 rounded-lg text-[11px] text-slate-900"
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={async () => {
                        const val = (urlInputs[sec.role] || "").trim();
                        if (!val) return;
                        await onBatchAddUrls(val, {
                          unit_type_match: uploadUnitMatch,
                          unit_number_match: targetUnitNumber,
                          media_role: sec.role,
                          category: sec.defaultCategory
                        });
                        setUrlInputs((prev) => ({ ...prev, [sec.role]: "" }));
                        setActiveUrlRole(null);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium cursor-pointer whitespace-nowrap"
                    >
                      Ekle
                    </button>
                  </div>
                )}

                {items.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {items.map((img, idx) => {
                      const thumb = resolveDisplayImageUrl(img.url, project.cover_image);
                      const isInheritedCommon =
                        sec.role === "lifestyle" &&
                        (!img.unit_type_match ||
                          img.unit_type_match === "__COMMON_AREA__" ||
                          img.unit_type_match === "COMMON_AREAS");
                      return (
                        <div
                          key={img.id || idx}
                          className="rounded-lg border border-slate-200 overflow-hidden bg-white flex flex-col justify-between group"
                        >
                          <div
                            onClick={() =>
                              onPreviewAsset({
                                id: img.id,
                                rawName: img.name,
                                name: `${targetUnitType} — ${sec.label}: ${img.name}`,
                                category: `${sec.label} Vitrin Görseli`,
                                type: "photos",
                                url: img.url,
                                cover: thumb,
                                projectName: project.name
                              })
                            }
                            className="relative h-16 bg-slate-100 cursor-pointer overflow-hidden"
                          >
                            <img
                              src={thumb}
                              alt={img.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isInheritedCommon && (
                              <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-emerald-900/80 text-white text-[8px] font-medium">
                                Ortak Alan
                              </span>
                            )}
                          </div>
                          <div className="px-1.5 py-1 flex items-center justify-between gap-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-700 truncate flex-1" title={img.name}>
                              {img.name}
                            </span>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  onDirectDownload(img.url, img.name, project.cover_image)
                                }
                                title="İndir"
                                className="p-0.5 rounded text-slate-500 hover:bg-emerald-600 hover:text-white cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteMedia(img.id, img.name)}
                                title="Sil"
                                className="p-0.5 rounded text-slate-400 hover:bg-rose-600 hover:text-white cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-2.5 px-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 text-center text-[10px] text-slate-500">
                    {sec.label} için henüz özel görsel eklenmemiş.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
