import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FolderSync,
  Plus,
  ArrowLeftRight,
  Calendar,
  FolderOpen,
  Grid,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";
import {
  SuiteTab,
  InventoryViewMode,
  MediaRoleType,
  ProjectSubTab,
  DeveloperProjectSuiteProps,
  DEFAULT_FOLDER_CATEGORIES,
  compressImageFile,
  extractFacilityItems,
  formatGbp,
  inferMediaType,
  isDownloadableAssetUrl,
  isYouTubeUrl,
  printProjectSheet
} from "./developerProjectUtils";
import {
  DeveloperProjectEditForm,
  DeveloperUnitRevisionForm,
  ProjectFormState
} from "./DeveloperProjectForms";
import { SectionUploadOptions } from "./DeveloperVisualSyncPanels";
import { DeveloperShowcaseTab } from "./DeveloperShowcaseTab";
import { DeveloperInventoryTab } from "./DeveloperInventoryTab";
import { DeveloperCompareTab } from "./DeveloperCompareTab";
import { DeveloperEventsTab, EventFormState } from "./DeveloperEventsTab";
import { DeveloperStaffTab, StaffFormState } from "./DeveloperStaffTab";
import { DeveloperMediaLightboxModal } from "./DeveloperMediaLightboxModal";

export type { SuiteTab };

export const DeveloperProjectSuite: React.FC<DeveloperProjectSuiteProps> = ({
  storeId,
  branding,
  user,
  initialSection,
  onBackToPortfolio
}) => {
  const normalizeTab = (t?: SuiteTab): SuiteTab => {
    if (!t) return "showcase";
    if (t === "leads_contracts" || t === "b2b_portal_preview") return "showcase";
    return t;
  };

  const [activeTab, setActiveTab] = useState<SuiteTab>(normalizeTab(initialSection));
  const [loading, setLoading] = useState<boolean>(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);

  const [projectViewMode, setProjectViewMode] = useState<"grid" | "single">("single");
  const [projectSubTab, setProjectSubTab] = useState<ProjectSubTab>("property_types");
  const [selectedPropertyTypeKey, setSelectedPropertyTypeKey] = useState<string>("");
  const [propertyTypeLayer, setPropertyTypeLayer] = useState<
    "overview" | "photos" | "videos" | "floorplans" | "units"
  >("overview");

  const [companies, setCompanies] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [internalStaff, setInternalStaff] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [, setDriveMeta] = useState<any>(null);

  useEffect(() => {
    if (initialSection) {
      setActiveTab(normalizeTab(initialSection));
    }
  }, [initialSection]);

  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [activeProjectDetail, setActiveProjectDetail] = useState<any | null>(null);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>("all");
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);

  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormState>({
    name: "",
    folder_prefix: "",
    region: "Girne",
    sub_region: "Esentepe Sahil",
    concept_tagline: "",
    completion_date: "Q4 2027",
    construction_progress: 35,
    total_units: 120,
    available_units: 85,
    starting_price: 155000,
    down_payment_percent: 35,
    installment_months: 36,
    annual_rental_yield_percent: 10.2,
    capital_appreciation_percent: 45,
    cover_image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85",
    payment_notes:
      "%35 Peşinat, kalan %65 için teslim tarihine kadar 36 ay %0 faiz şirket içi taksit."
  });

  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [uploadingLocalFile, setUploadingLocalFile] = useState(false);
  const [uploadingSectionMedia, setUploadingSectionMedia] = useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [pendingBatchFiles, setPendingBatchFiles] = useState<
    Array<{ name: string; url: string; type: string }>
  >([]);
  const [isCustomFolderMode, setIsCustomFolderMode] = useState(false);
  const [customFolderName, setCustomFolderName] = useState("");
  const [duplicateConflictMode, setDuplicateConflictMode] = useState<"overwrite" | "new_version">(
    "overwrite"
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [newMediaForm, setNewMediaForm] = useState<{
    name: string;
    type: string;
    category: string;
    url: string;
    unit_type_match: string;
    media_role: MediaRoleType;
  }>({
    name: "",
    type: "masterplan",
    category: "Teknik & Mimari Planlar",
    url: "",
    unit_type_match: "__COMMON_AREA__",
    media_role: "photo"
  });

  const [, setIsAddCommonSpecOpen] = useState(false);
  const [newCommonSpecForm, setNewCommonSpecForm] = useState({
    facility_group: "wellness_spa",
    spec_text: ""
  });

  const [inventoryViewMode, setInventoryViewMode] = useState<InventoryViewMode>("grouped_types");
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isBatchGeneratorOpen, setIsBatchGeneratorOpen] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  const [newUnitForm, setNewUnitForm] = useState({
    project_id: 0,
    block_name: "A Blok (Sahil)",
    floor_level: "Zemin (Swim-Up)",
    unit_number: "A-105",
    unit_type: "1+1 Swim-Up Suite",
    gross_sqm: 82,
    net_sqm: 65,
    terrace_sqm: 17,
    view_direction: "Tam Deniz & Lagün Havuz",
    facade_orientation: "Kuzey-Batı Akdeniz Cephesi",
    position_tag: "Orta Panoramik Aks",
    price: 195000,
    status: "available",
    optioned_client_name: "",
    closing_stage: ""
  });

  const [batchForm, setBatchForm] = useState({
    project_id: 0,
    block_name: "C Blok (Deniz Cephesi)",
    door_prefix: "C",
    unit_type: "1+1 Loft Penthouse",
    start_floor: 0,
    end_floor: 3,
    units_per_floor: 4,
    gross_sqm: 85,
    net_sqm: 68,
    terrace_sqm: 17,
    base_price: 168000,
    floor_price_increment: 4500,
    corner_price_bonus: 3500,
    view_direction: "Tam Deniz & Lagün Havuz",
    facade_orientation: "Kuzey Akdeniz Cephesi"
  });

  const [customBlocksByProject, setCustomBlocksByProject] = useState<Record<number, string[]>>({});
  const [isAddingCustomBlock, setIsAddingCustomBlock] = useState<boolean>(false);
  const [newCustomBlockName, setNewCustomBlockName] = useState<string>("");

  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [downloadingMedia, setDownloadingMedia] = useState<boolean>(false);

  const [revisingUnit, setRevisingUnit] = useState<any | null>(null);
  const [savingUnitRevision, setSavingUnitRevision] = useState(false);
  const [revisingGroup, setRevisingGroup] = useState<any | null>(null);
  const [droneTargetUnit, setDroneTargetUnit] = useState<any | null>(null);
  const [editingUnitPrices, setEditingUnitPrices] = useState<Record<number, number>>({});

  const [unitStatusFilter, setUnitStatusFilter] = useState<string>("available");
  const [unitBlockFilter, setUnitBlockFilter] = useState<string>("all");
  const [unitTypeFilter, setUnitTypeFilter] = useState<string>("all");
  const [unitSearch, setUnitSearch] = useState<string>("");
  const hasInitializedFiltersRef = useRef<boolean>(false);

  const [compareLeftId, setCompareLeftId] = useState<number>(0);
  const [compareRightId, setCompareRightId] = useState<number>(0);
  const [simulatorPriceGbp, setSimulatorPriceGbp] = useState<number>(215000);

  const [staffDeptFilter, setStaffDeptFilter] = useState<string>("all");
  const [isNewStaffOpen, setIsNewStaffOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState<StaffFormState>({
    full_name: "",
    title_role: "Proje Mimarı",
    department: "Teknik & Mimari",
    email: "",
    phone: "+90 548 860 00 09",
    assigned_regions: "Tüm Projeler",
    permissions: {
      can_manage_projects: true,
      can_upload_media: true,
      can_manage_prices: false,
      can_manage_users: false
    }
  });

  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [uploadingEventMedia, setUploadingEventMedia] = useState(false);
  const eventImageInputRef = useRef<HTMLInputElement | null>(null);
  const eventVideoInputRef = useRef<HTMLInputElement | null>(null);

  const [newEventForm, setNewEventForm] = useState<EventFormState>({
    title: "",
    event_type: "launch_party",
    project_name: "Mykonos Homes",
    event_date: "2026-07-10 19:30",
    location: "Esentepe Sahil — Satış & Lansman Merkezi, KKTC",
    target_regions: "Yönetim, Satış ve PR Ekibi",
    media_preview_url: "",
    cover_image: "",
    video_url: "",
    media_gallery: [],
    max_capacity: 200,
    description: ""
  });

  const activeCompany = companies[0] || null;
  const rawCompanyName =
    activeCompany?.company_name || branding?.store_name || branding?.name || "Cyprus Constructions";
  const companyDisplayName = String(rawCompanyName).replace(/\s*\(projectLP\)\s*/gi, "").trim();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const handleSelectSingleProject = (proj: any, openSingleView = true) => {
    if (!proj) return;
    setActiveProjectDetail(proj);
    setSelectedProjectId(Number(proj.id));
    setMediaCategoryFilter("all");
    setUnitBlockFilter("all");
    const projUnits = units.filter((u) => Number(u.project_id) === Number(proj.id));
    const firstUnitType =
      projUnits.find((u) => String(u.unit_type || "").trim())?.unit_type?.trim() || "";
    const hasAvailableInType = projUnits.some(
      (u) => (!firstUnitType || String(u.unit_type || "").trim() === firstUnitType) && u.status === "available"
    );
    setSelectedPropertyTypeKey(firstUnitType);
    setPropertyTypeLayer("overview");
    setUnitTypeFilter(firstUnitType || "all");
    setUnitStatusFilter(hasAvailableInType ? "available" : "all");
    setRevisingUnit(null);
    setNewUnitForm((prev) => ({ ...prev, project_id: Number(proj.id) }));
    setBatchForm((prev) => ({ ...prev, project_id: Number(proj.id) }));
    if (projUnits[0]) setDroneTargetUnit(projUnits[0]);
    if (openSingleView) setProjectViewMode("single");
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/overview?store_id=${sid}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Veri yüklenemedi");
      const data = await res.json();
      const loadedCompanies = Array.isArray(data.companies) ? data.companies : [];
      const loadedProjects = Array.isArray(data.projects) ? data.projects : [];
      const loadedUnits = Array.isArray(data.units) ? data.units : [];
      setCompanies(loadedCompanies);
      setProjects(loadedProjects);
      setUnits(loadedUnits);
      setInternalStaff(Array.isArray(data.internalStaff) ? data.internalStaff : []);
      setEvents(Array.isArray(data.events) ? data.events : []);
      setDriveMeta(data.driveSyncMeta || null);

      if (loadedProjects.length > 0) {
        const currentProj =
          (activeProjectDetail &&
            loadedProjects.find((p: any) => Number(p.id) === Number(activeProjectDetail.id))) ||
          loadedProjects[0];
        setActiveProjectDetail(currentProj);
        setSelectedProjectId(Number(currentProj.id));
        setNewUnitForm((prev) => ({ ...prev, project_id: Number(currentProj.id) }));
        setBatchForm((prev) => ({ ...prev, project_id: Number(currentProj.id) }));

        const projUnits = loadedUnits.filter(
          (u: any) => Number(u.project_id) === Number(currentProj.id)
        );
        if (!hasInitializedFiltersRef.current && projUnits.length > 0) {
          const firstUnitType =
            projUnits.find((u: any) => String(u.unit_type || "").trim())?.unit_type?.trim() || "";
          const hasAvailableInType = projUnits.some(
            (u: any) =>
              (!firstUnitType || String(u.unit_type || "").trim() === firstUnitType) &&
              u.status === "available"
          );
          if (firstUnitType) {
            setSelectedPropertyTypeKey(firstUnitType);
            setUnitTypeFilter(firstUnitType);
          }
          setUnitStatusFilter(hasAvailableInType ? "available" : "all");
          hasInitializedFiltersRef.current = true;
        }
        if (projUnits.length > 0) {
          setDroneTargetUnit((prev: any) =>
            prev && Number(prev.project_id) === Number(currentProj.id)
              ? projUnits.find((u: any) => u.id === prev.id) || projUnits[0]
              : projUnits[0]
          );
        }
      }

      if (loadedProjects.length >= 2 && !compareLeftId && !compareRightId) {
        const mykonos =
          loadedProjects.find((p: any) => p.name?.toLowerCase().includes("mykonos")) ||
          loadedProjects[1];
        const aloha =
          loadedProjects.find((p: any) => p.name?.toLowerCase().includes("aloha")) ||
          loadedProjects[3] ||
          loadedProjects[0];
        setCompareLeftId(mykonos.id);
        setCompareRightId(aloha.id);
      }
    } catch (err) {
      console.error("DeveloperProjectSuite fetch error:", err);
      toast.error("Proje verileri alınırken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [storeId]);

  const activeProjectId = Number(activeProjectDetail?.id || selectedProjectId || projects[0]?.id || 0);

  const availableProjectFolders = useMemo(() => {
    const set = new Set<string>(DEFAULT_FOLDER_CATEGORIES);
    const list: any[] = activeProjectDetail?.media_vault || [];
    list.forEach((item) => {
      if (item?.category && String(item.category).trim()) set.add(String(item.category).trim());
    });
    return Array.from(set);
  }, [activeProjectDetail]);

  const existingDuplicateFile = useMemo(() => {
    if (!activeProjectDetail || !newMediaForm.name.trim()) return null;
    const target = newMediaForm.name.trim().toLowerCase();
    const list: any[] = activeProjectDetail.media_vault || [];
    return list.find((m: any) => String(m?.name || "").trim().toLowerCase() === target) || null;
  }, [activeProjectDetail, newMediaForm.name]);

  const handleDeviceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadingLocalFile(true);
      const resolvedFolder =
        isCustomFolderMode && customFolderName.trim()
          ? customFolderName.trim()
          : newMediaForm.category;
      const uploadedBatch: Array<{ name: string; url: string; type: string }> = [];

      for (let i = 0; i < files.length; i++) {
        const rawFile = files[i];
        let fileToUpload: File = rawFile;
        if (rawFile.type.startsWith("image/") && !rawFile.type.includes("svg")) {
          try {
            fileToUpload = await compressImageFile(rawFile, 1600, 0.84);
          } catch {
            fileToUpload = rawFile;
          }
        }
        const formData = new FormData();
        formData.append("file", fileToUpload);
        const uploadRes = await api.upload("/api/upload", formData);
        if (uploadRes && uploadRes.url) {
          uploadedBatch.push({
            name: rawFile.name,
            url: uploadRes.url,
            type: inferMediaType(rawFile.name, resolvedFolder, newMediaForm.media_role)
          });
        }
      }

      if (uploadedBatch.length > 0) {
        setPendingBatchFiles((prev) => [...prev, ...uploadedBatch]);
        const first = uploadedBatch[0];
        setNewMediaForm((prev) => ({
          ...prev,
          name: prev.name.trim() ? prev.name : first.name,
          url: first.url,
          type: first.type
        }));
        toast.success(
          uploadedBatch.length === 1
            ? `"${first.name}" yüklendi.`
            : `${uploadedBatch.length} adet dosya sıraya alındı.`
        );
      } else {
        toast.error("Dosya yüklenemedi.");
      }
    } catch {
      toast.error("Dosya yükleme sırasında hata oluştu.");
    } finally {
      setUploadingLocalFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUploadProjectCoverFile = async (file: File) => {
    try {
      setUploadingCoverImage(true);
      let fileToUpload: File = file;
      if (file.type.startsWith("image/") && !file.type.includes("svg")) {
        try {
          fileToUpload = await compressImageFile(file, 1600, 0.85);
        } catch {
          fileToUpload = file;
        }
      }
      const fd = new FormData();
      fd.append("file", fileToUpload);
      const res = await api.upload("/api/upload", fd);
      if (res?.url) {
        setProjectForm((prev) => ({ ...prev, cover_image: res.url }));
        toast.success("Kapak görseli yüklendi.");
      } else {
        toast.error(res?.error || "Kapak görseli yüklenemedi.");
      }
    } catch {
      toast.error("Kapak görseli yüklenemedi.");
    } finally {
      setUploadingCoverImage(false);
    }
  };

  const handleSetProjectCoverImage = async (coverUrl: string) => {
    if (!activeProjectDetail || !coverUrl) return;
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/projects/${activeProjectDetail.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ store_id: sid, cover_image: coverUrl })
      });
      if (res.ok) {
        const saved = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        setActiveProjectDetail(saved);
        toast.success(`${saved.name} projesinin ana kapak görseli güncellendi.`);
      } else {
        toast.error("Kapak görseli güncellenemedi.");
      }
    } catch {
      toast.error("Kapak görseli güncellenemedi.");
    }
  };

  const handleBatchUploadSectionMedia = async (
    files: FileList,
    options: SectionUploadOptions
  ) => {
    if (!activeProjectDetail || !files || files.length === 0) return;
    try {
      setUploadingSectionMedia(true);
      const sid = storeId || user?.store_id || 1;
      const itemsToSave: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const rawFile = files[i];
        let fileToUpload: File = rawFile;
        if (rawFile.type.startsWith("image/") && !rawFile.type.includes("svg")) {
          try {
            fileToUpload = await compressImageFile(rawFile, 1600, 0.85);
          } catch {
            fileToUpload = rawFile;
          }
        }
        const fd = new FormData();
        fd.append("file", fileToUpload);
        const upRes = await api.upload("/api/upload", fd);
        if (upRes?.url) {
          itemsToSave.push({
            name: rawFile.name,
            type: inferMediaType(
              rawFile.name,
              options.category || "4K Görsel & Render Paketi",
              options.media_role
            ),
            category: options.category || "4K Görsel & Render Paketi",
            url: upRes.url,
            unit_type_match: options.unit_type_match,
            unit_number_match: options.unit_number_match || "",
            media_role: options.media_role
          });
        }
      }

      if (itemsToSave.length === 0) {
        toast.error("Görseller yüklenemedi.");
        return;
      }

      const res = await fetch(
        `/api/developer-projects/projects/${activeProjectDetail.id}/media/batch`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            store_id: sid,
            items: itemsToSave,
            setFirstAsCover: Boolean(options.setFirstAsCover)
          })
        }
      );
      if (res.ok) {
        const updatedProj = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
        setActiveProjectDetail(updatedProj);
        toast.success(`${itemsToSave.length} adet görsel projeye eklendi ve web vitrinine senkronize edildi.`);
      } else {
        toast.error("Görseller projeye kaydedilemedi.");
      }
    } catch {
      toast.error("Çoklu görsel yükleme sırasında hata oluştu.");
    } finally {
      setUploadingSectionMedia(false);
    }
  };

  const handleBatchAddUrlsSectionMedia = async (
    rawUrls: string,
    options: SectionUploadOptions
  ) => {
    if (!activeProjectDetail || !rawUrls.trim()) return;
    const urls = rawUrls
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/"));
    if (urls.length === 0) {
      toast.error("Geçerli bir görsel URL'si girin.");
      return;
    }
    try {
      setUploadingSectionMedia(true);
      const sid = storeId || user?.store_id || 1;
      const itemsToSave = urls.map((u, idx) => {
        const tail = u.split("?")[0].split("/").pop() || `${options.media_role}-${idx + 1}.jpg`;
        return {
          name: tail.length > 4 ? tail : `${options.media_role}-${idx + 1}.jpg`,
          type: inferMediaType(tail, options.category || "4K Görsel & Render Paketi", options.media_role),
          category: options.category || "4K Görsel & Render Paketi",
          url: u,
          unit_type_match: options.unit_type_match,
          unit_number_match: options.unit_number_match || "",
          media_role: options.media_role
        };
      });
      const res = await fetch(
        `/api/developer-projects/projects/${activeProjectDetail.id}/media/batch`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            store_id: sid,
            items: itemsToSave,
            setFirstAsCover: Boolean(options.setFirstAsCover)
          })
        }
      );
      if (res.ok) {
        const updatedProj = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
        setActiveProjectDetail(updatedProj);
        toast.success(`${itemsToSave.length} görsel bağlantısı web vitrinine eklendi.`);
      } else {
        toast.error("URL görselleri kaydedilemedi.");
      }
    } catch {
      toast.error("URL ekleme sırasında hata oluştu.");
    } finally {
      setUploadingSectionMedia(false);
    }
  };

  const handleEventMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mediaKind: "image" | "video"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingEventMedia(true);
    try {
      const uploadedItems: Array<{ id: string; name: string; url: string; type: "image" | "video" }> = [];
      for (let i = 0; i < files.length; i++) {
        let f = files[i];
        const isImg = f.type.startsWith("image/") || mediaKind === "image";
        if (isImg && f.type.startsWith("image/") && !f.type.includes("svg")) {
          try {
            f = await compressImageFile(f, 1600, 0.84);
          } catch {}
        }
        const fd = new FormData();
        fd.append("file", f);
        const res = await api.upload("/api/upload", fd);
        if (res && res.url) {
          uploadedItems.push({
            id: `ev_media_${Date.now()}_${i}`,
            name: files[i].name,
            url: res.url,
            type: isImg && !files[i].name.toLowerCase().match(/\.(mp4|mov|webm)$/) ? "image" : "video"
          });
        }
      }
      if (uploadedItems.length > 0) {
        setNewEventForm((prev) => {
          const nextGallery = [...prev.media_gallery, ...uploadedItems];
          const firstImage = nextGallery.find((m) => m.type === "image")?.url || prev.cover_image;
          const firstVideo = nextGallery.find((m) => m.type === "video")?.url || prev.video_url;
          return {
            ...prev,
            cover_image: prev.cover_image || firstImage || "",
            video_url: prev.video_url || firstVideo || "",
            media_preview_url:
              prev.media_preview_url || firstVideo || firstImage || uploadedItems[0].name,
            media_gallery: nextGallery
          };
        });
        toast.success(`${uploadedItems.length} etkinlik medyası eklendi.`);
      }
    } catch {
      toast.error("Etkinlik medyası yüklenemedi.");
    } finally {
      setUploadingEventMedia(false);
      if (eventImageInputRef.current) eventImageInputRef.current.value = "";
      if (eventVideoInputRef.current) eventVideoInputRef.current.value = "";
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim()) {
      toast.error("Proje adı zorunludur.");
      return;
    }
    try {
      const sid = storeId || user?.store_id || 1;
      const method = editingProjectId ? "PUT" : "POST";
      const url = editingProjectId
        ? `/api/developer-projects/projects/${editingProjectId}`
        : "/api/developer-projects/projects";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...projectForm, store_id: sid })
      });
      if (res.ok) {
        const saved = await res.json();
        if (editingProjectId) {
          setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
          if (activeProjectDetail?.id === saved.id) setActiveProjectDetail(saved);
          toast.success(`${saved.name} güncellendi.`);
        } else {
          setProjects((prev) => [...prev, saved]);
          handleSelectSingleProject(saved, true);
          toast.success(`${saved.name} projesi oluşturuldu.`);
        }
        setIsProjectFormOpen(false);
        setEditingProjectId(null);
      }
    } catch {
      toast.error("Proje kaydedilemedi.");
    }
  };

  const openEditProject = (proj: any) => {
    setEditingProjectId(proj.id);
    setProjectForm({
      name: proj.name || "",
      folder_prefix: proj.folder_prefix || "",
      region: proj.region || "Girne",
      sub_region: proj.sub_region || "Esentepe",
      concept_tagline: proj.concept_tagline || "",
      completion_date: proj.completion_date || "Q4 2027",
      construction_progress: Number(proj.construction_progress) || 50,
      total_units: Number(proj.total_units) || 120,
      available_units: Number(proj.available_units) || 40,
      starting_price: Number(proj.starting_price) || 150000,
      down_payment_percent: Number(proj.payment_plan?.down_payment_percent) || 35,
      installment_months: Number(proj.payment_plan?.installment_months) || 36,
      annual_rental_yield_percent: Number(proj.investment_metrics?.annual_rental_yield_percent) || 10,
      capital_appreciation_percent: Number(proj.investment_metrics?.capital_appreciation_percent) || 45,
      cover_image: proj.cover_image || "",
      payment_notes: proj.payment_plan?.notes || ""
    });
    setIsProjectFormOpen(true);
  };

  const handleAddCommonAreaSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectDetail || !newCommonSpecForm.spec_text.trim()) return;
    try {
      const sid = storeId || user?.store_id || 1;
      const text = newCommonSpecForm.spec_text.trim();
      const group = newCommonSpecForm.facility_group;
      const payload: any = { store_id: sid };
      if (group === "architectural_specs") {
        payload.architectural_specs = [
          ...extractFacilityItems(activeProjectDetail.architectural_specs),
          text
        ];
      } else {
        const rawFac = activeProjectDetail.lifestyle_facilities;
        const curFac =
          rawFac && typeof rawFac === "object" && !Array.isArray(rawFac)
            ? { ...rawFac }
            : { beach_marina: extractFacilityItems(rawFac) };
        const groupList = extractFacilityItems(curFac[group]);
        payload.lifestyle_facilities = { ...curFac, [group]: [...groupList, text] };
      }
      const res = await fetch(`/api/developer-projects/projects/${activeProjectDetail.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        setActiveProjectDetail(saved);
        setNewCommonSpecForm((prev) => ({ ...prev, spec_text: "" }));
        setIsAddCommonSpecOpen(false);
        toast.success("Ortak alan verisi projeye eklendi.");
      }
    } catch {
      toast.error("Ortak alan verisi kaydedilemedi.");
    }
  };

  const handleAddMediaToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectDetail) return;

    const finalCategory =
      isCustomFolderMode && customFolderName.trim()
        ? customFolderName.trim()
        : newMediaForm.unit_type_match === "__COMMON_AREA__" &&
          newMediaForm.category === "Teknik & Mimari Planlar"
        ? "Ortak Alanlar & Sosyal Tesisler"
        : newMediaForm.category || "Teknik & Mimari Planlar";

    const sid = storeId || user?.store_id || 1;

    if (pendingBatchFiles.length > 0) {
      try {
        const items = pendingBatchFiles.map((bf) => ({
          name:
            pendingBatchFiles.length === 1 && newMediaForm.name.trim()
              ? newMediaForm.name.trim()
              : bf.name,
          type: inferMediaType(bf.name, finalCategory, newMediaForm.media_role),
          category: finalCategory,
          url: bf.url,
          unit_type_match: newMediaForm.unit_type_match,
          media_role: newMediaForm.media_role
        }));
        const res = await fetch(
          `/api/developer-projects/projects/${activeProjectDetail.id}/media/batch`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              store_id: sid,
              items,
              setFirstAsCover:
                newMediaForm.media_role === "masterplan" && !activeProjectDetail.cover_image
            })
          }
        );
        if (res.ok) {
          const updatedProj = await res.json();
          setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
          setActiveProjectDetail(updatedProj);
          setPendingBatchFiles([]);
          setIsAddMediaOpen(false);
          setIsCustomFolderMode(false);
          setCustomFolderName("");
          setNewMediaForm((prev) => ({ ...prev, name: "", url: "" }));
          toast.success(`${items.length} dosya eşleştirilerek projeye eklendi.`);
        } else {
          toast.error("Dosyalar eklenemedi.");
        }
      } catch {
        toast.error("Dosyalar eklenemedi.");
      }
      return;
    }

    if (pendingBatchFiles.length === 0) {
      const trimmedUrl = newMediaForm.url.trim();
      const isYt = isYouTubeUrl(trimmedUrl);
      if (!newMediaForm.name.trim() && !isYt) {
        toast.error("Lütfen bir dosya seçin veya dosya adını/YouTube linkini girin.");
        return;
      }

      const resolvedName =
        newMediaForm.name.trim() ||
        (isYt ? `${activeProjectDetail.name} — YouTube Tanıtım Videosu` : "Yeni Medya");
      const finalType = inferMediaType(
        resolvedName,
        finalCategory,
        newMediaForm.media_role,
        trimmedUrl
      );
      try {
        const res = await fetch(`/api/developer-projects/projects/${activeProjectDetail.id}/media`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: resolvedName,
            type: finalType,
            category: isYt && finalCategory === "Teknik & Mimari Planlar" ? "Sosyal Medya & Tanıtım Videoları" : finalCategory,
            url: trimmedUrl || activeProjectDetail.cover_image,
            unit_type_match: newMediaForm.unit_type_match,
            media_role: isYt ? "video" : newMediaForm.media_role,
            conflictMode: duplicateConflictMode,
            store_id: sid
          })
        });
        if (res.ok) {
          const updatedProj = await res.json();
          setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
          setActiveProjectDetail(updatedProj);
          setIsAddMediaOpen(false);
          setIsCustomFolderMode(false);
          setCustomFolderName("");
          setNewMediaForm((prev) => ({ ...prev, name: "", url: "" }));
          if (updatedProj.resolutionAction === "overwritten") {
            toast.success("Aynı isimli eski dosyanın üzerine yazılarak güncellendi.");
          } else if (updatedProj.resolutionAction === "versioned") {
            toast.success("Eski dosya korundu ve yeni versiyon olarak kaydedildi.");
          } else {
            toast.success(
              isYt
                ? "YouTube videosu projeye eklendi; web vitrininde ve paydaş paylaşımında aktif."
                : "Medya / teknik çizim eşleştirilerek projeye eklendi."
            );
          }
        }
      } catch {
        toast.error("Dosya eklenemedi.");
      }
      return;
    }
  };

  const openUploadForTarget = (
    targetMatch: string,
    role: MediaRoleType,
    defaultCategory?: string
  ) => {
    const resolvedCategory =
      defaultCategory ||
      (role === "video"
        ? "Sosyal Medya & Tanıtım Videoları"
        : role === "masterplan"
        ? "Masterplan & Kat Planları"
        : role === "lifestyle" || targetMatch === "COMMON_AREAS" || targetMatch === "__COMMON_AREA__"
        ? "Ortak Alanlar & Sosyal Tesisler"
        : role === "floorplan"
        ? "Teknik & Mimari Planlar"
        : "4K Görsel & Render Paketi");
    setPendingBatchFiles([]);
    setNewMediaForm({
      name: "",
      type: role === "video" ? "video" : role === "floorplan" ? "masterplan" : "photos",
      category: resolvedCategory,
      url: "",
      unit_type_match: targetMatch === "COMMON_AREAS" ? "__COMMON_AREA__" : targetMatch,
      media_role: role
    });
    setIsCustomFolderMode(false);
    setIsAddMediaOpen(true);
  };

  const handleDirectLocalDownload = async (
    url?: string,
    rawFileName?: string,
    fallbackCover?: string
  ) => {
    const effectiveUrl = String(
      url || fallbackCover || activeProjectDetail?.cover_image || ""
    ).trim();
    if (!effectiveUrl) {
      toast.error("İndirilecek dosya bağlantısı bulunamadı.");
      return;
    }
    if (!isDownloadableAssetUrl(effectiveUrl)) {
      toast.info(
        "YouTube ve klasör bağlantıları yerel bilgisayara indirilemez; önizlemeden izleyebilir veya paydaşlarla link olarak paylaşabilirsiniz."
      );
      return;
    }
    let safeFileName = String(rawFileName || "proje-dosyasi.jpg")
      .replace(/[/\\?%*:|"<>]/g, "-")
      .trim();
    if (!safeFileName.match(/\.(jpg|jpeg|png|webp|mp4|mov|pdf|zip)$/i)) {
      safeFileName = `${safeFileName}.jpg`;
    }
    try {
      setDownloadingMedia(true);
      let blob: Blob | null = null;
      if (effectiveUrl.startsWith("/api/storage/") || effectiveUrl.startsWith("/uploads/")) {
        const directRes = await fetch(effectiveUrl);
        if (directRes.ok) blob = await directRes.blob();
      }
      if (!blob) {
        const proxyUrl = `/api/developer-projects/download-asset?url=${encodeURIComponent(
          effectiveUrl
        )}&name=${encodeURIComponent(safeFileName)}&fallback=${encodeURIComponent(
          fallbackCover || activeProjectDetail?.cover_image || ""
        )}`;
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) blob = await proxyRes.blob();
      }
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = safeFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
        toast.success(`"${safeFileName}" yerel dosyalara indirildi.`);
      } else {
        toast.error("Dosya yerel bilgisayara indirilemedi.");
      }
    } catch {
      toast.error("İndirme sırasında hata oluştu.");
    } finally {
      setDownloadingMedia(false);
    }
  };

  const handleBulkDownloadMedia = async (items: any[]) => {
    if (!Array.isArray(items) || items.length === 0) {
      toast.error("Lütfen indirilecek en az bir dosya seçin.");
      return;
    }
    const downloadable = items.filter((item) =>
      isDownloadableAssetUrl(item?.url || activeProjectDetail?.cover_image)
    );
    if (downloadable.length === 0) {
      toast.info("Seçili medyalar YouTube veya harici link olduğu için indirilemez; paydaş paylaşım butonlarını kullanabilirsiniz.");
      return;
    }
    if (downloadable.length < items.length) {
      toast.info(`${items.length - downloadable.length} adet YouTube/link atlandı, ${downloadable.length} indirilebilir dosya indiriliyor...`);
    } else {
      toast.info(`${downloadable.length} adet dosya sırayla yerel dosyalara indiriliyor...`);
    }
    for (let i = 0; i < downloadable.length; i++) {
      const item = downloadable[i];
      await handleDirectLocalDownload(
        item.url || activeProjectDetail?.cover_image,
        item.name || `gorsel-${i + 1}.jpg`,
        activeProjectDetail?.cover_image
      );
      if (i < downloadable.length - 1) await new Promise((r) => setTimeout(r, 250));
    }
  };

  const handleDeleteMediaFromProject = async (mediaId: string, mediaName?: string) => {
    if (!activeProjectDetail) return;
    try {
      const sid = storeId || user?.store_id || 1;
      const nameParam = mediaName ? `&name=${encodeURIComponent(mediaName)}` : "";
      const res = await fetch(
        `/api/developer-projects/projects/${activeProjectDetail.id}/media/${encodeURIComponent(
          mediaId || "by_name"
        )}?store_id=${sid}${nameParam}`,
        { method: "DELETE", headers: getAuthHeaders() }
      );
      if (res.ok) {
        const updatedProj = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
        setActiveProjectDetail(updatedProj);
        setSelectedPhotoIds((prev) => prev.filter((id) => id !== String(mediaId)));
        if (previewAsset && (previewAsset.id === mediaId || previewAsset.name?.includes(mediaName || ""))) {
          setPreviewAsset(null);
        }
        toast.success("Görsel / dosya projeden silindi.");
      } else {
        toast.error("Dosya silinemedi.");
      }
    } catch {
      toast.error("Dosya silinemedi.");
    }
  };

  const handleBulkDeleteMediaFromProject = async (items: any[]) => {
    if (!activeProjectDetail || !Array.isArray(items) || items.length === 0) return;
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(
        `/api/developer-projects/projects/${activeProjectDetail.id}/media/bulk-delete?store_id=${sid}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            store_id: sid,
            mediaIds: items.map((m) => String(m.id || "")).filter(Boolean),
            mediaNames: items.map((m) => String(m.name || "")).filter(Boolean)
          })
        }
      );
      if (res.ok) {
        const updatedProj = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
        setActiveProjectDetail(updatedProj);
        setSelectedPhotoIds([]);
        toast.success(`${items.length} adet seçili görsel silindi.`);
      }
    } catch {
      toast.error("Toplu silme sırasında hata oluştu.");
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/units", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newUnitForm, project_id: activeProjectId, store_id: sid })
      });
      if (res.ok) {
        const created = await res.json();
        setUnits((prev) => [created, ...prev]);
        setIsAddUnitOpen(false);
        toast.success(
          `${created.block_name} / ${created.unit_number} eklendi ve Google Drive'da güncellendi.`
        );
      }
    } catch {
      toast.error("Ünite eklenemedi.");
    }
  };

  const handleBatchGenerateUnits = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGeneratingBatch(true);
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/units/batch-generate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...batchForm, project_id: activeProjectId, store_id: sid })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsBatchGeneratorOpen(false);
        toast.success(`${data.createdCount} adet bağımsız bölüm üretildi ve Google Drive'da revize edildi.`);
        await fetchOverview();
      } else {
        toast.error(data.error || "Toplu seri üretimi başarısız.");
      }
    } catch {
      toast.error("Toplu bağımsız bölüm üretilirken hata oluştu.");
    } finally {
      setGeneratingBatch(false);
    }
  };

  const handleSaveUnitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisingUnit?.id) return;
    try {
      setSavingUnitRevision(true);
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/units/${revisingUnit.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          store_id: sid,
          project_id: revisingUnit.project_id,
          block_name: revisingUnit.block_name,
          floor_level: revisingUnit.floor_level,
          unit_number: revisingUnit.unit_number,
          unit_type: revisingUnit.unit_type,
          gross_sqm: Number(revisingUnit.gross_sqm) || 80,
          net_sqm: Number(revisingUnit.net_sqm) || 64,
          terrace_sqm: Number(revisingUnit.terrace_sqm) || 16,
          view_direction: revisingUnit.view_direction,
          facade_orientation: revisingUnit.facade_orientation,
          position_tag: revisingUnit.position_tag,
          price: Number(revisingUnit.price) || 150000,
          status: revisingUnit.status,
          optioned_client_name: revisingUnit.optioned_client_name || "",
          closing_stage: revisingUnit.closing_stage || ""
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setUnits((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
        if (droneTargetUnit?.id === updated.id) setDroneTargetUnit({ ...droneTargetUnit, ...updated });
        setRevisingUnit(null);
        toast.success(
          `${updated.block_name} • Kapı No: ${updated.unit_number} revize edildi ve Google Drive'a işlendi.`
        );
      } else {
        toast.error("Ünite revizyonu kaydedilemedi.");
      }
    } catch {
      toast.error("Ünite revizyonu sırasında hata oluştu.");
    } finally {
      setSavingUnitRevision(false);
    }
  };

  const handleSaveGroupBulkRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisingGroup || revisingGroup.unitIds.length === 0) return;
    try {
      setSavingUnitRevision(true);
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/units/bulk-group-revise", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          store_id: sid,
          unitIds: revisingGroup.unitIds,
          new_block_name: revisingGroup.block_name || undefined,
          new_unit_type: revisingGroup.unit_type || undefined,
          new_view_direction: revisingGroup.view_direction || undefined,
          new_floor_level: revisingGroup.floor_level || undefined,
          new_status: revisingGroup.status || undefined,
          new_price: revisingGroup.price ? Number(revisingGroup.price) : undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRevisingGroup(null);
        toast.success(`${data.updatedCount} adet bağımsız bölüm toplu revize edildi ve Google Drive'da güncellendi.`);
        await fetchOverview();
      } else {
        toast.error(data.error || "Toplu grup revizyonu başarısız.");
      }
    } catch {
      toast.error("Grup revizyonu kaydedilemedi.");
    } finally {
      setSavingUnitRevision(false);
    }
  };

  const handleDeleteUnit = async (unitId: number, unitNoLabel?: string) => {
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/units/${unitId}?store_id=${sid}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setUnits((prev) => prev.filter((u) => Number(u.id) !== Number(unitId)));
        if (revisingUnit && Number(revisingUnit.id) === Number(unitId)) setRevisingUnit(null);
        toast.success(
          unitNoLabel
            ? `Bağımsız bölüm Kapı No ${unitNoLabel} silindi ve Google Drive revize edildi.`
            : "Bağımsız bölüm kapı numarası silindi ve Google Drive revize edildi."
        );
      } else {
        toast.error("Bağımsız bölüm silinemedi.");
      }
    } catch {
      toast.error("Bağımsız bölüm silinemedi.");
    }
  };

  const handleDeleteUnitGroup = async (unitIds: number[], groupLabel: string) => {
    if (!Array.isArray(unitIds) || unitIds.length === 0) return;
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/units/bulk-delete", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ store_id: sid, unitIds })
      });
      if (res.ok) {
        const idSet = new Set(unitIds.map((id) => Number(id)));
        setUnits((prev) => prev.filter((u) => !idSet.has(Number(u.id))));
        if (revisingUnit && idSet.has(Number(revisingUnit.id))) setRevisingUnit(null);
        if (revisingGroup) setRevisingGroup(null);
        toast.success(`${groupLabel} grubundaki ${unitIds.length} adet bağımsız bölüm kapı numarası silindi.`);
      } else {
        toast.error("Grup kapı numaraları silinemedi.");
      }
    } catch {
      toast.error("Toplu kapı numarası silme sırasında hata oluştu.");
    }
  };

  const handleUnitStatusChange = async (unitId: number, newStatus: string) => {
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/units/${unitId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ store_id: sid, status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, ...updated } : u)));
        if (droneTargetUnit?.id === unitId) {
          setDroneTargetUnit((prev: any) => (prev ? { ...prev, ...updated } : prev));
        }
        toast.success(`Kapı No ${updated.unit_number} statüsü güncellendi ve Google Drive'a işlendi.`);
      }
    } catch {
      toast.error("Ünite durumu güncellenemedi.");
    }
  };

  const handleUnitPriceSave = async (unitId: number) => {
    const newPrice = editingUnitPrices[unitId];
    if (newPrice === undefined || newPrice <= 0) return;
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/units/${unitId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ store_id: sid, price: newPrice })
      });
      if (res.ok) {
        const updated = await res.json();
        setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, ...updated } : u)));
        setEditingUnitPrices((prev) => {
          const copy = { ...prev };
          delete copy[unitId];
          return copy;
        });
        toast.success(
          `Kapı No ${updated.unit_number} fiyatı £${new Intl.NumberFormat("tr-TR").format(newPrice)} olarak güncellendi.`
        );
      }
    } catch {
      toast.error("Fiyat güncellenemedi.");
    }
  };

  const handleCreateInternalStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.full_name.trim()) {
      toast.error("Ad soyad zorunludur.");
      return;
    }
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/internal-staff", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newStaffForm, store_id: sid })
      });
      if (res.ok) {
        const created = await res.json();
        setInternalStaff((prev) => [...prev, created]);
        setIsNewStaffOpen(false);
        setNewStaffForm({
          full_name: "",
          title_role: "Proje Mimarı",
          department: "Teknik & Mimari",
          email: "",
          phone: "+90 548 860 00 09",
          assigned_regions: "Tüm Projeler",
          permissions: {
            can_manage_projects: true,
            can_upload_media: true,
            can_manage_prices: false,
            can_manage_users: false
          }
        });
        toast.success(`${created.full_name} şirket ekibine eklendi.`);
      }
    } catch {
      toast.error("Kullanıcı eklenemedi.");
    }
  };

  const handleToggleStaffPermission = async (
    staffMember: any,
    permKey: "can_manage_projects" | "can_upload_media" | "can_manage_prices" | "can_manage_users"
  ) => {
    const currentPerms = staffMember.permissions || {
      can_manage_projects:
        staffMember.department === "Yönetim" || staffMember.department === "Teknik & Mimari",
      can_upload_media: true,
      can_manage_prices: staffMember.department === "Yönetim" || staffMember.department === "Satış",
      can_manage_users: staffMember.department === "Yönetim"
    };
    const nextPerms = { ...currentPerms, [permKey]: !currentPerms[permKey] };
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/internal-staff/${staffMember.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ store_id: sid, permissions: nextPerms })
      });
      if (res.ok) {
        const updated = await res.json();
        setInternalStaff((prev) => prev.map((s) => (s.id === staffMember.id ? updated : s)));
        toast.success(`${staffMember.full_name} yetkileri güncellendi.`);
      }
    } catch {
      toast.error("Yetki güncellenemedi.");
    }
  };

  const handleDeleteInternalStaff = async (id: number) => {
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/internal-staff/${id}?store_id=${sid}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setInternalStaff((prev) => prev.filter((s) => s.id !== id));
        toast.success("Kullanıcı silindi.");
      }
    } catch {
      toast.error("Silinemedi.");
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.title.trim()) {
      toast.error("Etkinlik başlığı zorunludur.");
      return;
    }
    try {
      const sid = storeId || user?.store_id || 1;
      const method = editingEventId ? "PUT" : "POST";
      const url = editingEventId
        ? `/api/developer-projects/events/${editingEventId}`
        : "/api/developer-projects/events";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newEventForm, store_id: sid })
      });
      if (res.ok) {
        const saved = await res.json();
        if (editingEventId) {
          setEvents((prev) => prev.map((ev) => (ev.id === saved.id ? saved : ev)));
          toast.success("Etkinlik ve medya galerisi güncellendi.");
        } else {
          setEvents((prev) => [saved, ...prev]);
          toast.success("Etkinlik görsel ve videolarıyla oluşturuldu.");
        }
        setIsNewEventOpen(false);
        setEditingEventId(null);
      }
    } catch {
      toast.error("Etkinlik kaydedilemedi.");
    }
  };

  const handleOpenEditEvent = (ev: any) => {
    setEditingEventId(ev.id);
    setNewEventForm({
      title: ev.title || "",
      event_type: ev.event_type || "launch_party",
      project_name: ev.project_name || projects[0]?.name || "Mykonos Homes",
      event_date: ev.event_date || "2026-07-10 19:30",
      location: ev.location || "",
      target_regions: ev.target_regions || "Yönetim, Satış ve PR Ekibi",
      media_preview_url: ev.media_preview_url || "",
      cover_image: ev.cover_image || "",
      video_url: ev.video_url || "",
      media_gallery: Array.isArray(ev.media_gallery) ? ev.media_gallery : [],
      max_capacity: Number(ev.max_capacity) || 200,
      description: ev.description || ""
    });
    setIsNewEventOpen(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/events/${eventId}?store_id=${sid}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
        toast.success("Etkinlik silindi.");
      }
    } catch {
      toast.error("Etkinlik silinemedi.");
    }
  };

  const selectedProjectUnits = useMemo(() => {
    const raw = units.filter((u) => Number(u.project_id) === Number(activeProjectId));
    const seen = new Set<string>();
    return raw.map((u, idx) => {
      const doorKey = `${String(u.block_name || "").trim()}__${String(u.unit_number || "").trim()}`;
      if (seen.has(doorKey) && u.unit_number) {
        return { ...u, unit_number: `${u.unit_number}-${idx + 1}` };
      }
      seen.add(doorKey);
      return u;
    });
  }, [units, activeProjectId]);

  const availableBlocks = useMemo(() => {
    const unitBlocks = selectedProjectUnits.map((u) => String(u.block_name || "").trim()).filter(Boolean);
    const customBlocks = customBlocksByProject[activeProjectId] || [];
    const fallbackDefaults = [
      "A Blok (Sahil)",
      "B Blok (Merkez)",
      "C Blok (Deniz Cephesi)",
      "VIP Villa Etabı"
    ];
    return Array.from(new Set([...unitBlocks, ...customBlocks, ...fallbackDefaults]));
  }, [selectedProjectUnits, customBlocksByProject, activeProjectId]);

  const handleConfirmAddCustomBlock = (
    targetProjId: number,
    onSelectBlock?: (blk: string) => void
  ) => {
    const clean = newCustomBlockName.trim();
    if (!clean) {
      toast.error("Lütfen eklenecek blok adını yazın.");
      return;
    }
    setCustomBlocksByProject((prev) => ({
      ...prev,
      [targetProjId]: Array.from(new Set([clean, ...(prev[targetProjId] || [])]))
    }));
    if (onSelectBlock) onSelectBlock(clean);
    setNewCustomBlockName("");
    setIsAddingCustomBlock(false);
    toast.success(`"${clean}" blok listesine eklendi ve seçildi.`);
  };

  const availableUnitTypes = useMemo(() => {
    return Array.from(
      new Set(selectedProjectUnits.map((u) => String(u.unit_type || "").trim()).filter(Boolean))
    );
  }, [selectedProjectUnits]);

  const filteredUnits = useMemo(() => {
    return selectedProjectUnits.filter((u) => {
      if (unitStatusFilter !== "all" && u.status !== unitStatusFilter) return false;
      if (unitBlockFilter !== "all" && String(u.block_name || "").trim() !== unitBlockFilter)
        return false;
      if (unitTypeFilter !== "all" && String(u.unit_type || "").trim() !== unitTypeFilter)
        return false;
      if (unitSearch.trim()) {
        const q = unitSearch.toLowerCase();
        const match =
          u.unit_number?.toLowerCase().includes(q) ||
          u.unit_type?.toLowerCase().includes(q) ||
          u.block_name?.toLowerCase().includes(q) ||
          u.floor_level?.toLowerCase().includes(q) ||
          u.view_direction?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [selectedProjectUnits, unitStatusFilter, unitBlockFilter, unitTypeFilter, unitSearch]);

  const unitTypeGroups = useMemo(() => {
    const map = new Map<string, any>();
    filteredUnits.forEach((u) => {
      const key = `${u.project_id}__${u.unit_type}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          project_id: Number(u.project_id),
          project_name: activeProjectDetail?.name || u.project_name || "Proje",
          unit_type: u.unit_type || "Standart Ünite",
          total: 0,
          available: 0,
          negotiation: 0,
          optioned: 0,
          sold: 0,
          minPrice: Number(u.price) || 0,
          maxPrice: Number(u.price) || 0,
          grossSqm: Number(u.gross_sqm) || 0,
          netSqm: Number(u.net_sqm) || 0,
          terraceSqm: Number(u.terrace_sqm) || 0,
          blocks: new Set<string>(),
          floors: new Set<string>(),
          views: new Set<string>(),
          units: []
        });
      }
      const grp = map.get(key)!;
      const p = Number(u.price) || 0;
      grp.total += 1;
      if (u.status === "available") grp.available += 1;
      else if (u.status === "negotiation") grp.negotiation += 1;
      else if (u.status === "optioned") grp.optioned += 1;
      else if (u.status === "sold") grp.sold += 1;
      if (p < grp.minPrice) grp.minPrice = p;
      if (p > grp.maxPrice) grp.maxPrice = p;
      if (u.block_name) grp.blocks.add(u.block_name);
      if (u.floor_level) grp.floors.add(u.floor_level);
      if (u.view_direction) grp.views.add(u.view_direction);
      grp.units.push(u);
    });
    return Array.from(map.values());
  }, [filteredUnits, activeProjectDetail]);

  const projectPropertyTypes = useMemo(() => {
    const map = new Map<string, any>();
    const vault: any[] = Array.isArray(activeProjectDetail?.media_vault)
      ? activeProjectDetail.media_vault
      : [];
    const isSharedOrDefaultMedia = (m: any) =>
      !m.unit_type_match ||
      m.unit_type_match === "ALL" ||
      m.unit_type_match === "__COMMON_AREA__" ||
      m.unit_type_match === "COMMON_AREAS";
    const isPhotoLikeRole = (role?: string) =>
      role === "photo" ||
      role === "exterior" ||
      role === "interior" ||
      role === "lifestyle" ||
      role === "masterplan";

    const generalPhotos = vault.filter(
      (m) =>
        isSharedOrDefaultMedia(m) &&
        !isYouTubeUrl(m.url) &&
        (m.type === "photos" ||
          isPhotoLikeRole(m.media_role) ||
          String(m.category || "").toLowerCase().includes("görsel"))
    );
    const generalVideos = vault.filter(
      (m) =>
        isSharedOrDefaultMedia(m) &&
        (m.type === "video" ||
          m.media_role === "video" ||
          isYouTubeUrl(m.url) ||
          String(m.category || "").toLowerCase().includes("video"))
    );
    const generalFloorplans = vault.filter(
      (m) =>
        isSharedOrDefaultMedia(m) &&
        (m.type === "masterplan" ||
          m.media_role === "floorplan" ||
          String(m.category || "").toLowerCase().includes("plan") ||
          String(m.name || "").toLowerCase().includes("floor"))
    );
    const mergeUniqueMedia = (specificList: any[], defaultList: any[]) => {
      const seen = new Set<string>();
      const combined: any[] = [];
      for (const item of [...specificList, ...defaultList]) {
        const key = String(item.id || item.name || item.url || "");
        if (!key || seen.has(key)) continue;
        seen.add(key);
        combined.push(item);
      }
      return combined;
    };
    selectedProjectUnits.forEach((u) => {
      const ut = String(u.unit_type || "Standart Daire").trim();
      if (!map.has(ut)) {
        const exactPhotos = vault.filter(
          (m) =>
            String(m.unit_type_match || "").toLowerCase() === ut.toLowerCase() &&
            !isYouTubeUrl(m.url) &&
            (isPhotoLikeRole(m.media_role) || m.type === "photos")
        );
        const exactVideos = vault.filter(
          (m) =>
            String(m.unit_type_match || "").toLowerCase() === ut.toLowerCase() &&
            (m.media_role === "video" || m.type === "video" || isYouTubeUrl(m.url))
        );
        const exactFloorplans = vault.filter(
          (m) =>
            String(m.unit_type_match || "").toLowerCase() === ut.toLowerCase() &&
            (m.media_role === "floorplan" || m.type === "masterplan")
        );
        map.set(ut, {
          unit_type: ut,
          total: 0,
          available: 0,
          optioned: 0,
          sold: 0,
          minPrice: Number(u.price) || 0,
          maxPrice: Number(u.price) || 0,
          grossSqm: Number(u.gross_sqm) || 0,
          netSqm: Number(u.net_sqm) || 0,
          terraceSqm: Number(u.terrace_sqm) || 0,
          blocks: [],
          floors: [],
          views: [],
          units: [],
          matchedPhotos: mergeUniqueMedia(exactPhotos, generalPhotos),
          matchedVideos: mergeUniqueMedia(exactVideos, generalVideos),
          matchedFloorplans: mergeUniqueMedia(exactFloorplans, generalFloorplans)
        });
      }
      const entry = map.get(ut)!;
      const p = Number(u.price) || 0;
      entry.total += 1;
      if (u.status === "available") entry.available += 1;
      else if (u.status === "sold") entry.sold += 1;
      else entry.optioned += 1;
      if (p < entry.minPrice) entry.minPrice = p;
      if (p > entry.maxPrice) entry.maxPrice = p;
      if (u.block_name && !entry.blocks.includes(u.block_name)) entry.blocks.push(u.block_name);
      if (u.floor_level && !entry.floors.includes(u.floor_level)) entry.floors.push(u.floor_level);
      if (u.view_direction && !entry.views.includes(u.view_direction))
        entry.views.push(u.view_direction);
      entry.units.push(u);
    });
    return Array.from(map.values());
  }, [selectedProjectUnits, activeProjectDetail]);

  const activePropertyTypeKey = useMemo(() => {
    if (
      selectedPropertyTypeKey &&
      projectPropertyTypes.some((pt) => pt.unit_type === selectedPropertyTypeKey)
    ) {
      return selectedPropertyTypeKey;
    }
    return projectPropertyTypes[0]?.unit_type || "";
  }, [selectedPropertyTypeKey, projectPropertyTypes]);

  const activePropertyType = useMemo(() => {
    return (
      projectPropertyTypes.find((pt) => pt.unit_type === activePropertyTypeKey) ||
      projectPropertyTypes[0] ||
      null
    );
  }, [projectPropertyTypes, activePropertyTypeKey]);

  const unitTypeScopedUnits = useMemo(() => {
    if (unitTypeFilter === "all") return selectedProjectUnits;
    return selectedProjectUnits.filter(
      (u) => String(u.unit_type || "").trim() === unitTypeFilter
    );
  }, [selectedProjectUnits, unitTypeFilter]);

  const selectedProjectCommonAreaMedia = useMemo(() => {
    const vault: any[] = Array.isArray(activeProjectDetail?.media_vault)
      ? activeProjectDetail.media_vault
      : [];
    return vault.filter(
      (m) =>
        !m.unit_type_match ||
        m.unit_type_match === "__COMMON_AREA__" ||
        m.unit_type_match === "COMMON_AREAS"
    );
  }, [activeProjectDetail]);

  const blockStackingMatrix = useMemo(() => {
    const blocksMap = new Map<string, { blockTitle: string; projectName: string; floorsMap: Map<string, any[]> }>();
    filteredUnits.forEach((u) => {
      const bKey = `${u.block_name || "A Blok"}`;
      if (!blocksMap.has(bKey)) {
        blocksMap.set(bKey, {
          blockTitle: u.block_name || "A Blok",
          projectName: activeProjectDetail?.name || u.project_name || "",
          floorsMap: new Map<string, any[]>()
        });
      }
      const blk = blocksMap.get(bKey)!;
      const flKey = u.floor_level || "Zemin";
      if (!blk.floorsMap.has(flKey)) blk.floorsMap.set(flKey, []);
      blk.floorsMap.get(flKey)!.push(u);
    });
    return Array.from(blocksMap.values()).map((b) => ({
      blockTitle: b.blockTitle,
      projectName: b.projectName,
      floors: Array.from(b.floorsMap.entries()).map(([floorName, floorUnits]) => ({
        floorName,
        units: floorUnits
      }))
    }));
  }, [filteredUnits, activeProjectDetail]);

  const filteredStaff = useMemo(() => {
    if (staffDeptFilter === "all") return internalStaff;
    return internalStaff.filter((s) => s.department === staffDeptFilter);
  }, [internalStaff, staffDeptFilter]);

  const projectFolderTabs = useMemo(() => {
    const list: any[] = activeProjectDetail?.media_vault || [];
    return Array.from(
      new Set(list.map((d) => String(d?.category || "Genel Dosyalar").trim()).filter(Boolean))
    );
  }, [activeProjectDetail]);

  const filteredProjectMedia = useMemo(() => {
    const list: any[] = activeProjectDetail?.media_vault || [];
    if (mediaCategoryFilter === "all") return list;
    return list.filter((doc) => String(doc?.category || "").trim() === mediaCategoryFilter);
  }, [activeProjectDetail, mediaCategoryFilter]);

  const leftCompareProject = useMemo(
    () => projects.find((p) => Number(p.id) === Number(compareLeftId)) || projects[0],
    [projects, compareLeftId]
  );
  const rightCompareProject = useMemo(
    () =>
      projects.find((p) => Number(p.id) === Number(compareRightId)) || projects[1] || projects[0],
    [projects, compareRightId]
  );

  const handleSharePropertyTypePackage = (pt: any, mode: "copy" | "whatsapp") => {
    if (!activeProjectDetail) return;
    const availDoors = pt.units
      .filter((u: any) => u.status === "available")
      .map((u: any) => u.unit_number)
      .join(", ");
    const photoLinks = pt.matchedPhotos.map((m: any) => `${m.name}: ${m.url}`).join("\n");
    const videoLinks = pt.matchedVideos.map((m: any) => `${m.name}: ${m.url}`).join("\n");
    const planLinks = pt.matchedFloorplans.map((m: any) => `${m.name}: ${m.url}`).join("\n");
    const phone = activeCompany?.phone || branding?.phone || "+90 548 860 00 01";
    const text = [
      `*${companyDisplayName} — ${activeProjectDetail.name}*`,
      `Bölge: ${activeProjectDetail.sub_region} | Teslim: ${activeProjectDetail.completion_date}`,
      `*Mülk Tipi:* ${pt.unit_type}`,
      `*Alan:* ${pt.grossSqm} m² Brüt / ${pt.netSqm} m² Net (+${pt.terraceSqm} m² Teras)`,
      `*Müsait Kapı Noları (${pt.available} Adet):* ${availDoors || "Sorunuz"}`,
      `*Fiyat:* ${
        pt.minPrice === pt.maxPrice
          ? formatGbp(pt.minPrice)
          : `${formatGbp(pt.minPrice)} - ${formatGbp(pt.maxPrice)}`
      }`,
      `*Ödeme Planı:* %${activeProjectDetail.payment_plan?.down_payment_percent || 35} Peşinat, ${
        activeProjectDetail.payment_plan?.installment_months || 36
      } Ay %0 Faiz Taksit`,
      photoLinks ? `\n*Mülk Tipi Görselleri:*\n${photoLinks}` : "",
      videoLinks ? `\n*Tanıtım Videosu:*\n${videoLinks}` : "",
      planLinks ? `\n*Teknik Kat Çizimi (2D Plan):*\n${planLinks}` : "",
      `\nDetaylı Bilgi & Sunum: ${phone}`
    ]
      .filter(Boolean)
      .join("\n");
    if (mode === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    } else {
      navigator.clipboard.writeText(text);
      toast.success(`${pt.unit_type} mülk tipi bilgileri ve medya linkleri panoya kopyalandı.`);
    }
  };

  const handleShareCommonAreasPackage = (mode: "copy" | "whatsapp") => {
    if (!activeProjectDetail) return;
    const allFacs = [
      ...extractFacilityItems(activeProjectDetail.lifestyle_facilities),
      ...extractFacilityItems(activeProjectDetail.architectural_specs)
    ];
    const mediaLinks = selectedProjectCommonAreaMedia
      .slice(0, 5)
      .map((m: any) => `• ${m.name}: ${m.url}`)
      .join("\n");
    const phone = activeCompany?.phone || branding?.phone || "+90 548 860 00 01";
    const text = [
      `*${companyDisplayName} — ${activeProjectDetail.name} (Ortak Alanlar & Sosyal Tesisler)*`,
      `Lokasyon: ${activeProjectDetail.sub_region} | İnşaat: %${activeProjectDetail.construction_progress}`,
      `*Konsept:* ${activeProjectDetail.concept_tagline}`,
      `*Sosyal Tesisler & Ortak Alanlar:* ${allFacs.join(", ")}`,
      mediaLinks ? `\n*Ortak Alan Görsel, Video & Vaziyet Planları:*\n${mediaLinks}` : "",
      `\nİletişim: ${phone}`
    ]
      .filter(Boolean)
      .join("\n");
    if (mode === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    } else {
      navigator.clipboard.writeText(text);
      toast.success(`${activeProjectDetail.name} ortak alan bilgileri ve medya linkleri kopyalandı.`);
    }
  };

  const handleShareMediaAsset = (item: any, mode: "copy" | "whatsapp") => {
    const rawUrl = String(item?.url || item?.cover || "").trim();
    if (!rawUrl) {
      toast.error("Paylaşılacak medya linki bulunamadı.");
      return;
    }
    const shareUrl =
      rawUrl.startsWith("/") && typeof window !== "undefined"
        ? `${window.location.origin}${rawUrl}`
        : rawUrl;
    const projName = item?.projectName || activeProjectDetail?.name || companyDisplayName;
    const assetName = item?.rawName || item?.name || "Proje Medyası";
    if (mode === "whatsapp") {
      const msg = `*${companyDisplayName} — ${projName}*\n${assetName}\n${shareUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success(`"${assetName}" paydaş linki panoya kopyalandı.`);
    }
  };

  const handlePrintSheet = (project: any) =>
    printProjectSheet(project, companyDisplayName, activeCompany);

  const renderProjectEditForm = (titleLabel: string) => (
    <DeveloperProjectEditForm
      titleLabel={titleLabel}
      projectForm={projectForm}
      setProjectForm={setProjectForm}
      uploadingCover={uploadingCoverImage}
      onUploadCoverFile={handleUploadProjectCoverFile}
      onSubmit={handleSaveProject}
      onClose={() => {
        setIsProjectFormOpen(false);
        setEditingProjectId(null);
      }}
    />
  );

  const renderUnitRevisionForm = () => (
    <DeveloperUnitRevisionForm
      project={activeProjectDetail}
      revisingUnit={revisingUnit}
      setRevisingUnit={setRevisingUnit}
      activePropertyTypeKey={activePropertyTypeKey}
      availableBlocks={availableBlocks}
      savingUnitRevision={savingUnitRevision}
      uploadingMedia={uploadingSectionMedia}
      onBatchUploadSectionMedia={handleBatchUploadSectionMedia}
      onBatchAddUrlsSectionMedia={handleBatchAddUrlsSectionMedia}
      onDeleteMedia={handleDeleteMediaFromProject}
      onDirectDownload={handleDirectLocalDownload}
      onPreviewAsset={setPreviewAsset}
      onSubmit={handleSaveUnitRevision}
      onDeleteUnit={handleDeleteUnit}
    />
  );

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200 flex items-center justify-center gap-3 text-slate-700 font-medium text-sm">
        <FolderSync className="w-5 h-5 animate-spin text-indigo-600" />
        <span>Proje ve medya havuzu yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {activeTab !== "agencies" && (
        <div className="bg-white text-slate-900 rounded-xl p-2.5 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              {onBackToPortfolio && (
                <button
                  type="button"
                  onClick={onBackToPortfolio}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium border border-slate-300 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  ← Geri
                </button>
              )}

              <h2 className="text-sm font-semibold tracking-tight text-slate-950 whitespace-nowrap pr-1 border-r border-slate-200">
                {companyDisplayName}
              </h2>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase text-slate-500 whitespace-nowrap">
                  Proje:
                </span>
                <select
                  value={activeProjectDetail?.id || ""}
                  onChange={(e) => {
                    const target = projects.find((p) => Number(p.id) === Number(e.target.value));
                    if (target) {
                      handleSelectSingleProject(target, true);
                      if (activeTab === "compare" || activeTab === "events") setActiveTab("showcase");
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-medium outline-none cursor-pointer"
                >
                  {projects.map((p, idx) => (
                    <option key={p.id} value={p.id} className="bg-white text-slate-900">
                      {idx + 1}. {p.name} ({p.available_units} Müsait)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("showcase");
                  setProjectViewMode((prev) => (prev === "grid" ? "single" : "grid"));
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap border transition-colors ${
                  activeTab === "showcase" && projectViewMode === "grid"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Tüm Projeler ({projects.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("showcase");
                  setProjectViewMode("single");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap border transition-colors ${
                  (activeTab === "showcase" && projectViewMode === "single") ||
                  activeTab === "inventory"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Proje Portföyü</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("compare")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap border transition-colors ${
                  activeTab === "compare"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Karşılaştırma</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("events")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap border transition-colors ${
                  activeTab === "events"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Etkinlikler ({events.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDashboardOpen((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 border transition-colors ${
                  isDashboardOpen
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingProjectId(null);
                  setProjectForm({
                    name: "",
                    folder_prefix: `${projects.length + 1}. Yeni Proje`,
                    region: "Girne",
                    sub_region: "Esentepe Sahil",
                    concept_tagline: "Özel Havuzlu & Panoramik Deniz Manzaralı Sahil Rezidansları",
                    completion_date: "Q4 2027",
                    construction_progress: 25,
                    total_units: 120,
                    available_units: 120,
                    starting_price: 159000,
                    down_payment_percent: 35,
                    installment_months: 36,
                    annual_rental_yield_percent: 10.2,
                    capital_appreciation_percent: 45,
                    cover_image:
                      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85",
                    payment_notes:
                      "%35 Peşinat, kalan %65 için teslim tarihine kadar 36 ay %0 faiz şirket içi taksit."
                  });
                  setIsProjectFormOpen(true);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Yeni Proje</span>
              </button>
            </div>
          </div>

          {isDashboardOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
              <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200">
                <div className="text-[10px] text-slate-600 font-medium">Aktif Proje</div>
                <div className="text-sm font-semibold text-slate-950 font-mono tabular-nums truncate">
                  {activeProjectDetail ? activeProjectDetail.name : `${projects.length} Proje`}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  Toplam {projects.length} Proje Klasörü
                </div>
              </div>

              <div className="bg-emerald-50/70 rounded-lg px-2.5 py-1.5 border border-emerald-200">
                <div className="text-[10px] text-emerald-800 font-medium">Bağımsız Bölümler</div>
                <div className="text-sm font-semibold text-emerald-900 font-mono tabular-nums">
                  {selectedProjectUnits.filter((u) => u.status === "available").length} Müsait{" "}
                  <span className="text-xs text-slate-600 font-normal">
                    / {selectedProjectUnits.length} Kapı No
                  </span>
                </div>
                <div className="text-[10px] text-emerald-800 truncate">
                  {selectedProjectUnits.filter((u) => u.status === "optioned" || u.status === "negotiation").length}{" "}
                  Opsiyon · {selectedProjectUnits.filter((u) => u.status === "sold").length} Satıldı
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200">
                <div className="text-[10px] text-slate-700 font-medium">Medya & Teknik Paftalar</div>
                <div className="text-sm font-semibold text-slate-950 font-mono tabular-nums">
                  {(activeProjectDetail?.media_vault || []).length} Dosya
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {projectPropertyTypes.length} Mülk Tipi · {selectedProjectCommonAreaMedia.length} Ortak Medya
                </div>
              </div>

              <div className="bg-indigo-50/70 rounded-lg px-2.5 py-1.5 border border-indigo-200">
                <div className="text-[10px] text-indigo-900 font-medium">Başlangıç & Ödeme Planı</div>
                <div className="text-sm font-semibold text-indigo-950 font-mono tabular-nums">
                  {formatGbp(activeProjectDetail?.starting_price || 0)}
                </div>
                <div className="text-[10px] text-indigo-800 truncate">
                  %{activeProjectDetail?.payment_plan?.down_payment_percent || 35} Peşin ·{" "}
                  {activeProjectDetail?.payment_plan?.installment_months || 36} Ay %0 Taksit
                </div>
              </div>
            </div>
          )}

          {isProjectFormOpen && !editingProjectId && renderProjectEditForm("Yeni Proje Klasörü Tanımla")}
        </div>
      )}

      {activeTab === "showcase" && (
        <DeveloperShowcaseTab
          projects={projects}
          activeProjectDetail={activeProjectDetail}
          projectViewMode={projectViewMode}
          projectSubTab={projectSubTab}
          setProjectSubTab={setProjectSubTab}
          isProjectFormOpen={isProjectFormOpen}
          setIsProjectFormOpen={setIsProjectFormOpen}
          editingProjectId={editingProjectId}
          setEditingProjectId={setEditingProjectId}
          onSelectSingleProject={handleSelectSingleProject}
          onOpenEditProject={openEditProject}
          renderProjectEditForm={renderProjectEditForm}
          onPrintProjectSheet={handlePrintSheet}
          isAddMediaOpen={isAddMediaOpen}
          setIsAddMediaOpen={setIsAddMediaOpen}
          newMediaForm={newMediaForm}
          setNewMediaForm={setNewMediaForm}
          fileInputRef={fileInputRef}
          onDeviceFileSelect={handleDeviceFileSelect}
          uploadingLocalFile={uploadingLocalFile}
          isCustomFolderMode={isCustomFolderMode}
          setIsCustomFolderMode={setIsCustomFolderMode}
          customFolderName={customFolderName}
          setCustomFolderName={setCustomFolderName}
          availableProjectFolders={availableProjectFolders}
          existingDuplicateFile={existingDuplicateFile}
          duplicateConflictMode={duplicateConflictMode}
          setDuplicateConflictMode={setDuplicateConflictMode}
          onAddMediaToProject={handleAddMediaToProject}
          onOpenUploadForTarget={openUploadForTarget}
          uploadingSectionMedia={uploadingSectionMedia}
          pendingBatchFiles={pendingBatchFiles}
          setPendingBatchFiles={setPendingBatchFiles}
          onBatchUploadSectionMedia={handleBatchUploadSectionMedia}
          onBatchAddUrlsSectionMedia={handleBatchAddUrlsSectionMedia}
          onSetProjectCoverImage={handleSetProjectCoverImage}
          projectPropertyTypes={projectPropertyTypes}
          selectedProjectUnits={selectedProjectUnits}
          selectedProjectCommonAreaMedia={selectedProjectCommonAreaMedia}
          activePropertyTypeKey={activePropertyTypeKey}
          activePropertyType={activePropertyType}
          setSelectedPropertyTypeKey={setSelectedPropertyTypeKey}
          setUnitTypeFilter={setUnitTypeFilter}
          unitStatusFilter={unitStatusFilter}
          setUnitStatusFilter={setUnitStatusFilter}
          setInventoryViewMode={setInventoryViewMode}
          setActiveTab={setActiveTab}
          setSelectedProjectId={setSelectedProjectId}
          propertyTypeLayer={propertyTypeLayer}
          setPropertyTypeLayer={setPropertyTypeLayer}
          revisingUnit={revisingUnit}
          setRevisingUnit={setRevisingUnit}
          renderUnitRevisionForm={renderUnitRevisionForm}
          onSharePropertyTypePackage={handleSharePropertyTypePackage}
          onShareCommonAreasPackage={handleShareCommonAreasPackage}
          onShareMediaAsset={handleShareMediaAsset}
          onDeleteUnit={handleDeleteUnit}
          onDeleteUnitGroup={handleDeleteUnitGroup}
          selectedPhotoIds={selectedPhotoIds}
          setSelectedPhotoIds={setSelectedPhotoIds}
          downloadingMedia={downloadingMedia}
          onBulkDownloadMedia={handleBulkDownloadMedia}
          onBulkDeleteMediaFromProject={handleBulkDeleteMediaFromProject}
          onDirectLocalDownload={handleDirectLocalDownload}
          onDeleteMediaFromProject={handleDeleteMediaFromProject}
          setPreviewAsset={setPreviewAsset}
          newCommonSpecForm={newCommonSpecForm}
          setNewCommonSpecForm={setNewCommonSpecForm}
          onAddCommonAreaSpec={handleAddCommonAreaSpec}
          mediaCategoryFilter={mediaCategoryFilter}
          setMediaCategoryFilter={setMediaCategoryFilter}
          projectFolderTabs={projectFolderTabs}
          filteredProjectMedia={filteredProjectMedia}
        />
      )}

      {activeTab === "inventory" && (
        <DeveloperInventoryTab
          projects={projects}
          activeProjectDetail={activeProjectDetail}
          activeProjectId={activeProjectId}
          selectedProjectUnits={selectedProjectUnits}
          filteredUnits={filteredUnits}
          unitTypeGroups={unitTypeGroups}
          unitTypeScopedUnits={unitTypeScopedUnits}
          blockStackingMatrix={blockStackingMatrix}
          availableBlocks={availableBlocks}
          availableUnitTypes={availableUnitTypes}
          inventoryViewMode={inventoryViewMode}
          setInventoryViewMode={setInventoryViewMode}
          unitBlockFilter={unitBlockFilter}
          setUnitBlockFilter={setUnitBlockFilter}
          unitTypeFilter={unitTypeFilter}
          setUnitTypeFilter={setUnitTypeFilter}
          unitStatusFilter={unitStatusFilter}
          setUnitStatusFilter={setUnitStatusFilter}
          unitSearch={unitSearch}
          setUnitSearch={setUnitSearch}
          setSelectedPropertyTypeKey={setSelectedPropertyTypeKey}
          onReturnToPortfolio={() => {
            setActiveTab("showcase");
            setProjectViewMode("single");
          }}
          isBatchGeneratorOpen={isBatchGeneratorOpen}
          setIsBatchGeneratorOpen={setIsBatchGeneratorOpen}
          isAddUnitOpen={isAddUnitOpen}
          setIsAddUnitOpen={setIsAddUnitOpen}
          generatingBatch={generatingBatch}
          batchForm={batchForm}
          setBatchForm={setBatchForm}
          newUnitForm={newUnitForm}
          setNewUnitForm={setNewUnitForm}
          isAddingCustomBlock={isAddingCustomBlock}
          setIsAddingCustomBlock={setIsAddingCustomBlock}
          newCustomBlockName={newCustomBlockName}
          setNewCustomBlockName={setNewCustomBlockName}
          onConfirmAddCustomBlock={handleConfirmAddCustomBlock}
          onBatchGenerateUnits={handleBatchGenerateUnits}
          onAddUnit={handleAddUnit}
          revisingUnit={revisingUnit}
          setRevisingUnit={setRevisingUnit}
          renderUnitRevisionForm={renderUnitRevisionForm}
          revisingGroup={revisingGroup}
          setRevisingGroup={setRevisingGroup}
          savingUnitRevision={savingUnitRevision}
          onSaveGroupBulkRevision={handleSaveGroupBulkRevision}
          onDeleteUnit={handleDeleteUnit}
          onDeleteUnitGroup={handleDeleteUnitGroup}
          onUnitStatusChange={handleUnitStatusChange}
          editingUnitPrices={editingUnitPrices}
          setEditingUnitPrices={setEditingUnitPrices}
          onUnitPriceSave={handleUnitPriceSave}
        />
      )}

      {activeTab === "compare" && (
        <DeveloperCompareTab
          projects={projects}
          compareLeftId={compareLeftId}
          setCompareLeftId={setCompareLeftId}
          compareRightId={compareRightId}
          setCompareRightId={setCompareRightId}
          simulatorPriceGbp={simulatorPriceGbp}
          setSimulatorPriceGbp={setSimulatorPriceGbp}
          leftCompareProject={leftCompareProject}
          rightCompareProject={rightCompareProject}
          onPrintProjectSheet={handlePrintSheet}
        />
      )}

      {activeTab === "events" && (
        <DeveloperEventsTab
          events={events}
          projects={projects}
          isNewEventOpen={isNewEventOpen}
          setIsNewEventOpen={setIsNewEventOpen}
          editingEventId={editingEventId}
          setEditingEventId={setEditingEventId}
          newEventForm={newEventForm}
          setNewEventForm={setNewEventForm}
          uploadingEventMedia={uploadingEventMedia}
          eventImageInputRef={eventImageInputRef}
          eventVideoInputRef={eventVideoInputRef}
          onEventMediaUpload={handleEventMediaUpload}
          onSaveEvent={handleSaveEvent}
          onOpenEditEvent={handleOpenEditEvent}
          onDeleteEvent={handleDeleteEvent}
          onPreviewAsset={setPreviewAsset}
        />
      )}

      {activeTab === "agencies" && (
        <DeveloperStaffTab
          companyDisplayName={companyDisplayName}
          internalStaff={internalStaff}
          filteredStaff={filteredStaff}
          staffDeptFilter={staffDeptFilter}
          setStaffDeptFilter={setStaffDeptFilter}
          isNewStaffOpen={isNewStaffOpen}
          setIsNewStaffOpen={setIsNewStaffOpen}
          newStaffForm={newStaffForm}
          setNewStaffForm={setNewStaffForm}
          onCreateInternalStaff={handleCreateInternalStaff}
          onToggleStaffPermission={handleToggleStaffPermission}
          onDeleteInternalStaff={handleDeleteInternalStaff}
        />
      )}

      <DeveloperMediaLightboxModal
        previewAsset={previewAsset}
        setPreviewAsset={setPreviewAsset}
        downloadingMedia={downloadingMedia}
        onDeleteMediaFromProject={handleDeleteMediaFromProject}
        onDirectLocalDownload={handleDirectLocalDownload}
        onShareMediaAsset={handleShareMediaAsset}
      />
    </div>
  );
};
