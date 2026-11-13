import React from "react";
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  Edit3,
  Eye,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Layers,
  Loader2,
  MapPin,
  Play,
  Printer,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  Video,
  X
} from "lucide-react";
import {
  extractFacilityItems,
  formatGbp,
  getSectionBandTheme,
  getStatusBadgeMeta,
  getYouTubeThumbnailUrl,
  InventoryViewMode,
  isDownloadableAssetUrl,
  isYouTubeUrl,
  MediaRoleType,
  ProjectSubTab,
  resolveDisplayImageUrl
} from "./developerProjectUtils";
import {
  MasterplanGallerySyncPanel,
  SectionUploadOptions,
  UnitShowcase4SectionSyncPanel
} from "./DeveloperVisualSyncPanels";

interface DeveloperShowcaseTabProps {
  projects: any[];
  activeProjectDetail: any;
  projectViewMode: "grid" | "single";
  projectSubTab: ProjectSubTab;
  setProjectSubTab: (t: ProjectSubTab) => void;
  isProjectFormOpen: boolean;
  setIsProjectFormOpen: (v: boolean) => void;
  editingProjectId: number | null;
  setEditingProjectId: (v: number | null) => void;
  onSelectSingleProject: (proj: any, openSingleView?: boolean) => void;
  onOpenEditProject: (proj: any) => void;
  renderProjectEditForm: (titleLabel: string) => React.ReactNode;
  onPrintProjectSheet: (proj: any) => void;
  isAddMediaOpen: boolean;
  setIsAddMediaOpen: (v: boolean) => void;
  newMediaForm: any;
  setNewMediaForm: React.Dispatch<React.SetStateAction<any>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDeviceFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingLocalFile: boolean;
  isCustomFolderMode: boolean;
  setIsCustomFolderMode: React.Dispatch<React.SetStateAction<boolean>>;
  customFolderName: string;
  setCustomFolderName: (v: string) => void;
  availableProjectFolders: string[];
  existingDuplicateFile: any;
  duplicateConflictMode: "overwrite" | "new_version";
  setDuplicateConflictMode: (m: "overwrite" | "new_version") => void;
  onAddMediaToProject: (e: React.FormEvent) => void;
  onOpenUploadForTarget: (
    targetMatch: string,
    role: MediaRoleType,
    defaultCategory?: string
  ) => void;
  uploadingSectionMedia: boolean;
  pendingBatchFiles: Array<{ name: string; url: string; type: string }>;
  setPendingBatchFiles: React.Dispatch<
    React.SetStateAction<Array<{ name: string; url: string; type: string }>>
  >;
  onBatchUploadSectionMedia: (files: FileList, options: SectionUploadOptions) => Promise<void>;
  onBatchAddUrlsSectionMedia: (rawUrls: string, options: SectionUploadOptions) => Promise<void>;
  onSetProjectCoverImage: (url: string) => Promise<void>;
  projectPropertyTypes: any[];
  selectedProjectUnits: any[];
  selectedProjectCommonAreaMedia: any[];
  activePropertyTypeKey: string;
  activePropertyType: any;
  setSelectedPropertyTypeKey: (k: string) => void;
  setUnitTypeFilter: (t: string) => void;
  unitStatusFilter: string;
  setUnitStatusFilter: (s: string) => void;
  setInventoryViewMode: (m: InventoryViewMode) => void;
  setActiveTab: (t: any) => void;
  setSelectedProjectId: (id: number) => void;
  propertyTypeLayer: "overview" | "photos" | "videos" | "floorplans" | "units";
  setPropertyTypeLayer: (l: "overview" | "photos" | "videos" | "floorplans" | "units") => void;
  revisingUnit: any | null;
  setRevisingUnit: React.Dispatch<React.SetStateAction<any | null>>;
  renderUnitRevisionForm: () => React.ReactNode;
  onSharePropertyTypePackage: (pt: any, mode: "copy" | "whatsapp") => void;
  onShareCommonAreasPackage: (mode: "copy" | "whatsapp") => void;
  onShareMediaAsset: (item: any, mode: "copy" | "whatsapp") => void;
  onDeleteUnit: (unitId: number, unitNoLabel?: string) => void;
  onDeleteUnitGroup: (unitIds: number[], groupLabel: string) => void;
  selectedPhotoIds: string[];
  setSelectedPhotoIds: React.Dispatch<React.SetStateAction<string[]>>;
  downloadingMedia: boolean;
  onBulkDownloadMedia: (items: any[]) => void;
  onBulkDeleteMediaFromProject: (items: any[]) => void;
  onDirectLocalDownload: (url?: string, rawFileName?: string, fallbackCover?: string) => void;
  onDeleteMediaFromProject: (mediaId: string, mediaName?: string) => void;
  setPreviewAsset: (asset: any) => void;
  newCommonSpecForm: { facility_group: string; spec_text: string };
  setNewCommonSpecForm: React.Dispatch<React.SetStateAction<{ facility_group: string; spec_text: string }>>;
  onAddCommonAreaSpec: (e: React.FormEvent) => void;
  mediaCategoryFilter: string;
  setMediaCategoryFilter: (f: string) => void;
  projectFolderTabs: string[];
  filteredProjectMedia: any[];
}

export const DeveloperShowcaseTab: React.FC<DeveloperShowcaseTabProps> = ({
  projects,
  activeProjectDetail,
  projectViewMode,
  projectSubTab,
  setProjectSubTab,
  isProjectFormOpen,
  setIsProjectFormOpen,
  editingProjectId,
  setEditingProjectId,
  onSelectSingleProject,
  onOpenEditProject,
  renderProjectEditForm,
  onPrintProjectSheet,
  isAddMediaOpen,
  setIsAddMediaOpen,
  newMediaForm,
  setNewMediaForm,
  fileInputRef,
  onDeviceFileSelect,
  uploadingLocalFile,
  isCustomFolderMode,
  setIsCustomFolderMode,
  customFolderName,
  setCustomFolderName,
  availableProjectFolders,
  existingDuplicateFile,
  duplicateConflictMode,
  setDuplicateConflictMode,
  onAddMediaToProject,
  onOpenUploadForTarget,
  uploadingSectionMedia,
  pendingBatchFiles,
  setPendingBatchFiles,
  onBatchUploadSectionMedia,
  onBatchAddUrlsSectionMedia,
  onSetProjectCoverImage,
  projectPropertyTypes,
  selectedProjectUnits,
  selectedProjectCommonAreaMedia,
  activePropertyTypeKey,
  activePropertyType,
  setSelectedPropertyTypeKey,
  setUnitTypeFilter,
  unitStatusFilter,
  setUnitStatusFilter,
  setInventoryViewMode,
  setActiveTab,
  setSelectedProjectId,
  propertyTypeLayer,
  setPropertyTypeLayer,
  revisingUnit,
  setRevisingUnit,
  renderUnitRevisionForm,
  onSharePropertyTypePackage,
  onShareCommonAreasPackage,
  onShareMediaAsset,
  onDeleteUnit,
  onDeleteUnitGroup,
  selectedPhotoIds,
  setSelectedPhotoIds,
  downloadingMedia,
  onBulkDownloadMedia,
  onBulkDeleteMediaFromProject,
  onDirectLocalDownload,
  onDeleteMediaFromProject,
  setPreviewAsset,
  newCommonSpecForm,
  setNewCommonSpecForm,
  onAddCommonAreaSpec,
  mediaCategoryFilter,
  setMediaCategoryFilter,
  projectFolderTabs,
  filteredProjectMedia
}) => {
  return (
    <div className="space-y-2.5">
      {/* MODE A: ALL PROJECT FOLDERS DIRECTORY GRID */}
      {projectViewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {projects.map((proj) => {
            const isSelected = Number(activeProjectDetail?.id) === Number(proj.id);
            const isEditingThisProject =
              isProjectFormOpen && Number(editingProjectId) === Number(proj.id);
            const soldPct = Math.round(
              ((proj.sold_units || 0) / Math.max(1, proj.total_units || 1)) * 100
            );
            const fileCount = Array.isArray(proj.media_vault) ? proj.media_vault.length : 0;

            return (
              <div
                key={proj.id}
                className={`rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-600 ring-2 ring-indigo-600/20 bg-white text-slate-950 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-900"
                } ${isEditingThisProject ? "sm:col-span-2 lg:col-span-3" : ""}`}
              >
                <div>
                  <div
                    onClick={() => onSelectSingleProject(proj)}
                    className="relative h-28 w-full overflow-hidden bg-slate-100 cursor-pointer"
                  >
                    <img
                      src={resolveDisplayImageUrl(
                        proj.cover_image,
                        "/assets/images/cyprus_sunlit_resort_hero_1794578840052.jpg"
                      )}
                      alt={proj.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                      <span className="px-2 py-0.5 rounded bg-white/95 text-slate-950 font-mono text-[10px] font-semibold border border-slate-200 truncate">
                        {proj.folder_prefix || proj.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500 text-slate-950 shrink-0">
                        İnşaat %{proj.construction_progress}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white leading-tight truncate">
                          {proj.name}
                        </h3>
                        <p className="text-[11px] text-slate-200 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">
                            {proj.sub_region} · Teslim: {proj.completion_date}
                          </span>
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-amber-300 shrink-0 ml-1">
                        {formatGbp(proj.starting_price)}+
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 space-y-1.5">
                    <p className="text-[11px] text-slate-600 line-clamp-1">{proj.concept_tagline}</p>
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-emerald-800">{proj.available_units} Müsait</span>
                      <span className="text-amber-800">{proj.optioned_units} Opsiyon</span>
                      <span className="text-slate-600">%{soldPct} Satıldı</span>
                    </div>
                  </div>
                </div>

                <div className="px-2.5 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectSingleProject(proj)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <FolderOpen className="w-3 h-3" />
                    <span>Proje Medya & Tipleri Aç ({fileCount})</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEditingThisProject) {
                          setIsProjectFormOpen(false);
                          setEditingProjectId(null);
                        } else {
                          onOpenEditProject(proj);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap border ${
                        isEditingThisProject
                          ? "bg-indigo-950 text-white border-indigo-950"
                          : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300"
                      }`}
                    >
                      <Edit3 className="w-3 h-3 text-indigo-600" />
                      <span>{isEditingThisProject ? "Düzenlemeyi Kapat" : "Düzenle"}</span>
                    </button>
                  </div>
                </div>

                {isEditingThisProject && (
                  <div className="p-2.5 bg-indigo-50/60 border-t-2 border-indigo-400">
                    {renderProjectEditForm(`Projeyi Düzenle: ${proj.name}`)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODE B: STRICTLY ISOLATED SINGLE-PROJECT WORKSPACE */}
      {projectViewMode === "single" && activeProjectDetail && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3">
          {/* SINGLE-ROW PROJECT HEADER & COMPACT ACTION TOOLBAR */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <img
                src={resolveDisplayImageUrl(
                  activeProjectDetail.cover_image,
                  "/assets/images/cyprus_sunlit_resort_hero_1794578840052.jpg"
                )}
                alt={activeProjectDetail.name}
                className="w-14 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded text-[10px] font-mono font-semibold shrink-0">
                    {activeProjectDetail.folder_prefix || activeProjectDetail.project_code}
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-950 truncate">
                    {activeProjectDetail.name}
                  </h3>
                  <span className="text-[11px] text-slate-600 font-normal truncate">
                    · {activeProjectDetail.sub_region} · Teslim: {activeProjectDetail.completion_date} · İnşaat: %
                    {activeProjectDetail.construction_progress}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                  {activeProjectDetail.concept_tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => onOpenUploadForTarget("COMMON_AREAS", "photo")}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Upload className="w-3 h-3" />
                <span>+ Medya Yükle</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (
                    isProjectFormOpen &&
                    Number(editingProjectId) === Number(activeProjectDetail.id)
                  ) {
                    setIsProjectFormOpen(false);
                    setEditingProjectId(null);
                  } else {
                    onOpenEditProject(activeProjectDetail);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 border ${
                  isProjectFormOpen && Number(editingProjectId) === Number(activeProjectDetail.id)
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300"
                }`}
              >
                <Edit3 className="w-3 h-3 text-slate-700" />
                <span>Düzenle</span>
              </button>

              <button
                type="button"
                onClick={() => onPrintProjectSheet(activeProjectDetail)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-medium cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Printer className="w-3 h-3" />
                <span>Bilgi Formu</span>
              </button>
            </div>
          </div>

          {isProjectFormOpen &&
            Number(editingProjectId) === Number(activeProjectDetail.id) &&
            renderProjectEditForm(`Projeyi Düzenle: ${activeProjectDetail.name}`)}

          <MasterplanGallerySyncPanel
            project={activeProjectDetail}
            uploading={uploadingSectionMedia}
            onBatchUploadFiles={onBatchUploadSectionMedia}
            onBatchAddUrls={onBatchAddUrlsSectionMedia}
            onSetCoverImage={onSetProjectCoverImage}
            onDeleteMedia={onDeleteMediaFromProject}
            onDirectDownload={onDirectLocalDownload}
            onPreviewAsset={setPreviewAsset}
          />

          {/* CENTERED VIEWPORT-FIT MODAL FOR FILE / MEDIA UPLOAD & MATCHING */}
          {isAddMediaOpen && (
            <div
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3"
              onClick={() => setIsAddMediaOpen(false)}
            >
              <form
                onSubmit={onAddMediaToProject}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl p-4 bg-white text-slate-900 rounded-2xl border-2 border-emerald-500 shadow-2xl space-y-3"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-indigo-600">
                      PROJE MEDYA & DOKÜMAN EŞLEŞTİRME STÜDYOSU
                    </span>
                    <h4 className="text-sm font-semibold text-slate-950 flex items-center gap-1.5 mt-0.5">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span>
                        {activeProjectDetail.name} — Medya, Kat Çizimi veya Ortak Alan Dosyası Ekle
                      </span>
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddMediaOpen(false)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Kapat</span>
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-700 font-medium uppercase tracking-wider mb-1">
                        1. Eşleştirilecek Mülk Tipi veya Ortak Alan *
                      </label>
                      <select
                        value={
                          newMediaForm.unit_type_match === "COMMON_AREAS"
                            ? "__COMMON_AREA__"
                            : newMediaForm.unit_type_match
                        }
                        onChange={(e) =>
                          setNewMediaForm({
                            ...newMediaForm,
                            unit_type_match: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-medium cursor-pointer"
                      >
                        <option value="__COMMON_AREA__">Ortak Alanlar & Sosyal Tesisler</option>
                        {projectPropertyTypes.map((pt) => (
                          <option key={pt.unit_type} value={pt.unit_type}>
                            Mülk Tipi: {pt.unit_type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-700 font-medium uppercase tracking-wider mb-1">
                        2. Medya Türü Seçin *
                      </label>
                      <select
                        value={newMediaForm.media_role}
                        onChange={(e) =>
                          setNewMediaForm({
                            ...newMediaForm,
                            media_role: e.target.value as MediaRoleType
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-medium cursor-pointer"
                      >
                        <option value="exterior">Vitrin: Dış Cephe (Web Senkron)</option>
                        <option value="interior">Vitrin: İç Mekan (Web Senkron)</option>
                        <option value="floorplan">Vitrin: 3B Kat Planı (Web Senkron)</option>
                        <option value="lifestyle">Vitrin: Sahil & Havuz (Web Senkron)</option>
                        <option value="masterplan">Ana Masterplan Görseli (Kapak & Galeri)</option>
                        <option value="photo">Genel Görsel / Render</option>
                        <option value="video">Tanıtım Videosu</option>
                        <option value="document">Katalog / PDF Dosya</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-700 font-medium uppercase tracking-wider mb-1">
                        3. Bilgisayar veya Mobilden Dosya Seç (Çoklu Destekli)
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={onDeviceFileSelect}
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.mov,.dwg,.xlsx,.xls,.doc,.docx,.zip"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLocalFile}
                        className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
                      >
                        {uploadingLocalFile ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Yükleniyor...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {pendingBatchFiles.length > 0
                                ? `${pendingBatchFiles.length} Dosya Seçildi (+ Ekle)`
                                : "Cihazdan Dosya Seç (Çoklu)"}
                            </span>
                          </>
                        )}
                      </button>
                      {pendingBatchFiles.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {pendingBatchFiles.map((bf, bIdx) => (
                            <span
                              key={bIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px]"
                            >
                              <span className="max-w-[140px] truncate">{bf.name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingBatchFiles((prev) => prev.filter((_, i) => i !== bIdx))
                                }
                                className="text-rose-600 hover:text-rose-800 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-700 font-medium uppercase tracking-wider">
                          4. Klasör Seçimi
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomFolderMode((prev) => !prev)}
                          className="text-[10px] text-indigo-700 hover:underline font-medium cursor-pointer whitespace-nowrap"
                        >
                          {isCustomFolderMode ? "Listeden Seç" : "+ Yeni Klasör Tanımla"}
                        </button>
                      </div>
                      {isCustomFolderMode ? (
                        <input
                          type="text"
                          required
                          placeholder="Yeni klasör adı yazın..."
                          value={customFolderName}
                          onChange={(e) => setCustomFolderName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-indigo-400 rounded-xl text-slate-900 text-xs font-medium"
                        />
                      ) : (
                        <select
                          value={newMediaForm.category}
                          onChange={(e) => {
                            if (e.target.value === "__NEW_FOLDER__") {
                              setIsCustomFolderMode(true);
                              return;
                            }
                            setNewMediaForm({ ...newMediaForm, category: e.target.value });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-medium"
                        >
                          {availableProjectFolders.map((folder) => (
                            <option key={folder} value={folder}>
                              {folder}
                            </option>
                          ))}
                          <option value="__NEW_FOLDER__">+ Yeni Klasör Oluştur...</option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-700 font-medium uppercase tracking-wider mb-1">
                        5. Dosya Başlığı{" "}
                        {pendingBatchFiles.length === 0 && !isYouTubeUrl(newMediaForm.url)
                          ? "*"
                          : "(Opsiyonel)"}
                      </label>
                      <input
                        type="text"
                        required={pendingBatchFiles.length === 0 && !isYouTubeUrl(newMediaForm.url)}
                        placeholder={
                          pendingBatchFiles.length > 0
                            ? `${pendingBatchFiles.length} dosya kendi adıyla eklenecek`
                            : isYouTubeUrl(newMediaForm.url)
                            ? "Örn: Maldives Tanıtım Filmi (YouTube)"
                            : "Örn: 2+1 Penthouse Kat Planı.pdf"
                        }
                        value={newMediaForm.name}
                        onChange={(e) => setNewMediaForm({ ...newMediaForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-normal"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-700 font-medium uppercase tracking-wider mb-1">
                        6. Harici Link / YouTube URL (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        placeholder="YouTube video linki veya dosya URL yapıştırın"
                        value={newMediaForm.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (isYouTubeUrl(val)) {
                            setNewMediaForm((prev: any) => ({
                              ...prev,
                              url: val,
                              media_role: "video",
                              type: "video",
                              category:
                                !prev.category ||
                                prev.category === "Teknik & Mimari Planlar" ||
                                prev.category === "4K Görsel & Render Paketi"
                                  ? "Sosyal Medya & Tanıtım Videoları"
                                  : prev.category
                            }));
                          } else {
                            setNewMediaForm((prev: any) => ({ ...prev, url: val }));
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs"
                      />
                      {isYouTubeUrl(newMediaForm.url) && (
                        <p className="mt-1 text-[10px] font-medium text-emerald-700">
                          YouTube videosu algılandı · Web vitrininde oynatılır, panelde indirme butonu gizlenir ve paydaşlarla link olarak paylaşılır.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {existingDuplicateFile && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>"{existingDuplicateFile.name}"</strong> isimli dosya bu projede mevcut (
                        {existingDuplicateFile.category}). Nasıl kaydedilsin?
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDuplicateConflictMode("overwrite")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer whitespace-nowrap transition-colors ${
                          duplicateConflictMode === "overwrite"
                            ? "bg-amber-500 text-slate-950"
                            : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        Üzerine Yaz (Güncelle)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplicateConflictMode("new_version")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer whitespace-nowrap transition-colors ${
                          duplicateConflictMode === "new_version"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        Yeni Versiyon Kaydet
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddMediaOpen(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Vazgeç</span>
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingLocalFile}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kaydet & Eşleştir</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ADIM 1: BÖLÜM SEÇİMİ */}
          <div className="flex items-center justify-between gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setProjectSubTab("property_types")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
                  projectSubTab === "property_types"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-700 hover:text-slate-950 hover:bg-white"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>1. Mülk Tipleri ({projectPropertyTypes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedProjectId(activeProjectDetail.id);
                  if (activePropertyTypeKey) {
                    setUnitTypeFilter(activePropertyTypeKey);
                  }
                  const scopedUnits = activePropertyType?.units || selectedProjectUnits;
                  if (unitStatusFilter === "all") {
                    const hasAvail = scopedUnits.some((u: any) => u.status === "available");
                    if (hasAvail) setUnitStatusFilter("available");
                  }
                  setInventoryViewMode("grouped_types");
                  setActiveTab("inventory");
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap text-slate-700 hover:text-slate-950 hover:bg-white transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  2. Bağımsız Bölümler / Kapı No (
                  {activePropertyType ? activePropertyType.units.length : selectedProjectUnits.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProjectSubTab("common_areas")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
                  projectSubTab === "common_areas"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-700 hover:text-slate-950 hover:bg-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Ortak Alanlar ({selectedProjectCommonAreaMedia.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setProjectSubTab("folders")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
                  projectSubTab === "folders"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-700 hover:text-slate-950 hover:bg-white"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>4. Klasör Arşivi ({(activeProjectDetail.media_vault || []).length})</span>
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: STEP-BY-STEP MÜLK TİPİ ÇALIŞMA ALANI */}
          {projectSubTab === "property_types" && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[11px] font-medium uppercase text-slate-600 whitespace-nowrap">
                    Mülk Tipi Seçin:
                  </label>
                  <select
                    value={activePropertyTypeKey}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setSelectedPropertyTypeKey(nextType);
                      setUnitTypeFilter(nextType || "all");
                      setRevisingUnit(null);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-950 cursor-pointer outline-none focus:border-indigo-600"
                  >
                    {projectPropertyTypes.map((pt, idx) => (
                      <option key={pt.unit_type} value={pt.unit_type}>
                        {idx + 1}. {pt.unit_type} ({pt.available} Müsait / {pt.total} Kapı No ·{" "}
                        {formatGbp(pt.minPrice)})
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const currentPt = activePropertyType;
                  return (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-[11px] font-medium uppercase text-slate-600 whitespace-nowrap">
                        İçerik Katmanı:
                      </label>
                      <select
                        value={propertyTypeLayer}
                        onChange={(e) =>
                          setPropertyTypeLayer(
                            e.target.value as
                              | "overview"
                              | "photos"
                              | "videos"
                              | "floorplans"
                              | "units"
                          )
                        }
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 cursor-pointer outline-none focus:border-indigo-600"
                      >
                        <option value="overview">Tüm Özet Görünüm</option>
                        <option value="units">
                          Bağımsız Bölüm Kapı Numaraları ({currentPt?.units.length || 0})
                        </option>
                        <option value="photos">
                          Görseller & Renderlar ({currentPt?.matchedPhotos.length || 0})
                        </option>
                        <option value="videos">
                          Tanıtım Videoları ({currentPt?.matchedVideos.length || 0})
                        </option>
                        <option value="floorplans">
                          Teknik Kat Çizimleri ({currentPt?.matchedFloorplans.length || 0})
                        </option>
                      </select>
                    </div>
                  );
                })()}
              </div>

              {(() => {
                const pt = activePropertyType;
                if (!pt) return null;

                return (
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                    <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-semibold text-slate-950">
                            {pt.unit_type}
                          </h4>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-medium">
                            {pt.available} Müsait / {pt.total} Kapı No
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-950 text-xs font-medium font-mono">
                            {pt.minPrice === pt.maxPrice
                              ? formatGbp(pt.minPrice)
                              : `${formatGbp(pt.minPrice)} – ${formatGbp(pt.maxPrice)}`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-normal flex items-center gap-2 flex-wrap">
                          <span>
                            Brüt: <span className="font-medium text-slate-900">{pt.grossSqm} m²</span> · Net:{" "}
                            <span className="font-medium text-slate-900">{pt.netSqm} m²</span> · Teras:{" "}
                            <span className="font-medium text-slate-900">+{pt.terraceSqm} m²</span>
                          </span>
                          <span>· Blok: {pt.blocks.join(", ") || "Ana Blok"}</span>
                          <span>· Cephe: {pt.views.join(" / ") || "Panoramik Deniz & Havuz"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                        <button
                          type="button"
                          onClick={() => onSharePropertyTypePackage(pt, "whatsapp")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>WhatsApp Paylaş</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-3">
                      {(propertyTypeLayer === "overview" || propertyTypeLayer === "units") &&
                        pt.units.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-slate-900">
                                Bu Mülk Tipindeki Bağımsız Bölümler ({pt.units.length} Kapı No)
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 font-normal">
                                  Yerinde revize için kapı numarasına, silmek için çöp kutusuna tıklayın
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onDeleteUnitGroup(
                                      pt.units.map((u: any) => u.id),
                                      pt.unit_type
                                    )
                                  }
                                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Bu Tipteki Kapı Nolarını Toplu Sil</span>
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {pt.units.map((u: any) => {
                                const meta = getStatusBadgeMeta(u.status);
                                const isRevisingThisUnit =
                                  revisingUnit && Number(revisingUnit.id) === Number(u.id);
                                return (
                                  <div
                                    key={u.id}
                                    className={`inline-flex items-center rounded-lg border overflow-hidden shadow-2xs transition-all ${meta.chipBg} ${
                                      isRevisingThisUnit ? "ring-2 ring-indigo-600 ring-offset-1" : ""
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedProjectId(activeProjectDetail.id);
                                        setRevisingUnit((prev: any) =>
                                          prev && Number(prev.id) === Number(u.id) ? null : { ...u }
                                        );
                                      }}
                                      title={`${u.block_name} | Kapı No: ${u.unit_number} | ${u.floor_level} | ${formatGbp(u.price)} — Yerinde Revize Et`}
                                      className="px-2.5 py-1 text-[11px] font-mono font-medium cursor-pointer hover:opacity-85 transition-opacity"
                                    >
                                      {u.unit_number} · {u.floor_level?.split(" ")[0]} ({formatGbp(u.price)})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteUnit(u.id, u.unit_number);
                                      }}
                                      title={`Kapı No ${u.unit_number} Bağımsız Bölümünü Sil`}
                                      className="px-1.5 py-1 border-l border-current/20 hover:bg-rose-600 hover:text-white cursor-pointer transition-colors flex items-center justify-center"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            {revisingUnit &&
                              String(revisingUnit.unit_type || "").trim() === pt.unit_type &&
                              renderUnitRevisionForm()}
                          </div>
                        )}

                      {(propertyTypeLayer === "overview" || propertyTypeLayer === "photos") && (
                        <UnitShowcase4SectionSyncPanel
                          project={activeProjectDetail}
                          targetUnitType={pt.unit_type}
                          uploading={uploadingSectionMedia}
                          onBatchUploadFiles={onBatchUploadSectionMedia}
                          onBatchAddUrls={onBatchAddUrlsSectionMedia}
                          onDeleteMedia={onDeleteMediaFromProject}
                          onDirectDownload={onDirectLocalDownload}
                          onPreviewAsset={setPreviewAsset}
                        />
                      )}

                      {propertyTypeLayer !== "units" && (
                        <div
                          className={`grid grid-cols-1 ${
                            propertyTypeLayer === "overview" ? "lg:grid-cols-12" : "md:grid-cols-1"
                          } gap-3`}
                        >
                          {/* PHOTOS */}
                          {(propertyTypeLayer === "overview" || propertyTypeLayer === "photos") &&
                            (() => {
                              const allPtPhotoKeys = pt.matchedPhotos.map((ph: any, idx: number) =>
                                String(ph.id || ph.name || idx)
                              );
                              const selectedInPt = pt.matchedPhotos.filter((ph: any, idx: number) =>
                                selectedPhotoIds.includes(String(ph.id || ph.name || idx))
                              );
                              const allSelectedInPt =
                                allPtPhotoKeys.length > 0 &&
                                allPtPhotoKeys.every((k: string) => selectedPhotoIds.includes(k));

                              const toggleSelectAllPtPhotos = () => {
                                if (allSelectedInPt) {
                                  setSelectedPhotoIds((prev) =>
                                    prev.filter((k) => !allPtPhotoKeys.includes(k))
                                  );
                                } else {
                                  setSelectedPhotoIds((prev) =>
                                    Array.from(new Set([...prev, ...allPtPhotoKeys]))
                                  );
                                }
                              };

                              return (
                                <div
                                  className={`bg-slate-50/70 rounded-xl border border-slate-200 p-3 space-y-2.5 flex flex-col justify-between ${
                                    propertyTypeLayer === "overview" ? "lg:col-span-6" : ""
                                  }`}
                                >
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 pb-2">
                                      <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Görseller ({pt.matchedPhotos.length})</span>
                                      </span>

                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {pt.matchedPhotos.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={toggleSelectAllPtPhotos}
                                            className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-medium cursor-pointer"
                                          >
                                            {allSelectedInPt ? "Seçimi Kaldır" : "Tümünü Seç"}
                                          </button>
                                        )}

                                        {selectedInPt.length > 0 && (
                                          <>
                                            <button
                                              type="button"
                                              disabled={downloadingMedia}
                                              onClick={() => onBulkDownloadMedia(selectedInPt)}
                                              className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                                            >
                                              <Download className="w-3 h-3" />
                                              <span>Seçilenleri İndir ({selectedInPt.length})</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => onBulkDeleteMediaFromProject(selectedInPt)}
                                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              <span>Sil ({selectedInPt.length})</span>
                                            </button>
                                          </>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => onOpenUploadForTarget(pt.unit_type, "photo")}
                                          className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-medium cursor-pointer"
                                        >
                                          + Resim Ekle
                                        </button>
                                      </div>
                                    </div>

                                    <div
                                      className={`grid ${
                                        propertyTypeLayer === "photos"
                                          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                                          : "grid-cols-2 sm:grid-cols-2"
                                      } gap-2.5`}
                                    >
                                      {pt.matchedPhotos.map((ph: any, idx: number) => {
                                        const photoKey = String(ph.id || ph.name || idx);
                                        const isChecked = selectedPhotoIds.includes(photoKey);
                                        const thumbUrl = resolveDisplayImageUrl(
                                          ph.url,
                                          activeProjectDetail.cover_image
                                        );
                                        const openPhotoPreview = () =>
                                          setPreviewAsset({
                                            id: ph.id,
                                            rawName: ph.name,
                                            name: `${pt.unit_type} — ${ph.name}`,
                                            category: `${pt.unit_type} Görseli`,
                                            type: "photos",
                                            url: ph.url || activeProjectDetail.cover_image,
                                            cover: thumbUrl,
                                            projectName: activeProjectDetail.name
                                          });

                                        return (
                                          <div
                                            key={photoKey}
                                            className={`group rounded-xl bg-white border overflow-hidden shadow-2xs transition-all flex flex-col justify-between ${
                                              isChecked
                                                ? "border-indigo-600 ring-2 ring-indigo-500/20"
                                                : "border-slate-200 hover:border-slate-300"
                                            }`}
                                          >
                                            <div
                                              onClick={openPhotoPreview}
                                              className="relative h-28 sm:h-32 w-full bg-slate-100 overflow-hidden cursor-pointer"
                                            >
                                              <img
                                                src={thumbUrl}
                                                alt={ph.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                              />
                                              <label
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute top-2 left-2 z-10 w-5 h-5 rounded-md bg-white/95 border border-slate-300 shadow-xs flex items-center justify-center cursor-pointer"
                                                title="Çoklu indirme veya silme için seç"
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={() => {
                                                    setSelectedPhotoIds((prev) =>
                                                      prev.includes(photoKey)
                                                        ? prev.filter((id) => id !== photoKey)
                                                        : [...prev, photoKey]
                                                    );
                                                  }}
                                                  className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                                                />
                                              </label>
                                            </div>

                                            <div className="p-2 flex items-center justify-between gap-1.5 bg-white border-t border-slate-100">
                                              <button
                                                type="button"
                                                onClick={openPhotoPreview}
                                                title={`${ph.name} — Önizlemek için tıklayın`}
                                                className="text-[11px] font-medium text-slate-800 hover:text-indigo-600 truncate text-left cursor-pointer flex-1"
                                              >
                                                {ph.name}
                                              </button>

                                              <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={openPhotoPreview}
                                                  title="Önizleme"
                                                  className="p-1 rounded-md bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white cursor-pointer transition-colors"
                                                >
                                                  <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    onDirectLocalDownload(
                                                      ph.url,
                                                      ph.name,
                                                      activeProjectDetail.cover_image
                                                    )
                                                  }
                                                  title="Yerel Dosyalara İndir"
                                                  className="p-1 rounded-md bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white cursor-pointer transition-colors"
                                                >
                                                  <Download className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    onDeleteMediaFromProject(ph.id, ph.name)
                                                  }
                                                  title="Resmi Sil"
                                                  className="p-1 rounded-md bg-slate-100 hover:bg-rose-600 text-slate-500 hover:text-white cursor-pointer transition-colors"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                          {/* VIDEOS */}
                          {(propertyTypeLayer === "overview" || propertyTypeLayer === "videos") && (
                            <div
                              className={`bg-slate-50/70 rounded-xl border border-slate-200 p-3 space-y-2 flex flex-col justify-between ${
                                propertyTypeLayer === "overview" ? "lg:col-span-3" : ""
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                                    <Video className="w-3.5 h-3.5 text-slate-700" />
                                    <span>Tanıtım Videoları ({pt.matchedVideos.length})</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onOpenUploadForTarget(pt.unit_type, "video")}
                                    className="text-[11px] font-medium text-indigo-600 hover:underline cursor-pointer"
                                  >
                                    + Video Ekle
                                  </button>
                                </div>

                                {pt.matchedVideos.map((vid: any, idx: number) => {
                                  const isYt = isYouTubeUrl(vid.url);
                                  const canDownload = isDownloadableAssetUrl(vid.url);
                                  const vidThumb =
                                    getYouTubeThumbnailUrl(vid.url) ||
                                    resolveDisplayImageUrl(vid.url, activeProjectDetail.cover_image);
                                  const openVideoPreview = () =>
                                    setPreviewAsset({
                                      id: vid.id,
                                      rawName: vid.name,
                                      name: `${pt.unit_type} — ${vid.name}`,
                                      category: `${pt.unit_type} Tanıtım Videosu`,
                                      type: "video",
                                      url: vid.url || activeProjectDetail.cover_image,
                                      cover: vidThumb,
                                      projectName: activeProjectDetail.name
                                    });
                                  return (
                                    <div
                                      key={vid.id || idx}
                                      className="flex items-center justify-between gap-2 bg-white rounded-lg p-2 text-xs border border-slate-200"
                                    >
                                      <button
                                        type="button"
                                        onClick={openVideoPreview}
                                        title={`${vid.name} — Videoyu oynatmak ve paylaşmak için tıklayın`}
                                        className="font-medium text-slate-800 hover:text-indigo-600 truncate text-left cursor-pointer flex-1 flex items-center gap-1.5 min-w-0"
                                      >
                                        {isYt && (
                                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-semibold shrink-0">
                                            YouTube
                                          </span>
                                        )}
                                        <span className="truncate">{vid.name}</span>
                                      </button>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={openVideoPreview}
                                          title="Videoyu İzle"
                                          className="p-1 rounded-md bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white cursor-pointer transition-colors"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onShareMediaAsset(
                                              {
                                                ...vid,
                                                projectName: activeProjectDetail.name
                                              },
                                              "copy"
                                            )
                                          }
                                          title="Paydaş Video Linkini Kopyala"
                                          className="p-1 rounded-md bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white cursor-pointer transition-colors"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onShareMediaAsset(
                                              {
                                                ...vid,
                                                projectName: activeProjectDetail.name
                                              },
                                              "whatsapp"
                                            )
                                          }
                                          title="Paydaşla WhatsApp Üzerinden Paylaş"
                                          className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white cursor-pointer transition-colors"
                                        >
                                          <Share2 className="w-3.5 h-3.5" />
                                        </button>
                                        {canDownload && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onDirectLocalDownload(
                                                vid.url,
                                                vid.name,
                                                activeProjectDetail.cover_image
                                              )
                                            }
                                            title="Yerel Dosyalara İndir"
                                            className="p-1 rounded-md bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white cursor-pointer transition-colors"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => onDeleteMediaFromProject(vid.id, vid.name)}
                                          title="Videoyu Sil"
                                          className="p-1 rounded-md bg-slate-100 hover:bg-rose-600 text-slate-500 hover:text-white cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* FLOORPLANS */}
                          {(propertyTypeLayer === "overview" ||
                            propertyTypeLayer === "floorplans") && (
                            <div
                              className={`bg-slate-50/70 rounded-xl border border-slate-200 p-3 space-y-2 flex flex-col justify-between ${
                                propertyTypeLayer === "overview" ? "lg:col-span-3" : ""
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                                    <Compass className="w-3.5 h-3.5 text-slate-700" />
                                    <span>Teknik Kat Çizimleri ({pt.matchedFloorplans.length})</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onOpenUploadForTarget(pt.unit_type, "floorplan")}
                                    className="text-[11px] font-medium text-indigo-600 hover:underline cursor-pointer"
                                  >
                                    + Kat Çizimi Ekle
                                  </button>
                                </div>

                                {pt.matchedFloorplans.map((fp: any, idx: number) => {
                                  const fpThumb = resolveDisplayImageUrl(
                                    fp.url,
                                    activeProjectDetail.cover_image
                                  );
                                  const openFpPreview = () =>
                                    setPreviewAsset({
                                      id: fp.id,
                                      rawName: fp.name,
                                      name: `${pt.unit_type} — ${fp.name}`,
                                      category: `${pt.unit_type} Teknik Kat Planı`,
                                      type: "pdf",
                                      url: fp.url || activeProjectDetail.cover_image,
                                      cover: fpThumb,
                                      projectName: activeProjectDetail.name
                                    });
                                  return (
                                    <div
                                      key={fp.id || idx}
                                      className="flex items-center justify-between gap-2 bg-white rounded-lg p-2 text-xs border border-slate-200"
                                    >
                                      <button
                                        type="button"
                                        onClick={openFpPreview}
                                        title={`${fp.name} — Önizlemek için tıklayın`}
                                        className="font-medium text-slate-800 hover:text-indigo-600 truncate text-left cursor-pointer flex-1"
                                      >
                                        {fp.name}
                                      </button>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={openFpPreview}
                                          title="Önizleme"
                                          className="p-1 rounded-md bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white cursor-pointer transition-colors"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onDirectLocalDownload(
                                              fp.url,
                                              fp.name,
                                              activeProjectDetail.cover_image
                                            )
                                          }
                                          title="Yerel Dosyalara İndir"
                                          className="p-1 rounded-md bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white cursor-pointer transition-colors"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onDeleteMediaFromProject(fp.id, fp.name)}
                                          title="Kat Çizimini Sil"
                                          className="p-1 rounded-md bg-slate-100 hover:bg-rose-600 text-slate-500 hover:text-white cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUB-TAB 2: ORTAK ALANLAR & SOSYAL TESİSLER */}
          {projectSubTab === "common_areas" && (
            <div className="space-y-3">
              <div className="bg-emerald-50/70 border border-emerald-300 border-l-4 border-l-emerald-600 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>
                      {activeProjectDetail.name} — Ortak Alanlar, Sosyal Tesisler & Peyzaj Havuzu
                    </span>
                  </h4>
                  <p className="text-[11px] text-emerald-900">
                    Havuzlar, plaj, spa, fitness, peyzaj, vaziyet planı ve ortak alanlara ait tüm görsel, video ve teknik veriler.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onShareCommonAreasPackage("whatsapp")}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>WhatsApp Paylaş</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold uppercase text-slate-950 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ortak Alan & Sosyal Tesis Özellikleri</span>
                    </h5>
                    <span className="text-[10px] font-medium text-emerald-800">
                      {activeProjectDetail.name}
                    </span>
                  </div>

                  <form onSubmit={onAddCommonAreaSpec} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newCommonSpecForm.spec_text}
                      onChange={(e) =>
                        setNewCommonSpecForm((prev) => ({ ...prev, spec_text: e.target.value }))
                      }
                      placeholder="Yeni ortak alan özelliği ekle (Örn: Isıtmalı Kapalı Havuz & Spa)..."
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-normal"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
                    >
                      + Ekle
                    </button>
                  </form>

                  <div className="space-y-1.5">
                    {[
                      ...extractFacilityItems(activeProjectDetail.lifestyle_facilities),
                      ...extractFacilityItems(activeProjectDetail.architectural_specs)
                    ].map((item: string, idx: number) => {
                      const band = getSectionBandTheme(idx);
                      return (
                        <div
                          key={idx}
                          className={`rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium flex items-center gap-2 border transition-colors ${band.rowBg}`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full text-[9px] font-semibold flex items-center justify-center shrink-0 ${band.badgeBg}`}
                          >
                            {idx + 1}
                          </span>
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="text-xs font-semibold uppercase text-slate-950 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        Ortak Alan Görselleri, Drone Videoları & Vaziyet Planı ({selectedProjectCommonAreaMedia.length})
                      </span>
                    </h5>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(() => {
                        const downloadableCommon = selectedProjectCommonAreaMedia.filter((m) =>
                          isDownloadableAssetUrl(m.url)
                        );
                        if (downloadableCommon.length === 0) return null;
                        return (
                          <button
                            type="button"
                            disabled={downloadingMedia}
                            onClick={() => onBulkDownloadMedia(downloadableCommon)}
                            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>İndirilebilirleri İndir ({downloadableCommon.length})</span>
                          </button>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() =>
                          onOpenUploadForTarget(
                            "COMMON_AREAS",
                            "lifestyle",
                            "Ortak Alanlar & Sosyal Tesisler"
                          )
                        }
                        className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-medium cursor-pointer"
                      >
                        + Sahil & Havuz Resmi
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenUploadForTarget(
                            "COMMON_AREAS",
                            "masterplan",
                            "Masterplan & Kat Planları"
                          )
                        }
                        className="px-2 py-0.5 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px] font-medium cursor-pointer"
                      >
                        + Masterplan Görseli
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenUploadForTarget("COMMON_AREAS", "photo")}
                        className="px-2 py-0.5 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px] font-medium cursor-pointer"
                      >
                        + Ortak Resim
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenUploadForTarget("COMMON_AREAS", "video")}
                        className="px-2 py-0.5 bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 rounded text-[10px] font-medium cursor-pointer"
                      >
                        + Drone / YouTube Video
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedProjectCommonAreaMedia.map((doc: any, dIdx: number) => {
                      const isYt = isYouTubeUrl(doc.url);
                      const canDownload = isDownloadableAssetUrl(doc.url);
                      const isVideo = doc.type === "video" || doc.media_role === "video" || isYt;
                      const thumbUrl = resolveDisplayImageUrl(
                        doc.url,
                        activeProjectDetail.cover_image
                      );
                      const openDocPreview = () =>
                        setPreviewAsset({
                          id: doc.id,
                          rawName: doc.name,
                          name: doc.name,
                          category: `Ortak Alanlar — ${doc.category}`,
                          type: isVideo ? "video" : doc.type,
                          url: doc.url,
                          cover: thumbUrl,
                          projectName: activeProjectDetail.name
                        });
                      return (
                        <div
                          key={doc.id || dIdx}
                          className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between"
                        >
                          <div
                            onClick={openDocPreview}
                            className="relative h-28 w-full bg-slate-100 overflow-hidden cursor-pointer group"
                          >
                            <img
                              src={thumbUrl}
                              alt={doc.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20">
                                <span className="p-2 rounded-full bg-white/95 text-rose-600 shadow-md">
                                  <Play className="w-4 h-4 fill-current" />
                                </span>
                              </div>
                            )}
                            {isYt && (
                              <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-semibold">
                                YouTube
                              </span>
                            )}
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-medium">
                              {doc.category}
                            </span>
                          </div>
                          <div className="p-2 flex items-center justify-between gap-2 bg-white border-t border-slate-100">
                            <button
                              type="button"
                              onClick={openDocPreview}
                              className="text-xs font-medium text-slate-900 hover:text-indigo-600 truncate text-left cursor-pointer flex-1"
                              title={`${doc.name} — Önizlemek için tıklayın`}
                            >
                              {doc.name}
                            </button>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={openDocPreview}
                                className="p-1 bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-md cursor-pointer transition-colors"
                                title={isVideo ? "Videoyu İzle" : "Önizleme"}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onShareMediaAsset(
                                    { ...doc, projectName: activeProjectDetail.name },
                                    "copy"
                                  )
                                }
                                className="p-1 bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-md cursor-pointer transition-colors"
                                title="Paydaş Linkini Kopyala"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onShareMediaAsset(
                                    { ...doc, projectName: activeProjectDetail.name },
                                    "whatsapp"
                                  )
                                }
                                className="p-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-md cursor-pointer transition-colors"
                                title="Paydaşla WhatsApp Paylaş"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              {canDownload && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onDirectLocalDownload(
                                      doc.url,
                                      doc.name,
                                      activeProjectDetail.cover_image
                                    )
                                  }
                                  className="p-1 bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white rounded-md cursor-pointer transition-colors"
                                  title="Yerel Dosyalara İndir"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onDeleteMediaFromProject(doc.id, doc.name)}
                                className="p-1 bg-slate-100 hover:bg-rose-600 text-slate-500 hover:text-white rounded-md cursor-pointer transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: PROJE KLASÖRLERİ & TÜM DOSYALAR */}
          {projectSubTab === "folders" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold uppercase text-slate-900 flex items-center gap-1.5 shrink-0">
                    <FolderOpen className="w-4 h-4 text-indigo-600" />
                    <span>{activeProjectDetail.name} — Klasörler & Dosyalar</span>
                  </h4>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="text-[10px] font-medium uppercase text-slate-500 whitespace-nowrap">
                      Klasör Seçin:
                    </label>
                    <select
                      value={mediaCategoryFilter}
                      onChange={(e) => setMediaCategoryFilter(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 cursor-pointer outline-none"
                    >
                      <option value="all">
                        Tüm Klasörler ({(activeProjectDetail.media_vault || []).length})
                      </option>
                      {projectFolderTabs.map((folderName) => (
                        <option key={folderName} value={folderName}>
                          {folderName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredProjectMedia.map((doc: any, fIdx: number) => {
                    const band = getSectionBandTheme(fIdx);
                    const isYt = isYouTubeUrl(doc.url);
                    const canDownload = isDownloadableAssetUrl(doc.url);
                    const isVideo = doc.type === "video" || doc.media_role === "video" || isYt;
                    const thumbUrl = resolveDisplayImageUrl(
                      doc.url,
                      activeProjectDetail.cover_image
                    );
                    const openFolderDocPreview = () =>
                      setPreviewAsset({
                        id: doc.id,
                        rawName: doc.name,
                        name: doc.name,
                        category: doc.category,
                        type: isVideo ? "video" : doc.type,
                        url: doc.url,
                        cover: thumbUrl,
                        projectName: activeProjectDetail.name
                      });
                    return (
                      <div
                        key={doc.id || fIdx}
                        className={`rounded-xl p-2 flex items-center justify-between gap-2 border transition-all ${band.rowBg}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`p-1.5 rounded-lg shrink-0 ${band.badgeBg}`}>
                            {isVideo ? (
                              <Play className="w-3.5 h-3.5" />
                            ) : doc.type === "photos" ? (
                              <ImageIcon className="w-3.5 h-3.5" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={openFolderDocPreview}
                              className="text-xs font-medium text-slate-950 hover:text-indigo-600 truncate w-full text-left cursor-pointer flex items-center gap-1.5"
                              title={`${doc.name} — Önizlemek için tıklayın`}
                            >
                              {isYt && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-semibold shrink-0">
                                  YouTube
                                </span>
                              )}
                              <span className="truncate">{doc.name}</span>
                            </button>
                            <div className="text-[10px] text-slate-700 font-normal truncate">
                              {doc.category}
                              {doc.unit_type_match && doc.unit_type_match !== "COMMON_AREAS" && doc.unit_type_match !== "__COMMON_AREA__"
                                ? ` · ${doc.unit_type_match}`
                                : " · Ortak Alan & Sosyal Tesis"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={openFolderDocPreview}
                            className="p-1.5 bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 rounded-lg cursor-pointer transition-colors"
                            title={isVideo ? "Videoyu İzle" : "Önizleme"}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onShareMediaAsset(
                                { ...doc, projectName: activeProjectDetail.name },
                                "copy"
                              )
                            }
                            className="p-1.5 bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 rounded-lg cursor-pointer transition-colors"
                            title="Paydaş Linkini Kopyala"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onShareMediaAsset(
                                { ...doc, projectName: activeProjectDetail.name },
                                "whatsapp"
                              )
                            }
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-lg cursor-pointer transition-colors"
                            title="Paydaşla WhatsApp Paylaş"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          {canDownload && (
                            <button
                              type="button"
                              onClick={() =>
                                onDirectLocalDownload(
                                  doc.url,
                                  doc.name,
                                  activeProjectDetail.cover_image
                                )
                              }
                              className="p-1.5 bg-white hover:bg-emerald-600 text-indigo-700 hover:text-white border border-slate-200 rounded-lg cursor-pointer transition-colors"
                              title="Yerel Dosyalara İndir"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteMediaFromProject(doc.id, doc.name)}
                            className="p-1.5 bg-white hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-200 rounded-lg cursor-pointer transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-2.5">
                <div className="bg-indigo-50/70 text-slate-900 border border-indigo-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase text-indigo-950 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{activeProjectDetail.name} — Ödeme Planı</span>
                    </h4>
                    <span className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-[10px] font-medium text-indigo-950">
                      Başlangıç: {formatGbp(activeProjectDetail.starting_price)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-white border border-indigo-100 rounded-lg p-2">
                      <div className="text-[10px] text-slate-600 font-medium">Peşinat</div>
                      <div className="text-sm font-semibold text-slate-950">
                        %{activeProjectDetail.payment_plan?.down_payment_percent || 35}
                      </div>
                    </div>
                    <div className="bg-white border border-indigo-100 rounded-lg p-2">
                      <div className="text-[10px] text-slate-600 font-medium">Faizsiz Vade</div>
                      <div className="text-sm font-semibold text-indigo-700">
                        {activeProjectDetail.payment_plan?.installment_months || 36} Ay
                      </div>
                    </div>
                    <div className="bg-white border border-indigo-100 rounded-lg p-2">
                      <div className="text-[10px] text-slate-600 font-medium">Kira Getirisi</div>
                      <div className="text-sm font-semibold text-emerald-700">
                        %{activeProjectDetail.investment_metrics?.annual_rental_yield_percent || 9.8}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-700 font-normal leading-relaxed pt-1">
                    {activeProjectDetail.payment_plan?.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
