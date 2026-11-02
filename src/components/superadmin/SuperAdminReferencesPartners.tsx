import React, { useState, useEffect } from "react";
import {
  Globe,
  Handshake,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Check,
  Search,
  Upload,
  Building2,
  Store as StoreIcon,
  Award,
  Megaphone,
  X,
  Save,
  Eye,
  EyeOff,
  Star
} from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";
import { PartnerBrandLogo } from "../LandingReferencesAndPartners";

const SECTOR_OPTIONS = [
  { value: "product", label: "Perakende & E-Ticaret (shopLP)" },
  { value: "cafe_restaurant", label: "Restoran, Kafe & Otel (horecaLP)" },
  { value: "real_estate", label: "Gayrimenkul Portföy (restateLP)" },
  { value: "motor_vehicle", label: "Oto Galeri & Filo (autoLP)" },
  { value: "bookstore", label: "Kitabevi & Yayınevi (bookLP)" },
  { value: "hotel", label: "Otel & Konaklama (hotelLP)" },
  { value: "corporate_website", label: "Kurumsal Web Sitesi (webLP)" },
];

const PARTNER_CATEGORIES = [
  { value: "partnership", label: "İş Ortaklıklarımız (MySoft, iyzico, PayPal, PayTR vb.)" },
  { value: "marketplace", label: "E-Pazaryeri Entegrasyonları (Trendyol, Hepsiburada, N11, Pazarama, Amazon)" },
  { value: "tech_integration", label: "Teknik Entegrasyonlar (Google, Meta, Cloudflare, TCMB vb.)" },
];

export const SuperAdminReferencesPartners: React.FC = () => {
  const [subTab, setSubTab] = useState<"references" | "partners">("references");
  const [loading, setLoading] = useState(true);
  const [references, setReferences] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [storeSearch, setStoreSearch] = useState("");
  const [togglingStoreId, setTogglingStoreId] = useState<number | null>(null);

  // Reference Modal State
  const [editingRef, setEditingRef] = useState<any | null>(null);
  const [savingRef, setSavingRef] = useState(false);

  // Partner Modal State
  const [editingPartner, setEditingPartner] = useState<any | null>(null);
  const [savingPartner, setSavingPartner] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminReferencesPartners();
      setReferences(res.references || []);
      setPartners(res.partners || []);
      setAvailableStores(res.availableStores || []);
    } catch (err: any) {
      toast.error(err.message || "Referans ve partner verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleToggleStoreReference = async (storeId: number) => {
    setTogglingStoreId(storeId);
    try {
      const res = await api.toggleStoreAsReference(storeId);
      toast.success(res.message || "Güncellendi");
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "İşlem başarısız");
    } finally {
      setTogglingStoreId(null);
    }
  };

  const handleSaveReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRef?.company_name) {
      toast.error("Firma / Mağaza adı zorunludur.");
      return;
    }
    setSavingRef(true);
    try {
      await api.saveAdminReference(editingRef);
      toast.success("Referans başarıyla kaydedildi.");
      setEditingRef(null);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Kaydedilemedi");
    } finally {
      setSavingRef(false);
    }
  };

  const handleDeleteReference = async (id: number) => {
    if (!window.confirm("Bu müşteri referansını vitrinden silmek istediğinize emin misiniz?")) return;
    try {
      await api.deleteAdminReference(id);
      toast.success("Referans silindi.");
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Silinemedi");
    }
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner?.partner_name) {
      toast.error("İş ortağı / Entegrasyon adı zorunludur.");
      return;
    }
    setSavingPartner(true);
    try {
      await api.saveAdminPartner(editingPartner);
      toast.success("İş ortağı / duyuru başarıyla kaydedildi.");
      setEditingPartner(null);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Kaydedilemedi");
    } finally {
      setSavingPartner(false);
    }
  };

  const handleDeletePartner = async (id: number) => {
    if (!window.confirm("Bu iş ortağını silmek istediğinize emin misiniz?")) return;
    try {
      await api.deleteAdminPartner(id);
      toast.success("İş ortağı silindi.");
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Silinemedi");
    }
  };

  const handleFileToBase64 = (file: File, onDone: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        onDone(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const referencedStoreIds = new Set(references.map((r) => Number(r.store_id)).filter(Boolean));
  const filteredStores = availableStores.filter((s) => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(s.name || "").toLowerCase().includes(q) ||
      String(s.slug || "").toLowerCase().includes(q) ||
      String(s.custom_domain || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-[11px] font-black uppercase tracking-widest">
            <Award className="w-3.5 h-3.5" />
            <span>LOOKPRICE.NET KURUMSAL VİTRİN & GÜVEN MERKEZİ</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
            Müşteri Referansları (Canlı Web Siteleri) & Resmi İş Ortaklarımız
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            lookprice.net ana sayfasında yayınlanan sektörel müşteri web sitelerini, MySoft gibi proje ortaklıklarını ve entegrasyon duyurularını buradan yönetin. Logolar PostgreSQL yerel depolama üzerinden Supabase kısıtlamalarından bağımsız sunulur.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setSubTab("references")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === "references"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Müşteri Referansları ({references.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("partners")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === "partners"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Handshake className="w-3.5 h-3.5" />
            <span>İş Ortakları & Duyurular ({partners.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs font-bold text-slate-500 animate-pulse">
          Referans ve İş Ortaklığı verileri yükleniyor...
        </div>
      ) : subTab === "references" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT: 1-Click Store Picker from Existing Stores */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col max-h-[680px]">
            <div className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <StoreIcon className="w-4 h-4 text-indigo-600" />
                  <span>Sistemdeki Mağazalardan Seç</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  Tek Tıkla Vitrin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Kayıtlı merkez mağazaları tek tıkla lookprice.net referans vitrinine ekleyin veya çıkarın.
              </p>
              <div className="relative mt-2.5">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Mağaza adı, slug veya domain ara..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-2 pr-1">
              {filteredStores.map((st) => {
                const isSelected = referencedStoreIds.has(Number(st.id));
                const isBusy = togglingStoreId === st.id;
                return (
                  <div
                    key={st.id}
                    className="py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 px-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={st.logo_url}
                        alt={st.name}
                        className="w-9 h-9 rounded-lg object-contain bg-slate-900 p-1 border border-slate-200 shrink-0"
                        onError={(e: any) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `/api/storage/store_${st.id}_logo.svg?storeId=${st.id}&brand=${encodeURIComponent(st.name)}`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{st.name}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium truncate">
                          <span className="uppercase font-bold text-indigo-600">{st.store_type}</span>
                          <span>•</span>
                          <span className="truncate">{st.custom_domain || `/s/${st.slug}`}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleStoreReference(st.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white hover:bg-rose-600"
                          : "bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white"
                      }`}
                    >
                      {isBusy ? (
                        <span>...</span>
                      ) : isSelected ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Vitrinde</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Ekle</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Published References List & Custom Reference Add/Edit */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>lookprice.net Referans Vitrini ({references.length} Firma)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hem sistemdeki mağazaları hem de harici kurumsal/eski müşteri referanslarını düzenleyebilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingRef({
                    company_name: "",
                    sector: "product",
                    logo_url: "",
                    website_url: "https://",
                    city: "İstanbul",
                    badge_text: "Aktif E-Ticaret & Hızlı POS",
                    description: "",
                    primary_color: "#4f46e5",
                    is_featured: true,
                    is_active: true,
                    order_index: references.length,
                  })
                }
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Harici / Yeni Referans Ekle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {references.map((ref) => {
                const sectorObj = SECTOR_OPTIONS.find((s) => s.value === ref.sector);
                return (
                  <div
                    key={ref.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                      ref.is_active
                        ? "bg-slate-50/70 border-slate-200 hover:border-indigo-300"
                        : "bg-slate-100/50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-14 h-11 rounded-xl bg-slate-900 border border-slate-800 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={ref.logo_url}
                            alt={ref.company_name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e: any) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `/api/storage/ref_${ref.id}_logo.svg?brand=${encodeURIComponent(ref.company_name)}&color=${encodeURIComponent(ref.primary_color || "#4f46e5")}`;
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-slate-900 truncate">
                              {ref.company_name}
                            </h4>
                            {ref.is_featured && (
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-indigo-600 truncate">
                            {sectorObj ? sectorObj.label : ref.sector}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {ref.city || "Türkiye"} {ref.badge_text ? `• ${ref.badge_text}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingRef({ ...ref })}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReference(ref.id)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-300 cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {ref.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-2">{ref.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[10px]">
                      <span className="font-mono text-slate-500 truncate max-w-[200px]">
                        {ref.website_url || "Site linki yok"}
                      </span>
                      {ref.website_url && (
                        <a
                          href={ref.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <span>Siteyi Aç</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* PARTNERS & ANNOUNCEMENTS TAB */
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Handshake className="w-4 h-4 text-indigo-600" />
                <span>Resmi İş Ortaklarımız, Entegrasyonlar & Kurumsal Duyurular</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                MySoft gibi proje ortaklarını, resmi e-dönüşüm entegratörlerini ve pazaryeri/ödeme çözüm ortaklarını yönetin.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingPartner({
                  partner_name: "",
                  category: "partnership",
                  logo_url: "",
                  website_url: "https://",
                  badge_text: "",
                  announcement_title: "",
                  description: "",
                  brand_color: "#0284c7",
                  is_highlighted: false,
                  is_active: true,
                  order_index: partners.length,
                })
              }
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni İş Ortağı / Duyuru Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {partners.map((pt) => {
              const catObj = PARTNER_CATEGORIES.find((c) => c.value === pt.category);
              return (
                <div
                  key={pt.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                    pt.is_highlighted
                      ? "bg-gradient-to-br from-slate-900 to-slate-950 text-white border-indigo-500/40 shadow-md"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <PartnerBrandLogo
                        name={pt.partner_name}
                        logoUrl={pt.logo_url}
                        brandColor={pt.brand_color}
                      />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-indigo-500 truncate">
                          {catObj ? catObj.label.split(" (")[0] : pt.category}
                        </div>
                        <h4
                          className={`text-sm font-black mt-0.5 truncate ${
                            pt.is_highlighted ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {pt.partner_name}
                        </h4>
                        {pt.announcement_title && (
                          <div
                            className={`text-[11px] font-bold truncate ${
                              pt.is_highlighted ? "text-cyan-300" : "text-indigo-600"
                            }`}
                          >
                            {pt.announcement_title}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingPartner({ ...pt })}
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          pt.is_highlighted
                            ? "bg-white/10 border-white/15 text-white hover:bg-white/20"
                            : "bg-white border-slate-200 text-slate-700 hover:text-indigo-600"
                        }`}
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePartner(pt.id)}
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          pt.is_highlighted
                            ? "bg-white/10 border-white/15 text-rose-300 hover:bg-rose-500/20"
                            : "bg-white border-slate-200 text-slate-700 hover:text-rose-600"
                        }`}
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {pt.description && (
                    <p
                      className={`text-xs leading-relaxed line-clamp-2 ${
                        pt.is_highlighted ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {pt.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CUSTOMER REFERENCE */}
      {editingRef && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>{editingRef.id ? "Müşteri Referansını Düzenle" : "Yeni Müşteri Referansı Ekle"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingRef(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReference} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Firma / Mağaza Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRef.company_name || ""}
                    onChange={(e) => setEditingRef({ ...editingRef, company_name: e.target.value })}
                    placeholder="Örn: CepStore Mimaroba"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Sektör / Ürün Paketi *
                  </label>
                  <select
                    value={editingRef.sector || "product"}
                    onChange={(e) => setEditingRef({ ...editingRef, sector: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  >
                    {SECTOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Canlı Web Sitesi Adresi (URL)
                  </label>
                  <input
                    type="text"
                    value={editingRef.website_url || ""}
                    onChange={(e) => setEditingRef({ ...editingRef, website_url: e.target.value })}
                    placeholder="Örn: https://cepstore.com veya /s/cepstore"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Şehir / Bölge
                  </label>
                  <input
                    type="text"
                    value={editingRef.city || ""}
                    onChange={(e) => setEditingRef({ ...editingRef, city: e.target.value })}
                    placeholder="Örn: İstanbul / Girne"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Vitrin Rozeti / Kullanılan Çözüm
                  </label>
                  <input
                    type="text"
                    value={editingRef.badge_text || ""}
                    onChange={(e) => setEditingRef({ ...editingRef, badge_text: e.target.value })}
                    placeholder="Örn: E-Ticaret, Pazaryeri & Hızlı POS"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Marka Rengi
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingRef.primary_color || "#4f46e5"}
                      onChange={(e) => setEditingRef({ ...editingRef, primary_color: e.target.value })}
                      className="h-8 w-10 rounded cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={editingRef.primary_color || "#4f46e5"}
                      onChange={(e) => setEditingRef({ ...editingRef, primary_color: e.target.value })}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Logo Upload (Saved directly to PostgreSQL / Local Disk, immune to Supabase restrictions) */}
              <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                    Firma Logosu (Yerel + PostgreSQL Korumalı)
                  </span>
                  <label className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>Logo Yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileToBase64(file, (b64) =>
                            setEditingRef({ ...editingRef, logo_url: b64 })
                          );
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={editingRef.logo_url || ""}
                  onChange={(e) => setEditingRef({ ...editingRef, logo_url: e.target.value })}
                  placeholder="Logo URL veya yukarıdan dosya yükleyin (boş bırakılırsa otomatik kurumsal logo üretilir)"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Kısa Proje / Referans Açıklaması
                </label>
                <textarea
                  rows={2}
                  value={editingRef.description || ""}
                  onChange={(e) => setEditingRef({ ...editingRef, description: e.target.value })}
                  placeholder="Müşterimizin kullandığı modüller ve sağlanan dijital dönüşüm..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingRef.is_active !== false}
                      onChange={(e) => setEditingRef({ ...editingRef, is_active: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Yayında (Aktif)</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingRef.is_featured !== false}
                      onChange={(e) => setEditingRef({ ...editingRef, is_featured: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Öne Çıkan Referans</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRef(null)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={savingRef}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingRef ? "Kaydediliyor..." : "Kaydet"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT OFFICIAL PARTNER & ANNOUNCEMENT */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Handshake className="w-4 h-4 text-indigo-600" />
                <span>{editingPartner.id ? "İş Ortağı & Duyuru Düzenle" : "Yeni İş Ortağı / Entegrasyon Duyurusu"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    İş Ortağı / Kurum Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPartner.partner_name || ""}
                    onChange={(e) => setEditingPartner({ ...editingPartner, partner_name: e.target.value })}
                    placeholder="Örn: MySoft Dijital Dönüşüm"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Ortaklık Kategorisi *
                  </label>
                  <select
                    value={editingPartner.category || "e_transformation"}
                    onChange={(e) => setEditingPartner({ ...editingPartner, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  >
                    {PARTNER_CATEGORIES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Üst Rozet (Badge)
                  </label>
                  <input
                    type="text"
                    value={editingPartner.badge_text || ""}
                    onChange={(e) => setEditingPartner({ ...editingPartner, badge_text: e.target.value })}
                    placeholder="Örn: RESMİ PROJE & E-DÖNÜŞÜM ORTAĞI"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Kurumsal Web Linki (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={editingPartner.website_url || ""}
                    onChange={(e) => setEditingPartner({ ...editingPartner, website_url: e.target.value })}
                    placeholder="https://www.mysoft.com.tr"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Duyuru / İş Birliği Başlığı
                </label>
                <input
                  type="text"
                  value={editingPartner.announcement_title || ""}
                  onChange={(e) => setEditingPartner({ ...editingPartner, announcement_title: e.target.value })}
                  placeholder="Örn: MySoft & LookPrice Resmi e-Fatura / e-İrsaliye Proje Ortaklığı"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                    Partner Logosu & Kurumsal Renk
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingPartner.brand_color || "#0284c7"}
                      onChange={(e) => setEditingPartner({ ...editingPartner, brand_color: e.target.value })}
                      className="h-6 w-8 rounded cursor-pointer border border-white/20"
                    />
                    <label className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>Logo Yükle</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileToBase64(file, (b64) =>
                              setEditingPartner({ ...editingPartner, logo_url: b64 })
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  value={editingPartner.logo_url || ""}
                  onChange={(e) => setEditingPartner({ ...editingPartner, logo_url: e.target.value })}
                  placeholder="Logo URL veya dosya yükleyin"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Detaylı Ortaklık & Entegrasyon Açıklaması
                </label>
                <textarea
                  rows={3}
                  value={editingPartner.description || ""}
                  onChange={(e) => setEditingPartner({ ...editingPartner, description: e.target.value })}
                  placeholder="Entegrasyonun müşterilerimize sağladığı avantajlar..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPartner.is_active !== false}
                      onChange={(e) => setEditingPartner({ ...editingPartner, is_active: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Yayında</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold text-indigo-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingPartner.is_highlighted)}
                      onChange={(e) => setEditingPartner({ ...editingPartner, is_highlighted: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Büyük Proje Ortaklığı Duyurusu Olarak Vurgula</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPartner(null)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={savingPartner}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingPartner ? "Kaydediliyor..." : "Kaydet"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminReferencesPartners;
