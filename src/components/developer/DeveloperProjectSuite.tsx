import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  FolderSync,
  ShieldCheck,
  Users,
  Layers,
  Sparkles,
  FileCheck2,
  Calendar,
  CheckCircle2,
  Plus,
  Search,
  Download,
  Play,
  FileText,
  Image as ImageIcon,
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
  Settings2,
  Eye,
  Upload,
  FolderOpen,
  CloudCheck,
  X
} from "lucide-react";
import { toast } from "sonner";

export type SuiteTab =
  | "showcase"
  | "inventory"
  | "compare"
  | "agencies"
  | "leads_contracts"
  | "events"
  | "b2b_portal_preview";

interface DeveloperProjectSuiteProps {
  storeId?: number;
  branding?: any;
  user?: any;
  initialSection?: SuiteTab;
  isStandaloneDeveloperStore?: boolean;
  onBackToPortfolio?: () => void;
  onConvertUnitToProperty?: (unitPayload: any) => void;
}

interface BackupLogEntry {
  id: string;
  timestamp: string;
  department: string;
  action: string;
  target: string;
  status: "synced";
}

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
  const [syncingDrive, setSyncingDrive] = useState<boolean>(false);

  const [companies, setCompanies] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [internalStaff, setInternalStaff] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [driveMeta, setDriveMeta] = useState<any>(null);

  // Automatic Background Google Drive Backup Log
  const [backupLogs, setBackupLogs] = useState<BackupLogEntry[]>([
    {
      id: "bk-1",
      timestamp: "Bugün 14:20",
      department: "Teknik & Mimari",
      action: "Masterplan & Kat Planları (PDF) yüklendi",
      target: "1. Maldives Homes / Teknik Planlar",
      status: "synced"
    },
    {
      id: "bk-2",
      timestamp: "Bugün 13:05",
      department: "Satış",
      action: "Ünite stok ve liste fiyatları güncellendi",
      target: "3. Mykonos Homes / Fiyat Listesi",
      status: "synced"
    },
    {
      id: "bk-3",
      timestamp: "Bugün 11:40",
      department: "PR & Pazarlama",
      action: "4K Drone Çekimi ve Lansman Videosu eklendi",
      target: "7. Hawaii Homes / Medya Havuzu",
      status: "synced"
    },
    {
      id: "bk-4",
      timestamp: "Dün 17:15",
      department: "Yönetim",
      action: "Tüm Projeler Karşılaştırma Tablosu güncellendi",
      target: "Ana Klasör / All Projects Comparison Table",
      status: "synced"
    }
  ]);

  const recordBackupLog = (department: string, action: string, target: string) => {
    const now = new Date();
    const timeStr = `Bugün ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setBackupLogs(prev => [
      {
        id: `bk-${Date.now()}`,
        timestamp: timeStr,
        department,
        action,
        target,
        status: "synced"
      },
      ...prev
    ]);
  };

  useEffect(() => {
    if (initialSection) {
      setActiveTab(normalizeTab(initialSection));
    }
  }, [initialSection]);

  // Selected project for deep inspection in Showcase & Inventory
  const [selectedProjectId, setSelectedProjectId] = useState<number | "all">("all");
  const [activeProjectDetail, setActiveProjectDetail] = useState<any | null>(null);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<
    "all" | "technical" | "sales" | "pr_media"
  >("all");
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);

  // Company Settings Drawer (Single Company Info & Backup Account)
  const [isCompanySettingsOpen, setIsCompanySettingsOpen] = useState(false);
  const [companySettingsForm, setCompanySettingsForm] = useState({
    company_name: "",
    headquarters_region: "Girne — Esentepe & Tatlısu Sahil Hattı, KKTC",
    contact_director: "Salih Kayım / Yönetim Kurulu",
    phone: "+90 548 860 00 01",
    email: "info@cyprusconstructions.com",
    backup_drive_email: "archive@cyprusconstructions.com",
    auto_backup_enabled: true
  });

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

  // Project File / Media Upload State (Directly into projectLP, auto-backed up to Drive)
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [newMediaForm, setNewMediaForm] = useState({
    name: "",
    type: "masterplan",
    size: "18.5 MB",
    category: "Teknik & Mimari Planlar",
    url: ""
  });

  // Unit & Price Management State
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [newUnitForm, setNewUnitForm] = useState({
    project_id: 0,
    block_name: "A Blok (Sahil)",
    floor_level: "Zemin (Swim-Up)",
    unit_number: "A-15",
    unit_type: "1+1 Swim-Up Suite",
    gross_sqm: 82,
    net_sqm: 65,
    terrace_sqm: 17,
    view_direction: "Tam Deniz & Lagün Havuz",
    price: 195000,
    status: "available"
  });
  const [editingUnitPrices, setEditingUnitPrices] = useState<Record<number, number>>({});
  const [bulkPricePercent, setBulkPricePercent] = useState<number>(5);

  // Comparison state
  const [compareLeftId, setCompareLeftId] = useState<number>(0);
  const [compareRightId, setCompareRightId] = useState<number>(0);
  const [simulatorPriceGbp, setSimulatorPriceGbp] = useState<number>(215000);

  // Filters for Inventory
  const [unitStatusFilter, setUnitStatusFilter] = useState<string>("all");
  const [unitSearch, setUnitSearch] = useState<string>("");

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

  // Launch Event Add Form
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    title: "",
    event_type: "launch_party",
    project_name: "Mykonos Homes",
    event_date: "2026-07-10 19:30",
    location: "Esentepe Sahil — Satış & Lansman Merkezi, KKTC",
    target_regions: "Yönetim, Satış ve PR Ekibi",
    media_preview_url: "HAWAII OPENING PARTY.mp4",
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
      setCompanies(loadedCompanies);
      setProjects(loadedProjects);
      setUnits(Array.isArray(data.units) ? data.units : []);
      setInternalStaff(Array.isArray(data.internalStaff) ? data.internalStaff : []);
      setEvents(Array.isArray(data.events) ? data.events : []);
      setDriveMeta(data.driveSyncMeta || null);

      if (loadedCompanies[0]) {
        const c = loadedCompanies[0];
        setCompanySettingsForm(prev => ({
          ...prev,
          company_name: String(c.company_name || "").replace(/\s*\(projectLP\)\s*/gi, "").trim(),
          headquarters_region: c.headquarters_region || prev.headquarters_region,
          contact_director: c.contact_director || prev.contact_director,
          phone: c.phone || prev.phone,
          email: c.email || prev.email
        }));
      }

      if (loadedProjects.length > 0) {
        setActiveProjectDetail((prev: any) =>
          prev ? loadedProjects.find((p: any) => p.id === prev.id) || loadedProjects[0] : loadedProjects[0]
        );
        setNewUnitForm(prev => ({ ...prev, project_id: prev.project_id || loadedProjects[0].id }));
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

  const handleTriggerBackupNow = async () => {
    setSyncingDrive(true);
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/sync-drive", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          store_id: sid,
          driveFolderUrl:
            driveMeta?.folderUrl ||
            "https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM"
        })
      });
      if (res.ok) {
        recordBackupLog("Sistem", "Tüm proje klasörleri, medya ve fiyat listeleri yedeklendi", "Tam Yedekleme");
        toast.success("Tüm proje verileri bağlı Google Drive hesabınıza yedeklendi.");
        await fetchOverview();
      } else {
        toast.error("Yedekleme sırasında hata oluştu.");
      }
    } catch (e) {
      toast.error("Yedekleme bağlantı hatası.");
    } finally {
      setSyncingDrive(false);
    }
  };

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany?.id) {
      setIsCompanySettingsOpen(false);
      return;
    }
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/companies/${activeCompany.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...companySettingsForm,
          store_id: sid
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setCompanies([updated]);
        setIsCompanySettingsOpen(false);
        toast.success("Firma ve otomatik yedekleme ayarları kaydedildi.");
      }
    } catch (err) {
      toast.error("Ayarlar kaydedilemedi.");
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
          recordBackupLog("Yönetim", `${saved.name} proje bilgileri güncellendi`, saved.folder_prefix || saved.name);
          toast.success(`${saved.name} güncellendi (Otomatik yedeklendi).`);
        } else {
          setProjects(prev => [...prev, saved]);
          setActiveProjectDetail(saved);
          recordBackupLog("Yönetim", `Yeni proje klasörü oluşturuldu: ${saved.name}`, saved.folder_prefix || saved.name);
          toast.success(`${saved.name} projesi oluşturuldu.`);
        }
        setIsProjectFormOpen(false);
        setEditingProjectId(null);
      }
    } catch (err) {
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
    if (!activeProjectDetail || !newMediaForm.name.trim()) return;
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/projects/${activeProjectDetail.id}/media`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newMediaForm,
          url: newMediaForm.url || activeProjectDetail.cover_image,
          store_id: sid
        })
      });
      if (res.ok) {
        const updatedProj = await res.json();
        setProjects(prev => prev.map(p => (p.id === updatedProj.id ? updatedProj : p)));
        setActiveProjectDetail(updatedProj);
        setIsAddMediaOpen(false);
        recordBackupLog(
          newMediaForm.category.includes("Teknik")
            ? "Teknik & Mimari"
            : newMediaForm.category.includes("Satış")
            ? "Satış"
            : "PR & Pazarlama",
          `${newMediaForm.name} yüklendi`,
          `${activeProjectDetail.name} / ${newMediaForm.category}`
        );
        setNewMediaForm({
          name: "",
          type: "masterplan",
          size: "18.5 MB",
          category: "Teknik & Mimari Planlar",
          url: ""
        });
        toast.success("Dosya proje klasörüne eklendi ve otomatik yedeklendi.");
      }
    } catch (err) {
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
    } catch (err) {
      toast.error("Dosya silinemedi.");
    }
  };

  // Unit & Price Management Handlers
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
        recordBackupLog("Satış", `Yeni ünite eklendi: ${created.unit_number}`, created.project_name || "Envanter");
        toast.success(`${created.unit_number} ünitesi eklendi.`);
      }
    } catch (err) {
      toast.error("Ünite eklenemedi.");
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
        recordBackupLog("Satış", `Ünite ${updated.unit_number} durumu güncellendi`, updated.project_name || "Envanter");
        toast.success("Ünite durumu güncellendi.");
      }
    } catch (e) {
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
        recordBackupLog(
          "Satış",
          `Ünite ${updated.unit_number} fiyatı £${new Intl.NumberFormat("tr-TR").format(newPrice)} olarak güncellendi`,
          "Fiyat Listesi"
        );
        toast.success(`Ünite fiyatı £${new Intl.NumberFormat("tr-TR").format(newPrice)} olarak güncellendi.`);
      }
    } catch (err) {
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
        recordBackupLog("Yönetim & Satış", `Toplu fiyat güncellemesi (%${bulkPricePercent}) uygulandı`, "Fiyat Listeleri");
        toast.success(data.message || "Toplu fiyat güncellemesi tamamlandı.");
        await fetchOverview();
      } else {
        toast.error(data.error || "Toplu fiyat güncellenemedi.");
      }
    } catch (err) {
      toast.error("Toplu fiyat güncelleme hatası.");
    }
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      toast.error("Silinemedi.");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.title.trim()) {
      toast.error("Etkinlik başlığı zorunludur.");
      return;
    }
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/events", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newEventForm, store_id: sid })
      });
      if (res.ok) {
        const created = await res.json();
        setEvents(prev => [created, ...prev]);
        setIsNewEventOpen(false);
        recordBackupLog("PR & Pazarlama", `Yeni etkinlik eklendi: ${created.title}`, "EVENTS Klasörü");
        setNewEventForm({
          title: "",
          event_type: "launch_party",
          project_name: "Mykonos Homes",
          event_date: "2026-07-10 19:30",
          location: "Esentepe Sahil — Satış & Lansman Merkezi, KKTC",
          target_regions: "Yönetim, Satış ve PR Ekibi",
          media_preview_url: "HAWAII OPENING PARTY.mp4",
          max_capacity: 200,
          description: ""
        });
        toast.success("Etkinlik kaydedildi ve otomatik yedeklendi.");
      }
    } catch (err) {
      toast.error("Etkinlik eklenemedi.");
    }
  };

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      if (selectedProjectId !== "all" && Number(u.project_id) !== Number(selectedProjectId)) return false;
      if (unitStatusFilter !== "all" && u.status !== unitStatusFilter) return false;
      if (unitSearch.trim()) {
        const q = unitSearch.toLowerCase();
        const match =
          u.unit_number?.toLowerCase().includes(q) ||
          u.unit_type?.toLowerCase().includes(q) ||
          u.block_name?.toLowerCase().includes(q) ||
          u.project_name?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [units, selectedProjectId, unitStatusFilter, unitSearch]);

  const filteredStaff = useMemo(() => {
    if (staffDeptFilter === "all") return internalStaff;
    return internalStaff.filter(s => s.department === staffDeptFilter);
  }, [internalStaff, staffDeptFilter]);

  const filteredProjectMedia = useMemo(() => {
    const list: any[] = activeProjectDetail?.media_vault || [];
    if (mediaCategoryFilter === "all") return list;
    return list.filter(doc => {
      const t = String(doc.type || "").toLowerCase();
      const c = String(doc.category || "").toLowerCase();
      if (mediaCategoryFilter === "technical") {
        return t === "masterplan" || t === "legal" || c.includes("plan") || c.includes("teknik") || c.includes("mimari");
      }
      if (mediaCategoryFilter === "sales") {
        return t === "pricelist" || c.includes("fiyat") || c.includes("ödeme") || c.includes("satış");
      }
      if (mediaCategoryFilter === "pr_media") {
        return t === "video" || t === "photos" || c.includes("render") || c.includes("video") || c.includes("katalog");
      }
      return true;
    });
  }, [activeProjectDetail, mediaCategoryFilter]);

  // Project totals for single-glance KPI bar
  const portfolioStats = useMemo(() => {
    const totalUnits = projects.reduce((acc, p) => acc + (Number(p.total_units) || 0), 0);
    const availableUnits = projects.reduce((acc, p) => acc + (Number(p.available_units) || 0), 0);
    const optionedUnits = projects.reduce((acc, p) => acc + (Number(p.optioned_units) || 0), 0);
    const soldUnits = projects.reduce((acc, p) => acc + (Number(p.sold_units) || 0), 0);
    const totalFiles =
      projects.reduce((acc, p) => acc + (Array.isArray(p.media_vault) ? p.media_vault.length : 0), 0) +
      (Array.isArray(driveMeta?.rootMediaFiles) ? driveMeta.rootMediaFiles.length : 0);
    return { totalUnits, availableUnits, optionedUnits, soldUnits, totalFiles };
  }, [projects, driveMeta]);

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBackToPortfolio && (
              <button
                type="button"
                onClick={onBackToPortfolio}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer shrink-0"
              >
                ← Geri
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {companyDisplayName}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Otomatik Drive Yedekleme Aktif</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Proje Klasörleri, Teknik Planlar, Medya Havuzu, Ünite Fiyatları ve Ekip Yönetimi
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
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
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Proje Ekle</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCompanySettingsOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all whitespace-nowrap ${
                isCompanySettingsOpen
                  ? "bg-amber-400 text-slate-950 border-amber-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Firma & Yedekleme Ayarları</span>
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
            <div className="text-[10px] text-slate-400 font-semibold">Toplam & Müsait Ünite</div>
            <div className="text-base font-black text-emerald-300 font-mono tabular-nums mt-0.5">
              {portfolioStats.availableUnits} Müsait{" "}
              <span className="text-xs text-slate-400 font-normal">/ {portfolioStats.totalUnits}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {portfolioStats.optionedUnits} Opsiyonlu · {portfolioStats.soldUnits} Satıldı
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

        {/* COLLAPSIBLE SINGLE-COMPANY & BACKGROUND BACKUP SETTINGS */}
        {isCompanySettingsOpen && (
          <form
            onSubmit={handleSaveCompanySettings}
            className="mt-3 pt-3 border-t border-slate-800 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">
                Firma Bilgileri & Arka Plan Google Drive Yedekleme Hesabı
              </span>
              <button
                type="button"
                onClick={() => setIsCompanySettingsOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Kapat</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Firma Adı</label>
                <input
                  type="text"
                  value={companySettingsForm.company_name}
                  onChange={e =>
                    setCompanySettingsForm({ ...companySettingsForm, company_name: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Merkez Bölge</label>
                <input
                  type="text"
                  value={companySettingsForm.headquarters_region}
                  onChange={e =>
                    setCompanySettingsForm({ ...companySettingsForm, headquarters_region: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Firma Yetkilisi</label>
                <input
                  type="text"
                  value={companySettingsForm.contact_director}
                  onChange={e =>
                    setCompanySettingsForm({ ...companySettingsForm, contact_director: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                  Yedekleme Google Drive Hesabı
                </label>
                <input
                  type="email"
                  value={companySettingsForm.backup_drive_email}
                  onChange={e =>
                    setCompanySettingsForm({ ...companySettingsForm, backup_drive_email: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-emerald-300 font-mono"
                />
              </div>
              <div className="flex items-end gap-1.5">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={handleTriggerBackupNow}
                  disabled={syncingDrive}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  <FolderSync className={`w-3.5 h-3.5 ${syncingDrive ? "animate-spin" : ""}`} />
                  <span>{syncingDrive ? "Yedekleniyor..." : "Şimdi Yedekle"}</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Panel üzerinde eklediğiniz tüm projeler, teknik planlar, görseller, videolar ve fiyat güncellemeleri doğrudan Google Drive ile uğraşmanıza gerek kalmadan arka planda bağlı Google Drive hesabınıza otomatik olarak yedeklenir.
            </p>
          </form>
        )}

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
            { id: "inventory", label: `Üniteler & Fiyatlar (${units.length})`, icon: Layers },
            { id: "compare", label: "Proje Karşılaştırma", icon: ArrowLeftRight },
            { id: "events", label: `Etkinlik & Lansmanlar (${events.length})`, icon: Calendar },
            { id: "agencies", label: `Ekip, Yetkiler & Yedekleme (${internalStaff.length})`, icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SuiteTab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
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
                  onClick={() => setActiveProjectDetail(proj)}
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
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-slate-900 text-amber-300 rounded text-[10px] font-mono font-black">
                      {activeProjectDetail.folder_prefix || activeProjectDetail.project_code}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-950">
                      {activeProjectDetail.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-semibold">
                      · {activeProjectDetail.sub_region} · Teslim: {activeProjectDetail.completion_date} · İnşaat: %{activeProjectDetail.construction_progress}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{activeProjectDetail.concept_tagline}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsAddMediaOpen(prev => !prev)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Dosya / Medya Yükle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(activeProjectDetail.id);
                      setActiveTab("inventory");
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Ünite & Fiyatlar ({activeProjectDetail.available_units} Müsait)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditProject(activeProjectDetail)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Proje Bilgilerini Düzenle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintProjectSheet(activeProjectDetail)}
                    className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Bilgi Formu Yazdır</span>
                  </button>

                  {onConvertUnitToProperty && (
                    <button
                      type="button"
                      onClick={() => {
                        onConvertUnitToProperty({
                          title: `${activeProjectDetail.name} — Özel Portföy Ünitesi`,
                          description: `${activeProjectDetail.concept_tagline}\n\nMimari Özellikler:\n- ${(
                            activeProjectDetail.architectural_specs || []
                          ).join("\n- ")}`,
                          price: activeProjectDetail.starting_price,
                          currency: activeProjectDetail.currency || "GBP",
                          location: activeProjectDetail.sub_region || "Esentepe",
                          kktc_region: activeProjectDetail.region || "Girne",
                          type: "residence",
                          room_count: "1+1",
                          square_meters: 65,
                          sqm_gross: 82,
                          country: "KKTC",
                          listing_intent: "sale",
                          images: [activeProjectDetail.cover_image]
                        });
                        toast.success(`${activeProjectDetail.name} portföy ilan formuna aktarıldı.`);
                      }}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>İlan Oluştur</span>
                    </button>
                  )}
                </div>
              </div>

              {/* IN-APP FILE / MEDIA UPLOAD DRAWER */}
              {isAddMediaOpen && (
                <form
                  onSubmit={handleAddMediaToProject}
                  className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">
                      {activeProjectDetail.name} Klasörüne Yeni Dosya / Medya Yükle
                    </span>
                    <span className="text-[10px] text-emerald-300 font-semibold">
                      Yüklenen dosyalar arka planda Google Drive hesabınıza otomatik yedeklenir
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Dosya Başlığı (Örn: Kat Planları 2026.pdf) *"
                      value={newMediaForm.name}
                      onChange={e => setNewMediaForm({ ...newMediaForm, name: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                    <select
                      value={newMediaForm.category}
                      onChange={e => {
                        const cat = e.target.value;
                        const inferredType = cat.includes("Teknik")
                          ? "masterplan"
                          : cat.includes("Satış")
                          ? "pricelist"
                          : cat.includes("Video")
                          ? "video"
                          : "photos";
                        setNewMediaForm({ ...newMediaForm, category: cat, type: inferredType });
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-amber-300 text-xs font-bold"
                    >
                      <option value="Teknik & Mimari Planlar">Teknik & Mimari (Masterplan / Kat Planı / Şartname)</option>
                      <option value="Satış & Fiyat Listeleri">Satış (Fiyat Listesi / Ödeme Planı / Sözleşme)</option>
                      <option value="PR & 3D Render Görselleri">PR & Medya (3D Render / Fotoğraf / Katalog)</option>
                      <option value="PR & Tanıtım Videoları">PR & Medya (Drone / Tanıtım Videosu)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Dosya URL veya Görsel/Video Linki (İsteğe Bağlı)"
                      value={newMediaForm.url}
                      onChange={e => setNewMediaForm({ ...newMediaForm, url: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Boyut (18 MB)"
                        value={newMediaForm.size}
                        onChange={e => setNewMediaForm({ ...newMediaForm, size: e.target.value })}
                        className="w-24 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Yükle & Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddMediaOpen(false)}
                        className="px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Left 7 Cols: Project Folder Explorer (Categorized by Department: Teknik, Satış, PR) */}
                <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-indigo-600" />
                      <span>{activeProjectDetail.name} — Proje Klasörü & Dosyalar</span>
                    </h4>
                    <div className="flex items-center gap-1 flex-wrap">
                      {[
                        { id: "all", label: "Tümü" },
                        { id: "technical", label: "Teknik & Planlar" },
                        { id: "sales", label: "Satış & Fiyat" },
                        { id: "pr_media", label: "PR, Render & Video" }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setMediaCategoryFilter(f.id as any)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            mediaCategoryFilter === f.id
                              ? "bg-slate-900 text-white"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {f.label}
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
                        <div className="flex items-center gap-2.5 min-w-0">
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
                            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                              <span>{doc.category}</span>
                              <span>·</span>
                              <span className="font-mono">{doc.size}</span>
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
                                size: doc.size,
                                type: doc.type,
                                url: doc.url,
                                cover: activeProjectDetail.cover_image,
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
                            title="İndir"
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

                  {/* Shared Company-Wide Media & Master Map (Inside projectLP, not sending user to Google Drive) */}
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
                          const size = typeof rf === "object" && rf?.size ? ` (${rf.size})` : "";
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() =>
                                setPreviewAsset({
                                  name: label,
                                  category: "Ortak Kurumsal Medya",
                                  size: rf?.size || "",
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
                              <span>
                                {label}
                                {size}
                              </span>
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
      {/* TAB 2: ÜNİTE & FİYAT LİSTESİ                                          */}
      {/* ===================================================================== */}
      {activeTab === "inventory" && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-950">
                Ünite & Fiyat Listesi ({filteredUnits.length})
              </h3>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1">
                <Percent className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[10px] font-black text-amber-900">Toplu Fiyat %:</span>
                <input
                  type="number"
                  value={bulkPricePercent}
                  onChange={e => setBulkPricePercent(Number(e.target.value))}
                  className="w-14 px-1.5 py-0.5 bg-white border border-amber-300 rounded text-[11px] font-black text-slate-900"
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
                onChange={e =>
                  setSelectedProjectId(e.target.value === "all" ? "all" : Number(e.target.value))
                }
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
              >
                <option value="all">Tüm Projeler ({units.length})</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={unitStatusFilter}
                onChange={e => setUnitStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="available">Müsait</option>
                <option value="optioned">Opsiyonlu</option>
                <option value="sold">Satıldı</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={unitSearch}
                  onChange={e => setUnitSearch(e.target.value)}
                  placeholder="Ünite, blok, tip ara..."
                  className="pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-medium text-slate-900 outline-none w-44"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddUnitOpen(prev => !prev)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Ünite</span>
              </button>
            </div>
          </div>

          {isAddUnitOpen && (
            <form
              onSubmit={handleAddUnit}
              className="p-2.5 bg-slate-900 text-white rounded-xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 items-end"
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
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Ünite No</label>
                <input
                  type="text"
                  value={newUnitForm.unit_number}
                  onChange={e => setNewUnitForm({ ...newUnitForm, unit_number: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
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
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Brüt / Net m²</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={newUnitForm.gross_sqm}
                    onChange={e => setNewUnitForm({ ...newUnitForm, gross_sqm: Number(e.target.value) })}
                    className="w-16 px-1.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <input
                    type="number"
                    value={newUnitForm.net_sqm}
                    onChange={e => setNewUnitForm({ ...newUnitForm, net_sqm: Number(e.target.value) })}
                    className="w-16 px-1.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Manzara</label>
                <input
                  type="text"
                  value={newUnitForm.view_direction}
                  onChange={e => setNewUnitForm({ ...newUnitForm, view_direction: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
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
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-black cursor-pointer h-7"
              >
                Kaydet
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="py-2 px-2.5 rounded-tl-lg">Proje</th>
                  <th className="py-2 px-2.5">Blok & Ünite</th>
                  <th className="py-2 px-2.5">Tip</th>
                  <th className="py-2 px-2.5">Alan (Brüt / Net)</th>
                  <th className="py-2 px-2.5">Kat & Manzara</th>
                  <th className="py-2 px-2.5">Liste Fiyatı (GBP)</th>
                  <th className="py-2 px-2.5">Durum</th>
                  <th className="py-2 px-2.5 text-right rounded-tr-lg">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {filteredUnits.map(unit => {
                  const editedPrice = editingUnitPrices[unit.id];
                  return (
                    <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2.5 font-black text-slate-900">{unit.project_name}</td>
                      <td className="py-2 px-2.5">
                        <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {unit.unit_number}
                        </span>
                        <span className="text-slate-500 ml-1.5 font-semibold">{unit.block_name}</span>
                      </td>
                      <td className="py-2 px-2.5 font-bold text-slate-800">{unit.unit_type}</td>
                      <td className="py-2 px-2.5 text-slate-600 font-semibold font-mono tabular-nums">
                        {unit.gross_sqm} m² / {unit.net_sqm} m²{" "}
                        <span className="text-[10px] text-slate-400">(+{unit.terrace_sqm}m² Teras)</span>
                      </td>
                      <td className="py-2 px-2.5 text-slate-600">
                        <span className="font-semibold text-slate-800">{unit.floor_level}</span> •{" "}
                        {unit.view_direction}
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
                        {unit.status === "available" && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                            MÜSAİT
                          </span>
                        )}
                        {unit.status === "optioned" && (
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px]">
                              OPSİYONLU
                            </span>
                            {unit.optioned_client_name && (
                              <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
                                {unit.optioned_client_name}
                              </div>
                            )}
                          </div>
                        )}
                        {unit.status === "sold" && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px]">
                            SATILDI
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <select
                            value={unit.status}
                            onChange={e => handleUnitStatusChange(unit.id, e.target.value)}
                            className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-800 cursor-pointer"
                          >
                            <option value="available">Müsait Yap</option>
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: TÜM PROJELER KARŞILAŞTIRMA TABLOSU                             */}
      {/* ===================================================================== */}
      {activeTab === "compare" && (
        <div className="space-y-3">
          {/* Master All-Projects Comparison Table (Replaces All Projects Comparison Table.pdf) */}
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

          {/* Side-by-Side 2-Project Detailed Comparison & Payment Simulator */}
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
      {/* TAB 4: ETKİNLİK & LANSMAN ARŞİVİ (EVENTS)                             */}
      {/* ===================================================================== */}
      {activeTab === "events" && (
        <div className="space-y-2.5">
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-950">
                Etkinlik, Lansman & PR Medya Arşivi ({events.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsNewEventOpen(prev => !prev)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Etkinlik Ekle</span>
            </button>
          </div>

          {isNewEventOpen && (
            <form
              onSubmit={handleCreateEvent}
              className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2"
            >
              <input
                type="text"
                required
                placeholder="Etkinlik Başlığı *"
                value={newEventForm.title}
                onChange={e => setNewEventForm({ ...newEventForm, title: e.target.value })}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              />
              <select
                value={newEventForm.project_name}
                onChange={e => setNewEventForm({ ...newEventForm, project_name: e.target.value })}
                className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-amber-300 font-black"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Tarih & Saat (2026-07-10 19:30)"
                value={newEventForm.event_date}
                onChange={e => setNewEventForm({ ...newEventForm, event_date: e.target.value })}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              />
              <input
                type="text"
                placeholder="Konum"
                value={newEventForm.location}
                onChange={e => setNewEventForm({ ...newEventForm, location: e.target.value })}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              />
              <input
                type="text"
                placeholder="Açıklama / Medya Notu"
                value={newEventForm.description}
                onChange={e => setNewEventForm({ ...newEventForm, description: e.target.value })}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer"
              >
                Kaydet
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {events.map(ev => (
              <div
                key={ev.id}
                className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between space-y-2.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-900 text-amber-300 rounded text-[10px] font-bold">
                      {ev.project_name}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-indigo-700">{ev.event_date}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-950">{ev.title}</h4>
                  <p className="text-[11px] text-slate-600">{ev.description}</p>
                  <div className="text-[10px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/70 space-y-0.5">
                    <div>
                      <strong>Konum:</strong> {ev.location}
                    </div>
                    {ev.media_preview_url && (
                      <div>
                        <strong>Medya Dosyası:</strong> {ev.media_preview_url}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-emerald-700">
                    Otomatik Yedeklendi
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewAsset({
                        name: ev.media_preview_url || ev.title,
                        category: "Etkinlik & Lansman Videosu",
                        size: "299 MB",
                        type: "video",
                        url: "https://drive.google.com/file/d/1S-voP7vN7ciN52agBq4iuWHSoP0yfRCW/view",
                        cover: projects[0]?.cover_image,
                        projectName: ev.project_name
                      })
                    }
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 text-amber-300" />
                    <span>Medyayı Aç</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: ŞİRKET EKİBİ, KULLANICI YETKİLERİ & OTOMATİK DRIVE YEDEKLEME   */}
      {/* ===================================================================== */}
      {activeTab === "agencies" && (
        <div className="space-y-3">
          {/* SECTION A: INTERNAL COMPANY USERS & GRANULAR PERMISSION MATRIX */}
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
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
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

          {/* SECTION B: AUTOMATIC BACKGROUND GOOGLE DRIVE BACKUP VAULT */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-black text-white">
                    Otomatik Google Drive Yedekleme & Veri Güvencesi
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Ekibiniz doğrudan Google Drive klasörleriyle uğraşmadan tüm işlemlerini bu panel üzerinden yürütür; yapılan her yükleme ve güncelleme arka planda bağlı Google Drive hesabınıza otomatik kaydedilir.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-mono text-emerald-300">
                  Hesap: {companySettingsForm.backup_drive_email}
                </span>
                <button
                  type="button"
                  onClick={handleTriggerBackupNow}
                  disabled={syncingDrive}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  <FolderSync className={`w-3.5 h-3.5 ${syncingDrive ? "animate-spin" : ""}`} />
                  <span>{syncingDrive ? "Yedekleniyor..." : "Şimdi Yedekle"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Son Otomatik Yedeklenen İşlemler
              </div>
              <div className="divide-y divide-slate-800 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden text-xs">
                {backupLogs.map(log => (
                  <div
                    key={log.id}
                    className="px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-bold text-white">{log.action}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-amber-300 font-mono text-[11px]">{log.target}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {log.department}
                      </span>
                      <span className="font-mono">{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* IN-APP ASSET & DOCUMENT PREVIEW MODAL                                 */}
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
                  {previewAsset.projectName} · {previewAsset.category}{" "}
                  {previewAsset.size ? `· ${previewAsset.size}` : ""}
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
              {previewAsset.cover && (
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
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bulut Havuzunda Kayıtlı & Otomatik Yedekli</span>
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
                      <span>Dosyayı İndir / Tam Ekran Aç</span>
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
