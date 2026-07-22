import React, { useState, useEffect } from "react";
import { 
  Plus, 
  LogOut,
  Activity,
  Megaphone
} from "lucide-react";
import * as XLSX from 'xlsx';
import { translations } from "@/translations";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import ErrorBoundary from "../components/ErrorBoundary";

// Modular Components
import { SuperAdminStats } from "../components/superadmin/SuperAdminStats";
import { SuperAdminLeads } from "../components/superadmin/SuperAdminLeads";
import { SuperAdminRegistrations } from "../components/superadmin/SuperAdminRegistrations";
import { SuperAdminStoresTable } from "../components/superadmin/SuperAdminStoresTable";
import { EnrakipsizPortalManager } from "../components/superadmin/EnrakipsizPortalManager";
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
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<any>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [storeSearchTerm, setStoreSearchTerm] = useState("");
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [leadFilter, setLeadFilter] = useState<'all' | 'new' | 'contacted' | 'converted'>('all');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'enrakipsiz'>('dashboard');
  
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
        setEnrakipsizSettings(res.settings || {
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
          google_analytics_id: "",
          google_tag_manager_id: "",
          google_search_console_id: ""
        });
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
      const res = await api.saveEnrakipsizSettings(enrakipsizSettings);
      if (res && !res.error) {
        alert(lang === 'tr' ? "Ayarlar başarıyla kaydedildi!" : "Settings saved successfully!");
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
      'Bitiş Tarihi': new Date(s.subscription_end).toLocaleDateString(),
      'Durum': new Date(s.subscription_end) > new Date() ? 'Aktif' : 'Süresi Dolmuş'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mağazalar");
    XLSX.writeFile(wb, "magazalar_listesi.xlsx");
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

  const fetchSupabaseStatus = async () => {
    try {
      setCheckingSupabase(true);
      const res = await api.getSupabaseStatus();
      if (res && res.success) {
        setSupabaseStatus(res);
      }
    } catch (err) {
      console.error("Supabase status error:", err);
    } finally {
      setCheckingSupabase(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsRes, registrationRes, storesRes, statsRes] = await Promise.all([
        api.getLeads(),
        api.getRegistrationRequests(),
        api.getStores(),
        api.getAdminStats()
      ]);
      setLeads(leadsRes);
      setRegistrationRequests(registrationRes);
      setStores(storesRes);
      if (statsRes && !statsRes.error) {
        setStats(statsRes);
      }
      fetchSupabaseStatus();
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      await api.addStore(payload);
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
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        ...editingStore, 
        parent_id: editingStore.parent_id === "" ? null : Number(editingStore.parent_id) 
      };
      await api.updateStore(editingStore.id, payload);
      setEditingStore(null);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Süper Admin Paneli</h1>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Sistemdeki tüm mağazaları ve talepleri yönetin</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onLogout}
              className="text-rose-600 px-4 py-2.5 rounded-xl font-bold hover:bg-rose-50 transition-all flex items-center text-sm border border-rose-100"
            >
              <LogOut className="mr-2 h-4 w-4" /> Çıkış Yap
            </button>
            <button 
              onClick={() => setShowAdd(true)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center text-sm"
            >
              <Plus className="mr-2 h-4 w-4" /> {st.registerNewStore}
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 mb-8 gap-1 md:gap-4 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Activity className="h-4 w-4" /> Mağaza & Talepler Yönetimi
          </button>
          <button
            onClick={() => setActiveTab('enrakipsiz')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'enrakipsiz'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Megaphone className="h-4 w-4 text-rose-500 animate-pulse" /> ⚓ enrakipsiz.com Tema & Reklam Kaptan Köşkü
          </button>
        </div>

        {activeTab === 'enrakipsiz' ? (
          <EnrakipsizPortalManager 
            lang={lang}
            st={st}
            enrakipsizSettings={enrakipsizSettings}
            setEnrakipsizSettings={setEnrakipsizSettings}
            enrakipsizSlides={enrakipsizSlides}
            enrakipsizAds={enrakipsizAds}
            loadingEnrakipsiz={loadingEnrakipsiz}
            savingSettings={savingSettings}
            handleSaveSettings={handleSaveSettings}
            handleDeleteSlide={handleDeleteSlide}
            handleDeleteAd={handleDeleteAd}
            handleSaveStoreFeatured={handleSaveStoreFeatured}
            savingFeaturedStoreId={savingFeaturedStoreId}
            setEditingSlide={setEditingSlide}
            setShowSlideModal={setShowSlideModal}
            setEditingAd={setEditingAd}
            setShowAdModal={setShowAdModal}
            featuredSearchTerm={featuredSearchTerm}
            setFeaturedSearchTerm={setFeaturedSearchTerm}
            showOnlySponsors={showOnlySponsors}
            setShowOnlySponsors={setShowOnlySponsors}
            stores={stores}
            draggedIndex={draggedIndex}
            setDraggedIndex={setDraggedIndex}
            dragOverIndex={dragOverIndex}
            setDragOverIndex={setDragOverIndex}
            getParsedSections={getParsedSections}
            moveSection={moveSection}
            handleDrop={handleDrop}
            toggleSectionEnabled={toggleSectionEnabled}
          />
        ) : (
          <>
            <SuperAdminStats
              stats={stats}
              supabaseStatus={supabaseStatus}
              checkingSupabase={checkingSupabase}
              onRefreshSupabaseStatus={fetchSupabaseStatus}
              st={st}
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
            <SuperAdminRegistrations 
              registrationRequests={registrationRequests}
              st={st}
              handleApproveRegistration={handleApproveRegistration}
              handleRejectRegistration={handleRejectRegistration}
              handleDeleteRegistrationRequest={handleDeleteRegistrationRequest}
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
            />
          </>
        )}

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
