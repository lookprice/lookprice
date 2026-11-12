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
  TrendingUp,
  Calculator,
  Printer,
  Edit3,
  Trash2,
  Percent,
  Save,
  Eye,
  Upload,
  FolderOpen,
  FolderPlus,
  AlertTriangle,
  Loader2,
  Building2,
  Compass,
  Navigation,
  Grid,
  ListFilter,
  Sparkles,
  Sun,
  Moon,
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

export type SuiteTab =
  | "showcase"
  | "inventory"
  | "compare"
  | "agencies"
  | "leads_contracts"
  | "events"
  | "b2b_portal_preview";

type InventoryViewMode = "grouped_types" | "block_matrix" | "drone_3d" | "table_list";

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
  "Ruhsat & Hukuki Belgeler"
];

export const DeveloperProjectSuite: React.FC<DeveloperProjectSuiteProps> = ({
  storeId,
  branding,
  user,
  initialSection,
  onBackToPortfolio,
  onConvertUnitToProperty
}) => {
  const normalizeTab = (t?: SuiteTab): SuiteTab => {
    if (!t) return "showcase";
    if (t === "leads_contracts" || t === "b2b_portal_preview") return "showcase";
    return t;
  };

  const [activeTab, setActiveTab] = useState<SuiteTab>(normalizeTab(initialSection));
  const [loading, setLoading] = useState<boolean>(true);

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

  // Selected project for deep inspection in Showcase & Inventory
  const [selectedProjectId, setSelectedProjectId] = useState<number | "all">("all");
  const [activeProjectDetail, setActiveProjectDetail] = useState<any | null>(null);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>("all");
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);

  // Project Create / Edit Drawer State
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

  // Project File / Media Upload State (Computer/Mobile Upload, Custom Folders, Duplicate Conflict Resolution)
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
    url: ""
  });

  // =========================================================================
  // INVENTORY & LARGE-SCALE INDEPENDENT UNIT MANAGEMENT STATE
  // =========================================================================
  const [inventoryViewMode, setInventoryViewMode] = useState<InventoryViewMode>("grouped_types");
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isBatchGeneratorOpen, setIsBatchGeneratorOpen] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  // Single unit add form
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

  // Batch Block / Floor / Door-Number Generator Form (For hundreds/thousands of units)
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

  // Unit Revision Modal / Drawer State (Allows revising Block, Door No, Type, Floor, View, SQM, Price, Status)
  const [revisingUnit, setRevisingUnit] = useState<any | null>(null);
  const [savingUnitRevision, setSavingUnitRevision] = useState(false);

  // Group Bulk Revision Modal State
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

  // 3D Drone & Building Elevation Interactive State
  const [droneTargetUnit, setDroneTargetUnit] = useState<any | null>(null);
  const [droneFlying, setDroneFlying] = useState(false);
  const [droneNightMode, setDroneNightMode] = useState(false);
  const [droneCameraAngle, setDroneCameraAngle] = useState<"isometric" | "sea_front" | "top_down" | "close_up">("isometric");

  const [editingUnitPrices, setEditingUnitPrices] = useState<Record<number, number>>({});
  const [bulkPricePercent, setBulkPricePercent] = useState<number>(5);

  // Filters for Inventory
  const [unitStatusFilter, setUnitStatusFilter] = useState<string>("all");
  const [unitBlockFilter, setUnitBlockFilter] = useState<string>("all");
  const [unitTypeFilter, setUnitTypeFilter] = useState<string>("all");
  const [unitSearch, setUnitSearch] = useState<string>("");

  // Comparison state
  const [compareLeftId, setCompareLeftId] = useState<number>(0);
  const [compareRightId, setCompareRightId] = useState<number>(0);
  const [simulatorPriceGbp, setSimulatorPriceGbp] = useState<number>(215000);

  // Internal Team & Permissions State
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

  // =========================================================================
  // LAUNCH EVENTS & PR MEDIA GALLERY STATE (Image + Video Upload & Editing)
  // =========================================================================
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
        setActiveProjectDetail((prev: any) =>
          prev ? loadedProjects.find((p: any) => p.id === prev.id) || loadedProjects[0] : loadedProjects[0]
        );
        setNewUnitForm(prev => ({ ...prev, project_id: prev.project_id || loadedProjects[0].id }));
        setBatchForm(prev => ({ ...prev, project_id: prev.project_id || loadedProjects[0].id }));
      }
      if (loadedUnits.length > 0 && !droneTargetUnit) {
        setDroneTargetUnit(loadedUnits[0]);
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

  // All available folders for the active project (merges defaults + any custom folders already in project)
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

  // Check if the entered file name already exists in the current project's media_vault
  const existingDuplicateFile = useMemo(() => {
    if (!activeProjectDetail || !newMediaForm.name.trim()) return null;
    const target = newMediaForm.name.trim().toLowerCase();
    const list: any[] = activeProjectDetail.media_vault || [];
    return list.find((m: any) => String(m?.name || "").trim().toLowerCase() === target) || null;
  }, [activeProjectDetail, newMediaForm.name]);

  // Infer file type from filename or category
  const inferMediaType = (fileName: string, folderCategory: string) => {
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

  // Direct File Upload from Computer or Mobile (Follows LookPrice Zero-Supabase-Egress Policy)
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
        const inferredType = inferMediaType(file.name, resolvedFolder);

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

  // Upload Images or Videos for Launch Events (Computer / Mobile)
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
        toast.success(`${uploadedItems.length} etkinlik medyası (görsel/video) eklendi.`);
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
          setActiveProjectDetail(saved);
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

  // Add Media / Document to Project Vault
  const handleAddMediaToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectDetail || !newMediaForm.name.trim()) {
      toast.error("Lütfen bir dosya seçin veya dosya adını girin.");
      return;
    }

    const finalCategory =
      isCustomFolderMode && customFolderName.trim()
        ? customFolderName.trim()
        : newMediaForm.category || "Teknik & Mimari Planlar";

    const finalType = inferMediaType(newMediaForm.name, finalCategory);

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
        setNewMediaForm({
          name: "",
          type: "masterplan",
          category: finalCategory,
          url: ""
        });

        if (updatedProj.resolutionAction === "overwritten") {
          toast.success("Aynı isimli eski dosyanın üzerine yazılarak güncellendi.");
        } else if (updatedProj.resolutionAction === "versioned") {
          toast.success("Eski dosya korundu ve yeni versiyon olarak kaydedildi.");
        } else {
          toast.success(`Dosya "${finalCategory}" klasörüne eklendi.`);
        }
      }
    } catch {
      toast.error("Dosya eklenemedi.");
    }
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
  // UNIT & BLOCK REVISION + BATCH GENERATOR HANDLERS (AUTO GOOGLE DRIVE SYNC)
  // =========================================================================
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sid = storeId || user?.store_id || 1;
      const targetProjId = newUnitForm.project_id || projects[0]?.id;
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
      const targetProjId = batchForm.project_id || projects[0]?.id;
      const res = await fetch("/api/developer-projects/units/batch-generate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...batchForm, project_id: targetProjId, store_id: sid })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsBatchGeneratorOpen(false);
        toast.success(
          `${data.createdCount} adet bağımsız bölüm (kapı no, kat, manzara ve şerefiye fiyatlarıyla) üretildi ve Google Drive'da revize edildi.`
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

  // Full Unit & Block Revision Handler (Saves to DB & Syncs to Google Drive)
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
          `${updated.block_name} • Kapı No: ${updated.unit_number} revize edildi ve son hali Google Drive'a işlendi.`
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

  // Group Bulk Revision Handler
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

  const handleDeleteUnit = async (unitId: number) => {
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/units/${unitId}?store_id=${sid}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setUnits(prev => prev.filter(u => u.id !== unitId));
        if (revisingUnit?.id === unitId) setRevisingUnit(null);
        toast.success("Bağımsız bölüm silindi ve Google Drive revize edildi.");
      }
    } catch {
      toast.error("Bağımsız bölüm silinemedi.");
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
          `Kapı No ${updated.unit_number} fiyatı £${new Intl.NumberFormat("tr-TR").format(newPrice)} olarak güncellendi ve Google Drive'da revize edildi.`
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
          projectId: selectedProjectId,
          percentageChange: bulkPricePercent,
          onlyAvailable: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Toplu fiyat güncellemesi tamamlandı ve Google Drive'a işlendi.");
        await fetchOverview();
      } else {
        toast.error(data.error || "Toplu fiyat güncellenemedi.");
      }
    } catch {
      toast.error("Toplu fiyat güncelleme hatası.");
    }
  };

  // Trigger Drone Fly-To Animation on Unit Selection
  const triggerDroneFlyToUnit = (unit: any) => {
    setDroneFlying(true);
    setDroneTargetUnit(unit);
    setInventoryViewMode("drone_3d");
    setTimeout(() => {
      setDroneFlying(false);
    }, 650);
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

  // Save or Update Launch Event (with Image & Video Gallery)
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

  // Distinct blocks and unit types for current project selection
  const availableBlocks = useMemo(() => {
    const base = selectedProjectId === "all" ? units : units.filter(u => Number(u.project_id) === Number(selectedProjectId));
    return Array.from(new Set(base.map(u => String(u.block_name || "").trim()).filter(Boolean)));
  }, [units, selectedProjectId]);

  const availableUnitTypes = useMemo(() => {
    const base = selectedProjectId === "all" ? units : units.filter(u => Number(u.project_id) === Number(selectedProjectId));
    return Array.from(new Set(base.map(u => String(u.unit_type || "").trim()).filter(Boolean)));
  }, [units, selectedProjectId]);

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      if (selectedProjectId !== "all" && Number(u.project_id) !== Number(selectedProjectId)) return false;
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
          u.view_direction?.toLowerCase().includes(q) ||
          u.project_name?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [units, selectedProjectId, unitStatusFilter, unitBlockFilter, unitTypeFilter, unitSearch]);

  // Smart Aggregation: Group units by (Project + Unit Type) for Large-Scale Projects
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
          project_name: u.project_name || "Proje",
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
  }, [filteredUnits]);

  // Block & Floor Stacking Matrix for Architectural Elevation View
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
      const bKey = `${u.project_name || ""} — ${u.block_name || "A Blok"}`;
      if (!blocksMap.has(bKey)) {
        blocksMap.set(bKey, {
          blockTitle: u.block_name || "A Blok",
          projectName: u.project_name || "",
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
  }, [filteredUnits]);

  const filteredStaff = useMemo(() => {
    if (staffDeptFilter === "all") return internalStaff;
    return internalStaff.filter(s => s.department === staffDeptFilter);
  }, [internalStaff, staffDeptFilter]);

  // Unique folder tabs present in the selected project
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

  // Project totals for single-glance KPI bar
  const portfolioStats = useMemo(() => {
    const totalUnits = projects.reduce((acc, p) => acc + (Number(p.total_units) || 0), 0);
    const availableUnits = projects.reduce((acc, p) => acc + (Number(p.available_units) || 0), 0);
    const optionedUnits = projects.reduce((acc, p) => acc + (Number(p.optioned_units) || 0), 0);
    const soldUnits = projects.reduce((acc, p) => acc + (Number(p.sold_units) || 0), 0);
    const negotiationCount = units.filter(u => u.status === "negotiation").length;
    const totalFiles =
      projects.reduce((acc, p) => acc + (Array.isArray(p.media_vault) ? p.media_vault.length : 0), 0) +
      (Array.isArray(driveMeta?.rootMediaFiles) ? driveMeta.rootMediaFiles.length : 0);
    return { totalUnits, availableUnits, optionedUnits, soldUnits, negotiationCount, totalFiles };
  }, [projects, units, driveMeta]);

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

  // Printable Project Specification & Price Summary Sheet
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

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200 flex items-center justify-center gap-3 text-slate-700 font-bold text-sm">
        <FolderSync className="w-5 h-5 animate-spin text-indigo-600" />
        <span>Proje ve medya havuzu yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ===================================================================== */}
      {/* SINGLE-COMPANY INTEGRATED HEADER & AT-A-GLANCE KPI STRIP              */}
      {/* ===================================================================== */}
      <div className="bg-slate-900 text-white rounded-2xl p-3.5 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            {onBackToPortfolio && (
              <button
                type="button"
                onClick={onBackToPortfolio}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer shrink-0"
              >
                ← Geri
              </button>
            )}
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {companyDisplayName}
              </h2>
              <p className="text-[11px] text-slate-400">
                Proje Klasörleri, Bağımsız Bölüm & Kapı No Matrisi, 3D Blok & Drone Görünümü, Medya Havuzu ve Ekip Yönetimi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Proje Ekle</span>
            </button>
          </div>
        </div>

        {/* 4-Column Single-Glance Quantitative KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800">
          <div className="bg-slate-800/70 rounded-xl px-3 py-2 border border-slate-700/70">
            <div className="text-[10px] text-slate-400 font-semibold">Aktif Projeler</div>
            <div className="text-base font-black text-white font-mono tabular-nums mt-0.5">
              {projects.length} Proje Klasörü
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Esentepe, Tatlısu, Bahçeli & Edremit
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-xl px-3 py-2 border border-slate-700/70">
            <div className="text-[10px] text-slate-400 font-semibold">Bağımsız Bölüm Durumu</div>
            <div className="text-base font-black text-emerald-300 font-mono tabular-nums mt-0.5">
              {portfolioStats.availableUnits} Müsait{" "}
              <span className="text-xs text-slate-400 font-normal">/ {portfolioStats.totalUnits}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {portfolioStats.optionedUnits} Opsiyon & Sözleşme · {portfolioStats.soldUnits} Satıldı
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-xl px-3 py-2 border border-slate-700/70">
            <div className="text-[10px] text-slate-400 font-semibold">Medya & Teknik Dosyalar</div>
            <div className="text-base font-black text-amber-300 font-mono tabular-nums mt-0.5">
              {portfolioStats.totalFiles} Dosya
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Masterplan, Kat Planı, Fiyat, Render & Video
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-xl px-3 py-2 border border-slate-700/70">
            <div className="text-[10px] text-slate-400 font-semibold">Şirket Ekibi & Yetkiler</div>
            <div className="text-base font-black text-indigo-300 font-mono tabular-nums mt-0.5">
              {internalStaff.length} Yetkili Kullanıcı
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Yönetim · Teknik · Satış · PR
            </div>
          </div>
        </div>

        {/* COLLAPSIBLE CREATE / EDIT PROJECT FORM */}
        {isProjectFormOpen && (
          <form
            onSubmit={handleSaveProject}
            className="mt-3 pt-3 border-t border-slate-800 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300">
                {editingProjectId ? `Projeyi Düzenle: ${projectForm.name}` : "Yeni Proje Tanımla"}
              </span>
              <button
                type="button"
                onClick={() => setIsProjectFormOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Kapat ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Proje Adı *</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="Örn: Santorini Villas"
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Klasör Kodu</label>
                <input
                  type="text"
                  value={projectForm.folder_prefix}
                  onChange={e => setProjectForm({ ...projectForm, folder_prefix: e.target.value })}
                  placeholder="Örn: 11. Santorini Homes"
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Bölge</label>
                <input
                  type="text"
                  value={projectForm.sub_region}
                  onChange={e => setProjectForm({ ...projectForm, sub_region: e.target.value })}
                  placeholder="Esentepe / Tatlısu"
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">
                  Başlangıç Fiyatı (GBP £)
                </label>
                <input
                  type="number"
                  value={projectForm.starting_price}
                  onChange={e =>
                    setProjectForm({ ...projectForm, starting_price: Number(e.target.value) || 0 })
                  }
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-amber-300 font-black"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">
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
                    className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
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
                    className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    title="Faizsiz Vade (Ay)"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">
                  Teslim & İnşaat %
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={projectForm.completion_date}
                    onChange={e => setProjectForm({ ...projectForm, completion_date: e.target.value })}
                    className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
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
                    className="w-14 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-300 font-bold"
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
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              />
              <input
                type="text"
                value={projectForm.payment_notes}
                onChange={e => setProjectForm({ ...projectForm, payment_notes: e.target.value })}
                placeholder="Ödeme Planı Açıklaması"
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={projectForm.cover_image}
                  onChange={e => setProjectForm({ ...projectForm, cover_image: e.target.value })}
                  placeholder="Kapak Görseli URL"
                  className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-black flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Kaydet</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 5-TAB INTERNAL WORKSPACE NAVIGATION */}
        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: "showcase", label: `Projeler & Dosyalar (${projects.length})`, icon: FolderOpen },
            { id: "inventory", label: `Üniteler, Kapı No & 3D (${units.length})`, icon: Layers },
            { id: "compare", label: "Proje Karşılaştırma", icon: ArrowLeftRight },
            { id: "events", label: `Etkinlik & Lansmanlar (${events.length})`, icon: Calendar },
            { id: "agencies", label: `Ekip & Yetkiler (${internalStaff.length})`, icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SuiteTab)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-amber-400 text-slate-950 shadow-xs"
                    : "bg-slate-800/90 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: PROJELER & DOSYA / MEDYA HAVUZU                                */}
      {/* ===================================================================== */}
      {activeTab === "showcase" && (
        <div className="space-y-3">
          {/* 10 Project Folders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {projects.map(proj => {
              const isSelected = activeProjectDetail?.id === proj.id;
              const soldPct = Math.round(
                ((proj.sold_units || 0) / Math.max(1, proj.total_units || 1)) * 100
              );
              const fileCount = Array.isArray(proj.media_vault) ? proj.media_vault.length : 0;
              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProjectDetail(proj);
                    setMediaCategoryFilter("all");
                  }}
                  className={`rounded-xl border transition-all overflow-hidden flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "border-indigo-600 ring-2 ring-indigo-600/20 bg-slate-900 text-white shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-900"
                  }`}
                >
                  <div>
                    <div className="relative h-28 w-full overflow-hidden bg-slate-800">
                      <img
                        src={proj.cover_image}
                        alt={proj.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950/85 text-amber-300 font-mono text-[9px] font-black border border-amber-400/30 truncate">
                          {proj.folder_prefix || proj.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500 text-slate-950 shrink-0">
                          %{proj.construction_progress} İnşaat
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                        <div>
                          <h3 className="text-xs font-black text-white leading-tight">{proj.name}</h3>
                          <p className="text-[10px] text-slate-300 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 text-amber-400" />
                            <span>{proj.sub_region}</span>
                          </p>
                        </div>
                        <span className="text-xs font-black text-amber-300">
                          {formatGbp(proj.starting_price)}+
                        </span>
                      </div>
                    </div>

                    <div className="p-2 space-y-1.5">
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className={isSelected ? "text-emerald-300" : "text-emerald-700"}>
                            {proj.available_units} Müsait
                          </span>
                          <span className={isSelected ? "text-amber-300" : "text-amber-700"}>
                            {proj.optioned_units} Opsiyon
                          </span>
                          <span className={isSelected ? "text-slate-300" : "text-slate-500"}>
                            %{soldPct} Satıldı
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{
                              width: `${Math.round(
                                ((proj.available_units || 0) / Math.max(1, proj.total_units || 1)) * 100
                              )}%`
                            }}
                          />
                          <div
                            className="bg-amber-500 h-full"
                            style={{
                              width: `${Math.round(
                                ((proj.optioned_units || 0) / Math.max(1, proj.total_units || 1)) * 100
                              )}%`
                            }}
                          />
                          <div className="bg-indigo-600 h-full flex-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`px-2 py-1.5 border-t flex items-center justify-between text-[10px] font-bold ${
                      isSelected
                        ? "border-slate-800 bg-slate-950/60 text-amber-300"
                        : "border-slate-100 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" />
                      <span>{fileCount} Dosya</span>
                    </span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        openEditProject(proj);
                      }}
                      className="underline hover:opacity-80 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Düzenle</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SELECTED PROJECT WORKSPACE: FILES, MEDIA, SPECS & PAYMENT PLAN */}
          {activeProjectDetail && (
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
              {/* OPTIMIZED SINGLE-ROW PROJECT HEADER & COMPACT ACTION TOOLBAR */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-slate-900 text-amber-300 rounded text-[10px] font-mono font-black shrink-0">
                      {activeProjectDetail.folder_prefix || activeProjectDetail.project_code}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-950 truncate">
                      {activeProjectDetail.name}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      · {activeProjectDetail.sub_region} · Teslim: {activeProjectDetail.completion_date} · İnşaat: %{activeProjectDetail.construction_progress}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                    {activeProjectDetail.concept_tagline}
                  </p>
                </div>

                {/* Single-row non-wrapping compact action buttons */}
                <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddMediaOpen(prev => !prev)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Dosya Yükle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(activeProjectDetail.id);
                      setActiveTab("inventory");
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Üniteler ({activeProjectDetail.available_units} Müsait)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(activeProjectDetail.id);
                      const projUnit = units.find(u => Number(u.project_id) === Number(activeProjectDetail.id));
                      if (projUnit) setDroneTargetUnit(projUnit);
                      setInventoryViewMode("drone_3d");
                      setActiveTab("inventory");
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Compass className="w-3 h-3" />
                    <span>3D & Drone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditProject(activeProjectDetail)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Edit3 className="w-3 h-3 text-indigo-600" />
                    <span>Düzenle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintProjectSheet(activeProjectDetail)}
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Yazdır</span>
                  </button>
                </div>
              </div>

              {/* UPGRADED FILE / MEDIA UPLOAD WORKSPACE (Device Upload + Custom Folder + Duplicate Resolution) */}
              {isAddMediaOpen && (
                <form
                  onSubmit={handleAddMediaToProject}
                  className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{activeProjectDetail.name} — Yeni Dosya / Medya Yükle</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddMediaOpen(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer self-end sm:self-auto"
                    >
                      Kapat ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                    <div className="md:col-span-3">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                        Bilgisayar / Mobilden Dosya Seç
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
                        className="w-full px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-400/30"
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

                    <div className="md:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">
                          Klasör / Kategori
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomFolderMode(prev => !prev)}
                          className="text-[10px] text-amber-300 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <FolderPlus className="w-3 h-3" />
                          <span>{isCustomFolderMode ? "Listeden Seç" : "+ Yeni Klasör Tanımla"}</span>
                        </button>
                      </div>

                      {isCustomFolderMode ? (
                        <input
                          type="text"
                          required
                          placeholder="Yeni klasör adı yazın (Örn: Sözleşme Şablonları)"
                          value={customFolderName}
                          onChange={e => setCustomFolderName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-amber-400/60 rounded-lg text-amber-200 text-xs font-bold"
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
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-amber-300 text-xs font-bold"
                        >
                          {availableProjectFolders.map(folder => (
                            <option key={folder} value={folder}>
                              {folder}
                            </option>
                          ))}
                          <option value="__NEW_FOLDER__">+ Yeni Klasör Oluştur (Serbest Giriş)...</option>
                        </select>
                      )}
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                        Dosya Adı *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Kat Planları 2026.pdf"
                        value={newMediaForm.name}
                        onChange={e => setNewMediaForm({ ...newMediaForm, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div className="md:col-span-3 flex items-end gap-1.5">
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                          Dosya Yolu / Harici Link (Opsiyonel)
                        </label>
                        <input
                          type="text"
                          placeholder="Cihazdan seçildi veya link girin"
                          value={newMediaForm.url}
                          onChange={e => setNewMediaForm({ ...newMediaForm, url: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={uploadingLocalFile}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>

                  {existingDuplicateFile && (
                    <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          <strong>"{existingDuplicateFile.name}"</strong> isimli bir dosya bu projede zaten mevcut ({existingDuplicateFile.category}). Nasıl kaydedilsin?
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDuplicateConflictMode("overwrite")}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            duplicateConflictMode === "overwrite"
                              ? "bg-amber-400 text-slate-950"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          Eski Dosyanın Üzerine Yaz (Güncelle)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuplicateConflictMode("new_version")}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            duplicateConflictMode === "new_version"
                              ? "bg-indigo-500 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          Yeni Dosya Olarak Kaydet (Versiyonla)
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Left 7 Cols: Project Folder Explorer */}
                <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-indigo-600" />
                      <span>{activeProjectDetail.name} — Proje Klasörleri & Dosyalar</span>
                    </h4>
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setMediaCategoryFilter("all")}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          mediaCategoryFilter === "all"
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Tümü ({(activeProjectDetail.media_vault || []).length})
                      </button>
                      {projectFolderTabs.map(folderName => (
                        <button
                          key={folderName}
                          type="button"
                          onClick={() => setMediaCategoryFilter(folderName)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            mediaCategoryFilter === folderName
                              ? "bg-slate-900 text-white"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {folderName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredProjectMedia.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:border-indigo-400 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-2 bg-slate-100 rounded-lg text-indigo-600 shrink-0">
                            {doc.type === "video" ? (
                              <Play className="w-4 h-4" />
                            ) : doc.type === "photos" ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate" title={doc.name}>
                              {doc.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium truncate">
                              {doc.category}
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
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Önizle</span>
                          </button>
                          <a
                            href={doc.url || activeProjectDetail.cover_image}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg transition-colors"
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
                    ))}
                  </div>

                  {/* Shared Company-Wide Media & Master Map */}
                  {driveMeta?.rootMediaFiles && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800">
                          Ortak Kurumsal Medya, Harita & Tanıtım Filmleri ({driveMeta.rootMediaFiles.length})
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Tüm Departmanlara Açık
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {driveMeta.rootMediaFiles.map((rf: any, i: number) => {
                          const label = typeof rf === "string" ? rf : rf?.name || "Medya";
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() =>
                                setPreviewAsset({
                                  name: label,
                                  category: "Ortak Kurumsal Medya",
                                  type: rf?.type || "video",
                                  url: rf?.url || activeProjectDetail.cover_image,
                                  cover:
                                    label.includes("MAP") && driveMeta.masterMapImage
                                      ? driveMeta.masterMapImage
                                      : label.includes("OFFICE") && driveMeta.salesOfficeImage
                                      ? driveMeta.salesOfficeImage
                                      : activeProjectDetail.cover_image,
                                  projectName: companyDisplayName
                                })
                              }
                              className="px-2.5 py-1 bg-white hover:bg-slate-900 text-slate-800 hover:text-white border border-slate-200 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-indigo-600" />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right 5 Cols: Technical Specs, Payment Plan & Social Facilities Summary */}
                <div className="lg:col-span-5 space-y-2.5">
                  <div className="bg-indigo-950 text-white border border-indigo-900 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-amber-300 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Satış & Ödeme Planı Özeti</span>
                      </h4>
                      <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold text-white">
                        Başlangıç: {formatGbp(activeProjectDetail.starting_price)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="bg-white/10 rounded-lg p-2">
                        <div className="text-[10px] text-indigo-200 font-semibold">Peşinat</div>
                        <div className="text-sm font-black text-white">
                          %{activeProjectDetail.payment_plan?.down_payment_percent || 35}
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <div className="text-[10px] text-indigo-200 font-semibold">Faizsiz Vade</div>
                        <div className="text-sm font-black text-amber-300">
                          {activeProjectDetail.payment_plan?.installment_months || 36} Ay
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <div className="text-[10px] text-indigo-200 font-semibold">Kira Getirisi</div>
                        <div className="text-sm font-black text-emerald-300">
                          %{activeProjectDetail.investment_metrics?.annual_rental_yield_percent || 9.8}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-indigo-100 leading-relaxed pt-1">
                      {activeProjectDetail.payment_plan?.notes}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                    <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Teknik & Mimari Özellikler</span>
                    </h4>
                    <ul className="space-y-1">
                      {(activeProjectDetail.architectural_specs || []).map((spec: string, idx: number) => (
                        <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ÜNİTELER, BAĞIMSIZ BÖLÜM KAPI NO MATRİSİ & 3D DRONE SİMÜLASYONU */}
      {/* ===================================================================== */}
      {activeTab === "inventory" && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3">
          {/* TOP TOOLBAR: VIEW MODES + FILTERS + BATCH SERIES GENERATOR */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
            {/* 4 Architectural View Modes */}
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: "grouped_types", label: "Tip & Grup Özeti", icon: ListFilter },
                { id: "block_matrix", label: "Blok & Kat Matrisi (Kapı No)", icon: Grid },
                { id: "drone_3d", label: "3D Mimari & Drone Uçuşu", icon: Compass },
                { id: "table_list", label: `Detaylı Liste & Revizyon (${filteredUnits.length})`, icon: Layers }
              ].map(vm => {
                const VIcon = vm.icon;
                const active = inventoryViewMode === vm.id;
                return (
                  <button
                    key={vm.id}
                    type="button"
                    onClick={() => setInventoryViewMode(vm.id as InventoryViewMode)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      active
                        ? "bg-slate-900 text-amber-300 shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <VIcon className="w-3.5 h-3.5" />
                    <span>{vm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filters & Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-lg px-2 py-0.5">
                <Percent className="w-3 h-3 text-amber-700" />
                <span className="text-[10px] font-black text-amber-900">Toplu %:</span>
                <input
                  type="number"
                  value={bulkPricePercent}
                  onChange={e => setBulkPricePercent(Number(e.target.value))}
                  className="w-12 px-1 py-0.5 bg-white border border-amber-300 rounded text-[11px] font-black text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleBulkPriceUpdate}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded text-[10px] font-black cursor-pointer"
                >
                  Uygula
                </button>
              </div>

              <select
                value={selectedProjectId}
                onChange={e => {
                  setSelectedProjectId(e.target.value === "all" ? "all" : Number(e.target.value));
                  setUnitBlockFilter("all");
                  setUnitTypeFilter("all");
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
              >
                <option value="all">Tüm Projeler ({units.length})</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={unitBlockFilter}
                onChange={e => setUnitBlockFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
              >
                <option value="all">Tüm Bloklar</option>
                {availableBlocks.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={unitStatusFilter}
                onChange={e => setUnitStatusFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
              >
                <option value="all">Tüm Statüler</option>
                <option value="available">Müsait</option>
                <option value="negotiation">Sonuçlanmakta (Sözleşme)</option>
                <option value="optioned">Opsiyonlu</option>
                <option value="sold">Satıldı</option>
              </select>

              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  value={unitSearch}
                  onChange={e => setUnitSearch(e.target.value)}
                  placeholder="Kapı no, blok, tip, manzara..."
                  className="pl-6 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-medium text-slate-900 outline-none w-40"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsBatchGeneratorOpen(prev => !prev);
                  setIsAddUnitOpen(false);
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Building2 className="w-3 h-3" />
                <span>+ Toplu Blok / Kapı No Serisi Üret</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddUnitOpen(prev => !prev);
                  setIsBatchGeneratorOpen(false);
                }}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                <span>Tekil Ünite</span>
              </button>
            </div>
          </div>

          {/* SMART BATCH BLOCK / FLOOR / DOOR-NUMBER SERIES GENERATOR (For Large Projects) */}
          {isBatchGeneratorOpen && (
            <form
              onSubmit={handleBatchGenerateUnits}
              className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-xs font-black text-amber-300">
                    Büyük Projeler İçin Otomatik Blok, Kat & Kapı No Serisi Üretici
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Yüzlerce daireyi tek tek girmek yerine; blok, kat aralığı, kat başına kapı adedi ve kat/köşe şerefiye kurallarını girerek tüm bağımsız bölümleri tek tıkla oluşturun.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchGeneratorOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Kapat ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">Proje</label>
                  <select
                    value={batchForm.project_id}
                    onChange={e => setBatchForm({ ...batchForm, project_id: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-amber-300 font-bold"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">Blok Adı</label>
                  <input
                    type="text"
                    value={batchForm.block_name}
                    onChange={e => setBatchForm({ ...batchForm, block_name: e.target.value })}
                    placeholder="Örn: C Blok (Lagün)"
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Kapı No Öneki (C-101)
                  </label>
                  <input
                    type="text"
                    value={batchForm.door_prefix}
                    onChange={e => setBatchForm({ ...batchForm, door_prefix: e.target.value })}
                    placeholder="C"
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">Ünite Tipi</label>
                  <input
                    type="text"
                    value={batchForm.unit_type}
                    onChange={e => setBatchForm({ ...batchForm, unit_type: e.target.value })}
                    placeholder="1+1 Loft Penthouse"
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Kat Aralığı (Başlangıç - Bitiş)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={batchForm.start_floor}
                      onChange={e => setBatchForm({ ...batchForm, start_floor: Number(e.target.value) })}
                      className="w-14 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      title="Başlangıç Katı (0 = Zemin)"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={batchForm.end_floor}
                      onChange={e => setBatchForm({ ...batchForm, end_floor: Number(e.target.value) })}
                      className="w-14 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      title="Bitiş Katı"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Kattaki Daire Adedi
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={batchForm.units_per_floor}
                    onChange={e => setBatchForm({ ...batchForm, units_per_floor: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-amber-300 font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 items-end">
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Brüt / Net / Teras m²
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={batchForm.gross_sqm}
                      onChange={e => setBatchForm({ ...batchForm, gross_sqm: Number(e.target.value) })}
                      className="w-14 px-1.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      title="Brüt m²"
                    />
                    <input
                      type="number"
                      value={batchForm.net_sqm}
                      onChange={e => setBatchForm({ ...batchForm, net_sqm: Number(e.target.value) })}
                      className="w-14 px-1.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      title="Net m²"
                    />
                    <input
                      type="number"
                      value={batchForm.terrace_sqm}
                      onChange={e => setBatchForm({ ...batchForm, terrace_sqm: Number(e.target.value) })}
                      className="w-12 px-1.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      title="Teras m²"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Baz Fiyat (GBP £)
                  </label>
                  <input
                    type="number"
                    value={batchForm.base_price}
                    onChange={e => setBatchForm({ ...batchForm, base_price: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-amber-300 font-black"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Kat Şerefiye Artışı (+£/Kat)
                  </label>
                  <input
                    type="number"
                    value={batchForm.floor_price_increment}
                    onChange={e =>
                      setBatchForm({ ...batchForm, floor_price_increment: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Köşe Cephe Farkı (+£)
                  </label>
                  <input
                    type="number"
                    value={batchForm.corner_price_bonus}
                    onChange={e =>
                      setBatchForm({ ...batchForm, corner_price_bonus: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Manzara & Konum Değişkeni
                  </label>
                  <input
                    type="text"
                    value={batchForm.view_direction}
                    onChange={e => setBatchForm({ ...batchForm, view_direction: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={generatingBatch}
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black cursor-pointer flex items-center justify-center gap-1"
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

          {/* SINGLE UNIT ADD DRAWER */}
          {isAddUnitOpen && (
            <form
              onSubmit={handleAddUnit}
              className="p-2.5 bg-slate-900 text-white rounded-xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 items-end"
            >
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Proje</label>
                <select
                  value={newUnitForm.project_id}
                  onChange={e => setNewUnitForm({ ...newUnitForm, project_id: Number(e.target.value) })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-amber-300 font-bold"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Blok</label>
                <input
                  type="text"
                  value={newUnitForm.block_name}
                  onChange={e => setNewUnitForm({ ...newUnitForm, block_name: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Kapı No</label>
                <input
                  type="text"
                  value={newUnitForm.unit_number}
                  onChange={e => setNewUnitForm({ ...newUnitForm, unit_number: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Ünite Tipi</label>
                <input
                  type="text"
                  value={newUnitForm.unit_type}
                  onChange={e => setNewUnitForm({ ...newUnitForm, unit_type: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Kat & Konum</label>
                <input
                  type="text"
                  value={newUnitForm.floor_level}
                  onChange={e => setNewUnitForm({ ...newUnitForm, floor_level: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Manzara / Cephe</label>
                <input
                  type="text"
                  value={newUnitForm.view_direction}
                  onChange={e => setNewUnitForm({ ...newUnitForm, view_direction: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Brüt / Net m²</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={newUnitForm.gross_sqm}
                    onChange={e => setNewUnitForm({ ...newUnitForm, gross_sqm: Number(e.target.value) })}
                    className="w-14 px-1.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <input
                    type="number"
                    value={newUnitForm.net_sqm}
                    onChange={e => setNewUnitForm({ ...newUnitForm, net_sqm: Number(e.target.value) })}
                    className="w-14 px-1.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Fiyat (GBP £)</label>
                <input
                  type="number"
                  value={newUnitForm.price}
                  onChange={e => setNewUnitForm({ ...newUnitForm, price: Number(e.target.value) })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-amber-300 font-black"
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="submit"
                  className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-black cursor-pointer"
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddUnitOpen(false)}
                  className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </form>
          )}

          {/* UNIT REVISION DRAWER (Edit Block, Door No, Type, Floor, View, SQM, Price, Status + Auto GD Sync) */}
          {revisingUnit && (
            <form
              onSubmit={handleSaveUnitRevision}
              className="p-3 bg-indigo-950 text-white rounded-xl border border-indigo-700 space-y-2.5 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono text-xs font-black">
                    Kapı No: {revisingUnit.unit_number}
                  </span>
                  <span className="text-xs font-black text-white">
                    Bağımsız Bölüm & Blok Revizyonu ({revisingUnit.project_name})
                  </span>
                  <span className="text-[10px] text-emerald-300 font-semibold">
                    · Kaydedildiğinde Google Drive üzerinde otomatik revize edilir
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerDroneFlyToUnit(revisingUnit)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-amber-400/30"
                  >
                    <Compass className="w-3 h-3" />
                    <span>3D Drone ile Binada Göster</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevisingUnit(null)}
                    className="text-indigo-200 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Kapat ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                <div>
                  <label className="block text-[9px] text-indigo-200 uppercase font-bold">Blok Adı</label>
                  <input
                    type="text"
                    required
                    value={revisingUnit.block_name || ""}
                    onChange={e => setRevisingUnit({ ...revisingUnit, block_name: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-900 border border-indigo-700 rounded text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-indigo-200 uppercase font-bold">
                    Bağımsız Kapı No
                  </label>
                  <input
                    type="text"
                    required
                    value={revisingUnit.unit_number || ""}
                    onChange={e => setRevisingUnit({ ...revisingUnit, unit_number: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-900 border border-indigo-700 rounded text-xs text-amber-300 font-mono font-black"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-indigo-200 uppercase font-bold">Ünite Tipi</label>
                  <input
                    type="text"
                    required
                    value={revisingUnit.unit_type || ""}
                    onChange={e => setRevisingUnit({ ...revisingUnit, unit_type: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-900 border border-indigo-700 rounded text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-indigo-200 uppercase font-bold">Kat / Kot</label>
                  <input
                    type="text"
                    value={revisingUnit.floor_level || ""}
                    onChange={e => setRevisingUnit({ ...revisingUnit, floor_level: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-900 border border-indigo-700 rounded text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-indigo-200 uppercase font-bold">
                    Manzara & Cephe Değişkeni
                  </label>
                  <input
                    type="text"
                    value={revisingUnit.view_direction || ""}
                    onChange={e => setRevisingUnit({ ...revisingUnit, view_direction: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-900 border border-indigo-700 rounded text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-indigo-200 uppercase font-bold">
                    Konum / Aks (Köşe/Orta)
                  </label>
                  <input
                    type="text"
                    value={revisingUnit.position_tag || "Panoramik Aks"}
                    onChange={e => setRevisingUnit({ ...revisingUnit, position_tag: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-900 border border-indigo-700 rounded text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-indigo-200 uppercase font-bold">
                    Brüt / Net / Teras m²
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={revisingUnit.gross_sqm || 0}
                      onChange={e =>
                        setRevisingUnit({ ...revisingUnit, gross_sqm: Number(e.target.value) })
                      }
                      className="w-12 px-1 py-1 bg-slate-900 border border-indigo-700 rounded text-xs text-white"
                      title="Brüt m²"
                    />
                    <input
                      type="number"
                      value={revisingUnit.net_sqm || 0}
                      onChange={e =>
                        setRevisingUnit({ ...revisingUnit, net_sqm: Number(e.target.value) })
                      }
                      className="w-12 px-1 py-1 bg-slate-900 border border-indigo-700 rounded text-xs text-white"
                      title="Net m²"
                    />
                    <input
                      type="number"
                      value={revisingUnit.terrace_sqm || 0}
                      onChange={e =>
                        setRevisingUnit({ ...revisingUnit, terrace_sqm: Number(e.target.value) })
                      }
                      className="w-10 px-1 py-1 bg-slate-900 border border-indigo-700 rounded text-xs text-white"
                      title="Teras m²"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-indigo-200 uppercase font-bold">
                    Liste Fiyatı (GBP £)
                  </label>
                  <input
                    type="number"
                    value={revisingUnit.price || 0}
                    onChange={e => setRevisingUnit({ ...revisingUnit, price: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-slate-900 border border-indigo-700 rounded text-xs text-amber-300 font-mono font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end pt-1">
                <div>
                  <label className="block text-[9px] text-indigo-200 uppercase font-bold">
                    Bağımsız Bölüm Satış Statüsü
                  </label>
                  <select
                    value={revisingUnit.status || "available"}
                    onChange={e => setRevisingUnit({ ...revisingUnit, status: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-900 border border-indigo-700 rounded text-xs font-bold text-emerald-300"
                  >
                    <option value="available">MÜSAİT (Satışa Açık)</option>
                    <option value="negotiation">SONUÇLANMAKTA (Sözleşme / Kaparo Aşamasında)</option>
                    <option value="optioned">OPSİYONLU (Rezerve)</option>
                    <option value="sold">SATILDI (Sözleşmesi Tamamlandı)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-indigo-200 uppercase font-bold">
                    Alıcı / Sözleşme Aşama Notu (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Avukat sözleşme onayı bekleniyor / Müşteri Adı"
                    value={revisingUnit.optioned_client_name || ""}
                    onChange={e =>
                      setRevisingUnit({ ...revisingUnit, optioned_client_name: e.target.value })
                    }
                    className="w-full px-2 py-1 bg-slate-900 border border-indigo-700 rounded text-xs text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteUnit(revisingUnit.id)}
                    className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sil</span>
                  </button>
                  <button
                    type="submit"
                    disabled={savingUnitRevision}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {savingUnitRevision
                        ? "Kaydediliyor..."
                        : "Revizyonu Kaydet & Google Drive'a İşle"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* GROUP BULK REVISION DRAWER */}
          {revisingGroup && (
            <form
              onSubmit={handleSaveGroupBulkRevision}
              className="p-3 bg-slate-900 text-white rounded-xl border border-amber-400/50 space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black text-amber-300">
                  Toplu Grup Revizyonu: {revisingGroup.title} ({revisingGroup.unitIds.length} Bağımsız Bölüm)
                </span>
                <button
                  type="button"
                  onClick={() => setRevisingGroup(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Kapat ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Blok Adını Değiştir
                  </label>
                  <input
                    type="text"
                    placeholder="Değiştirmek için yazın"
                    value={revisingGroup.block_name}
                    onChange={e => setRevisingGroup({ ...revisingGroup, block_name: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Ünite Tipini Değiştir
                  </label>
                  <input
                    type="text"
                    value={revisingGroup.unit_type}
                    onChange={e => setRevisingGroup({ ...revisingGroup, unit_type: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Manzara / Cephe Değiştir
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Tam Deniz & Havuz"
                    value={revisingGroup.view_direction}
                    onChange={e =>
                      setRevisingGroup({ ...revisingGroup, view_direction: e.target.value })
                    }
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Sabit Fiyat Ata (GBP £)
                  </label>
                  <input
                    type="number"
                    placeholder="Boş bırakılırsa değişmez"
                    value={revisingGroup.price}
                    onChange={e => setRevisingGroup({ ...revisingGroup, price: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-amber-300 font-black"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold">
                    Toplu Statü Ata
                  </label>
                  <select
                    value={revisingGroup.status}
                    onChange={e => setRevisingGroup({ ...revisingGroup, status: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
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
                  className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black cursor-pointer"
                >
                  Grubu Revize Et & Drive'a İşle
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* VIEW MODE 1: TİP & GRUP ÖZETİ (BÜYÜK PROJELER İÇİN KAPI NO MATRİSİ) */}
          {/* ================================================================= */}
          {inventoryViewMode === "grouped_types" && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">
                  Aynı tipteki bağımsız bölümler gruplanmıştır. Herhangi bir{" "}
                  <strong className="text-slate-950">Kapı Numarasına</strong> tıklayarak o dairenin blok, kat, manzara, fiyat veya satış statüsünü revize edebilir ya da 3D Drone ile binadaki yerini görebilirsiniz.
                </span>
                <div className="flex items-center gap-2 text-[10px] font-black">
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950">MÜSAİT</span>
                  <span className="px-2 py-0.5 rounded bg-sky-400 text-slate-950">SONUÇLANMAKTA</span>
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950">OPSİYONLU</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-white">SATILDI</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unitTypeGroups.map(grp => (
                  <div
                    key={grp.key}
                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-col justify-between space-y-2.5 hover:border-indigo-300 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 text-[10px] font-black">
                              {grp.project_name}
                            </span>
                            <h4 className="text-sm font-black text-slate-950">{grp.unit_type}</h4>
                            <span className="text-[11px] font-bold text-slate-500">
                              ({grp.total} Bağımsız Bölüm)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                            Alan: <strong>{grp.grossSqm} m² Brüt</strong> / {grp.netSqm} m² Net (+{grp.terraceSqm} m² Teras)
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Fiyat Aralığı</div>
                          <div className="text-xs font-black text-slate-900 font-mono">
                            {grp.minPrice === grp.maxPrice
                              ? formatGbp(grp.minPrice)
                              : `${formatGbp(grp.minPrice)} – ${formatGbp(grp.maxPrice)}`}
                          </div>
                        </div>
                      </div>

                      {/* 4-Status Quantitative Breakdown Bar */}
                      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-black">
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg py-1">
                          {grp.available} Müsait
                        </div>
                        <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-lg py-1">
                          {grp.negotiation} Sonuçlanmakta
                        </div>
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg py-1">
                          {grp.optioned} Opsiyonlu
                        </div>
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg py-1">
                          {grp.sold} Satıldı
                        </div>
                      </div>

                      {/* Variables of this unit type (Blocks, Floors, Views) */}
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 text-[11px] space-y-1">
                        <div className="flex flex-wrap gap-1">
                          <span className="font-bold text-slate-700">Bloklar:</span>
                          <span className="text-slate-900 font-semibold">
                            {Array.from(grp.blocks).join(", ")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="font-bold text-slate-700">Kat Değişkenleri:</span>
                          <span className="text-slate-800">{Array.from(grp.floors).join(" · ")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="font-bold text-slate-700">Manzara & Cephe:</span>
                          <span className="text-indigo-900 font-medium">
                            {Array.from(grp.views).join(" | ")}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Independent Door Number Chips */}
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Bağımsız Bölüm Kapı Numaraları (Revize Etmek İçin Tıklayın)
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {grp.units.map(u => {
                            const meta = getStatusBadgeMeta(u.status);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => setRevisingUnit({ ...u })}
                                title={`${u.block_name} | Kapı: ${u.unit_number} | Kat: ${u.floor_level} | Manzara: ${u.view_direction} | Fiyat: ${formatGbp(u.price)} (${meta.label})`}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border cursor-pointer transition-transform hover:scale-105 flex items-center gap-1 ${meta.chipBg}`}
                              >
                                <span>{u.unit_number}</span>
                                <span className="opacity-75 text-[9px] font-sans">
                                  ({u.floor_level?.split(" ")[0]})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
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
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Bu Grubu Toplu Revize Et</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (grp.units[0]) triggerDroneFlyToUnit(grp.units[0]);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-800 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Compass className="w-3 h-3" />
                        <span>3D Drone ile İncele</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW MODE 2: BLOK & KAT MATRİSİ (GÖRSEL KAPI NO ŞEMASI)           */}
          {/* ================================================================= */}
          {inventoryViewMode === "block_matrix" && (
            <div className="space-y-3">
              {blockStackingMatrix.map((blk, bIdx) => (
                <div
                  key={bIdx}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 text-[10px] font-black">
                        {blk.projectName}
                      </span>
                      <h4 className="text-sm font-black text-slate-950">{blk.blockTitle}</h4>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Kat Planı & Bağımsız Bölüm Kapı No Şeması
                    </span>
                  </div>

                  <div className="space-y-2">
                    {blk.floors.map((fl, fIdx) => (
                      <div
                        key={fIdx}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-slate-200"
                      >
                        <div className="lg:col-span-2 px-2 py-1.5 bg-slate-900 text-white rounded-lg text-center">
                          <div className="text-[10px] text-amber-300 font-bold uppercase">Kat / Kot</div>
                          <div className="text-xs font-black">{fl.floorName}</div>
                        </div>

                        <div className="lg:col-span-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                          {fl.units.map((u: any) => {
                            const meta = getStatusBadgeMeta(u.status);
                            return (
                              <div
                                key={u.id}
                                className="rounded-lg border border-slate-200 p-2 flex flex-col justify-between gap-1.5 hover:border-indigo-500 transition-all bg-slate-50/50"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono text-xs font-black text-slate-950 bg-white px-1.5 py-0.5 rounded border border-slate-200">
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
                                  <div className="text-[10px] text-slate-500 font-mono">
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
                                      className="px-1.5 py-0.5 bg-slate-900 hover:bg-indigo-600 text-white rounded text-[9px] font-bold cursor-pointer"
                                    >
                                      Revize Et
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => triggerDroneFlyToUnit(u)}
                                      className="p-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded cursor-pointer"
                                      title="3D Drone ile Bu Bağımsız Bölüme Uç"
                                    >
                                      <Compass className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW MODE 3: 3D MİMARİ BLOK MODELLEMESİ & DRONE GEÇİŞ SİMÜLASYONU */}
          {/* ================================================================= */}
          {inventoryViewMode === "drone_3d" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Left 4 Cols: Unit / Door Selector & Live Drone Telemetry Control */}
              <div className="lg:col-span-4 bg-slate-900 text-white rounded-xl p-3 border border-slate-800 flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-amber-400 animate-pulse" />
                      <h4 className="text-xs font-black uppercase text-white">
                        3D Blok & Drone Kamera Kontrolü
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDroneNightMode(prev => !prev)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {droneNightMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                      <span>{droneNightMode ? "Gündüz Modu" : "Gece / Lagün Işıklandırma"}</span>
                    </button>
                  </div>

                  {/* Camera Angle Presets */}
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: "isometric", label: "3D İzometrik" },
                      { id: "sea_front", label: "Deniz Cephesi" },
                      { id: "close_up", label: "Daireye Yaklaş" },
                      { id: "top_down", label: "Masterplan Kuşbakışı" }
                    ].map(cam => (
                      <button
                        key={cam.id}
                        type="button"
                        onClick={() => {
                          setDroneFlying(true);
                          setDroneCameraAngle(cam.id as any);
                          setTimeout(() => setDroneFlying(false), 550);
                        }}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          droneCameraAngle === cam.id
                            ? "bg-amber-400 text-slate-950"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {cam.label}
                      </button>
                    ))}
                  </div>

                  {/* Door Number Quick Jump Grid */}
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                      Drone İle Odaklanılacak Bağımsız Bölümü Seçin ({filteredUnits.length})
                    </div>
                    <div className="max-h-52 overflow-y-auto pr-1 grid grid-cols-2 gap-1.5">
                      {filteredUnits.map(u => {
                        const isTarget = droneTargetUnit?.id === u.id;
                        const meta = getStatusBadgeMeta(u.status);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setDroneFlying(true);
                              setDroneTargetUnit(u);
                              setDroneCameraAngle("close_up");
                              setTimeout(() => setDroneFlying(false), 600);
                            }}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                              isTarget
                                ? "bg-indigo-600/30 border-amber-400 ring-1 ring-amber-400"
                                : "bg-slate-800/80 border-slate-700 hover:border-slate-500"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-black text-amber-300">
                                {u.unit_number}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-black ${meta.chipBg}`}>
                                {meta.label}
                              </span>
                            </div>
                            <div className="text-[10px] text-white font-bold truncate mt-0.5">
                              {u.block_name}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">
                              {u.unit_type} · {formatGbp(u.price)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Selected Unit Instant Inspector & Revision Card inside Drone Cockpit */}
                {droneTargetUnit && (
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-amber-300 font-mono font-bold">
                          HEDEF BAĞIMSIZ BÖLÜM
                        </span>
                        <h5 className="text-sm font-black text-white">
                          {droneTargetUnit.block_name} — Kapı No: {droneTargetUnit.unit_number}
                        </h5>
                      </div>
                      <span className="text-sm font-black text-emerald-300 font-mono">
                        {formatGbp(droneTargetUnit.price)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300">
                      <div>
                        <strong className="text-slate-400">Tip:</strong> {droneTargetUnit.unit_type}
                      </div>
                      <div>
                        <strong className="text-slate-400">Kat:</strong> {droneTargetUnit.floor_level}
                      </div>
                      <div>
                        <strong className="text-slate-400">Alan:</strong> {droneTargetUnit.gross_sqm}m² /{" "}
                        {droneTargetUnit.net_sqm}m²
                      </div>
                      <div>
                        <strong className="text-slate-400">Manzara:</strong> {droneTargetUnit.view_direction}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setRevisingUnit({ ...droneTargetUnit })}
                        className="flex-1 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[11px] font-black cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Bu Bağımsız Bölümü Revize Et</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right 8 Cols: 3D Architectural Building & Lagoon Stage with Drone Fly-To Animation */}
              <div
                className={`lg:col-span-8 rounded-xl border border-slate-800 relative overflow-hidden min-h-[430px] flex flex-col justify-between p-4 transition-colors duration-700 ${
                  droneNightMode
                    ? "bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900"
                    : "bg-gradient-to-b from-sky-900 via-cyan-900 to-slate-900"
                }`}
              >
                {/* Top Drone HUD Telemetry Bar */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 bg-slate-950/75 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10 text-white text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-400/30">
                      <Navigation className="w-3 h-3 animate-bounce" />
                      <span>{droneFlying ? "DRONE UÇUŞ GEÇİŞİ AKTİF..." : "DRONE KAMERA KİLİTLİ"}</span>
                    </span>
                    <span className="font-bold text-amber-300">
                      {droneTargetUnit?.project_name || activeProjectDetail?.name || "Proje Yerleşkesi"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[10px] text-slate-300">
                    <span>
                      RAKIM: <strong>{droneCameraAngle === "close_up" ? "18m" : droneCameraAngle === "top_down" ? "85m" : "42m"}</strong>
                    </span>
                    <span>
                      CEPHE: <strong>{droneTargetUnit?.facade_orientation || "Kuzey Akdeniz"}</strong>
                    </span>
                    <span>
                      KAPI NO: <strong className="text-amber-300">{droneTargetUnit?.unit_number || "-"}</strong>
                    </span>
                  </div>
                </div>

                {/* 3D Perspective Building & Resort Stage */}
                <div className="relative my-auto py-6 flex items-center justify-center overflow-hidden">
                  {/* Mediterranean Sea & Lagoon Pool Horizon */}
                  <div className="absolute inset-x-6 bottom-3 h-16 rounded-2xl bg-gradient-to-r from-cyan-500/30 via-teal-400/40 to-blue-500/30 border border-cyan-300/30 backdrop-blur-xs flex items-center justify-between px-6 text-[10px] font-black tracking-widest text-cyan-100 uppercase">
                    <span>🌊 AKDENİZ SAHİL ŞERİDİ & ÖZEL PLAJ</span>
                    <span>🏊 INFINITY LAGÜN HAVUZU</span>
                  </div>

                  {/* 3D Transformed Architectural Complex */}
                  <div
                    className="w-full max-w-3xl transition-all duration-700 ease-out"
                    style={{
                      transform:
                        droneCameraAngle === "close_up"
                          ? "perspective(1100px) rotateX(10deg) rotateZ(-2deg) scale(1.06)"
                          : droneCameraAngle === "sea_front"
                          ? "perspective(1100px) rotateX(6deg) rotateZ(0deg) scale(1)"
                          : droneCameraAngle === "top_down"
                          ? "perspective(1100px) rotateX(38deg) rotateZ(0deg) scale(0.94)"
                          : "perspective(1100px) rotateX(18deg) rotateZ(-6deg) scale(0.98)"
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                      {blockStackingMatrix.slice(0, 4).map((blk, bIdx) => (
                        <div
                          key={bIdx}
                          className="rounded-2xl bg-slate-900/90 border-2 border-slate-600/80 shadow-2xl p-3 space-y-2 backdrop-blur-md"
                        >
                          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>{blk.blockTitle}</span>
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300">
                              {blk.projectName}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {blk.floors.map((fl, fIdx) => (
                              <div
                                key={fIdx}
                                className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800"
                              >
                                <span className="w-16 text-[9px] font-bold text-slate-400 truncate shrink-0">
                                  {fl.floorName}
                                </span>
                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                  {fl.units.map((u: any) => {
                                    const isFocused = droneTargetUnit?.id === u.id;
                                    const meta = getStatusBadgeMeta(u.status);
                                    return (
                                      <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => {
                                          setDroneFlying(true);
                                          setDroneTargetUnit(u);
                                          setDroneCameraAngle("close_up");
                                          setTimeout(() => setDroneFlying(false), 550);
                                        }}
                                        className={`px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer relative ${
                                          isFocused
                                            ? "bg-amber-400 text-slate-950 border-white ring-4 ring-amber-400/50 scale-105 z-10 shadow-xl"
                                            : `${meta.chipBg} opacity-90 hover:opacity-100`
                                        }`}
                                      >
                                        {isFocused && (
                                          <span className="absolute -top-2 -right-2 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[8px] font-black shadow">
                                            DRONE HEDEFİ
                                          </span>
                                        )}
                                        <div className="font-mono text-[10px] font-black leading-none">
                                          {u.unit_number}
                                        </div>
                                        <div className="text-[9px] font-bold truncate mt-0.5">
                                          {u.unit_type?.split(" ")[0]} · {formatGbp(u.price)}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Drone Spotlight Bar */}
                {droneTargetUnit && (
                  <div className="relative z-10 bg-slate-950/85 backdrop-blur-md border border-amber-400/40 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-mono text-xs font-black">
                        {droneTargetUnit.unit_number}
                      </div>
                      <div>
                        <div className="text-xs font-black">
                          {droneTargetUnit.project_name} · {droneTargetUnit.block_name} ·{" "}
                          {droneTargetUnit.floor_level}
                        </div>
                        <div className="text-[10px] text-cyan-300">
                          Manzara: {droneTargetUnit.view_direction} · Alan: {droneTargetUnit.gross_sqm} m² Brüt
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={droneTargetUnit.status}
                        onChange={e => handleUnitStatusChange(droneTargetUnit.id, e.target.value)}
                        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-bold text-amber-300 cursor-pointer"
                      >
                        <option value="available">Müsait</option>
                        <option value="negotiation">Sonuçlanmakta (Sözleşme)</option>
                        <option value="optioned">Opsiyonlu</option>
                        <option value="sold">Satıldı</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setRevisingUnit({ ...droneTargetUnit })}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        Detaylı Revize Et
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW MODE 4: DETAYLI TABLO & SATIR İÇİ HIZLI REVİZYON             */}
          {/* ================================================================= */}
          {inventoryViewMode === "table_list" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2 px-2.5 rounded-tl-lg">Proje</th>
                    <th className="py-2 px-2.5">Blok & Bağımsız Kapı No</th>
                    <th className="py-2 px-2.5">Ünite Tipi</th>
                    <th className="py-2 px-2.5">Alan (Brüt / Net)</th>
                    <th className="py-2 px-2.5">Kat, Konum & Manzara</th>
                    <th className="py-2 px-2.5">Liste Fiyatı (GBP)</th>
                    <th className="py-2 px-2.5">Statü</th>
                    <th className="py-2 px-2.5 text-right rounded-tr-lg">Revizyon & 3D</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {filteredUnits.map(unit => {
                    const editedPrice = editingUnitPrices[unit.id];
                    const meta = getStatusBadgeMeta(unit.status);
                    return (
                      <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-2.5 font-black text-slate-900">{unit.project_name}</td>
                        <td className="py-2 px-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              {unit.unit_number}
                            </span>
                            <span className="text-slate-700 font-bold">{unit.block_name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-800">{unit.unit_type}</td>
                        <td className="py-2 px-2.5 text-slate-600 font-semibold font-mono tabular-nums">
                          {unit.gross_sqm} m² / {unit.net_sqm} m²{" "}
                          <span className="text-[10px] text-slate-400">(+{unit.terrace_sqm}m²)</span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-600">
                          <span className="font-bold text-slate-900">{unit.floor_level}</span> •{" "}
                          <span>{unit.view_direction}</span>
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold">£</span>
                            <input
                              type="number"
                              value={editedPrice !== undefined ? editedPrice : Number(unit.price)}
                              onChange={e =>
                                setEditingUnitPrices(prev => ({
                                  ...prev,
                                  [unit.id]: Number(e.target.value)
                                }))
                              }
                              className="w-24 px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded text-[11px] font-black text-slate-950 font-mono tabular-nums"
                            />
                            {editedPrice !== undefined && editedPrice !== Number(unit.price) && (
                              <button
                                type="button"
                                onClick={() => handleUnitPriceSave(unit.id)}
                                className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black cursor-pointer"
                              >
                                Kaydet
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-[10px] border ${meta.pillBg}`}
                          >
                            {meta.label}
                          </span>
                          {unit.optioned_client_name && (
                            <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
                              {unit.optioned_client_name}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setRevisingUnit({ ...unit })}
                              className="px-2 py-0.5 bg-slate-900 hover:bg-indigo-600 text-white rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                              title="Blok, Kapı No, Tip, Kat, Manzara ve Fiyatı Revize Et"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Revize Et</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerDroneFlyToUnit(unit)}
                              className="p-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded cursor-pointer"
                              title="3D Drone ile Göster"
                            >
                              <Compass className="w-3 h-3" />
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

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-black uppercase">
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
                  {projects.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-black text-slate-900">
                        {p.folder_prefix || p.name}
                      </td>
                      <td className="py-2 px-2.5 text-slate-600">{p.sub_region}</td>
                      <td className="py-2 px-2.5">
                        <span className="font-semibold text-slate-900">{p.completion_date}</span>
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          %{p.construction_progress}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-mono tabular-nums">
                        <strong className="text-emerald-700">{p.available_units}</strong> / {p.total_units}
                      </td>
                      <td className="py-2 px-2.5 font-mono font-black text-slate-900 tabular-nums">
                        {formatGbp(p.starting_price)}
                      </td>
                      <td className="py-2 px-2.5 text-slate-700">
                        %{p.payment_plan?.down_payment_percent || 35} Peşinat ·{" "}
                        {p.payment_plan?.installment_months || 36} Ay (%0 Faiz)
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handlePrintProjectSheet(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Yazdır
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-950">
                İkili Proje & Ödeme Planı Simülatörü
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={compareLeftId}
                  onChange={e => setCompareLeftId(Number(e.target.value))}
                  className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-black text-indigo-950"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      1. Proje: {p.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-black text-slate-400">VS</span>
                <select
                  value={compareRightId}
                  onChange={e => setCompareRightId(Number(e.target.value))}
                  className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-black text-amber-950"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      2. Proje: {p.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                  <Calculator className="w-3.5 h-3.5 text-slate-700" />
                  <span className="text-[10px] font-bold text-slate-600">Bütçe (GBP):</span>
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

                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 p-3 bg-slate-50/60 space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
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

                      <div className="bg-slate-900 text-white rounded-xl p-2.5 space-y-1.5">
                        <div className="text-[10px] font-black text-amber-300 uppercase">
                          {formatGbp(simulatorPriceGbp)} İçin Ödeme Planı Hesaplaması
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-slate-800 rounded-lg p-1.5">
                            <div className="text-[9px] text-slate-400">Peşinat (%{downPct})</div>
                            <div className="text-xs font-black text-white font-mono">
                              {formatGbp(downAmount)}
                            </div>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-1.5">
                            <div className="text-[9px] text-slate-400">Kalan (%{100 - downPct})</div>
                            <div className="text-xs font-black text-amber-300 font-mono">
                              {formatGbp(remainAmount)}
                            </div>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-1.5">
                            <div className="text-[9px] text-slate-400">{months} Ay Taksit</div>
                            <div className="text-xs font-black text-emerald-300 font-mono">
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
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Etkinlik / Lansman Oluştur</span>
            </button>
          </div>

          {/* CREATE / EDIT EVENT DRAWER WITH IMAGE & VIDEO UPLOAD */}
          {isNewEventOpen && (
            <form
              onSubmit={handleSaveEvent}
              className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black text-amber-300">
                  {editingEventId
                    ? `Etkinlik & Medya Düzenle: ${newEventForm.title}`
                    : "Yeni Etkinlik / Lansman Oluştur (Resim & Video Destekli)"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewEventOpen(false);
                    setEditingEventId(null);
                  }}
                  className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Kapat ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <div className="lg:col-span-2">
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">
                    Etkinlik / Lansman Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Mykonos Homes Yaz Lansmanı & Gala Gecesi"
                    value={newEventForm.title}
                    onChange={e => setNewEventForm({ ...newEventForm, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">
                    İlgili Proje
                  </label>
                  <select
                    value={newEventForm.project_name}
                    onChange={e => setNewEventForm({ ...newEventForm, project_name: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 font-black"
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
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">
                    Tarih & Saat
                  </label>
                  <input
                    type="text"
                    placeholder="2026-07-10 19:30"
                    value={newEventForm.event_date}
                    onChange={e => setNewEventForm({ ...newEventForm, event_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">
                    Konum / Mekan
                  </label>
                  <input
                    type="text"
                    placeholder="Esentepe Sahil Satış Ofisi"
                    value={newEventForm.location}
                    onChange={e => setNewEventForm({ ...newEventForm, location: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* IMAGE & VIDEO UPLOAD CONTROLS FOR EVENT */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <div className="md:col-span-3">
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">
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
                    className="w-full px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {uploadingEventMedia ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    <span>+ Resim / Fotoğraf Yükle</span>
                  </button>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">
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
                    className="w-full px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {uploadingEventMedia ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Video className="w-3.5 h-3.5" />
                    )}
                    <span>+ Video Yükle (MP4/MOV)</span>
                  </button>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">
                    Harici Video / Görsel Linki (Opsiyonel)
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
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="md:col-span-3 flex items-end gap-1.5">
                  <div className="flex-1">
                    <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">
                      Etkinlik Açıklaması
                    </label>
                    <input
                      type="text"
                      placeholder="Kısa açıklama / program özeti"
                      value={newEventForm.description}
                      onChange={e => setNewEventForm({ ...newEventForm, description: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingEventMedia}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black cursor-pointer shrink-0"
                  >
                    Kaydet
                  </button>
                </div>
              </div>

              {/* Attached Event Media Gallery Preview Strip */}
              {newEventForm.media_gallery.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-amber-300 uppercase">
                    Eklenen Etkinlik Medyaları ({newEventForm.media_gallery.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newEventForm.media_gallery.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs"
                      >
                        {item.type === "video" ? (
                          <Video className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
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
                          className="text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* EVENTS GRID WITH COVER IMAGES, VIDEO PREVIEWS & EDIT ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {events.map(ev => {
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
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    {/* Event Visual Cover & Media Counter */}
                    <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                      {coverImg && (
                        <img
                          src={coverImg}
                          alt={ev.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 bg-slate-950/85 text-amber-300 rounded text-[10px] font-bold truncate">
                          {ev.project_name}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-600/90 text-white rounded text-[10px] font-mono font-bold shrink-0">
                          {ev.event_date}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-white/15 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                          <Video className="w-3 h-3 text-amber-300" />
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
                      <div className="text-[10px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                        <strong>Konum:</strong> {ev.location}
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditEvent(ev)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3 text-indigo-600" />
                        <span>Resim/Video Ekle & Düzenle</span>
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
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Play className="w-3 h-3 text-amber-300" />
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

            <div className="flex items-center gap-1.5 flex-wrap">
              {["all", "Yönetim", "Teknik & Mimari", "Satış", "PR & Pazarlama"].map(dept => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setStaffDeptFilter(dept)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    staffDeptFilter === dept
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {dept === "all" ? `Tümü (${internalStaff.length})` : dept}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsNewStaffOpen(prev => !prev)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kullanıcı Ekle</span>
              </button>
            </div>
          </div>

          {isNewStaffOpen && (
            <form
              onSubmit={handleCreateInternalStaff}
              className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ad Soyad *"
                  value={newStaffForm.full_name}
                  onChange={e => setNewStaffForm({ ...newStaffForm, full_name: e.target.value })}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
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
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 font-bold"
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
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
                <input
                  type="email"
                  placeholder="Kurumsal E-Posta *"
                  value={newStaffForm.email}
                  onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Sorumlu Projeler / Alan"
                    value={newStaffForm.assigned_regions}
                    onChange={e =>
                      setNewStaffForm({ ...newStaffForm, assigned_regions: e.target.value })
                    }
                    className="flex-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase">
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
                {filteredStaff.map(st => {
                  const perms = st.permissions || {
                    can_manage_projects:
                      st.department === "Yönetim" || st.department === "Teknik & Mimari",
                    can_upload_media: true,
                    can_manage_prices: st.department === "Yönetim" || st.department === "Satış",
                    can_manage_users: st.department === "Yönetim"
                  };
                  return (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5">
                        <div className="font-black text-slate-900">{st.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{st.email}</div>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="px-2 py-0.5 bg-slate-900 text-amber-300 rounded text-[10px] font-bold">
                          {st.department}
                        </span>
                        <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                          {st.title_role}
                        </div>
                      </td>
                      <td className="py-2 px-2.5 text-[11px] text-slate-600">
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
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer border transition-colors ${
                                enabled
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : "bg-slate-100 text-slate-400 border-slate-200"
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
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white">{previewAsset.name}</h4>
                <p className="text-[11px] text-slate-400">
                  {previewAsset.projectName} · {previewAsset.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
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
                  <div className="h-64 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative">
                    <img
                      src={previewAsset.cover}
                      alt={previewAsset.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-slate-950/85 text-white text-[11px] font-bold">
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
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
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
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Dosyayı İndir / Aç</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewAsset(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
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
