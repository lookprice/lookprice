import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Truck,
  Building2,
  Cpu,
  Banknote,
  Scan,
  ExternalLink,
  Copy,
  Check,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  FileText,
  Printer,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Terminal,
  Wrench,
  Activity
} from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { HotelUpgradeModal } from "../../../components/modals/HotelUpgradeModal";
import { api } from "../../../services/api";
import {
  UNIVERSAL_POS_DEVICES,
  USB_VCP_DRIVERS,
  DEFAULT_FISCAL_DEPARTMENTS,
  getPosDeviceById,
  resolvePrinterPaperWidth,
  normalizeDepartments,
  auditProductVatMappings,
  FiscalDepartmentMapping
} from "../../../data/posDevices";

interface SettingsPosTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  currentStoreId?: number;
  products?: any[];
}

export const SettingsPosTab = ({
  branding,
  onBrandingChange,
  lang,
  currentStoreId,
  products = []
}: SettingsPosTabProps) => {
  const [isHotelUpgradeModalOpen, setIsHotelUpgradeModalOpen] = useState(false);
  const [copiedScanUrl, setCopiedScanUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'payment' | 'hotel' | 'bridge' | 'kiosk'>('payment');

  const [bridgeStatus, setBridgeStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [runningCmd, setRunningCmd] = useState<string | null>(null);
  const [lastCmdResponse, setLastCmdResponse] = useState<any>(null);
  const [regeneratingToken, setRegeneratingToken] = useState(false);
  const [serverKdvAudit, setServerKdvAudit] = useState<any>(null);

  const txt = (tr: string, en: string, el: string) => (lang === "tr" ? tr : lang === "el" ? el : en);
  const isCafeRestaurant =
    branding?.store_type === 'cafe_restaurant' ||
    branding?.store_type === 'horeca' ||
    branding?.store_type === 'horecalp' ||
    branding?.page_layout_settings?.sector === 'cafe_restaurant' ||
    branding?.page_layout_settings?.sector === 'horeca';
  const isPortfolio =
    branding?.store_type === 'portfolio' ||
    branding?.store_type === 'automotive' ||
    branding?.page_layout_settings?.sector === 'portfolio' ||
    branding?.page_layout_settings?.sector === 'automotive';

  const slug = branding.slug || "";
  const scanUrl = `${window.location.origin}/scan/${slug}`;

  const selectedDevice = useMemo(
    () => getPosDeviceById(branding?.fiscal_brand || 'hugin_t300_spectra'),
    [branding?.fiscal_brand]
  );

  const departments = useMemo(
    () => normalizeDepartments(branding?.fiscal_departments),
    [branding?.fiscal_departments]
  );

  const localVatAudit = useMemo(() => {
    const productRates = (Array.isArray(products) ? products : []).map((p: any) =>
      p?.tax_rate !== undefined && p?.tax_rate !== null ? p.tax_rate : (branding?.default_tax_rate ?? 20)
    );
    return auditProductVatMappings(productRates, departments);
  }, [products, departments, branding?.default_tax_rate]);

  const effectiveVatAudit = serverKdvAudit || localVatAudit;
  const bridgeSettings = branding?.pos_bridge_settings || {};
  const pairingToken = bridgeStatus?.pairingToken || branding?.pos_bridge_token || '';
  const resolvedPaperWidth = resolvePrinterPaperWidth(
    branding?.fiscal_brand,
    bridgeSettings,
    Boolean(branding?.fiscal_active)
  );
  const hasSeparateThermal = Boolean(bridgeSettings?.has_separate_thermal_printer);
  const paperWidthSetting = hasSeparateThermal
    ? String(bridgeSettings?.thermal_paper_width_mm || (bridgeSettings?.paper_width_mm && bridgeSettings.paper_width_mm !== 'auto' ? bridgeSettings.paper_width_mm : '80'))
    : (bridgeSettings?.paper_width_mm ? String(bridgeSettings.paper_width_mm) : 'auto');
  const horecaCloseMode: 'optional_ask' | 'always_okc' | 'thermal_only' =
    bridgeSettings?.horeca_close_fiscal_mode || 'optional_ask';

  const fetchBridgeStatus = async () => {
    if (!currentStoreId) return;
    try {
      setLoadingStatus(true);
      const data = await api.getPosBridgeStatus(currentStoreId);
      setBridgeStatus(data);
      if (data?.vatAudit) setServerKdvAudit(data.vatAudit);
    } catch (err) {
      console.error("Failed to fetch POS bridge status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'bridge' && currentStoreId) {
      fetchBridgeStatus();
    }
  }, [activeSubTab, currentStoreId]);

  const handleSelectDevice = (deviceId: string) => {
    const spec = getPosDeviceById(deviceId);
    onBrandingChange('fiscal_brand', spec.id);
    onBrandingChange('fiscal_port', spec.defaultPort);
    if (!branding?.fiscal_departments || branding.fiscal_departments.length === 0) {
      onBrandingChange('fiscal_departments', DEFAULT_FISCAL_DEPARTMENTS);
    }
  };

  const updateBridgeSetting = (key: string, val: any) => {
    const next = {
      ...(branding?.pos_bridge_settings || {}),
      [key]: val
    };
    onBrandingChange('pos_bridge_settings', next);
  };

  const updateBridgeSettingsBatch = (patch: Record<string, any>) => {
    const next = {
      ...(branding?.pos_bridge_settings || {}),
      ...patch
    };
    onBrandingChange('pos_bridge_settings', next);
  };

  const cardOkcMode: 'integrated_eft_pos' | 'fiscal_only_external_card' | 'no_fiscal_on_card' =
    bridgeSettings?.card_okc_mode ||
    (bridgeSettings?.fiscal_on_card === false ? 'no_fiscal_on_card' : 'integrated_eft_pos');

  const handleSelectCardOkcMode = (mode: 'integrated_eft_pos' | 'fiscal_only_external_card' | 'no_fiscal_on_card') => {
    const next = {
      ...(branding?.pos_bridge_settings || {}),
      card_okc_mode: mode,
      fiscal_on_card: mode !== 'no_fiscal_on_card'
    };
    onBrandingChange('pos_bridge_settings', next);
  };

  const handleDepartmentChange = (deptNum: number, field: 'label' | 'vatRate', value: string | number) => {
    const nextList: FiscalDepartmentMapping[] = departments.map((d) => {
      if (d.dept !== deptNum) return d;
      if (field === 'vatRate') {
        const parsed = parseInt(String(value), 10);
        return { ...d, vatRate: Number.isNaN(parsed) ? 0 : Math.min(99, Math.max(0, parsed)) };
      }
      return { ...d, label: String(value) };
    });
    onBrandingChange('fiscal_departments', nextList);
  };

  const handleRunKdvAudit = async () => {
    if (!currentStoreId) return;
    try {
      const res = await api.auditPosKdvDepartments(departments, currentStoreId);
      if (res?.audit) {
        setServerKdvAudit(res.audit);
        if (res.audit.isSynced) {
          toast.success(txt("Tüm ürün KDV oranları ÖKC departmanları ile %100 uyumlu!", "All store VAT rates match OKC departments!", "Όλοι οι συντελεστές ΦΠΑ ταιριάζουν!"));
        } else {
          toast.warning(txt(`Eşleşmeyen KDV oranları bulundu: %${res.audit.unmappedRates.join(', %')}`, `Unmapped VAT rates: ${res.audit.unmappedRates.join(', ')}`, "Μη αντιστοιχισμένοι συντελεστές ΦΠΑ."));
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "KDV denetimi yapılamadı.");
    }
  };

  const handleRunBridgeCommand = async (
    command: 'PING_STATUS' | 'LAST_TX' | 'X_REPORT' | 'Z_REPORT',
    simulateScenario?: string
  ) => {
    if (!currentStoreId) return;
    try {
      setRunningCmd(command);
      const res = await api.sendPosBridgeCommand({
        command,
        deviceIp: branding?.fiscal_ip || '127.0.0.1',
        devicePort: Number(branding?.fiscal_port || selectedDevice.defaultPort || 4444),
        simulate: Boolean(bridgeSettings?.allow_simulation || simulateScenario),
        simulateScenario: simulateScenario || null,
        timeoutMs: 12000
      }, currentStoreId);
      setLastCmdResponse(res);
      toast.success(
        `${command} ${res?.simulated ? '(Simülasyon)' : ''} tamamlandı: ${res?.fiscal?.receiptNo || 'OK'}`
      );
      fetchBridgeStatus();
    } catch (err: any) {
      const errMsg = err?.message || "ÖKC komutu başarısız.";
      setLastCmdResponse({ success: false, command, message: errMsg });
      toast.error(errMsg);
    } finally {
      setRunningCmd(null);
    }
  };

  const handleRegenerateToken = async () => {
    if (!currentStoreId) return;
    try {
      setRegeneratingToken(true);
      const res = await api.regeneratePosBridgeToken(currentStoreId);
      if (res?.pairingToken) {
        onBrandingChange('pos_bridge_token', res.pairingToken);
        toast.success(txt("Yeni POS Bridge eşleşme anahtarı üretildi.", "New bridge pairing token generated.", "Δημιουργήθηκε νέο κλειδί σύζευξης."));
        fetchBridgeStatus();
      }
    } catch (err: any) {
      toast.error(err?.message || "Token yenilenemedi.");
    } finally {
      setRegeneratingToken(false);
    }
  };

  const handleDownloadAgentZip = () => {
    const url = api.getPosBridgeDownloadUrl(currentStoreId);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LP-Hardware-Bridge-${slug || currentStoreId || 'store'}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.info(txt("Mağazanıza özel LP-Hardware-Bridge paketi indiriliyor...", "Downloading pre-configured LP-Hardware-Bridge package...", "Λήψη πακέτου LP-Hardware-Bridge..."));
  };

  const subNavItems = [
    { id: 'payment', label: txt('Ödeme', 'Payment', 'Πληρωμές'), icon: CreditCard, show: true },
    { id: 'hotel', label: txt('Otel/Oda', 'Hotel/Room', 'Ξενοδοχείο'), icon: Building2, show: isCafeRestaurant },
    { id: 'bridge', label: txt('Yazarkasa ÖKC & Köprü', 'Fiscal OKC & Bridge', 'Ταμειακή & Γέφυρα POS'), icon: Cpu, show: !isPortfolio },
    { id: 'kiosk', label: txt('Fiyat Gör', 'Price Check', 'Έλεγχος Τιμών'), icon: Scan, show: !isPortfolio && !isCafeRestaurant },
  ].filter(i => i.show);

  const agentOnline = Boolean(bridgeStatus?.agent?.online);
  const bridgeActive = Boolean(branding?.pos_bridge_enabled || branding?.fiscal_active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-5"
    >
      {/* Top Header & Micro Navigation Bar */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/15 rounded-xl text-indigo-300 border border-indigo-500/30">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  {isCafeRestaurant ? 'HorecaLP POS' : 'ShopLP POS & Tahsilat'}
                </span>
                {branding?.fiscal_active && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {selectedDevice.brand} {selectedDevice.protocol}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-white leading-tight tracking-tight mt-0.5">
                {txt('Adisyon, Tahsilat & Üniversal ÖKC Yapılandırması', 'POS, Payment & Universal Fiscal OKC Configuration', 'Ρυθμίσεις POS & Ταμειακής')}
              </h2>
            </div>
          </div>
        </div>

        {/* Micro Sub Navigation */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3.5 border-t border-white/10">
          {subNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSubTab(item.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-white/10 text-slate-200 hover:bg-white/15'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <HotelUpgradeModal
        isOpen={isHotelUpgradeModalOpen}
        onClose={() => setIsHotelUpgradeModalOpen(false)}
        lang={lang}
        storeName={branding.store_name || branding.name}
      />

      {/* SUBTAB 1: PAYMENT GATEWAYS */}
      {activeSubTab === 'payment' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-slate-900">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {txt('Ödeme Yöntemleri ve Sanal POS Entegrasyonları', 'Payment Gateways & Options', 'Τρόποι Πληρωμής')}
            </h3>

            {/* COD */}
            {(() => {
              const isCodActive = branding.payment_settings?.cod_enabled !== false && branding.payment_settings?.hotel_pay_at_hotel_enabled !== false;
              return (
                <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isCodActive ? 'bg-amber-50/40 border-amber-200/80' : 'bg-slate-50/50 border-slate-200 opacity-70'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${isCodActive ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {(isCafeRestaurant || branding.hotel_module_enabled) ? <Banknote className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          {(isCafeRestaurant || branding.hotel_module_enabled)
                            ? txt('Otelde / Kapıda Ödeme', 'Pay at Front Desk / Delivery', 'Πληρωμή στη ρεσεψιόν')
                            : txt('Kapıda Ödeme', 'Cash on Delivery', 'Πληρωμή κατά την παράδοση')}
                        </h4>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isCodActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {isCodActive ? txt('Aktif', 'Active', 'Ενεργό') : txt('Pasif', 'Inactive', 'Ανενεργό')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {txt('Teslimat esnasında veya resepsiyonda nakit/kart ile tahsilat.', 'Collect cash or card on delivery or check-in.', 'Είπραξη με αντικαταβολή ή στη ρεσεψιόν.')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !isCodActive;
                      onBrandingChange('payment_settings', {
                        ...(branding.payment_settings || {}),
                        cod_enabled: nextVal,
                        hotel_pay_at_hotel_enabled: nextVal
                      });
                    }}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isCodActive ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isCodActive ? 'translate-x-[1.3rem]' : 'translate-x-[0.2rem]'}`} />
                  </button>
                </div>
              );
            })()}

            {/* Bank Transfer */}
            {(() => {
              const isBankActive = branding.payment_settings?.bank_transfer_enabled !== false && branding.payment_settings?.hotel_bank_transfer_enabled !== false;
              return (
                <div className={`p-4 rounded-xl border transition-all ${isBankActive ? 'bg-indigo-50/40 border-indigo-200/80' : 'bg-slate-50/50 border-slate-200 opacity-70'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${isBankActive ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-400 border-slate-200'}`}>
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            {txt('Banka Havalesi / EFT (IBAN)', 'Bank Transfer / EFT', 'Τραπεζική Κατάθεση')}
                          </h4>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isBankActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {isBankActive ? txt('Aktif', 'Active', 'Ενεργό') : txt('Pasif', 'Inactive', 'Ανενεργό')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {txt('Müşterilere hesap numaralarınızı sunarak havale ile tahsilat yapın.', 'Display IBAN info to receive bank transfers.', 'Πληρωμή μέσω IBAN.')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !isBankActive;
                        onBrandingChange('payment_settings', {
                          ...(branding.payment_settings || {}),
                          bank_transfer_enabled: nextVal,
                          hotel_bank_transfer_enabled: nextVal
                        });
                      }}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isBankActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isBankActive ? 'translate-x-[1.3rem]' : 'translate-x-[0.2rem]'}`} />
                    </button>
                  </div>
                  {isBankActive && (
                    <div className="mt-3 space-y-1.5 border-t border-indigo-100 pt-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {txt('BANKA HESAP VE IBAN BİLGİLERİ', 'BANK ACCOUNT & IBAN DETAILS', 'ΣΤΟΙΧΕΙΑ ΤΡΑΠΕΖΗΣ')}
                      </label>
                      <textarea
                        className="w-full h-20 p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                        placeholder={txt('Ziraat Bankası - TR12 0001 0000 0000 0000 0000 00 - Alıcı: İşletme Adı', 'Bank Name - IBAN - Account Name...', 'Όνομα Τράπεζας - IBAN...')}
                        value={branding.payment_settings?.bank_details || branding.payment_settings?.hotel_bank_details || ''}
                        onChange={(e) => onBrandingChange('payment_settings', {
                          ...(branding.payment_settings || {}),
                          bank_details: e.target.value,
                          hotel_bank_details: e.target.value
                        })}
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Direct Credit Card */}
            {(() => {
              const isCardActive = branding.payment_settings?.credit_card_enabled !== false && branding.payment_settings?.hotel_credit_card_enabled !== false;
              return (
                <div className={`p-4 rounded-xl border transition-all ${isCardActive ? 'bg-blue-50/40 border-blue-200/80' : 'bg-slate-50/50 border-slate-200 opacity-70'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${isCardActive ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-400 border-slate-200'}`}>
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            {txt('Kredi Kartı (Online / Sanal POS)', 'Credit Card (Online Virtual POS)', 'Πιστωτική Κάρτα')}
                          </h4>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isCardActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {isCardActive ? txt('Aktif', 'Active', 'Ενεργό') : txt('Pasif', 'Inactive', 'Ανενεργό')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {txt('Web sitenizde güvenli kredi kartı ödemesini etkinleştirin.', 'Enable secure online credit card collection.', 'Ενεργοποίηση πληρωμών με κάρτα.')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !isCardActive;
                        onBrandingChange('payment_settings', {
                          ...(branding.payment_settings || {}),
                          credit_card_enabled: nextVal,
                          hotel_credit_card_enabled: nextVal
                        });
                      }}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isCardActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isCardActive ? 'translate-x-[1.3rem]' : 'translate-x-[0.2rem]'}`} />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Iyzico POS */}
            <div className={`p-4 rounded-xl border transition-all ${branding.payment_settings?.iyzico_enabled ? 'bg-blue-50/40 border-blue-200/80' : 'bg-slate-50/50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-2xs border border-slate-200 text-blue-600">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Iyzico Sanal POS</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{txt('Türkiye Sanal POS Gateway', 'TR Virtual POS Gateway', 'TR Virtual POS')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_enabled: !branding.payment_settings?.iyzico_enabled })}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${branding.payment_settings?.iyzico_enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${branding.payment_settings?.iyzico_enabled ? 'translate-x-[1.3rem]' : 'translate-x-[0.2rem]'}`} />
                </button>
              </div>
              {branding.payment_settings?.iyzico_enabled && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-blue-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">API Key</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 outline-none"
                      value={branding.payment_settings?.iyzico_api_key || ''}
                      onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_api_key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Secret Key</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 outline-none"
                      value={branding.payment_settings?.iyzico_secret_key || ''}
                      onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_secret_key: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PayPal */}
            <div className={`p-4 rounded-xl border transition-all ${branding.payment_settings?.paypal_enabled ? 'bg-indigo-50/40 border-indigo-200/80' : 'bg-slate-50/50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">PayPal Express</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{txt('Uluslararası Ödeme', 'Global Checkout', 'Διεθνείς Πληρωμές')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), paypal_enabled: !branding.payment_settings?.paypal_enabled })}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${branding.payment_settings?.paypal_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${branding.payment_settings?.paypal_enabled ? 'translate-x-[1.3rem]' : 'translate-x-[0.2rem]'}`} />
                </button>
              </div>
              {branding.payment_settings?.paypal_enabled && (
                <div className="mt-3 pt-3 border-t border-indigo-100">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">PayPal Client ID</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 outline-none"
                    value={branding.payment_settings?.paypal_client_id || ''}
                    onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), paypal_client_id: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBTAB 2: HOTEL & ROOM (HORECA) */}
      {activeSubTab === 'hotel' && isCafeRestaurant && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-indigo-800/80 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-800/60 rounded-2xl text-amber-400 border border-indigo-700">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-white leading-tight">Otel & Oda Adisyon Entegrasyonu</h3>
                    {!branding.hotel_license_enabled && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {txt('🔒 Üst Paket', '🔒 Upgrade Required', '🔒 Απαιτείται αναβάθμιση')}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${branding.hotel_module_enabled ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                      {branding.hotel_module_enabled ? txt('Aktif (Hibrit)', 'Active (Hybrid)', 'Ενεργό') : txt('Pasif', 'Inactive', 'Ανενεργό')}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 font-medium mt-1">
                    {txt('Otel misafirleri için adisyonu odaya kaydetme ve resepsiyon senkronizasyonu.', 'Transfer restaurant tab to hotel rooms automatically.', 'Μεταφορά λογαριασμού στο δωμάτιο.')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {!branding.hotel_license_enabled && (
                  <button
                    type="button"
                    onClick={() => setIsHotelUpgradeModalOpen(true)}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    {txt('Yükselt', 'Upgrade', 'Αναβάθμιση')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!branding.hotel_module_enabled && !branding.hotel_license_enabled) {
                      setIsHotelUpgradeModalOpen(true);
                      return;
                    }
                    onBrandingChange('hotel_module_enabled', !branding.hotel_module_enabled);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${branding.hotel_module_enabled ? 'bg-amber-400' : 'bg-slate-800'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${branding.hotel_module_enabled ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBTAB 3: UNIVERSAL ÖKC & LP-HARDWARE-BRIDGE STUDIO */}
      {activeSubTab === 'bridge' && !isPortfolio && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* 1. Activation & Live Agent Telemetry Strip */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-500/30">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-white">
                      {txt('Üniversal YN ÖKC & LP-Hardware-Bridge', 'Universal Fiscal OKC & Edge Hardware Bridge', 'Καθολική Γέφυρα POS')}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${
                      agentOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {agentOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                      {agentOnline
                        ? `Ajan Bağlı (${bridgeStatus?.agent?.transport === 'websocket' ? 'WebSocket' : 'Long-Poll'})`
                        : 'Yerel Ajan Çevrimdışı'}
                    </span>
                    {bridgeSettings?.allow_simulation && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        Test / Simülasyon Açık
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      cardOkcMode === 'fiscal_only_external_card'
                        ? 'bg-sky-500/20 text-sky-200 border-sky-400/40'
                        : cardOkcMode === 'no_fiscal_on_card'
                        ? 'bg-slate-700/60 text-slate-200 border-slate-500/40'
                        : 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40'
                    }`}>
                      {cardOkcMode === 'fiscal_only_external_card'
                        ? 'Sadece Yazarkasa (Harici POS)'
                        : cardOkcMode === 'no_fiscal_on_card'
                        ? 'Kartta ÖKC Kapalı'
                        : "2'si 1 Arada EFT-POS"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {txt(
                      'Hugin T300 Spectra (TCP 4444 GMP3) ve tüm yaygın YN ÖKC cihazlarıyla çift yönlü bulut/yerel kasa entegrasyonu.',
                      'Bi-directional Cloud WebSocket + Local TCP/GMP3 bridge for Hugin T300 Spectra and major fiscal ECR devices.',
                      'Αμφίδρομη σύνδεση με ταμειακές μηχανές.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl cursor-pointer">
                  <span className="text-[11px] font-black text-white">Mali ÖKC Aktif</span>
                  <input
                    type="checkbox"
                    checked={Boolean(branding?.fiscal_active)}
                    onChange={(e) => {
                      const val = e.target.checked;
                      onBrandingChange('fiscal_active', val);
                      if (val) onBrandingChange('pos_bridge_enabled', true);
                    }}
                    className="w-4 h-4 accent-emerald-400 cursor-pointer"
                  />
                </label>

                <label className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl cursor-pointer">
                  <span className="text-[11px] font-black text-white">POS Köprüsü</span>
                  <input
                    type="checkbox"
                    checked={Boolean(branding?.pos_bridge_enabled)}
                    onChange={(e) => onBrandingChange('pos_bridge_enabled', e.target.checked)}
                    className="w-4 h-4 accent-indigo-400 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Live Heartbeat Telemetry & Remote Hardware Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-xs">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">PC Modu / Bağlantı</span>
                <span className={`font-black ${bridgeStatus?.agent?.pcMode ? 'text-emerald-300' : 'text-slate-300'}`}>
                  {agentOnline ? (bridgeStatus?.agent?.pcMode ? 'PC Modu Hazır' : 'PC Modu Kapalı') : 'Bekleniyor'}
                </span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Kağıt Rulosu</span>
                <span className={`font-black ${bridgeStatus?.agent?.paperOk !== false ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {bridgeStatus?.agent?.paperOk === false ? 'Kağıt Bitti / Kapak Açık' : 'Kağıt Dolu / OK'}
                </span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Seçili Protokol & Rulo</span>
                <span className="font-mono font-bold text-indigo-300">{selectedDevice.protocol} :{branding?.fiscal_port || selectedDevice.defaultPort} • {resolvedPaperWidth}mm</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">KDV Departman Uyumu</span>
                <span className={`font-black ${effectiveVatAudit.isSynced ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {effectiveVatAudit.isSynced ? '8 Departman Uyumlu' : `Eksik: %${effectiveVatAudit.unmappedRates.join(', %')}`}
                </span>
              </div>
            </div>

            {/* Hardware Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={!!runningCmd}
                onClick={() => handleRunBridgeCommand('PING_STATUS')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{runningCmd === 'PING_STATUS' ? 'Sorgulanıyor...' : 'PING / STATUS (Kasa & Kağıt Kontrol)'}</span>
              </button>
              <button
                type="button"
                disabled={!!runningCmd}
                onClick={() => handleRunBridgeCommand('LAST_TX')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Son İşlem Sorgula (LAST_TX)</span>
              </button>
              <button
                type="button"
                disabled={!!runningCmd}
                onClick={() => handleRunBridgeCommand('X_REPORT')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>X Raporu</span>
              </button>
              <button
                type="button"
                disabled={!!runningCmd}
                onClick={() => handleRunBridgeCommand('Z_REPORT')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Gün Sonu Z Raporu Gönder</span>
              </button>
              <button
                type="button"
                onClick={fetchBridgeStatus}
                disabled={loadingStatus}
                className="ml-auto px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
                <span>Yenile</span>
              </button>
            </div>

            {lastCmdResponse && (
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                lastCmdResponse.success ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-100' : 'bg-rose-950/60 border-rose-700/60 text-rose-100'
              }`}>
                <div className="flex items-center justify-between font-black">
                  <span>Son Komut: {lastCmdResponse.command}</span>
                  <span>{lastCmdResponse.success ? `OK • ${lastCmdResponse.fiscal?.receiptNo || ''}` : `HATA • ${lastCmdResponse.error_code || ''}`}</span>
                </div>
                {lastCmdResponse.message && <p className="text-[11px]">{lastCmdResponse.message}</p>}
                {lastCmdResponse.gmp3Hex && (
                  <p className="font-mono text-[10px] text-slate-300 break-all bg-black/30 p-1.5 rounded">
                    GMP3 HEX: {lastCmdResponse.gmp3Hex}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. Universal OKC Device Selector + Official Driver / SDK Portal */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  1. Desteklenen YN ÖKC Cihaz Kataloğu & Sürücüler
                </h4>
                <p className="text-[11px] text-slate-500">
                  Yeni şube/mağaza açılışlarında cihaz markasını seçin; port, protokol, kurulum adımları ve resmi sürücü linkleri otomatik hazırlanır.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {UNIVERSAL_POS_DEVICES.map((dev) => {
                const isSelected = selectedDevice.id === dev.id;
                return (
                  <button
                    key={dev.id}
                    type="button"
                    onClick={() => handleSelectDevice(dev.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black uppercase text-indigo-700">{dev.brand}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                          {dev.defaultPaperWidthMm}mm
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          :{dev.defaultPort}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-black text-slate-900 mt-1 leading-snug">{dev.model}</div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-1">{dev.protocol}</div>
                  </button>
                );
              })}
            </div>

            {/* Selected Device Setup Guide + Driver Links */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{selectedDevice.model} — Kurulum & PC Modu Adımları</span>
                  </h5>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                    {selectedDevice.connectionTypes[0]}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">{selectedDevice.notes}</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-800 font-semibold pt-1">
                  {selectedDevice.setupSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="lg:col-span-5 bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 space-y-2.5">
                <h5 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                  Resmi Sürücü (Driver), USB-VCP & SDK Linkleri
                </h5>
                <a
                  href={selectedDevice.driverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-800 transition-all"
                >
                  <span className="truncate">{selectedDevice.driverLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
                </a>
                <a
                  href={selectedDevice.sdkDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 transition-all"
                >
                  <span className="truncate">{selectedDevice.brand} Geliştirici / GMP3 Dokümantasyonu</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
                </a>
                <div className="pt-1 border-t border-indigo-200/60 space-y-1.5">
                  <span className="text-[10px] font-black text-slate-600 uppercase block">Ortak Kasa Kablo & Runtime Araçları:</span>
                  {USB_VCP_DRIVERS.map((drv, idx) => (
                    <a
                      key={idx}
                      href={drv.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-[11px] font-bold text-slate-800 hover:text-indigo-700"
                      title={drv.description}
                    >
                      <span className="truncate">• {drv.name}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Device Network Params + LP-Hardware-Bridge Package Download + Behavior Options */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  2. Ağ Parametreleri, Eşleştirme Anahtarı & Yerel Köprü (LP-Hardware-Bridge)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Buluttan LAN ağındaki {branding?.fiscal_ip || '192.168.1.55'}:{branding?.fiscal_port || selectedDevice.defaultPort} cihazına erişim için mağazanıza özel paketi indirip kasada başlatın.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadAgentZip}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>LP-Hardware-Bridge İndir (.zip)</span>
              </button>
            </div>

            {/* Compact Bounded-Width Inputs (AGENTS.md §13) */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-44 space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">ÖKC Cihaz LAN IP</label>
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-indigo-500"
                  placeholder="192.168.1.55"
                  value={branding?.fiscal_ip || ''}
                  onChange={(e) => onBrandingChange('fiscal_ip', e.target.value)}
                />
              </div>

              <div className="w-24 space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">ÖKC Port</label>
                <input
                  type="number"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-indigo-500"
                  placeholder="4444"
                  value={branding?.fiscal_port || selectedDevice.defaultPort || 4444}
                  onChange={(e) => onBrandingChange('fiscal_port', parseInt(e.target.value, 10) || 4444)}
                />
              </div>

              <div className="w-44 space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">Terminal / Mali Seri No</label>
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-indigo-500"
                  placeholder="HG-00123456"
                  value={branding?.fiscal_terminal_id || ''}
                  onChange={(e) => onBrandingChange('fiscal_terminal_id', e.target.value)}
                />
              </div>

              <div className="w-40 space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">Yerel Köprü IP</label>
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-indigo-500"
                  placeholder="127.0.0.1"
                  value={branding?.pos_bridge_ip || '127.0.0.1'}
                  onChange={(e) => onBrandingChange('pos_bridge_ip', e.target.value)}
                />
              </div>

              <div className="w-24 space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">Köprü Port</label>
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-indigo-500"
                  placeholder="1616"
                  value={branding?.pos_bridge_port || '1616'}
                  onChange={(e) => onBrandingChange('pos_bridge_port', e.target.value)}
                />
              </div>

              <div className="w-56 space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">
                  Termal Fiş Kağıt Genişliği ({resolvedPaperWidth}mm)
                </label>
                <select
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
                  value={paperWidthSetting}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed = raw === 'auto' ? 'auto' : Number(raw);
                    if (hasSeparateThermal) {
                      updateBridgeSettingsBatch({
                        thermal_paper_width_mm: parsed === 'auto' ? 80 : parsed,
                        paper_width_mm: parsed
                      });
                    } else {
                      updateBridgeSetting('paper_width_mm', parsed);
                    }
                  }}
                >
                  {!hasSeparateThermal && (
                    <option value="auto">
                      Otomatik ({Boolean(branding?.fiscal_active || bridgeSettings?.enabled) ? `Cihaz: ${selectedDevice.defaultPaperWidthMm}mm` : 'Standart: 80mm'})
                    </option>
                  )}
                  <option value="56">56 mm (Dar YN ÖKC Rulosu)</option>
                  <option value="58">58 mm (Standart Mobil/ÖKC Rulosu)</option>
                  <option value="80">80 mm (Geniş Masaüstü Termal)</option>
                </select>
              </div>
            </div>

            {/* Pairing Token Strip */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black text-slate-500 uppercase block">
                  Bulut Eşleştirme Anahtarı (Bridge Pairing Token — WebSocket & Long-Poll)
                </span>
                <span className="text-xs font-mono font-bold text-indigo-700 truncate block">
                  {pairingToken || 'Kaydettikten sonra otomatik oluşturulur'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={!pairingToken}
                  onClick={() => {
                    navigator.clipboard.writeText(pairingToken);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
                <button
                  type="button"
                  disabled={regeneratingToken}
                  onClick={handleRegenerateToken}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regeneratingToken ? 'animate-spin' : ''}`} />
                  <span>Yenile</span>
                </button>
              </div>
            </div>

            {/* Card Payment OKC Mode Selector (2-in-1 EFT-POS vs Fiscal-Only External Card vs Cash-Only OKC) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    Kredi Kartı & 2&apos;si 1 Arada ÖKC Çalışma Modu
                  </span>
                  <span className="text-[10px] text-slate-600">
                    Kredi kartını bağlı ÖKC üzerinden mi tahsil edeceksiniz, yoksa başka banka POS&apos;undan çekip bu cihazı sadece yazarkasa olarak mı kullanacaksınız?
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                  cardOkcMode === 'fiscal_only_external_card'
                    ? 'bg-sky-100 text-sky-900 border-sky-300'
                    : cardOkcMode === 'no_fiscal_on_card'
                    ? 'bg-slate-200 text-slate-900 border-slate-300'
                    : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                }`}>
                  {cardOkcMode === 'fiscal_only_external_card'
                    ? 'Seçili: Sadece Yazarkasa (Kart Beklemez)'
                    : cardOkcMode === 'no_fiscal_on_card'
                    ? 'Seçili: Kartta ÖKC Gönderme'
                    : "Seçili: 2'si 1 Arada EFT-POS"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectCardOkcMode('integrated_eft_pos')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    cardOkcMode === 'integrated_eft_pos'
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-slate-900">2&apos;si 1 Arada (EFT-POS + Mali Fiş)</span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      cardOkcMode === 'integrated_eft_pos' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    }`}>
                      {cardOkcMode === 'integrated_eft_pos' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                    ÖKC üzerindeki NFC/çip okuyucuyu uyandırır, müşteri PIN/kart onayından sonra slip + mali fiş basar.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCardOkcMode('fiscal_only_external_card')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    cardOkcMode === 'fiscal_only_external_card'
                      ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20 text-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-slate-900">Sadece Yazarkasa (Harici Banka POS)</span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      cardOkcMode === 'fiscal_only_external_card' ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                    }`}>
                      {cardOkcMode === 'fiscal_only_external_card' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                    Kart tahsilatı başka POS&apos;tan yapılır; cihazdan kart/şifre beklemeden anında Kredi Kartlı mali fiş keser.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectCardOkcMode('no_fiscal_on_card')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    cardOkcMode === 'no_fiscal_on_card'
                      ? 'bg-slate-200/80 border-slate-600 ring-2 ring-slate-500/20 text-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-slate-900">Kartta ÖKC&apos;ye Gönderme</span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      cardOkcMode === 'no_fiscal_on_card' ? 'border-slate-700 bg-slate-700' : 'border-slate-300'
                    }`}>
                      {cardOkcMode === 'no_fiscal_on_card' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                    Kredi kartı satışlarında yazarkasa tetiklenmez; yalnızca Nakit tahsilatlarda mali fiş gönderilir.
                  </p>
                </button>
              </div>
            </div>

            {/* Dual Device & Sectoral Printing Workflow (HorecaLP vs ShopLP) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {isCafeRestaurant
                        ? 'HorecaLP Çift Cihaz Akışı (Termal Adisyon + İsteğe Bağlı ÖKC Kapanışı)'
                        : 'ShopLP Yazarkasa POS & Normal Termal Yazıcı Politikası'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    {isCafeRestaurant
                      ? 'Adisyon/ön hesap çıktıları normal termal yazıcıdan alınır; kasa kapatmada isteğe bağlı olarak ÖKC mali fişi kesilir.'
                      : 'ShopLP mağazalarında işlemler doğrudan ÖKC ile tamamlanır; harici fiş/normal yazıcı gerektiren durumlarda normal yazıcı çalışır.'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                  <div className="pr-2">
                    <span className="text-xs font-bold text-slate-900 block">
                      Ayrı Normal Termal Yazıcı Tanımlı (Çift Cihaz)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {hasSeparateThermal
                        ? `Aktif: ÖKC (${selectedDevice.defaultPaperWidthMm}mm) yanında ayrı ${resolvedPaperWidth}mm normal termal yazıcı kullanılır.`
                        : 'ÖKC yanında masaüstü 80mm/58mm adisyon veya bilgi fişi yazıcısı varsa açın.'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasSeparateThermal}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      updateBridgeSettingsBatch({
                        has_separate_thermal_printer: enabled,
                        thermal_paper_width_mm: enabled ? (bridgeSettings?.thermal_paper_width_mm || 80) : undefined
                      });
                    }}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                  <div className="pr-2">
                    <span className="text-xs font-bold text-slate-900 block">
                      ÖKC Fiş Kestiyse Termalden Çift Fiş Basma
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Kasa kapatmada ÖKC zaten mali fiş kestiyse tarayıcı yazıcısını otomatik açmaz; ÖKC kesilmezse normal yazıcı devreye girer.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={bridgeSettings?.skip_thermal_after_okc !== false}
                    onChange={(e) => updateBridgeSetting('skip_thermal_after_okc', e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
                  />
                </label>
              </div>

              {isCafeRestaurant && (
                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                    HorecaLP Kasa Kapatma ÖKC Resmileştirme Tercihi (Adisyon Çıktısı Her Zaman Normal Termalden Alınır):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => updateBridgeSetting('horeca_close_fiscal_mode', 'optional_ask')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        horecaCloseMode === 'optional_ask'
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="text-xs font-black text-slate-900">İsteğe Bağlı (Kasadan Seç)</div>
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                        Kasa kapatırken operatör ister ÖKC ile mali fiş kesip resmileştirir, ister normal termal fişle kapatır.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateBridgeSetting('horeca_close_fiscal_mode', 'always_okc')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        horecaCloseMode === 'always_okc'
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="text-xs font-black text-slate-900">Kasa Kapatmada Her Zaman ÖKC</div>
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                        Adisyon/garson fişleri termalden çıkar; hesap kapatıldığında doğrudan ÖKC fişi basılır.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateBridgeSetting('horeca_close_fiscal_mode', 'thermal_only')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        horecaCloseMode === 'thermal_only'
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="text-xs font-black text-slate-900">Sadece Normal Termal Yazıcı</div>
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                        ÖKC tetiklenmez; hem adisyon hem kasa kapanış fişleri normal yazıcı mantığıyla alınır.
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Fiscal Behavior Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              <label className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Nakit Satışlarda Mali Fiş Gönder</span>
                  <span className="text-[10px] text-slate-500">Nakit tahsilatlarda ÖKC üzerinden resmi fiş tetiklenir.</span>
                </div>
                <input
                  type="checkbox"
                  checked={bridgeSettings.fiscal_on_cash !== false}
                  onChange={(e) => updateBridgeSetting('fiscal_on_cash', e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Vardiya / Gün Sonunda Otomatik Z Raporu</span>
                  <span className="text-[10px] text-slate-500">Hızlı POS Gün Sonu kapatıldığında cihaza Z Raporu iletir.</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(bridgeSettings.auto_z_report_on_shift_close)}
                  onChange={(e) => updateBridgeSetting('auto_z_report_on_shift_close', e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-amber-950 block">Donanımsız Test / Simülasyon Modu</span>
                  <span className="text-[10px] text-amber-800">Fiziksel cihaz yokken bulut/POS akışlarını test etmek için.</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(bridgeSettings.allow_simulation)}
                  onChange={(e) => updateBridgeSetting('allow_simulation', e.target.checked)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* 4. KDV & ÖKC Department 1-8 Mapping Matrix */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  3. KDV & ÖKC Departman (1–8) Eşleme Matrisi
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ürün KDV oranlarınız cihaz üzerindeki 1–8 mali departmanlarla birebir örtüşmelidir (Örn. Gıda %1 → Dep 1, Restoran %10 → Dep 2, İçecek/Genel %20 → Dep 4).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onBrandingChange('fiscal_departments', DEFAULT_FISCAL_DEPARTMENTS)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hugin Standart Şablon
                </button>
                <button
                  type="button"
                  onClick={handleRunKdvAudit}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>KDV Uyumunu Denetle</span>
                </button>
              </div>
            </div>

            {effectiveVatAudit.isSynced ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mağazanızdaki tüm ürün KDV oranları ({effectiveVatAudit.mappedRates.map((r: number) => `%${r}`).join(', ') || '%20'}) ÖKC Departman 1–8 tablosuyla eşleşiyor.</span>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                <div className="font-black flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Eksik KDV Departmanı Tespit Edildi! (Hatalı mali fişi önlemek için aşağıdan ekleyin)</span>
                </div>
                {effectiveVatAudit.suggestedFixes.map((fix: any, idx: number) => (
                  <p key={idx} className="text-[11px] font-semibold">• {fix.message}</p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {departments.map((d) => (
                <div key={d.dept} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="w-12 shrink-0 text-center py-1 rounded-lg bg-slate-900 text-white text-[11px] font-black">
                    Dep {d.dept}
                  </span>
                  <input
                    type="text"
                    className="flex-1 min-w-0 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500"
                    value={d.label}
                    onChange={(e) => handleDepartmentChange(d.dept, 'label', e.target.value)}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-black text-slate-500">%</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 text-center outline-none focus:border-indigo-500"
                      value={d.vatRate}
                      onChange={(e) => handleDepartmentChange(d.dept, 'vatRate', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>* Değişikliklerin kalıcı olması için sağ üstten <strong>Ayarları Kaydet</strong> butonuna basmayı unutmayın.</span>
              <span className="font-mono text-[10px] text-slate-400">GMP3 TAG: 0xDF21</span>
            </div>
          </div>

          {/* 5. Recent Commands Log */}
          {Array.isArray(bridgeStatus?.recentCommands) && bridgeStatus.recentCommands.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-slate-900">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                <span>Son ÖKC Köprü Komutları (Audit)</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                      <th className="py-1.5 pr-2">Komut</th>
                      <th className="py-1.5 pr-2">Durum</th>
                      <th className="py-1.5 pr-2">Fiş / Z No</th>
                      <th className="py-1.5 pr-2">Tx ID</th>
                      <th className="py-1.5">Not / Hata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bridgeStatus.recentCommands.slice(0, 8).map((c: any) => (
                      <tr key={c.id}>
                        <td className="py-1.5 pr-2 font-black text-slate-800">{c.command}</td>
                        <td className="py-1.5 pr-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-1.5 pr-2 font-mono text-slate-700">{c.receipt_no || '-'} {c.z_no ? `/ ${c.z_no}` : ''}</td>
                        <td className="py-1.5 pr-2 font-mono text-slate-400 truncate max-w-[140px]">{c.client_tx_id || '-'}</td>
                        <td className="py-1.5 text-rose-700 font-semibold truncate max-w-[200px]">{c.error_message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* SUBTAB 4: KIOSK & PRICE CHECK */}
      {activeSubTab === 'kiosk' && !isPortfolio && !isCafeRestaurant && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-slate-900">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 mb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">
                <Scan className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {txt("Mağaza İçi 'Fiyat Gör' QR & Barkod Kiosk", "In-Store Price Check Kiosk", "Έλεγχος Τιμών QR & Barkod")}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase">
                  {txt('Müşteri Self-Servis Fiyat Tarayıcı', 'Customer Self-Service Price Scanner', 'Self-Service Έλεγχος')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                <QRCodeSVG
                  value={scanUrl}
                  size={120}
                  level="H"
                  includeMargin={true}
                />
                <span className="mt-2 text-[10px] font-mono font-bold text-slate-500 truncate max-w-[160px]">
                  {scanUrl}
                </span>
              </div>

              <div className="md:col-span-2 space-y-3">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {txt("Müşterileriniz mağaza reyonlarındaki QR kodu okutarak barkod ile fiyat ve stok sorgular.", "Customers scan this QR code in-store to check prices.", "Οι πελάτες σαρώνουν το QR code για να δουν τις τιμές.")}
                </p>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-indigo-600 font-bold truncate">
                    {scanUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(scanUrl);
                      setCopiedScanUrl(true);
                      setTimeout(() => setCopiedScanUrl(false), 2000);
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedScanUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                    <span>{copiedScanUrl ? txt('Kopyalandı', 'Copied', 'Αντιγράφηκε') : txt('Kopyala', 'Copy', 'Αντιγραφή')}</span>
                  </button>
                </div>

                <a
                  href={scanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{txt("Sayfayı Canlı Aç", "Open Scanner", "Άνοιγμα")}</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
