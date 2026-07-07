import React, { useState, useEffect, useCallback, useRef, useTransition, useDeferredValue, Suspense } from "react";
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
  Trash2
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
import * as XLSX from 'xlsx';
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
const RealEstateWebsiteGeneratorTab = React.lazy(() => import("./RealEstateWebsiteGenerator").then(m => ({ default: m.RealEstateWebsiteGenerator })));
const AutomotiveWebsiteGeneratorTab = React.lazy(() => import("./AutomotiveWebsiteGenerator").then(m => ({ default: m.AutomotiveWebsiteGenerator })));
const TeamCrmTab = React.lazy(() => import("./TeamCrmTab").then(m => ({ default: m.TeamCrmTab })));
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
const EWaybillsTab = React.lazy(() => import("../../components/EWaybillsTab"));

import ShippingSlip from "../../components/ShippingSlip";

interface StoreDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StoreDashboard({ user, onLogout }: StoreDashboardProps) {
  const { slug } = useParams();
  const { lang } = useLanguage();
  const isTr = lang === 'tr';
  const [shipCarrier, setShipCarrier] = useState('');
  const [shipTrackingNumber, setShipTrackingNumber] = useState('');

  const t = translations[lang].dashboard;
  const {
    activeTab, setActiveTab,
    branding, setBranding
  } = useDashboardController(user);
  
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

  const { properties, loading: realEstateLoading, saveProperty, deleteProperty } = useRealEstate(currentStoreId);

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

  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
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
      
      let targetStoreId = user.store_id;
      
      if (user.role === 'superadmin') {
        if (slug) {
          const storeInfo = await api.getBranding(undefined, slug);
          if (storeInfo && storeInfo.id) {
            targetStoreId = storeInfo.id;
          } else if (storeInfo && storeInfo.error) {
            return;
          }
        } else {
          window.location.href = "/admin";
          return;
        }
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

      // Only fetch analytics on initial load if we're actually starting on analytics-heavy tabs
      if (activeTab === 'analytics' || activeTab === 'notifications') {
        requests.push(api.getAnalytics(targetStoreId));
      }

      const results = await Promise.all(requests);
      const [productsRes, brandingRes, usersRes, branchesRes, analyticsRes] = results;

      setProducts(Array.isArray(productsRes) ? productsRes : []);
      if (brandingRes && !brandingRes.error) setBranding(brandingRes);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setBranches(Array.isArray(branchesRes) ? branchesRes : []);
      
      if (analyticsRes && !analyticsRes.error) {
        setAnalytics(analyticsRes);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [includeBranches, user.role, user.store_id, slug]);

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

  const handleDownloadDailyReportExcel = () => {
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
    const interval = setInterval(fetchNotifications, 60000); 
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
    setBranding({ ...branding, [field]: value });
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

  const handleExportQuotations = () => {
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

  useEffect(() => {
    if (isPortfolio && (['products', 'pos', 'fast-pos', 'procurements', 'stock_transfer', 'service'].includes(activeTab))) {
      if (isAutomotive && !isRealEstate) {
        setActiveTab('fleet');
      } else {
        setActiveTab('real_estate');
      }
    }
  }, [isPortfolio, isAutomotive, isRealEstate, activeTab, setActiveTab]);

  const navItems = isPortfolio ? [
    { type: 'item', id: "system_cockpit", label: isTr ? "Kokpit" : "Cockpit", icon: LayoutDashboard },
    { type: 'category', key: "real_estate", title: isTr ? "Portföy & İlan" : "Portfolios & Listings", items: [
      ...(isRealEstate ? [{ id: "real_estate", label: isTr ? 'Gayrimenkul Portföyü' : 'Real Estate Portfolio', icon: Home }] : []),
      ...(isAutomotive ? [{ id: "fleet", label: isTr ? 'Oto Galeri / Araçlar' : 'Automotive / Vehicles', icon: Car, badge: notifications.fleet }] : []),
    ]},
    { type: 'category', key: "finance_operations", title: isTr ? "Finans & Operasyon" : "Finance & Operations", items: [
      ...(!isPortfolio ? [{ id: "purchase_invoices", label: t.purchase_invoices, icon: FileDown, badge: notifications.purchase_invoices }] : []),
      ...(!isPortfolio ? [{ id: "sales_invoices", label: t.sales_invoices, icon: FileText, badge: notifications.sales_invoices, badgeType: 'error' }] : []),
      ...(!isPortfolio ? [{ id: "e_waybills", label: isTr ? "e-İrsaliyeler" : "e-Waybills", icon: Truck }] : []),
      { id: "companies", label: t.companies, icon: Store },
      { id: "portfolio_finances", label: isTr ? 'Gelir & Gider / Kasa' : 'Finances & Cash Flow', icon: Wallet },
    ]},
    { type: 'category', key: "team", title: isTr ? "Personel & Şube" : "Staff & Branches", items: [
      { id: "team-crm", label: isTr ? "Personel & Şube Yönetimi" : "Staff & Branch CRM", icon: Users },
      ...(isRealEstate ? [{ id: "authority_transfer", label: isTr ? "Yetki Devri (Tapu)" : "Authority Transfer", icon: Briefcase }] : []),
    ]},
    { type: 'category', key: "integrations", title: isTr ? "Yedekleme & Kanallar" : "Backup & Channels", items: [
      { id: "meta", label: "Meta Entegrasyonu", icon: Facebook },
      { id: "settings_yedekleme", label: isTr ? "Yedekleme" : "Backup", icon: Database },
    ]},
    { type: 'category', key: "dashboard", title: isTr ? "İstatistik & Rapor" : "Analytics & Logs", items: [
      { id: "analytics", label: t.analytics, icon: BarChart3 },
      { id: "radar_alerts", label: isTr ? (isAutomotive ? "Motorlu Taşıtlar & Haber Radarı" : "İmar & Haber Radarı") : "Radar & Alerts", icon: Radar },
      { id: "notifications", label: isTr ? 'Bildirimler' : 'Notifications', icon: Bell },
      { id: "blog", label: isTr ? "Blog" : "Blog", icon: BookOpen },
      { id: "website-generator", label: isTr ? 'Web Sitesi Oluştur' : 'Website Generator', icon: Globe },
      { id: "audit-logs", label: t.auditLogs, icon: History },
    ]},
    { type: 'item', id: "settings", label: t.settings, icon: SettingsIcon }
  ] : [
    { type: 'item', id: "system_cockpit", label: isTr ? "Kokpit" : "Cockpit", icon: LayoutDashboard },
    { type: 'category', key: "operations", title: isTr ? "Operasyonlar" : "Operations", items: [
      { id: "products", label: t.products, icon: Package },
      { id: "purchase_invoices", label: t.purchase_invoices, icon: FileDown, badge: notifications.purchase_invoices },
      { id: "service", label: t.service, icon: Wrench, badge: notifications.service },
      { id: "fleet", label: isTr ? 'Filo Yönetimi' : 'Fleet Management', icon: Car, badge: notifications.fleet },
      { id: "procurements", label: t.procurements, icon: Truck },
      { id: "stock_transfer", label: t.stock_transfer, icon: ArrowLeftRight, badge: notifications.transfers },
    ]},
    { type: 'category', key: "sales", title: isTr ? "Finans" : "Finance", items: [
      { id: "quotations", label: t.quotations, icon: FileCheck },
      { id: "sales_invoices", label: t.sales_invoices, icon: FileText, badge: notifications.sales_invoices, badgeType: 'error' },
      { id: "e_waybills", label: isTr ? "e-İrsaliyeler" : "e-Waybills", icon: Truck },
      { id: "companies", label: t.companies, icon: Store },
      { id: "pos", label: t.pos, icon: CreditCard, badge: notifications.sales },
      { id: "fast-pos", label: t.fastPos, icon: Scan },
    ]},
    { type: 'category', key: "integrations", title: isTr ? "Yedekleme & Kanallar" : "Backup & Channels", items: [
      { id: "meta", label: "Meta Entegrasyonu", icon: Facebook },
      { id: "google-merchant", label: "Google Merchant", icon: ShoppingBag },
      { id: "settings_yedekleme", label: isTr ? "Yedekleme" : "Backup", icon: Database },
    ]},
    { type: 'category', key: "dashboard", title: isTr ? "İstatistik & Blog" : "Analytics & Blog", items: [
      { id: "analytics", label: t.analytics, icon: BarChart3 },
      { id: "notifications", label: isTr ? 'Bildirimler' : 'Notifications', icon: Bell },
      { id: "blog", label: isTr ? "Blog" : "Blog", icon: BookOpen },
      { id: "audit-logs", label: t.auditLogs, icon: History },
    ]},
    { type: 'item', id: "settings", label: t.settings, icon: SettingsIcon }
  ];

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
        onLogout,
        setShowQrModal,
        sidebarOpen,
        setSidebarOpen,
        desktopSidebarCollapsed,
        setDesktopSidebarCollapsed,
        translations: t,
        startTransition
      }}
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="h-10 w-1 bg-indigo-600 rounded-full" />
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {activeTab.replace(/_/g, ' ')}
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                Control_Center / {activeTab}
              </p>
            </div>
          </motion.div>
        </div>

        {['products', 'quotations', 'companies'].includes(activeTab) && (
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
              {activeTab === "products" && (
                <ProductsTab 
                  products={products}
                  loading={loading}
                  isViewer={isViewer}
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
                  onShowQr={() => setShowQrModal(true)}
                  branding={branding}
                  showStoreName={branding?.show_store_name}
                  currentStoreId={currentStoreId!}
                  includeBranches={includeBranches}
                  propertiesCount={properties.length}
                  onSwitchTab={(tab) => setActiveTab(tab)}
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
                  onDeleteSale={handleDeleteSale}
                  onExportReport={handleExportSales}
                  isViewer={isViewer}
                />
              )}
              {activeTab === "fast-pos" && (
                <FastPosTab 
                  branding={branding} 
                  onSaleComplete={handleSaleSuccess}
                  storeId={currentStoreId!} 
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
              {activeTab === "system_cockpit" && (
                <CockpitTab 
                  currentStoreId={currentStoreId!}
                  branding={branding}
                  user={user}
                  isPortfolio={isPortfolio}
                  onSwitchTab={(tab) => setActiveTab(tab)}
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
                isAutomotive ? (
                  <AutomotiveWebsiteGeneratorTab storeId={currentStoreId!} />
                ) : (
                  <RealEstateWebsiteGeneratorTab storeId={currentStoreId!} />
                )
              )}
              {activeTab === "team-crm" && (
                <TeamCrmTab 
                  storeId={currentStoreId!} 
                  isAutomotive={isAutomotive} 
                  isRealEstate={isRealEstate}
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
    </DashboardLayout>
  );
}
