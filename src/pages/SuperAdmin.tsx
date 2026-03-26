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
  Phone
} from "lucide-react";
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from "motion/react";
import { translations } from "../translations";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import { DEVELOPED_COUNTRIES } from "../constants";

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
    const matchesSearch = s.name.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(storeSearchTerm.toLowerCase());
    const matchesFilter = storeFilter === 'all' || 
      (storeFilter === 'active' && new Date(s.subscription_end) > new Date()) ||
      (storeFilter === 'expired' && new Date(s.subscription_end) <= new Date());
    return matchesSearch && matchesFilter;
  });

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.store_name.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
      l.company_title?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
      l.email?.toLowerCase().includes(leadSearchTerm.toLowerCase());
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
    plan: "free" as const
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
      await api.addStore(newStore);
      setShowAdd(false);
      setNewStore({
        name: "",
        slug: "",
        address: "",
        contact_person: "",
        phone: "",
        email: "",
        admin_email: "",
        admin_password: "",
        subscription_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        default_currency: "TRY",
        language: "tr",
        plan: "free"
      });
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateStore(editingStore.id, editingStore);
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


  return (
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
                          {r.status === 'pending' && (
                            <div className="flex justify-end space-x-2">
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
                            </div>
                          )}
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
                    <button 
                      onClick={() => setSelectedLead(lead)}
                      className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
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
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mağaza</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bitiş Tarihi</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">İşlemler</th>
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
                          <td className="px-6 py-4">
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
                          <td className="px-6 py-4">
                            <span className="text-xs font-medium text-gray-600 capitalize">{store.plan}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-xs text-gray-600">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              {new Date(store.subscription_end).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                              isExpired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                            }`}>
                              {isExpired ? 'Süresi Doldu' : 'Aktif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
            className="bg-white p-6 rounded-2xl max-w-3xl w-full relative my-4"
          >
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold mb-5">{st.registerNewStore}</h2>
            <form onSubmit={handleAddStore} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="flex justify-end space-x-2 pt-6">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-500 font-medium text-sm">{st.cancel}</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-sm text-sm">{st.register}</button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
