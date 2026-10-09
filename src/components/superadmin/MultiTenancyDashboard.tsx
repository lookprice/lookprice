import React, { useState, useEffect } from "react";
import {
  Layers,
  Palette,
  Server,
  Shield,
  Globe,
  Save,
  Eye,
  FileCode2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Store as StoreIcon,
  Utensils,
  Car,
  Home,
  BookOpen,
  Hotel
} from "lucide-react";
import { api } from "../../services/api";
import StoreLogo from "../StoreLogo";
import { Store } from "../../types/superadmin";

import { MultiTenancyStoreList } from "./multitenancy/MultiTenancyStoreList";
import { MultiTenancyDesignTab } from "./multitenancy/MultiTenancyDesignTab";
import { MultiTenancyIntegrationsTab } from "./multitenancy/MultiTenancyIntegrationsTab";
import { MultiTenancyLicensesTab } from "./multitenancy/MultiTenancyLicensesTab";
import { MultiTenancyDomainTab } from "./multitenancy/MultiTenancyDomainTab";
import { MultiTenancyTemplatesTab } from "./multitenancy/MultiTenancyTemplatesTab";

interface MultiTenancyDashboardProps {
  stores: Store[];
  onRefreshStores: () => void;
  lang?: string;
}

/**
 * MultiTenancyDashboard: High-Density Orchestrator for Multi-Tenant Store Ecosystem
 */
export const MultiTenancyDashboard: React.FC<MultiTenancyDashboardProps> = ({
  stores,
  onRefreshStores,
  lang = "tr"
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(
    stores.length > 0 ? stores[0].id : null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeSubTab, setActiveSubTab] = useState<
    "design" | "integrations" | "licenses" | "domain" | "templates"
  >("design");

  // Config State for Selected Store
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [configForm, setConfigForm] = useState<any>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [jsonConfigInput, setJsonConfigInput] = useState("");

  // Sync selected store on stores prop change if not selected
  useEffect(() => {
    if (!selectedStoreId && stores.length > 0) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  // Fetch full config when selectedStoreId changes
  useEffect(() => {
    if (selectedStoreId) {
      fetchStoreConfig(selectedStoreId);
    }
  }, [selectedStoreId]);

  const fetchStoreConfig = async (id: number) => {
    try {
      setLoadingConfig(true);
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);
      const res = await api.getStoreConfig(id);
      if (res && res.store) {
        setStoreConfig(res.store);
        const br = res.store.branding || {};
        setConfigForm({
          name: res.store.name || "",
          slug: res.store.slug || "",
          email: res.store.email || "",
          phone: res.store.phone || "",
          store_type: res.store.store_type || "product",
          plan: res.store.plan || "free",
          subscription_end: res.store.subscription_end
            ? res.store.subscription_end.split("T")[0]
            : "",
          max_products: res.store.max_products || 100,
          max_properties: res.store.max_properties || 20,
          max_vehicles: res.store.max_vehicles || 20,
          max_users: res.store.max_users || 5,
          max_customers: res.store.max_customers || 50,
          custom_domain: res.store.custom_domain || "",
          hotel_module_enabled: Boolean(
            res.store.hotel_module_enabled || br.hotel_module_enabled
          ),
          bookstore_module_enabled: Boolean(
            res.store.bookstore_module_enabled || br.bookstore_module_enabled
          ),
          branding: {
            ...br,
            primary_color: br.primary_color || br.theme_color || "#0f172a",
            accent_color: br.accent_color || "#3b82f6",
            logo_url: br.logo_url || res.store.logo_url || "",
            hero_banner_url: br.hero_banner_url || "",
            page_layout_settings: {
              ...(br.page_layout_settings || {}),
              sector: res.store.store_type || "product"
            },
            marketplaces: br.marketplaces && Object.keys(br.marketplaces).length > 0 ? br.marketplaces : {
              trendyol: { enabled: true, supplier_id: "GAP-TR-01", api_key: "api_key_demo" },
              hepsiburada: { enabled: true, merchant_id: "GAP-HB-01", api_key: "api_key_demo" },
              n11: { enabled: true, supplier_code: "GAP-N11-01" },
              amazon: { enabled: true, seller_id: "GAP-AMZ-01" },
              pazarama: { enabled: true, supplier_id: "GAP-PZR-01" }
            },
            einvoice: br.einvoice && br.einvoice.enabled !== undefined ? br.einvoice : {
              enabled: true,
              username: "mysoft_gap",
              password: "secret_password",
              environment: "test"
            },
            currency_sync: br.currency_sync || { auto_tcmb: true }
          }
        });
      }
    } catch (err: any) {
      setSaveErrorMsg(err?.message || "Yapılandırma yüklenirken hata oluştu.");
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedStoreId) return;
    try {
      setSavingConfig(true);
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);

      const res = await api.updateStoreConfig(selectedStoreId, configForm);
      if (res && res.success) {
        setSaveSuccessMsg("Mağaza konfigürasyonu bağımsız ve güvenli olarak kaydedildi!");
        onRefreshStores();
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        setSaveErrorMsg(res?.error || "Kaydetme başarısız oldu.");
      }
    } catch (err: any) {
      setSaveErrorMsg(err?.message || "Bağlantı hatası oluştu.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleClonePreset = async (presetKey: string) => {
    if (!selectedStoreId) return;
    if (
      !window.confirm(
        `Bu mağazaya '${presetKey}' tasarım şablonunu uygulamak istediğinize emin misiniz? Mevcut tasarım ayarları güncellenecektir.`
      )
    ) {
      return;
    }
    try {
      setSavingConfig(true);
      const res = await api.cloneStoreConfig(selectedStoreId, presetKey);
      if (res && res.success) {
        setSaveSuccessMsg(`'${presetKey}' şablonu mağazaya başarıyla uygulandı.`);
        await fetchStoreConfig(selectedStoreId);
        onRefreshStores();
      }
    } catch (err: any) {
      setSaveErrorMsg(err?.message || "Şablon kopyalama hatası");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(configForm, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `store_config_${configForm.slug || selectedStoreId}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonConfigInput);
      setConfigForm((prev: any) => ({
        ...prev,
        ...parsed,
        branding: {
          ...(prev.branding || {}),
          ...(parsed.branding || {})
        }
      }));
      setSaveSuccessMsg(
        "JSON yapılandırması forma yüklendi. Değişiklikleri uygulamak için 'Kaydet' butonuna basınız."
      );
      setJsonConfigInput("");
    } catch (e: any) {
      setSaveErrorMsg("Geçersiz JSON formatı: " + e.message);
    }
  };

  // Filtered stores for tenant selector
  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      searchTerm === "" ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s as any).custom_domain?.toLowerCase().includes(searchTerm.toLowerCase());

    const isExpired = new Date(s.subscription_end) <= new Date();
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !isExpired) ||
      (statusFilter === "expired" && isExpired);

    const matchesSector =
      sectorFilter === "all" ||
      (sectorFilter === "product" && (s.store_type === "product" || !s.store_type)) ||
      (sectorFilter === "horeca" && s.store_type === "cafe_restaurant") ||
      (sectorFilter === "real_estate" && s.store_type === "real_estate") ||
      (sectorFilter === "automotive" && s.store_type === "motor_vehicle") ||
      (sectorFilter === "bookstore" &&
        (s.bookstore_module_enabled || (s.branding as any)?.bookstore_module_enabled));

    return matchesSearch && matchesStatus && matchesSector;
  });

  const getSectorBadge = (storeType: string, isHotel?: boolean, isBook?: boolean) => {
    if (isBook) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <BookOpen className="h-3 w-3" /> BookLP (Kitap)
        </span>
      );
    }
    if (isHotel) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Hotel className="h-3 w-3" /> HotelLP (Otel)
        </span>
      );
    }
    switch (storeType) {
      case "cafe_restaurant":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Utensils className="h-3 w-3" /> horecaLP
          </span>
        );
      case "real_estate":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/20">
            <Home className="h-3 w-3" /> Gayrimenkul
          </span>
        );
      case "motor_vehicle":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Car className="h-3 w-3" /> Otomotiv
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <StoreIcon className="h-3 w-3" /> shopLP Perakende
          </span>
        );
    }
  };

  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const isShopLpSelected = configForm.store_type === "product" || !configForm.store_type;

  return (
    <div className="space-y-6">
      {/* 1. Dashboard Overview Stats & Controls Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-3 rounded-2xl shadow-md shadow-indigo-600/20">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Multi-Tenancy Mağaza & Konfigürasyon Merkezi
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {stores.length} Tenant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Tüm mağazaların tasarım temalarını, entegrasyonlarını ve limitlerini birbirinden tamamen izole şekilde yönetin.
              </p>
            </div>
          </div>

          {/* Sektörel Dağılım Mini Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSectorFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sectorFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Tümü ({stores.length})
            </button>
            <button
              type="button"
              onClick={() => setSectorFilter("product")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sectorFilter === "product"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <StoreIcon className="h-3.5 w-3.5" /> shopLP
            </button>
            <button
              type="button"
              onClick={() => setSectorFilter("horeca")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sectorFilter === "horeca"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <Utensils className="h-3.5 w-3.5" /> horecaLP
            </button>
            <button
              type="button"
              onClick={() => setSectorFilter("real_estate")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sectorFilter === "real_estate"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <Home className="h-3.5 w-3.5" /> Emlak
            </button>
            <button
              type="button"
              onClick={() => setSectorFilter("automotive")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sectorFilter === "automotive"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <Car className="h-3.5 w-3.5" /> Otomotiv
            </button>
            <button
              type="button"
              onClick={() => setSectorFilter("bookstore")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sectorFilter === "bookstore"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> BookLP
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Multi-Tenancy Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tenant Navigator & List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <MultiTenancyStoreList
            filteredStores={filteredStores}
            selectedStoreId={selectedStoreId}
            setSelectedStoreId={setSelectedStoreId}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            getSectorBadge={getSectorBadge}
          />
        </div>

        {/* Right Column: Independent Tenant Configurator Engine (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedStore ? (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-12 text-center text-slate-400">
              <StoreIcon className="h-12 w-12 mx-auto mb-3 opacity-40 text-slate-400" />
              <p className="text-sm font-bold">Yapılandırmak için soldaki listeden bir mağaza seçiniz.</p>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 md:p-6 shadow-xs space-y-5">
              {/* Tenant Header & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-3.5">
                  <StoreLogo
                    logoUrl={configForm.branding?.logo_url || selectedStore.logo_url}
                    storeName={configForm.name || selectedStore.name}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                        {configForm.name || selectedStore.name}
                      </h2>
                      {getSectorBadge(
                        configForm.store_type || selectedStore.store_type,
                        configForm.hotel_module_enabled,
                        configForm.bookstore_module_enabled
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>ID: #{selectedStore.id}</span>
                      <span>•</span>
                      <span>@{configForm.slug || selectedStore.slug}</span>
                      {configForm.custom_domain && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            {configForm.custom_domain}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/magaza/${configForm.slug || selectedStore.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> Canlı Vitrin
                  </a>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                  >
                    {savingConfig ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{savingConfig ? "Kaydediliyor..." : "Konfigürasyonu Kaydet"}</span>
                  </button>
                </div>
              </div>

              {/* Status & Feedback Messages */}
              {saveSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
              {saveErrorMsg && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{saveErrorMsg}</span>
                </div>
              )}

              {/* Sub-Tabs Selector */}
              <div className="flex gap-1.5 bg-slate-100/80 dark:bg-slate-800/60 p-1.5 rounded-2xl overflow-x-auto whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("design")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeSubTab === "design"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/50"
                  }`}
                >
                  <Palette className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Tasarım & Tema</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("integrations")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeSubTab === "integrations"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/50"
                  }`}
                >
                  <Server className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Entegrasyonlar Hub</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("licenses")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeSubTab === "licenses"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/50"
                  }`}
                >
                  <Shield className="h-3.5 w-3.5 text-amber-500" />
                  <span>Lisans & Limitler</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("domain")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeSubTab === "domain"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/50"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5 text-sky-500" />
                  <span>Özel Domain & SSL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("templates")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeSubTab === "templates"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/50"
                  }`}
                >
                  <FileCode2 className="h-3.5 w-3.5 text-purple-500" />
                  <span>Şablon Klonlama & Yedek</span>
                </button>
              </div>

              {/* Sub-Tabs Content */}
              {activeSubTab === "design" && (
                <MultiTenancyDesignTab
                  configForm={configForm}
                  setConfigForm={setConfigForm}
                />
              )}

              {activeSubTab === "integrations" && (
                <MultiTenancyIntegrationsTab
                  configForm={configForm}
                  setConfigForm={setConfigForm}
                  isShopLpSelected={isShopLpSelected}
                />
              )}

              {activeSubTab === "licenses" && (
                <MultiTenancyLicensesTab
                  configForm={configForm}
                  setConfigForm={setConfigForm}
                />
              )}

              {activeSubTab === "domain" && (
                <MultiTenancyDomainTab
                  configForm={configForm}
                  setConfigForm={setConfigForm}
                />
              )}

              {activeSubTab === "templates" && (
                <MultiTenancyTemplatesTab
                  handleClonePreset={handleClonePreset}
                  handleExportJson={handleExportJson}
                  jsonConfigInput={jsonConfigInput}
                  setJsonConfigInput={setJsonConfigInput}
                  handleImportJson={handleImportJson}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
