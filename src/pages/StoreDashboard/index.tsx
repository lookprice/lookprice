import React, { useState, useEffect, useCallback, useMemo, useRef, useTransition, useDeferredValue, Suspense } from "react";
import { useParams } from "react-router-dom";
import { 
  Activity,
  ArrowLeftRight,
  Bell,
  Car,
  LayoutDashboard, 
  Package, 
  Settings as SettingsIcon, 
  Plus, 
  Store,
  History,
  Home,
  BarChart3,
  Briefcase,
  Radar,
  CreditCard,
  Scan,
  FileText,
  Users,
  Wallet,
  Globe,
  ShoppingBag,
  Facebook,
  BookOpen,
  Database,
  Truck,
  Wrench,
  Printer,
  X,
  QrCode,
  Download,
  FileCheck,
  FileDown,
  Edit2,
  Trash2,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "@/translations";
import PurchaseInvoices from "../../components/PurchaseInvoices";
import SalesInvoices from "../../components/SalesInvoices";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDashboardController } from "../../hooks/useDashboardController";
import { useProducts } from "../../hooks/useProducts";
import { useQuotations } from "../../hooks/useQuotations";
import { useSales } from "../../hooks/useSales";
import { useCompanies } from "../../hooks/useCompanies";
import { useRealEstate } from "../../hooks/useRealEstate";
import { api } from "../../services/api";
import { User, Product } from "../../types";
// import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { toast } from "sonner";
import { handleDownloadQuotationPDF } from "../../utils/dashboardUtils";
import { numberToTurkishWords } from "../../utils/formatUtils";

// Modular Components
import { DashboardLayout } from "./DashboardLayout";
import { DashboardModals } from "./DashboardModals";

// Lazy Tabs
const CockpitTab = React.lazy(() => import("./CockpitTab"));
const ProductsTab = React.lazy(() => import("./ProductsTab"));
const AnalyticsTab = React.lazy(() => import("./AnalyticsTab"));
const PortfolioAnalyticsTab = React.lazy(() => import("./PortfolioAnalyticsTab"));
const PortfolioNotificationsTab = React.lazy(() => import("./PortfolioNotificationsTab").then(m => ({ default: m.PortfolioNotificationsTab })));
const PortfolioWebsiteGeneratorTab = React.lazy(() => import("./PortfolioWebsiteGenerator").then(m => ({ default: m.PortfolioWebsiteGenerator })));
const RealEstateWebsiteGeneratorTab = React.lazy(() => import("./RealEstateWebsiteGenerator").then(m => ({ default: m.RealEstateWebsiteGenerator })));
const AutomotiveWebsiteGeneratorTab = React.lazy(() => import("./AutomotiveWebsiteGenerator").then(m => ({ default: m.AutomotiveWebsiteGenerator })));
const TeamCrmTab = React.lazy(() => import("./TeamCrmTab").then(m => ({ default: m.TeamCrmTab })));
const RealEstateCrmTab = React.lazy(() => import("./RealEstateCrmTab"));
const QuotationsTab = React.lazy(() => import("./QuotationsTab"));
const CompaniesTab = React.lazy(() => import("./CompaniesTab"));
const PosTab = React.lazy(() => import("./PosTab"));
const FastPosTab = React.lazy(() => import("../../components/FastPosTab"));
const AuditLogTab = React.lazy(() => import("../../components/AuditLogTab"));
const SettingsTab = React.lazy(() => import("./SettingsTab"));
const BlogTab = React.lazy(() => import("./BlogTab"));
const ProcurementTab = React.lazy(() => import("./ProcurementTab").then(m => ({ default: m.ProcurementTab })));
const ServiceTab = React.lazy(() => import("./ServiceTab").then(m => ({ default: m.ServiceTab })));
const StockTransferTab = React.lazy(() => import("./StockTransferTab"));
const AuthorityTransferTab = React.lazy(() => import("./AuthorityTransferTab"));
const FleetTab = React.lazy(() => import("./FleetTab"));
const MetaIntegrationTab = React.lazy(() => import("./MetaIntegrationTab"));
const GoogleMerchantTab = React.lazy(() => import("./GoogleMerchantTab"));
const RealEstateTab = React.lazy(() => import("./RealEstateTab"));
const RadarAlertsTab = React.lazy(() => import("./RadarAlertsTab").then(m => ({ default: m.RadarAlertsTab })));
const PortfolioFinancesTab = React.lazy(() => import("./PortfolioFinancesTab"));
const SEOTab = React.lazy(() => import("./SEOTab"));
const EWaybillsTab = React.lazy(() => import("../../components/EWaybillsTab"));
const FaqTab = React.lazy(() => import("./FaqTab"));

import ShippingSlip from "../../components/ShippingSlip";

interface StoreDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StoreDashboard({ user, onLogout }: StoreDashboardProps) {
  const { slug } = useParams();
  const { lang } = useLanguage();
  const isTr = lang === 'tr';
  const txt = (tr: string, en: string, el: string) => {
    if (lang === 'tr') return tr;
    if (lang === 'el') return el;
    return en;
  };
  const [shipCarrier, setShipCarrier] = useState('');
  const [shipTrackingNumber, setShipTrackingNumber] = useState('');
  const [dismissedWebSales, setDismissedWebSales] = useState(false);

  const t = translations[lang].dashboard;
  const {
    activeTab, setActiveTab,
    branding, setBranding
  } = useDashboardController(user);

  // Cafe/Restaurant Role-based authorization state
  const [activeStaffRole, setActiveStaffRole] = useState<'manager' | 'cashier' | 'waiter'>(() => {
    return (localStorage.getItem('lookprice_active_staff_role') as 'manager' | 'cashier' | 'waiter') || 'manager';
  });

  const [managerPin, setManagerPin] = useState(() => localStorage.getItem('lookprice_manager_pin') || '1234');
  const [cashierPin, setCashierPin] = useState(() => localStorage.getItem('lookprice_cashier_pin') || '2222');
  const [waiterPin, setWaiterPin] = useState(() => localStorage.getItem('lookprice_waiter_pin') || '3333');

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [modalRole, setModalRole] = useState<'manager' | 'cashier' | 'waiter'>('waiter');
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isEditingPins, setIsEditingPins] = useState(false);

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('lookprice_active_staff_role', activeStaffRole);
  }, [activeStaffRole]);

  useEffect(() => {
    const rawStoreName = (branding?.store_name || "").trim();
    const rawName = (branding?.name || "").trim();
    const storeName = (rawStoreName && !/^lookprice$/i.test(rawStoreName))
      ? rawStoreName
      : (rawName && !/^lookprice$/i.test(rawName))
      ? rawName
      : "Seçkin Mağaza";
      
    document.title = `${storeName} - Bulut Panel`;

    const faviconUrl = branding?.favicon_url || branding?.logo_url || branding?.logo;
    if (faviconUrl) {
      const link = (document.querySelector("link[rel~='icon']") as HTMLLinkElement) || document.createElement("link");
      link.rel = "icon";
      link.href = faviconUrl;
      document.head.appendChild(link);
    }
  }, [branding]);

  useEffect(() => {
    localStorage.setItem('lookprice_manager_pin', managerPin);
  }, [managerPin]);

  useEffect(() => {
    localStorage.setItem('lookprice_cashier_pin', cashierPin);
  }, [cashierPin]);

  useEffect(() => {
    localStorage.setItem('lookprice_waiter_pin', waiterPin);
  }, [waiterPin]);

  const handleVerifyRolePin = (pinToVerify: string) => {
    let targetPin = '';
    if (modalRole === 'manager') targetPin = managerPin;
    else if (modalRole === 'cashier') targetPin = cashierPin;
    else if (modalRole === 'waiter') targetPin = waiterPin;

    if (pinToVerify === targetPin) {
      setActiveStaffRole(modalRole);
      setShowRoleModal(false);
      setPinValue('');
      setPinError(false);
      toast.success(isTr 
        ? `${modalRole === 'manager' ? 'Yönetici' : modalRole === 'cashier' ? 'Kasiyer' : 'Garson'} oturumu açıldı!` 
        : `Switched to ${modalRole === 'manager' ? 'Manager' : modalRole === 'cashier' ? 'Cashier' : 'Waiter'} role!`
      );
    } else {
      setPinError(true);
      setPinValue('');
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
  };
  
  
  const [isPending, startTransition] = useTransition();

  const [includeBranches, setIncludeBranches] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  const planLimits: Record<string, number> = {
    free: 50,
    basic: 100,
    pro: 500,
    enterprise: Infinity
  };

  const {
    products, setProducts,
    loading, setLoading,
    showProductModal, setShowProductModal,
    showBulkPriceModal, setShowBulkPriceModal,
    bulkPriceForm, setBulkPriceForm,
    editingProduct, setEditingProduct,
    showDescription, setShowDescription,
    showImportModal, setShowImportModal,
    isImporting, setIsImporting,
    importFile, setImportFile,
    importColumns, setImportColumns,
    mapping, setMapping,
    convertCurrency, setConvertCurrency,
    handleAddProduct,
    handleDeleteProduct,
    handleDeleteAllProducts,
    handleBulkDelete,
    handleApplyTaxRule,
    handleBulkPriceSubmit,
    handleFileSelect,
    handleImport,
    handleExportProducts,
    handleBulkRecalculatePrice2,
    handleBulkAdd,
    handleBulkRename,
    handleReformatProductNames,
    fetchData: fetchProductsData,
    currentStoreId
  } = useProducts(user, slug, includeBranches, branding, planLimits, lang);

  const {
    quotationList, setQuotationList,
    showQuotationModal, setShowQuotationModal,
    showNotes, setShowNotes,
    quotationProductSearch, setQuotationProductSearch,
    showQuickProductModal, setShowQuickProductModal,
    quickProductForm, setQuickProductForm,
    quotationItems, setQuotationItems,
    editingQuotation, setEditingQuotation,
    quotationSearch, setQuotationSearch,
    quotationStatusFilter, setQuotationStatusFilter,
    selectedQuotationDetails, setSelectedQuotationDetails,
    showQuotationDetailsModal, setShowQuotationDetailsModal,
    isTaxInclusive, setIsTaxInclusive,
    quotationNotes, setQuotationNotes,
    fetchQuotations,
    handleQuickAddProduct,
    handleAddQuotation,
    handleApproveQuotation,
    handleCancelQuotation,
    handleDeleteQuotation,
    handleUpdateQuotationStatus
  } = useQuotations(currentStoreId, fetchProductsData, branding, lang);

  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (currentStoreId) {
      api.getCustomers(currentStoreId).then(setCustomers);
    }
  }, [currentStoreId]);

  const {
    sales, setSales,
    salesLoading, setSalesLoading,
    salesStatusFilter, setSalesStatusFilter,
    salesStartDate, setSalesStartDate,
    salesEndDate, setSalesEndDate,
    selectedSale, setSelectedSale,
    showSaleDetailsModal, setShowSaleDetailsModal,
    showSaleModal, setShowSaleModal,
    isConfirmingSale, setIsConfirmingSale,
    selectedQuotation, setSelectedQuotation,
    paymentMethod, setPaymentMethod,
    dueDate, setDueDate,
    saleNotes, setSaleNotes,
    createCompanyFromSale, setCreateCompanyFromSale,
    completingSale, setCompletingSale,
    posPaymentMethod, setPosPaymentMethod,
    fetchSales,
    handleUpdateSaleItem,
    handleRemoveSaleItem,
    handleCancelPendingSale,
    handleShipSale,
    handleDeliverSale,
    handleCompletePendingSale,
    handleConvertToSale,
    handleConfirmSale,
    handleDeleteSale,
    handleExportSales,
    getConvertedPrice
  } = useSales(user, currentStoreId, branding, lang, fetchProductsData);

  const {
    companies, setCompanies,
    showCompanyModal, setShowCompanyModal,
    editingCompany, setEditingCompany,
    selectedCompany, setSelectedCompany,
    showTransactionModal, setShowTransactionModal,
    includeZeroBalance, setIncludeZeroBalance,
    companyTransactions, setCompanyTransactions,
    openingBalances, setOpeningBalances,
    transactionLoading, setTransactionLoading,
    transactionStartDate, setTransactionStartDate,
    transactionEndDate, setTransactionEndDate,
    showAddTransactionModal, setShowAddTransactionModal,
    newTransactionType, setNewTransactionType,
    newTransactionAmount, setNewTransactionAmount,
    newTransactionDescription, setNewTransactionDescription,
    newTransactionDate, setNewTransactionDate,
    newTransactionPaymentMethod, setNewTransactionPaymentMethod,
    newTransactionCurrency, setNewTransactionCurrency,
    newTransactionExchangeRate, setNewTransactionExchangeRate,
    selectedCurrency, setSelectedCurrency,
    fetchCompanies,
    handleAddCompany,
    handleDeleteCompany,
    handleExportCompanies,
    handleFetchTransactions,
    handleDeleteTransaction,
    handleEditTransaction,
    handleExportTransactionsPDF,
    handleAddTransaction
  } = useCompanies(user, currentStoreId, lang, branding);

  const { properties, contacts, loading: realEstateLoading, saveProperty, saveContact, deleteProperty, deleteContact } = useRealEstate(currentStoreId);

  const webOwnerLeadsCount = useMemo(() => {
    if (!Array.isArray(contacts)) return 0;
    return contacts.filter(c => c.notes && c.notes.includes('[MÜLK SAHİBİ BAŞVURUSU]')).length;
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(`storeDashboardTab_${user.store_id || 'admin'}`, activeTab);
  }, [activeTab, user.store_id]);
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [realEstateStatusFilter, setRealEstateStatusFilter] = useState("all");
  const shippingSlipRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: shippingSlipRef });
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState<any>(null);
  const qrPrintRef = useRef<HTMLDivElement>(null);
  const handlePrintQR = useReactToPrint({ contentRef: qrPrintRef });
  const [showPurchaseInvoiceDetailsModal, setShowPurchaseInvoiceDetailsModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(() => {
    return localStorage.getItem('desktopSidebarCollapsed') === 'true';
  });

  const companyList = Array.isArray(companies) ? companies : [];

  useEffect(() => {
    localStorage.setItem('desktopSidebarCollapsed', desktopSidebarCollapsed.toString());
  }, [desktopSidebarCollapsed]);

  useEffect(() => {
    if (editingQuotation) {
      setIsTaxInclusive(!!editingQuotation.is_tax_inclusive);
      setQuotationNotes(editingQuotation.notes || "");
    } else {
      setIsTaxInclusive(true);
    }
  }, [editingQuotation]);

  useEffect(() => {
    if (showQuotationModal) {
      const trDahil = '*Fiyatlarımıza Vergiler Dahildir!';
      const trHaric = '*Fiyatlarımıza KDV Dahil Değildir. Vergi Oranı Ürün Satırında Belirtilmiştir.';
      const enDahil = '*Prices Include Taxes!';
      const enHaric = '*Prices Exclude VAT. Tax Rates are Specified in Product Lines.';
      
      const isDefault = quotationNotes === '' || 
                        quotationNotes === trDahil || 
                        quotationNotes === trHaric ||
                        quotationNotes === enDahil ||
                        quotationNotes === enHaric;

      if (isDefault) {
        if (isTaxInclusive) {
          setQuotationNotes(lang === 'tr' ? trDahil : enDahil);
        } else {
          setQuotationNotes(lang === 'tr' ? trHaric : enHaric);
        }
      }
    }
  }, [isTaxInclusive, showQuotationModal, lang, editingQuotation]);

  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const handleCancelSale = async () => {
    if (!saleToCancel || !cancelReason) return;
    await handleCancelPendingSale(saleToCancel, cancelReason);
    setShowCancelReasonModal(false);
    setCancelReason("");
    setSaleToCancel(null);
  };
  const [dailyReportData, setDailyReportData] = useState<{ summary: any[], details: any[] }>({ summary: [], details: [] });
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportLoading, setReportLoading] = useState(false);

  const isViewer = user.role === 'viewer';
  const effectiveSlug = branding.parent_slug || slug || user.store_slug;
  const publicUrl = `${window.location.origin}/s/${effectiveSlug}`;
  const scanUrl = `${window.location.origin}/scan/${effectiveSlug}`;

  const fetchAnalytics = async (start?: string, end?: string) => {
    if (!currentStoreId) return;
    try {
      setLoading(true);
      const res = await api.getAnalytics(currentStoreId, start, end);
      setAnalytics(res && !res.error ? res : null);
    } catch (error) {
      console.error("Fetch analytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      
      let targetStoreId = currentStoreId || user.store_id;
      
      if (slug) {
        const storeInfo = await api.getBranding(undefined, slug);
        if (storeInfo && storeInfo.id) {
          targetStoreId = storeInfo.id;
        } else if (storeInfo && storeInfo.error) {
          if (!isSilent) setLoading(false);
          return;
        }
      } else if (user.role === 'superadmin' && !targetStoreId) {
        window.location.href = "/admin";
        return;
      }
      
      if (targetStoreId === undefined || targetStoreId === null) {
        if (!isSilent) setLoading(false);
        return;
      }
      
      const requests: any[] = [
        api.getProducts("", targetStoreId, includeBranches),
        api.getBranding(targetStoreId),
        api.getUsers(targetStoreId),
        api.getBranches(targetStoreId)
      ];

      const results = await Promise.all(requests);
      const [productsRes, brandingRes, usersRes, branchesRes] = results;

      if (Array.isArray(productsRes)) {
        setProducts(productsRes);
      }
      if (brandingRes && !brandingRes.error) setBranding(brandingRes);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setBranches(Array.isArray(branchesRes) ? branchesRes : []);
    } catch (error) {
      console.error("Fetch error in StoreDashboard:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [includeBranches, user.role, user.store_id, slug, currentStoreId, setProducts, setBranding, setLoading]);

  const fetchDailySalesReport = async () => {
    if (!currentStoreId) return;
    try {
      setReportLoading(true);
      const res = await api.getDailySalesReport(reportStartDate, reportEndDate, currentStoreId);
      setDailyReportData(res && res.summary ? res : { summary: [], details: [] });
    } catch (error) {
      console.error("Fetch daily report error:", error);
      setDailyReportData({ summary: [], details: [] });
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadDailyReportExcel = async () => {
    const XLSX = await import('xlsx');
    if (!dailyReportData.details || dailyReportData.details.length === 0) {
      alert(t.noDataToDownload || "İndirilecek veri bulunamadı");
      return;
    }

    const data = dailyReportData.details.map(d => ({
      [t.statements.date]: new Date(d.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US'),
      [t.customer]: d.customer_name || '-',
      [t.amount]: d.amount,
      [t.paymentMethod || 'Payment Method']: t[d.payment_method] || d.payment_method,
      [t.statements.source]: t.sources[d.source] || d.source,
      [t.saleId || 'Sale ID']: d.sale_id ? `#${d.sale_id}` : '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.cashReport || "Kasa Raporu");
    XLSX.writeFile(wb, `${t.cashReport || 'Kasa_Raporu'}_${reportStartDate}_${reportEndDate}.xlsx`);
  };

  const [notifications, setNotifications] = useState<any>({
    transfers: 0,
    service: 0,
    quotations: 0,
    sales: 0,
    fleet: 0,
    sales_invoices: 0,
    purchase_invoices: 0
  });

  const fetchNotifications = useCallback(async () => {
    if (!currentStoreId) return;
    try {
      const data = await api.getNotifications(currentStoreId);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [currentStoreId]);

  useEffect(() => {
    fetchData();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 300000); 
    return () => clearInterval(interval);
  }, [fetchData, fetchNotifications]);

  useEffect(() => {
    if (currentStoreId) {
      fetchQuotations();
      fetchCompanies();
    }
  }, [fetchQuotations, fetchCompanies, currentStoreId]);

  useEffect(() => {
    if ((activeTab === 'analytics' || activeTab === 'notifications') && !analytics && currentStoreId) {
      fetchAnalytics();
    }
  }, [activeTab, analytics, currentStoreId]);

  useEffect(() => {
    if (activeTab === 'pos') {
      fetchSales();
    }
  }, [activeTab, fetchSales]);

  const handleSaleSuccess = async (saleId?: any) => {
    await fetchData();
    if (saleId) {
      handleFetchSalesInvoiceDetails(saleId);
    }
  };

  const onBrandingChange = (field: string, value: any) => {
    setBranding((prev: any) => ({ ...prev, [field]: value }));
  };

  const [savingBranding, setSavingBranding] = useState(false);

  const handleSaveBranding = async () => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    setSavingBranding(true);
    try {
      await api.updateBranding(branding, targetStoreId);
      await fetchData(); 
      toast.success(t.saveSuccess || (lang === 'tr' ? "Başarıyla kaydedildi" : "Saved successfully"));
    } catch (error) {
      toast.error(lang === 'tr' ? "Ayarlar kaydedilirken bir hata oluştu" : "An error occurred while saving settings");
    } finally {
      setSavingBranding(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.uploadFile(formData);
      const urlField = type === 'logo' ? 'logo_url' : type === 'favicon' ? 'favicon_url' : 'hero_image_url';
      onBrandingChange(urlField, res.url);
      toast.success(lang === 'tr' ? 'Dosya yüklendi' : 'File uploaded');
    } catch (error) {
      toast.error("Yükleme hatası");
    }
  };

  const quotationPrintRef = useRef<HTMLDivElement>(null);
  const onDownloadQuotationPDF = async (quotation: any) => {
    let qData = quotation;
    if (!quotation.items || quotation.items.length === 0) {
      try {
        const response = await api.getQuotation(quotation.id, currentStoreId);
        qData = response.id ? response : (response.data || response);
      } catch (error) {
        console.error("Fetch quotation error for PDF:", error);
      }
    }
    handleDownloadQuotationPDF(qData, branding, lang);
  };

  const handlePrintQuotation = useReactToPrint({
    contentRef: quotationPrintRef,
  });

  const handleExportQuotations = async () => {
    const XLSX = await import('xlsx');
    const data = quotationList.map(q => ({
      [t.quotationNo || 'Quotation No']: q.id,
      [t.statements.date]: new Date(q.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US'),
      [t.customer]: q.customer_name,
      [t.amount]: `${Number(q.total_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${q.currency?.slice(0, 3)}`,
      [t.status]: q.status === 'approved' || q.status === 'sold' ? t.completed : q.status === 'cancelled' ? t.cancelled : t.pending
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.quotations);
    XLSX.writeFile(wb, `${t.quotations}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleFetchPurchaseInvoiceDetails = async (id: number) => {
    try {
      const res = await api.getPurchaseInvoice(id, currentStoreId);
      setSelectedPurchaseInvoice(res);
      setShowPurchaseInvoiceDetailsModal(true);
    } catch (error) {
      console.error("Fetch purchase invoice details error:", error);
    }
  };

  const handleFetchSalesInvoiceDetails = async (id: number) => {
    try {
      const res = await api.getSalesInvoice(id, currentStoreId);
      setSelectedSale(res);
      setShowSaleDetailsModal(true);
    } catch (error) {
      console.error("Fetch sales invoice details error:", error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStoreId = user?.role === 'superadmin' ? currentStoreId : undefined;
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    try {
      await api.addUser(data, targetStoreId);
      setShowUserModal(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Hata oluştu");
    }
  };

  const handleDeleteUser = async (id: number) => {
    const targetStoreId = user?.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(t.confirmDelete)) {
      try {
        await api.deleteUser(id, targetStoreId);
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const isGapStore = 
    slug?.toLowerCase() === 'gap' || 
    branding?.slug?.toLowerCase() === 'gap' || 
    branding?.store_name?.toUpperCase().includes('GAP') ||
    user?.store_slug?.toLowerCase() === 'gap';

  const isPortfolio = !isGapStore && (branding?.store_type === 'real_estate' || branding?.store_type === 'motor_vehicle' || branding?.store_type === 'portfolio' || branding?.page_layout_settings?.sector === 'real_estate' || branding?.page_layout_settings?.sector === 'automotive');
  const isRealEstate = !isGapStore && (branding?.store_type === 'real_estate' || branding?.store_type === 'portfolio' || branding?.page_layout_settings?.sector === 'real_estate');
  const isAutomotive = !isGapStore && (branding?.store_type === 'motor_vehicle' || branding?.store_type === 'automotive' || branding?.page_layout_settings?.sector === 'automotive');
  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';

  useEffect(() => {
    if (isPortfolio && (['products', 'pos', 'fast-pos', 'procurements', 'stock_transfer', 'service'].includes(activeTab))) {
      if (isAutomotive && !isRealEstate) {
        setActiveTab('fleet');
      } else {
        setActiveTab('real_estate');
      }
    }
  }, [isPortfolio, isAutomotive, isRealEstate, activeTab, setActiveTab]);

  // Active role restricted tabs safety effect
  useEffect(() => {
    if (isCafeRestaurant) {
      if (activeStaffRole === 'waiter' && activeTab !== 'fast-pos') {
        setActiveTab('fast-pos');
      } else if (activeStaffRole === 'cashier' && !['fast-pos', 'products', 'sales_invoices'].includes(activeTab)) {
        setActiveTab('fast-pos');
      }
    }
  }, [activeStaffRole, activeTab, isCafeRestaurant, setActiveTab]);

  const rawNavItems = isPortfolio ? [
    { type: 'category', key: "real_estate", title: txt('Portföy & İlan', 'Portfolios & Listings', 'Χαρτοφυλάκιο & Αγγελίες'), items: [
      ...(isRealEstate ? [{ id: "real_estate", label: txt('Gayrimenkul Portföyü', 'Real Estate Portfolio', 'Χαρτοφυλάκιο Ακινήτων'), icon: Home }] : []),
      ...(isAutomotive ? [{ id: "fleet", label: txt('Oto Galeri / Araçlar', 'Automotive / Vehicles', 'Αντιπροσωπεία / Οχήματα'), icon: Car, badge: notifications.fleet }] : []),
    ]},
    { type: 'category', key: "finance_operations", title: txt('Finans & Operasyon', 'Finance & Operations', 'Οικονομικά & Λειτουργίες'), items: [
      ...(!isPortfolio ? [{ id: "purchase_invoices", label: t.purchase_invoices, icon: FileDown, badge: notifications.purchase_invoices }] : []),
      ...(!isPortfolio ? [{ id: "sales_invoices", label: t.sales_invoices, icon: FileText, badge: notifications.sales_invoices, badgeType: 'error' }] : []),
      ...(!isPortfolio ? [{ id: "e_waybills", label: txt('e-İrsaliyeler', 'e-Waybills', 'Ηλεκτρονικά Δελτία Αποστολής'), icon: Truck }] : []),
      { id: "companies", label: t.companies, icon: Store },
      { id: "portfolio_finances", label: txt('Gelir & Gider / Kasa', 'Finances & Cash Flow', 'Έσοδα & Έξοδα / Ταμείο'), icon: Wallet },
    ]},
    { type: 'category', key: "team", title: txt('Personel & Şube', 'Staff & Branches', 'Προσωπικό & Υποκαταστήματα'), items: [
      { id: "team-crm", label: txt('Personel & Şube Yönetimi', 'Staff & Branch CRM', 'Διαχείριση Προσωπικού & Υποκαταστημάτων'), icon: Users },
      { id: "real_estate_crm", label: txt('Mülk Sahibi & Yatırımcı CRM', 'Property Owner & Investor CRM', 'CRM Ιδιοκτητών & Επενδυτών'), icon: Users, badge: webOwnerLeadsCount > 0 ? webOwnerLeadsCount : undefined, badgeType: 'error' },
      ...(isRealEstate ? [{ id: "authority_transfer", label: txt('Yetki Devri (Tapu)', 'Authority Transfer', 'Μεταβίβαση Εξουσιοδότησης'), icon: Briefcase }] : []),
    ]},
    { type: 'category', key: "integrations", title: txt('Yedekleme & Kanallar', 'Backup & Channels', 'Δημιουργία Αντιγράφων & Κανάλια'), items: [
      { id: "meta", label: "Meta Entegrasyonu", icon: Facebook },
      { id: "settings_yedekleme", label: txt('Yedekleme', 'Backup', 'Δημιουργία Αντιγράφων'), icon: Database },
    ]},
    { type: 'category', key: "dashboard", title: txt('İstatistik & Rapor', 'Analytics & Logs', 'Στατιστικά & Αναφορές'), items: [
      { id: "analytics", label: t.analytics, icon: BarChart3 },
      { id: "radar_alerts", label: txt(isAutomotive ? 'Motorlu Taşıtlar & Haber Radarı' : 'İmar & Haber Radarı', 'Radar & Alerts', 'Ραντάρ & Ειδοποιήσεις'), icon: Radar },
      { id: "notifications", label: txt('Bildirimler', 'Notifications', 'Ειδοποιήσεις'), icon: Bell },
      { id: "blog", label: txt('Blog', 'Blog', 'Blog'), icon: BookOpen },
      { id: "seo", label: txt('SEO Sayfaları', 'SEO Pages', 'Σελίδες SEO'), icon: Globe },
      { id: "website-generator", label: txt('Web Sitesi & Footer Yönetimi', 'Website & Footer Management', 'Διαχείριση Ιστοσελίδας & Footer'), icon: Globe },
      { id: "audit-logs", label: t.auditLogs, icon: History },
    ]},
    { type: 'item', id: "settings", label: t.settings, icon: SettingsIcon }
  ] : [
    { type: 'category', key: "operations", title: txt('Operasyonlar', 'Operations', 'Λειτουργίες'), items: [
      { id: "products", label: t.products, icon: Package },
      { id: "purchase_invoices", label: t.purchase_invoices, icon: FileDown, badge: notifications.purchase_invoices },
      ...(!isCafeRestaurant ? [{ id: "service", label: t.service, icon: Wrench, badge: notifications.service }] : []),
      ...(!isCafeRestaurant ? [{ id: "fleet", label: txt('Filo Yönetimi', 'Fleet Management', 'Διαχείριση Στόλου'), icon: Car, badge: notifications.fleet }] : []),
      { id: "procurements", label: t.procurements, icon: Truck },
      { id: "stock_transfer", label: t.stock_transfer, icon: ArrowLeftRight, badge: notifications.transfers },
    ]},
    { type: 'category', key: "sales", title: txt('Finans', 'Finance', 'Οικονομικά'), items: [
      ...(!isCafeRestaurant ? [{ id: "quotations", label: t.quotations, icon: FileCheck }] : []),
      { id: "sales_invoices", label: t.sales_invoices, icon: FileText, badge: notifications.sales_invoices, badgeType: 'error' },
      ...(!isCafeRestaurant ? [{ id: "e_waybills", label: txt('e-İrsaliyeler', 'e-Waybills', 'Ηλεκτρονικά Δελτία Αποστολής'), icon: Truck }] : []),
      { id: "companies", label: t.companies, icon: Store },
      { id: "pos", label: t.pos, icon: CreditCard, badge: notifications.sales },
      { id: "fast-pos", label: t.fastPos, icon: Scan },
    ]},
    { type: 'category', key: "integrations", title: txt('Yedekleme & Kanallar', 'Backup & Channels', 'Δημιουργία Αντιγράφων & Κανάλια'), items: [
      { id: "meta", label: "Meta Entegrasyonu", icon: Facebook },
      ...(!isCafeRestaurant ? [{ id: "google-merchant", label: "Google Merchant", icon: ShoppingBag }] : []),
      { id: "settings_yedekleme", label: txt('Yedekleme', 'Backup', 'Δημιουργία Αντιγράφων'), icon: Database },
    ]},
    { type: 'category', key: "dashboard", title: txt('İstatistik & Blog', 'Analytics & Blog', 'Στατιστικά & Blog'), items: [
      { id: "analytics", label: t.analytics, icon: BarChart3 },
      { id: "notifications", label: txt('Bildirimler', 'Notifications', 'Ειδοποιήσεις'), icon: Bell },
      { id: "blog", label: txt('Blog', 'Blog', 'Blog'), icon: BookOpen },
      ...(!isCafeRestaurant ? [{ id: "faq", label: txt('S.S.S', 'FAQ', 'Συχνές Ερωτήσεις'), icon: HelpCircle }] : []),
      { id: "audit-logs", label: t.auditLogs, icon: History },
    ]},
    { type: 'item', id: "settings", label: t.settings, icon: SettingsIcon }
  ];

  const navItems = React.useMemo(() => {
    if (!isCafeRestaurant) return rawNavItems;
    
    // Cafe/Restaurant menu: Only show required items
    const restaurantItems = rawNavItems
      .map(category => {
        if (category.type === 'category') {
          return {
            ...category,
            items: category.items.filter(item => 
              // Hide these specifically for cafe/restaurant
              !['service', 'fleet', 'quotations', 'e_waybills', 'google-merchant'].includes(item.id)
            )
          };
        }
        return category;
      })
      .filter(category => category.type === 'item' || (category.type === 'category' && category.items.length > 0));

    if (activeStaffRole === 'waiter') {
      return [
        { type: 'item', id: "fast-pos", label: txt('Hızlı POS / Masalar', 'Fast POS / Tables', 'Γρήγορο POS / Τραπέζια'), icon: Scan }
      ];
    }
    if (activeStaffRole === 'cashier') {
      return [
        { type: 'item', id: "fast-pos", label: txt('Hızlı POS / Masalar', 'Fast POS / Tables', 'Γρήγορο POS / Τραπέζια'), icon: Scan },
        { type: 'item', id: "products", label: txt('Ürün & Fiyat Listesi', 'Products & Price List', 'Προϊόντα & Τιμοκατάλογος'), icon: Package },
        { type: 'item', id: "purchase_invoices", label: t.purchase_invoices, icon: FileDown },
        { type: 'item', id: "procurements", label: t.procurements, icon: Truck },
        { type: 'item', id: "stock_transfer", label: t.stock_transfer, icon: ArrowLeftRight },
        { type: 'item', id: "sales_invoices", label: txt('Satış Faturaları', 'Sales Invoices', 'Τιμολόγια Πώλησης'), icon: FileText },
        { type: 'item', id: "companies", label: t.companies, icon: Store },
        { type: 'item', id: "pos", label: t.pos, icon: CreditCard }
      ];
    }
    return restaurantItems;
  }, [rawNavItems, activeStaffRole, isCafeRestaurant, isTr, t.companies, t.purchase_invoices, t.procurements, t.stock_transfer]);

  const currentMenuItem: any = (navItems as any[]).flatMap(c => c.type === 'category' ? c.items : [c]).find(i => i && i.id === activeTab);

  return (
    <DashboardLayout
      lang={lang}
      loading={loading}
      sidebarProps={{
        navItems,
        activeTab,
        setActiveTab,
        branding,
        publicUrl,
        scanUrl,
        isPortfolio,
        isRealEstate,
        isAutomotive,
        isCafeRestaurant,
        currentStoreId,
        onLogout,
        setShowQrModal,
        activeStaffRole,
        onOpenRoleModal: () => {
          setModalRole(activeStaffRole);
          setPinValue('');
          setPinError(false);
          setIsEditingPins(false);
          setShowRoleModal(true);
        },
        sidebarOpen,
        setSidebarOpen,
        desktopSidebarCollapsed,
        setDesktopSidebarCollapsed,
        translations: t,
        startTransition
      }}
    >
      <div className={activeTab === 'fast-pos' ? "space-y-0" : "space-y-8"}>
        {activeTab !== 'fast-pos' && activeTab !== 'products' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="bg-indigo-600 rounded-full h-10 w-1" />
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {currentMenuItem?.label || activeTab.replace(/_/g, ' ')}
                </h2>
              </div>
            </motion.div>

          </div>
        )}

        {['quotations', 'companies'].includes(activeTab) && (
          <div className="flex justify-end gap-3 mb-6">
            {activeTab === 'quotations' && (
              <button 
                onClick={() => { setEditingQuotation(null); setQuotationItems([]); setShowQuotationModal(true); }} 
                className="os-btn-primary flex items-center space-x-4 px-8 py-4 shadow-2xl shadow-indigo-500/20 active:scale-95 group rounded-2xl bg-indigo-600 text-white font-bold"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">{t.newQuotation}</span>
              </button>
            )}
            {activeTab === 'companies' && (
              <button onClick={() => { setEditingCompany(null); setShowCompanyModal(true); }} className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg uppercase tracking-wider">
                <Plus className="h-4 w-4" />
                <span>{t.registerCompany}</span>
              </button>
            )}
          </div>
        )}

        {!dismissedWebSales && notifications?.web_sales > 0 && (
          <div className="mb-6 bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center text-xl font-black shrink-0 shadow">
                🛍️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    {isTr ? `YENİ WEB SİPARİŞİ (${notifications.web_sales} Bekleyen)` : `NEW WEB ORDER (${notifications.web_sales})`}
                  </span>
                  <span className="animate-pulse px-2 py-0.5 bg-rose-500 text-white font-black text-[10px] rounded-full uppercase">
                    {isTr ? 'Aksiyon Bekliyor' : 'Action Required'}
                  </span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-200 font-medium mt-1 leading-relaxed">
                  {isTr 
                    ? 'E-Ticaret siteniz üzerinden yeni siparişleriniz var. Sipariş durumlarını "Satışlar" (Finans) sekmesinden güncelleyebilirsiniz.' 
                    : 'You have new orders from your website. Please check the Sales tab to process them.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setActiveTab("pos"); setDismissedWebSales(true); }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-rose-400 font-black text-xs rounded-xl shadow-md transition-all shrink-0 active:scale-95 flex items-center gap-1.5 border border-rose-500/30"
            >
              <span>{isTr ? 'Satışları Görüntüle' : 'View Sales'}</span>
              <span>→</span>
            </button>
          </div>
        )}

        {webOwnerLeadsCount > 0 && (
          <div className="mb-6 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xl font-black shrink-0 shadow">
                🏡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {isTr ? `YENİ MÜLK SAHİBİ BAŞVURUSU (${webOwnerLeadsCount} Talep)` : `NEW PROPERTY OWNER LEAD (${webOwnerLeadsCount})`}
                  </span>
                  <span className="animate-pulse px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full uppercase">
                    {isTr ? 'Aksiyon Bekliyor' : 'Action Required'}
                  </span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-200 font-medium mt-1 leading-relaxed">
                  {isTr 
                    ? 'Web sitenizdeki "Mülk Sahibi Başvuru Formu" üzerinden yeni mülk değerleme ve portföye ekleme talepleri alındı.' 
                    : 'New property valuation & portfolio listing requests received from website owner application forms.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("real_estate_crm")}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs rounded-xl shadow-md transition-all shrink-0 active:scale-95 flex items-center gap-1.5 border border-amber-500/30"
            >
              <span>{isTr ? 'Mülk Sahibi CRM Taleplerini Aç' : 'View Owner Leads'}</span>
              <span>→</span>
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`transition-opacity duration-200 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
          >
            <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
              {activeTab === "faq" && isCafeRestaurant && <FaqTab />}
              {activeTab === "products" && (
                <ProductsTab 
                  products={products}
                  loading={loading}
                  isViewer={isViewer || (isCafeRestaurant && activeStaffRole !== 'manager')}
                  onDeleteAll={handleDeleteAllProducts}
                  onBulkDelete={handleBulkDelete}
                  onEdit={(p) => { setEditingProduct(p); setShowProductModal(true); }}
                  onAddNew={() => { setEditingProduct(null); setShowProductModal(true); }}
                  onImport={() => setShowImportModal(true)}
                  onDelete={handleDeleteProduct}
                  onExportReport={handleExportProducts}
                  onApplyTaxRule={handleApplyTaxRule}
                  onBulkPriceUpdate={() => setShowBulkPriceModal(true)}
                  onBulkRecalculatePrice2={handleBulkRecalculatePrice2}
                  onBulkAdd={handleBulkAdd}
                  onBulkRename={handleBulkRename}
                  onReformatNames={handleReformatProductNames}
                  onShowQr={() => setShowQrModal(true)}
                  branding={branding}
                  isCafeRestaurant={isCafeRestaurant}
                  showStoreName={branding?.show_store_name}
                  currentStoreId={currentStoreId!}
                  includeBranches={includeBranches}
                  propertiesCount={properties.length}
                  onSwitchTab={(tab) => setActiveTab(tab)}
                  onRefresh={fetchProductsData}
                />
              )}
              {activeTab === "real_estate" && (
                <RealEstateTab 
                  properties={properties}
                  loading={realEstateLoading}
                  onSave={saveProperty}
                  onDelete={deleteProperty}
                  user={user}
                  branding={branding}
                  initialStatusFilter={realEstateStatusFilter}
                  onResetStatusFilter={() => setRealEstateStatusFilter("all")}
                  storeId={currentStoreId!}
                />
              )}
              {activeTab === "fleet" && (
                <FleetTab storeId={currentStoreId!} isViewer={isViewer} branding={branding} />
              )}
              {activeTab === "analytics" && (
                isPortfolio ? (
                  <PortfolioAnalyticsTab 
                    analytics={analytics} 
                    branding={branding} 
                    loading={loading}
                    onDateChange={(start, end) => fetchAnalytics(start, end)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                ) : (
                  <AnalyticsTab 
                    analytics={analytics} 
                    branding={branding} 
                    onDateChange={(start, end) => fetchAnalytics(start, end)} 
                    loading={loading} 
                  />
                )
              )}
              {activeTab === "pos" && (
                <PosTab 
                  sales={sales}
                  loading={salesLoading}
                  statusFilter={salesStatusFilter}
                  onStatusFilterChange={setSalesStatusFilter}
                  startDate={salesStartDate}
                  onStartDateChange={setSalesStartDate}
                  endDate={salesEndDate}
                  onEndDateChange={setSalesEndDate}
                  onViewDetails={(s) => { setSelectedSale(s); setShowSaleDetailsModal(true); }}
                  onDeleteSale={(id) => { setSaleToCancel(id); setShowCancelReasonModal(true); }}
                  onExportReport={handleExportSales}
                  isViewer={isViewer}
                  activeStoreId={currentStoreId}
                  onRefreshSales={fetchSales}
                />
              )}
              {showCancelReasonModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
                  >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">{txt('İptal Sebebi', 'Cancellation Reason', 'Λόγος Ακύρωσης')}</h3>
                    <textarea 
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4"
                      rows={3}
                      placeholder={txt('İptal nedenini girin...', 'Enter cancellation reason...', 'Εισαγάγετε τον λόγο ακύρωσης...')}
                    />
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setShowCancelReasonModal(false)} className="px-4 py-2 text-slate-500 font-bold">{t.cancel}</button>
                      <button onClick={handleCancelSale} className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold">{txt('İptal Et', 'Cancel', 'Ακύρωση')}</button>
                    </div>
                  </motion.div>
                </div>
              )}
              {activeTab === "fast-pos" && (
                <FastPosTab 
                  branding={branding} 
                  onSaleComplete={handleSaleSuccess}
                  storeId={currentStoreId!} 
                  activeStaffRole={activeStaffRole}
                  setShowQuickProductModal={setShowQuickProductModal}
                  setQuickProductForm={setQuickProductForm}
                />
              )}
              {activeTab === "sales_invoices" && !isPortfolio && (
                <SalesInvoices 
                  storeId={currentStoreId} 
                  role={user.role} 
                  lang={lang} 
                  api={api} 
                  branding={branding} 
                  onFetchDetails={handleFetchSalesInvoiceDetails}
                  products={products}
                  onEditProduct={(item: any) => {
                    const found = products.find((p: any) => p.id === item.product_id || p.barcode === item.barcode || (p.name && item.product_name && p.name.toLowerCase() === item.product_name.toLowerCase()));
                    if (found) {
                      setEditingProduct(found);
                    } else {
                      setEditingProduct({
                        name: item.product_name || item.name || '',
                        barcode: item.barcode || '',
                        price: Number(item.unit_price) || 0,
                        cost_price: Number(item.unit_price) * 0.8 || 0,
                        tax_rate: Number(item.tax_rate) || 20,
                        stock_quantity: Number(item.quantity) || 0
                      } as any);
                    }
                    setShowProductModal(true);
                  }}
                />
              )}
              {activeTab === "e_waybills" && !isPortfolio && (
                <EWaybillsTab 
                  storeId={currentStoreId} 
                  lang={lang} 
                  api={api} 
                  branding={branding} 
                />
              )}
              {activeTab === "quotations" && (
                <QuotationsTab 
                  quotations={quotationList}
                  isViewer={isViewer}
                  onViewDetails={(q) => { setSelectedQuotationDetails(q); setShowQuotationDetailsModal(true); }}
                  onGeneratePDF={onDownloadQuotationPDF}
                  onApprove={handleApproveQuotation}
                  onCancel={handleCancelQuotation}
                  onConvertToSale={(q) => { setSelectedQuotation(q); setShowSaleModal(true); }}
                  onEdit={(q) => { setEditingQuotation(q); setQuotationItems(q.items || []); setShowQuotationModal(true); }}
                  onDelete={handleDeleteQuotation}
                  onSearchChange={setQuotationSearch}
                  onStatusFilterChange={setQuotationStatusFilter}
                  onExportReport={handleExportQuotations}
                  statusFilter={quotationStatusFilter}
                  onShowQr={() => setShowQrModal(true)}
                />
              )}
              {activeTab === "companies" && (
                <CompaniesTab 
                  companies={companyList} 
                  isViewer={isViewer}
                  onViewTransactions={(c) => { setSelectedCompany(c); setShowTransactionModal(true); }}
                  onEdit={(c) => { setEditingCompany(c); setShowCompanyModal(true); }} 
                  onDelete={handleDeleteCompany} 
                  onExportReport={handleExportCompanies}
                  includeZero={includeZeroBalance}
                  onIncludeZeroChange={setIncludeZeroBalance}
                  defaultCurrency={branding.default_currency}
                />
              )}
              {activeTab === "procurements" && (
                <ProcurementTab storeId={currentStoreId!} isViewer={isViewer} />
              )}
              {activeTab === "purchase_invoices" && !isPortfolio && (
                <PurchaseInvoices 
                  storeId={currentStoreId} 
                  role={user.role} 
                  lang={lang} 
                  api={api} 
                  branding={branding} 
                  onFetchDetails={handleFetchPurchaseInvoiceDetails}
                  products={products}
                  onEditProduct={(item: any) => {
                    const found = products.find((p: any) => p.id === item.product_id || p.barcode === item.barcode || (p.name && item.product_name && p.name.toLowerCase() === item.product_name.toLowerCase()));
                    if (found) {
                      setEditingProduct(found);
                    } else {
                      setEditingProduct({
                        name: item.product_name || item.name || '',
                        barcode: item.barcode || '',
                        cost_price: Number(item.unit_price) || 0,
                        price: Number(item.unit_price) * 1.2 || 0,
                        tax_rate: Number(item.tax_rate) || 20,
                        stock_quantity: Number(item.quantity) || 0
                      } as any);
                    }
                    setShowProductModal(true);
                  }}
                />
              )}
              {activeTab === "stock_transfer" && (
                <StockTransferTab 
                  storeId={currentStoreId!} 
                  products={products}
                  isViewer={isViewer} 
                  includeBranches={includeBranches}
                  onUpdate={fetchData}
                />
              )}
              {activeTab === "service" && (
                <ServiceTab 
                  storeId={currentStoreId!} 
                  isViewer={isViewer} 
                  products={products} 
                  role={user.role} 
                  onTabChange={(tab) => setActiveTab(tab)} 
                />
              )}
              {activeTab === "audit-logs" && (
                <AuditLogTab storeId={currentStoreId!} />
              )}
              {(activeTab === "settings" || activeTab === "settings_yedekleme") && (
                <SettingsTab 
                  branding={branding}
                  onBrandingChange={onBrandingChange}
                  onSaveBranding={handleSaveBranding}
                  onLogoUpload={(e) => handleFileUpload(e, 'logo')}
                  onFaviconUpload={(e) => handleFileUpload(e, 'favicon')}
                  onBannerUpload={(e) => handleFileUpload(e, 'banner')}
                  onAddUser={() => setShowUserModal(true)}
                  onDeleteUser={handleDeleteUser}
                  users={users}
                  currentUser={user}
                  currentStoreId={currentStoreId!}
                  products={products}
                  onRefresh={fetchData}
                  bulkPriceForm={bulkPriceForm}
                  setBulkPriceForm={setBulkPriceForm}
                  handleBulkPriceSubmit={handleBulkPriceSubmit}
                  initialSubTab={activeTab === "settings_yedekleme" ? "integrations" : undefined}
                  savingBranding={savingBranding}
                />
              )}
              {activeTab === "blog" && (
                <BlogTab 
                  storeId={currentStoreId!} 
                  storeName={branding?.store_name || branding?.name || ""} 
                  isTr={lang === 'tr'} 
                />
              )}
              {activeTab === "seo" && (
                <SEOTab storeId={currentStoreId!} />
              )}
              {activeTab === "meta" && (
                <MetaIntegrationTab />
              )}
              {activeTab === "google-merchant" && (
                <GoogleMerchantTab />
              )}
              {activeTab === "notifications" && (
                <PortfolioNotificationsTab analytics={analytics} />
              )}
              {activeTab === "website-generator" && (
                <PortfolioWebsiteGeneratorTab storeId={currentStoreId!} />
              )}
              {activeTab === "team-crm" && (
                <TeamCrmTab 
                  storeId={currentStoreId!} 
                  storeName={branding?.store_name || branding?.name || ""}
                  isAutomotive={isAutomotive} 
                  isRealEstate={isRealEstate}
                />
              )}
              {activeTab === "real_estate_crm" && (
                <RealEstateCrmTab 
                  contacts={contacts}
                  onSaveContact={saveContact}
                  onDeleteContact={deleteContact}
                />
              )}
              {activeTab === "radar_alerts" && (
                <RadarAlertsTab sector={branding?.sector || branding?.store_type} />
              )}
              {activeTab === "authority_transfer" && (
                <AuthorityTransferTab 
                  storeId={currentStoreId!} 
                  properties={properties} 
                  isViewer={isViewer} 
                  includeBranches={includeBranches} 
                  onUpdate={fetchData}
                />
              )}
              {activeTab === "portfolio_finances" && (
                <PortfolioFinancesTab 
                  storeId={currentStoreId!} 
                  isAutomotive={isAutomotive} 
                  isRealEstate={isRealEstate}
                />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>

      <DashboardModals 
        showQrModal={showQrModal}
        setShowQrModal={setShowQrModal}
        branding={branding}
        scanUrl={scanUrl}
        publicUrl={publicUrl}
        isPortfolio={isPortfolio}
        translations={t}
        handlePrintQR={handlePrintQR}
        qrPrintRef={qrPrintRef}
        showPurchaseInvoiceDetailsModal={showPurchaseInvoiceDetailsModal}
        setShowPurchaseInvoiceDetailsModal={setShowPurchaseInvoiceDetailsModal}
        selectedPurchaseInvoice={selectedPurchaseInvoice}
        lang={lang}
        showSaleDetailsModal={showSaleDetailsModal}
        setShowSaleDetailsModal={setShowSaleDetailsModal}
        selectedSale={selectedSale}
        handlePrint={handlePrint}
        shippingSlipRef={shippingSlipRef}
        
        showQuotationDetailsModal={showQuotationDetailsModal}
        setShowQuotationDetailsModal={setShowQuotationDetailsModal}
        selectedQuotationDetails={selectedQuotationDetails}
        onDownloadQuotationPDF={onDownloadQuotationPDF}
        numberToTurkishWords={numberToTurkishWords}
        quotationPrintRef={quotationPrintRef}
        
        showDailyReportModal={showDailyReportModal}
        setShowDailyReportModal={setShowDailyReportModal}
        dailyReportData={dailyReportData}
        reportStartDate={reportStartDate}
        setReportStartDate={setReportStartDate}
        reportEndDate={reportEndDate}
        setReportEndDate={setReportEndDate}
        fetchDailySalesReport={fetchDailySalesReport}
        reportLoading={reportLoading}
        handleDownloadDailyReportExcel={handleDownloadDailyReportExcel}
        
        showTransactionModal={showTransactionModal}
        setShowTransactionModal={setShowTransactionModal}
        selectedCompany={selectedCompany}
        companyTransactions={companyTransactions}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
        transactionStartDate={transactionStartDate}
        setTransactionStartDate={setTransactionStartDate}
        transactionEndDate={transactionEndDate}
        setTransactionEndDate={setTransactionEndDate}
        handleFetchTransactions={handleFetchTransactions}
        transactionLoading={transactionLoading}
        handleExportTransactionsPDF={handleExportTransactionsPDF}
        openingBalances={openingBalances}
        companies={companyList}
        
        setShowAddTransactionModal={setShowAddTransactionModal}
        handleEditTransaction={handleEditTransaction}
        handleDeleteTransaction={handleDeleteTransaction}
        
        showAddTransactionModal={showAddTransactionModal}
        newTransactionType={newTransactionType}
        setNewTransactionType={setNewTransactionType}
        newTransactionAmount={newTransactionAmount}
        setNewTransactionAmount={setNewTransactionAmount}
        newTransactionCurrency={newTransactionCurrency}
        setNewTransactionCurrency={setNewTransactionCurrency}
        newTransactionExchangeRate={newTransactionExchangeRate}
        setNewTransactionExchangeRate={setNewTransactionExchangeRate}
        newTransactionPaymentMethod={newTransactionPaymentMethod}
        setNewTransactionPaymentMethod={setNewTransactionPaymentMethod}
        newTransactionDescription={newTransactionDescription}
        setNewTransactionDescription={setNewTransactionDescription}
        newTransactionDate={newTransactionDate}
        setNewTransactionDate={setNewTransactionDate}
        handleAddTransaction={handleAddTransaction}
        
        showSaleModal={showSaleModal}
        setShowSaleModal={setShowSaleModal}
        selectedQuotation={selectedQuotation}
        handleConfirmSale={handleConfirmSale}
        isConfirmingSale={isConfirmingSale}
        dueDate={dueDate}
        setDueDate={setDueDate}
        saleNotes={saleNotes}
        setSaleNotes={setSaleNotes}
        createCompanyFromSale={createCompanyFromSale}
        setCreateCompanyFromSale={setCreateCompanyFromSale}
        
        showBulkPriceModal={showBulkPriceModal}
        setShowBulkPriceModal={setShowBulkPriceModal}
        bulkPriceForm={bulkPriceForm}
        setBulkPriceForm={setBulkPriceForm}
        handleBulkPriceSubmit={handleBulkPriceSubmit}
        products={products}

        // Missing Modals Props
        showProductModal={showProductModal}
        setShowProductModal={setShowProductModal}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        handleAddProduct={handleAddProduct}
        
        showCompanyModal={showCompanyModal}
        setShowCompanyModal={setShowCompanyModal}
        editingCompany={editingCompany}
        setEditingCompany={setEditingCompany}
        handleAddCompany={handleAddCompany}
        
        showUserModal={showUserModal}
        setShowUserModal={setShowUserModal}
        handleAddUser={handleAddUser}
        
        showQuotationModal={showQuotationModal}
        setShowQuotationModal={setShowQuotationModal}
        editingQuotation={editingQuotation}
        setEditingQuotation={setEditingQuotation}
        quotationItems={quotationItems}
        setQuotationItems={setQuotationItems}
        handleAddQuotation={handleAddQuotation}
        isTaxInclusive={isTaxInclusive}
        setIsTaxInclusive={setIsTaxInclusive}
        quotationNotes={quotationNotes}
        setQuotationNotes={setQuotationNotes}
        showQuickProductModal={showQuickProductModal}
        setShowQuickProductModal={setShowQuickProductModal}
        quickProductForm={quickProductForm}
        setQuickProductForm={setQuickProductForm}
        handleQuickAddProduct={handleQuickAddProduct}
        
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        isImporting={isImporting}
        importFile={importFile}
        importColumns={importColumns}
        mapping={mapping}
        setMapping={setMapping}
        convertCurrency={convertCurrency}
        setConvertCurrency={setConvertCurrency}
        handleFileSelect={handleFileSelect}
        handleImport={handleImport}
      />

      {/* Cafe/Restaurant Role Switcher Keypad Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                    {txt('Çalışan Oturumu & Rolü', 'Staff Session & Role', 'Συνεδρία Προσωπικού & Ρόλος')}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {txt('Terminal Yetkilendirme Modeli', 'Terminal Authorization Model', 'Μοντέλο Εξουσιοδότησης Τερματικού')}
                  </p>
                </div>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {!isEditingPins ? (
                  <>
                    {/* Role Selection Row */}
                    <div className="grid grid-cols-3 gap-2">
                      {(['manager', 'cashier', 'waiter'] as const).map((r) => {
                        const isSel = modalRole === r;
                        const label = r === 'manager' ? (txt('Yönetici', 'Manager', 'Διευθυντής')) : r === 'cashier' ? (txt('Kasiyer', 'Cashier', 'Ταμίας')) : (txt('Garson', 'Waiter', 'Σερβιτόρος'));
                        const emoji = r === 'manager' ? '👑' : r === 'cashier' ? '💳' : '🍽️';
                        return (
                          <button
                            key={r}
                            onClick={() => {
                              setModalRole(r);
                              setPinValue('');
                              setPinError(false);
                            }}
                            className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all font-bold text-xs ${
                              isSel
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-500'
                            }`}
                          >
                            <span className="text-xl">{emoji}</span>
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* PIN Input Dots Preview */}
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {txt('4 Haneli Giriş PIN Kodu', '4-Digit Entry PIN', '4-ψήφιο PIN Εισόδου')}
                      </p>
                      <div className="flex gap-4 justify-center py-2">
                        {Array.from({ length: 4 }).map((_, idx) => {
                          const hasChar = pinValue.length > idx;
                          return (
                            <motion.div
                              key={idx}
                              animate={pinError ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                              transition={{ duration: 0.4 }}
                              className={`w-4 h-4 rounded-full border-2 transition-all ${
                                hasChar
                                  ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-sm'
                                  : 'border-slate-300 bg-transparent'
                              }`}
                            />
                          );
                        })}
                      </div>
                      {pinError && (
                        <p className="text-xs font-black text-rose-500 uppercase tracking-wider animate-pulse">
                          {txt('Hatalı Şifre!', 'Incorrect PIN!', 'Λανθασμένο PIN!')}
                        </p>
                      )}
                    </div>

                    {/* Keypad Grid */}
                    <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto pb-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            if (pinValue.length < 4) {
                              setPinError(false);
                              const newVal = pinValue + num;
                              setPinValue(newVal);
                              
                              // Auto trigger verification on 4th digit
                              if (newVal.length === 4) {
                                handleVerifyRolePin(newVal);
                              }
                            }
                          }}
                          className="h-14 bg-slate-100 hover:bg-slate-200 active:scale-95 text-lg font-black text-slate-700 rounded-2xl transition-all flex items-center justify-center"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setPinValue('');
                          setPinError(false);
                        }}
                        className="h-14 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center"
                      >
                        {txt('TEMİZLE', 'CLEAR', 'ΚΑΘΑΡΙΣΜΟΣ')}
                      </button>
                      <button
                        onClick={() => {
                          if (pinValue.length < 4) {
                            setPinError(false);
                            const newVal = pinValue + '0';
                            setPinValue(newVal);
                            if (newVal.length === 4) {
                              handleVerifyRolePin(newVal);
                            }
                          }
                        }}
                        className="h-14 bg-slate-100 hover:bg-slate-200 active:scale-95 text-lg font-black text-slate-700 rounded-2xl transition-all flex items-center justify-center"
                      >
                        0
                      </button>
                      <button
                        onClick={() => handleVerifyRolePin(pinValue)}
                        className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center"
                      >
                        {txt('GİRİŞ', 'ENTER', 'ΕΙΣΟΔΟΣ')}
                      </button>
                    </div>

                    {/* Footer Controls / Pin customisation for manager */}
                    {activeStaffRole === 'manager' && (
                      <div className="pt-4 border-t border-slate-100 text-center">
                        <button
                          onClick={() => setIsEditingPins(true)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors"
                        >
                          ⚙️ {txt('PIN Kodlarını Güncelle', 'Update PIN Codes', 'Ενημέρωση Κωδικών PIN')}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Edit PINs Form (Only accessible to authenticated managers) */
                  <div className="space-y-4 py-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      {txt('YÖNETİCİ ŞİFRE AYARLARI', 'MANAGER PIN CONFIGURATION', 'ΡΥΘΜΙΣΕΙΣ PIN ΔΙΕΥΘΥΝΤΗ')}
                    </h4>
                    
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          👑 {txt('Yönetici PIN Kodu', 'Manager PIN', 'PIN Διευθυντή')}
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={managerPin}
                          onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-center tracking-[0.5em] text-slate-700 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          💳 {txt('Kasiyer PIN Kodu', 'Cashier PIN', 'PIN Ταμία')}
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cashierPin}
                          onChange={(e) => setCashierPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-center tracking-[0.5em] text-slate-700 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          🍽️ {txt('Garson PIN Kodu', 'Waiter PIN', 'PIN Σερβιτόρου')}
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={waiterPin}
                          onChange={(e) => setWaiterPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-center tracking-[0.5em] text-slate-700 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-2">
                      <button
                        onClick={() => setIsEditingPins(false)}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        {txt('Geri Dön', 'Go Back', 'Επιστροφή')}
                      </button>
                      <button
                        onClick={() => {
                          toast.success(txt('PIN kodları başarıyla kaydedildi!', 'PIN codes updated successfully!', 'Οι κωδικοί PIN ενημερώθηκαν επιτυχώς!'));
                          setIsEditingPins(false);
                        }}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        {txt('Değişiklikleri Kaydet', 'Save Changes', 'Αποθήκευση Αλλαγών')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
