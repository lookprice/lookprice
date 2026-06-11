import React, { useState, useEffect, Suspense } from "react";
import { 
  Save, 
  Upload, 
  Globe, 
  Palette, 
  Settings, 
  User, 
  Lock,
  Mail,
  Smartphone,
  MapPin,
  CreditCard,
  Languages,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Image as ImageIcon,
  Info,
  ArrowRight,
  Building2,
  ShoppingBag,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Download,
  AlertTriangle,
  Truck,
  Plus,
  Trash2,
  Wrench,
  Tag,
  Star,
  X,
  Cpu,
  Cpu as CpuIcon,
  ShieldCheck,
  History,
  Terminal,
  Activity,
  Sparkles,
  HelpCircle,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "@/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { useIntegrationSync } from "../../hooks/useIntegrationSync";
import { DEVELOPED_COUNTRIES } from "../../constants";
import { api } from "../../services/api";
import { PageBuilder } from "../../components/PageBuilder";
import { toast } from "sonner";
import CockpitTab from "./CockpitTab";
import { SettingsLogsTab } from "./settings/SettingsLogsTab";
import { SettingsIntegrationsTab } from "./settings/SettingsIntegrationsTab";
import { SettingsFinancingTab } from "./settings/SettingsFinancingTab";
import { SettingsStoreOpsTab } from "./settings/SettingsStoreOpsTab";
import { SettingsEInvoiceTab } from "./settings/SettingsEInvoiceTab";
import { SettingsPosTab } from "./settings/SettingsPosTab";
import { SettingsEStoresTab } from "./settings/SettingsEStoresTab";
import { SettingsLayoutTab } from "./settings/SettingsLayoutTab";
import { SettingsMenuTab } from "./settings/SettingsMenuTab";
import { SettingsDomainTab } from "./settings/SettingsDomainTab";
import { SettingsWebTab } from "./settings/SettingsWebTab";

interface SettingsTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  onSaveBranding: () => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddUser: () => void;
  onDeleteUser: (id: number) => void;
  users: any[];
  currentUser: any;
  currentStoreId?: number;
  products?: any[];
  onRefresh?: () => void;
  bulkPriceForm: any;
  setBulkPriceForm: (form: any) => void;
  handleBulkPriceSubmit: (e: React.FormEvent) => Promise<void>;
  initialSubTab?: string;
}

const SettingsTab = ({ 
  branding, 
  onBrandingChange, 
  onSaveBranding, 
  onLogoUpload, 
  onFaviconUpload,
  onBannerUpload,
  onAddUser,
  onDeleteUser,
  users,
  currentUser,
  currentStoreId,
  products = [],
  onRefresh,
  bulkPriceForm,
  setBulkPriceForm,
  handleBulkPriceSubmit,
  initialSubTab
}: SettingsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang]?.dashboard || {};

  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = React.useState(false);
  const [isGoogleDriveExporting, setIsGoogleDriveExporting] = React.useState(false);

  React.useEffect(() => {
    api.getGoogleDriveSettings().then(res => {
      if (res) {
        setIsGoogleDriveConnected(res.connected);
      }
    }).catch(console.error);
  }, []);

  const handleConnectGoogleDrive = async () => {
    try {
      const res = await api.getGoogleDriveAuthUrl();
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        res.url,
        "Google Drive Bağlantısı",
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      const checkPopup = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          const verifyRes = await api.getGoogleDriveSettings();
          setIsGoogleDriveConnected(verifyRes.connected);
        }
      }, 1000);
    } catch (error) {
      toast.error("Bağlantı URL'i alınamadı");
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    if (!window.confirm("Google Drive bağlantısını kesmek istediğinize emin misiniz?")) return;
    try {
      await api.disconnectGoogleDrive();
      setIsGoogleDriveConnected(false);
      toast.success("Google Drive bağlantısı kesildi.");
    } catch (error) {
      toast.error("Çıkış başarısız oldu.");
    }
  };

  const handleExportGoogleDrive = async (targetType: string, format: string) => {
    setIsGoogleDriveExporting(true);
    try {
      const res = await api.exportToGoogleDrive({ targetType, format });
      if (res && (res.success || res.message)) {
        toast.success(res.message || 'Yedekleme başarıyla tamamlandı!');
      } else if (res && res.error) {
        toast.error(res.error || 'Yedekleme sırasında hata oluştu.');
      } else {
        toast.error('Yedekleme sırasında hata oluştu.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Yedekleme sırasında hata oluştu.');
    } finally {
      setIsGoogleDriveExporting(false);
    }
  };

  const [verifyingDomain, setVerifyingDomain] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState<{ a: boolean, cname: boolean, ip: string | null, target: string | null } | null>(null);
  const [cfStatus, setCfStatus] = React.useState<any>(null);
  const [cfNameServers, setCfNameServers] = React.useState<string[]>([]);
  const [cfConfigured, setCfConfigured] = React.useState(false);
  const [showManualCf, setShowManualCf] = React.useState(false);
  const [manualCfToken, setManualCfToken] = React.useState("");
  const [manualCfAccount, setManualCfAccount] = React.useState("");
  const [manualCfEmail, setManualCfEmail] = React.useState("");
  const [loadingCf, setLoadingCf] = React.useState(false);
  const [testingEInvoice, setTestingEInvoice] = React.useState(false);

  const handleTestEInvoice = async () => {
    setTestingEInvoice(true);
    try {
      const res = await api.testEInvoiceConnection();
      if (res.error) throw new Error(res.error);
      alert(res.message || (lang === 'tr' ? "Bağlantı başarılı!" : "Connection successful!"));
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? "Bağlantı hatası!" : "Connection error!"));
    } finally {
      setTestingEInvoice(false);
    }
  };

  const [isFinSyncing, setIsFinSyncing] = React.useState(false);
  const [finSyncLogs, setFinSyncLogs] = React.useState<string[]>([]);
  const [activeFinCurrency, setActiveFinCurrency] = React.useState<string>("TRY");

  const [emails, setEmails] = React.useState<string[]>((branding.emails && branding.emails.length > 0) ? branding.emails : ['']);
  const [phones, setPhones] = React.useState<string[]>((branding.phones && branding.phones.length > 0) ? branding.phones : ['']);
  const [activeSubTab, setActiveSubTab] = React.useState<string>(() => {
    return initialSubTab || localStorage.getItem(`settingsSubTab_${currentStoreId || 'admin'}`) || 'web';
  });

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  React.useEffect(() => {
    localStorage.setItem(`settingsSubTab_${currentStoreId || 'admin'}`, activeSubTab);
  }, [activeSubTab, currentStoreId]);

  const [logs, setLogs] = React.useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = React.useState(false);

  const isPortfolio = branding?.store_type === 'real_estate' || branding?.store_type === 'motor_vehicle' || branding?.store_type === 'portfolio' || branding?.page_layout_settings?.sector === 'real_estate' || branding?.page_layout_settings?.sector === 'automotive';

  React.useEffect(() => {
    if (isPortfolio && (activeSubTab === 'pos' || activeSubTab === 'e-stores' || activeSubTab === 'e-invoice')) {
      setActiveSubTab('financing');
    }
  }, [isPortfolio, activeSubTab]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.getAuditLogs(currentStoreId);
      // Filter for integration logs if possible, or just show all
      setLogs(res || []);
    } catch (error) {
      console.error("Logs fetch error:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'logs') {
      fetchLogs();
    }
  }, [activeSubTab]);
  
  const addEmail = () => setEmails([...emails, '']);
  const removeEmail = (index: number) => setEmails(emails.filter((_, i) => i !== index));
  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addPhone = () => setPhones([...phones, '']);
  const removePhone = (index: number) => setPhones(phones.filter((_, i) => i !== index));
  const updatePhone = (index: number, value: string) => {
    const newPhones = [...phones];
    newPhones[index] = value;
    setPhones(newPhones);
  };

  React.useEffect(() => {
    onBrandingChange('emails', emails);
    onBrandingChange('phones', phones);
    // Sync singular fields for compatibility with Showcase footer
    if (emails.length > 0 && emails[0]) {
      onBrandingChange('email', emails[0]);
    }
    if (phones.length > 0 && phones[0]) {
      onBrandingChange('phone', phones[0]);
    }
  }, [emails, phones]);

  React.useEffect(() => {
    localStorage.setItem(`settingsSubTab_${currentStoreId || 'admin'}`, activeSubTab);
  }, [activeSubTab, currentStoreId]);

  React.useEffect(() => {
    if (branding.custom_domain) {
      fetchCfStatus();
    }
  }, [branding.custom_domain]);

  if (!branding) return null;

  const handleVerifyDomain = async () => {
    if (!branding.custom_domain) {
      alert(lang === 'tr' ? 'Lütfen bir domain girin' : 'Please enter a domain');
      return;
    }
    setVerifyingDomain(true);
    setVerificationResult(null);
    try {
      const res = await api.verifyDomain(branding.custom_domain);
      if (res.error) {
        throw new Error(res.error);
      }
      setVerificationResult(res);
      if (res.a && res.cname) {
        // Automatically save if verified
        onSaveBranding();
      }
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? 'Doğrulama sırasında bir hata oluştu' : 'An error occurred during verification'));
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleConnectCloudflare = async () => {
    if (!branding.custom_domain) {
      alert(lang === 'tr' ? 'Lütfen bir domain girin' : 'Please enter a domain');
      return;
    }
    setLoadingCf(true);
    try {
      const res = await api.addCustomDomain(branding.custom_domain, currentStoreId, {
        manualToken: manualCfToken || undefined,
        manualAccount: manualCfAccount || undefined,
        manualEmail: manualCfEmail || undefined
      });
      if (res.error) {
        if (res.error.toLowerCase().includes("configuration missing")) {
          setShowManualCf(true);
        }
        throw new Error(res.error);
      }
      alert(lang === 'tr' ? 'Domain Cloudflare sistemine eklendi. Lütfen doğrulama kayıtlarını bekleyin.' : 'Domain added to Cloudflare. Please wait for verification records.');
      if (manualCfToken && manualCfAccount) {
        setCfConfigured(true);
      }
      setManualCfToken("");
      setManualCfAccount("");
      setManualCfEmail("");
      fetchCfStatus();
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? 'Hata oluştu' : 'Error occurred'));
    } finally {
      setLoadingCf(false);
    }
  };

  const handleManualSave = async () => {
    if (!branding.custom_domain) {
      alert(lang === 'tr' ? 'Lütfen bir domain girin' : 'Please enter a domain');
      return;
    }
    setLoadingCf(true);
    try {
      const res = await api.saveCustomDomainManual(branding.custom_domain, currentStoreId);
      if (res.error) throw new Error(res.error);
      alert(lang === 'tr' ? 'Domain başarıyla kaydedildi. Şimdi DNS kayıtlarınızı (A Kaydı) yönlendirebilirsiniz.' : 'Domain saved successfully. You can now point your DNS records (A Record).');
      fetchCfStatus();
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? 'Hata oluştu' : 'Error occurred'));
    } finally {
      setLoadingCf(false);
    }
  };

  const fetchCfStatus = async () => {
    try {
      const res = await api.getCustomDomainStatus(currentStoreId);
      if (res.domain) {
        setCfStatus({ status: res.status, domain: res.domain });
        if (res.status === 'manual') {
          setCfNameServers([]);
        } else {
          setCfNameServers(res.name_servers || []);
        }
      } else {
        setCfStatus(null);
        setCfNameServers([]);
      }
      // Set configured state from backend flag
      setCfConfigured(!!res.isConfigured);
    } catch (error) {
      console.error("CF Status fetch error:", error);
    }
  };

  React.useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await api.getCustomDomainStatus(currentStoreId);
        setCfConfigured(!!res.isConfigured);
      } catch (e) {
        console.error("Config check error:", e);
      }
    };
    checkConfig();
  }, [currentStoreId]);

  React.useEffect(() => {
    if (activeSubTab === 'web' && branding.custom_domain) {
      fetchCfStatus();
      const interval = setInterval(fetchCfStatus, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [activeSubTab, branding.custom_domain]);

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto pb-24">
        {/* Sub-tab Navigation */}
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30 flex flex-wrap gap-1">
          <button 
            onClick={() => setActiveSubTab('integrations')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'integrations' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Database className="h-4 w-4" />
            <span>Yedekleme</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('web')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'web' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Palette className="h-4 w-4" />
            <span>{t.settingsCategories?.webSettings}</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('store-ops')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'store-ops' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Wrench className="h-4 w-4" />
            <span>{lang === 'tr' ? 'Mağaza Ayarları' : 'Store Settings'}</span>
          </button>
          {!isPortfolio && (
            <button 
              onClick={() => setActiveSubTab('pos')}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'pos' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <CreditCard className="h-4 w-4" />
              <span>{t.settingsCategories?.posSettings}</span>
            </button>
          )}
          {!isPortfolio && (
            <button 
              onClick={() => setActiveSubTab('e-stores')}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'e-stores' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{t.settingsCategories?.eStores}</span>
            </button>
          )}
          {isPortfolio && (
            <button 
              onClick={() => setActiveSubTab('financing')}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'financing' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <CreditCard className="h-4 w-4" />
              <span>{lang === 'tr' ? 'Finansal Asistan' : 'Financial Assistant'}</span>
            </button>
          )}
          <button 
            onClick={() => setActiveSubTab('domain')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'domain' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Globe className="h-4 w-4" />
            <span>{t.settingsCategories?.domainSettings}</span>
          </button>
          {!isPortfolio && (
            <button 
              onClick={() => setActiveSubTab('e-invoice')}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'e-invoice' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Building2 className="h-4 w-4" />
              <span>E-Invoice</span>
            </button>
          )}
          <button 
            onClick={() => setActiveSubTab('logs')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'logs' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <History className="h-4 w-4" />
            <span>{lang === 'tr' ? 'Günlük' : 'Logs'}</span>
          </button>
          {!isPortfolio && (
            <button 
              onClick={() => setActiveSubTab('cockpit')}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'cockpit' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Activity className="h-4 w-4" />
              <span>{lang === 'tr' ? 'Sistem Kokpiti' : 'System Cockpit'}</span>
            </button>
          )}
        </div>

      {activeSubTab === 'integrations' && (
        <SettingsIntegrationsTab lang={lang} />
      )}

      {activeSubTab === 'logs' && (
        <SettingsLogsTab currentStoreId={String(currentStoreId || '')} lang={lang} />
      )}

      {activeSubTab === 'cockpit' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <Suspense fallback={<div>Loading...</div>}>
              <CockpitTab currentStoreId={currentStoreId!} branding={branding} user={currentUser} isPortfolio={isPortfolio} onSwitchTab={(tab) => {}} />
            </Suspense>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'financing' && (
        <SettingsFinancingTab 
          branding={branding} 
          onBrandingChange={onBrandingChange} 
          onSaveBranding={onSaveBranding} 
        />
      )}

      {activeSubTab === 'store-ops' && (
        <SettingsStoreOpsTab 
          branding={branding} 
          onBrandingChange={onBrandingChange} 
          onSaveBranding={onSaveBranding} 
          isPortfolio={isPortfolio} 
          lang={lang} 
          translations={t} 
          bulkPriceForm={bulkPriceForm} 
          setBulkPriceForm={setBulkPriceForm} 
          handleBulkPriceSubmit={handleBulkPriceSubmit} 
        />
      )}

      {activeSubTab === 'e-invoice' && (
        <SettingsEInvoiceTab 
          branding={branding} 
          onBrandingChange={onBrandingChange} 
          lang={lang} 
        />
      )}

      {activeSubTab === 'pos' && (
        <SettingsPosTab 
          branding={branding} 
          onBrandingChange={onBrandingChange} 
          lang={lang} 
        />
      )}

      {activeSubTab === 'layout' && (
        <SettingsLayoutTab 
          branding={branding} 
          onBrandingChange={onBrandingChange} 
        />
      )}

      {activeSubTab === 'menu' && (
        <SettingsMenuTab 
          branding={branding} 
          onBrandingChange={onBrandingChange} 
          lang={lang} 
        />
      )}

      {activeSubTab === 'e-stores' && (
        <SettingsEStoresTab
          branding={branding}
          onBrandingChange={onBrandingChange}
          lang={lang}
          currentStoreId={currentStoreId}
          products={products}
          onRefresh={onRefresh}
        />
      )}

      {activeSubTab === 'domain' && (
        <SettingsDomainTab
          branding={branding}
          onBrandingChange={onBrandingChange}
          lang={lang}
          currentUser={currentUser}
          currentStoreId={currentStoreId}
          onSaveBranding={onSaveBranding}
          cfStatus={cfStatus}
          setCfStatus={setCfStatus}
          cfNameServers={cfNameServers}
          setCfNameServers={setCfNameServers}
          cfConfigured={cfConfigured}
          setCfConfigured={setCfConfigured}
          showManualCf={showManualCf}
          setShowManualCf={setShowManualCf}
          manualCfToken={manualCfToken}
          setManualCfToken={setManualCfToken}
          manualCfAccount={manualCfAccount}
          setManualCfAccount={setManualCfAccount}
          manualCfEmail={manualCfEmail}
          setManualCfEmail={setManualCfEmail}
          loadingCf={loadingCf}
          setLoadingCf={setLoadingCf}
          handleConnectCloudflare={handleConnectCloudflare}
          handleManualSave={handleManualSave}
          fetchCfStatus={fetchCfStatus}
        />
      )}

      {activeSubTab === 'web' && (
        <SettingsWebTab
          branding={branding}
          onBrandingChange={onBrandingChange}
          lang={lang}
          isPortfolio={isPortfolio}
          currentUser={currentUser}
          emails={emails}
          phones={phones}
          updateEmail={updateEmail}
          removeEmail={removeEmail}
          addEmail={addEmail}
          updatePhone={updatePhone}
          removePhone={removePhone}
          addPhone={addPhone}
          onLogoUpload={onLogoUpload}
          onFaviconUpload={onFaviconUpload}
          onBannerUpload={onBannerUpload}
          users={users}
          onAddUser={onAddUser}
          onDeleteUser={onDeleteUser}
        />
      )}


      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/40 backdrop-blur-2xl border-t border-slate-200/50 flex justify-center lg:justify-end lg:pr-12 pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={onSaveBranding}
            className="flex items-center space-x-4 px-10 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-sm hover:bg-indigo-600 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:shadow-indigo-500/40 active:scale-95 group border border-white/10"
          >
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Save className="h-4 w-4 text-white" />
            </div>
            <span className="uppercase tracking-[0.2em]">{translations[lang]?.dashboard?.saveSettings || 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
