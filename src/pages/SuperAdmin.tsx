import React, { useState, useEffect } from "react";
import { 
  Plus, 
  LogOut,
  Activity,
  Megaphone,
  Video,
  Server,
  ShieldCheck,
  UserCircle,
  Layers,
  Sparkles,
  Inbox
} from "lucide-react";
import * as XLSX from 'xlsx';
import { translations } from "@/translations";
import { formatDateTR, formatFileDateTR } from "../utils/formatUtils";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import ErrorBoundary from "../components/ErrorBoundary";

// Modular Components
import { SuperAdminStats } from "../components/superadmin/SuperAdminStats";
import { SuperAdminLeads } from "../components/superadmin/SuperAdminLeads";
import { SuperAdminRegistrations } from "../components/superadmin/SuperAdminRegistrations";
import { SuperAdminStoresTable, StoreSegmentType } from "../components/superadmin/SuperAdminStoresTable";
import { MultiTenancyDashboard } from "../components/superadmin/MultiTenancyDashboard";
import { EnrakipsizPortalManager } from "../components/superadmin/EnrakipsizPortalManager";
import { IntegratorHub } from "../components/IntegratorHub";
import { SuperAdminVideosManager } from "../components/superadmin/SuperAdminVideosManager";
import { SuperAdminAuditLogs } from "../components/superadmin/SuperAdminAuditLogs";
import { SuperAdminProfile } from "../components/superadmin/SuperAdminProfile";
import { SuperAdminMarketingHub } from "../components/superadmin/SuperAdminMarketingHub";
import { 
  SlideModal, 
  AdModal, 
  LeadModal, 
  EditStoreModal, 
  StoreDetailsModal, 
  DeleteStoreModal,
  AddStoreModal
} from "../components/superadmin/SuperAdminModals";

// Types
import { Store, Lead, EnrakipsizSettings, EnrakipsizSlide, EnrakipsizAd } from "../types/superadmin";

interface SuperAdminDashboardProps {
  token: string;
  onLogout: () => void;
}

export default function SuperAdminDashboard({ token, onLogout }: SuperAdminDashboardProps) {
  const { lang } = useLanguage();
  const st = translations[lang].superAdmin;
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<any[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [stats, setStats] = useState<any>({
    totalStores: 0,
    activeStores: 0,
    totalScans: 0,
    scansLast24h: 0
  });
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [checkingSupabase, setCheckingSupabase] = useState<boolean>(false);
  const [drive5TBStatus, setDrive5TBStatus] = useState<any>(null);
  const [backingUpDrive5TB, setBackingUpDrive5TB] = useState<boolean>(false);
  const [archivingDrive5TB, setArchivingDrive5TB] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<any>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [storeSearchTerm, setStoreSearchTerm] = useState("");
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');
  const [leadFilter, setLeadFilter] = useState<'all' | 'new' | 'contacted' | 'converted'>('all');
  const [storeSegment, setStoreSegment] = useState<StoreSegmentType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('superAdminStoreSegment');
      if (saved && ['commercial', 'branches', 'demos', 'all'].includes(saved)) {
        return saved as StoreSegmentType;
      }
    }
    return 'commercial';
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'tenants' | 'marketing' | 'enrakipsiz' | 'videos' | 'integrator' | 'audit' | 'profile'>(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('saTab');
      if (urlTab && ['dashboard', 'requests', 'tenants', 'marketing', 'enrakipsiz', 'videos', 'integrator', 'audit', 'profile'].includes(urlTab)) {
        return urlTab as any;
      }
      const saved = localStorage.getItem('superAdminActiveTab');
      if (saved && ['dashboard', 'requests', 'tenants', 'marketing', 'enrakipsiz', 'videos', 'integrator', 'audit', 'profile'].includes(saved)) {
        return saved as any;
      }
    }
    return 'dashboard';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('superAdminActiveTab', activeTab);
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('saTab', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeTab]);

  const mainScrollRef = React.useRef<HTMLElement>(null);
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);
  
  // Enrakipsiz states
  const [enrakipsizSettings, setEnrakipsizSettings] = useState<EnrakipsizSettings>({
    portal_title: "",
    portal_description: "",
    announcement: "",
    primary_color: "#ea580c",
    footer_text: "",
    portal_domain: "",
    theme_style: "dark_gold",
    font_family: "Inter",
    layout_sections: "[\"hero\",\"announcement\",\"sponsors\",\"vehicles\",\"properties\"]",
    custom_css: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    google_analytics_id: "",
    google_tag_manager_id: "",
    google_search_console_id: ""
  });
  const [enrakipsizSlides, setEnrakipsizSlides] = useState<EnrakipsizSlide[]>([]);
  const [enrakipsizAds, setEnrakipsizAds] = useState<EnrakipsizAd[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [loadingEnrakipsiz, setLoadingEnrakipsiz] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Slide & Ad Form Modal states
  const [editingSlide, setEditingSlide] = useState<any | null>(null);
  const [editingAd, setEditingAd] = useState<any | null>(null);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [featuredSearchTerm, setFeaturedSearchTerm] = useState("");
  const [showOnlySponsors, setShowOnlySponsors] = useState(false);

  const getParsedSections = (): { id: string; enabled: boolean }[] => {
    let parsed: any[] = [];
    try {
      parsed = JSON.parse(enrakipsizSettings.layout_sections || '[]');
    } catch(e) {}
    
    if (!Array.isArray(parsed) || parsed.length === 0) {
      parsed = [
        { id: 'hero', enabled: true },
        { id: 'announcement', enabled: true },
        { id: 'sponsors', enabled: true },
        { id: 'vehicles', enabled: true },
        { id: 'properties', enabled: true }
      ];
    } else {
      const standardKeys = ['hero', 'announcement', 'sponsors', 'vehicles', 'properties'];
      if (typeof parsed[0] === 'string') {
        parsed = parsed.map((id: string) => ({ id, enabled: true }));
      }
      standardKeys.forEach(k => {
        if (!parsed.some(item => item.id === k)) {
          parsed.push({ id: k, enabled: true });
        }
      });
    }
    return parsed;
  };

  const updateSections = (newSections: { id: string; enabled: boolean }[]) => {
    setEnrakipsizSettings((prev: any) => ({
      ...prev,
      layout_sections: JSON.stringify(newSections)
    }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const list = getParsedSections();
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    updateSections(list);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    const list = getParsedSections();
    const draggedItem = list[draggedIndex];
    const remainingItems = list.filter((_, i) => i !== draggedIndex);
    const updated = [
      ...remainingItems.slice(0, targetIdx),
      draggedItem,
      ...remainingItems.slice(targetIdx)
    ];
    updateSections(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const toggleSectionEnabled = (id: string) => {
    const list = getParsedSections().map(item => {
      if (item.id === id) {
        return { ...item, enabled: !item.enabled };
      }
      return item;
    });
    updateSections(list);
  };

  const fetchEnrakipsizData = async () => {
    try {
      setLoadingEnrakipsiz(true);
      const res = await api.getEnrakipsizSettings();
      if (res && !res.error) {
        const storedLogo = localStorage.getItem("enrakipsiz_portal_logo");
        const storedFavicon = localStorage.getItem("enrakipsiz_portal_favicon");
        
        const settingsData = res.settings || {
          portal_title: "Seçkin Mağazalardan Rakipsiz Teklifler & İlanlar",
          portal_description: "Oto galeri, emlak ofisleri ve premium e-ticaret markalarının en güncel, doğrulanmış ilanlarını tek bir ekranda canlı olarak inceleyin.",
          announcement: "Sadece portal müşterilerine lüks gayrimenkul ve araç alımlarında 12 ila 36 ay vadede kişiye özel oranlı prestij kredisi ve takas desteği.",
          primary_color: "#ea580c",
          footer_text: "© 2026 Enrakipsiz.com. Tüm hakları saklıdır.",
          portal_domain: "enrakipsiz.com",
          theme_style: "dark_gold",
          font_family: "Inter",
          layout_sections: "[\"hero\",\"announcement\",\"sponsors\",\"vehicles\",\"properties\"]",
          custom_css: "",
          seo_title: "",
          seo_description: "",
          seo_keywords: "",
          portal_logo_url: storedLogo || "",
          favicon_url: storedFavicon || "",
          google_analytics_id: "",
          google_tag_manager_id: "",
          google_search_console_id: ""
        };

        if (storedLogo && !settingsData.portal_logo_url) settingsData.portal_logo_url = storedLogo;
        if (storedFavicon && !settingsData.favicon_url) settingsData.favicon_url = storedFavicon;

        setEnrakipsizSettings(settingsData);
        setEnrakipsizSlides(res.slides || []);
        setEnrakipsizAds(res.ads || []);
      }
    } catch (err) {
      console.error("Enrakipsiz data fetch err:", err);
    } finally {
      setLoadingEnrakipsiz(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'enrakipsiz') {
      fetchEnrakipsizData();
    }
  }, [activeTab]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      if (enrakipsizSettings.portal_logo_url) {
        localStorage.setItem("enrakipsiz_portal_logo", enrakipsizSettings.portal_logo_url);
      } else {
        localStorage.removeItem("enrakipsiz_portal_logo");
      }
      if (enrakipsizSettings.favicon_url) {
        localStorage.setItem("enrakipsiz_portal_favicon", enrakipsizSettings.favicon_url);
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (link) {
          link.href = enrakipsizSettings.favicon_url;
        }
      } else {
        localStorage.removeItem("enrakipsiz_portal_favicon");
      }

      const res = await api.saveEnrakipsizSettings(enrakipsizSettings);
      if (res && !res.error) {
        alert(lang === 'tr' ? "Ayarlar ve Logo/Favicon başarıyla kaydedildi!" : "Settings saved successfully!");
        fetchEnrakipsizData();
      } else {
        alert(res.error || "Hata oluştu");
      }
    } catch (err) {
      alert("Hata oluştu");
    } finally {
      setSavingSettings(false);
    }
  };

  const [savingFeaturedStoreId, setSavingFeaturedStoreId] = useState<number | null>(null);

  const handleSaveStoreFeatured = async (storeId: number, isFeatured: boolean, order: number, title: string) => {
    try {
      setSavingFeaturedStoreId(storeId);
      const res = await api.updateStoreEnrakipsizFeatured(storeId, {
        is_enrakipsiz_featured: isFeatured,
        enrakipsiz_featured_order: order,
        enrakipsiz_featured_title: title
      });
      if (res && !res.error) {
        const updatedStores = await api.getStores();
        setStores(updatedStores);
        alert(lang === 'tr' ? "Mağaza sponsor vitrin ayarları başarıyla kaydedildi!" : "Store sponsor showcase settings saved successfully!");
      } else {
        alert("Hata: " + (res?.error || "Ayarlar güncellenemedi."));
      }
    } catch (err: any) {
      console.error(err);
      alert("Hata: " + err.message);
    } finally {
      setSavingFeaturedStoreId(null);
    }
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.saveEnrakipsizSlide(editingSlide);
      if (res && !res.error) {
        setShowSlideModal(false);
        setEditingSlide(null);
        fetchEnrakipsizData();
      } else {
        alert(res.error || "Hata oluştu");
      }
    } catch (err) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteSlide = async (id: number) => {
    if (!confirm(lang === 'tr' ? "Bu slaytı silmek istediğinize emin misiniz?" : "Are you sure you want to delete this slide?")) return;
    try {
      const res = await api.deleteEnrakipsizSlide(id);
      if (res && !res.error) {
        fetchEnrakipsizData();
      } else {
        alert(res.error || "Hata oluştu");
      }
    } catch (err) {
      alert("Hata oluştu");
    }
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.saveEnrakipsizAd(editingAd);
      if (res && !res.error) {
        setShowAdModal(false);
        setEditingAd(null);
        fetchEnrakipsizData();
      } else {
        alert(res.error || "Hata oluştu");
      }
    } catch (err) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteAd = async (id: number) => {
    if (!confirm(lang === 'tr' ? "Bu reklamı silmek istediğinize emin misiniz?" : "Are you sure you want to delete this ad?")) return;
    try {
      const res = await api.deleteEnrakipsizAd(id);
      if (res && !res.error) {
        fetchEnrakipsizData();
      } else {
        alert(res.error || "Hata oluştu");
      }
    } catch (err) {
      alert("Hata oluştu");
    }
  };

  const exportStoresToExcel = () => {
    const exportData = stores.map(s => ({
      'Mağaza Adı': s.name,
      'Slug': s.slug,
      'Admin Email': s.admin_email,
      'İletişim Kişisi': s.contact_person || 'N/A',
      'Telefon': s.phone || 'N/A',
      'Email': s.email || 'N/A',
      'Adres': s.address || 'N/A',
      'Ülke': s.country,
      'Plan': s.plan,
      'Bitiş Tarihi': formatDateTR(s.subscription_end),
      'Durum': new Date(s.subscription_end) > new Date() ? 'Aktif' : 'Süresi Dolmuş'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mağazalar");
    XLSX.writeFile(wb, `magazalar_listesi_${formatFileDateTR()}.xlsx`);
  };

  const [newStore, setNewStore] = useState<any>({
    name: "",
    slug: "",
    address: "",
    contact_person: "",
    phone: "",
    country: "TR",
    email: "",
    admin_email: "",
    admin_password: "",
    subscription_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    default_currency: "TRY",
    language: "tr",
    plan: "free",
    parent_id: "",
    store_type: "product",
    sub_sector: undefined,
    status: "approved",
    is_approved: true,
    max_products: 100,
    max_properties: 20,
    max_vehicles: 20,
    max_users: 5,
    max_customers: 50
  });

  const fetchDrive5TBStatus = async () => {
    try {
      const res = await api.getGoogleDrive5TBStatus();
      if (res && !res.error) {
        setDrive5TBStatus(res);
      }
    } catch (err) {
      console.error("5 TB Google Drive status error:", err);
    }
  };

  const fetchSupabaseStatus = async (force = false) => {
    try {
      setCheckingSupabase(true);
      const [res] = await Promise.all([
        api.getSupabaseStatus(force),
        fetchDrive5TBStatus()
      ]);
      if (res && res.success) {
        setSupabaseStatus(res);
      }
    } catch (err) {
      console.error("Supabase status error:", err);
    } finally {
      setCheckingSupabase(false);
    }
  };

  const handleConnectDrive5TB = async () => {
    try {
      const res = await api.getGoogleDrive5TBAuthUrl();
      if (res?.url) {
        const width = 560;
        const height = 680;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          res.url,
          "GoogleDrive5TBAuth",
          `width=${width},height=${height},left=${left},top=${top}`
        );
      }
    } catch (err: any) {
      console.error("Drive 5TB auth url error:", err);
    }
  };

  const handleTriggerDrive5TBBackup = async () => {
    try {
      setBackingUpDrive5TB(true);
      const res = await api.triggerGoogleDrive5TBBackup();
      if (res?.success) {
        await fetchDrive5TBStatus();
      }
    } catch (err: any) {
      console.error("Drive 5TB backup error:", err);
    } finally {
      setBackingUpDrive5TB(false);
    }
  };

  const handleTriggerDrive5TBArchive = async () => {
    try {
      setArchivingDrive5TB(true);
      const res = await api.triggerGoogleDrive5TBArchive();
      if (res?.success) {
        await fetchSupabaseStatus(true);
      }
    } catch (err: any) {
      console.error("Drive 5TB archive error:", err);
    } finally {
      setArchivingDrive5TB(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsRes, registrationRes, storesRes, statsRes] = await Promise.allSettled([
        api.getLeads(),
        api.getRegistrationRequests(),
        api.getStores(),
        api.getAdminStats()
      ]);
      if (leadsRes.status === 'fulfilled') setLeads(leadsRes.value || []);
      if (registrationRes.status === 'fulfilled') setRegistrationRequests(registrationRes.value || []);
      if (storesRes.status === 'fulfilled') setStores(storesRes.value || []);
      if (statsRes.status === 'fulfilled' && statsRes.value && !statsRes.value.error) {
        setStats(statsRes.value);
      }
      fetchSupabaseStatus();
    } catch (error) {
      console.error("Fetch error in SuperAdmin:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "google_drive_5tb_connected") {
        fetchDrive5TBStatus();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateLead(selectedLead.id, {
        status: selectedLead.status,
        probability: selectedLead.probability,
        notes: selectedLead.notes
      });
      setSelectedLead(null);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        ...newStore, 
        parent_id: newStore.parent_id === "" ? null : Number(newStore.parent_id) 
      };
      const res = await api.addStore(payload);
      if (res && res.error) {
        alert(res.error);
        return;
      }
      setShowAdd(false);
      setNewStore({
        name: "",
        slug: "",
        address: "",
        contact_person: "",
        phone: "",
        country: "TR",
        email: "",
        admin_email: "",
        admin_password: "",
        subscription_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        default_currency: "TRY",
        language: "tr",
        plan: "free",
        parent_id: "",
        store_type: "product",
        sub_sector: undefined,
        status: "approved",
        is_approved: true,
        max_products: 100,
        max_properties: 20,
        max_vehicles: 20,
        max_users: 5,
        max_customers: 50
      });
      await fetchData();
      alert(`"${payload.name}" mağazası başarıyla oluşturuldu ve sisteme kaydedildi!`);
    } catch (error: any) {
      alert(error?.message || "Mağaza oluşturulurken bir hata meydana geldi.");
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        ...editingStore, 
        parent_id: editingStore.parent_id === "" ? null : Number(editingStore.parent_id) 
      };
      const res = await api.updateStore(editingStore.id, payload);
      if (res && res.error) {
        alert(res.error);
        return;
      }
      setEditingStore(null);
      await fetchData();
      alert("Mağaza bilgileri başarıyla güncellendi.");
    } catch (error: any) {
      alert(error?.message || "Güncelleme sırasında hata oluştu.");
    }
  };

  const handleToggleHotel = async (store: any) => {
    const currentStatus = Boolean(store.hotel_module_enabled);
    const newStatus = !currentStatus;
    try {
      setStores(prev => prev.map(s => s.id === store.id ? { ...s, hotel_module_enabled: newStatus } : s));
      const res = await api.toggleStoreHotel(store.id, newStatus);
      if (res && res.success) {
        alert(lang === 'tr' 
          ? `"${store.name}" mağazası için Otel & Oda Konsepti ${newStatus ? 'AKTİF EDİLDİ' : 'PASİFE ALINDI'}.` 
          : `Hotel module ${newStatus ? 'ACTIVATED' : 'DEACTIVATED'} for "${store.name}".`);
      }
      fetchData();
    } catch (err: any) {
      alert("İşlem başarısız: " + (err?.message || err));
      fetchData();
    }
  };

  const handleToggleBookstore = async (store: any) => {
    const currentStatus = Boolean(store.bookstore_module_enabled);
    const newStatus = !currentStatus;
    try {
      setStores(prev => prev.map(s => s.id === store.id ? { ...s, bookstore_module_enabled: newStatus } : s));
      const res = await api.toggleStoreBookstore(store.id, newStatus);
      if (res && res.success) {
        alert(lang === 'tr' 
          ? `"${store.name}" mağazası için Kitap Konsepti ${newStatus ? 'AKTİF EDİLDİ' : 'PASİFE ALINDI'}.` 
          : `Bookstore module ${newStatus ? 'ACTIVATED' : 'DEACTIVATED'} for "${store.name}".`);
      }
      fetchData();
    } catch (err: any) {
      alert("İşlem başarısız: " + (err?.message || err));
      fetchData();
    }
  };

  const handleDeleteStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.deleteStore(storeToDelete.id, deletePassword);
      setStoreToDelete(null);
      setDeletePassword("");
      fetchData();
    } catch (error) {
      alert(lang === 'tr' ? "Şifre hatalı veya mağaza silinemedi" : "Incorrect password or store could not be deleted");
    }
  };

  const handleApproveRegistration = async (id: number) => {
    if (!confirm(lang === 'tr' ? "Bu başvuruyu onaylamak ve mağazayı oluşturmak istediğinize emin misiniz?" : "Are you sure you want to approve this request and create the store?")) return;
    try {
      const res = await api.approveRegistration(id);
      if (res.error) throw new Error(res.error);
      alert(lang === 'tr' ? `Mağaza başarıyla oluşturuldu: /dashboard/${res.slug}` : `Store created successfully: /dashboard/${res.slug}`);
      fetchData();
    } catch (error: any) {
      alert(error.message || "Hata oluştu");
    }
  };

  const handleRejectRegistration = async (id: number) => {
    if (!confirm(lang === 'tr' ? "Bu başvuruyu reddetmek istediğinize emin misiniz?" : "Are you sure you want to reject this request?")) return;
    try {
      await api.rejectRegistration(id);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteRegistrationRequest = async (id: number) => {
    if (!confirm(lang === 'tr' ? "Bu başvuruyu tamamen silmek istediğinize emin misiniz?" : "Are you sure you want to delete this registration request?")) return;
    try {
      await api.deleteRegistrationRequest(id);
      fetchData();
    } catch (error) {
      alert(lang === 'tr' ? "Silme işlemi sırasında hata oluştu" : "Error during deletion");
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!confirm(lang === 'tr' ? "Bu talebi tamamen silmek istediğinize emin misiniz?" : "Are you sure you want to delete this lead request?")) return;
    try {
      await api.deleteLead(id);
      fetchData();
    } catch (error) {
      alert(lang === 'tr' ? "Silme işlemi sırasında hata oluştu" : "Error during deletion");
    }
  };

  return (
    <ErrorBoundary lang={lang}>
      <div className="h-full h-[100dvh] max-h-screen max-h-[100dvh] flex flex-col overflow-hidden bg-slate-100/60 font-sans relative operator-compact-layout">
        {/* Unified LookPrice Executive Cockpit Command Bar (Pinned Top Bar) */}
        <header className="shrink-0 z-20 px-3 sm:px-5 pt-3 pb-1.5 bg-slate-100/90 backdrop-blur-md border-b border-slate-200/50">
          <div className="max-w-[1440px] mx-auto">
            <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/90">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                    LookPrice Kaptan Köşkü
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                    Executive Cockpit
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Ticari müşteri hesapları, çok şubeli yapılar, abonelik muhasebesi ve sektörel vitrin yönetim merkezi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end lg:self-auto">
              <button
                onClick={() => setShowAdd(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl font-extrabold transition-all shadow-sm flex items-center text-xs cursor-pointer"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> {st.registerNewStore}
              </button>
              <button
                onClick={onLogout}
                className="text-slate-300 hover:text-white px-3 py-2 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center text-xs border border-white/10 cursor-pointer"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5 text-rose-400" /> Çıkış
              </button>
            </div>
          </div>

          {/* Integrated High-Density Navigation Tabs (Single-Line Compact Bar) */}
          <div className="relative z-10 pt-2 flex items-center gap-1 flex-nowrap overflow-x-auto whitespace-nowrap no-scrollbar">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-indigo-500" />
              <span>Kokpit</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Inbox className="h-3.5 w-3.5 text-amber-400" />
              <span>Talepler</span>
              {(leads.length + registrationRequests.length) > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'requests'
                    ? 'bg-slate-900 text-white'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {leads.length + registrationRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tenants')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'tenants'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Şubeler</span>
            </button>

            <button
              onClick={() => setActiveTab('marketing')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'marketing'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Pazarlama</span>
            </button>

            <button
              onClick={() => setActiveTab('enrakipsiz')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'enrakipsiz'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Megaphone className="h-3.5 w-3.5 text-amber-400" />
              <span>Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'videos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Video className="h-3.5 w-3.5 text-emerald-400" />
              <span>Videolar</span>
            </button>

            <button
              onClick={() => setActiveTab('integrator')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'integrator'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Server className="h-3.5 w-3.5 text-indigo-400" />
              <span>Entegratör</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Güvenlik</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserCircle className="h-3.5 w-3.5 text-rose-400" />
              <span>Profil</span>
            </button>
            </div>
          </div>
        </div>
      </header>

        {/* Dedicated Smooth Single Vertical Scroll Area */}
        <main ref={mainScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-5 py-3">
          <div className="max-w-[1440px] mx-auto space-y-3 pb-36">
            {activeTab === 'tenants' ? (
          <MultiTenancyDashboard 
            stores={stores}
            onRefreshStores={fetchData}
            lang={lang}
          />
        ) : activeTab === 'requests' ? (
          <div className="space-y-4">
            <SuperAdminRegistrations 
              registrationRequests={registrationRequests}
              st={st}
              handleApproveRegistration={handleApproveRegistration}
              handleRejectRegistration={handleRejectRegistration}
              handleDeleteRegistrationRequest={handleDeleteRegistrationRequest}
            />
            <SuperAdminLeads 
              leads={leads}
              leadSearchTerm={leadSearchTerm}
              setLeadSearchTerm={setLeadSearchTerm}
              leadFilter={leadFilter}
              setLeadFilter={setLeadFilter}
              st={st}
              setSelectedLead={setSelectedLead}
              handleDeleteLead={handleDeleteLead}
            />
          </div>
        ) : activeTab === 'marketing' ? (
          <SuperAdminMarketingHub lang={lang} />
        ) : activeTab === 'enrakipsiz' ? (
          <EnrakipsizPortalManager 
            lang={lang}
            st={st}
            enrakipsizSettings={enrakipsizSettings}
            setEnrakipsizSettings={setEnrakipsizSettings}
            loadingEnrakipsiz={loadingEnrakipsiz}
            savingSettings={savingSettings}
            handleSaveSettings={handleSaveSettings}
            handleSaveStoreFeatured={handleSaveStoreFeatured}
            savingFeaturedStoreId={savingFeaturedStoreId}
            featuredSearchTerm={featuredSearchTerm}
            setFeaturedSearchTerm={setFeaturedSearchTerm}
            showOnlySponsors={showOnlySponsors}
            setShowOnlySponsors={setShowOnlySponsors}
            stores={stores}
          />
        ) : activeTab === 'videos' ? (
          <SuperAdminVideosManager lang={lang} />
        ) : activeTab === 'integrator' ? (
          <IntegratorHub />
        ) : activeTab === 'audit' ? (
          <SuperAdminAuditLogs lang={lang} />
        ) : activeTab === 'profile' ? (
          <SuperAdminProfile lang={lang} />
        ) : (
          <>
            <SuperAdminStats
              stats={stats}
              stores={stores}
              leadsCount={leads.length}
              pendingRegistrationsCount={registrationRequests.filter((r: any) => r.status === 'pending').length}
              onOpenRequestsTab={() => setActiveTab('requests')}
              activeSegment={storeSegment}
              onSelectSegment={(seg) => {
                setStoreSegment(seg);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('superAdminStoreSegment', seg);
                }
              }}
              supabaseStatus={supabaseStatus}
              checkingSupabase={checkingSupabase}
              onRefreshSupabaseStatus={() => fetchSupabaseStatus(true)}
              drive5TBStatus={drive5TBStatus}
              backingUpDrive5TB={backingUpDrive5TB}
              archivingDrive5TB={archivingDrive5TB}
              onConnectDrive5TB={handleConnectDrive5TB}
              onTriggerDrive5TBBackup={handleTriggerDrive5TBBackup}
              onTriggerDrive5TBArchive={handleTriggerDrive5TBArchive}
              st={st}
            />
            <SuperAdminStoresTable 
              stores={stores}
              storeSearchTerm={storeSearchTerm}
              setStoreSearchTerm={setStoreSearchTerm}
              storeFilter={storeFilter}
              setStoreFilter={setStoreFilter}
              exportStoresToExcel={exportStoresToExcel}
              st={st}
              setSelectedStore={setSelectedStore}
              setEditingStore={setEditingStore}
              setStoreToDelete={setStoreToDelete}
              onToggleHotel={handleToggleHotel}
              onToggleBookstore={handleToggleBookstore}
              onNavigateToMultiTenancy={() => setActiveTab('tenants')}
              activeSegment={storeSegment}
              onSelectSegment={(seg) => {
                setStoreSegment(seg);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('superAdminStoreSegment', seg);
                }
              }}
            />
          </>
        )}
          </div>
        </main>

        {/* Modals */}
        <SlideModal 
          isOpen={showSlideModal}
          onClose={() => setShowSlideModal(false)}
          slide={editingSlide || {}}
          setSlide={setEditingSlide}
          onSave={handleSaveSlide}
        />
        <AdModal 
          isOpen={showAdModal}
          onClose={() => setShowAdModal(false)}
          ad={editingAd || {}}
          setAd={setEditingAd}
          onSave={handleSaveAd}
        />
        <LeadModal 
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          lead={selectedLead || {}}
          setLead={setSelectedLead}
          onSave={handleUpdateLead}
          st={st}
        />
        <EditStoreModal 
          isOpen={!!editingStore}
          onClose={() => setEditingStore(null)}
          store={editingStore || {}}
          setStore={setEditingStore}
          onSave={handleUpdateStore}
          stores={stores}
          st={st}
        />
        <StoreDetailsModal 
          isOpen={!!selectedStore}
          onClose={() => setSelectedStore(null)}
          store={selectedStore || {}}
          st={st}
        />
        <DeleteStoreModal 
          isOpen={!!storeToDelete}
          onClose={() => setStoreToDelete(null)}
          store={storeToDelete || {}}
          password={deletePassword}
          setPassword={setDeletePassword}
          onDelete={handleDeleteStore}
        />
        <AddStoreModal 
          isOpen={showAdd}
          onClose={() => setShowAdd(false)}
          newStore={newStore}
          setNewStore={setNewStore}
          onSave={handleAddStore}
          stores={stores}
          st={st}
        />
      </div>
    </ErrorBoundary>
  );
}
