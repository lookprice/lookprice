import React, { useState, useEffect, useMemo } from "react";
import {
  Globe,
  Plus,
  RefreshCw,
  Search,
  Building2,
  Users,
  CheckCircle2,
  Trash2,
  Edit3,
  ArrowUpRight,
  Languages,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  X
} from "lucide-react";
import { toast } from "sonner";

interface GlobalPoolAgency {
  id: number;
  agency_code: string;
  company_name: string;
  broker_name: string;
  email: string;
  phone: string;
  whatsapp_phone?: string;
  website?: string;
  country: string;
  city_region: string;
  spoken_languages: string[];
  specialization: string;
  agent_count: number;
  tier: string;
  default_commission_rate: number;
  bonus_commission_rate: number;
  restatelp_status: string;
  restatelp_store_slug?: string;
  source_type: "superadmin_master" | "operator_reverse_feed";
  contributed_by_store_id?: number;
  contributed_by_store_name?: string;
  verified: boolean;
  notes?: string;
  created_at?: string;
}

interface DeveloperStoreRef {
  id: number;
  name: string;
  slug: string;
  address: string;
  contact_person: string;
  status: string;
}

const AVAILABLE_LANGUAGES = [
  { code: "TR", label: "Türkçe (TR)" },
  { code: "EN", label: "English (EN)" },
  { code: "RU", label: "Русский (RU)" },
  { code: "DE", label: "Deutsch (DE)" },
  { code: "FA", label: "فارسی (FA)" },
  { code: "AR", label: "العربية (AR)" },
  { code: "SV", label: "Svenska (SV)" },
  { code: "ES", label: "Español (ES)" }
];

const COUNTRY_OPTIONS = [
  "KKTC",
  "Türkiye",
  "İngiltere (UK)",
  "Almanya (DACH)",
  "Rusya & CIS",
  "İskandinavya",
  "BAE & Orta Doğu",
  "İran & Körfez",
  "İspanya & Avrupa"
];

export const SuperAdminGlobalAgencyPool: React.FC = () => {
  const [agencies, setAgencies] = useState<GlobalPoolAgency[]>([]);
  const [developerStores, setDeveloperStores] = useState<DeveloperStoreRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "superadmin_master" | "operator_reverse_feed">("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [langFilter, setLangFilter] = useState<string>("all");

  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<GlobalPoolAgency | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    broker_name: "",
    email: "",
    phone: "+90 548 ",
    website: "",
    country: "KKTC",
    city_region: "Girne & Esentepe",
    spoken_languages: ["TR", "EN"] as string[],
    specialization: "Kıyı Yatırım, Rezidans & Lüks Villa",
    agent_count: 15,
    tier: "Gold",
    default_commission_rate: 8,
    bonus_commission_rate: 2,
    restatelp_status: "prospect",
    notes: ""
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("superadmin_token") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  };

  const fetchPool = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/developer-projects/global-pool", {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Havuz verisi alınamadı");
      const data = await res.json();
      setAgencies(Array.isArray(data.agencies) ? data.agencies : []);
      setDeveloperStores(Array.isArray(data.developerStores) ? data.developerStores : []);
    } catch (err: any) {
      toast.error(err.message || "Global Emlakçı Havuzu yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPool();
  }, []);

  const handleSyncAllStores = async () => {
    try {
      setSyncingAll(true);
      const res = await fetch("/api/developer-projects/global-pool/sync-all", {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Senkronizasyon hatası");
      toast.success(
        `Merkezi havuzdaki tüm emlakçılar ${data.syncedStoresCount} adet projectLP inşaat firmasına senkronize edildi (${data.totalNewLinksCreated} yeni bağlantı).`
      );
      fetchPool();
    } catch (err: any) {
      toast.error(err.message || "Senkronizasyon başarısız.");
    } finally {
      setSyncingAll(false);
    }
  };

  const openCreateModal = () => {
    setEditingAgency(null);
    setForm({
      company_name: "",
      broker_name: "",
      email: "",
      phone: "+90 548 ",
      website: "",
      country: "KKTC",
      city_region: "Girne & Esentepe",
      spoken_languages: ["TR", "EN"],
      specialization: "Kıyı Yatırım, Rezidans & Lüks Villa",
      agent_count: 15,
      tier: "Gold",
      default_commission_rate: 8,
      bonus_commission_rate: 2,
      restatelp_status: "prospect",
      notes: ""
    });
    setShowModal(true);
  };

  const openEditModal = (ag: GlobalPoolAgency) => {
    setEditingAgency(ag);
    setForm({
      company_name: ag.company_name || "",
      broker_name: ag.broker_name || "",
      email: ag.email || "",
      phone: ag.phone || "",
      website: ag.website || "",
      country: ag.country || "KKTC",
      city_region: ag.city_region || "",
      spoken_languages: Array.isArray(ag.spoken_languages) ? ag.spoken_languages : ["TR", "EN"],
      specialization: ag.specialization || "",
      agent_count: Number(ag.agent_count) || 12,
      tier: ag.tier || "Gold",
      default_commission_rate: Number(ag.default_commission_rate) || 8,
      bonus_commission_rate: Number(ag.bonus_commission_rate) || 2,
      restatelp_status: ag.restatelp_status || "prospect",
      notes: ag.notes || ""
    });
    setShowModal(true);
  };

  const toggleLanguageInForm = (code: string) => {
    setForm(prev => {
      const exists = prev.spoken_languages.includes(code);
      if (exists && prev.spoken_languages.length === 1) return prev;
      return {
        ...prev,
        spoken_languages: exists
          ? prev.spoken_languages.filter(c => c !== code)
          : [...prev.spoken_languages, code]
      };
    });
  };

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.broker_name.trim()) {
      toast.error("Lütfen emlak ofisi adını ve sorumlu broker adını giriniz.");
      return;
    }
    try {
      setSaving(true);
      if (editingAgency) {
        const res = await fetch(`/api/developer-projects/global-pool/${editingAgency.id}`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error("Güncelleme başarısız");
        toast.success(`"${form.company_name}" merkezi havuzda güncellendi.`);
      } else {
        const res = await fetch("/api/developer-projects/global-pool", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Kayıt başarısız");
        toast.success(
          `"${form.company_name}" Merkezi Global Emlakçı Havuzuna eklendi ve ${data.syncedStoresCount || 0} projectLP inşaat firmasına otomatik tanımlandı.`
        );
      }
      setShowModal(false);
      fetchPool();
    } catch (err: any) {
      toast.error(err.message || "İşlem sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgency = async (ag: GlobalPoolAgency) => {
    try {
      const res = await fetch(`/api/developer-projects/global-pool/${ag.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Silinemedi");
      toast.success(`"${ag.company_name}" merkezi havuzdan kaldırıldı.`);
      setAgencies(prev => prev.filter(item => item.id !== ag.id));
    } catch (err: any) {
      toast.error(err.message || "Silme hatası");
    }
  };

  const filteredAgencies = useMemo(() => {
    return agencies.filter(a => {
      if (sourceFilter !== "all" && a.source_type !== sourceFilter) return false;
      if (countryFilter !== "all" && a.country !== countryFilter) return false;
      if (langFilter !== "all" && !(a.spoken_languages || []).includes(langFilter)) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          (a.company_name || "").toLowerCase().includes(q) ||
          (a.broker_name || "").toLowerCase().includes(q) ||
          (a.country || "").toLowerCase().includes(q) ||
          (a.city_region || "").toLowerCase().includes(q) ||
          (a.agency_code || "").toLowerCase().includes(q) ||
          (a.contributed_by_store_name || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [agencies, sourceFilter, countryFilter, langFilter, searchTerm]);

  const stats = useMemo(() => {
    const masterCount = agencies.filter(a => a.source_type === "superadmin_master").length;
    const reverseFedCount = agencies.filter(a => a.source_type === "operator_reverse_feed").length;
    const countriesCount = new Set(agencies.map(a => a.country)).size;
    const restateActiveCount = agencies.filter(a => a.restatelp_status === "active_member").length;
    return {
      total: agencies.length,
      masterCount,
      reverseFedCount,
      countriesCount,
      restateActiveCount
    };
  }, [agencies]);

  return (
    <div className="space-y-3">
      {/* Single Integrated Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Emlak Ofisleri Havuzu ({stats.total})
            </h2>
            <p className="text-xs text-slate-300">
              İnşaat ve proje firmalarıyla paylaşılan anlaşmalı emlak ofisleri ve broker ağı.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="/dashboard/cyprus-constructions"
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Cyprus Constructions Paneli</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleSyncAllStores}
              disabled={syncingAll}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${syncingAll ? "animate-spin" : ""}`} />
              <span>Havuzu Eşitle ({developerStores.length})</span>
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Emlak Ofisi Ekle</span>
            </button>
          </div>
        </div>

        {/* 4-Column Quantitative KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-slate-800">
          <div className="bg-slate-800/70 rounded-xl px-3.5 py-2.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400">Toplam Emlak Ofisi</div>
            <div className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
              {stats.total} Ofis
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {stats.countriesCount} Ülke · 8 Dil
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-xl px-3.5 py-2.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400">Merkez Kayıtları</div>
            <div className="text-lg font-bold text-indigo-300 font-mono tabular-nums mt-0.5">
              {stats.masterCount} Ofis
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Doğrudan tanımlanan ofisler
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-xl px-3.5 py-2.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400">Firma Eklemeleri</div>
            <div className="text-lg font-bold text-emerald-300 font-mono tabular-nums mt-0.5">
              +{stats.reverseFedCount} Ofis
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Proje firmaları tarafından eklenen
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-xl px-3.5 py-2.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400">Proje Firmaları</div>
            <div className="text-lg font-bold text-amber-300 font-mono tabular-nums mt-0.5">
              {developerStores.length} Firma
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {stats.restateActiveCount} REstateLP Üyesi
            </div>
          </div>
        </div>
      </div>

      {/* Connected Developer Stores Strip */}
      {developerStores.length > 0 && (
        <div className="bg-white rounded-xl px-3.5 py-2.5 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>İnşaat & Proje Firmaları:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            {developerStores.map((ds, idx) => (
              <React.Fragment key={ds.id}>
                {idx > 0 && <span aria-hidden="true" className="text-slate-300">·</span>}
                <a
                  href={`/dashboard/${ds.slug}`}
                  className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                  <span>{String(ds.name || "").replace(/\s*\(projectLP\)\s*/gi, "")}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </a>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setSourceFilter("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                sourceFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tümü ({stats.total})
            </button>
            <button
              onClick={() => setSourceFilter("superadmin_master")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                sourceFilter === "superadmin_master" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Merkez ({stats.masterCount})
            </button>
            <button
              onClick={() => setSourceFilter("operator_reverse_feed")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                sourceFilter === "operator_reverse_feed" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Firma Eklemeleri (+{stats.reverseFedCount})
            </button>
          </div>

          <select
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800"
          >
            <option value="all">Tüm Ülkeler</option>
            {COUNTRY_OPTIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={langFilter}
            onChange={e => setLangFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800"
          >
            <option value="all">Tüm Diller (TR/EN/RU/DE/AR/FA)</option>
            {AVAILABLE_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Emlak ofisi, broker, ülke, şehir ara..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* High-Density Global Agency Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-semibold border-b border-slate-800">
                <th className="px-3 py-2.5">Kod & Kaynak</th>
                <th className="px-3 py-2.5">Emlak Ofisi & Sorumlu Broker</th>
                <th className="px-3 py-2.5">Ülke / Bölge</th>
                <th className="px-3 py-2.5">Konuşulan Diller</th>
                <th className="px-3 py-2.5">İletişim</th>
                <th className="px-3 py-2.5 text-right">Komisyon & Tier</th>
                <th className="px-3 py-2.5">REstateLP Durumu</th>
                <th className="px-3 py-2.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Merkezi Global Emlakçı Havuzu yükleniyor...
                  </td>
                </tr>
              ) : filteredAgencies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Arama kriterlerine uygun emlak ofisi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAgencies.map(ag => (
                  <tr key={ag.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2.5 align-top">
                      <div className="font-mono font-bold text-slate-900 tabular-nums">
                        {ag.agency_code}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ag.source_type === "operator_reverse_feed" ? (
                          <span className="text-emerald-700 font-semibold">
                            Geri Besleme · {ag.contributed_by_store_name || "Proje Firması"}
                          </span>
                        ) : (
                          <span>SuperAdmin Merkez</span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 align-top">
                      <div className="font-bold text-slate-900">{ag.company_name}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {ag.broker_name} · <span className="font-mono tabular-nums">{ag.agent_count || 10}</span> Danışman
                      </div>
                      {ag.specialization && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{ag.specialization}</div>
                      )}
                    </td>

                    <td className="px-3 py-2.5 align-top">
                      <div className="font-semibold text-slate-900 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{ag.country}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{ag.city_region}</div>
                    </td>

                    <td className="px-3 py-2.5 align-top">
                      <div className="flex items-center gap-1 text-slate-800 font-mono text-[11px] font-semibold">
                        <Languages className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{(ag.spoken_languages || ["TR", "EN"]).join(" · ")}</span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 align-top">
                      <div className="text-slate-800 font-mono tabular-nums flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{ag.phone}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[170px]">{ag.email}</span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 align-top text-right font-mono tabular-nums">
                      <div className="font-bold text-slate-900">
                        %{ag.default_commission_rate} + %{ag.bonus_commission_rate} Bonus
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Segment: <strong className="text-slate-800">{ag.tier}</strong>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 align-top">
                      {ag.restatelp_status === "active_member" ? (
                        <div className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Aktif REstateLP Üyesi</span>
                        </div>
                      ) : ag.restatelp_status === "invited" ? (
                        <div className="text-amber-700 font-medium">REstateLP Daveti Gönderildi</div>
                      ) : (
                        <div className="text-slate-500">Gözlemci-Paydaş (Aday)</div>
                      )}
                    </td>

                    <td className="px-3 py-2.5 align-top text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(ag)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgency(ag)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Havuzdan Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Global Pool Agency Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {editingAgency ? "Emlak Ofisini Düzenle" : "Emlak Ofisi Ekle"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAgency} className="p-4 space-y-3 max-h-[82vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emlak Ofisi / Şirket Adı *</label>
                  <input
                    type="text"
                    required
                    value={form.company_name}
                    onChange={e => setForm({ ...form, company_name: e.target.value })}
                    placeholder="Örn: Prime Mediterranean Realty Ltd."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sorumlu Broker / Direktör Adı *</label>
                  <input
                    type="text"
                    required
                    value={form.broker_name}
                    onChange={e => setForm({ ...form, broker_name: e.target.value })}
                    placeholder="Örn: Alexander Wright"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ülke / Pazar</label>
                  <select
                    value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                  >
                    {COUNTRY_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Şehir / Bölge</label>
                  <input
                    type="text"
                    value={form.city_region}
                    onChange={e => setForm({ ...form, city_region: e.target.value })}
                    placeholder="Örn: Londra / Girne / Moskova"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Uzmanlık Alanı</label>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={e => setForm({ ...form, specialization: e.target.value })}
                    placeholder="Örn: Sahil Villaları & Yatırım"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefon / WhatsApp</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+90 548 000 00 00"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kurumsal E-Posta</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="info@agency.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              {/* Spoken Languages Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ofiste Konuşulan Diller (Çok Dilli CRM & Sözleşme Eşleşmesi İçin)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_LANGUAGES.map(l => {
                    const active = form.spoken_languages.includes(l.code);
                    return (
                      <button
                        type="button"
                        key={l.code}
                        onClick={() => toggleLanguageInForm(l.code)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          active
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bounded-Width Compact Financial / Tier Inputs per AGENTS.md Rule 13 */}
              <div className="flex flex-wrap items-end gap-3 pt-1">
                <div className="w-28">
                  <label className="block font-semibold text-slate-700 mb-1">Segment</label>
                  <select
                    value={form.tier}
                    onChange={e => setForm({ ...form, tier: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                  >
                    <option value="VIP">VIP</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>

                <div className="w-24">
                  <label className="block font-semibold text-slate-700 mb-1">Komisyon %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.default_commission_rate}
                    onChange={e => setForm({ ...form, default_commission_rate: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono tabular-nums"
                  />
                </div>

                <div className="w-24">
                  <label className="block font-semibold text-slate-700 mb-1">Bonus %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.bonus_commission_rate}
                    onChange={e => setForm({ ...form, bonus_commission_rate: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono tabular-nums"
                  />
                </div>

                <div className="w-24">
                  <label className="block font-semibold text-slate-700 mb-1">Danışman</label>
                  <input
                    type="number"
                    value={form.agent_count}
                    onChange={e => setForm({ ...form, agent_count: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono tabular-nums"
                  />
                </div>

                <div className="flex-1 min-w-[180px]">
                  <label className="block font-semibold text-slate-700 mb-1">REstateLP Ekosistem Statüsü</label>
                  <select
                    value={form.restatelp_status}
                    onChange={e => setForm({ ...form, restatelp_status: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                  >
                    <option value="prospect">Gözlemci-Paydaş (Potansiyel REstateLP Adayı)</option>
                    <option value="invited">REstateLP Kurumsal Daveti Gönderildi</option>
                    <option value="active_member">Aktif REstateLP Abonesi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Saha & Portföy Notu</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Acentenin güçlü olduğu bölgeler, yatırımcı kitlesi ve çalışma notları..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
