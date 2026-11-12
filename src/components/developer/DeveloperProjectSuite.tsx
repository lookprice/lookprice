import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  FolderSync,
  Globe,
  ShieldCheck,
  Users,
  Layers,
  Sparkles,
  FileCheck2,
  Calendar,
  ExternalLink,
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
  KeyRound,
  Printer,
  UserCheck,
  Edit3,
  Trash2,
  Percent,
  Save,
  Settings2,
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

export const DeveloperProjectSuite: React.FC<DeveloperProjectSuiteProps> = ({
  storeId,
  branding,
  user,
  initialSection,
  isStandaloneDeveloperStore = false,
  onBackToPortfolio,
  onConvertUnitToProperty
}) => {
  const [activeTab, setActiveTab] = useState<SuiteTab>(initialSection || "showcase");
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingDrive, setSyncingDrive] = useState<boolean>(false);

  const [networkDeveloperStores, setNetworkDeveloperStores] = useState<any[]>([]);
  const [selectedDeveloperStoreId, setSelectedDeveloperStoreId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [internalStaff, setInternalStaff] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [driveMeta, setDriveMeta] = useState<any>(null);

  useEffect(() => {
    if (initialSection) {
      setActiveTab(initialSection);
    }
  }, [initialSection]);

  // Selected project for deep inspection in Showcase & Inventory
  const [selectedProjectId, setSelectedProjectId] = useState<number | "all">("all");
  const [activeProjectDetail, setActiveProjectDetail] = useState<any | null>(null);

  // 1. Construction Company (İnşaat Firması) Management Drawer
  const [isCompanyManagerOpen, setIsCompanyManagerOpen] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    company_name: "",
    headquarters_region: "Girne / Esentepe, KKTC",
    license_grade: "1. Sınıf Uluslararası Konut & Resort Geliştiricisi",
    contact_director: "",
    phone: "",
    email: "",
    drive_folder_url: "https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM",
    default_commission_rate: 8,
    lead_protection_days: 60,
    option_hold_hours: 72
  });

  // 2. Project Create / Edit Modal/Drawer State
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
    default_commission_rate: 8,
    down_payment_percent: 35,
    installment_months: 36,
    annual_rental_yield_percent: 10.2,
    capital_appreciation_percent: 45,
    cover_image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85",
    payment_notes: "%35 Peşinat, kalan %65 için teslim tarihine kadar 36 ay %0 faiz şirket içi taksit."
  });

  // 3. Project Media Vault Add State
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [newMediaForm, setNewMediaForm] = useState({
    name: "",
    type: "masterplan",
    size: "18.5 MB",
    category: "Masterplan & Kat Planları",
    url: "https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM"
  });

  // 4. Unit & Price Management State (Add Unit + Inline Price Edit + Bulk % Price Update)
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

  // Comparison state (Default: Mykonos Homes vs Aloha Beach Resort)
  const [compareLeftId, setCompareLeftId] = useState<number>(0);
  const [compareRightId, setCompareRightId] = useState<number>(0);
  const [simulatorPriceGbp, setSimulatorPriceGbp] = useState<number>(215000);

  // Filters for Inventory
  const [unitStatusFilter, setUnitStatusFilter] = useState<string>("all");
  const [unitSearch, setUnitSearch] = useState<string>("");

  // 5. User Definitions: Internal Staff (8-10) vs External B2B Agencies (1000+) + Multilingual & Country Desk CRM
  const [uiLang, setUiLang] = useState<"TR" | "EN" | "RU" | "DE" | "FA" | "AR">("TR");
  const [authSubMode, setAuthSubMode] = useState<"external_agencies" | "internal_staff">("external_agencies");
  const [agencyRegionFilter, setAgencyRegionFilter] = useState<string>("all");
  const [agencyTierFilter, setAgencyTierFilter] = useState<string>("all");
  const [agencyDeskFilter, setAgencyDeskFilter] = useState<string>("all");
  const [agencySourceFilter, setAgencySourceFilter] = useState<"all" | "master_pool" | "operator_reverse_feed">("all");
  const [agencySearch, setAgencySearch] = useState<string>("");

  const [isNewAgencyOpen, setIsNewAgencyOpen] = useState(false);
  const [newAgencyForm, setNewAgencyForm] = useState({
    company_name: "",
    broker_name: "",
    country: "KKTC",
    city_region: "Girne & Esentepe",
    email: "",
    phone: "",
    tier: "Gold",
    commission_rate: 8,
    bonus_commission_rate: 2,
    spoken_languages: ["TR", "EN"] as string[],
    assigned_desk: "Girne & İstanbul Merkez Masası (TR/EN)",
    crm_stage: "active_partner",
    preferred_contract_lang: "TR-EN",
    last_meeting_note: ""
  });

  const [isNewStaffOpen, setIsNewStaffOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    full_name: "",
    title_role: "Bölgesel Satış & Acente Yöneticisi",
    department: "Bölgesel Acente Yönetimi",
    email: "",
    phone: "+90 548 860 00 09",
    assigned_regions: "KKTC, Türkiye, İngiltere & Avrupa"
  });

  // 6. Launch Event Add Form
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    title: "",
    event_type: "launch_party",
    project_name: "Mykonos Homes",
    event_date: "2026-07-10 19:30",
    location: "Esentepe Sahil — Satış & Lansman Merkezi, KKTC",
    target_regions: "Tüm Global Partner Acenteler",
    media_preview_url: "HAWAII OPENING PARTY.mp4",
    max_capacity: 200,
    description: ""
  });

  // External B2B Agency Portal Live Preview / Login state
  const [portalAgencyCode, setPortalAgencyCode] = useState("AG-KKTC-101");
  const [portalPin, setPortalPin] = useState("2026");
  const [loggedInB2BAgency, setLoggedInB2BAgency] = useState<any | null>(null);
  const [b2bLeadForm, setB2bLeadForm] = useState({
    request_type: "lead_protection",
    project_name: "Mykonos Homes",
    unit_code: "C-02 (1+1 Swim-Up Suite)",
    investor_name: "",
    investor_nationality: "İngiltere (UK)",
    investor_phone_masked: "+44 7700 *** 420",
    budget_gbp: 215000,
    notes: ""
  });

  const activeCompany = companies[0] || null;
  const companyDisplayName =
    activeCompany?.company_name ||
    branding?.store_name ||
    branding?.name ||
    "Cyprus Constructions & Developer Group";

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchOverview = async (overrideDeveloperStoreId?: number | null) => {
    setLoading(true);
    try {
      const sid = storeId || user?.store_id || 1;
      const targetDevId = overrideDeveloperStoreId !== undefined ? overrideDeveloperStoreId : selectedDeveloperStoreId;
      const queryUrl = targetDevId
        ? `/api/developer-projects/overview?store_id=${sid}&developer_store_id=${targetDevId}`
        : `/api/developer-projects/overview?store_id=${sid}`;
      const res = await fetch(queryUrl, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Veri yüklenemedi");
      const data = await res.json();
      const loadedNetworkStores = Array.isArray(data.networkDeveloperStores) ? data.networkDeveloperStores : [];
      const loadedCompanies = Array.isArray(data.companies) ? data.companies : [];
      const loadedProjects = Array.isArray(data.projects) ? data.projects : [];
      setNetworkDeveloperStores(loadedNetworkStores);
      if (data.activeDeveloperStoreId && !selectedDeveloperStoreId) {
        setSelectedDeveloperStoreId(Number(data.activeDeveloperStoreId));
      }
      setCompanies(loadedCompanies);
      setProjects(loadedProjects);
      setUnits(Array.isArray(data.units) ? data.units : []);
      setAgencies(Array.isArray(data.agencies) ? data.agencies : []);
      setInternalStaff(Array.isArray(data.internalStaff) ? data.internalStaff : []);
      setRequests(Array.isArray(data.requests) ? data.requests : []);
      setEvents(Array.isArray(data.events) ? data.events : []);
      setDriveMeta(data.driveSyncMeta || null);

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

      if (Array.isArray(data.agencies) && data.agencies.length > 0 && !loggedInB2BAgency) {
        setLoggedInB2BAgency(data.agencies[0]);
      }
    } catch (err: any) {
      console.error("DeveloperProjectSuite fetch error:", err);
      toast.error("Proje yönetim verileri alınırken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [storeId]);

  const handleSyncGoogleDrive = async (customDriveUrl?: string) => {
    setSyncingDrive(true);
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/sync-drive", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          store_id: sid,
          driveFolderUrl:
            customDriveUrl ||
            driveMeta?.folderUrl ||
            "https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM"
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Google Drive çift yönlü senkronizasyon tamamlandı!");
        await fetchOverview();
      } else {
        toast.error(data.error || "Senkronizasyon başarısız");
      }
    } catch (e) {
      toast.error("Google Drive bağlantı hatası");
    } finally {
      setSyncingDrive(false);
    }
  };

  // Create or Update Construction Company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyForm.company_name.trim()) {
      toast.error("İnşaat firması unvanı zorunludur.");
      return;
    }
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/companies", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newCompanyForm, store_id: sid })
      });
      if (res.ok) {
        const created = await res.json();
        setCompanies(prev => [...prev, created]);
        setNewCompanyForm({
          company_name: "",
          headquarters_region: "Girne / Esentepe, KKTC",
          license_grade: "1. Sınıf Uluslararası Konut & Resort Geliştiricisi",
          contact_director: "",
          phone: "",
          email: "",
          drive_folder_url: "https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM",
          default_commission_rate: 8,
          lead_protection_days: 60,
          option_hold_hours: 72
        });
        toast.success(`${created.company_name} inşaat firması ve Google Drive veri havuzu tanımlandı!`);
      }
    } catch (err) {
      toast.error("İnşaat firması kaydedilemedi.");
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
      const url = editingProjectId
        ? `/api/developer-projects/projects/${editingProjectId}`
        : "/api/developer-projects/projects";
      const method = editingProjectId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...projectForm, store_id: sid })
      });
      if (res.ok) {
        const saved = await res.json();
        if (editingProjectId) {
          setProjects(prev => prev.map(p => (p.id === saved.id ? saved : p)));
          setActiveProjectDetail(saved);
          toast.success(`${saved.name} proje bilgileri ve fiyatları güncellendi!`);
        } else {
          setProjects(prev => [...prev, saved]);
          setActiveProjectDetail(saved);
          toast.success(`${saved.name} yeni proje olarak vitrine eklendi!`);
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
      folder_prefix: proj.folder_prefix || proj.name || "",
      region: proj.region || "Girne",
      sub_region: proj.sub_region || "Esentepe",
      concept_tagline: proj.concept_tagline || "",
      completion_date: proj.completion_date || "Q4 2027",
      construction_progress: Number(proj.construction_progress) || 50,
      total_units: Number(proj.total_units) || 120,
      available_units: Number(proj.available_units) || 50,
      starting_price: Number(proj.starting_price) || 155000,
      default_commission_rate: Number(proj.default_commission_rate) || 8,
      down_payment_percent: Number(proj.payment_plan?.down_payment_percent) || 35,
      installment_months: Number(proj.payment_plan?.installment_months) || 36,
      annual_rental_yield_percent: Number(proj.investment_metrics?.annual_rental_yield_percent) || 10,
      capital_appreciation_percent: Number(proj.investment_metrics?.capital_appreciation_percent) || 45,
      cover_image: proj.cover_image || "",
      payment_notes: proj.payment_plan?.notes || ""
    });
    setIsProjectFormOpen(true);
  };

  // Add / Remove Media in Project Data Room
  const handleAddMediaToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectDetail || !newMediaForm.name.trim()) {
      toast.error("Medya / Belge adı zorunludur.");
      return;
    }
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/projects/${activeProjectDetail.id}/media`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newMediaForm, store_id: sid })
      });
      if (res.ok) {
        const updatedProj = await res.json();
        setProjects(prev => prev.map(p => (p.id === updatedProj.id ? updatedProj : p)));
        setActiveProjectDetail(updatedProj);
        setIsAddMediaOpen(false);
        setNewMediaForm({
          name: "",
          type: "masterplan",
          size: "18.5 MB",
          category: "Masterplan & Kat Planları",
          url: "https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM"
        });
        toast.success("Yeni medya/belge proje veri odasına eklendi!");
      }
    } catch (err) {
      toast.error("Medya eklenemedi.");
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
        toast.success("Medya kaydı silindi.");
      }
    } catch (err) {
      toast.error("Medya silinemedi.");
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
        toast.success(`${created.unit_number} ünitesi canlı stok matrisine eklendi!`);
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
        toast.success(
          `Ünite durumu '${newStatus.toUpperCase()}' olarak güncellendi ve tüm B2B acente ekranlarına yansıtıldı.`
        );
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
        toast.success(`Ünite fiyatı £${new Intl.NumberFormat("tr-TR").format(newPrice)} olarak güncellendi!`);
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
        toast.success(data.message || "Toplu fiyat güncellemesi tamamlandı!");
        await fetchOverview();
      } else {
        toast.error(data.error || "Toplu fiyat güncellenemedi.");
      }
    } catch (err) {
      toast.error("Toplu fiyat güncelleme hatası.");
    }
  };

  // Internal Staff & External Agency Handlers
  const handleCreateInternalStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.full_name.trim()) {
      toast.error("Yönetici adı soyadı zorunludur.");
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
          title_role: "Bölgesel Satış & Acente Yöneticisi",
          department: "Bölgesel Acente Yönetimi",
          email: "",
          phone: "+90 548 860 00 09",
          assigned_regions: "KKTC, Türkiye, İngiltere & Avrupa"
        });
        toast.success(`${created.full_name} iç proje yönetim ekibine eklendi!`);
      }
    } catch (err) {
      toast.error("İç yönetici eklenemedi.");
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
        toast.success("Yönetici kaydı silindi.");
      }
    } catch (err) {
      toast.error("Silinemedi.");
    }
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgencyForm.company_name.trim() || !newAgencyForm.broker_name.trim()) {
      toast.error("Lütfen Emlak Ofisi Adı ve Yetkili Broker adını girin.");
      return;
    }
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/agencies", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newAgencyForm, store_id: sid })
      });
      if (res.ok) {
        const created = await res.json();
        setAgencies(prev => [created, ...prev]);
        setIsNewAgencyOpen(false);
        setNewAgencyForm({
          company_name: "",
          broker_name: "",
          country: "KKTC",
          city_region: "Girne & Esentepe",
          email: "",
          phone: "",
          tier: "Gold",
          commission_rate: 8,
          bonus_commission_rate: 2,
          spoken_languages: ["TR", "EN"],
          assigned_desk: "Girne & İstanbul Merkez Masası (TR/EN)",
          crm_stage: "active_partner",
          preferred_contract_lang: "TR-EN",
          last_meeting_note: ""
        });
        toast.success(
          created.reverseFedToGlobalPool
            ? `${created.company_name} eklendi ve LookPrice Merkezi Global Emlakçı Havuzuna otomatik geri beslendi! (Kod: ${created.agency_code} | PIN: ${created.access_pin})`
            : `${created.company_name} B2B ağına eklendi! Acente Kodu: ${created.agency_code} | PIN: ${created.access_pin}`
        );
      }
    } catch (e) {
      toast.error("Acente kaydedilemedi.");
    }
  };

  const handleUpdateAgencyField = async (agencyId: number, patch: any) => {
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/agencies/${agencyId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...patch, store_id: sid })
      });
      if (res.ok) {
        const updated = await res.json();
        setAgencies(prev => prev.map(a => (a.id === agencyId ? updated : a)));
        toast.success("Acente yetki/komisyon bilgisi güncellendi.");
      }
    } catch (err) {
      toast.error("Acente güncellenemedi.");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.title.trim()) {
      toast.error("Etkinlik / Lansman başlığı zorunludur.");
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
        setNewEventForm({
          title: "",
          event_type: "launch_party",
          project_name: "Mykonos Homes",
          event_date: "2026-07-10 19:30",
          location: "Esentepe Sahil — Satış & Lansman Merkezi, KKTC",
          target_regions: "Tüm Global Partner Acenteler",
          media_preview_url: "HAWAII OPENING PARTY.mp4",
          max_capacity: 200,
          description: ""
        });
        toast.success("Yeni lansman / Inspection Trip etkinliği takvime eklendi!");
      }
    } catch (err) {
      toast.error("Etkinlik eklenemedi.");
    }
  };

  const handleRequestStatusChange = async (reqId: number, status: string) => {
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch(`/api/developer-projects/requests/${reqId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ store_id: sid, status })
      });
      if (res.ok) {
        const updated = await res.json();
        setRequests(prev => prev.map(r => (r.id === reqId ? { ...r, ...updated } : r)));
        toast.success(
          `Talep durumu güncellendi: ${status === "approved" ? "Onaylandı & Zimmetlendi" : "Reddedildi"}`
        );
      }
    } catch (e) {
      toast.error("Talep güncellenemedi.");
    }
  };

  const handleB2BPortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/b2b-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: sid,
          agencyCode: portalAgencyCode,
          accessPin: portalPin
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Giriş başarısız");
        return;
      }
      setLoggedInB2BAgency(data.agency);
      toast.success(`Hoş geldiniz: ${data.agency.company_name} (${data.agency.tier} Partner)`);
    } catch (err) {
      toast.error("B2B Portal girişi sırasında hata oluştu.");
    }
  };

  const handleB2BSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!b2bLeadForm.investor_name.trim()) {
      toast.error("Yatırımcı / Müşteri adı zorunludur.");
      return;
    }
    try {
      const sid = storeId || user?.store_id || 1;
      const res = await fetch("/api/developer-projects/b2b-portal/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...b2bLeadForm,
          store_id: sid,
          agency_id: loggedInB2BAgency?.id,
          agency_name: loggedInB2BAgency?.company_name || "Partner Emlak Ofisi",
          agency_country: loggedInB2BAgency?.country || "KKTC"
        })
      });
      if (res.ok) {
        const created = await res.json();
        setRequests(prev => [created, ...prev]);
        setB2bLeadForm(prev => ({ ...prev, investor_name: "", notes: "" }));
        toast.success(
          "Müşteri Zimmetleme (60 Gün Lead Koruma) & Opsiyon talebiniz İnşaat Yönetimine iletildi!"
        );
      }
    } catch (err) {
      toast.error("Talep gönderilemedi.");
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

  const filteredAgencies = useMemo(() => {
    return agencies.filter(a => {
      if (agencyRegionFilter !== "all" && a.country !== agencyRegionFilter) return false;
      if (agencyTierFilter !== "all" && a.tier !== agencyTierFilter) return false;
      if (agencyDeskFilter !== "all" && (a.assigned_desk || "") !== agencyDeskFilter) return false;
      if (agencySourceFilter !== "all" && (a.source_origin || "master_pool") !== agencySourceFilter) return false;
      if (agencySearch.trim()) {
        const q = agencySearch.toLowerCase();
        const match =
          a.company_name?.toLowerCase().includes(q) ||
          a.broker_name?.toLowerCase().includes(q) ||
          a.agency_code?.toLowerCase().includes(q) ||
          a.city_region?.toLowerCase().includes(q) ||
          a.assigned_desk?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [agencies, agencyRegionFilter, agencyTierFilter, agencyDeskFilter, agencySourceFilter, agencySearch]);

  const compareLeft = useMemo(
    () => projects.find(p => p.id === Number(compareLeftId)) || projects[1] || projects[0],
    [projects, compareLeftId]
  );
  const compareRight = useMemo(
    () => projects.find(p => p.id === Number(compareRightId)) || projects[3] || projects[0],
    [projects, compareRightId]
  );

  const uniqueAgencyCountries = useMemo(
    () => Array.from(new Set(agencies.map(a => a.country).filter(Boolean))),
    [agencies]
  );

  const totalPortfolioUnits = useMemo(
    () => projects.reduce((acc, p) => acc + (Number(p.total_units) || 0), 0),
    [projects]
  );
  const totalAvailableUnits = useMemo(
    () => projects.reduce((acc, p) => acc + (Number(p.available_units) || 0), 0),
    [projects]
  );
  const totalB2BSalesVolume = useMemo(
    () => agencies.reduce((acc, a) => acc + (Number(a.total_sales_volume_gbp) || 0), 0),
    [agencies]
  );

  const formatGbp = (val: any) => {
    const num = Number(val) || 0;
    return `£${new Intl.NumberFormat("tr-TR").format(num)}`;
  };

  const handlePrintComparisonSheet = () => {
    if (!compareLeft || !compareRight) return;
    const win = window.open("", "_blank");
    if (!win) return;

    const lp = compareLeft.payment_plan || {};
    const rp = compareRight.payment_plan || {};
    const li = compareLeft.investment_metrics || {};
    const ri = compareRight.investment_metrics || {};

    const leftDown = Math.round((simulatorPriceGbp * (lp.down_payment_percent || 35)) / 100);
    const rightDown = Math.round((simulatorPriceGbp * (rp.down_payment_percent || 35)) / 100);
    const leftMonthly = Math.round(
      (simulatorPriceGbp - leftDown) / Math.max(1, Number(lp.installment_months) || 24)
    );
    const rightMonthly = Math.round(
      (simulatorPriceGbp - rightDown) / Math.max(1, Number(rp.installment_months) || 48)
    );

    win.document.write(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <title>${compareLeft.name} vs ${compareRight.name} — Yatırım & Ödeme Planı Karşılaştırma Raporu</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 12px; }
          .header { background: #0f172a; color: #fff; padding: 16px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { margin: 0; font-size: 18px; letter-spacing: -0.3px; }
          .header p { margin: 4px 0 0; font-size: 11px; color: #cbd5e1; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #cbd5e1; padding: 9px 12px; text-align: left; vertical-align: top; }
          th { background: #f1f5f9; font-weight: 800; text-transform: uppercase; font-size: 11px; }
          .highlight { background: #eef2ff; font-weight: 700; color: #312e81; }
          .footer { margin-top: 18px; padding-top: 10px; border-top: 2px solid #0f172a; display: flex; justify-content: space-between; font-size: 10px; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${companyDisplayName} — Kurumsal Yatırım & Ödeme Planı Karşılaştırması</h1>
            <p>${compareLeft.name} vs ${compareRight.name} • Örnek Yatırım Tutarı: £${new Intl.NumberFormat("tr-TR").format(simulatorPriceGbp)}</p>
          </div>
          <div style="text-align:right;font-size:11px;">
            <strong>Tarih:</strong> ${new Date().toLocaleDateString("tr-TR")}<br/>
            <span>Global B2B Yatırımcı Sunumu</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:26%;">Kriter / Parametre</th>
              <th style="width:37%;">${compareLeft.name} (${compareLeft.sub_region})</th>
              <th style="width:37%;">${compareRight.name} (${compareRight.sub_region})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Konsept & Mimari</strong></td>
              <td>${compareLeft.concept_tagline}</td>
              <td>${compareRight.concept_tagline}</td>
            </tr>
            <tr>
              <td><strong>Teslim Tarihi & İnşaat</strong></td>
              <td>${compareLeft.completion_date} (%${compareLeft.construction_progress} Tamamlandı)</td>
              <td>${compareRight.completion_date} (%${compareRight.construction_progress} Tamamlandı)</td>
            </tr>
            <tr>
              <td><strong>Başlangıç Fiyatı</strong></td>
              <td class="highlight">£${new Intl.NumberFormat("tr-TR").format(compareLeft.starting_price)}</td>
              <td class="highlight">£${new Intl.NumberFormat("tr-TR").format(compareRight.starting_price)}</td>
            </tr>
            <tr>
              <td><strong>Peşinat Oranı & Tutarı</strong></td>
              <td>%${lp.down_payment_percent || 35} (£${new Intl.NumberFormat("tr-TR").format(leftDown)})</td>
              <td>%${rp.down_payment_percent || 35} (£${new Intl.NumberFormat("tr-TR").format(rightDown)})</td>
            </tr>
            <tr>
              <td><strong>Faizsiz Taksit Vadesi</strong></td>
              <td class="highlight">${lp.installment_months || 24} Ay (%0 Faiz) — Aylık ~£${new Intl.NumberFormat("tr-TR").format(leftMonthly)}</td>
              <td class="highlight">${rp.installment_months || 48} Ay (%0 Faiz) — Aylık ~£${new Intl.NumberFormat("tr-TR").format(rightMonthly)}</td>
            </tr>
            <tr>
              <td><strong>Ödeme Planı Özeti</strong></td>
              <td>${lp.notes || "-"}</td>
              <td>${rp.notes || "-"}</td>
            </tr>
            <tr>
              <td><strong>Yıllık Döviz Kira Getirisi (ROI)</strong></td>
              <td><strong>%${li.annual_rental_yield_percent || 9.8}</strong> (Doluluk: %${li.short_term_occupancy_percent || 85})</td>
              <td><strong>%${ri.annual_rental_yield_percent || 11.2}</strong> (Doluluk: %${ri.short_term_occupancy_percent || 86})</td>
            </tr>
            <tr>
              <td><strong>Tahmini Değer Artışı (Teslime Kadar)</strong></td>
              <td>+%${li.capital_appreciation_percent || 38} Sermaye Artışı</td>
              <td>+%${ri.capital_appreciation_percent || 55} Erken Lansman Sermaye Artışı</td>
            </tr>
            <tr>
              <td><strong>Hedef Yatırımcı Profili</strong></td>
              <td>${li.target_buyer_profile || "-"}</td>
              <td>${ri.target_buyer_profile || "-"}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <span>${companyDisplayName} • Resmi Proje Veri Odası & B2B Acente Sistemi</span>
          <span>Google Drive Entegre Bulut Yedekleme Aktif</span>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const handlePrintB2BContract = (agency: any) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const contractLang = agency.preferred_contract_lang || (uiLang === "RU" ? "EN-RU" : uiLang === "DE" ? "EN-DE" : "TR-EN");
    const isRu = contractLang === "EN-RU" || (agency.spoken_languages || []).includes("RU");
    const isDe = contractLang === "EN-DE" || (agency.spoken_languages || []).includes("DE");

    const secondaryHeader = isRu
      ? "МЕЖДУНАРОДНЫЙ АГЕНТСКИЙ ДОГОВОР И СОГЛАШЕНИЕ О КОМИССИИ (RU)"
      : isDe
      ? "INTERNATIONALER MAKLER- UND PROVISIONSVERTRAG (DE)"
      : "INTERNATIONAL B2B BROKERAGE & COMMISSION AGREEMENT (EN)";

    const secondaryArt1 = isRu
      ? `Настоящий договор регулирует маркетинг проектов застройщика (${companyDisplayName}), защиту клиентов (Lead Protection на 60 дней) и выплату комиссии уполномоченному агентству в регионе ${agency.country} (${agency.city_region}).`
      : isDe
      ? `Dieser Vertrag regelt die Vermarktung der Wohn- und Resortprojekte des Bauträgers (${companyDisplayName}), den Kundenschutz (60 Tage Lead-Protection) sowie die Provisionsbedingungen in der Region ${agency.country} (${agency.city_region}).`
      : `This agreement governs the marketing of residential and resort projects developed by ${companyDisplayName}, 60-day client lead protection, and sales brokerage terms by the Authorized Agency in ${agency.country} (${agency.city_region}).`;

    const secondaryArt2 = isRu
      ? `Уполномоченному агентству выплачивается чистая комиссия ${agency.commission_rate}% от каждой подтвержденной продажи и бонус за выполнение плана +${agency.bonus_commission_rate}% в фунтах стерлингов (GBP £).`
      : isDe
      ? `Die autorisierte Agentur erhält eine Netto-Verkaufsprovision von ${agency.commission_rate}% sowie einen Quartals-Leistungsbonus von +${agency.bonus_commission_rate}% in britischen Pfund (GBP £).`
      : `The Authorized Agency shall receive a Net ${agency.commission_rate}% Sales Commission plus +${agency.bonus_commission_rate}% Quarterly Volume Bonus in GBP (£) upon contract signing and down payment receipt.`;

    win.document.write(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <title>Uluslararası Çift Dilli B2B Komisyon Sözleşmesi (${contractLang}) - ${agency.company_name}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.45; font-size: 11px; }
          .box { border: 2px solid #0f172a; padding: 16px; border-radius: 8px; }
          h1 { font-size: 14px; text-transform: uppercase; margin: 0 0 4px 0; text-align: center; }
          .sub { text-align: center; font-size: 10px; color: #475569; margin-bottom: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
          .card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; }
          h3 { font-size: 11px; margin: 8px 0 4px 0; text-transform: uppercase; color: #1e293b; }
          .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; padding-top: 14px; border-top: 1px dashed #94a3b8; }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>ULUSLARARASI ÇİFT DİLLİ B2B YETKİLENDİRME VE KOMİSYON SÖZLEŞMESİ (${contractLang})</h1>
          <div class="sub">
            Sözleşme No: B2B-${agency.agency_code}-2026 • Temsilcilik Masası: ${agency.assigned_desk || "Global Desk"} • Konuşulan Diller: ${(agency.spoken_languages || ["TR", "EN"]).join(" / ")} • Tarih: ${new Date().toLocaleDateString("tr-TR")}
          </div>
          <div class="grid">
            <div class="card">
              <strong>1. DEVELOPER / PROJE ÜRETİCİSİ FİRMA:</strong><br/>
              Unvan: ${companyDisplayName}<br/>
              Projeler: ${projects.map(p => p.name).join(", ")}<br/>
              Sorumlu CRM Yöneticisi: ${agency.assigned_crm_manager || "Global Satış Direktörlüğü"}
            </div>
            <div class="card">
              <strong>2. AUTHORIZED AGENCY / YETKİLİ B2B ACENTE:</strong><br/>
              Ofis Unvanı: ${agency.company_name}<br/>
              Yetkili Broker: ${agency.broker_name} (${agency.agency_code})<br/>
              Ülke / Bölge: ${agency.country} — ${agency.city_region}<br/>
              Segment & Komisyon: ${agency.tier} Partner (%${agency.commission_rate} + %${agency.bonus_commission_rate} Bonus)
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <h3>TÜRKÇE / İNGİLİZCE ANA METİN</h3>
              <p><strong>MADDE 1 (Bölgesel Yetki & Zimmet):</strong> İşbu sözleşme, Proje Üreticisi tarafından geliştirilen konut ve resort projelerinin, Yetkili Acente tarafından <strong>${agency.country} (${agency.city_region})</strong> bölgesinde pazarlanması ve <strong>60 Gün Müşteri Zimmetleme (Lead Lock)</strong> koşullarını düzenler.</p>
              <p><strong>MADDE 2 (Komisyon & Ödeme):</strong> Yetkili Acente'ye her kesin satış üzerinden <strong>Net %${agency.commission_rate} Satış Komisyonu</strong> ve çeyrek dönem kotası aşımında <strong>+%${agency.bonus_commission_rate} Bonus</strong> GBP (£) cinsinden ödenir.</p>
            </div>
            <div class="card">
              <h3>${secondaryHeader}</h3>
              <p><strong>ARTICLE 1 (Territory & Lead Protection):</strong> ${secondaryArt1}</p>
              <p><strong>ARTICLE 2 (Commission & Payout Schedule):</strong> ${secondaryArt2}</p>
            </div>
          </div>

          <div class="sig">
            <div>
              <strong>PROJE ÜRETİCİSİ / DEVELOPER</strong><br/>
              ${companyDisplayName}<br/>
              Temsilcilik: ${agency.assigned_desk || "Global Satış Direktörlüğü"}<br/><br/>
              İmza / Kaşe: ___________________________
            </div>
            <div>
              <strong>YETKİLİ EMLAK ACENTESİ / BROKER PARTNER</strong><br/>
              ${agency.company_name} (${agency.broker_name})<br/>
              B2B Portal Kodu: ${agency.agency_code}<br/><br/>
              İmza / Dijital Onay: ___________________________
            </div>
          </div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const handlePrintWhiteLabelOffer = (proj: any, agencyOverride?: any) => {
    const win = window.open("", "_blank", "width=940,height=920");
    if (!win) {
      toast.error("Tarayıcı açılır pencereyi engelledi.");
      return;
    }
    const partnerAgency = agencyOverride || b2bSession || agencies[0] || {
      company_name: developerBrandName,
      broker_name: "International Investment Desk",
      country: "KKTC / Global",
      phone: "+90 548 888 00 00",
      email: "vip@investmentdesk.com",
      agency_code: "VIP-DIRECT"
    };
    const basePrice = Number(proj.starting_price) || 145000;
    const downPct = Number(proj.down_payment_pct) || 35;
    const months = Number(proj.installment_months) || 36;
    const downAmount = Math.round((basePrice * downPct) / 100);
    const remainAmount = basePrice - downAmount;
    const monthlyAmount = months > 0 ? Math.round(remainAmount / months) : 0;

    // Closing costs (KKTC standard: 5% VAT, £3,000 Transformer Fee, 0.5% Stamp Duty, 6% Title Deed Transfer)
    const vat5 = Math.round(basePrice * 0.05);
    const stampDuty = Math.round(basePrice * 0.005);
    const transformerFee = 3000;
    const titleDeed6 = Math.round(basePrice * 0.06);

    const labelsByLang: Record<string, any> = {
      TR: {
        badge: "RESMİ YATIRIMCI TEKLİF & ÖDEME PLANI FORMU (WHITE-LABEL)",
        sub: "Yetkili B2B Partner Sunumu — 0% Faizli Lansman Finansmanı & Tapu Masraf Tablosu",
        projTitle: "PROJE & KONSEPT ÖZETİ",
        finTitle: "0% FAİZLİ ÖDEME PLANI SİMÜLASYONU",
        costTitle: "KKTC YASALVERGİ & EK MALİYET TABLOSU (CLOSING COSTS)",
        baseLabel: "Lansman Liste Başlangıç Fiyatı",
        downLabel: `Peşinat (%${downPct} Sözleşme Tarihinde)`,
        remLabel: `Kalan Ana Para (%${100 - downPct} Sıfır Faiz)`,
        monLabel: `Aylık Taksit (${months} Ay Boyunca)`,
        vatLabel: "KDV (%5 — Anahtar Tesliminde)",
        stampLabel: "Sözleşme Damga Pul Vergisi (%0.5 — İmza Anında)",
        trafoLabel: "Altyapı / Trafo / Su Bağlantı Katkı Payı",
        deedLabel: "Koçan (Tapu) Devir Harcı (%6 — Tapu Devrinde)",
        roiLabel: "Yıllık Döviz Kira Getirisi & Değer Artış Projeksiyonu",
        footerNote: "Bu teklif formu seçilen dilde yatırımcı bilgilendirmesi amacıyla hazırlanmıştır. Fiyatlar GBP (İngiliz Sterlini) bazındadır."
      },
      EN: {
        badge: "OFFICIAL INVESTOR PROPOSAL & PAYMENT SCHEDULE (WHITE-LABEL)",
        sub: "Authorized B2B Partner Presentation — 0% Interest Developer Finance & Closing Costs",
        projTitle: "PROJECT & ARCHITECTURAL SUMMARY",
        finTitle: "0% INTEREST PAYMENT PLAN SIMULATION",
        costTitle: "NORTH CYPRUS STATUTORY CLOSING COSTS & TAXES",
        baseLabel: "Launch Starting List Price",
        downLabel: `Down Payment (${downPct}% Upon Signing Contract)`,
        remLabel: `Remaining Balance (${100 - downPct}% at 0% Interest)`,
        monLabel: `Monthly Installment (${months} Months Equal)`,
        vatLabel: "VAT (5% — Payable on Key Handover)",
        stampLabel: "Contract Stamp Duty (0.5% — Upon Registration)",
        trafoLabel: "Infrastructure / Transformer & Utility Connection Fee",
        deedLabel: "Title Deed Transfer Tax (6% — Upon Title Transfer)",
        roiLabel: "Projected Annual Foreign Currency Rental Yield & Appreciation",
        footerNote: "Prepared exclusively for international investor presentation. All figures are denominated in British Pounds Sterling (GBP)."
      },
      RU: {
        badge: "ИНВЕСТИЦИОННОЕ ПРЕДЛОЖЕНИЕ И ГРАФИК ПЛАТЕЖЕЙ (WHITE-LABEL)",
        sub: "Официальная презентация партнера — Беспроцентная рассрочка 0% и налоги Северного Кипра",
        projTitle: "ОПИСАНИЕ ПРОЕКТА И ИНФРАСТРУКТУРЫ",
        finTitle: "ГРАФИК ПЛАТЕЖЕЙ (РАССРОЧКА 0% ОТ ЗАСТРОЙЩИКА)",
        costTitle: "ДОПОЛНИТЕЛЬНЫЕ НАЛОГИ И СБОРЫ ПРИ ОФОРМЛЕНИИ (ККТС)",
        baseLabel: "Стартовая стоимость объекта",
        downLabel: `Первоначальный взнос (${downPct}% при подписании)`,
        remLabel: `Остаток суммы (${100 - downPct}% под 0% годовых)`,
        monLabel: `Ежемесячный платеж (на ${months} мес.)`,
        vatLabel: "НДС (5% — при получении ключей)",
        stampLabel: "Гербовый сбор (0.5% — при регистрации договора)",
        trafoLabel: "Инфраструктурный сбор (трансформатор и коммуникации)",
        deedLabel: "Налог на перевод титула (6% — при оформлении Тапу)",
        roiLabel: "Прогнозируемая доходность от аренды в валюте (GBP)",
        footerNote: "Данное коммерческое предложение сформировано в системе B2B для презентации инвестору. Все расчеты в фунтах стерлингов (GBP)."
      },
      DE: {
        badge: "OFFIZIELLES INVESTORENANGEBOT & ZAHLUNGSPLAN (WHITE-LABEL)",
        sub: "Autorisierte Partnerpräsentation — Zinsfreie Bauträgerfinanzierung (0%) & Kaufnebenkosten",
        projTitle: "PROJEKT- & ARCHITEKTURÜBERSICHT",
        finTitle: "ZINSFREIE ZAHLUNGSPLAN-SIMULATION (0% ZINSEN)",
        costTitle: "GESETZLICHE KAUFNEBENKOSTEN & STEUERN (NORDZYPERN)",
        baseLabel: "Start-Listenpreis (Launch-Preis)",
        downLabel: `Anzahlung (${downPct}% bei Vertragsunterzeichnung)`,
        remLabel: `Restbetrag (${100 - downPct}% zinsfrei)`,
        monLabel: `Monatliche Rate (${months} Monate Laufzeit)`,
        vatLabel: "MwSt. / VAT (5% — bei Schlüsselübergabe)",
        stampLabel: "Stempelsteuer (0.5% — bei Vertragsregistrierung)",
        trafoLabel: "Infrastruktur- & Transformatorgebühr (Trafo)",
        deedLabel: "Grundbuchübertragungssteuer (6% — bei Titelübertragung)",
        roiLabel: "Erwartete jährliche Mietrendite in GBP & Wertsteigerung",
        footerNote: "Dieses Exposé wurde für internationale Investoren erstellt. Alle Preisangaben verstehen sich in Britischen Pfund (GBP)."
      }
    };

    const L = labelsByLang[uiLang] || labelsByLang.EN;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>White-Label Offer - ${proj.name} (${uiLang})</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #fff; }
          .sheet { border: 2px solid #0f172a; border-radius: 12px; padding: 22px; max-width: 860px; margin: 0 auto; }
          .hdr { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px; }
          .badge { display: inline-block; background: #4f46e5; color: #fff; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 999px; letter-spacing: 0.06em; }
          .title { font-size: 20px; font-weight: 900; margin: 6px 0 2px; color: #0f172a; }
          .sub { font-size: 11px; color: #475569; font-weight: 600; }
          .hero { display: grid; grid-template-columns: 240px 1fr; gap: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; margin-bottom: 16px; }
          .hero img { width: 100%; height: 155px; object-fit: cover; border-radius: 8px; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
          .card h4 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          .row { display: flex; justify-content: space-between; font-size: 11.5px; padding: 5px 0; border-bottom: 1px dashed #e2e8f0; }
          .row strong { font-weight: 800; color: #0f172a; }
          .ftr { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #fff; border-radius: 8px; padding: 12px 16px; margin-top: 14px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="hdr">
            <div>
              <span class="badge">${L.badge} • [${uiLang}]</span>
              <div class="title">${proj.name} — ${proj.region} / ${proj.sub_region}</div>
              <div class="sub">${L.sub}</div>
            </div>
            <div style="text-align:right;font-size:11px;">
              <strong style="font-size:13px;color:#312e81;">${partnerAgency.company_name}</strong><br/>
              ${partnerAgency.broker_name} (${partnerAgency.country})<br/>
              ${partnerAgency.phone || ""} • ${partnerAgency.email || ""}<br/>
              <span style="font-size:10px;color:#64748b;">Tarih: ${new Date().toLocaleDateString("tr-TR")}</span>
            </div>
          </div>

          <div class="hero">
            <img src="${proj.cover_image}" alt="${proj.name}" />
            <div>
              <div style="font-size:11px;font-weight:800;color:#4f46e5;text-transform:uppercase;">${L.projTitle}</div>
              <div style="font-size:13px;font-weight:800;margin:4px 0;">${proj.concept_tagline || ""}</div>
              <div style="font-size:11px;color:#334155;line-height:1.45;margin-bottom:8px;">
                <strong>Teslim Tarihi:</strong> ${proj.completion_date} &nbsp;|&nbsp;
                <strong>Denize Mesafe:</strong> ${proj.distance_to_sea} &nbsp;|&nbsp;
                <strong>Tapu (Title Deed):</strong> ${proj.deed_type}
              </div>
              <div style="font-size:11px;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;padding:6px 10px;border-radius:6px;font-weight:700;">
                📈 ${L.roiLabel}: %${proj.rental_yield_pct} GBP Kira Getirisi • ${proj.roi_estimate || ""}
              </div>
            </div>
          </div>

          <div class="grid2">
            <div class="card">
              <h4>💳 ${L.finTitle}</h4>
              <div class="row"><span>${L.baseLabel}</span><strong>£${basePrice.toLocaleString("en-GB")} GBP</strong></div>
              <div class="row"><span>${L.downLabel}</span><strong style="color:#047857;">£${downAmount.toLocaleString("en-GB")} GBP</strong></div>
              <div class="row"><span>${L.remLabel}</span><strong>£${remainAmount.toLocaleString("en-GB")} GBP</strong></div>
              <div class="row"><span>${L.monLabel}</span><strong style="color:#4f46e5;">£${monthlyAmount.toLocaleString("en-GB")} GBP / Ay</strong></div>
              <div style="font-size:10.5px;color:#475569;margin-top:6px;">Not: ${proj.payment_plan_summary || ""}</div>
            </div>

            <div class="card">
              <h4>⚖️ ${L.costTitle}</h4>
              <div class="row"><span>${L.stampLabel}</span><strong>£${stampDuty.toLocaleString("en-GB")} GBP</strong></div>
              <div class="row"><span>${L.vatLabel}</span><strong>£${vat5.toLocaleString("en-GB")} GBP</strong></div>
              <div class="row"><span>${L.trafoLabel}</span><strong>£${transformerFee.toLocaleString("en-GB")} GBP</strong></div>
              <div class="row"><span>${L.deedLabel}</span><strong>£${titleDeed6.toLocaleString("en-GB")} GBP</strong></div>
              <div style="font-size:10px;color:#64748b;margin-top:6px;">* Vergi ve harçlar KKTC resmi mevzuatına göre anahtar/koçan teslim aşamalarında ödenir.</div>
            </div>
          </div>

          <div class="ftr">
            <div>
              <strong>YETKİLİ DANIŞMAN & PARTNER ACENTE (WHITE-LABEL SUNUM):</strong><br/>
              ${partnerAgency.company_name} — ${partnerAgency.broker_name} • Kod: ${partnerAgency.agency_code || "B2B-VIP"}
            </div>
            <div style="text-align:right;font-size:10px;color:#cbd5e1;max-width:340px;">
              ${L.footerNote}
            </div>
          </div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
        <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-black text-slate-700 uppercase">
          Proje Üreticisi & Global B2B Acente Komuta Merkezi Yükleniyor...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* SINGLE UNIFIED TOP COMMAND BAR (Rule 11 & Rule 12 Compliant) */}
      <div className="bg-slate-900 text-white rounded-xl p-2.5 border border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {onBackToPortfolio && (
              <button
                type="button"
                onClick={onBackToPortfolio}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg text-[11px] font-black cursor-pointer transition-all"
              >
                ← Standart Portföy
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <span className="p-1.5 bg-cyan-500/20 border border-cyan-400/40 rounded-lg text-cyan-300">
                <Building2 className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-cyan-500 text-slate-950 rounded text-[9px] font-black uppercase">
                    {isStandaloneDeveloperStore ? "projectLP • İZOLE PROJE FİRMASI HESABI" : "projectLP ↔ REstateLP • GÖZLEMCİ-PAYDAŞ AĞI"}
                  </span>
                  <h2 className="text-xs sm:text-sm font-black tracking-tight text-white uppercase">
                    {companyDisplayName}
                  </h2>
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-black uppercase">
                    Google Drive & Paydaş Veri Havuzu Aktif
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium">
                  İzole Proje Firmaları ({Math.max(networkDeveloperStores.length, companies.length)}) • Projeler ({projects.length}) • İç Yönetim ({internalStaff.length} Yetkili) • Gözlemci-Paydaş Emlakçılar ({agencies.length} Aktif Ofis / 1.000+ Ölçek)
                </p>
              </div>
            </div>
          </div>

          {/* Right KPI Pills & Quick Management Triggers */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Multi-Language Working Selector for Multinational Staff, Country Desks & Agencies */}
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5">
              <Globe className="w-3 h-3 text-amber-300" />
              <span className="text-[9px] font-black text-slate-300 uppercase">Çalışma & Sözleşme Dili:</span>
              {(["TR", "EN", "RU", "DE", "FA", "AR"] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setUiLang(l);
                    toast.success(`Çalışma, Temsilcilik ve Sözleşme Dili "${l}" olarak ayarlandı.`);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black cursor-pointer transition-colors ${
                    uiLang === l ? "bg-amber-400 text-slate-950" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {networkDeveloperStores.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5">
                <span className="text-[9px] font-black text-cyan-300 uppercase">Proje Firması (projectLP):</span>
                <select
                  value={selectedDeveloperStoreId || ""}
                  onChange={e => {
                    const nextId = Number(e.target.value);
                    setSelectedDeveloperStoreId(nextId);
                    fetchOverview(nextId);
                    toast.success("Seçili İnşaat Proje Firması (projectLP) veri havuzu yüklendi.");
                  }}
                  className="bg-transparent text-white text-[10px] font-black outline-none cursor-pointer"
                >
                  {networkDeveloperStores.map(ns => (
                    <option key={ns.id} value={ns.id} className="bg-slate-900 text-white">
                      🏗️ {ns.name} (@{ns.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsCompanyManagerOpen(prev => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer border transition-all ${
                isCompanyManagerOpen
                  ? "bg-amber-400 text-slate-950 border-amber-300"
                  : "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>İnşaat Firmaları & Drive Havuzu ({companies.length})</span>
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
                  default_commission_rate: 8,
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
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Yeni Proje Ekle</span>
            </button>

            <button
              type="button"
              onClick={() => handleSyncGoogleDrive()}
              disabled={syncingDrive}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all shadow-xs disabled:opacity-50"
            >
              <FolderSync className={`w-3.5 h-3.5 ${syncingDrive ? "animate-spin" : ""}`} />
              <span>{syncingDrive ? "Drive Eşitleniyor..." : "Google Drive Eşitle"}</span>
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE CONSTRUCTION COMPANY & GOOGLE DRIVE POOL MANAGER */}
        {isCompanyManagerOpen && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 uppercase">
                Sisteme Kayıtlı Proje Üreticisi İnşaat Firmaları & Google Drive Veri Havuzları
              </span>
              <button
                type="button"
                onClick={() => setIsCompanyManagerOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Kapat</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {companies.map(c => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded text-[9px] font-mono font-black">
                        {c.company_code}
                      </span>
                      <strong className="text-white truncate">{c.company_name}</strong>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      {c.headquarters_region} • {c.license_grade} • Komisyon: %{c.default_commission_rate} • Zimmet:{" "}
                      {c.lead_protection_days} Gün
                    </div>
                    <div className="text-[10px] text-emerald-300 font-mono truncate mt-0.5">
                      Drive: {c.drive_folder_url}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSyncGoogleDrive(c.drive_folder_url)}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black shrink-0 cursor-pointer"
                  >
                    Drive Eşitle
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleCreateCompany}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2"
            >
              <input
                type="text"
                required
                placeholder="Yeni İnşaat Firması Unvanı *"
                value={newCompanyForm.company_name}
                onChange={e => setNewCompanyForm({ ...newCompanyForm, company_name: e.target.value })}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
              <input
                type="text"
                placeholder="Merkez Bölge (Örn: Girne / İskele)"
                value={newCompanyForm.headquarters_region}
                onChange={e =>
                  setNewCompanyForm({ ...newCompanyForm, headquarters_region: e.target.value })
                }
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
              <input
                type="text"
                placeholder="Satış Direktörü & Tel"
                value={newCompanyForm.contact_director}
                onChange={e => setNewCompanyForm({ ...newCompanyForm, contact_director: e.target.value })}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
              <input
                type="text"
                placeholder="Google Drive Klasör Linki"
                value={newCompanyForm.drive_folder_url}
                onChange={e => setNewCompanyForm({ ...newCompanyForm, drive_folder_url: e.target.value })}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black cursor-pointer"
              >
                + İnşaat Firması Tanımla
              </button>
            </form>
          </div>
        )}

        {/* COLLAPSIBLE CREATE / EDIT PROJECT FORM */}
        {isProjectFormOpen && (
          <form
            onSubmit={handleSaveProject}
            className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 uppercase">
                {editingProjectId
                  ? `Proje & Fiyat Planı Düzenle: ${projectForm.name}`
                  : "Yeni Konut / Resort Projesi Tanımla"}
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
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Drive Klasör Adı</label>
                <input
                  type="text"
                  value={projectForm.folder_prefix}
                  onChange={e => setProjectForm({ ...projectForm, folder_prefix: e.target.value })}
                  placeholder="Örn: 10. Santorini Homes"
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-bold">Bölge / Alt Bölge</label>
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
                  Peşinat % / Faizsiz Ay
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
                    className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-300 font-black"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={projectForm.concept_tagline}
                onChange={e => setProjectForm({ ...projectForm, concept_tagline: e.target.value })}
                placeholder="Proje Konsept Açıklaması"
                className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              />
              <input
                type="text"
                value={projectForm.payment_notes}
                onChange={e => setProjectForm({ ...projectForm, payment_notes: e.target.value })}
                placeholder="Ödeme Planı Detay Notu"
                className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black cursor-pointer"
                >
                  {editingProjectId ? "Proje Güncellemesini Kaydet" : "+ Projeyi Oluştur"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("showcase")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "showcase"
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "bg-slate-800/80 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>1. Proje Vitrini & Medya/Drive Yönetimi ({projects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "inventory"
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "bg-slate-800/80 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>2. Canlı Ünite & Fiyat Yönetimi ({units.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("compare")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "compare"
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "bg-slate-800/80 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>3. Mykonos vs Aloha Karşılaştırma Motoru</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("agencies")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "agencies"
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "bg-slate-800/80 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>4. İç Ekip ({internalStaff.length}) & Gözlemci-Paydaş Emlakçılar ({agencies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("leads_contracts")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "leads_contracts"
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "bg-slate-800/80 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>5. Müşteri Zimmetleme & Sözleşmeler ({requests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "events"
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "bg-slate-800/80 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>6. Lansman & Etkinlik Yönetimi ({events.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("b2b_portal_preview")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "b2b_portal_preview"
                ? "bg-cyan-400 text-slate-950 shadow-xs"
                : "bg-cyan-950/90 text-cyan-200 border border-cyan-700/60 hover:bg-cyan-900"
            }`}
          >
            <KeyRound className="w-3 h-3" />
            <span>★ Gözlemci-Paydaş Emlakçı Ekranı & REstateLP Köprüsü</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: PARLAK PROJE VİTRİNİ & GOOGLE DRIVE MEDYA YÖNETİMİ              */}
      {/* ===================================================================== */}
      {activeTab === "showcase" && (
        <div className="space-y-2.5">
          {/* 5 Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            {projects.map(proj => {
              const isSelected = activeProjectDetail?.id === proj.id;
              const soldPct = Math.round(
                ((Number(proj.sold_units) || 0) / Math.max(1, Number(proj.total_units) || 1)) * 100
              );
              return (
                <div
                  key={proj.id}
                  onClick={() => setActiveProjectDetail(proj)}
                  className={`rounded-xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "bg-slate-900 text-white border-amber-400 ring-2 ring-amber-400/50 shadow-md"
                      : "bg-white text-slate-900 border-slate-200 hover:border-indigo-400 shadow-2xs"
                  }`}
                >
                  <div>
                    <div className="relative h-28 w-full overflow-hidden bg-slate-800">
                      <img
                        src={proj.cover_image}
                        alt={proj.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-slate-900/90 text-amber-300 border border-amber-400/40 rounded text-[9px] font-mono font-black">
                        {proj.folder_prefix}
                      </span>
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black">
                        {proj.completion_date}
                      </span>
                      <div className="absolute bottom-1.5 left-2 right-2 flex items-end justify-between">
                        <div>
                          <h3 className="text-xs font-black text-white leading-tight">{proj.name}</h3>
                          <p className="text-[10px] text-slate-200 flex items-center gap-0.5">
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
                      <p
                        className={`text-[10px] line-clamp-2 font-medium ${
                          isSelected ? "text-slate-200" : "text-slate-600"
                        }`}
                      >
                        {proj.concept_tagline}
                      </p>

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
                    className={`px-2 py-1.5 border-t flex items-center justify-between text-[10px] font-black ${
                      isSelected
                        ? "border-slate-800 bg-slate-950/60 text-amber-300"
                        : "border-slate-100 bg-slate-50 text-indigo-700"
                    }`}
                  >
                    <span>Komisyon: %{proj.default_commission_rate}</span>
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

          {/* Active Project Deep-Dive Showcase & Interactive Media Vault Management */}
          {activeProjectDetail && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-slate-900 text-amber-300 rounded text-[10px] font-mono font-black">
                      {activeProjectDetail.project_code} • {activeProjectDetail.folder_prefix}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-950">
                      {activeProjectDetail.name} — Kurumsal Proje Vitrini & Medya Yönetimi
                    </h3>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px] font-black">
                      İnşaat İlerlemesi: %{activeProjectDetail.construction_progress}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{activeProjectDetail.concept_tagline}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <a
                    href={
                      activeProjectDetail.drive_folder_url ||
                      "https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 transition-all"
                    title="Projenin gerçek Google Drive klasörünü yeni sekmede aç"
                  >
                    <FolderSync className="w-3.5 h-3.5" />
                    <span>Drive Klasörünü Aç ({activeProjectDetail.folder_prefix})</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => openEditProject(activeProjectDetail)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-lg text-[11px] font-black cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Proje & Fiyat Planını Düzenle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(activeProjectDetail.id);
                      setActiveTab("inventory");
                    }}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black cursor-pointer flex items-center gap-1"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Ünite & Fiyat Matrisi ({activeProjectDetail.available_units} Müsait)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintWhiteLabelOffer(activeProjectDetail)}
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[11px] font-black cursor-pointer flex items-center gap-1"
                    title="Seçili dilde (TR/EN/RU/DE) KDV, Trafo ve Taksit Hesaplamalı White-Label Yatırımcı Teklifi"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>White-Label Yatırımcı Teklifi ({uiLang} PDF)</span>
                  </button>

                  {onConvertUnitToProperty && (
                    <button
                      type="button"
                      onClick={() => {
                        onConvertUnitToProperty({
                          title: `${activeProjectDetail.name} — Lansman Özel Portföy Ünitesi`,
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
                        toast.success(
                          `${activeProjectDetail.name} emlakçı portföy ilan formuna (restateLP) aktarıldı!`
                        );
                      }}
                      className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[11px] font-black cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Emlakçı Portföyüne (restateLP) Dönüştür</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Left 4 Cols: Architectural & Comfort Standards + Payment Summary */}
                <div className="lg:col-span-4 space-y-2.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                    <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ortak Mimari Özellikler & Konfor Standartları</span>
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

                  <div className="bg-indigo-950 text-white border border-indigo-900 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-amber-300 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Ödeme Planı & Yatırım Özeti</span>
                      </h4>
                      <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-black text-white">
                        %0 Faiz
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                      <div className="bg-white/10 rounded-lg p-1.5">
                        <div className="text-[9px] text-indigo-200 uppercase font-bold">Peşinat</div>
                        <div className="text-sm font-black text-white">
                          %{activeProjectDetail.payment_plan?.down_payment_percent || 35}
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-1.5">
                        <div className="text-[9px] text-indigo-200 uppercase font-bold">Faizsiz Vade</div>
                        <div className="text-sm font-black text-amber-300">
                          {activeProjectDetail.payment_plan?.installment_months || 36} Ay
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-1.5">
                        <div className="text-[9px] text-indigo-200 uppercase font-bold">Yıllık Kira ROI</div>
                        <div className="text-sm font-black text-emerald-300">
                          %{activeProjectDetail.investment_metrics?.annual_rental_yield_percent || 9.8}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-indigo-100 leading-relaxed pt-1">
                      {activeProjectDetail.payment_plan?.notes}
                    </p>
                  </div>
                </div>

                {/* Middle 4 Cols: Lifestyle Facilities Grouped by Expectation */}
                <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Yaşam Tarzı Beklentilerine Göre Tesis Olanakları</span>
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { key: "beach_marina", label: "1. Sahil, Deniz & Beach Club Yaşamı", badge: "bg-cyan-100 text-cyan-900" },
                      { key: "wellness_spa", label: "2. Sağlık, Wellness, Spa & Anti-Aging", badge: "bg-emerald-100 text-emerald-900" },
                      { key: "entertainment", label: "3. Sinema, Sosyal Kulüp & Eğlence", badge: "bg-purple-100 text-purple-900" },
                      { key: "gastronomy", label: "4. Gastronomi, Fine-Dining & Sunset Bar", badge: "bg-amber-100 text-amber-900" },
                      { key: "family_sports", label: "5. Aile, Raket Sporları & Aktif Yaşam", badge: "bg-indigo-100 text-indigo-900" }
                    ].map(group => {
                      const items: string[] = activeProjectDetail.lifestyle_facilities?.[group.key] || [];
                      if (!items.length) return null;
                      return (
                        <div key={group.key} className="bg-white border border-slate-200/80 rounded-lg p-2">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase mb-1 ${group.badge}`}
                          >
                            {group.label}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {items.map((it, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-bold"
                              >
                                • {it}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 4 Cols: Synced Google Drive Media & Document Vault CRUD */}
                <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between space-y-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Proje Medya & Belge Yönetimi</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddMediaOpen(prev => !prev)}
                        className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-black cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Medya / Belge Ekle</span>
                      </button>
                    </div>

                    {isAddMediaOpen && (
                      <form
                        onSubmit={handleAddMediaToProject}
                        className="p-2 bg-slate-900 text-white rounded-lg space-y-1.5 text-[11px]"
                      >
                        <div className="font-black text-amber-300 text-[10px] uppercase">
                          Veri Odasına Yeni Medya / Drive Dosyası Ekle
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Dosya Adı (Örn: Kat Planları 2026.pdf)"
                          value={newMediaForm.name}
                          onChange={e => setNewMediaForm({ ...newMediaForm, name: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <select
                            value={newMediaForm.type}
                            onChange={e => setNewMediaForm({ ...newMediaForm, type: e.target.value })}
                            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-[11px]"
                          >
                            <option value="masterplan">Masterplan & Kat Planı (PDF)</option>
                            <option value="pricelist">Fiyat Listesi (Excel/PDF)</option>
                            <option value="video">Tanıtım & Drone Videosu (MP4)</option>
                            <option value="photos">4K Render & Foto Paketi (ZIP)</option>
                            <option value="legal">İnşaat Ruhsatı & Koçan Belgesi</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Boyut (Örn: 24.5 MB)"
                            value={newMediaForm.size}
                            onChange={e => setNewMediaForm({ ...newMediaForm, size: e.target.value })}
                            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-[11px]"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Google Drive / Dosya Linki"
                          value={newMediaForm.url}
                          onChange={e => setNewMediaForm({ ...newMediaForm, url: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-[11px] font-mono"
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setIsAddMediaOpen(false)}
                            className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-[10px] font-bold cursor-pointer"
                          >
                            İptal
                          </button>
                          <button
                            type="submit"
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[10px] font-black cursor-pointer"
                          >
                            Kaydet
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-1.5">
                      {(activeProjectDetail.media_vault || []).map((doc: any) => (
                        <div
                          key={doc.id}
                          className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-2 hover:border-indigo-400 transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-slate-100 rounded-lg text-indigo-600 shrink-0">
                              {doc.type === "video" ? (
                                <Play className="w-3.5 h-3.5" />
                              ) : doc.type === "photos" ? (
                                <ImageIcon className="w-3.5 h-3.5" />
                              ) : (
                                <FileText className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-black text-slate-900 truncate">{doc.name}</div>
                              <div className="text-[9px] text-slate-500 font-bold">
                                {doc.category} • {doc.size}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={
                                doc.url ||
                                "https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM"
                              }
                              target="_blank"
                              rel="noreferrer"
                              onClick={() =>
                                toast.success(`${doc.name} B2B Acente indirme kaydı oluşturuldu.`)
                              }
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded text-[10px] font-black flex items-center gap-1 transition-all"
                            >
                              <Download className="w-3 h-3" />
                              <span>İndir</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteMediaFromProject(doc.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Medyayı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Root Drive Files Reference */}
                  {driveMeta?.rootMediaFiles && (
                    <div className="bg-slate-900 text-white rounded-lg p-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[9px] font-black uppercase text-amber-300">
                          Cyprus Constructions Ana Drive Klasörü Ortak Medyaları ({driveMeta.rootMediaFiles.length} Dosya):
                        </div>
                        <a
                          href={
                            driveMeta.folderUrl ||
                            "https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM"
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] font-black text-emerald-300 hover:underline"
                        >
                          Ana Drive Klasörü ↗
                        </a>
                      </div>

                      {(driveMeta.masterMapImage || driveMeta.salesOfficeImage) && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {driveMeta.masterMapImage && (
                            <a
                              href="https://drive.google.com/file/d/1iGbaS3E_j8Z343z5yR3198H39eOveN1k/view"
                              target="_blank"
                              rel="noreferrer"
                              className="group relative h-16 rounded overflow-hidden border border-slate-700 bg-slate-950 block"
                            >
                              <img
                                src={driveMeta.masterMapImage}
                                alt="MAP.png"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-[8px] font-black text-amber-300 px-1.5 py-0.5 truncate">
                                📍 MAP.png (Kuzey Kıbrıs Proje Haritası)
                              </span>
                            </a>
                          )}
                          {driveMeta.salesOfficeImage && (
                            <a
                              href="https://drive.google.com/file/d/1C7983E2aR5n6-2M-p2p9T71_p1sS3-P7/view"
                              target="_blank"
                              rel="noreferrer"
                              className="group relative h-16 rounded overflow-hidden border border-slate-700 bg-slate-950 block"
                            >
                              <img
                                src={driveMeta.salesOfficeImage}
                                alt="CYPRUS CONSTRUCTIONS SALES OFFICE.jpeg"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-[8px] font-black text-cyan-300 px-1.5 py-0.5 truncate">
                                🏢 CYPRUS CONSTRUCTIONS SALES OFFICE.jpeg
                              </span>
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {driveMeta.rootMediaFiles.map((rf: any, i: number) => {
                          const label = typeof rf === "string" ? rf : rf?.name || "Drive Medya";
                          const size = typeof rf === "object" && rf?.size ? ` (${rf.size})` : "";
                          const url =
                            typeof rf === "object" && rf?.url
                              ? rf.url
                              : "https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM";
                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 rounded text-[9px] font-mono transition-colors"
                            >
                              {label}
                              {size} ↗
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: CANLI ÜNİTE & FİYAT YÖNETİMİ (INLINE PRICE + BULK % UPDATE)     */}
      {/* ===================================================================== */}
      {activeTab === "inventory" && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-950 uppercase">
                Canlı Ünite, Stok & Fiyat Yönetimi (Tekil Fiyat Düzenleme & Toplu % Lansman Zammı)
              </h3>
              <p className="text-[11px] text-slate-600">
                Projeye yeni daire/villa ekleyin, tablodan tekil fiyatları güncelleyin veya tüm müsait ünitelere tek tıkla toplu yüzde (%) fiyat güncellemesi uygulayın.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Bulk Percentage Price Update Control */}
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
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-black text-slate-900 outline-none"
              >
                <option value="all">Tüm Projeler ({units.length} Ünite)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.folder_prefix}
                  </option>
                ))}
              </select>

              <select
                value={unitStatusFilter}
                onChange={e => setUnitStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-black text-slate-900 outline-none"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="available">Müsait (Satışa Açık)</option>
                <option value="optioned">Opsiyonlu (72 Saat Kilitli)</option>
                <option value="sold">Satıldı</option>
              </select>

              <div className="relative w-40">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={unitSearch}
                  onChange={e => setUnitSearch(e.target.value)}
                  placeholder="Ünite no, tip ara..."
                  className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddUnitOpen(prev => !prev)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Yeni Ünite Ekle</span>
              </button>
            </div>
          </div>

          {isAddUnitOpen && (
            <form
              onSubmit={handleAddUnit}
              className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 uppercase">
                  Proje Envanterine Yeni Ünite / Daire / Villa Ekle
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddUnitOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Kapat ✕
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                <select
                  value={newUnitForm.project_id || projects[0]?.id || ""}
                  onChange={e => setNewUnitForm({ ...newUnitForm, project_id: Number(e.target.value) })}
                  className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-amber-300 font-black"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Blok (Örn: C Blok)"
                  value={newUnitForm.block_name}
                  onChange={e => setNewUnitForm({ ...newUnitForm, block_name: e.target.value })}
                  className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Kat (Örn: Zemin)"
                  value={newUnitForm.floor_level}
                  onChange={e => setNewUnitForm({ ...newUnitForm, floor_level: e.target.value })}
                  className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Ünite No (Örn: C-08)"
                  value={newUnitForm.unit_number}
                  onChange={e => setNewUnitForm({ ...newUnitForm, unit_number: e.target.value })}
                  className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                />
                <input
                  type="text"
                  placeholder="Tip (1+1 Swim-Up)"
                  value={newUnitForm.unit_type}
                  onChange={e => setNewUnitForm({ ...newUnitForm, unit_type: e.target.value })}
                  className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Brüt m²"
                  value={newUnitForm.gross_sqm}
                  onChange={e => setNewUnitForm({ ...newUnitForm, gross_sqm: Number(e.target.value) })}
                  className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Fiyat (GBP £)"
                  value={newUnitForm.price}
                  onChange={e => setNewUnitForm({ ...newUnitForm, price: Number(e.target.value) })}
                  className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-300 font-black"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-black cursor-pointer"
                >
                  + Üniteyi Ekle
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase">
                  <th className="py-2 px-2.5 rounded-tl-lg">Proje</th>
                  <th className="py-2 px-2.5">Blok / Kat</th>
                  <th className="py-2 px-2.5">Ünite No</th>
                  <th className="py-2 px-2.5">Tip</th>
                  <th className="py-2 px-2.5">Brüt / Net / Teras</th>
                  <th className="py-2 px-2.5">Manzara / Cephe</th>
                  <th className="py-2 px-2.5">Canlı Fiyat Yönetimi (GBP £)</th>
                  <th className="py-2 px-2.5">35% Peşinat</th>
                  <th className="py-2 px-2.5">Durum / Acente Opsiyonu</th>
                  <th className="py-2 px-2.5 text-right rounded-tr-lg">Hızlı İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {filteredUnits.map(u => {
                  const currentEditPrice =
                    editingUnitPrices[u.id] !== undefined ? editingUnitPrices[u.id] : Number(u.price);
                  const downPayment = Math.round(Number(currentEditPrice || 0) * 0.35);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-black text-slate-900">{u.project_name}</td>
                      <td className="py-2 px-2.5 font-bold text-slate-700">
                        {u.block_name} • <span className="text-slate-500">{u.floor_level}</span>
                      </td>
                      <td className="py-2 px-2.5 font-mono font-black text-indigo-700">{u.unit_number}</td>
                      <td className="py-2 px-2.5 font-bold text-slate-800">{u.unit_type}</td>
                      <td className="py-2 px-2.5 font-mono text-slate-700">
                        {u.gross_sqm}m² / {u.net_sqm}m² (+{u.terrace_sqm}m²)
                      </td>
                      <td className="py-2 px-2.5 text-slate-600 font-medium">{u.view_direction}</td>
                      <td className="py-2 px-2.5">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 font-black">£</span>
                          <input
                            type="number"
                            value={currentEditPrice}
                            onChange={e =>
                              setEditingUnitPrices(prev => ({
                                ...prev,
                                [u.id]: Number(e.target.value)
                              }))
                            }
                            className="w-24 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-black text-slate-950 text-[11px]"
                          />
                          {editingUnitPrices[u.id] !== undefined &&
                            editingUnitPrices[u.id] !== Number(u.price) && (
                              <button
                                type="button"
                                onClick={() => handleUnitPriceSave(u.id)}
                                className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-black flex items-center gap-0.5 cursor-pointer"
                                title="Yeni Fiyatı Kaydet"
                              >
                                <Save className="w-3 h-3" />
                                <span>Kaydet</span>
                              </button>
                            )}
                        </div>
                      </td>
                      <td className="py-2 px-2.5 font-bold text-indigo-700">{formatGbp(downPayment)}</td>
                      <td className="py-2 px-2.5">
                        {u.status === "available" && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black uppercase">
                            ● Müsait
                          </span>
                        )}
                        {u.status === "optioned" && (
                          <div>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-black uppercase">
                              ⏳ Opsiyonlu (72s)
                            </span>
                            {u.optioned_by_agency_name && (
                              <div className="text-[9px] text-slate-600 font-bold mt-0.5">
                                {u.optioned_by_agency_name}
                              </div>
                            )}
                          </div>
                        )}
                        {u.status === "sold" && (
                          <div>
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-black uppercase">
                              🔒 Satıldı
                            </span>
                            {u.optioned_by_agency_name && (
                              <div className="text-[9px] text-slate-500 font-bold mt-0.5">
                                {u.optioned_by_agency_name}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <select
                            value={u.status}
                            onChange={e => handleUnitStatusChange(u.id, e.target.value)}
                            className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-black text-slate-800 cursor-pointer"
                          >
                            <option value="available">Müsait Yap</option>
                            <option value="optioned">Opsiyonla</option>
                            <option value="sold">Satıldı İşaretle</option>
                          </select>
                          {onConvertUnitToProperty && (
                            <button
                              type="button"
                              onClick={() => {
                                onConvertUnitToProperty({
                                  title: `${u.project_name} — ${u.block_name} ${u.unit_number} (${u.unit_type})`,
                                  description: `${u.project_name} projesinde ${u.view_direction} manzaralı, ${u.gross_sqm} m² brüt (${u.net_sqm} m² net + ${u.terrace_sqm} m² teras) özel ünite.`,
                                  price: u.price,
                                  currency: u.currency || "GBP",
                                  location: "Esentepe / Tatlısu",
                                  kktc_region: "Girne",
                                  type: u.unit_type?.toLowerCase().includes("villa") ? "villa" : "residence",
                                  room_count: u.unit_type?.includes("3+1")
                                    ? "3+1"
                                    : u.unit_type?.includes("2+1")
                                    ? "2+1"
                                    : u.unit_type?.includes("1+1")
                                    ? "1+1"
                                    : "Stüdyo (1+0)",
                                  square_meters: u.net_sqm,
                                  sqm_gross: u.gross_sqm,
                                  country: "KKTC",
                                  listing_intent: "sale"
                                });
                                toast.success(`${u.unit_number} ünitesi portföy ilan formuna aktarıldı.`);
                              }}
                              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded text-[10px] font-black cursor-pointer"
                              title="Bu Üniteyi Emlak İlanına Dönüştür"
                            >
                              + İlan
                            </button>
                          )}
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
      {/* TAB 3: MYKONOS VS ALOHA ÖDEME PLANI & ROI KARŞILAŞTIRMA MOTORU        */}
      {/* ===================================================================== */}
      {activeTab === "compare" && compareLeft && compareRight && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-950 uppercase flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                <span>Proje Ödeme Planları & Yatırım Avantajları Karşılaştırma Motoru</span>
              </h3>
              <p className="text-[11px] text-slate-600">
                Mykonos Homes ve Aloha Beach Resort başta olmak üzere iki projeyi ödeme vadesi, peşinat, kira çarpanı ve yaşam tarzı olanaklarıyla yan yana kıyaslayın.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[10px] font-black text-slate-700">Simülasyon Tutarı (GBP):</span>
                <input
                  type="number"
                  value={simulatorPriceGbp}
                  onChange={e => setSimulatorPriceGbp(Math.max(50000, Number(e.target.value) || 0))}
                  className="w-24 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-black text-slate-900"
                />
              </div>

              <button
                type="button"
                onClick={handlePrintComparisonSheet}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>A4 Yatırımcı Karşılaştırma Raporu Yazdır</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { proj: compareLeft, setter: setCompareLeftId, badge: "1. KARŞILAŞTIRILAN PROJE" },
              { proj: compareRight, setter: setCompareRightId, badge: "2. KARŞILAŞTIRILAN PROJE" }
            ].map((side, idx) => {
              const p = side.proj;
              const pp = p.payment_plan || {};
              const im = p.investment_metrics || {};
              const downAmt = Math.round((simulatorPriceGbp * (Number(pp.down_payment_percent) || 35)) / 100);
              const remAmt = simulatorPriceGbp - downAmt;
              const months = Math.max(1, Number(pp.installment_months) || 36);
              const monthlyAmt = Math.round(remAmt / months);
              const estAnnualRent = Math.round(
                (simulatorPriceGbp * (Number(im.annual_rental_yield_percent) || 9.8)) / 100
              );

              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="bg-slate-900 text-white p-2.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-amber-300 uppercase">{side.badge}</span>
                      <select
                        value={p.id}
                        onChange={e => side.setter(Number(e.target.value))}
                        className="px-2 py-1 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-black outline-none cursor-pointer"
                      >
                        {projects.map(opt => (
                          <option key={opt.id} value={opt.id}>
                            {opt.folder_prefix} ({opt.sub_region})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-black text-slate-950">{p.name}</h4>
                          <p className="text-[11px] text-slate-600">{p.concept_tagline}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold text-slate-500">Başlangıç</div>
                          <div className="text-sm font-black text-indigo-700">
                            {formatGbp(p.starting_price)}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[11px] font-black text-slate-900 uppercase">
                            {pp.plan_name || "Kurumsal Ödeme Planı"}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black">
                            {months} Ay %0 Faiz
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200/70">
                            <div className="text-[9px] font-bold text-slate-500 uppercase">
                              Peşinat (%{pp.down_payment_percent || 35})
                            </div>
                            <div className="text-xs font-black text-slate-950">{formatGbp(downAmt)}</div>
                          </div>
                          <div className="p-1.5 bg-indigo-50 rounded-lg border border-indigo-200">
                            <div className="text-[9px] font-bold text-indigo-700 uppercase">
                              Aylık Taksit ({months} Ay)
                            </div>
                            <div className="text-xs font-black text-indigo-950">{formatGbp(monthlyAmt)}/ay</div>
                          </div>
                          <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                            <div className="text-[9px] font-bold text-emerald-700 uppercase">
                              Yıllık Kira (~%{im.annual_rental_yield_percent})
                            </div>
                            <div className="text-xs font-black text-emerald-950">
                              {formatGbp(estAnnualRent)}/yıl
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                          <strong>Ödeme Avantajı:</strong> {pp.notes}
                        </p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                        <div className="text-[11px] font-black text-slate-900 uppercase">
                          Yatırım & Değer Artışı Avantajları
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-1.5 bg-slate-50 rounded border border-slate-200/60">
                            <span className="text-slate-500 block text-[10px]">Tahmini Sermaye Artışı:</span>
                            <strong className="text-emerald-700 text-xs">
                              +%{im.capital_appreciation_percent} (Teslime Kadar)
                            </strong>
                          </div>
                          <div className="p-1.5 bg-slate-50 rounded border border-slate-200/60">
                            <span className="text-slate-500 block text-[10px]">Teslim & İnşaat Durumu:</span>
                            <strong className="text-slate-900 text-xs">
                              {p.completion_date} (%{p.construction_progress})
                            </strong>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-700 pt-1">
                          <strong>Hedef Yatırımcı:</strong> {im.target_buyer_profile}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between text-[10px]">
                    <span>Kiralama Yönetimi: {im.management_service}</span>
                    <span className="font-black text-amber-300">Doluluk: %{im.short_term_occupancy_percent}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: KULLANICI TANIMLAMALARI: İÇ EKİP (8-10) vs DIŞ EMLAKÇILAR (1000+) */}
      {/* ===================================================================== */}
      {activeTab === "agencies" && (
        <div className="space-y-2.5">
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-950 uppercase">
                  Çift Katmanlı Kullanıcı & Yetki Tanımlamaları (İç Proje Yönetimi vs. Global B2B Emlakçı Ağı)
                </h3>
                <p className="text-[11px] text-slate-600">
                  İnşaat şirketinin çekirdek yönetim ekibi (8-10 yetkili kullanıcı) ile sisteme dışarıdan bağlanan yüzlerce/binlerce emlak ofisi tamamen ayrı kimlik tabloları ve yetki matrisleriyle tanımlanır.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setAuthSubMode("external_agencies")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                  authSubMode === "external_agencies"
                    ? "bg-slate-900 text-amber-300 shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Dış B2B Emlak Acenteleri ({agencies.length} Aktif / Sınırsız Ölçek)</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthSubMode("internal_staff")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                  authSubMode === "internal_staff"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>İç Proje Yönetim Ekibi ({internalStaff.length} Yetkili Kullanıcı)</span>
              </button>
            </div>
          </div>

          {authSubMode === "external_agencies" ? (
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setAgencySourceFilter("all")}
                      className={`px-2 py-1 rounded text-[10px] font-black cursor-pointer ${
                        agencySourceFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Tüm Havuz ({agencies.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgencySourceFilter("master_pool")}
                      className={`px-2 py-1 rounded text-[10px] font-black cursor-pointer ${
                        agencySourceFilter === "master_pool" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      SuperAdmin Merkez Havuzu ({agencies.filter(a => (a.source_origin || "master_pool") === "master_pool").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgencySourceFilter("operator_reverse_feed")}
                      className={`px-2 py-1 rounded text-[10px] font-black cursor-pointer ${
                        agencySourceFilter === "operator_reverse_feed" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Saha Geri Beslemesi (+{agencies.filter(a => a.source_origin === "operator_reverse_feed").length})
                    </button>
                  </div>

                  <select
                    value={agencyRegionFilter}
                    onChange={e => setAgencyRegionFilter(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-black text-slate-900"
                  >
                    <option value="all">Tüm Ülke & Bölgeler ({agencies.length})</option>
                    {uniqueAgencyCountries.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={agencyDeskFilter}
                    onChange={e => setAgencyDeskFilter(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-black text-slate-900"
                  >
                    <option value="all">Tüm Ülke Temsilcilikleri (Country Desks)</option>
                    <option value="Girne & İstanbul Merkez Masası (TR/EN)">Girne & İstanbul Merkez Masası (TR/EN)</option>
                    <option value="Londra & UK Temsilciliği (EN)">Londra & UK Temsilciliği (EN)</option>
                    <option value="Moskova & CIS Temsilciliği (RU)">Moskova & CIS Temsilciliği (RU)</option>
                    <option value="Berlin & DACH Temsilciliği (DE)">Berlin & DACH Temsilciliği (DE)</option>
                    <option value="Stockholm & Nordic Masası (SV/EN)">Stockholm & Nordic Masası (SV/EN)</option>
                    <option value="Dubai & Orta Doğu / Farsça Masası (AR/FA)">Dubai & Orta Doğu / Farsça Masası (AR/FA)</option>
                  </select>

                  <div className="relative w-44">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={agencySearch}
                      onChange={e => setAgencySearch(e.target.value)}
                      placeholder="Emlak ofisi, broker, masa..."
                      className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewAgencyOpen(prev => !prev)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Yeni Emlak Ofisi Ekle (Merkezi Havuza Geri Beslemeli)</span>
                </button>
              </div>

              {isNewAgencyOpen && (
                <form
                  onSubmit={handleCreateAgency}
                  className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-black text-amber-300 uppercase">
                      Saha / Temsilcilik Yeni Emlak Ofisi Kaydı & Merkezi Global Havuza Otomatik Geri Besleme (Reverse-Feed)
                    </span>
                    <span className="text-[10px] text-emerald-300 font-semibold">
                      Eklediğiniz emlak ofisi hem firmanıza tanımlanır hem de LookPrice Merkezi Global Havuzunu besler
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    <input
                      type="text"
                      placeholder="Emlak Ofisi Unvanı *"
                      value={newAgencyForm.company_name}
                      onChange={e => setNewAgencyForm({ ...newAgencyForm, company_name: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Yetkili Broker Adı *"
                      value={newAgencyForm.broker_name}
                      onChange={e => setNewAgencyForm({ ...newAgencyForm, broker_name: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Ülke (Örn: KKTC, UK, DE, RU)"
                      value={newAgencyForm.country}
                      onChange={e => setNewAgencyForm({ ...newAgencyForm, country: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Şehir / Bölge (Örn: Londra / Girne)"
                      value={newAgencyForm.city_region}
                      onChange={e => setNewAgencyForm({ ...newAgencyForm, city_region: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Telefon / WhatsApp"
                      value={newAgencyForm.phone}
                      onChange={e => setNewAgencyForm({ ...newAgencyForm, phone: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <input
                      type="email"
                      placeholder="Kurumsal E-Posta"
                      value={newAgencyForm.email}
                      onChange={e => setNewAgencyForm({ ...newAgencyForm, email: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-1">
                    <select
                      value={newAgencyForm.assigned_desk}
                      onChange={e => setNewAgencyForm({ ...newAgencyForm, assigned_desk: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="Girne & İstanbul Merkez Masası (TR/EN)">Girne & İstanbul Merkez Masası (TR/EN)</option>
                      <option value="Londra & UK Temsilciliği (EN)">Londra & UK Temsilciliği (EN)</option>
                      <option value="Moskova & CIS Temsilciliği (RU)">Moskova & CIS Temsilciliği (RU)</option>
                      <option value="Berlin & DACH Temsilciliği (DE)">Berlin & DACH Temsilciliği (DE)</option>
                      <option value="Stockholm & Nordic Masası (SV/EN)">Stockholm & Nordic Masası (SV/EN)</option>
                      <option value="Dubai & Orta Doğu / Farsça Masası (AR/FA)">Dubai & Orta Doğu / Farsça Masası (AR/FA)</option>
                    </select>

                    <select
                      value={newAgencyForm.preferred_contract_lang}
                      onChange={e => setNewAgencyForm({ ...newAgencyForm, preferred_contract_lang: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="TR-EN">Çift Dilli Sözleşme: Türkçe / İngilizce (TR-EN)</option>
                      <option value="EN-RU">Çift Dilli Sözleşme: İngilizce / Rusça (EN-RU)</option>
                      <option value="EN-DE">Çift Dilli Sözleşme: İngilizce / Almanca (EN-DE)</option>
                    </select>

                    <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                      <span className="text-[10px] text-slate-400 mr-1">Diller:</span>
                      {["TR", "EN", "RU", "DE", "FA", "AR"].map(code => {
                        const active = (newAgencyForm.spoken_languages || []).includes(code);
                        return (
                          <button
                            type="button"
                            key={code}
                            onClick={() => {
                              const curr = newAgencyForm.spoken_languages || ["TR", "EN"];
                              const next = active
                                ? curr.length > 1 ? curr.filter(c => c !== code) : curr
                                : [...curr, code];
                              setNewAgencyForm({ ...newAgencyForm, spoken_languages: next });
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              active ? "bg-amber-400 text-slate-950" : "text-slate-300 hover:text-white"
                            }`}
                          >
                            {code}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      placeholder="İlk Görüşme / Saha Ziyaret Notu"
                      value={newAgencyForm.last_meeting_note}
                      onChange={e => setNewAgencyForm({ ...newAgencyForm, last_meeting_note: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />

                    <div className="flex items-center gap-1">
                      <select
                        value={newAgencyForm.tier}
                        onChange={e => setNewAgencyForm({ ...newAgencyForm, tier: e.target.value })}
                        className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 font-black"
                      >
                        <option value="VIP">VIP (%10)</option>
                        <option value="Gold">Gold (%8)</option>
                        <option value="Silver">Silver (%7)</option>
                      </select>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black cursor-pointer shrink-0"
                      >
                        Kaydet & Havuza Besle
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase">
                      <th className="py-2 px-2.5 rounded-tl-lg">Acente Kodu & Kaynak</th>
                      <th className="py-2 px-2.5">Emlak Ofisi & Broker</th>
                      <th className="py-2 px-2.5">Ülke Temsilciliği & Diller</th>
                      <th className="py-2 px-2.5">CRM Ziyaret & Kazanım Aşaması</th>
                      <th className="py-2 px-2.5">Segment & Komisyon</th>
                      <th className="py-2 px-2.5">Sözleşme Durumu</th>
                      <th className="py-2 px-2.5">Satış Hacmi (GBP)</th>
                      <th className="py-2 px-2.5 text-right rounded-tr-lg">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {filteredAgencies.map(ag => (
                      <tr key={ag.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5">
                          <div className="font-mono font-black text-indigo-700 tabular-nums">{ag.agency_code}</div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            PIN: {ag.access_pin} ·{" "}
                            {ag.source_origin === "operator_reverse_feed" ? (
                              <span className="text-emerald-700 font-bold">Saha Geri Beslemesi</span>
                            ) : (
                              <span>Merkez Havuz</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="font-black text-slate-900">{ag.company_name}</div>
                          <div className="text-[10px] text-slate-500 font-bold">
                            {ag.broker_name} · {ag.country} ({ag.city_region})
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="font-bold text-slate-800 text-[10px]">
                            {ag.assigned_desk || "Girne & İstanbul Merkez Masası"}
                          </div>
                          <div className="text-[10px] text-indigo-700 font-mono font-bold mt-0.5">
                            Diller: {(ag.spoken_languages || ["TR", "EN"]).join(" · ")} · Sözleşme: {ag.preferred_contract_lang || "TR-EN"}
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <select
                            value={ag.crm_stage || "active_partner"}
                            onChange={e =>
                              handleUpdateAgencyField(ag.id, { crm_stage: e.target.value })
                            }
                            className="px-2 py-0.5 bg-slate-50 border border-slate-300 rounded text-[10px] font-bold text-slate-900 cursor-pointer"
                          >
                            <option value="pool_discovered">1. Havuzdan Atandı (Keşif)</option>
                            <option value="contacted">2. İlk Temas Kuruldu</option>
                            <option value="visit_scheduled">3. Ofis Ziyareti / Zoom Planlandı</option>
                            <option value="contract_sent">4. Çok Dilli Sözleşme Gönderildi</option>
                            <option value="active_partner">5. Aktif Gözlemci-Paydaş</option>
                          </select>
                          {ag.last_meeting_note && (
                            <div className="text-[9px] text-slate-500 truncate max-w-[190px] mt-0.5" title={ag.last_meeting_note}>
                              {ag.last_meeting_note}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex items-center gap-1">
                            <select
                              value={ag.tier}
                              onChange={e =>
                                handleUpdateAgencyField(ag.id, {
                                  tier: e.target.value,
                                  commission_rate:
                                    e.target.value === "VIP" ? 10 : e.target.value === "Gold" ? 8 : 7
                                })
                              }
                              className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-black text-slate-900 cursor-pointer"
                            >
                              <option value="VIP">VIP (%10)</option>
                              <option value="Gold">Gold (%8)</option>
                              <option value="Silver">Silver (%7)</option>
                            </select>
                            <span className="text-[10px] font-bold text-emerald-700 font-mono tabular-nums">
                              %{ag.commission_rate}+%{ag.bonus_commission_rate}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <select
                            value={ag.contract_status}
                            onChange={e =>
                              handleUpdateAgencyField(ag.id, { contract_status: e.target.value })
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                              ag.contract_status === "signed"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <option value="signed">✓ İmzalı & Aktif</option>
                            <option value="pending">⏳ İmza Bekliyor</option>
                            <option value="suspended">Askıda</option>
                          </select>
                        </td>
                        <td className="py-2 px-2.5 font-black text-slate-950 font-mono tabular-nums">
                          {formatGbp(ag.total_sales_volume_gbp)}{" "}
                          <span className="text-[10px] text-slate-500 font-bold">
                            ({ag.closed_sales_count} Satış)
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handlePrintB2BContract(ag)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-amber-300 rounded text-[10px] font-black cursor-pointer transition-all whitespace-nowrap"
                              title="Uluslararası Çift Dilli B2B Komisyon ve Yetki Sözleşmesi Yazdır"
                            >
                              Sözleşme ({ag.preferred_contract_lang || "TR-EN"})
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPortalAgencyCode(ag.agency_code);
                                setPortalPin(ag.access_pin || "2026");
                                setLoggedInB2BAgency(ag);
                                setActiveTab("b2b_portal_preview");
                                toast.success(`${ag.company_name} B2B Acente Portalı görünümüne geçildi.`);
                              }}
                              className="px-2 py-1 bg-cyan-50 hover:bg-cyan-600 text-cyan-800 hover:text-white border border-cyan-200 rounded text-[10px] font-black cursor-pointer transition-all whitespace-nowrap"
                            >
                              Portalı Gör →
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* INTERNAL DEVELOPER MANAGEMENT STAFF (8-10 Core Users CRUD) */
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-950 uppercase">
                    İnşaat Şirketi İç Proje Yönetim Ekibi (8–10 Çekirdek Yönetici Tanımlama)
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Fiyat listelerini, ünite stok durumlarını, Google Drive senkronizasyonunu ve yüzlerce dış emlakçının bölgesel yetkilerini yöneten iç yönetim kadrosu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewStaffOpen(prev => !prev)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Yeni İç Yönetici / Yetkili Kullanıcı Tanımla</span>
                </button>
              </div>

              {isNewStaffOpen && (
                <form
                  onSubmit={handleCreateInternalStaff}
                  className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2"
                >
                  <input
                    type="text"
                    required
                    placeholder="Yönetici Adı Soyadı *"
                    value={newStaffForm.full_name}
                    onChange={e => setNewStaffForm({ ...newStaffForm, full_name: e.target.value })}
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Unvan / Rol"
                    value={newStaffForm.title_role}
                    onChange={e => setNewStaffForm({ ...newStaffForm, title_role: e.target.value })}
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <select
                    value={newStaffForm.department}
                    onChange={e => setNewStaffForm({ ...newStaffForm, department: e.target.value })}
                    className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-amber-300 font-black"
                  >
                    <option value="Üst Yönetim (Super Admin)">Üst Yönetim (Super Admin)</option>
                    <option value="Global Satış & Acente Ağı">Global Satış & Acente Ağı</option>
                    <option value="Bölgesel Acente Yönetimi">Bölgesel Acente Yönetimi</option>
                    <option value="Stok & Operasyon">Stok & Operasyon</option>
                    <option value="Hukuk & Kontrat">Hukuk & Kontrat</option>
                    <option value="Pazarlama & Drive Sync">Pazarlama & Drive Sync</option>
                  </select>
                  <input
                    type="email"
                    placeholder="Kurumsal E-posta"
                    value={newStaffForm.email}
                    onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Sorumlu Bölge / Projeler"
                    value={newStaffForm.assigned_regions}
                    onChange={e => setNewStaffForm({ ...newStaffForm, assigned_regions: e.target.value })}
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-black cursor-pointer"
                  >
                    + Yöneticiyi Kaydet
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {internalStaff.map(st => (
                  <div
                    key={st.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 bg-slate-900 text-amber-300 rounded text-[9px] font-black uppercase">
                          {st.department}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteInternalStaff(st.id)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Yetkiliyi Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h5 className="text-xs font-black text-slate-950 mt-1.5">{st.full_name}</h5>
                      <p className="text-[10px] font-bold text-indigo-700">{st.title_role}</p>
                      <p className="text-[10px] text-slate-600 mt-1">
                        <strong>Sorumlu Alan:</strong> {st.assigned_regions}
                      </p>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono truncate">
                      {st.email}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: MÜŞTERİ ZİMMETLEME (LEAD PROTECTION) & OPSİYON MERKEZİ         */}
      {/* ===================================================================== */}
      {activeTab === "leads_contracts" && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-950 uppercase">
                Müşteri Zimmetleme (60 Gün Lead Protection) & 72 Saat Ünite Opsiyon Talepleri
              </h3>
              <p className="text-[11px] text-slate-600">
                Emlakçıların en büyük korkusu olan &ldquo;Müşterimi inşaat firmasına götürürsem komisyonum yanar mı?&rdquo; endişesini ortadan kaldıran resmi zaman damgalı zimmetleme sistemi.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase">
                  <th className="py-2 px-2.5 rounded-tl-lg">Talep Tipi</th>
                  <th className="py-2 px-2.5">Gönderen B2B Acente</th>
                  <th className="py-2 px-2.5">Yatırımcı / Müşteri</th>
                  <th className="py-2 px-2.5">Proje & Ünite</th>
                  <th className="py-2 px-2.5">Bütçe / Fiyat</th>
                  <th className="py-2 px-2.5">Acente Notu</th>
                  <th className="py-2 px-2.5">Zimmet Durumu</th>
                  <th className="py-2 px-2.5 text-right rounded-tr-lg">Yönetim Onayı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {requests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2.5">
                      {r.request_type === "unit_option" ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-black uppercase">
                          ⏳ 72s Ünite Opsiyonu
                        </span>
                      ) : r.request_type === "inspection_trip" ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded text-[10px] font-black uppercase">
                          ✈️ Inspection Trip / Keşif Gezisi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded text-[10px] font-black uppercase">
                          🛡️ 60 Gün Müşteri Zimmeti
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="font-black text-slate-900">{r.agency_name}</div>
                      <div className="text-[10px] text-slate-500 font-bold">{r.agency_country}</div>
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="font-black text-slate-900">{r.investor_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {r.investor_nationality} • {r.investor_phone_masked}
                      </div>
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="font-black text-indigo-700">{r.project_name}</div>
                      <div className="text-[10px] font-mono text-slate-600">{r.unit_code}</div>
                    </td>
                    <td className="py-2 px-2.5 font-black text-slate-950">{formatGbp(r.budget_gbp)}</td>
                    <td className="py-2 px-2.5 text-slate-600 max-w-xs">{r.notes}</td>
                    <td className="py-2 px-2.5">
                      {r.status === "approved" ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black">
                          ✓ Onaylı & Koruma Altında
                        </span>
                      ) : r.status === "rejected" ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-black">
                          ✕ Reddedildi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-black">
                          Onay Bekliyor
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRequestStatusChange(r.id, "approved")}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black cursor-pointer"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestStatusChange(r.id, "rejected")}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded text-[10px] font-black cursor-pointer"
                        >
                          Reddet
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: LANSMAN, HAWAII OPENING PARTY & INSPECTION TRIPS YÖNETİMİ      */}
      {/* ===================================================================== */}
      {activeTab === "events" && (
        <div className="space-y-2.5">
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-950 uppercase">
                Lansman Geceleri, Webinarlar & KKTC Yatırımcı Keşif Turları (Inspection Trips)
              </h3>
              <p className="text-[11px] text-slate-600">
                Yeni lansman etkinliği tanımlayın ve tüm global B2B acentelere LCV daveti gönderin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewEventOpen(prev => !prev)}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Yeni Lansman / Etkinlik Ekle</span>
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
                placeholder="Konum / Zoom Linki"
                value={newEventForm.location}
                onChange={e => setNewEventForm({ ...newEventForm, location: e.target.value })}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              />
              <input
                type="text"
                placeholder="Kısa Açıklama"
                value={newEventForm.description}
                onChange={e => setNewEventForm({ ...newEventForm, description: e.target.value })}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-black cursor-pointer"
              >
                + Etkinliği Kaydet
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
                    <span className="px-2 py-0.5 bg-slate-900 text-amber-300 rounded text-[10px] font-black uppercase">
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
                    <div>
                      <strong>Hedef Acenteler:</strong> {ev.target_regions}
                    </div>
                    <div>
                      <strong>Drive Medya:</strong> <span className="font-mono">{ev.media_preview_url}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-700">
                    LCV Kayıtlı: {ev.registered_agencies_count} / {ev.max_capacity} Broker
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      toast.success(`${ev.title} için tüm aktif B2B acentelere davet bildirimi gönderildi!`)
                    }
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black cursor-pointer"
                  >
                    Acentelere Davet Gönder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: GÖZLEMCİ-PAYDAŞ EMLAKÇI EKRANI & RESTATELP EKOSİSTEM KÖPRÜSÜ    */}
      {/* ===================================================================== */}
      {activeTab === "b2b_portal_preview" && (
        <div className="space-y-3">
          <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-cyan-400 text-slate-950 rounded text-[10px] font-black uppercase">
                  GÖZLEMCİ-PAYDAŞ (OBSERVER-STAKEHOLDER) EMLAKÇI VERİ HAVUZU
                </span>
                <h3 className="text-sm font-black text-white">
                  {companyDisplayName} — Canlı Paydaş & Veri Akışı Portalı
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Emlakçılar, inşaat proje firmasının iç yönetim kullanıcısı değildir; firmanın verilerini, kalan ünitelerini, komisyon sözleşmelerini, etkinliklerini ve Google Drive medyalarını <strong>Gözlemci-Paydaş</strong> kimliğiyle canlı takip ederler.
              </p>
            </div>

            <form onSubmit={handleB2BPortalLogin} className="flex items-center gap-1.5 flex-wrap">
              <select
                value={portalAgencyCode}
                onChange={e => setPortalAgencyCode(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-black text-amber-300"
              >
                {agencies.map(a => (
                  <option key={a.id} value={a.agency_code}>
                    {a.agency_code} — {a.company_name} ({a.country})
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={portalPin}
                onChange={e => setPortalPin(e.target.value)}
                placeholder="PIN (2026)"
                className="w-20 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-black cursor-pointer"
              >
                Gözlemci-Paydaş Girişi
              </button>
            </form>
          </div>

          {/* RESTATELP EKOSİSTEM & ÇOKLU PROJE FİRMASI ENTEGRASYON KÖPRÜSÜ */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/40 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded text-[10px] font-black uppercase">
                  EMLAK OFİSLERİ İÇİN RESTATELP EKOSİSTEM KÖPRÜSÜ
                </span>
                <span className="text-xs font-black text-cyan-300">
                  Yüzlerce İnşaat Proje Firmasına (projectLP) Tek Panelden Entegre Olun & Portföyünüzü Çoğaltın!
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                Şu an <strong>{companyDisplayName}</strong> firmasının verilerini <strong>Gözlemci-Paydaş</strong> olarak inceliyorsunuz. Kendi <strong>REstateLP Emlak Ofisi</strong> hesabınızı açarak sistemdeki <strong>tüm anlaşmalı inşaat proje firmalarına ({networkDeveloperStores.length || 3}+ projectLP Firması)</strong> tek tıkla bağlanabilir, projeleri hazır ilan olarak kendi web sitenize ve CRM portföyünüze aktarabilirsiniz.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {networkDeveloperStores.map(ns => (
                <button
                  key={ns.id}
                  type="button"
                  onClick={() => {
                    setSelectedDeveloperStoreId(Number(ns.id));
                    fetchOverview(Number(ns.id));
                    toast.success(`${ns.name} Gözlemci-Paydaş veri havuzuna geçiş yapıldı!`);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border cursor-pointer transition-all ${
                    selectedDeveloperStoreId === Number(ns.id)
                      ? "bg-amber-400 text-slate-950 border-amber-300"
                      : "bg-slate-800/90 hover:bg-slate-800 text-slate-100 border-slate-700"
                  }`}
                >
                  🏗️ {ns.name}
                </button>
              ))}
            </div>
          </div>

          {loggedInB2BAgency && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      Gözlemci-Paydaş Emlak Ofisi: {loggedInB2BAgency.company_name} ({loggedInB2BAgency.broker_name})
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Yetkili Bölge:{" "}
                      <strong>
                        {loggedInB2BAgency.country} ({loggedInB2BAgency.city_region})
                      </strong>{" "}
                      • Anlaşmalı Komisyon Oranınız:{" "}
                      <strong className="text-emerald-700">
                        %{loggedInB2BAgency.commission_rate} + %{loggedInB2BAgency.bonus_commission_rate} Bonus
                      </strong>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-black">
                    {loggedInB2BAgency.tier} Gözlemci-Paydaş
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {projects.map(p => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-black text-indigo-700">
                            {p.folder_prefix}
                          </span>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black">
                            {p.available_units} Müsait Ünite
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-slate-950 mt-0.5">{p.name}</h5>
                        <p className="text-[10px] text-slate-600 line-clamp-2">{p.concept_tagline}</p>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between gap-1 flex-wrap">
                        <span className="text-xs font-black text-slate-900">
                          {formatGbp(p.starting_price)}+
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          <a
                            href={
                              p.drive_folder_url ||
                              "https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM"
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-white hover:bg-slate-900 text-slate-800 hover:text-white border border-slate-300 rounded text-[10px] font-black transition-all"
                          >
                            Drive Medya
                          </a>
                          {onConvertUnitToProperty && (
                            <button
                              type="button"
                              onClick={() =>
                                onConvertUnitToProperty({
                                  project: p,
                                  unit: {
                                    unit_number: "Lansman Özel",
                                    unit_type: "1+1 / 2+1 / Villa",
                                    gross_sqm: 85,
                                    net_sqm: 68,
                                    price: p.starting_price,
                                    floor_level: "Bahçe & Teras"
                                  }
                                })
                              }
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black cursor-pointer"
                            >
                              + REstateLP Portföyüme Aktar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePrintWhiteLabelOffer(p, b2bSession)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-[10px] font-black cursor-pointer"
                            title="Kendi acente logonuz ve iletişim bilgilerinizle çok dilli PDF teklif üretin"
                          >
                            📄 White-Label Teklif ({uiLang})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setB2bLeadForm(prev => ({ ...prev, project_name: p.name }));
                              toast.info(`${p.name} sağdaki müşteri zimmetleme formuna seçildi.`);
                            }}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-black cursor-pointer"
                          >
                            Müşteri Zimmetle
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-900 text-white border border-slate-800 rounded-xl p-3 space-y-2.5">
                <div>
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded text-[9px] font-black uppercase">
                    60 GÜN KORUMA GARANTİSİ
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-white mt-1">
                    Yatırımcı Zimmetleme (Lead Lock) & 72 Saat Opsiyon Formu
                  </h4>
                  <p className="text-[10px] text-slate-300">
                    Müşterinizi şantiyeye veya Zoom sunumuna getirmeden önce buradan kaydedin; 60 gün boyunca komisyon hakkınız adınıza kilitlensin.
                  </p>
                </div>

                <form onSubmit={handleB2BSubmitRequest} className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-0.5">İşlem Türü</label>
                    <select
                      value={b2bLeadForm.request_type}
                      onChange={e => setB2bLeadForm({ ...b2bLeadForm, request_type: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 font-black"
                    >
                      <option value="lead_protection">🛡️ Müşteri Zimmetleme (60 Gün Lead Protection)</option>
                      <option value="unit_option">⏳ 72 Saatlik Ünite Opsiyon / Rezervasyon Talebi</option>
                      <option value="inspection_trip">✈️ KKTC Yatırımcı Keşif Turu (Inspection Trip & VIP Konaklama)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-0.5">İlgilenilen Proje</label>
                    <select
                      value={b2bLeadForm.project_name}
                      onChange={e => setB2bLeadForm({ ...b2bLeadForm, project_name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-bold"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.folder_prefix}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
                        Yatırımcı Adı Soyadı *
                      </label>
                      <input
                        type="text"
                        required
                        value={b2bLeadForm.investor_name}
                        onChange={e => setB2bLeadForm({ ...b2bLeadForm, investor_name: e.target.value })}
                        placeholder="Örn: Johnathan Blake"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-0.5">Uyruk / Ülke</label>
                      <input
                        type="text"
                        value={b2bLeadForm.investor_nationality}
                        onChange={e =>
                          setB2bLeadForm({ ...b2bLeadForm, investor_nationality: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
                        Ünite Kodu / Tercihi
                      </label>
                      <input
                        type="text"
                        value={b2bLeadForm.unit_code}
                        onChange={e => setB2bLeadForm({ ...b2bLeadForm, unit_code: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
                        Hedef Bütçe (GBP £)
                      </label>
                      <input
                        type="number"
                        value={b2bLeadForm.budget_gbp}
                        onChange={e =>
                          setB2bLeadForm({ ...b2bLeadForm, budget_gbp: Number(e.target.value) || 0 })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
                      Ziyaret / Sunum Notu
                    </label>
                    <textarea
                      rows={2}
                      value={b2bLeadForm.notes}
                      onChange={e => setB2bLeadForm({ ...b2bLeadForm, notes: e.target.value })}
                      placeholder="Yatırımcı geliş tarihi, ödeme planı tercihi vb."
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs uppercase cursor-pointer transition-all"
                  >
                    Müşteriyi Zimmetle & Opsiyon Talebi Gönder
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
