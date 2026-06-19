import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Store, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  X,
  LogOut,
  TrendingUp,
  Package,
  Scan,
  Users,
  Database,
  Activity,
  Clock,
  Filter,
  Download,
  FileSpreadsheet,
  Mail,
  Phone,
  Megaphone,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Palette,
  Type,
  Layout
} from "lucide-react";
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from "motion/react";
import { translations } from "@/translations";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import { DEVELOPED_COUNTRIES } from "../constants";
import ErrorBoundary from "../components/ErrorBoundary";

interface SuperAdminDashboardProps {
  token: string;
  onLogout: () => void;
}

export default function SuperAdminDashboard({ token, onLogout }: SuperAdminDashboardProps) {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const st = translations[lang].superAdmin;
  
  const [leads, setLeads] = useState<any[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalStores: 0,
    activeStores: 0,
    totalScans: 0,
    scansLast24h: 0
  });
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
  const [enrakipsizSettings, setEnrakipsizSettings] = useState<any>({
    portal_title: "",
    portal_description: "",
    announcement: "",
    primary_color: "#ea580c",
    footer_text: "",
    portal_domain: "",
    theme_style: "dark_gold",
    font_family: "Inter",
    layout_sections: "[\"hero\",\"announcement\",\"sponsors\",\"vehicles\",\"properties\"]",
    custom_css: ""
  });
  const [enrakipsizSlides, setEnrakipsizSlides] = useState<any[]>([]);
  const [enrakipsizAds, setEnrakipsizAds] = useState<any[]>([]);
  const [loadingEnrakipsiz, setLoadingEnrakipsiz] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Slide & Ad Form Modal states
  const [editingSlide, setEditingSlide] = useState<any | null>(null);
  const [editingAd, setEditingAd] = useState<any | null>(null);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);

  const THEME_OPTIONS = [
    { id: 'dark_gold', name: '👑 Noble Gold / Siyah & Amber', description: 'Geleneksel Enrakipsiz tonları; asil altın ve zengin amber dokusu' },
    { id: 'cosmic_slate', name: '🌌 Cosmic Slate / Gece Mavisi & Nebula', description: 'Yüksek teknoloji ürünü derin kozmik grafit ve ince geçişli mor tonları' },
    { id: 'editorial_serif', name: '📚 Editorial Serif / Fildişi & Antik', description: 'Zamanın ötesinde klasik bir dergi tasarımı, zarif antik çizgiler ve serif yazı tipi' },
    { id: 'swiss_minimal', name: '▫️ Swiss Minimal / Brutalist Siyah-Beyaz', description: 'İsviçreli minimalist akım; sıfır gürültü, cesur başlıklar, yüksek okunaklılık' },
    { id: 'deep_crimson', name: '🍷 Deep Crimson / Kadife Kırmızı', description: 'Güçlü ve göz alıcı zengin şarap kırmızısı ve asil koyu kadife esintisi' }
  ];

  const FONT_OPTIONS = [
    { id: 'Inter', name: 'Inter (Modern Sans-Serif)' },
    { id: 'Space Grotesk', name: 'Space Grotesk (Tech)' },
    { id: 'Playfair Display', name: 'Playfair Display (Zarif Klasik)' },
    { id: 'JetBrains Mono', name: 'JetBrains Mono (Sert & Minimal)' }
  ];

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
          portal_title: "Göz Alıcı İhtişam, Mühendislik Harikası",
          portal_description: "Seçkin oto galerilerimizin sertifikalı ultra lüks, eşsiz kondisyondaki araç koleksiyonunu doğrudan inceleyin.",
          announcement: "Sadece portal müşterilerine lüks gayrimenkul ve araç alımlarında 12 ila 36 ay vadede kişiye özel oranlı prestij kredisi ve takas desteği.",
          primary_color: "#ea580c",
          footer_text: "© 2026 Enrakipsiz.com. Tüm hakları saklıdır.",
          portal_domain: "enrakipsiz.com",
          theme_style: "dark_gold",
          font_family: "Inter",
          layout_sections: "[\"hero\",\"announcement\",\"sponsors\",\"vehicles\",\"properties\"]",
          custom_css: ""
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

  const filteredStores = stores.filter(s => {
    const storeSearchTerms = storeSearchTerm.toLowerCase().split(' ').filter(Boolean);
    const matchesSearch = storeSearchTerms.length === 0 || storeSearchTerms.every(term => 
      s.name.toLowerCase().includes(term) ||
      s.slug.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
    const matchesFilter = storeFilter === 'all' || 
      (storeFilter === 'active' && new Date(s.subscription_end) > new Date()) ||
      (storeFilter === 'expired' && new Date(s.subscription_end) <= new Date());
    return matchesSearch && matchesFilter;
  });

  const filteredLeads = leads.filter(l => {
    const leadSearchTerms = leadSearchTerm.toLowerCase().split(' ').filter(Boolean);
    const matchesSearch = leadSearchTerms.length === 0 || leadSearchTerms.every(term => 
      l.store_name.toLowerCase().includes(term) ||
      l.company_title?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term)
    );
    const matchesFilter = leadFilter === 'all' || l.status === leadFilter;
    return matchesSearch && matchesFilter;
  });

  const [newStore, setNewStore] = useState({
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
    plan: "free" as const,
    parent_id: "" as string | number,
    store_type: "product" as "product" | "real_estate" | "motor_vehicle",
    sub_sector: undefined as 'car' | 'motorcycle' | 'marine' | 'construction' | 'agricultural' | 'other' | undefined
  });

  const planLimits = {
    free: 50,
    basic: 100,
    pro: 500,
    enterprise: Infinity
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
        sub_sector: undefined
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
        <div className="space-y-8">
          {/* Header notification banner */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-lg">
            <div>
              <div className="flex items-center gap-2 text-rose-500 font-bold mb-1">
                <Sparkles className="h-5 w-5" />
                <span className="text-xs uppercase tracking-wider">CTO KONTROL SİSTEMİ</span>
              </div>
              <h2 className="text-xl font-black">enrakipsiz.com Portal Yönetim Sistemi</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                lookprice altyapısı üzerinde koşan enrakipsiz.com portal vitrinini, sponsor reklam alanlarını ve tüm görsel temayı tek panelden yönetin.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href="/marketplace" 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-1.5"
              >
                Portalı Canlı Gör <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* COLUMN 1: PORTAL CORE SETTINGS */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6 h-fit">
              <div>
                <h3 className="text-md font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-indigo-600" /> Portal Tema & Metin Ayarları
                </h3>
                <p className="text-xs text-gray-550 mb-4 font-medium">Portaldaki başlıkları, renkleri ve duyuru alanlarını dilediğinizce değiştirin.</p>
              </div>

              {loadingEnrakipsiz ? (
                <div className="py-12 text-center text-sm text-gray-450 font-bold animate-pulse">
                  Ayarlar Yükleniyor...
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Portal Giriş Ana Başlığı</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                      value={enrakipsizSettings.portal_title || ""}
                      onChange={e => setEnrakipsizSettings({...enrakipsizSettings, portal_title: e.target.value})}
                      placeholder="Göz Alıcı İhtişam, Mühendislik Harikası"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giriş Alt Başlık Açıklaması</label>
                    <textarea 
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs h-24"
                      value={enrakipsizSettings.portal_description || ""}
                      onChange={e => setEnrakipsizSettings({...enrakipsizSettings, portal_description: e.target.value})}
                      placeholder="En seçkin ilanlar..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bar Duyuru & Kampanya Barı Metni</label>
                    <textarea 
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs h-24"
                      value={enrakipsizSettings.announcement || ""}
                      onChange={e => setEnrakipsizSettings({...enrakipsizSettings, announcement: e.target.value})}
                      placeholder="Kişiye özel prestij kredisi..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Footer / Telif Hakkı Yazısı</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                      value={enrakipsizSettings.footer_text || ""}
                      onChange={e => setEnrakipsizSettings({...enrakipsizSettings, footer_text: e.target.value})}
                      placeholder="© 2026 Enrakipsiz.com. Tüm hakları saklıdır."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Portal Tema Vurgu Rengi</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        className="h-10 w-10 border border-gray-200 rounded-xl p-0.5 cursor-pointer"
                        value={enrakipsizSettings.primary_color || "#4f46e5"}
                        onChange={e => setEnrakipsizSettings({...enrakipsizSettings, primary_color: e.target.value})}
                      />
                      <input 
                        type="text" 
                        className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase font-mono"
                        value={enrakipsizSettings.primary_color || "#4f46e5"}
                        onChange={e => setEnrakipsizSettings({...enrakipsizSettings, primary_color: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Portal Ana Domaini (Bağlanacak Domain)</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                      value={enrakipsizSettings.portal_domain || ""}
                      onChange={e => setEnrakipsizSettings({...enrakipsizSettings, portal_domain: e.target.value})}
                      placeholder="enrakipsiz.com"
                    />
                    <p className="text-[9px] text-gray-400 mt-1 italic leading-tight">Bu domaine gelen trafik otomatik olarak Market/Portal sayfasına yönlendirilir.</p>
                  </div>

                  {/* PRESTİJLİ TEMA VE FONT AYARLARI */}
                  <div className="border-t pt-4 mt-6">
                    <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Palette className="h-4 w-4 text-emerald-500 animate-pulse" /> Premium Tema ve Akor Tanımları
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Görsel Konsept Teması</label>
                        <select 
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-slate-700"
                          value={enrakipsizSettings.theme_style || "dark_gold"}
                          onChange={e => setEnrakipsizSettings({...enrakipsizSettings, theme_style: e.target.value})}
                        >
                          {THEME_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </select>
                        <div className="mt-1.5 p-2 bg-amber-500/5 rounded-lg border border-amber-500/10 text-[9px] text-amber-800 leading-normal">
                          {THEME_OPTIONS.find(o => o.id === (enrakipsizSettings.theme_style || 'dark_gold'))?.description}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Birincil Yazı Tipi / Font</label>
                        <select 
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-slate-700"
                          value={enrakipsizSettings.font_family || "Inter"}
                          onChange={e => setEnrakipsizSettings({...enrakipsizSettings, font_family: e.target.value})}
                        >
                          {FONT_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* INTERAKTİF REORDERING GRIDS */}
                  <div className="border-t pt-4 mt-6">
                    <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Layout className="h-4 w-4 text-indigo-500" /> Amiral Gemisi Kaptan Izgarası
                    </h4>
                    <p className="text-[10px] text-gray-400 mb-3 italic">
                      Modülleri yukarı/aşağı taşıyarak sitenizin hiyerarşisini anında yönlendirebilirsiniz. Göz ikonu ile modülü gizleyin/gösterin.
                    </p>

                    <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      {(() => {
                        const sectionLabels: { [key: string]: string } = {
                          hero: "✨ Lüks Slayt Gösterisi & Arama",
                          announcement: "📣 Finans & Takas Duyuru Barı",
                          sponsors: "🏆 Sponsor Network Reklamları",
                          vehicles: "🚗 Premium Otomobil Vitrini",
                          properties: "🏡 Seçkin Gayrimenkul Vitrini"
                        };
                        return getParsedSections().map((sec, idx, arr) => {
                          const label = sectionLabels[sec.id] || sec.id;
                          return (
                            <div 
                              key={sec.id} 
                              className={`flex items-center justify-between p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                                sec.enabled 
                                  ? "bg-white border-slate-200 text-slate-700 shadow-sm" 
                                  : "bg-slate-100 border-slate-200 text-slate-400 line-through"
                              }`}
                            >
                              <span className="truncate pr-2">{label}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveSection(idx, 'up')}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-650 disabled:opacity-20"
                                  title="Yukarı Taşı"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === arr.length - 1}
                                  onClick={() => moveSection(idx, 'down')}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-650 disabled:opacity-20"
                                  title="Aşağı Taşı"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleSectionEnabled(sec.id)}
                                  className={`p-1 rounded ${
                                    sec.enabled 
                                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                                      : "bg-rose-50 text-rose-500 hover:bg-rose-100"
                                  }`}
                                  title={sec.enabled ? "Gizle" : "Göster"}
                                >
                                  {sec.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* CUSTOM CSS FIELD */}
                  <div className="border-t pt-4 mt-6">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Butik Ek Stil CSS (Custom CSS)</label>
                    <textarea 
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-mono h-24 whitespace-pre"
                      value={enrakipsizSettings.custom_css || ""}
                      onChange={e => setEnrakipsizSettings({...enrakipsizSettings, custom_css: e.target.value})}
                      placeholder="/* Örn: .brand-title { color: gold !important; } */"
                    />
                    <p className="text-[8.5px] text-gray-400 mt-1 italic leading-tight">Siteniz üzerindeki tüm kuralları ezmek için özel stil tanımlayabilirsiniz.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm transition-all text-xs disabled:bg-indigo-400 mt-6"
                  >
                    {savingSettings ? "Kaydediliyor..." : "Portal Ayarlarını Kaydet"}
                  </button>
                </form>
              )}
            </div>

            {/* COLUMN 2, 3, 4: SLIDERS & ADS */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* SLIDERS SECTION */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <div>
                    <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-indigo-600" /> Vitrin Slaytları (Slideshow)
                    </h3>
                    <p className="text-[10px] text-gray-450 font-semibold mt-0.5">Portalın en üstünde dönen büyük banner sistemi</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingSlide({
                        image_url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200",
                        title: "Yepyeni Bir Vitrin",
                        subtitle: "MİMARİ VEYA SÜPER SPOR COUPE",
                        description: "Kullanıcıları büyüleyecek şahane bir ürün veya mülk listeleme slide bannerı.",
                        badge: "Sponsor Marka",
                        accent: "from-indigo-500 to-purple-500",
                        type: "vehicle",
                        link_url: "",
                        is_active: true
                      });
                      setShowSlideModal(true);
                    }}
                    className="bg-indigo-50 text-indigo-600 px-3.5 py-1.5 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Slayt Ekle
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {enrakipsizSlides.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500 font-bold">Slayt bulunmamaktadır.</div>
                  ) : (
                    enrakipsizSlides.map((slide) => (
                      <div key={slide.id} className="p-3.5 border rounded-xl flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-all">
                        <div className="flex items-center gap-3">
                          <img 
                            src={slide.image_url} 
                            alt={slide.title} 
                            className="h-12 w-16 object-cover rounded-lg border border-gray-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-xs text-gray-900 line-clamp-1">{slide.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-indigo-600 uppercase">{slide.badge}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-[10px] text-gray-450 font-mono italic capitalize">{slide.type}</span>
                              <span className="text-gray-300">•</span>
                              <span className={`text-[10px] font-bold ${slide.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                {slide.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingSlide(slide);
                              setShowSlideModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Slaytı Düzenle"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Slaytı Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SPONSOR ADS / REKLAM YÖNETİMİ */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <div>
                    <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-indigo-600" /> Reklam & Sponsor Alanları Yönetimi (Bannerlar)
                    </h3>
                    <p className="text-[10px] text-gray-450 font-semibold mt-0.5">Reklam verenlerin görsellerini, video reklamlarını ve özel kampanya linklerini yönetin</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingAd({
                        title: "Özel Banka Taşıt Kredisi",
                        broker: "LOOKPRICE BANK PARTNERS",
                        description: "Sadece portal müşterilerine özel fırsat...",
                        profit_badge: "%1.19 Faiz",
                        action_text: "Yarın Başvur",
                        link_url: "",
                        media_type: "image",
                        media_url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400",
                        position: "middle",
                        is_active: true
                      });
                      setShowAdModal(true);
                    }}
                    className="bg-indigo-50 text-indigo-600 px-3.5 py-1.5 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Reklam Ekle
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {enrakipsizAds.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-450">Kayıtlı reklam kampanyası bulunmuyor.</div>
                  ) : (
                    enrakipsizAds.map((ad) => (
                      <div key={ad.id} className="p-3.5 border rounded-xl flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-950 text-white rounded-lg flex items-center justify-center font-bold text-[10px]">
                            REK
                          </div>
                          <div>
                            <div className="font-bold text-xs text-gray-900 line-clamp-1">{ad.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-500 font-bold">{ad.broker}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-[10px] font-mono text-indigo-600">{ad.profit_badge}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase font-bold">{ad.position}</span>
                              <span className="text-gray-300">•</span>
                              <span className={`text-[10px] font-bold ${ad.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                {ad.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingAd(ad);
                              setShowAdModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Reklamı Düzenle"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Reklamı Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Store className="h-5 w-5 text-indigo-600" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.activeStores}</p>
          <p className="text-2xl font-bold text-gray-900">{stores.filter(s => new Date(s.subscription_end) > new Date()).length}</p>
        </div>

        <div 
          onClick={() => {
            const el = document.getElementById('requests-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Plus className="h-5 w-5 text-amber-600" />
            </div>
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.registrationRequests}</p>
          <p className="text-2xl font-bold text-gray-900">{registrationRequests.length}</p>
        </div>

        <div 
          onClick={() => {
            const el = document.getElementById('leads-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.newLeads}</p>
          <p className="text-2xl font-bold text-gray-900">{leads.filter(l => l.status === 'new').length}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.totalStores}</p>
          <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
        </div>
      </div>

      <div className="space-y-8">
        <section id="requests-section">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Plus className="mr-2 h-5 w-5 text-indigo-600" /> Mağaza Başvuruları
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mağaza / Şirket</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">İletişim</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plan / Ürün</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Durum</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {registrationRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm font-medium">Henüz başvuru bulunmuyor.</td>
                    </tr>
                  ) : (
                    registrationRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900 text-sm">{r.store_name}</div>
                          <div className="text-[10px] text-gray-400">{r.company_title}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-900">{r.username}</div>
                          <div className="text-[10px] text-gray-400">{r.phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-bold text-indigo-600 uppercase">{r.plan}</div>
                          <div className="text-[10px] text-gray-400">{r.upload_method === 'excel' ? 'Excel Yükleme' : 'Manuel Giriş'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            r.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {r.status === 'pending' ? 'Bekliyor' : r.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end items-center space-x-2">
                            {r.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleApproveRegistration(r.id)}
                                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-green-700 transition-all"
                                >
                                  Onayla
                                </button>
                                <button 
                                  onClick={() => handleRejectRegistration(r.id)}
                                  className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-red-100 transition-all"
                                >
                                  Reddet
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleDeleteRegistrationRequest(r.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Başvuruyu Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="leads-section" className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Users className="mr-2 h-5 w-5 text-indigo-600" /> {st.newRequests}
            </h2>
            <div className="flex items-center space-x-2">
              <select 
                value={leadFilter}
                onChange={(e) => setLeadFilter(e.target.value as any)}
                className="text-xs border-gray-200 rounded-lg bg-white p-1.5 focus:ring-indigo-500"
              >
                <option value="all">Tüm Talepler</option>
                <option value="new">Yeni</option>
                <option value="contacted">İletişime Geçildi</option>
                <option value="converted">Tamamlandı</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <div className="flex space-x-4 min-w-max md:min-w-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-x-0">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-[280px] md:w-auto relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    lead.probability > 70 ? 'bg-red-500' : lead.probability > 40 ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{lead.store_name}</h3>
                      <p className="text-[10px] text-gray-500">{lead.contact_name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      lead.status === 'new' ? 'bg-blue-50 text-blue-600' :
                      lead.status === 'contacted' ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {lead.status === 'new' ? 'Yeni' : lead.status === 'contacted' ? 'İletişim' : 'Tamam'}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-[10px] text-gray-500">
                      <Phone className="h-3 w-3 mr-1.5" /> {lead.phone}
                    </div>
                    <div className="flex items-center text-[10px] text-gray-500">
                      <Mail className="h-3 w-3 mr-1.5" /> {lead.email}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 uppercase font-bold">Olasılık</span>
                      <span className={`text-xs font-bold ${
                        lead.probability > 70 ? 'text-red-600' : lead.probability > 40 ? 'text-orange-600' : 'text-blue-600'
                      }`}>{lead.probability}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Talebi Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedLead(lead)}
                        className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title={st.viewDetails || "Detaylar"}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Store className="mr-2 h-5 w-5 text-indigo-600" /> {st.allStores}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={st.searchStore}
                  className="w-full md:w-64 pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  value={storeSearchTerm}
                  onChange={e => setStoreSearchTerm(e.target.value)}
                />
              </div>
              <select 
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value as any)}
                className="text-sm border-gray-200 rounded-xl bg-white px-3 py-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="expired">Süresi Dolan</option>
              </select>
              <button 
                onClick={exportStoresToExcel}
                className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
                title="Excel'e Aktar"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden md:inline">Dışarı Aktar</span>
              </button>
              <button 
                onClick={() => setShowAdd(true)}
                className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>{st.addStore}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mağaza</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bitiş Tarihi</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Durum</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStores.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm font-medium">Mağaza bulunamadı.</td>
                    </tr>
                  ) : (
                    filteredStores.map((store) => {
                      const isExpired = new Date(store.subscription_end) <= new Date();
                      return (
                        <tr key={store.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 md:px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg mr-3">
                                {store.name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-gray-900">{store.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{store.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <span className="text-xs font-medium text-gray-600 capitalize">{store.plan}</span>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="flex items-center text-xs text-gray-600">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              {new Date(store.subscription_end).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                              isExpired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                            }`}>
                              {isExpired ? 'Süresi Doldu' : 'Aktif'}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setSelectedStore(store)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title={st.viewDetails}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => setEditingStore(store)}
                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title={st.edit}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => setStoreToDelete(store)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title={st.delete}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
      </>
      )}

      <AnimatePresence>
        {showSlideModal && editingSlide && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setShowSlideModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              <h2 className="text-xl font-bold mb-5">Vitrin Slaytı Düzenle / Ekle</h2>
              <form onSubmit={handleSaveSlide} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Başlık (Title)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingSlide.title || ""} 
                    onChange={e => setEditingSlide({...editingSlide, title: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alt Başlık (Subtitle)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingSlide.subtitle || ""} 
                    onChange={e => setEditingSlide({...editingSlide, subtitle: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Açıklama (Description)</label>
                  <textarea 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs h-16" 
                    value={editingSlide.description || ""} 
                    onChange={e => setEditingSlide({...editingSlide, description: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Görsel Adresi (Image URL)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingSlide.image_url || ""} 
                    onChange={e => setEditingSlide({...editingSlide, image_url: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sponsor/Yayınlayan Rozeti</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingSlide.badge || ""} 
                    onChange={e => setEditingSlide({...editingSlide, badge: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kategori Türü (Type)</label>
                  <select 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" 
                    value={editingSlide.type || "vehicle"} 
                    onChange={e => setEditingSlide({...editingSlide, type: e.target.value})}
                  >
                    <option value="vehicle">Otomobil & Araç</option>
                    <option value="real_estate">Emlak & Gayrimenkul</option>
                    <option value="product">Diğer Özel Ürünler</option>
                    <option value="all">Genel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tıklama Yönlendirme Linki (Link URL)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingSlide.link_url || ""} 
                    onChange={e => setEditingSlide({...editingSlide, link_url: e.target.value})} 
                    placeholder="Eşleşen ilan veya dış link"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kart Renk Geçiş Grubu (Accent Gradient)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono" 
                    value={editingSlide.accent || "from-indigo-500 to-purple-500"} 
                    onChange={e => setEditingSlide({...editingSlide, accent: e.target.value})} 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="slide-is-active"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
                    checked={editingSlide.is_active !== false} 
                    onChange={e => setEditingSlide({...editingSlide, is_active: e.target.checked})} 
                  />
                  <label htmlFor="slide-is-active" className="text-sm font-semibold text-gray-700">Bu slayt aktif vizyonda gösterilsin</label>
                </div>
                <div className="flex space-x-2 pt-3">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-xs">Kaydet</button>
                  <button type="button" onClick={() => setShowSlideModal(false)} className="flex-1 bg-gray-100 text-gray-950 py-2 rounded-lg font-bold text-xs">İptal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showAdModal && editingAd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setShowAdModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              <h2 className="text-xl font-bold mb-5">Sponsor Reklam Kampanyası Düzenle / Ekle</h2>
              <form onSubmit={handleSaveAd} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reklam Kampanya Başlığı</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingAd.title || ""} 
                    onChange={e => setEditingAd({...editingAd, title: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reklam Veren Broker (Yayınlayan)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingAd.broker || ""} 
                    onChange={e => setEditingAd({...editingAd, broker: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kampanya Açıklama Metni</label>
                  <textarea 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs h-16" 
                    value={editingAd.description || ""} 
                    onChange={e => setEditingAd({...editingAd, description: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Slogan Rozeti (e.g., %1.19 Tercihli Faiz)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingAd.profit_badge || ""} 
                    onChange={e => setEditingAd({...editingAd, profit_badge: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Buton Aksiyon Yazısı</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingAd.action_text || "Hemen Keşfet"} 
                    onChange={e => setEditingAd({...editingAd, action_text: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reklam Tıklama Linki (Link URL)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingAd.link_url || ""} 
                    onChange={e => setEditingAd({...editingAd, link_url: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Medya Türü</label>
                  <select 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" 
                    value={editingAd.media_type || "image"} 
                    onChange={e => setEditingAd({...editingAd, media_type: e.target.value})}
                  >
                    <option value="image">Görsel (Image URL)</option>
                    <option value="video">Promosyon Videosu (Youtube/Video Link)</option>
                    <option value="html">Özel HTML Kod bloğu / Metin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Medya URL Adresi (Görsel veya Video linki)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingAd.media_url || ""} 
                    onChange={e => setEditingAd({...editingAd, media_url: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Yerleşim Pozisyonu (Layout Position)</label>
                  <select 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" 
                    value={editingAd.position || "middle"} 
                    onChange={e => setEditingAd({...editingAd, position: e.target.value})}
                  >
                    <option value="top">Üst Duyuru Altı Banner</option>
                    <option value="middle">İlan Kartları Arası Büyük Sponsor Kartı</option>
                    <option value="sidebar">Sağ/Sol Yan Sütun Reklamı</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="ad-is-active"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
                    checked={editingAd.is_active !== false} 
                    onChange={e => setEditingAd({...editingAd, is_active: e.target.checked})} 
                  />
                  <label htmlFor="ad-is-active" className="text-sm font-semibold text-gray-700">Bu kampanya yayında ve aktif gösterilsin</label>
                </div>
                <div className="flex space-x-2 pt-3">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-xs">Kaydet</button>
                  <button type="button" onClick={() => setShowAdModal(false)} className="flex-1 bg-gray-100 text-gray-950 py-2 rounded-lg font-bold text-xs">İptal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-2xl max-w-md w-full relative"
            >
              <button onClick={() => setSelectedLead(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              <h2 className="text-xl font-bold mb-5">{st.manageLead}</h2>
              <form onSubmit={handleUpdateLead} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.processStatus}</label>
                  <select 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={selectedLead.status} 
                    onChange={e => setSelectedLead({...selectedLead, status: e.target.value})}
                  >
                    <option value="new">Yeni</option>
                    <option value="contacted">İletişime Geçildi</option>
                    <option value="demo">Demo Yapıldı</option>
                    <option value="sold">Satış Tamamlandı</option>
                    <option value="lost">Kaybedildi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.salesProbability} (%{selectedLead.probability})</label>
                  <input 
                    type="range" 
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                    min="0" max="100" 
                    value={selectedLead.probability} 
                    onChange={e => setSelectedLead({...selectedLead, probability: parseInt(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.meetingNotes}</label>
                  <textarea 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    rows={3} 
                    value={selectedLead.notes || ""} 
                    onChange={e => setSelectedLead({...selectedLead, notes: e.target.value})}
                    placeholder={st.notesPlaceholder}
                  />
                </div>
                <div className="flex space-x-2 pt-3">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm">{st.update}</button>
                  <button type="button" onClick={() => setSelectedLead(null)} className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-bold text-sm">{st.close}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingStore && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-2xl max-w-xl w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setEditingStore(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              <h2 className="text-xl font-bold mb-5">{st.editStore}</h2>
              <form onSubmit={handleUpdateStore} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.storeName}</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={editingStore.name} 
                      onChange={e => setEditingStore({...editingStore, name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.slug}</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={editingStore.slug} 
                      onChange={e => setEditingStore({...editingStore, slug: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.authorizedPerson}</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={editingStore.contact_person} 
                      onChange={e => setEditingStore({...editingStore, contact_person: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.phone}</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={editingStore.phone} 
                      onChange={e => {
                        let val = e.target.value;
                        if (val && !val.startsWith('+')) val = '+' + val;
                        setEditingStore({...editingStore, phone: val});
                      }} 
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.address}</label>
                  <textarea 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    rows={2} 
                    value={editingStore.address || ""} 
                    onChange={e => setEditingStore({...editingStore, address: e.target.value})} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 md:col-span-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.country}</label>
                    <select 
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={editingStore.country || "TR"} 
                      onChange={e => {
                        const country = DEVELOPED_COUNTRIES.find(c => c.code === e.target.value);
                        setEditingStore({
                          ...editingStore, 
                          country: e.target.value,
                          phone: country && (!editingStore.phone || editingStore.phone.trim() === '') ? country.dialCode + " " : editingStore.phone
                        });
                      }}
                    >
                      {DEVELOPED_COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.email}</label>
                    <input 
                      type="email" 
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={editingStore.email} 
                      onChange={e => setEditingStore({...editingStore, email: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 md:col-span-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.currency}</label>
                    <select 
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={editingStore.default_currency || "TRY"} 
                      onChange={e => setEditingStore({...editingStore, default_currency: e.target.value})}
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.language}</label>
                    <select 
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={editingStore.language || "tr"} 
                      onChange={e => setEditingStore({...editingStore, language: e.target.value})}
                    >
                      <option value="tr">Turkish</option>
                      <option value="en">English</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Plan</label>
                    <select 
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={editingStore.plan || "free"} 
                      onChange={e => setEditingStore({...editingStore, plan: e.target.value})}
                    >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{st.newAdminPassword}</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingStore.admin_password || ""} 
                    onChange={e => setEditingStore({...editingStore, admin_password: e.target.value})} 
                    placeholder={st.passwordNote}
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mağaza Türü / Sektörü</label>
                  <select 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingStore.store_type || "product"} 
                    onChange={e => setEditingStore({...editingStore, store_type: e.target.value as any})}
                  >
                    <option value="product">Ürün & Perakende (Standart Satış)</option>
                    <option value="real_estate">Emlak (Gayrimenkul)</option>
                    <option value="motor_vehicle">Motorlu Taşıtlar (Oto, Moto, Deniz, İş, Tarım)</option>
                  </select>

                  {editingStore.store_type === 'motor_vehicle' && (
                    <select 
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={editingStore.sub_sector || ""} 
                      onChange={e => setEditingStore({...editingStore, sub_sector: e.target.value as any})}
                    >
                      <option value="">Kategori Seçiniz</option>
                      <option value="car">Otomobil & Hafif Ticari</option>
                      <option value="motorcycle">Motosiklet</option>
                      <option value="marine">Deniz Taşıtları</option>
                      <option value="construction">İş Makineleri</option>
                      <option value="agricultural">Tarım Makineleri</option>
                      <option value="other">Diğer Motorlu Taşıtlar</option>
                    </select>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Üst Mağaza (Şube ise)</label>
                  <select 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                    value={editingStore.parent_id || ""} 
                    onChange={e => setEditingStore({...editingStore, parent_id: e.target.value})}
                  >
                    <option value="">Bağımsız Mağaza</option>
                    {stores.filter(s => s.id !== editingStore.id && !s.parent_id).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 flex space-x-2 mt-2">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm">{st.update}</button>
                  <button type="button" onClick={() => setEditingStore(null)} className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-bold text-sm">{st.close}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedStore && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-2xl max-w-xl w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setSelectedStore(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              <h2 className="text-xl font-bold mb-5">{selectedStore.name} {st.storeDetails}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{st.companyInformation}</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">{st.address}</p>
                    <p className="text-xs text-gray-900">{selectedStore.address || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">{st.authorizedPerson}</p>
                    <p className="text-xs text-gray-900">{selectedStore.contact_person || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">{st.phone}</p>
                    <p className="text-xs text-gray-900">{selectedStore.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{st.systemAccess}</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">{st.adminLoginEmail}</p>
                    <p className="text-xs text-gray-900 font-mono">{selectedStore.admin_email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">{st.subscriptionEndDate}</p>
                    <p className="text-xs text-gray-900">{new Date(selectedStore.subscription_end).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        window.open(`${window.location.origin}/dashboard/${selectedStore.slug}`, '_blank');
                      }}
                      className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center"
                    >
                      <LogOut className="h-3.5 w-3.5 mr-2 rotate-180" /> {st.goToStorePanel}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedStore(null)}
                className="w-full bg-gray-100 text-gray-900 py-2 rounded-lg font-bold text-sm mt-6"
              >
                {st.close}
              </button>
            </motion.div>
          </div>
        )}

        {storeToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-6 rounded-2xl max-w-sm w-full relative shadow-2xl"
            >
              <h2 className="text-lg font-bold mb-3 text-red-600 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" /> Mağazayı Sil
              </h2>
              <p className="text-xs text-gray-600 mb-5 font-medium">
                <span className="font-bold text-gray-900">{storeToDelete.name}</span> mağazasını ve tüm verilerini kalıcı olarak silmek istediğinize emin misiniz?
              </p>
              
              <form onSubmit={handleDeleteStore} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Admin Şifrenizi Girin</label>
                  <input 
                    type="password" 
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-0 transition-all text-sm"
                    placeholder="Şifreniz"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="flex space-x-2 pt-1">
                  <button 
                    type="button"
                    onClick={() => {
                      setStoreToDelete(null);
                      setDeletePassword("");
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all"
                  >
                    Vazgeç
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-sm"
                  >
                    Sil
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-2xl max-w-3xl w-full relative my-4 max-h-[90vh] overflow-y-auto flex flex-col"
          >
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold mb-5 sticky top-0 bg-white z-0">{st.registerNewStore}</h2>
            <form onSubmit={handleAddStore} className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.storeInformation}</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.storeName}</label>
                    <input required className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} placeholder="e.g. Migros" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.slugIdentifier}</label>
                    <input required className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.slug} onChange={e => setNewStore({...newStore, slug: e.target.value})} placeholder="e.g. migros" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.address}</label>
                    <textarea className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" rows={2} value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">{st.authorizedPerson}</label>
                      <input className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.contact_person} onChange={e => setNewStore({...newStore, contact_person: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">{st.country}</label>
                      <select 
                        className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                        value={newStore.country} 
                        onChange={e => {
                          const country = DEVELOPED_COUNTRIES.find(c => c.code === e.target.value);
                          setNewStore({
                            ...newStore, 
                            country: e.target.value,
                            phone: country ? country.dialCode + " " : newStore.phone
                          });
                        }}
                      >
                        {DEVELOPED_COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.phone}</label>
                    <input className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.phone} onChange={e => setNewStore({...newStore, phone: e.target.value})} placeholder="+90 5XX XXX XX XX" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.email}</label>
                    <input type="email" className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.email} onChange={e => setNewStore({...newStore, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Mağaza Türü / Sektörü</label>
                    <select 
                      className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={newStore.store_type} 
                      onChange={e => setNewStore({...newStore, store_type: e.target.value as any})}
                    >
                      <option value="product">Ürün & Perakende (Standart Satış)</option>
                      <option value="real_estate">Emlak (Gayrimenkul)</option>
                      <option value="motor_vehicle">Motorlu Taşıtlar (Oto, Moto, Deniz, İş, Tarım)</option>
                    </select>
                  </div>
                  
                  {newStore.store_type === 'motor_vehicle' && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Taşıt Kategorisi</label>
                        <select 
                          className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                          value={newStore.sub_sector || ""} 
                          onChange={e => setNewStore({...newStore, sub_sector: e.target.value as any})}
                        >
                          <option value="">Kategori Seçiniz</option>
                          <option value="car">Otomobil & Hafif Ticari</option>
                          <option value="motorcycle">Motosiklet</option>
                          <option value="marine">Deniz Taşıtları</option>
                          <option value="construction">İş Makineleri</option>
                          <option value="agricultural">Tarım Makineleri</option>
                          <option value="other">Diğer Motorlu Taşıtlar</option>
                        </select>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.adminAccount}</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.adminLoginEmail}</label>
                    <input type="email" required className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.admin_email} onChange={e => setNewStore({...newStore, admin_email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.adminPassword}</label>
                    <input type="password" required className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.admin_password} onChange={e => setNewStore({...newStore, admin_password: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.subscriptionEndDate}</label>
                    <input type="date" required className="mt-1 block w-[16ch] p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={newStore.subscription_end} onChange={e => setNewStore({...newStore, subscription_end: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">{st.plan || 'Plan'}</label>
                      <select 
                        className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                        value={newStore.plan} 
                        onChange={e => setNewStore({...newStore, plan: e.target.value as any})}
                      >
                        <option value="free">Free (50)</option>
                        <option value="basic">Basic (100)</option>
                        <option value="pro">Pro (500)</option>
                        <option value="enterprise">Enterprise (Unlimited)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">{st.currency}</label>
                      <select 
                        className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                        value={newStore.default_currency} 
                        onChange={e => setNewStore({...newStore, default_currency: e.target.value})}
                      >
                        <option value="TRY">TRY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">{st.language}</label>
                    <select 
                      className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={newStore.language} 
                      onChange={e => setNewStore({...newStore, language: e.target.value})}
                    >
                      <option value="tr">Turkish</option>
                      <option value="en">English</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Üst Mağaza (Şube ise)</label>
                    <select 
                      className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                      value={newStore.parent_id} 
                      onChange={e => setNewStore({...newStore, parent_id: e.target.value})}
                    >
                      <option value="">Bağımsız Mağaza</option>
                      {stores.filter(s => !s.parent_id).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white pt-6 pb-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-500 font-medium text-sm">{st.cancel}</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-sm text-sm">{st.register}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
