import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FolderSync,
  Users,
  Layers,
  Calendar,
  CheckCircle2,
  Plus,
  Search,
  Download,
  Play,
  FileText,
  Image as ImageIcon,
  Video,
  MapPin,
  ArrowLeftRight,
  Award,
  Calculator,
  Printer,
  Edit3,
  Trash2,
  Save,
  Eye,
  Upload,
  FolderOpen,
  FolderPlus,
  AlertTriangle,
  Loader2,
  Building2,
  Compass,
  Grid,
  ListFilter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
  Copy,
  Home,
  BarChart3,
  TrendingUp,
  X
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";

async function compressImageFile(file: File, maxWidth = 1600, quality = 0.84): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          resolve(new File([blob], file.name, { type: file.type || "image/jpeg" }));
        },
        file.type || "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

function extractFacilityItems(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.flatMap(item => extractFacilityItems(item));
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        return extractFacilityItems(JSON.parse(trimmed));
      } catch {
        // ignore JSON parse error
      }
    }
    return [trimmed];
  }
  if (typeof val === "object") {
    return Object.values(val).flatMap(v => extractFacilityItems(v));
  }
  return [String(val)];
}

export type SuiteTab =
  | "showcase"
  | "inventory"
  | "compare"
  | "agencies"
  | "leads_contracts"
  | "events"
  | "b2b_portal_preview";

type InventoryViewMode = "grouped_types" | "block_matrix" | "table_list";
type ProjectSubTab = "property_types" | "common_areas" | "folders";

interface DeveloperProjectSuiteProps {
  storeId?: number;
  branding?: any;
  user?: any;
  initialSection?: SuiteTab;
  isStandaloneDeveloperStore?: boolean;
  onBackToPortfolio?: () => void;
  onConvertUnitToProperty?: (unitPayload: any) => void;
}

const DEFAULT_FOLDER_CATEGORIES = [
  "Teknik & Mimari Planlar",
  "Masterplan & Kat Planları",
  "Fiyat Listesi & Ödeme Planı",
  "4K Görsel & Render Paketi",
  "Sosyal Medya & Tanıtım Videoları",
  "Ruhsat & Hukuki Belgeler",
  "Ortak Alanlar & Sosyal Tesisler"
];

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

  // Collapsible ProjectLP Dashboard Summary State
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);

  // Project Directory vs. Single Selected Project Workspace Mode
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
  const [driveMeta, setDriveMeta] = useState<any>(null);

  useEffect(() => {
    if (initialSection) {
      setActiveTab(normalizeTab(initialSection));
    }
  }, [initialSection]);

  // Strictly Single-Project Selection (Never mixes units or files from other projects)
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [activeProjectDetail, setActiveProjectDetail] = useState<any | null>(null);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>("all");
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);

  // Project Create / Edit State (Opens directly under the clicked project or header)
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [projectForm, setProjectForm] = useState({
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

  // Project File / Media Upload State (Computer/Mobile Upload, Custom Folders, Property Type / Common Area Match)
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [uploadingLocalFile, setUploadingLocalFile] = useState(false);
  const [isCustomFolderMode, setIsCustomFolderMode] = useState(false);
  const [customFolderName, setCustomFolderName] = useState("");
  const [duplicateConflictMode, setDuplicateConflictMode] = useState<"overwrite" | "new_version">("overwrite");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [newMediaForm, setNewMediaForm] = useState({
    name: "",
    type: "masterplan",
    category: "Teknik & Mimari Planlar",
    url: "",
    unit_type_match: "__COMMON_AREA__",
    media_role: "photo"
  });

  // Common Area New Feature / Spec Input State
  const [isAddCommonSpecOpen, setIsAddCommonSpecOpen] = useState(false);
  const [newCommonSpecForm, setNewCommonSpecForm] = useState({
    facility_group: "wellness_spa",
    spec_text: ""
  });

  // =========================================================================
  // INVENTORY & LARGE-SCALE INDEPENDENT UNIT MANAGEMENT STATE
  // =========================================================================
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

  const [revisingUnit, setRevisingUnit] = useState<any | null>(null);
  const [savingUnitRevision, setSavingUnitRevision] = useState(false);

  const [revisingGroup, setRevisingGroup] = useState<{
    title: string;
    unitIds: number[];
    block_name: string;
    unit_type: string;
    view_direction: string;
    floor_level: string;
    status: string;
    price: string;
  } | null>(null);

  const [droneTargetUnit, setDroneTargetUnit] = useState<any | null>(null);
  const [, setDroneFlying] = useState(false);

  const [editingUnitPrices, setEditingUnitPrices] = useState<Record<number, number>>({});
  const [bulkPricePercent, setBulkPricePercent] = useState<number>(5);

  const [unitStatusFilter, setUnitStatusFilter] = useState<string>("all");
  const [unitBlockFilter, setUnitBlockFilter] = useState<string>("all");
  const [unitTypeFilter, setUnitTypeFilter] = useState<string>("all");
  const [unitSearch, setUnitSearch] = useState<string>("");

  // Comparison state
  const [compareLeftId, setCompareLeftId] = useState<number>(0);
  const [compareRightId, setCompareRightId] = useState<number>(0);
  const [simulatorPriceGbp, setSimulatorPriceGbp] = useState<number>(215000);

  // Internal Team & Permissions State (Shown only when Ekip & Yetkiler is opened from main menu)
  const [staffDeptFilter, setStaffDeptFilter] = useState<string>("all");
  const [isNewStaffOpen, setIsNewStaffOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
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

  // Launch Events & PR Media Gallery State
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [uploadingEventMedia, setUploadingEventMedia] = useState(false);
  const eventImageInputRef = useRef<HTMLInputElement | null>(null);
  const eventVideoInputRef = useRef<HTMLInputElement | null>(null);

  const [newEventForm, setNewEventForm] = useState({
    title: "",
    event_type: "launch_party",
    project_name: "Mykonos Homes",
    event_date: "2026-07-10 19:30",
    location: "Esentepe Sahil — Satış & Lansman Merkezi, KKTC",
    target_regions: "Yönetim, Satış ve PR Ekibi",
    media_preview_url: "",
    cover_image: "",
    video_url: "",
    media_gallery: [] as Array<{ id: string; name: string; url: string; type: "image" | "video" }>,
    max_capacity: 200,
    description: ""
  });

  const activeCompany = companies[0] || null;
  const rawCompanyName =
    activeCompany?.company_name ||
    branding?.store_name ||
    branding?.name ||
    "Cyprus Constructions";
  const companyDisplayName = String(rawCompanyName).replace(/\s*\(projectLP\)\s*/gi, "").trim();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Synchronized Single-Project Selection Helper
  const handleSelectSingleProject = (proj: any, openSingleView = true) => {
    if (!proj) return;
    setActiveProjectDetail(proj);
    setSelectedProjectId(Number(proj.id));
    setMediaCategoryFilter("all");
    setUnitBlockFilter("all");
    setUnitTypeFilter("all");
    setUnitStatusFilter("all");
    setSelectedPropertyTypeKey("");
    setPropertyTypeLayer("overview");
    setNewUnitForm(prev => ({ ...prev, project_id: Number(proj.id) }));
    setBatchForm(prev => ({ ...prev, project_id: Number(proj.id) }));
    const firstProjUnit = units.find(u => Number(u.project_id) === Number(proj.id));
    if (firstProjUnit) {
      setDroneTargetUnit(firstProjUnit);
    }
    if (openSingleView) {
      setProjectViewMode("single");
    }
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
          (activeProjectDetail && loadedProjects.find((p: any) => Number(p.id) === Number(activeProjectDetail.id))) ||
          loadedProjects[0];
        setActiveProjectDetail(currentProj);
        setSelectedProjectId(Number(currentProj.id));
        setNewUnitForm(prev => ({ ...prev, project_id: Number(currentProj.id) }));
        setBatchForm(prev => ({ ...prev, project_id: Number(currentProj.id) }));

        const projUnits = loadedUnits.filter((u: any) => Number(u.project_id) === Number(currentProj.id));
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
          loadedProjects.find((p: any) => p.name?.toLowerCase().includes("mykonos")) || loadedProjects[1];
        const aloha =
          loadedProjects.find((p: any) => p.name?.toLowerCase().includes("aloha")) ||
          loadedProjects[3] ||
          loadedProjects[0];
        setCompareLeftId(mykonos.id);
        setCompareRightId(aloha.id);
      }
    } catch (err: any) {
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

  // All available folders for the active project
  const availableProjectFolders = useMemo(() => {
    const set = new Set<string>(DEFAULT_FOLDER_CATEGORIES);
    const list: any[] = activeProjectDetail?.media_vault || [];
    list.forEach(item => {
      if (item?.category && String(item.category).trim()) {
        set.add(String(item.category).trim());
      }
    });
    return Array.from(set);
  }, [activeProjectDetail]);

  const existingDuplicateFile = useMemo(() => {
    if (!activeProjectDetail || !newMediaForm.name.trim()) return null;
    const target = newMediaForm.name.trim().toLowerCase();
    const list: any[] = activeProjectDetail.media_vault || [];
    return list.find((m: any) => String(m?.name || "").trim().toLowerCase() === target) || null;
  }, [activeProjectDetail, newMediaForm.name]);

  const inferMediaType = (fileName: string, folderCategory: string, mediaRole?: string) => {
    if (mediaRole === "video") return "video";
    if (mediaRole === "photo") return "photos";
    if (mediaRole === "floorplan") return "masterplan";
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm") || folderCategory.toLowerCase().includes("video")) {
      return "video";
    }
    if (
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".webp") ||
      folderCategory.toLowerCase().includes("görsel") ||
      folderCategory.toLowerCase().includes("render")
    ) {
      return "photos";
    }
    if (folderCategory.toLowerCase().includes("fiyat") || lower.includes("price")) {
      return "pricelist";
    }
    if (folderCategory.toLowerCase().includes("ruhsat") || folderCategory.toLowerCase().includes("hukuk")) {
      return "legal";
    }
    return "masterplan";
  };

  const handleDeviceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      setUploadingLocalFile(true);
      let fileToUpload: File = file;

      if (file.type.startsWith("image/") && !file.type.includes("svg")) {
        try {
          fileToUpload = await compressImageFile(file, 1600, 0.84);
        } catch {
          fileToUpload = file;
        }
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);

      const uploadRes = await api.upload("/api/upload", formData);
      if (uploadRes && uploadRes.url) {
        const resolvedFolder = isCustomFolderMode && customFolderName.trim()
          ? customFolderName.trim()
          : newMediaForm.category;
        const inferredType = inferMediaType(file.name, resolvedFolder, newMediaForm.media_role);

        setNewMediaForm(prev => ({
          ...prev,
          name: prev.name.trim() ? prev.name : file.name,
          url: uploadRes.url,
          type: inferredType
        }));
        toast.success(`"${file.name}" yüklendi.`);
      } else {
        toast.error(uploadRes?.error || "Dosya yüklenemedi.");
      }
    } catch {
      toast.error("Dosya yükleme sırasında hata oluştu.");
    } finally {
      setUploadingLocalFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        setNewEventForm(prev => {
          const nextGallery = [...prev.media_gallery, ...uploadedItems];
          const firstImage = nextGallery.find(m => m.type === "image")?.url || prev.cover_image;
          const firstVideo = nextGallery.find(m => m.type === "video")?.url || prev.video_url;
          return {
            ...prev,
            cover_image: prev.cover_image || firstImage || "",
            video_url: prev.video_url || firstVideo || "",
            media_preview_url: prev.media_preview_url || firstVideo || firstImage || uploadedItems[0].name,
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

  // Create or Update Project
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
          setProjects(prev => prev.map(p => (p.id === saved.id ? saved : p)));
          if (activeProjectDetail?.id === saved.id) setActiveProjectDetail(saved);
          toast.success(`${saved.name} güncellendi.`);
        } else {
          setProjects(prev => [...prev, saved]);
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

  // Add Common Area Feature / Spec to Selected Project
  const handleAddCommonAreaSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectDetail || !newCommonSpecForm.spec_text.trim()) return;
    try {
      const sid = storeId || user?.store_id || 1;
      const text = newCommonSpecForm.spec_text.trim();
      const group = newCommonSpecForm.facility_group;

      let payload: any = { store_id: sid };
      if (group === "architectural_specs") {
        const curSpecs = extractFacilityItems(activeProjectDetail.architectural_specs);
        payload.architectural_specs = [...curSpecs, text];
      } else {
        const rawFac = activeProjectDetail.lifestyle_facilities;
        const curFac =
          rawFac && typeof rawFac === "object" && !Array.isArray(rawFac)
            ? { ...rawFac }
            : { beach_marina: extractFacilityItems(rawFac) };
        const groupList = extractFacilityItems(curFac[group]);
        payload.lifestyle_facilities = {
          ...curFac,
          [group]: [...groupList, text]
        };
      }

      const res = await fetch(`/api/developer-projects/projects/${activeProjectDetail.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        setProjects(prev => prev.map(p => (p.id === saved.id ? saved : p)));
        setActiveProjectDetail(saved);
        setNewCommonSpecForm(prev => ({ ...prev, spec_text: "" }));
        setIsAddCommonSpecOpen(false);
        toast.success("Ortak alan verisi projeye eklendi.");
      }
    } catch {
      toast.error("Ortak alan verisi kaydedilemedi.");
    }
  };

  // Add Media / Document to Project Vault (Supports matching to a specific Property Type or Common Area)
  const handleAddMediaToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectDetail || !newMediaForm.name.trim()) {
      toast.error("Lütfen bir dosya seçin veya dosya adını girin.");
      return;
    }

    const finalCategory =
      isCustomFolderMode && customFolderName.trim()
        ? customFolderName.trim()
        : newMediaForm.unit_type_match === "__COMMON_AREA__" && newMediaForm.category === "Teknik & Mimari Planlar"
        ? "Ortak Alanlar & Sosyal Tesisler"
        : newMediaForm.category || "Teknik & Mimari Planlar";

    const finalType = inferMediaType(newMediaForm.name, finalCategory, newMediaForm.media_role);

    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/projects/${activeProjectDetail.id}/media`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newMediaForm.name.trim(),
          type: finalType,
          category: finalCategory,
          url: newMediaForm.url || activeProjectDetail.cover_image,
          unit_type_match: newMediaForm.unit_type_match,
          media_role: newMediaForm.media_role,
          conflictMode: duplicateConflictMode,
          store_id: sid
        })
      });
      if (res.ok) {
        const updatedProj = await res.json();
        setProjects(prev => prev.map(p => (p.id === updatedProj.id ? updatedProj : p)));
        setActiveProjectDetail(updatedProj);
        setIsAddMediaOpen(false);
        setIsCustomFolderMode(false);
        setCustomFolderName("");
        setNewMediaForm(prev => ({
          ...prev,
          name: "",
          url: ""
        }));

        if (updatedProj.resolutionAction === "overwritten") {
          toast.success("Aynı isimli eski dosyanın üzerine yazılarak güncellendi.");
        } else if (updatedProj.resolutionAction === "versioned") {
          toast.success("Eski dosya korundu ve yeni versiyon olarak kaydedildi.");
        } else {
          toast.success("Medya / teknik çizim eşleştirilerek projeye eklendi.");
        }
      }
    } catch {
      toast.error("Dosya eklenemedi.");
    }
  };

  // Helper to open Upload Drawer pre-configured for a specific Property Type or Common Area
  const openUploadForTarget = (
    targetMatch: string,
    role: "photo" | "video" | "floorplan" | "document",
    defaultCategory?: string
  ) => {
    const resolvedCategory =
      defaultCategory ||
      (targetMatch === "COMMON_AREAS" || targetMatch === "__COMMON_AREA__"
        ? "Ortak Alanlar & Sosyal Tesisler"
        : role === "floorplan"
        ? "Teknik & Mimari Planlar"
        : "Render & Görseller");
    setNewMediaForm({
      name: "",
      type: role === "video" ? "video" : role === "photo" ? "photos" : "masterplan",
      category: resolvedCategory,
      url: "",
      unit_type_match: targetMatch === "COMMON_AREAS" ? "__COMMON_AREA__" : targetMatch,
      media_role: role
    });
    setIsCustomFolderMode(false);
    setIsAddMediaOpen(true);
  };

  const handleDeleteMediaFromProject = async (mediaId: string) => {
    if (!activeProjectDetail) return;
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(
        `/api/developer-projects/projects/${activeProjectDetail.id}/media/${mediaId}?store_id=${sid}`,
        {
          method: "DELETE",
          headers: getAuthHeaders()
        }
      );
      if (res.ok) {
        const updatedProj = await res.json();
        setProjects(prev => prev.map(p => (p.id === updatedProj.id ? updatedProj : p)));
        setActiveProjectDetail(updatedProj);
        toast.success("Dosya kaldırıldı.");
      }
    } catch {
      toast.error("Dosya silinemedi.");
    }
  };

  // =========================================================================
  // UNIT & BLOCK REVISION + BATCH GENERATOR HANDLERS (STRICTLY FOR ACTIVE PROJECT)
  // =========================================================================
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sid = storeId || user?.store_id || 1;
      const targetProjId = activeProjectId;
      const res = await fetch("/api/developer-projects/units", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newUnitForm, project_id: targetProjId, store_id: sid })
      });
      if (res.ok) {
        const created = await res.json();
        setUnits(prev => [created, ...prev]);
        setIsAddUnitOpen(false);
        toast.success(`${created.block_name} / ${created.unit_number} eklendi ve Google Drive'da güncellendi.`);
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
      const targetProjId = activeProjectId;
      const res = await fetch("/api/developer-projects/units/batch-generate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...batchForm, project_id: targetProjId, store_id: sid })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsBatchGeneratorOpen(false);
        toast.success(
          `${data.createdCount} adet bağımsız bölüm üretildi ve Google Drive'da revize edildi.`
        );
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
        setUnits(prev => prev.map(u => (u.id === updated.id ? { ...u, ...updated } : u)));
        if (droneTargetUnit?.id === updated.id) {
          setDroneTargetUnit({ ...droneTargetUnit, ...updated });
        }
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
        toast.success(
          `${data.updatedCount} adet bağımsız bölüm toplu revize edildi ve Google Drive'da güncellendi.`
        );
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
        setUnits(prev => prev.filter(u => Number(u.id) !== Number(unitId)));
        if (revisingUnit && Number(revisingUnit.id) === Number(unitId)) {
          setRevisingUnit(null);
        }
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
        const idSet = new Set(unitIds.map(id => Number(id)));
        setUnits(prev => prev.filter(u => !idSet.has(Number(u.id))));
        if (revisingUnit && idSet.has(Number(revisingUnit.id))) {
          setRevisingUnit(null);
        }
        if (revisingGroup) {
          setRevisingGroup(null);
        }
        toast.success(
          `${groupLabel} grubundaki ${unitIds.length} adet bağımsız bölüm kapı numarası silindi.`
        );
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
        setUnits(prev => prev.map(u => (u.id === unitId ? { ...u, ...updated } : u)));
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
        setUnits(prev => prev.map(u => (u.id === unitId ? { ...u, ...updated } : u)));
        setEditingUnitPrices(prev => {
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

  const handleBulkPriceUpdate = async () => {
    if (!bulkPricePercent || bulkPricePercent === 0) {
      toast.error("Lütfen 0 dışında bir yüzde (%) değişim oranı girin.");
      return;
    }
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/units/bulk-price-update", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          store_id: sid,
          projectId: activeProjectId,
          percentageChange: bulkPricePercent,
          onlyAvailable: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Seçili projenin fiyatları güncellendi ve Google Drive'a işlendi.");
        await fetchOverview();
      } else {
        toast.error(data.error || "Toplu fiyat güncellenemedi.");
      }
    } catch {
      toast.error("Toplu fiyat güncelleme hatası.");
    }
  };

  const triggerDroneFlyToUnit = (unit: any) => {
    setRevisingUnit({ ...unit });
    setActiveTab("inventory");
  };

  // Internal Staff & Permissions Handlers
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
        setInternalStaff(prev => [...prev, created]);
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
      can_manage_projects: staffMember.department === "Yönetim" || staffMember.department === "Teknik & Mimari",
      can_upload_media: true,
      can_manage_prices: staffMember.department === "Yönetim" || staffMember.department === "Satış",
      can_manage_users: staffMember.department === "Yönetim"
    };
    const nextPerms = {
      ...currentPerms,
      [permKey]: !currentPerms[permKey]
    };
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/internal-staff/${staffMember.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          store_id: sid,
          permissions: nextPerms
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setInternalStaff(prev => prev.map(s => (s.id === staffMember.id ? updated : s)));
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
        setInternalStaff(prev => prev.filter(s => s.id !== id));
        toast.success("Kullanıcı silindi.");
      }
    } catch {
      toast.error("Silinemedi.");
    }
  };

  // Save or Update Launch Event
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
          setEvents(prev => prev.map(ev => (ev.id === saved.id ? saved : ev)));
          toast.success("Etkinlik ve medya galerisi güncellendi.");
        } else {
          setEvents(prev => [saved, ...prev]);
          toast.success("Etkinlik görsel ve videolarıyla oluşturuldu.");
        }
        setIsNewEventOpen(false);
        setEditingEventId(null);
        setNewEventForm({
          title: "",
          event_type: "launch_party",
          project_name: projects[0]?.name || "Mykonos Homes",
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
        setEvents(prev => prev.filter(ev => ev.id !== eventId));
        toast.success("Etkinlik silindi.");
      }
    } catch {
      toast.error("Etkinlik silinemedi.");
    }
  };

  // =========================================================================
  // STRICT SINGLE-PROJECT UNITS, BLOCKS, DOOR NUMBERS & PROPERTY TYPES
  // =========================================================================
  const selectedProjectUnits = useMemo(() => {
    const raw = units.filter(u => Number(u.project_id) === Number(activeProjectId));
    const seen = new Set<string>();
    return raw.map((u, idx) => {
      const doorKey = `${String(u.block_name || "").trim()}__${String(u.unit_number || "").trim()}`;
      if (seen.has(doorKey) && u.unit_number) {
        return {
          ...u,
          unit_number: `${u.unit_number}-${idx + 1}`
        };
      }
      seen.add(doorKey);
      return u;
    });
  }, [units, activeProjectId]);

  const availableBlocks = useMemo(() => {
    return Array.from(new Set(selectedProjectUnits.map(u => String(u.block_name || "").trim()).filter(Boolean)));
  }, [selectedProjectUnits]);

  const availableUnitTypes = useMemo(() => {
    return Array.from(new Set(selectedProjectUnits.map(u => String(u.unit_type || "").trim()).filter(Boolean)));
  }, [selectedProjectUnits]);

  const filteredUnits = useMemo(() => {
    return selectedProjectUnits.filter(u => {
      if (unitStatusFilter !== "all" && u.status !== unitStatusFilter) return false;
      if (unitBlockFilter !== "all" && String(u.block_name || "").trim() !== unitBlockFilter) return false;
      if (unitTypeFilter !== "all" && String(u.unit_type || "").trim() !== unitTypeFilter) return false;
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

  // Group units by Property Type (Mülk Tipi) strictly for the Selected Project
  const unitTypeGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        project_id: number;
        project_name: string;
        unit_type: string;
        total: number;
        available: number;
        negotiation: number;
        optioned: number;
        sold: number;
        minPrice: number;
        maxPrice: number;
        grossSqm: number;
        netSqm: number;
        terraceSqm: number;
        blocks: Set<string>;
        floors: Set<string>;
        views: Set<string>;
        units: any[];
      }
    >();

    filteredUnits.forEach(u => {
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

  // All Property Types of the Selected Project (unfiltered by search) for Tab 1 Property Type Media Matching
  const projectPropertyTypes = useMemo(() => {
    const map = new Map<
      string,
      {
        unit_type: string;
        total: number;
        available: number;
        optioned: number;
        sold: number;
        minPrice: number;
        maxPrice: number;
        grossSqm: number;
        netSqm: number;
        terraceSqm: number;
        blocks: string[];
        floors: string[];
        views: string[];
        units: any[];
        matchedPhotos: any[];
        matchedVideos: any[];
        matchedFloorplans: any[];
      }
    >();

    const vault: any[] = Array.isArray(activeProjectDetail?.media_vault)
      ? activeProjectDetail.media_vault
      : [];

    const generalPhotos = vault.filter(
      m => m.type === "photos" || String(m.category || "").toLowerCase().includes("görsel")
    );
    const generalVideos = vault.filter(
      m => m.type === "video" || String(m.category || "").toLowerCase().includes("video")
    );
    const generalFloorplans = vault.filter(
      m =>
        m.type === "masterplan" ||
        String(m.category || "").toLowerCase().includes("plan") ||
        String(m.name || "").toLowerCase().includes("floor")
    );

    selectedProjectUnits.forEach(u => {
      const ut = String(u.unit_type || "Standart Daire").trim();
      if (!map.has(ut)) {
        const exactPhotos = vault.filter(
          m =>
            String(m.unit_type_match || "").toLowerCase() === ut.toLowerCase() &&
            (m.media_role === "photo" || m.type === "photos")
        );
        const exactVideos = vault.filter(
          m =>
            String(m.unit_type_match || "").toLowerCase() === ut.toLowerCase() &&
            (m.media_role === "video" || m.type === "video")
        );
        const exactFloorplans = vault.filter(
          m =>
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
          matchedPhotos: exactPhotos.length > 0 ? exactPhotos : generalPhotos.slice(0, 2),
          matchedVideos: exactVideos.length > 0 ? exactVideos : generalVideos.slice(0, 2),
          matchedFloorplans: exactFloorplans.length > 0 ? exactFloorplans : generalFloorplans.slice(0, 2)
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
      if (u.view_direction && !entry.views.includes(u.view_direction)) entry.views.push(u.view_direction);
      entry.units.push(u);
    });

    return Array.from(map.values());
  }, [selectedProjectUnits, activeProjectDetail]);

  // Common Area Media for the Selected Project Only
  const selectedProjectCommonAreaMedia = useMemo(() => {
    const vault: any[] = Array.isArray(activeProjectDetail?.media_vault)
      ? activeProjectDetail.media_vault
      : [];
    return vault.filter(m => {
      if (
        m.unit_type_match &&
        m.unit_type_match !== "__COMMON_AREA__" &&
        m.unit_type_match !== "COMMON_AREAS"
      ) {
        return false;
      }
      return true;
    });
  }, [activeProjectDetail]);

  // Block & Floor Stacking Matrix strictly for Selected Project
  const blockStackingMatrix = useMemo(() => {
    const blocksMap = new Map<
      string,
      {
        blockTitle: string;
        projectName: string;
        floorsMap: Map<string, any[]>;
      }
    >();

    filteredUnits.forEach(u => {
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
      if (!blk.floorsMap.has(flKey)) {
        blk.floorsMap.set(flKey, []);
      }
      blk.floorsMap.get(flKey)!.push(u);
    });

    return Array.from(blocksMap.values()).map(b => ({
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
    return internalStaff.filter(s => s.department === staffDeptFilter);
  }, [internalStaff, staffDeptFilter]);

  const projectFolderTabs = useMemo(() => {
    const list: any[] = activeProjectDetail?.media_vault || [];
    const uniqueCats = Array.from(
      new Set(list.map(d => String(d?.category || "Genel Dosyalar").trim()).filter(Boolean))
    );
    return uniqueCats;
  }, [activeProjectDetail]);

  const filteredProjectMedia = useMemo(() => {
    const list: any[] = activeProjectDetail?.media_vault || [];
    if (mediaCategoryFilter === "all") return list;
    return list.filter(doc => String(doc?.category || "").trim() === mediaCategoryFilter);
  }, [activeProjectDetail, mediaCategoryFilter]);

  const portfolioStats = useMemo(() => {
    const totalUnits = projects.reduce((acc, p) => acc + (Number(p.total_units) || 0), 0);
    const availableUnits = projects.reduce((acc, p) => acc + (Number(p.available_units) || 0), 0);
    const optionedUnits = projects.reduce((acc, p) => acc + (Number(p.optioned_units) || 0), 0);
    const soldUnits = projects.reduce((acc, p) => acc + (Number(p.sold_units) || 0), 0);
    const totalFiles = projects.reduce(
      (acc, p) => acc + (Array.isArray(p.media_vault) ? p.media_vault.length : 0),
      0
    );
    return { totalUnits, availableUnits, optionedUnits, soldUnits, totalFiles };
  }, [projects]);

  const leftCompareProject = useMemo(
    () => projects.find(p => Number(p.id) === Number(compareLeftId)) || projects[0],
    [projects, compareLeftId]
  );
  const rightCompareProject = useMemo(
    () => projects.find(p => Number(p.id) === Number(compareRightId)) || projects[1] || projects[0],
    [projects, compareRightId]
  );

  const formatGbp = (val: number | string) => {
    const n = Number(val) || 0;
    return `£${new Intl.NumberFormat("tr-TR").format(n)}`;
  };

  // Copy & Share Property Type Marketing Package ("Kopyala-Yapıştır Hazır")
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
      `*Fiyat:* ${pt.minPrice === pt.maxPrice ? formatGbp(pt.minPrice) : `${formatGbp(pt.minPrice)} - ${formatGbp(pt.maxPrice)}`}`,
      `*Ödeme Planı:* %${activeProjectDetail.payment_plan?.down_payment_percent || 35} Peşinat, ${activeProjectDetail.payment_plan?.installment_months || 36} Ay %0 Faiz Taksit`,
      photoLinks ? `\n*Mülk Tipi Görselleri:*\n${photoLinks}` : "",
      videoLinks ? `\n*Tanıtım Videosu:*\n${videoLinks}` : "",
      planLinks ? `\n*Teknik Kat Çizimi (2D Plan):*\n${planLinks}` : "",
      `\nDetaylı Bilgi & Sunum: ${phone}`
    ]
      .filter(Boolean)
      .join("\n");

    if (mode === "whatsapp") {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } else {
      navigator.clipboard.writeText(text);
      toast.success(`${pt.unit_type} mülk tipi bilgileri ve medya linkleri panoya kopyalandı.`);
    }
  };

  // Copy & Share Common Area Package
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
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } else {
      navigator.clipboard.writeText(text);
      toast.success(`${activeProjectDetail.name} ortak alan bilgileri ve medya linkleri kopyalandı.`);
    }
  };

  const getStatusBadgeMeta = (status: string) => {
    if (status === "available") {
      return {
        label: "MÜSAİT",
        chipBg: "bg-emerald-500 text-slate-950 border-emerald-400",
        pillBg: "bg-emerald-100 text-emerald-800 border-emerald-300"
      };
    }
    if (status === "negotiation") {
      return {
        label: "SONUÇLANMAKTA",
        chipBg: "bg-sky-400 text-slate-950 border-sky-300",
        pillBg: "bg-sky-100 text-sky-900 border-sky-300"
      };
    }
    if (status === "optioned") {
      return {
        label: "OPSİYONLU",
        chipBg: "bg-amber-400 text-slate-950 border-amber-300",
        pillBg: "bg-amber-100 text-amber-900 border-amber-300"
      };
    }
    return {
      label: "SATILDI",
      chipBg: "bg-rose-500 text-white border-rose-400",
      pillBg: "bg-rose-100 text-rose-800 border-rose-300"
    };
  };

  const SECTION_BAND_THEMES = [
    {
      name: "slate",
      cardBg: "bg-white border-slate-200 border-l-4 border-l-slate-800 shadow-2xs",
      headerBg: "bg-slate-50 border-b border-slate-200 text-slate-950",
      badgeBg: "bg-slate-900 text-white",
      subBadgeBg: "bg-white text-slate-900 border-slate-300",
      innerBoxBg: "bg-slate-50/70 border-slate-200",
      footerBg: "bg-slate-50 border-t border-slate-200",
      rowBg: "bg-white hover:bg-slate-50 border-l-4 border-l-slate-700"
    },
    {
      name: "indigo",
      cardBg: "bg-indigo-50/35 border-indigo-200 border-l-4 border-l-indigo-600 shadow-2xs",
      headerBg: "bg-indigo-50/70 border-b border-indigo-200 text-slate-950",
      badgeBg: "bg-indigo-600 text-white",
      subBadgeBg: "bg-white text-indigo-950 border-indigo-200",
      innerBoxBg: "bg-white border-indigo-100",
      footerBg: "bg-indigo-50/40 border-t border-indigo-200",
      rowBg: "bg-indigo-50/30 hover:bg-indigo-50/70 border-l-4 border-l-indigo-500"
    },
    {
      name: "emerald",
      cardBg: "bg-emerald-50/35 border-emerald-200 border-l-4 border-l-emerald-600 shadow-2xs",
      headerBg: "bg-emerald-50/70 border-b border-emerald-200 text-slate-950",
      badgeBg: "bg-emerald-600 text-white",
      subBadgeBg: "bg-white text-emerald-950 border-emerald-200",
      innerBoxBg: "bg-white border-emerald-100",
      footerBg: "bg-emerald-50/40 border-t border-emerald-200",
      rowBg: "bg-emerald-50/30 hover:bg-emerald-50/70 border-l-4 border-l-emerald-500"
    },
    {
      name: "sky",
      cardBg: "bg-sky-50/35 border-sky-200 border-l-4 border-l-sky-600 shadow-2xs",
      headerBg: "bg-sky-50/70 border-b border-sky-200 text-slate-950",
      badgeBg: "bg-sky-600 text-white",
      subBadgeBg: "bg-white text-sky-950 border-sky-200",
      innerBoxBg: "bg-white border-sky-100",
      footerBg: "bg-sky-50/40 border-t border-sky-200",
      rowBg: "bg-sky-50/30 hover:bg-sky-50/70 border-l-4 border-l-sky-500"
    }
  ];

  const getSectionBandTheme = (index: number) =>
    SECTION_BAND_THEMES[Math.abs(index) % SECTION_BAND_THEMES.length];

  const handlePrintProjectSheet = (project: any) => {
    if (!project) return;
    const plan = project.payment_plan || {};
    const specs: string[] = Array.isArray(project.architectural_specs) ? project.architectural_specs : [];
    const printWin = window.open("", "_blank", "width=950,height=1100");
    if (!printWin) {
      toast.error("Lütfen tarayıcı açılır pencere (pop-up) iznini aktif edin.");
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>${project.name} — Proje Bilgi & Fiyat Özeti</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { margin: 0; padding: 0; color: #0f172a; background: #fff; }
    .sheet { border: 2px solid #0f172a; padding: 8mm; height: 275mm; display: flex; flex-direction: column; justify-content: space-between; }
    .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 4mm; }
    .brand { font-size: 18pt; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
    .sub { font-size: 9pt; color: #475569; font-weight: 600; }
    .hero { position: relative; height: 82mm; border-radius: 8px; overflow: hidden; margin: 4mm 0; border: 1px solid #cbd5e1; }
    .hero img { width: 100%; height: 100%; object-fit: cover; }
    .price-badge { position: absolute; bottom: 10px; right: 10px; background: #0f172a; color: #f8fafc; padding: 8px 14px; border-radius: 6px; font-weight: 900; font-size: 14pt; }
    .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin-bottom: 4mm; }
    .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3mm; }
    .box-lbl { font-size: 7.5pt; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .box-val { font-size: 11pt; font-weight: 900; color: #0f172a; margin-top: 2px; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
    .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 3.5mm; }
    .card h4 { margin: 0 0 2mm 0; font-size: 9.5pt; text-transform: uppercase; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5mm; }
    ul { margin: 0; padding-left: 14px; font-size: 8.5pt; line-height: 1.45; color: #334155; }
    .ftr { background: #0f172a; color: #fff; padding: 4mm; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 8.5pt; }
  </style>
</head>
<body>
  <div class="sheet">
    <div>
      <div class="hdr">
        <div>
          <div class="brand">${companyDisplayName}</div>
          <div class="sub">Proje Teknik & Satış Bilgi Formu</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:800;font-size:10pt;">${project.region} / ${project.sub_region || ""}</div>
          <div class="sub">Tarih: ${new Date().toLocaleDateString("tr-TR")}</div>
        </div>
      </div>

      <div style="margin-top:3mm; display:flex; justify-content:space-between; align-items:baseline;">
        <h1 style="margin:0; font-size:16pt; font-weight:900;">${project.name}</h1>
        <span style="font-size:9pt; font-weight:800; color:#047857;">Teslim: ${project.completion_date} (İnşaat: %${project.construction_progress})</span>
      </div>
      <p style="margin:1mm 0 2mm 0; font-size:9pt; color:#475569;">${project.concept_tagline || ""}</p>

      <div class="hero">
        <img src="${project.cover_image}" alt="${project.name}" />
        <div class="price-badge">Başlangıç: ${formatGbp(project.starting_price)}</div>
      </div>

      <div class="grid4">
        <div class="box">
          <div class="box-lbl">Peşinat Oranı</div>
          <div class="box-val">%${plan.down_payment_percent || 35}</div>
        </div>
        <div class="box">
          <div class="box-lbl">Faizsiz Taksit</div>
          <div class="box-val">${plan.installment_months || 36} Ay (%0 Faiz)</div>
        </div>
        <div class="box">
          <div class="box-lbl">Müsait / Toplam Ünite</div>
          <div class="box-val">${project.available_units} / ${project.total_units}</div>
        </div>
        <div class="box">
          <div class="box-lbl">Rezervasyon Depozitosu</div>
          <div class="box-val">${formatGbp(plan.reservation_deposit_gbp || 5000)}</div>
        </div>
      </div>

      <div class="cols">
        <div class="card">
          <h4>Teknik & Mimari Özellikler</h4>
          <ul>
            ${specs.slice(0, 5).map(s => `<li>${s}</li>`).join("")}
          </ul>
        </div>
        <div class="card">
          <h4>Ödeme Planı Notları</h4>
          <ul>
            <li><strong>Plan:</strong> ${plan.plan_name || "Standart Ödeme Planı"}</li>
            <li><strong>Not:</strong> ${plan.notes || ""}</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="ftr">
      <div>
        <div style="font-weight:900; font-size:10pt; color:#fbbf24;">${companyDisplayName}</div>
        <div>Merkez: ${activeCompany?.headquarters_region || "Girne, KKTC"}</div>
      </div>
      <div style="text-align:right;">
        <div><strong>İletişim:</strong> ${activeCompany?.phone || "+90 548 860 00 01"}</div>
        <div><strong>E-Posta:</strong> ${activeCompany?.email || "info@cyprusconstructions.com"}</div>
      </div>
    </div>
  </div>
  <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
</body>
</html>`;
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  // Reusable Inline Project Edit / Create Form Component (Rendered directly below the clicked project or header)
  const renderProjectEditForm = (titleLabel: string) => (
    <form
      onSubmit={handleSaveProject}
      className="p-3 bg-indigo-50/90 text-slate-900 rounded-xl border-2 border-indigo-400 space-y-2.5 shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-indigo-200 pb-1.5">
        <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>{titleLabel}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setIsProjectFormOpen(false);
            setEditingProjectId(null);
          }}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Kapat</span>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-bold">Proje Adı *</label>
          <input
            type="text"
            required
            value={projectForm.name}
            onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
            placeholder="Örn: Santorini Villas"
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
          />
        </div>
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-bold">Klasör Kodu</label>
          <input
            type="text"
            value={projectForm.folder_prefix}
            onChange={e => setProjectForm({ ...projectForm, folder_prefix: e.target.value })}
            placeholder="Örn: 11. Santorini Homes"
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
          />
        </div>
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-bold">Bölge</label>
          <input
            type="text"
            value={projectForm.sub_region}
            onChange={e => setProjectForm({ ...projectForm, sub_region: e.target.value })}
            placeholder="Esentepe / Tatlısu"
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
          />
        </div>
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-bold">
            Başlangıç Fiyatı (GBP £)
          </label>
          <input
            type="number"
            value={projectForm.starting_price}
            onChange={e =>
              setProjectForm({ ...projectForm, starting_price: Number(e.target.value) || 0 })
            }
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-black"
          />
        </div>
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-bold">
            Peşinat % / Taksit (Ay)
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={projectForm.down_payment_percent}
              onChange={e =>
                setProjectForm({
                  ...projectForm,
                  down_payment_percent: Number(e.target.value) || 35
                })
              }
              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-bold"
              title="Peşinat %"
            />
            <input
              type="number"
              value={projectForm.installment_months}
              onChange={e =>
                setProjectForm({
                  ...projectForm,
                  installment_months: Number(e.target.value) || 36
                })
              }
              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-bold"
              title="Faizsiz Vade (Ay)"
            />
          </div>
        </div>
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-bold">
            Teslim & İnşaat %
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={projectForm.completion_date}
              onChange={e => setProjectForm({ ...projectForm, completion_date: e.target.value })}
              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-bold"
              placeholder="Q4 2027"
            />
            <input
              type="number"
              value={projectForm.construction_progress}
              onChange={e =>
                setProjectForm({
                  ...projectForm,
                  construction_progress: Number(e.target.value) || 0
                })
              }
              className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-emerald-800 font-black"
              title="İnşaat %"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          value={projectForm.concept_tagline}
          onChange={e => setProjectForm({ ...projectForm, concept_tagline: e.target.value })}
          placeholder="Proje Konsept Özeti"
          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
        />
        <input
          type="text"
          value={projectForm.payment_notes}
          onChange={e => setProjectForm({ ...projectForm, payment_notes: e.target.value })}
          placeholder="Ödeme Planı Açıklaması"
          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
        />
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={projectForm.cover_image}
            onChange={e => setProjectForm({ ...projectForm, cover_image: e.target.value })}
            placeholder="Kapak Görseli URL"
            className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-black flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Kaydet</span>
          </button>
        </div>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200 flex items-center justify-center gap-3 text-slate-700 font-bold text-sm">
        <FolderSync className="w-5 h-5 animate-spin text-indigo-600" />
        <span>Proje ve medya havuzu yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* ===================================================================== */}
      {/* SINGLE-COMPANY DAYLIGHT-READABLE HEADER & COLLAPSIBLE DASHBOARD       */}
      {/* (Hidden when Ekip & Yetkiler is opened from the left sidebar menu)    */}
      {/* ===================================================================== */}
      {/* ===================================================================== */}
      {/* UNIFIED SAP-GRADE SINGLE COMMAND HEADER (ZERO DUPLICATE BARS)         */}
      {/* ===================================================================== */}
      {activeTab !== "agencies" && (
        <div className="bg-white text-slate-900 rounded-xl p-2.5 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {/* Left: Company Brand + Single Project Selector + All Projects Directory Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              {onBackToPortfolio && (
                <button
                  type="button"
                  onClick={onBackToPortfolio}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  ← Geri
                </button>
              )}

              <h2 className="text-sm font-black tracking-tight text-slate-950 whitespace-nowrap pr-1 border-r border-slate-200">
                {companyDisplayName}
              </h2>

              {/* Primary Project Selector (Default Project 1) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap">
                  Proje:
                </span>
                <select
                  value={activeProjectDetail?.id || ""}
                  onChange={e => {
                    const target = projects.find(p => Number(p.id) === Number(e.target.value));
                    if (target) {
                      handleSelectSingleProject(target, true);
                      if (activeTab === "compare" || activeTab === "events") {
                        setActiveTab("showcase");
                      }
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold outline-none cursor-pointer"
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
                  setProjectViewMode(prev => (prev === "grid" ? "single" : "grid"));
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap border transition-colors ${
                  activeTab === "showcase" && projectViewMode === "grid"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Tüm Projeler ({projects.length})</span>
              </button>
            </div>

            {/* Right: Clean, Single-Word SAP Navigation & Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("showcase");
                  setProjectViewMode("single");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap border transition-colors ${
                  (activeTab === "showcase" && projectViewMode === "single") || activeTab === "inventory"
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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap border transition-colors ${
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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap border transition-colors ${
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
                onClick={() => setIsDashboardOpen(prev => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 border transition-colors ${
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
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Yeni Proje</span>
              </button>
            </div>
          </div>

          {/* COLLAPSIBLE DASHBOARD SUMMARY STRIP */}
          {isDashboardOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
              <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200">
                <div className="text-[10px] text-slate-600 font-bold">Aktif Proje</div>
                <div className="text-sm font-black text-slate-950 font-mono tabular-nums truncate">
                  {activeProjectDetail ? activeProjectDetail.name : `${projects.length} Proje`}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  Toplam {projects.length} Proje Klasörü
                </div>
              </div>

              <div className="bg-emerald-50/70 rounded-lg px-2.5 py-1.5 border border-emerald-200">
                <div className="text-[10px] text-emerald-800 font-bold">Bağımsız Bölümler</div>
                <div className="text-sm font-black text-emerald-900 font-mono tabular-nums">
                  {selectedProjectUnits.filter(u => u.status === "available").length} Müsait{" "}
                  <span className="text-xs text-slate-600 font-semibold">
                    / {selectedProjectUnits.length} Kapı No
                  </span>
                </div>
                <div className="text-[10px] text-emerald-800 truncate">
                  {selectedProjectUnits.filter(u => u.status === "optioned" || u.status === "negotiation").length} Opsiyon ·{" "}
                  {selectedProjectUnits.filter(u => u.status === "sold").length} Satıldı
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200">
                <div className="text-[10px] text-slate-700 font-bold">Medya & Teknik Paftalar</div>
                <div className="text-sm font-black text-slate-950 font-mono tabular-nums">
                  {(activeProjectDetail?.media_vault || []).length} Dosya
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {projectPropertyTypes.length} Mülk Tipi · {selectedProjectCommonAreaMedia.length} Ortak Medya
                </div>
              </div>

              <div className="bg-indigo-50/70 rounded-lg px-2.5 py-1.5 border border-indigo-200">
                <div className="text-[10px] text-indigo-900 font-bold">Başlangıç & Ödeme Planı</div>
                <div className="text-sm font-black text-indigo-950 font-mono tabular-nums">
                  {formatGbp(activeProjectDetail?.starting_price || 0)}
                </div>
                <div className="text-[10px] text-indigo-800 truncate">
                  %{activeProjectDetail?.payment_plan?.down_payment_percent || 35} Peşin ·{" "}
                  {activeProjectDetail?.payment_plan?.installment_months || 36} Ay %0 Taksit
                </div>
              </div>
            </div>
          )}

          {/* NEW PROJECT CREATION FORM */}
          {isProjectFormOpen && !editingProjectId && renderProjectEditForm("Yeni Proje Klasörü Tanımla")}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: PROJE PORTFÖYÜ (STEP-BY-STEP SAP WORKSPACE)                    */}
      {/* ===================================================================== */}
      {activeTab === "showcase" && (
        <div className="space-y-2.5">

          {/* ================================================================= */}
          {/* MODE A: ALL PROJECT FOLDERS DIRECTORY GRID                         */}
          {/* Clicking "Düzenle" opens the edit form DIRECTLY BELOW that project */}
          {/* Clicking a project opens ONLY that project in Single-Project Mode  */}
          {/* ================================================================= */}
          {projectViewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {projects.map(proj => {
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
                        onClick={() => handleSelectSingleProject(proj)}
                        className="relative h-28 w-full overflow-hidden bg-slate-100 cursor-pointer"
                      >
                        <img
                          src={proj.cover_image}
                          alt={proj.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                          <span className="px-2 py-0.5 rounded bg-white/95 text-slate-950 font-mono text-[10px] font-black border border-slate-200 truncate">
                            {proj.folder_prefix || proj.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-slate-950 shrink-0">
                            İnşaat %{proj.construction_progress}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between">
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-white leading-tight truncate">
                              {proj.name}
                            </h3>
                            <p className="text-[11px] text-slate-200 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">
                                {proj.sub_region} · Teslim: {proj.completion_date}
                              </span>
                            </p>
                          </div>
                          <span className="text-xs font-black text-amber-300 shrink-0 ml-1">
                            {formatGbp(proj.starting_price)}+
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 space-y-1.5">
                        <p className="text-[11px] text-slate-600 line-clamp-1">
                          {proj.concept_tagline}
                        </p>
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-emerald-800">{proj.available_units} Müsait</span>
                          <span className="text-amber-800">{proj.optioned_units} Opsiyon</span>
                          <span className="text-slate-600">%{soldPct} Satıldı</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-2.5 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectSingleProject(proj)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span>Proje Medya & Tipleri Aç ({fileCount})</span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            if (isEditingThisProject) {
                              setIsProjectFormOpen(false);
                              setEditingProjectId(null);
                            } else {
                              openEditProject(proj);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap border ${
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

                    {/* INLINE EDIT FORM RENDERED IMMEDIATELY BELOW THIS SPECIFIC PROJECT CARD */}
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

          {/* ================================================================= */}
          {/* MODE B: STRICTLY ISOLATED SINGLE-PROJECT WORKSPACE                */}
          {/* Shows ONLY the selected project's Property Types, Common Areas,   */}
          {/* and Folders. Zero information from other projects is mixed in.    */}
          {/* ================================================================= */}
          {projectViewMode === "single" && activeProjectDetail && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3">
              {/* SINGLE-ROW PROJECT HEADER & COMPACT ACTION TOOLBAR */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <img
                    src={activeProjectDetail.cover_image}
                    alt={activeProjectDetail.name}
                    className="w-14 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded text-[10px] font-mono font-black shrink-0">
                        {activeProjectDetail.folder_prefix || activeProjectDetail.project_code}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-slate-950 truncate">
                        {activeProjectDetail.name}
                      </h3>
                      <span className="text-[11px] text-slate-600 font-semibold truncate">
                        · {activeProjectDetail.sub_region} · Teslim: {activeProjectDetail.completion_date} · İnşaat: %{activeProjectDetail.construction_progress}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                      {activeProjectDetail.concept_tagline}
                    </p>
                  </div>
                </div>

                {/* Clean Single-Row Project Actions (No duplicate navigation buttons) */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  <button
                    type="button"
                    onClick={() => openUploadForTarget("COMMON_AREAS", "photo")}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
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
                        openEditProject(activeProjectDetail);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 border ${
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
                    onClick={() => handlePrintProjectSheet(activeProjectDetail)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Bilgi Formu</span>
                  </button>
                </div>
              </div>

              {/* INLINE PROJECT EDIT FORM DIRECTLY BELOW THE SELECTED PROJECT HEADER */}
              {isProjectFormOpen &&
                Number(editingProjectId) === Number(activeProjectDetail.id) &&
                renderProjectEditForm(`Projeyi Düzenle: ${activeProjectDetail.name}`)}

              {/* CENTERED VIEWPORT-FIT MODAL FOR FILE / MEDIA UPLOAD & MATCHING */}
              {isAddMediaOpen && (
                <div
                  className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3"
                  onClick={() => setIsAddMediaOpen(false)}
                >
                  <form
                    onSubmit={handleAddMediaToProject}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-2xl p-4 bg-white text-slate-900 rounded-2xl border-2 border-emerald-500 shadow-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">
                          PROJE MEDYA & DOKÜMAN EŞLEŞTİRME STÜDYOSU
                        </span>
                        <h4 className="text-sm font-black text-slate-950 flex items-center gap-1.5 mt-0.5">
                          <Upload className="w-4 h-4 text-indigo-600" />
                          <span>
                            {activeProjectDetail.name} — Medya, Kat Çizimi veya Ortak Alan Dosyası Ekle
                          </span>
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddMediaOpen(false)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Kapat</span>
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {/* 1. Target Matching & 2. Media Role: Clean Collapsible Dropdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-700 font-bold uppercase tracking-wider mb-1">
                            1. Eşleştirilecek Mülk Tipi veya Ortak Alan *
                          </label>
                          <select
                            value={
                              newMediaForm.unit_type_match === "COMMON_AREAS"
                                ? "__COMMON_AREA__"
                                : newMediaForm.unit_type_match
                            }
                            onChange={e =>
                              setNewMediaForm({
                                ...newMediaForm,
                                unit_type_match: e.target.value
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold cursor-pointer"
                          >
                            <option value="__COMMON_AREA__">Ortak Alanlar & Sosyal Tesisler</option>
                            {projectPropertyTypes.map(pt => (
                              <option key={pt.unit_type} value={pt.unit_type}>
                                Mülk Tipi: {pt.unit_type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-700 font-bold uppercase tracking-wider mb-1">
                            2. Medya Türü Seçin *
                          </label>
                          <select
                            value={newMediaForm.media_role}
                            onChange={e =>
                              setNewMediaForm({
                                ...newMediaForm,
                                media_role: e.target.value as
                                  | "photo"
                                  | "video"
                                  | "floorplan"
                                  | "document"
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold cursor-pointer"
                          >
                            <option value="photo">Görsel / Render</option>
                            <option value="video">Tanıtım Videosu</option>
                            <option value="floorplan">Teknik Kat Planı</option>
                            <option value="document">Katalog / PDF Dosya</option>
                          </select>
                        </div>
                      </div>

                      {/* 3. Device File Picker & 4. Folder Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-700 font-bold uppercase tracking-wider mb-1">
                            3. Bilgisayar veya Mobilden Dosya Seç
                          </label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleDeviceFileSelect}
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.mov,.dwg,.xlsx,.xls,.doc,.docx,.zip"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingLocalFile}
                            className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
                          >
                            {uploadingLocalFile ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Yükleniyor...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>Cihazdan Dosya Seç</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">
                              4. Klasör Seçimi
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsCustomFolderMode(prev => !prev)}
                              className="text-[10px] text-indigo-700 hover:underline font-bold cursor-pointer whitespace-nowrap"
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
                              onChange={e => setCustomFolderName(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-indigo-400 rounded-xl text-slate-900 text-xs font-bold"
                            />
                          ) : (
                            <select
                              value={newMediaForm.category}
                              onChange={e => {
                                if (e.target.value === "__NEW_FOLDER__") {
                                  setIsCustomFolderMode(true);
                                  return;
                                }
                                setNewMediaForm({ ...newMediaForm, category: e.target.value });
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold"
                            >
                              {availableProjectFolders.map(folder => (
                                <option key={folder} value={folder}>
                                  {folder}
                                </option>
                              ))}
                              <option value="__NEW_FOLDER__">+ Yeni Klasör Oluştur...</option>
                            </select>
                          )}
                        </div>

                        {/* 5. File Name */}
                        <div>
                          <label className="block text-[10px] text-slate-700 font-bold uppercase tracking-wider mb-1">
                            5. Dosya Başlığı *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: 2+1 Penthouse Kat Planı.pdf"
                            value={newMediaForm.name}
                            onChange={e => setNewMediaForm({ ...newMediaForm, name: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold"
                          />
                        </div>

                        {/* 6. Optional External URL */}
                        <div>
                          <label className="block text-[10px] text-slate-700 font-bold uppercase tracking-wider mb-1">
                            6. Harici Link / URL (Opsiyonel)
                          </label>
                          <input
                            type="text"
                            placeholder="Cihazdan seçtiyseniz otomatik dolar"
                            value={newMediaForm.url}
                            onChange={e => setNewMediaForm({ ...newMediaForm, url: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {existingDuplicateFile && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-amber-950">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            <strong>"{existingDuplicateFile.name}"</strong> isimli dosya bu projede mevcut ({existingDuplicateFile.category}). Nasıl kaydedilsin?
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setDuplicateConflictMode("overwrite")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors ${
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
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors ${
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
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Vazgeç</span>
                      </button>
                      <button
                        type="submit"
                        disabled={uploadingLocalFile}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kaydet & Eşleştir</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ============================================================= */}
              {/* ADIM 1: BÖLÜM SEÇİMİ                                           */}
              {/* ============================================================= */}
              <div className="flex items-center justify-between gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setProjectSubTab("property_types")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
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
                      setInventoryViewMode("grouped_types");
                      setActiveTab("inventory");
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap text-slate-700 hover:text-slate-950 hover:bg-white transition-all"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      2. Bağımsız Bölümler / Kapı No ({selectedProjectUnits.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectSubTab("common_areas")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
                      projectSubTab === "common_areas"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-700 hover:text-slate-950 hover:bg-white"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      3. Ortak Alanlar ({selectedProjectCommonAreaMedia.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectSubTab("folders")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
                      projectSubTab === "folders"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-700 hover:text-slate-950 hover:bg-white"
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>
                      4. Klasör Arşivi ({(activeProjectDetail.media_vault || []).length})
                    </span>
                  </button>
                </div>
              </div>

              {/* ============================================================= */}
              {/* SUB-TAB 1: ADIM ADIM (STEP-BY-STEP) MÜLK TİPİ ÇALIŞMA ALANI   */}
              {/* Collapsible <select> Dropdowns for Mülk Tipi & İçerik Katmanı  */}
              {/* ============================================================= */}
              {projectSubTab === "property_types" && (
                <div className="space-y-3">
                  {/* ADIM 2 & 3: AÇILIR KAPANIR (DROPDOWN) MÜLK TİPİ VE İÇERİK KATMANI SEÇİCİ */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-[11px] font-black uppercase text-slate-600 whitespace-nowrap">
                        Mülk Tipi Seçin:
                      </label>
                      <select
                        value={selectedPropertyTypeKey || projectPropertyTypes[0]?.unit_type || ""}
                        onChange={e => setSelectedPropertyTypeKey(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-950 cursor-pointer outline-none focus:border-indigo-600"
                      >
                        {projectPropertyTypes.map((pt, idx) => (
                          <option key={pt.unit_type} value={pt.unit_type}>
                            {idx + 1}. {pt.unit_type} ({pt.available} Müsait / {pt.total} Kapı No · {formatGbp(pt.minPrice)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {(() => {
                      const activeKey =
                        selectedPropertyTypeKey || projectPropertyTypes[0]?.unit_type || "";
                      const currentPt =
                        projectPropertyTypes.find(item => item.unit_type === activeKey) ||
                        projectPropertyTypes[0];
                      return (
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="text-[11px] font-black uppercase text-slate-600 whitespace-nowrap">
                            İçerik Katmanı:
                          </label>
                          <select
                            value={propertyTypeLayer}
                            onChange={e =>
                              setPropertyTypeLayer(
                                e.target.value as
                                  | "overview"
                                  | "photos"
                                  | "videos"
                                  | "floorplans"
                                  | "units"
                              )
                            }
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 cursor-pointer outline-none focus:border-indigo-600"
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

                  {/* SEÇİLİ MÜLK TİPİ DETAY KARTI (Sirk Görünümü Yok, Tek ve Odaklı SAP Kartı) */}
                  {(() => {
                    const activeKey =
                      selectedPropertyTypeKey || projectPropertyTypes[0]?.unit_type || "";
                    const pt =
                      projectPropertyTypes.find(item => item.unit_type === activeKey) ||
                      projectPropertyTypes[0];
                    if (!pt) return null;

                    return (
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                        {/* Selected Property Type Clean Enterprise Header */}
                        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm sm:text-base font-black text-slate-950">
                                {pt.unit_type}
                              </h4>
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black">
                                {pt.available} Müsait / {pt.total} Kapı No
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-950 text-xs font-black font-mono">
                                {pt.minPrice === pt.maxPrice
                                  ? formatGbp(pt.minPrice)
                                  : `${formatGbp(pt.minPrice)} – ${formatGbp(pt.maxPrice)}`}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium flex items-center gap-2 flex-wrap">
                              <span>
                                Brüt: <strong className="text-slate-900">{pt.grossSqm} m²</strong> · Net:{" "}
                                <strong className="text-slate-900">{pt.netSqm} m²</strong> · Teras:{" "}
                                <strong className="text-slate-900">+{pt.terraceSqm} m²</strong>
                              </span>
                              <span>· Blok: {pt.blocks.join(", ") || "Ana Blok"}</span>
                              <span>· Cephe: {pt.views.join(" / ") || "Panoramik Deniz & Havuz"}</span>
                            </div>
                          </div>

                          {/* Single-Row Share & Upload Actions for Selected Property Type */}
                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                            <button
                              type="button"
                              onClick={() => openUploadForTarget(pt.unit_type, "photo")}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Upload className="w-3 h-3 text-indigo-600" />
                              <span>+ Medya Ekle</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSharePropertyTypePackage(pt, "copy")}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Paketi Kopyala</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSharePropertyTypePackage(pt, "whatsapp")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>WhatsApp Paylaş</span>
                            </button>
                          </div>
                        </div>

                        {/* LAYER BODY */}
                        <div className="p-3.5 space-y-3">
                          {/* INDEPENDENT DOOR NUMBERS FOR THIS PROPERTY TYPE (WITH DIRECT DELETE) */}
                          {(propertyTypeLayer === "overview" || propertyTypeLayer === "units") &&
                            pt.units.length > 0 && (
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[11px] font-black text-slate-900">
                                    Bu Mülk Tipindeki Bağımsız Bölümler ({pt.units.length} Kapı No)
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 font-semibold">
                                      Revize için kapı numarasına, silmek için çöp kutusuna tıklayın
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteUnitGroup(
                                          pt.units.map((u: any) => u.id),
                                          pt.unit_type
                                        )
                                      }
                                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Bu Tipteki Kapı Nolarını Toplu Sil</span>
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {pt.units.map((u: any) => {
                                    const meta = getStatusBadgeMeta(u.status);
                                    return (
                                      <div
                                        key={u.id}
                                        className={`inline-flex items-center rounded-lg border overflow-hidden shadow-2xs ${meta.chipBg}`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedProjectId(activeProjectDetail.id);
                                            setRevisingUnit({ ...u });
                                            setActiveTab("inventory");
                                          }}
                                          title={`${u.block_name} | Kapı No: ${u.unit_number} | ${u.floor_level} | ${formatGbp(u.price)} — Revize Et`}
                                          className="px-2.5 py-1 text-[11px] font-mono font-black cursor-pointer hover:opacity-85 transition-opacity"
                                        >
                                          {u.unit_number} · {u.floor_level?.split(" ")[0]} ({formatGbp(u.price)})
                                        </button>
                                        <button
                                          type="button"
                                          onClick={e => {
                                            e.stopPropagation();
                                            handleDeleteUnit(u.id, u.unit_number);
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
                              </div>
                            )}

                          {/* CLEAN CORPORATE MEDIA GRID (Shown in overview or filtered by selected layer) */}
                          {propertyTypeLayer !== "units" && (
                            <div
                              className={`grid grid-cols-1 ${
                                propertyTypeLayer === "overview" ? "md:grid-cols-3" : "md:grid-cols-1"
                              } gap-3`}
                            >
                              {/* PHOTOS */}
                              {(propertyTypeLayer === "overview" || propertyTypeLayer === "photos") && (
                                <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-3 space-y-2 flex flex-col justify-between">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                        <ImageIcon className="w-3.5 h-3.5 text-slate-700" />
                                        <span>Görseller ({pt.matchedPhotos.length})</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => openUploadForTarget(pt.unit_type, "photo")}
                                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                      >
                                        + Resim Ekle
                                      </button>
                                    </div>

                                    {pt.matchedPhotos.map((ph: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between gap-2 bg-white rounded-lg p-2 text-xs border border-slate-200"
                                      >
                                        <span className="font-semibold text-slate-800 truncate">
                                          {ph.name}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewAsset({
                                              name: `${pt.unit_type} — ${ph.name}`,
                                              category: `${pt.unit_type} Görseli`,
                                              type: "photos",
                                              url: ph.url || activeProjectDetail.cover_image,
                                              cover:
                                                ph.url?.startsWith("/api/storage/") ||
                                                ph.url?.startsWith("http")
                                                  ? ph.url
                                                  : activeProjectDetail.cover_image,
                                              projectName: activeProjectDetail.name
                                            })
                                          }
                                          className="px-2.5 py-0.5 bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white rounded text-[11px] font-bold cursor-pointer shrink-0 transition-colors"
                                        >
                                          Aç
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* VIDEOS */}
                              {(propertyTypeLayer === "overview" || propertyTypeLayer === "videos") && (
                                <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-3 space-y-2 flex flex-col justify-between">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                        <Video className="w-3.5 h-3.5 text-slate-700" />
                                        <span>Tanıtım Videoları ({pt.matchedVideos.length})</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => openUploadForTarget(pt.unit_type, "video")}
                                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                      >
                                        + Video Ekle
                                      </button>
                                    </div>

                                    {pt.matchedVideos.map((vid: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between gap-2 bg-white rounded-lg p-2 text-xs border border-slate-200"
                                      >
                                        <span className="font-semibold text-slate-800 truncate">
                                          {vid.name}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewAsset({
                                              name: `${pt.unit_type} — ${vid.name}`,
                                              category: `${pt.unit_type} Tanıtım Videosu`,
                                              type: "video",
                                              url: vid.url || activeProjectDetail.cover_image,
                                              cover: activeProjectDetail.cover_image,
                                              projectName: activeProjectDetail.name
                                            })
                                          }
                                          className="px-2.5 py-0.5 bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white rounded text-[11px] font-bold cursor-pointer shrink-0 transition-colors"
                                        >
                                          İzle
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* FLOORPLANS & 2D/3D */}
                              {(propertyTypeLayer === "overview" ||
                                propertyTypeLayer === "floorplans") && (
                                <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-3 space-y-2 flex flex-col justify-between">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                        <Compass className="w-3.5 h-3.5 text-slate-700" />
                                        <span>Teknik Kat Çizimleri ({pt.matchedFloorplans.length})</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => openUploadForTarget(pt.unit_type, "floorplan")}
                                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                      >
                                        + Kat Çizimi Ekle
                                      </button>
                                    </div>

                                    {pt.matchedFloorplans.map((fp: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between gap-2 bg-white rounded-lg p-2 text-xs border border-slate-200"
                                      >
                                        <span className="font-semibold text-slate-800 truncate">
                                          {fp.name}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewAsset({
                                              name: `${pt.unit_type} — ${fp.name}`,
                                              category: `${pt.unit_type} Teknik Kat Planı`,
                                              type: "pdf",
                                              url: fp.url || activeProjectDetail.cover_image,
                                              cover: activeProjectDetail.cover_image,
                                              projectName: activeProjectDetail.name
                                            })
                                          }
                                          className="px-2.5 py-0.5 bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white rounded text-[11px] font-bold cursor-pointer shrink-0 transition-colors"
                                        >
                                          Pafta Aç
                                        </button>
                                      </div>
                                    ))}
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

              {/* ============================================================= */}
              {/* SUB-TAB 2: ORTAK ALANLAR & SOSYAL TESİSLER                    */}
              {/* Dedicated view for Common Area facilities, photos, videos     */}
              {/* ============================================================= */}
              {projectSubTab === "common_areas" && (
                <div className="space-y-3">
                  {/* Top Common Areas Action & Share Banner */}
                  <div className="bg-emerald-50/70 border border-emerald-300 border-l-4 border-l-emerald-600 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
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
                        onClick={() => openUploadForTarget("COMMON_AREAS", "photo")}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Upload className="w-3 h-3 text-emerald-700" />
                        <span>+ Ortak Alan Medyası Yükle</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareCommonAreasPackage("copy")}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Ortak Alan Paketini Kopyala</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareCommonAreasPackage("whatsapp")}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>WhatsApp Paylaş</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    {/* Left 5 Cols: Common Area Facilities & Specs + Add New Common Area Spec */}
                    <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black uppercase text-slate-950 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ortak Alan & Sosyal Tesis Özellikleri</span>
                        </h5>
                        <span className="text-[10px] font-bold text-emerald-800">
                          {activeProjectDetail.name}
                        </span>
                      </div>

                      <form onSubmit={handleAddCommonAreaSpec} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newCommonSpecForm.spec_text}
                          onChange={e =>
                            setNewCommonSpecForm(prev => ({ ...prev, spec_text: e.target.value }))
                          }
                          placeholder="Yeni ortak alan özelliği ekle (Örn: Isıtmalı Kapalı Havuz & Spa)..."
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
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
                              className={`rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold flex items-center gap-2 border transition-colors ${band.rowBg}`}
                            >
                              <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 ${band.badgeBg}`}>
                                {idx + 1}
                              </span>
                              <span>{item}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right 7 Cols: Common Area Photos, Videos & Site Masterplan Files */}
                    <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black uppercase text-slate-950 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            Ortak Alan Görselleri, Drone Videoları & Vaziyet Planı ({selectedProjectCommonAreaMedia.length})
                          </span>
                        </h5>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openUploadForTarget("COMMON_AREAS", "photo")}
                            className="px-2 py-0.5 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px] font-bold cursor-pointer"
                          >
                            + Ortak Resim
                          </button>
                          <button
                            type="button"
                            onClick={() => openUploadForTarget("COMMON_AREAS", "video")}
                            className="px-2 py-0.5 bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 rounded text-[10px] font-bold cursor-pointer"
                          >
                            + Drone Video
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedProjectCommonAreaMedia.map((doc: any, dIdx: number) => {
                          const band = getSectionBandTheme(dIdx);
                          return (
                            <div
                              key={doc.id}
                              className={`rounded-xl p-2 flex items-center justify-between gap-2 border transition-all ${band.rowBg}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`p-1.5 rounded-lg shrink-0 ${band.badgeBg}`}>
                                  {doc.type === "video" || doc.media_role === "video" ? (
                                    <Play className="w-3.5 h-3.5" />
                                  ) : doc.type === "photos" || doc.media_role === "photo" ? (
                                    <ImageIcon className="w-3.5 h-3.5" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-950 truncate" title={doc.name}>
                                    {doc.name}
                                  </div>
                                  <div className="text-[10px] text-slate-700 font-semibold truncate">
                                    Ortak Alan · {doc.category}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewAsset({
                                      name: doc.name,
                                      category: `Ortak Alanlar — ${doc.category}`,
                                      type: doc.type,
                                      url: doc.url,
                                      cover:
                                        doc.type === "photos" && doc.url?.startsWith("/api/storage/")
                                          ? doc.url
                                          : activeProjectDetail.cover_image,
                                      projectName: activeProjectDetail.name
                                    })
                                  }
                                  className="px-2 py-1 bg-white hover:bg-emerald-600 text-slate-800 hover:text-white border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Önizle</span>
                                </button>
                                <a
                                  href={doc.url || activeProjectDetail.cover_image}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-slate-200 rounded-lg transition-colors"
                                  title="İndir / Aç"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* SUB-TAB 3: PROJE KLASÖRLERİ & TÜM DOSYALAR (STRICTLY ISOLATED) */}
              {/* ============================================================= */}
              {projectSubTab === "folders" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                  {/* Left 8 Cols: Isolated Project Folder Explorer */}
                  <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5 shrink-0">
                        <FolderOpen className="w-4 h-4 text-indigo-600" />
                        <span>{activeProjectDetail.name} — Klasörler & Dosyalar</span>
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">
                          Klasör Seçin:
                        </label>
                        <select
                          value={mediaCategoryFilter}
                          onChange={e => setMediaCategoryFilter(e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 cursor-pointer outline-none"
                        >
                          <option value="all">
                            Tüm Klasörler ({(activeProjectDetail.media_vault || []).length})
                          </option>
                          {projectFolderTabs.map(folderName => (
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
                        return (
                          <div
                            key={doc.id}
                            className={`rounded-xl p-2 flex items-center justify-between gap-2 border transition-all ${band.rowBg}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`p-1.5 rounded-lg shrink-0 ${band.badgeBg}`}>
                                {doc.type === "video" ? (
                                  <Play className="w-3.5 h-3.5" />
                                ) : doc.type === "photos" ? (
                                  <ImageIcon className="w-3.5 h-3.5" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-950 truncate" title={doc.name}>
                                  {doc.name}
                                </div>
                                <div className="text-[10px] text-slate-700 font-medium truncate">
                                  {doc.category}
                                  {doc.unit_type_match && doc.unit_type_match !== "COMMON_AREAS"
                                    ? ` · ${doc.unit_type_match}`
                                    : " · Ortak Alan & Sosyal Tesis"}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewAsset({
                                    name: doc.name,
                                    category: doc.category,
                                    type: doc.type,
                                    url: doc.url,
                                    cover:
                                      doc.type === "photos" && doc.url?.startsWith("/api/storage/")
                                        ? doc.url
                                        : activeProjectDetail.cover_image,
                                    projectName: activeProjectDetail.name
                                  })
                                }
                                className="px-2 py-1 bg-white hover:bg-indigo-600 text-slate-800 hover:text-white border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Önizle</span>
                              </button>
                              <a
                                href={doc.url || activeProjectDetail.cover_image}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-slate-200 rounded-lg transition-colors"
                                title="İndir / Aç"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteMediaFromProject(doc.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
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

                  {/* Right 4 Cols: Selected Project Payment Plan Summary */}
                  <div className="lg:col-span-4 space-y-2.5">
                    <div className="bg-indigo-50/70 text-slate-900 border border-indigo-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-indigo-950 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{activeProjectDetail.name} — Ödeme Planı</span>
                        </h4>
                        <span className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-[10px] font-black text-indigo-950">
                          Başlangıç: {formatGbp(activeProjectDetail.starting_price)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="bg-white border border-indigo-100 rounded-lg p-2">
                          <div className="text-[10px] text-slate-600 font-bold">Peşinat</div>
                          <div className="text-sm font-black text-slate-950">
                            %{activeProjectDetail.payment_plan?.down_payment_percent || 35}
                          </div>
                        </div>
                        <div className="bg-white border border-indigo-100 rounded-lg p-2">
                          <div className="text-[10px] text-slate-600 font-bold">Faizsiz Vade</div>
                          <div className="text-sm font-black text-indigo-700">
                            {activeProjectDetail.payment_plan?.installment_months || 36} Ay
                          </div>
                        </div>
                        <div className="bg-white border border-indigo-100 rounded-lg p-2">
                          <div className="text-[10px] text-slate-600 font-bold">Kira Getirisi</div>
                          <div className="text-sm font-black text-emerald-700">
                            %{activeProjectDetail.investment_metrics?.annual_rental_yield_percent || 9.8}
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium leading-relaxed pt-1">
                        {activeProjectDetail.payment_plan?.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: SEÇİLİ PROJE ÜNİTELERİ, KAPI NO MATRİSİ & 2D MİMARİ PLAN        */}
      {/* (Strictly isolated to the currently selected project!)                */}
      {/* ===================================================================== */}
      {activeTab === "inventory" && (
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-2.5">
          {/* STEP-BY-STEP MULTI-CHOICE INVENTORY FILTER & VIEW BAR (restateLP Style) */}
          <div className="space-y-2 pb-2 border-b border-slate-200">
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("showcase");
                    setProjectViewMode("single");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[11px] font-bold cursor-pointer whitespace-nowrap"
                >
                  ← Proje Portföyüne Dön
                </button>

                {/* View Mode Selector */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                  {[
                    { id: "grouped_types", label: "Tip & Grup", icon: ListFilter },
                    { id: "block_matrix", label: "Blok & Kat Şeması", icon: Grid },
                    { id: "table_list", label: `Kapı No Listesi (${filteredUnits.length})`, icon: Layers }
                  ].map(vm => {
                    const VIcon = vm.icon;
                    const active = inventoryViewMode === vm.id;
                    return (
                      <button
                        key={vm.id}
                        type="button"
                        onClick={() => setInventoryViewMode(vm.id as InventoryViewMode)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-all ${
                          active
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-700 hover:text-slate-950 hover:bg-white/70"
                        }`}
                      >
                        <VIcon className="w-3 h-3 shrink-0" />
                        <span>{vm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={unitBlockFilter}
                  onChange={e => setUnitBlockFilter(e.target.value)}
                  className="w-28 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none shrink-0 cursor-pointer"
                >
                  <option value="all">Tüm Bloklar</option>
                  {availableBlocks.map(b => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <div className="relative shrink-0">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    value={unitSearch}
                    onChange={e => setUnitSearch(e.target.value)}
                    placeholder="Kapı no, tip, cephe..."
                    className="pl-6 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-900 outline-none w-32"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeProjectDetail) {
                      setBatchForm(prev => ({ ...prev, project_id: activeProjectDetail.id }));
                    }
                    setIsBatchGeneratorOpen(prev => !prev);
                    setIsAddUnitOpen(false);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span>+ Seri Üret</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeProjectDetail) {
                      setNewUnitForm(prev => ({ ...prev, project_id: activeProjectDetail.id }));
                    }
                    setIsAddUnitOpen(prev => !prev);
                    setIsBatchGeneratorOpen(false);
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3 h-3 shrink-0" />
                  <span>+ Ünite</span>
                </button>
              </div>
            </div>

            {/* COLLAPSIBLE DROPDOWNS: 1. DURUM -> 2. MÜLK TİPİ */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-600 whitespace-nowrap">
                    Durum:
                  </label>
                  <select
                    value={unitStatusFilter}
                    onChange={e => setUnitStatusFilter(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 cursor-pointer outline-none focus:border-indigo-600"
                  >
                    <option value="all">Tümü ({selectedProjectUnits.length})</option>
                    <option value="available">
                      Müsait ({selectedProjectUnits.filter(u => u.status === "available").length})
                    </option>
                    <option value="negotiation">
                      Sonuçlanmakta ({selectedProjectUnits.filter(u => u.status === "negotiation").length})
                    </option>
                    <option value="optioned">
                      Opsiyonlu ({selectedProjectUnits.filter(u => u.status === "optioned").length})
                    </option>
                    <option value="sold">
                      Satıldı ({selectedProjectUnits.filter(u => u.status === "sold").length})
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-600 whitespace-nowrap">
                    Mülk Tipi:
                  </label>
                  <select
                    value={unitTypeFilter}
                    onChange={e => setUnitTypeFilter(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 cursor-pointer outline-none focus:border-indigo-600"
                  >
                    <option value="all">Tüm Tipler ({availableUnitTypes.length} Tip)</option>
                    {availableUnitTypes.map(ut => (
                      <option key={ut} value={ut}>
                        {ut} ({selectedProjectUnits.filter(u => String(u.unit_type || "").trim() === ut).length} Kapı No)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-[10px] font-semibold text-slate-500">
                Kapı numarasını silmek için numaranın yanındaki çöp kutusu ikonuna tıklayın
              </div>
            </div>
          </div>

          {/* SMART BATCH BLOCK / FLOOR / DOOR-NUMBER SERIES GENERATOR (Daylight High-Contrast) */}
          {isBatchGeneratorOpen && (
            <form
              onSubmit={handleBatchGenerateUnits}
              className="p-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <div>
                  <span className="text-xs font-black text-indigo-950">
                    {activeProjectDetail?.name} — Otomatik Blok, Kat & Kapı No Serisi Üretici
                  </span>
                  <p className="text-[10px] text-slate-600">
                    Blok, kat aralığı, kat başına kapı adedi ve kat/köşe şerefiye kurallarını girerek tüm bağımsız bölümleri tek tıkla oluşturun.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchGeneratorOpen(false)}
                  className="text-slate-500 hover:text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Kapat</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">Proje</label>
                  <select
                    value={batchForm.project_id}
                    onChange={e => setBatchForm({ ...batchForm, project_id: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-bold"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">Blok Adı</label>
                  <input
                    type="text"
                    value={batchForm.block_name}
                    onChange={e => setBatchForm({ ...batchForm, block_name: e.target.value })}
                    placeholder="Örn: C Blok (Lagün)"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Kapı No Öneki (C-101)
                  </label>
                  <input
                    type="text"
                    value={batchForm.door_prefix}
                    onChange={e => setBatchForm({ ...batchForm, door_prefix: e.target.value })}
                    placeholder="C"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-indigo-700 font-mono font-black"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">Ünite Tipi</label>
                  <input
                    type="text"
                    value={batchForm.unit_type}
                    onChange={e => setBatchForm({ ...batchForm, unit_type: e.target.value })}
                    placeholder="1+1 Loft Penthouse"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Kat Aralığı (Başlangıç - Bitiş)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={batchForm.start_floor}
                      onChange={e => setBatchForm({ ...batchForm, start_floor: Number(e.target.value) })}
                      className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-bold"
                      title="Başlangıç Katı (0 = Zemin)"
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={batchForm.end_floor}
                      onChange={e => setBatchForm({ ...batchForm, end_floor: Number(e.target.value) })}
                      className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-bold"
                      title="Bitiş Katı"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Kattaki Daire Adedi
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={batchForm.units_per_floor}
                    onChange={e => setBatchForm({ ...batchForm, units_per_floor: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 items-end">
                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Brüt / Net / Teras m²
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={batchForm.gross_sqm}
                      onChange={e => setBatchForm({ ...batchForm, gross_sqm: Number(e.target.value) })}
                      className="w-14 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                      title="Brüt m²"
                    />
                    <input
                      type="number"
                      value={batchForm.net_sqm}
                      onChange={e => setBatchForm({ ...batchForm, net_sqm: Number(e.target.value) })}
                      className="w-14 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                      title="Net m²"
                    />
                    <input
                      type="number"
                      value={batchForm.terrace_sqm}
                      onChange={e => setBatchForm({ ...batchForm, terrace_sqm: Number(e.target.value) })}
                      className="w-12 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                      title="Teras m²"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Baz Fiyat (GBP £)
                  </label>
                  <input
                    type="number"
                    value={batchForm.base_price}
                    onChange={e => setBatchForm({ ...batchForm, base_price: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-black"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Kat Şerefiye Artışı (+£/Kat)
                  </label>
                  <input
                    type="number"
                    value={batchForm.floor_price_increment}
                    onChange={e =>
                      setBatchForm({ ...batchForm, floor_price_increment: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-emerald-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Köşe Cephe Farkı (+£)
                  </label>
                  <input
                    type="number"
                    value={batchForm.corner_price_bonus}
                    onChange={e =>
                      setBatchForm({ ...batchForm, corner_price_bonus: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Manzara & Konum Değişkeni
                  </label>
                  <input
                    type="text"
                    value={batchForm.view_direction}
                    onChange={e => setBatchForm({ ...batchForm, view_direction: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={generatingBatch}
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap"
                  >
                    {generatingBatch ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {Math.max(1, batchForm.end_floor - batchForm.start_floor + 1) *
                        Math.max(1, batchForm.units_per_floor)}{" "}
                      Ünite Üret
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* SINGLE UNIT ADD DRAWER (Daylight High-Contrast) */}
          {isAddUnitOpen && (
            <form
              onSubmit={handleAddUnit}
              className="p-2.5 bg-slate-50 text-slate-900 border border-slate-300 rounded-xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 items-end"
            >
              <div>
                <label className="block text-[9px] text-slate-700 uppercase font-bold">Proje</label>
                <select
                  value={newUnitForm.project_id}
                  onChange={e => setNewUnitForm({ ...newUnitForm, project_id: Number(e.target.value) })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-bold"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-slate-700 uppercase font-bold">Blok</label>
                <input
                  type="text"
                  value={newUnitForm.block_name}
                  onChange={e => setNewUnitForm({ ...newUnitForm, block_name: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-700 uppercase font-bold">Kapı No</label>
                <input
                  type="text"
                  value={newUnitForm.unit_number}
                  onChange={e => setNewUnitForm({ ...newUnitForm, unit_number: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-indigo-700 font-mono font-black"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-700 uppercase font-bold">Ünite Tipi</label>
                <input
                  type="text"
                  value={newUnitForm.unit_type}
                  onChange={e => setNewUnitForm({ ...newUnitForm, unit_type: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-700 uppercase font-bold">Kat & Konum</label>
                <input
                  type="text"
                  value={newUnitForm.floor_level}
                  onChange={e => setNewUnitForm({ ...newUnitForm, floor_level: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-700 uppercase font-bold">Manzara / Cephe</label>
                <input
                  type="text"
                  value={newUnitForm.view_direction}
                  onChange={e => setNewUnitForm({ ...newUnitForm, view_direction: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-700 uppercase font-bold">Brüt / Net m²</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={newUnitForm.gross_sqm}
                    onChange={e => setNewUnitForm({ ...newUnitForm, gross_sqm: Number(e.target.value) })}
                    className="w-14 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                  <input
                    type="number"
                    value={newUnitForm.net_sqm}
                    onChange={e => setNewUnitForm({ ...newUnitForm, net_sqm: Number(e.target.value) })}
                    className="w-14 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] text-slate-700 uppercase font-bold">Fiyat (GBP £)</label>
                <input
                  type="number"
                  value={newUnitForm.price}
                  onChange={e => setNewUnitForm({ ...newUnitForm, price: Number(e.target.value) })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-black"
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="submit"
                  className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-black cursor-pointer whitespace-nowrap"
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddUnitOpen(false)}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* UNIT REVISION DRAWER (Daylight High-Contrast + Auto Google Drive Sync) */}
          {revisingUnit && (
            <form
              onSubmit={handleSaveUnitRevision}
              className="p-3 bg-indigo-50/80 text-slate-900 rounded-xl border-2 border-indigo-300 space-y-2.5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-xs font-black">
                    Kapı No: {revisingUnit.unit_number}
                  </span>
                  <span className="text-xs font-black text-slate-950">
                    Bağımsız Bölüm & Blok Revizyonu ({revisingUnit.project_name})
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold">
                    · Kaydedildiğinde Google Drive üzerinde otomatik revize edilir
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteUnit(revisingUnit.id, revisingUnit.unit_number)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-rose-300 whitespace-nowrap"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Kapı Numarasını Sil</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevisingUnit(null)}
                    className="text-slate-600 hover:text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer px-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Kapat</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">Blok Adı</label>
                  <input
                    type="text"
                    required
                    value={revisingUnit.block_name || ""}
                    onChange={e => setRevisingUnit({ ...revisingUnit, block_name: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Bağımsız Kapı No
                  </label>
                  <input
                    type="text"
                    required
                    value={revisingUnit.unit_number || ""}
                    onChange={e => setRevisingUnit({ ...revisingUnit, unit_number: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-indigo-700 font-mono font-black"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">Ünite Tipi</label>
                  <input
                    type="text"
                    required
                    value={revisingUnit.unit_type || ""}
                    onChange={e => setRevisingUnit({ ...revisingUnit, unit_type: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">Kat / Kot</label>
                  <input
                    type="text"
                    value={revisingUnit.floor_level || ""}
                    onChange={e => setRevisingUnit({ ...revisingUnit, floor_level: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Manzara & Cephe
                  </label>
                  <input
                    type="text"
                    value={revisingUnit.view_direction || ""}
                    onChange={e => setRevisingUnit({ ...revisingUnit, view_direction: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Konum / Aks (Köşe/Orta)
                  </label>
                  <input
                    type="text"
                    value={revisingUnit.position_tag || "Panoramik Aks"}
                    onChange={e => setRevisingUnit({ ...revisingUnit, position_tag: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Brüt / Net / Teras m²
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={revisingUnit.gross_sqm || 0}
                      onChange={e =>
                        setRevisingUnit({ ...revisingUnit, gross_sqm: Number(e.target.value) })
                      }
                      className="w-12 px-1 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                      title="Brüt m²"
                    />
                    <input
                      type="number"
                      value={revisingUnit.net_sqm || 0}
                      onChange={e =>
                        setRevisingUnit({ ...revisingUnit, net_sqm: Number(e.target.value) })
                      }
                      className="w-12 px-1 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                      title="Net m²"
                    />
                    <input
                      type="number"
                      value={revisingUnit.terrace_sqm || 0}
                      onChange={e =>
                        setRevisingUnit({ ...revisingUnit, terrace_sqm: Number(e.target.value) })
                      }
                      className="w-10 px-1 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                      title="Teras m²"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Liste Fiyatı (GBP £)
                  </label>
                  <input
                    type="number"
                    value={revisingUnit.price || 0}
                    onChange={e => setRevisingUnit({ ...revisingUnit, price: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-mono font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end pt-1">
                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Bağımsız Bölüm Satış Statüsü
                  </label>
                  <select
                    value={revisingUnit.status || "available"}
                    onChange={e => setRevisingUnit({ ...revisingUnit, status: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900"
                  >
                    <option value="available">MÜSAİT (Satışa Açık)</option>
                    <option value="negotiation">SONUÇLANMAKTA (Sözleşme / Kaparo Aşamasında)</option>
                    <option value="optioned">OPSİYONLU (Rezerve)</option>
                    <option value="sold">SATILDI (Sözleşmesi Tamamlandı)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Alıcı / Sözleşme Notu (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Avukat sözleşme onayı bekleniyor / Müşteri Adı"
                    value={revisingUnit.optioned_client_name || ""}
                    onChange={e =>
                      setRevisingUnit({ ...revisingUnit, optioned_client_name: e.target.value })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteUnit(revisingUnit.id, revisingUnit.unit_number)}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sil</span>
                  </button>
                  <button
                    type="submit"
                    disabled={savingUnitRevision}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {savingUnitRevision
                        ? "Kaydediliyor..."
                        : "Revizyonu Kaydet & Drive'a İşle"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* GROUP BULK REVISION DRAWER (Daylight High-Contrast) */}
          {revisingGroup && (
            <form
              onSubmit={handleSaveGroupBulkRevision}
              className="p-3 bg-amber-50/80 text-slate-900 rounded-xl border border-amber-300 space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                <span className="text-xs font-black text-amber-950">
                  Toplu Grup Revizyonu: {revisingGroup.title} ({revisingGroup.unitIds.length} Bağımsız Bölüm)
                </span>
                <button
                  type="button"
                  onClick={() => setRevisingGroup(null)}
                  className="text-slate-600 hover:text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Kapat</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Blok Adını Değiştir
                  </label>
                  <input
                    type="text"
                    placeholder="Değiştirmek için yazın"
                    value={revisingGroup.block_name}
                    onChange={e => setRevisingGroup({ ...revisingGroup, block_name: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Ünite Tipini Değiştir
                  </label>
                  <input
                    type="text"
                    value={revisingGroup.unit_type}
                    onChange={e => setRevisingGroup({ ...revisingGroup, unit_type: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Manzara / Cephe Değiştir
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Tam Deniz & Havuz"
                    value={revisingGroup.view_direction}
                    onChange={e =>
                      setRevisingGroup({ ...revisingGroup, view_direction: e.target.value })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Sabit Fiyat Ata (GBP £)
                  </label>
                  <input
                    type="number"
                    placeholder="Boş bırakılırsa değişmez"
                    value={revisingGroup.price}
                    onChange={e => setRevisingGroup({ ...revisingGroup, price: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-black"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-700 uppercase font-bold">
                    Toplu Statü Ata
                  </label>
                  <select
                    value={revisingGroup.status}
                    onChange={e => setRevisingGroup({ ...revisingGroup, status: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-bold"
                  >
                    <option value="">Mevcut Statüleri Koru</option>
                    <option value="available">Tümü Müsait</option>
                    <option value="negotiation">Tümü Sonuçlanmakta (Sözleşme)</option>
                    <option value="optioned">Tümü Opsiyonlu</option>
                    <option value="sold">Tümü Satıldı</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={savingUnitRevision}
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer whitespace-nowrap"
                >
                  Grubu Revize Et & Drive'a İşle
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* VIEW MODE 1: TİP & GRUP ÖZETİ (ALT ALTA YUMUŞAK RENK GEÇİŞLİ GRUPLAR) */}
          {/* ================================================================= */}
          {inventoryViewMode === "grouped_types" && (
            <div className="space-y-3">
              <div className="space-y-3.5">
                {unitTypeGroups.map((grp, gIdx) => {
                  const theme = getSectionBandTheme(gIdx);
                  return (
                    <div
                      key={grp.key}
                      className={`rounded-xl border border-l-4 overflow-hidden shadow-2xs transition-all ${theme.cardBg}`}
                    >
                      {/* Group Tinted Band Header */}
                      <div
                        className={`px-3.5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${theme.headerBg}`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${theme.badgeBg}`}>
                            TİP GRUBU #{gIdx + 1}
                          </span>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-black ${theme.subBadgeBg}`}>
                            {grp.project_name}
                          </span>
                          <h4 className="text-sm font-black text-slate-950">{grp.unit_type}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 text-[10px] font-black text-slate-800">
                            {grp.total} Bağımsız Bölüm
                          </span>
                          <span className="text-[11px] text-slate-700 font-semibold">
                            • Alan: <strong className="text-slate-950">{grp.grossSqm} m² Brüt</strong> / {grp.netSqm} m² Net (+{grp.terraceSqm} m² Teras)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200/90 text-right">
                            <span className="text-[9px] font-bold text-slate-500 uppercase mr-1.5">
                              Fiyat Aralığı:
                            </span>
                            <span className="text-xs font-black text-slate-950 font-mono">
                              {grp.minPrice === grp.maxPrice
                                ? formatGbp(grp.minPrice)
                                : `${formatGbp(grp.minPrice)} – ${formatGbp(grp.maxPrice)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Group Body: Left Variables & Status Breakdown + Right Independent Door Number Matrix */}
                      <div className="p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                        <div className="lg:col-span-5 space-y-2">
                          {/* 4-Status Quantitative Breakdown Bar */}
                          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-black">
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg py-1 shadow-2xs">
                              {grp.available} Müsait
                            </div>
                            <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-lg py-1 shadow-2xs">
                              {grp.negotiation} Sonuçlanmakta
                            </div>
                            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg py-1 shadow-2xs">
                              {grp.optioned} Opsiyonlu
                            </div>
                            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg py-1 shadow-2xs">
                              {grp.sold} Satıldı
                            </div>
                          </div>

                          {/* Variables of this unit type (Blocks, Floors, Views) */}
                          <div className={`rounded-xl p-2.5 border text-[11px] space-y-1 shadow-2xs ${theme.innerBoxBg}`}>
                            <div className="flex flex-wrap gap-1">
                              <span className="font-black text-slate-700">Bloklar:</span>
                              <span className="text-slate-950 font-bold">
                                {Array.from(grp.blocks).join(", ")}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <span className="font-black text-slate-700">Kat Değişkenleri:</span>
                              <span className="text-slate-800 font-semibold">
                                {Array.from(grp.floors).join(" · ")}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <span className="font-black text-slate-700">Manzara & Cephe:</span>
                              <span className="text-indigo-900 font-semibold">
                                {Array.from(grp.views).join(" | ")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Independent Door Number Chips with Direct Delete */}
                        <div className={`lg:col-span-7 rounded-xl p-2.5 border shadow-2xs ${theme.innerBoxBg}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-700">
                              Bağımsız Bölüm Kapı Numaraları ({grp.units.length} Adet — Revize İçin Tıklayın / Silin)
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              Kapı No (Kat) · Sil
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {grp.units.map(u => {
                              const meta = getStatusBadgeMeta(u.status);
                              return (
                                <div
                                  key={u.id}
                                  className={`inline-flex items-center rounded-lg border overflow-hidden shadow-2xs ${meta.chipBg}`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setRevisingUnit({ ...u })}
                                    title={`${u.block_name} | Kapı: ${u.unit_number} | Kat: ${u.floor_level} | Manzara: ${u.view_direction} | Fiyat: ${formatGbp(u.price)} (${meta.label})`}
                                    className="px-2.5 py-1 text-[10px] font-mono font-black cursor-pointer flex items-center gap-1 whitespace-nowrap hover:opacity-85 transition-opacity"
                                  >
                                    <span>{u.unit_number}</span>
                                    <span className="opacity-80 text-[9px] font-sans">
                                      ({u.floor_level?.split(" ")[0]})
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteUnit(u.id, u.unit_number);
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
                        </div>
                      </div>

                      {/* Group Footer Actions */}
                      <div
                        className={`px-3.5 py-2 border-t flex flex-wrap items-center justify-between gap-2 ${theme.footerBg}`}
                      >
                        <span className="text-[10px] font-bold text-slate-600">
                          Grup #{gIdx + 1} • {grp.unit_type} ({grp.total} Bağımsız Bölüm)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setRevisingGroup({
                                title: `${grp.project_name} — ${grp.unit_type}`,
                                unitIds: grp.units.map(u => u.id),
                                block_name: "",
                                unit_type: grp.unit_type,
                                view_direction: "",
                                floor_level: "",
                                status: "",
                                price: ""
                              })
                            }
                            className="px-2.5 py-1 bg-white hover:bg-indigo-600 text-slate-800 hover:text-white border border-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Grubu Toplu Revize Et</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteUnitGroup(
                                grp.units.map(u => u.id),
                                grp.unit_type
                              )
                            }
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Grubun Kapı Nolarını Sil</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW MODE 2: BLOK & KAT MATRİSİ (YUMUŞAK RENK GEÇİŞLİ KAT ŞEMASI) */}
          {/* ================================================================= */}
          {inventoryViewMode === "block_matrix" && (
            <div className="space-y-3.5">
              {blockStackingMatrix.map((blk, bIdx) => {
                const blockTheme = getSectionBandTheme(bIdx);
                return (
                  <div
                    key={bIdx}
                    className={`rounded-xl border border-l-4 overflow-hidden shadow-2xs ${blockTheme.cardBg}`}
                  >
                    <div
                      className={`px-3.5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${blockTheme.headerBg}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${blockTheme.badgeBg}`}>
                          BLOK #{bIdx + 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-black ${blockTheme.subBadgeBg}`}>
                          {blk.projectName}
                        </span>
                        <h4 className="text-sm font-black text-slate-950">{blk.blockTitle}</h4>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">
                        Kat Kesiti & Bağımsız Bölüm Kapı No Şeması ({blk.floors.length} Kat)
                      </span>
                    </div>

                    <div className="p-3 space-y-2.5">
                      {blk.floors.map((fl, fIdx) => {
                        const floorTheme = getSectionBandTheme(bIdx + fIdx);
                        return (
                          <div
                            key={fIdx}
                            className={`grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center p-2.5 rounded-xl border border-l-4 ${floorTheme.cardBg}`}
                          >
                            <div
                              className={`lg:col-span-2 px-2.5 py-2 rounded-lg border text-center ${floorTheme.subBadgeBg}`}
                            >
                              <div className="text-[9px] font-black uppercase opacity-80">
                                Kat / Kot #{fIdx + 1}
                              </div>
                              <div className="text-xs font-black text-slate-950 mt-0.5">{fl.floorName}</div>
                            </div>

                            <div className="lg:col-span-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                              {fl.units.map((u: any) => {
                                const meta = getStatusBadgeMeta(u.status);
                                return (
                                  <div
                                    key={u.id}
                                    className="rounded-lg border border-slate-200/90 p-2 flex flex-col justify-between gap-1.5 hover:border-indigo-500 transition-all bg-white shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-mono text-xs font-black text-slate-950 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                        Kapı: {u.unit_number}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${meta.pillBg}`}
                                      >
                                        {meta.label}
                                      </span>
                                    </div>

                                    <div>
                                      <div className="text-[11px] font-bold text-slate-900">{u.unit_type}</div>
                                      <div className="text-[10px] text-slate-500 truncate" title={u.view_direction}>
                                        {u.view_direction}
                                      </div>
                                      <div className="text-[10px] text-slate-600 font-mono">
                                        {u.gross_sqm} m² Brüt / {u.net_sqm} m² Net
                                      </div>
                                    </div>

                                    <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between">
                                      <span className="text-xs font-black text-slate-950 font-mono">
                                        {formatGbp(u.price)}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setRevisingUnit({ ...u })}
                                          className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold cursor-pointer whitespace-nowrap"
                                        >
                                          Revize Et
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteUnit(u.id, u.unit_number)}
                                          className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded text-[9px] font-bold cursor-pointer flex items-center gap-0.5 whitespace-nowrap transition-colors"
                                          title={`Kapı No ${u.unit_number} Sil`}
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                          <span>Sil</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW MODE 3: DETAYLI TABLO & SATIR İÇİ HIZLI REVİZYON             */}
          {/* ================================================================= */}
          {inventoryViewMode === "table_list" && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2 px-2.5 rounded-tl-lg">Proje</th>
                    <th className="py-2 px-2.5">Blok & Bağımsız Kapı No</th>
                    <th className="py-2 px-2.5">Ünite Tipi</th>
                    <th className="py-2 px-2.5">Alan (Brüt / Net)</th>
                    <th className="py-2 px-2.5">Kat, Konum & Manzara</th>
                    <th className="py-2 px-2.5">Liste Fiyatı (GBP)</th>
                    <th className="py-2 px-2.5">Statü</th>
                    <th className="py-2 px-2.5 text-right rounded-tr-lg">Revizyon, Durum & Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {filteredUnits.map((unit, uIdx) => {
                    const editedPrice = editingUnitPrices[unit.id];
                    const meta = getStatusBadgeMeta(unit.status);
                    const rowTheme = getSectionBandTheme(uIdx);
                    return (
                      <tr key={unit.id} className={`transition-colors ${rowTheme.rowBg}`}>
                        <td className="py-2 px-2.5 font-black text-slate-900 whitespace-nowrap">
                          {unit.project_name}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
                              {unit.unit_number}
                            </span>
                            <span className="text-slate-800 font-bold">{unit.block_name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-black ${rowTheme.subBadgeBg}`}>
                            {unit.unit_type}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 font-semibold font-mono tabular-nums whitespace-nowrap">
                          {unit.gross_sqm} m² / {unit.net_sqm} m²{" "}
                          <span className="text-[10px] text-slate-500">(+{unit.terrace_sqm}m²)</span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700">
                          <span className="font-bold text-slate-900">{unit.floor_level}</span> •{" "}
                          <span>{unit.view_direction}</span>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-bold">£</span>
                            <input
                              type="number"
                              value={editedPrice !== undefined ? editedPrice : Number(unit.price)}
                              onChange={e =>
                                setEditingUnitPrices(prev => ({
                                  ...prev,
                                  [unit.id]: Number(e.target.value)
                                }))
                              }
                              className="w-24 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-black text-slate-950 font-mono tabular-nums"
                            />
                            {editedPrice !== undefined && editedPrice !== Number(unit.price) && (
                              <button
                                type="button"
                                onClick={() => handleUnitPriceSave(unit.id)}
                                className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black cursor-pointer whitespace-nowrap"
                              >
                                Kaydet
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-[10px] border ${meta.pillBg}`}
                          >
                            {meta.label}
                          </span>
                          {unit.optioned_client_name && (
                            <div className="text-[9px] text-slate-600 font-semibold mt-0.5">
                              {unit.optioned_client_name}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setRevisingUnit({ ...unit })}
                              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap"
                              title="Blok, Kapı No, Tip, Kat, Manzara ve Fiyatı Revize Et"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Revize Et</span>
                            </button>
                            <select
                              value={unit.status}
                              onChange={e => handleUnitStatusChange(unit.id, e.target.value)}
                              className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-800 cursor-pointer"
                            >
                              <option value="available">Müsait Yap</option>
                              <option value="negotiation">Sonuçlanmakta</option>
                              <option value="optioned">Opsiyona Al</option>
                              <option value="sold">Satıldı İşaretle</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleDeleteUnit(unit.id, unit.unit_number)}
                              className="px-2 py-0.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap transition-colors"
                              title={`Kapı No ${unit.unit_number} Bağımsız Bölümünü Sil`}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Sil</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: TÜM PROJELER KARŞILAŞTIRMA TABLOSU                             */}
      {/* ===================================================================== */}
      {activeTab === "compare" && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-sm font-black text-slate-950">
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
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-200 text-[10px] font-black uppercase">
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
                        <td className="py-2 px-2.5 font-black text-slate-900 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-black mr-1.5 ${rowTheme.subBadgeBg}`}>
                            #{pIdx + 1}
                          </span>
                          {p.folder_prefix || p.name}
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 font-medium">{p.sub_region}</td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-900">{p.completion_date}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            %{p.construction_progress}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 font-mono tabular-nums whitespace-nowrap">
                          <strong className="text-emerald-700">{p.available_units}</strong> / {p.total_units}
                        </td>
                        <td className="py-2 px-2.5 font-mono font-black text-slate-900 tabular-nums whitespace-nowrap">
                          {formatGbp(p.starting_price)}
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 whitespace-nowrap">
                          %{p.payment_plan?.down_payment_percent || 35} Peşinat ·{" "}
                          {p.payment_plan?.installment_months || 36} Ay (%0 Faiz)
                        </td>
                        <td className="py-2 px-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handlePrintProjectSheet(p)}
                            className="px-2.5 py-1 bg-white hover:bg-indigo-600 text-slate-800 hover:text-white border border-slate-300 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap transition-colors"
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
              <h3 className="text-sm font-black text-slate-950">
                İkili Proje & Ödeme Planı Simülatörü
              </h3>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <select
                  value={compareLeftId}
                  onChange={e => setCompareLeftId(Number(e.target.value))}
                  className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-black text-indigo-950 shrink-0"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      1. Proje: {p.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-black text-slate-400 shrink-0">VS</span>
                <select
                  value={compareRightId}
                  onChange={e => setCompareRightId(Number(e.target.value))}
                  className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-black text-amber-950 shrink-0"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      2. Proje: {p.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                  <Calculator className="w-3.5 h-3.5 text-slate-700" />
                  <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">Bütçe (GBP):</span>
                  <input
                    type="number"
                    value={simulatorPriceGbp}
                    onChange={e => setSimulatorPriceGbp(Number(e.target.value) || 150000)}
                    className="w-24 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-black text-slate-900 font-mono"
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
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${badge}`}>
                            {proj.folder_prefix}
                          </span>
                          <h4 className="text-base font-black text-slate-950 mt-1">{proj.name}</h4>
                          <p className="text-[11px] text-slate-600 font-semibold">
                            {proj.sub_region} • Teslim: {proj.completion_date}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-500">Başlangıç</div>
                          <div className="text-base font-black text-slate-900 font-mono">
                            {formatGbp(proj.starting_price)}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-indigo-200 text-slate-900 rounded-xl p-2.5 space-y-1.5">
                        <div className="text-[10px] font-black text-indigo-900 uppercase">
                          {formatGbp(simulatorPriceGbp)} İçin Ödeme Planı Hesaplaması
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                            <div className="text-[9px] text-slate-600 font-bold">Peşinat (%{downPct})</div>
                            <div className="text-xs font-black text-slate-950 font-mono">
                              {formatGbp(downAmount)}
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                            <div className="text-[9px] text-slate-600 font-bold">Kalan (%{100 - downPct})</div>
                            <div className="text-xs font-black text-indigo-700 font-mono">
                              {formatGbp(remainAmount)}
                            </div>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5">
                            <div className="text-[9px] text-emerald-800 font-bold">{months} Ay Taksit</div>
                            <div className="text-xs font-black text-emerald-900 font-mono">
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
      )}

      {/* ===================================================================== */}
      {/* TAB 4: ETKİNLİK & LANSMAN ARŞİVİ (RESİM & VİDEO EKLEME / GALERİ)     */}
      {/* ===================================================================== */}
      {activeTab === "events" && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-950">
                Etkinlik, Lansman & PR Medya Arşivi ({events.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Lansman geceleri, yatırımcı gezileri ve etkinlikler için bilgisayar veya mobilden fotoğraf ve video yükleyin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingEventId(null);
                setNewEventForm({
                  title: "",
                  event_type: "launch_party",
                  project_name: projects[0]?.name || "Mykonos Homes",
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
                setIsNewEventOpen(prev => !prev);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Etkinlik Oluştur</span>
            </button>
          </div>

          {/* CENTERED VIEWPORT-FIT MODAL FOR EVENT CREATION & MEDIA UPLOAD/EDIT */}
          {isNewEventOpen && (
            <div
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3"
              onClick={() => {
                setIsNewEventOpen(false);
                setEditingEventId(null);
              }}
            >
              <form
                onSubmit={handleSaveEvent}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-2xl p-4 bg-white text-slate-900 rounded-2xl border-2 border-indigo-500 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase text-indigo-700">
                      ETKİNLİK & LANSMAN MEDYA YÖNETİM PENCERESİ
                    </span>
                    <h4 className="text-sm font-black text-slate-950">
                      {editingEventId
                        ? `Etkinlik & Medya Düzenle: ${newEventForm.title}`
                        : "Yeni Etkinlik / Lansman Oluştur (Resim & Video Destekli)"}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewEventOpen(false);
                      setEditingEventId(null);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Kapat</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-700 uppercase font-bold mb-1">
                      Etkinlik / Lansman Başlığı *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Mykonos Homes Yaz Lansmanı & Gala Gecesi"
                      value={newEventForm.title}
                      onChange={e => setNewEventForm({ ...newEventForm, title: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-700 uppercase font-bold mb-1">
                      İlgili Proje
                    </label>
                    <select
                      value={newEventForm.project_name}
                      onChange={e => setNewEventForm({ ...newEventForm, project_name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-indigo-50/60 border border-indigo-300 rounded-lg text-xs text-slate-900 font-black"
                    >
                      <option value="Tüm Projeler">Tüm Projeler</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-700 uppercase font-bold mb-1">
                      Tarih & Saat
                    </label>
                    <input
                      type="text"
                      placeholder="2026-07-10 19:30"
                      value={newEventForm.event_date}
                      onChange={e => setNewEventForm({ ...newEventForm, event_date: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-700 uppercase font-bold mb-1">
                      Konum / Mekan
                    </label>
                    <input
                      type="text"
                      placeholder="Esentepe Sahil Satış Ofisi"
                      value={newEventForm.location}
                      onChange={e => setNewEventForm({ ...newEventForm, location: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-700 uppercase font-bold mb-1">
                      Etkinlik Açıklaması
                    </label>
                    <input
                      type="text"
                      placeholder="Kısa açıklama / program özeti"
                      value={newEventForm.description}
                      onChange={e => setNewEventForm({ ...newEventForm, description: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* IMAGE & VIDEO UPLOAD CONTROLS FOR EVENT */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] text-slate-700 uppercase font-bold mb-1">
                      Fotoğraf / Görsel Ekle (Cihazdan)
                    </label>
                    <input
                      ref={eventImageInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={e => handleEventMediaUpload(e, "image")}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => eventImageInputRef.current?.click()}
                      disabled={uploadingEventMedia}
                      className="w-full px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {uploadingEventMedia ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5" />
                      )}
                      <span>+ Resim Yükle</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-700 uppercase font-bold mb-1">
                      Lansman Videosu Ekle (Cihazdan)
                    </label>
                    <input
                      ref={eventVideoInputRef}
                      type="file"
                      multiple
                      accept="video/*,.mp4,.mov,.webm"
                      onChange={e => handleEventMediaUpload(e, "video")}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => eventVideoInputRef.current?.click()}
                      disabled={uploadingEventMedia}
                      className="w-full px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {uploadingEventMedia ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Video className="w-3.5 h-3.5" />
                      )}
                      <span>+ Video Yükle (MP4/MOV)</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-700 uppercase font-bold mb-1">
                      Harici Video / Görsel Linki
                    </label>
                    <input
                      type="text"
                      placeholder="Video veya görsel URL yapıştırın"
                      value={newEventForm.video_url || newEventForm.cover_image}
                      onChange={e =>
                        setNewEventForm({
                          ...newEventForm,
                          video_url: e.target.value,
                          media_preview_url: e.target.value
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Attached Event Media Gallery Preview Strip */}
                {newEventForm.media_gallery.length > 0 && (
                  <div className="space-y-1.5 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-200">
                    <div className="text-[10px] font-black text-indigo-950 uppercase">
                      Eklenen Etkinlik Medyaları ({newEventForm.media_gallery.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newEventForm.media_gallery.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-semibold"
                        >
                          {item.type === "video" ? (
                            <Video className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span className="truncate max-w-[180px]">{item.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewEventForm(prev => ({
                                ...prev,
                                media_gallery: prev.media_gallery.filter(m => m.id !== item.id)
                              }))
                            }
                            className="text-slate-400 hover:text-rose-600 cursor-pointer flex items-center"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewEventOpen(false);
                      setEditingEventId(null);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingEventMedia}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    Kaydet & Güncelle
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* EVENTS GRID WITH COVER IMAGES, VIDEO PREVIEWS & EDIT ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {events.map((ev, evIdx) => {
              const evTheme = getSectionBandTheme(evIdx);
              const gallery: any[] = Array.isArray(ev.media_gallery) ? ev.media_gallery : [];
              const matchedProj = projects.find(p =>
                ev.project_name?.toLowerCase().includes(p.name?.toLowerCase())
              );
              const coverImg =
                ev.cover_image ||
                gallery.find((m: any) => m.type === "image")?.url ||
                matchedProj?.cover_image ||
                projects[0]?.cover_image;
              const videoUrl =
                ev.video_url ||
                gallery.find((m: any) => m.type === "video")?.url ||
                (ev.media_preview_url?.startsWith("/api/storage/") || ev.media_preview_url?.startsWith("http")
                  ? ev.media_preview_url
                  : "https://drive.google.com/file/d/1S-voP7vN7ciN52agBq4iuWHSoP0yfRCW/view");

              return (
                <div
                  key={ev.id}
                  className={`border border-l-4 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between ${evTheme.cardBg}`}
                >
                  <div>
                    {/* Event Visual Cover & Media Counter */}
                    <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                      {coverImg && (
                        <img
                          src={coverImg}
                          alt={ev.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 bg-white/95 text-slate-950 rounded text-[10px] font-bold truncate">
                          {ev.project_name}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-mono font-bold shrink-0">
                          {ev.event_date}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-white/90 text-slate-950 text-[10px] font-bold flex items-center gap-1">
                          <Video className="w-3 h-3 text-indigo-600" />
                          <span>
                            {gallery.length > 0
                              ? `${gallery.length} Medya (Resim & Video)`
                              : ev.media_preview_url || "Lansman Medyası"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="p-3 space-y-1.5">
                      <h4 className="text-sm font-black text-slate-950 leading-snug">{ev.title}</h4>
                      <p className="text-[11px] text-slate-600">{ev.description}</p>
                      <div className="text-[10px] text-slate-700 bg-white/90 p-2 rounded-lg border border-slate-200/80">
                        <strong>Konum:</strong> {ev.location}
                      </div>
                    </div>
                  </div>

                  <div className={`px-3 py-2 border-t flex items-center justify-between gap-1.5 ${evTheme.footerBg}`}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditEvent(ev)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap"
                      >
                        <Edit3 className="w-3 h-3 text-indigo-600" />
                        <span>Medya Ekle / Düzenle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Etkinliği Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPreviewAsset({
                          name: ev.title,
                          category: "Etkinlik & Lansman Medyası",
                          type: "video",
                          url: videoUrl,
                          cover: coverImg,
                          gallery,
                          projectName: ev.project_name
                        })
                      }
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                    >
                      <Play className="w-3 h-3" />
                      <span>Medyayı Aç</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: ŞİRKET EKİBİ & KULLANICI YETKİLERİ                             */}
      {/* ===================================================================== */}
      {activeTab === "agencies" && (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-950">
                {companyDisplayName} — Ekip & Kullanıcı Yetkileri ({internalStaff.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Teknik, Satış, PR ve Yönetim ekibiniz için kullanıcı tanımlayın ve erişim yetkilerini belirleyin.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">
                Departman:
              </label>
              <select
                value={staffDeptFilter}
                onChange={e => setStaffDeptFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 cursor-pointer outline-none"
              >
                <option value="all">Tüm Departmanlar ({internalStaff.length})</option>
                <option value="Yönetim">Yönetim</option>
                <option value="Teknik & Mimari">Teknik & Mimari</option>
                <option value="Satış">Satış</option>
                <option value="PR & Pazarlama">PR & Pazarlama</option>
              </select>

              <button
                type="button"
                onClick={() => setIsNewStaffOpen(prev => !prev)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kullanıcı Ekle</span>
              </button>
            </div>
          </div>

          {isNewStaffOpen && (
            <form
              onSubmit={handleCreateInternalStaff}
              className="p-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 space-y-2.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ad Soyad *"
                  value={newStaffForm.full_name}
                  onChange={e => setNewStaffForm({ ...newStaffForm, full_name: e.target.value })}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold"
                />
                <select
                  value={newStaffForm.department}
                  onChange={e => {
                    const dept = e.target.value;
                    setNewStaffForm({
                      ...newStaffForm,
                      department: dept,
                      permissions: {
                        can_manage_projects: dept === "Yönetim" || dept === "Teknik & Mimari",
                        can_upload_media: true,
                        can_manage_prices: dept === "Yönetim" || dept === "Satış",
                        can_manage_users: dept === "Yönetim"
                      }
                    });
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-bold"
                >
                  <option value="Yönetim">Yönetim</option>
                  <option value="Teknik & Mimari">Teknik & Mimari</option>
                  <option value="Satış">Satış</option>
                  <option value="PR & Pazarlama">PR & Pazarlama</option>
                </select>
                <input
                  type="text"
                  placeholder="Görev / Unvan"
                  value={newStaffForm.title_role}
                  onChange={e => setNewStaffForm({ ...newStaffForm, title_role: e.target.value })}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold"
                />
                <input
                  type="email"
                  placeholder="Kurumsal E-Posta *"
                  value={newStaffForm.email}
                  onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Sorumlu Projeler / Alan"
                    value={newStaffForm.assigned_regions}
                    onChange={e =>
                      setNewStaffForm({ ...newStaffForm, assigned_regions: e.target.value })
                    }
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b border-slate-200 text-[10px] font-black uppercase">
                  <th className="py-2 px-2.5 rounded-tl-lg">Ad Soyad & E-Posta</th>
                  <th className="py-2 px-2.5">Departman & Görev</th>
                  <th className="py-2 px-2.5">Sorumlu Alan</th>
                  <th className="py-2 px-2.5 text-center">Proje & Klasör</th>
                  <th className="py-2 px-2.5 text-center">Medya & Plan Yükleme</th>
                  <th className="py-2 px-2.5 text-center">Fiyat & Stok</th>
                  <th className="py-2 px-2.5 text-center">Ekip Yönetimi</th>
                  <th className="py-2 px-2.5 text-right rounded-tr-lg">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredStaff.map((st, stIdx) => {
                  const rowTheme = getSectionBandTheme(stIdx);
                  const perms = st.permissions || {
                    can_manage_projects:
                      st.department === "Yönetim" || st.department === "Teknik & Mimari",
                    can_upload_media: true,
                    can_manage_prices: st.department === "Yönetim" || st.department === "Satış",
                    can_manage_users: st.department === "Yönetim"
                  };
                  return (
                    <tr key={st.id} className={`transition-colors ${rowTheme.rowBg}`}>
                      <td className="py-2 px-2.5">
                        <div className="font-black text-slate-900">{st.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{st.email}</div>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className={`px-2 py-0.5 border rounded text-[10px] font-black ${rowTheme.subBadgeBg}`}>
                          {st.department}
                        </span>
                        <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                          {st.title_role}
                        </div>
                      </td>
                      <td className="py-2 px-2.5 text-[11px] text-slate-700 font-medium">
                        {st.assigned_regions}
                      </td>
                      {(
                        [
                          "can_manage_projects",
                          "can_upload_media",
                          "can_manage_prices",
                          "can_manage_users"
                        ] as const
                      ).map(permKey => {
                        const enabled = Boolean(perms[permKey]);
                        return (
                          <td key={permKey} className="py-2 px-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleStaffPermission(st, permKey)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer border whitespace-nowrap transition-colors ${
                                enabled
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : "bg-white text-slate-400 border-slate-200"
                              }`}
                            >
                              {enabled ? "Yetkili" : "Kapalı"}
                            </button>
                          </td>
                        );
                      })}
                      <td className="py-2 px-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteInternalStaff(st.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Kullanıcıyı Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* IN-APP ASSET, VIDEO & EVENT GALLERY PREVIEW MODAL                     */}
      {/* ===================================================================== */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-50 border-b border-slate-200 text-slate-900 px-4 py-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-950">{previewAsset.name}</h4>
                <p className="text-[11px] text-slate-600">
                  {previewAsset.projectName} · {previewAsset.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="p-1 text-slate-500 hover:text-slate-950 rounded-lg cursor-pointer"
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
                <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                  <video
                    src={previewAsset.url}
                    controls
                    autoPlay
                    className="w-full max-h-72 object-contain"
                  />
                </div>
              ) : (
                previewAsset.cover && (
                  <div className="h-64 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                    <img
                      src={previewAsset.cover}
                      alt={previewAsset.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-white/95 text-slate-950 text-[11px] font-bold border border-slate-200">
                      {previewAsset.projectName} — {previewAsset.category}
                    </div>
                  </div>
                )
              )}

              {/* Event Media Gallery Thumbnails if available */}
              {Array.isArray(previewAsset.gallery) && previewAsset.gallery.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-slate-500">
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
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-800 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
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

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Proje Klasöründe Kayıtlı</span>
                </span>
                <div className="flex items-center gap-2">
                  {previewAsset.url && (
                    <a
                      href={previewAsset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Dosyayı İndir / Aç</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewAsset(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
