import React, { useState, useEffect, useCallback, useRef, useTransition, useDeferredValue } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { 
  ArrowLeftRight,
  Bell,
  Car,
  ChevronDown,
  ChevronUp,
  LayoutDashboard, 
  Package, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus, 
  Search, 
  Trash2, 
  Upload, 
  Edit2, 
  ChevronRight, 
  AlertTriangle,
  TrendingUp,
  Scan,
  FileText,
  Download,
  CheckCircle2,
  Filter,
  Store,
  Clock,
  XCircle,
  CreditCard,
  Save,
  Globe,
  Palette,
  User as UserIcon,
  Lock,
  Smartphone,
  MapPin,
  Mail,
  Languages,
  Menu,
  X,
  Eye,
  FileDown,
  Printer,
  History,
  Share2,
  QrCode,
  Copy,
  Check,
  Activity,
  ImageIcon,
  Tag,
  Key,
  Loader2,
  Truck,
  Wrench,
  Building2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "../../translations";
import PurchaseInvoices from "../../components/PurchaseInvoices";
import SalesInvoices from "../../components/SalesInvoices";
import { useLanguage } from "../../contexts/LanguageContext";
import { useProducts } from "../../hooks/useProducts";
import { useQuotations } from "../../hooks/useQuotations";
import { useSales } from "../../hooks/useSales";
import { useCompanies } from "../../hooks/useCompanies";
import { api } from "../../services/api";
import { User, Product, Store as StoreType } from "../../types";
import Logo from "../../components/Logo";
import * as XLSX from 'xlsx';
import ErrorBoundary from "../../components/ErrorBoundary";
import { useReactToPrint } from 'react-to-print';

// Import Tabs
import ProductsTab from "./ProductsTab";
import AnalyticsTab from "./AnalyticsTab";
import QuotationsTab from "./QuotationsTab";
import CompaniesTab from "./CompaniesTab";
import PosTab from "./PosTab";
import FastPosTab from "../../components/FastPosTab";
import AuditLogTab from "../../components/AuditLogTab";
import SettingsTab from "./SettingsTab";
import { ProcurementTab } from "./ProcurementTab";
import { ServiceTab } from "./ServiceTab";
import StockTransferTab from "./StockTransferTab";
import FleetTab from "./FleetTab";
import ShippingSlip from "../../components/ShippingSlip";

interface StoreDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StoreDashboard({ user, onLogout }: StoreDashboardProps) {
  const { slug } = useParams();
  const { lang } = useLanguage();
  const isTr = lang === 'tr';

  const numberToTurkishWords = (number: number, currency: string = 'TRY') => {
    const units = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
    const tens = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Seksen", "Doksan"];
    const thousands = ["", "Bin", "Milyon", "Milyar", "Trilyon"];

    const convertThreeDigits = (n: number) => {
      let str = "";
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const u = n % 10;

      if (h > 0) {
        str += (h === 1 ? "" : units[h]) + "Yüz";
      }
      if (t > 0) {
        str += tens[t];
      }
      if (u > 0) {
        str += units[u];
      }
      return str;
    };

    if (number === 0) return "Sıfır";

    const parts = number.toFixed(2).split(".");
    const integerPart = parseInt(parts[0]);
    const decimalPart = parseInt(parts[1]);

    let result = "";
    let tempInteger = integerPart;
    let i = 0;

    if (tempInteger === 0) {
      result = "Sıfır";
    } else {
      while (tempInteger > 0) {
        const threeDigits = tempInteger % 1000;
        if (threeDigits > 0) {
          let partStr = convertThreeDigits(threeDigits);
          if (i === 1 && threeDigits === 1) partStr = ""; 
          result = partStr + thousands[i] + result;
        }
        tempInteger = Math.floor(tempInteger / 1000);
        i++;
      }
    }

    const currencyMap: { [key: string]: { main: string, sub: string } } = {
      'TRY': { main: 'TL', sub: 'Kr' },
      'USD': { main: 'USD', sub: 'Cent' },
      'EUR': { main: 'EUR', sub: 'Cent' }
    };

    const cur = currencyMap[currency] || { main: currency, sub: '' };
    result += cur.main;

    if (decimalPart > 0) {
      result += " " + convertThreeDigits(decimalPart) + " " + cur.sub;
    }

    return result;
  };

  const t = translations[lang].dashboard;
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(`storeDashboardTab_${user.store_id || 'admin'}`) || "products";
  });
  const [isPending, startTransition] = useTransition();

  const [includeBranches, setIncludeBranches] = useState(false);
  const [branding, setBranding] = useState<any>({
    name: "LookPrice",
    store_name: "LookPrice",
    primary_color: "#4f46e5",
    logo_url: "",
    favicon_url: "",
    default_currency: "TRY",
    default_language: "tr"
  });

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
    handleApplyTaxRule,
    handleBulkPriceSubmit,
    handleFileSelect,
    handleImport,
    handleExportProducts,
    handleBulkRecalculatePrice2,
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
    fetchQuotations,
    handleQuickAddProduct,
    handleAddQuotation,
    handleApproveQuotation,
    handleCancelQuotation,
    handleDeleteQuotation
  } = useQuotations(currentStoreId, fetchProductsData, branding, lang);

  const deferredQuotationProductSearch = useDeferredValue(quotationProductSearch);

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
    handleExportTransactionsPDF,
    handleAddTransaction
  } = useCompanies(user, currentStoreId, lang, branding);

  useEffect(() => {
    localStorage.setItem(`storeDashboardTab_${user.store_id || 'admin'}`, activeTab);
  }, [activeTab, user.store_id]);
  const [analytics, setAnalytics] = useState<any>(null);
  const shippingSlipRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: shippingSlipRef });
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState<any>(null);
  const [showPurchaseInvoiceDetailsModal, setShowPurchaseInvoiceDetailsModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  const [dailyReportData, setDailyReportData] = useState<{ summary: any[], details: any[] }>({ summary: [], details: [] });
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportLoading, setReportLoading] = useState(false);

  const isViewer = user.role === 'viewer';
  const effectiveSlug = branding.parent_slug || slug;
  const publicUrl = `${window.location.origin}/s/${effectiveSlug}`;
  const scanUrl = `${window.location.origin}/scan/${effectiveSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      let targetStoreId = user.store_id;
      
      // If superadmin and slug is provided, we need to find the store ID first
      if (user.role === 'superadmin') {
        if (slug) {
          const storeInfo = await api.getBranding(undefined, slug);
          if (storeInfo && storeInfo.id) {
            targetStoreId = storeInfo.id;
          } else if (storeInfo && storeInfo.error) {
            console.error("Store branding error:", storeInfo.error);
            // Maybe redirect to admin if store not found
            return;
          }
        } else {
          // Superadmin on /dashboard without slug - redirect to admin
          window.location.href = "/admin";
          return;
        }
      }
      
      if (targetStoreId === undefined || targetStoreId === null) {
        console.error("No target store ID found");
        setLoading(false);
        return;
      }
      
      // setCurrentStoreId(targetStoreId); // This is now handled in useProducts

      const [productsRes, analyticsRes, brandingRes, usersRes] = await Promise.all([
        api.getProducts("", targetStoreId, includeBranches),
        api.getAnalytics(targetStoreId),
        api.getBranding(targetStoreId),
        api.getUsers(targetStoreId)
      ]);
      setProducts(Array.isArray(productsRes) ? productsRes : []);
      setAnalytics(analyticsRes && !analyticsRes.error ? analyticsRes : null);
      if (brandingRes && !brandingRes.error) setBranding(brandingRes);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
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
    fleet: 0
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
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [fetchData, fetchNotifications]);

  useEffect(() => {
    if (currentStoreId) {
      fetchQuotations();
      fetchCompanies();
    }
  }, [fetchQuotations, fetchCompanies, currentStoreId]);

  useEffect(() => {
    if (activeTab === 'pos') {
      fetchSales();
    }
  }, [activeTab, fetchSales]);

  const handleSaveBranding = async () => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    try {
      await api.updateBranding(branding, targetStoreId);
      alert(t.saveSuccess || (lang === 'tr' ? "Başarıyla kaydedildi" : "Saved successfully"));
    } catch (error) {
      alert("Hata oluştu");
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
      setBranding({ ...branding, [urlField]: res.url });
    } catch (error) {
      alert("Yükleme hatası");
    }
  };


  const quotationPrintRef = useRef<HTMLDivElement>(null);
  const handleDownloadQuotationPDF = async (quotation: any) => {
    const doc = new jsPDF();
    const isTr = lang === 'tr';
    
    const fixTr = (text: string) => {
      if (!text) return "";
      return text
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
    };

    // Helper to convert image URL to base64 for jsPDF
    const getBase64Image = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });
    };

    let logoBase64 = "";
    if (branding.logo_url) {
      try {
        logoBase64 = await getBase64Image(branding.logo_url);
      } catch (e) {
        console.error("Logo loading error for PDF:", e);
      }
    }

    const addHeader = (doc: jsPDF) => {
      // Logo (if exists) - Top Left
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', 14, 8, 15, 15);
        } catch (e) {
          console.error("Logo addImage error:", e);
        }
      }
      
      doc.setTextColor(0, 0, 0);
      
      // Title - Top Center
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(fixTr(isTr ? "TEKLİF FORMU" : "QUOTATION FORM"), 105, 12, { align: 'center' });
      
      // Store Name - Below Title
      doc.setFontSize(10);
      const storeName = fixTr(branding.store_name || branding.name || "LookPrice");
      const splitStoreName = doc.splitTextToSize(storeName, 100);
      doc.text(splitStoreName, 105, 18, { align: 'center' });
      
      // Quotation Info - Top Right
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(fixTr(`${isTr ? "Teklif No" : "Quotation No"}: #${quotation.id}`), 196, 12, { align: 'right' });
      doc.text(fixTr(`${isTr ? "Tarih" : "Date"}: ${new Date(quotation.created_at).toLocaleDateString('tr-TR')}`), 196, 17, { align: 'right' });

      // Contact Info - Small below store name
      doc.setFontSize(7);
      const contactInfo = [
        branding.address,
        branding.phone,
        branding.email
      ].filter(Boolean).map(fixTr).join(" | ");
      if (contactInfo) {
        doc.text(contactInfo, 105, 25, { align: 'center' });
      }
      
      // Separator Line
      doc.setDrawColor(230);
      doc.line(14, 28, 196, 28);
    };

    const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(fixTr(`${branding.store_name || branding.name || "LookPrice"} - ${isTr ? "Teklif Formu" : "Quotation Form"}`), 14, 290);
      doc.text(`${pageNumber} / ${totalPages}`, 196, 290, { align: 'right' });
    };

    addHeader(doc);
    let yPos = 35;

    // Customer Info Box - More compact
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, yPos, 182, 18, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(fixTr(isTr ? "Müşteri Bilgileri" : "Customer Information"), 18, yPos + 6);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const customerInfo = [quotation.customer_name, quotation.customer_title].filter(Boolean).join(" - ");
    doc.text(fixTr(customerInfo), 18, yPos + 12);
    yPos += 25;

    const tableData = (quotation.items || []).map((item: any) => [
      fixTr(`${item.product_name}\n(${item.barcode || `#${item.product_id}`})`),
      item.quantity,
      `${Number(item.unit_price).toLocaleString('tr-TR')} ${quotation.currency?.slice(0, 3)}`,
      `${Number(item.total_price).toLocaleString('tr-TR')} ${quotation.currency?.slice(0, 3)}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [[
        fixTr(isTr ? "Ürün Açıklaması" : "Product Description"), 
        fixTr(isTr ? "Miktar" : "Qty"), 
        fixTr(isTr ? "Birim Fiyat" : "Unit Price"), 
        fixTr(isTr ? "Toplam" : "Total")
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      styles: { fontSize: 6, cellPadding: 1.5, font: "helvetica" },
      columnStyles: {
        1: { halign: 'center', cellWidth: 12 },
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 25 }
      },
      margin: { left: 14, right: 14, top: 30, bottom: 15 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addHeader(doc);
        }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 5;
    
    // Check if summary fits on page
    if (finalY > 260) {
      doc.addPage();
      addHeader(doc);
      finalY = 35;
    }

    // Summary Section
    doc.setDrawColor(230);
    doc.line(130, finalY, 196, finalY);
    finalY += 5;
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(fixTr(isTr ? "Ara Toplam" : "Subtotal"), 130, finalY);
    doc.text(`${Number(quotation.total_amount).toLocaleString('tr-TR')} ${quotation.currency?.slice(0, 3)}`, 196, finalY, { align: 'right' });
    
    finalY += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(fixTr(isTr ? "GENEL TOPLAM" : "GRAND TOTAL"), 130, finalY);
    doc.text(`${Number(quotation.total_amount).toLocaleString('tr-TR')} ${quotation.currency?.slice(0, 3)}`, 196, finalY, { align: 'right' });

    // Notes Section
    if (quotation.notes) {
      finalY += 10;
      if (finalY > 270) {
        doc.addPage();
        addHeader(doc);
        finalY = 35;
      }
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50);
      doc.text(fixTr(isTr ? "Notlar / Açıklamalar:" : "Notes / Descriptions:"), 14, finalY);
      finalY += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100);
      const splitNotes = doc.splitTextToSize(fixTr(quotation.notes), 182);
      doc.text(splitNotes, 14, finalY);
    }

    // Add page numbers to all pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(doc, i, totalPages);
    }

    doc.save(`Quotation_${quotation.id}.pdf`);
  };

  const handlePrintQuotation = useReactToPrint({
    contentRef: quotationPrintRef,
  });

  // Handlers for Users



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
      const res = await api.get(`/api/store/purchase-invoices/${id}${currentStoreId ? `?storeId=${currentStoreId}` : ''}`);
      setSelectedPurchaseInvoice(res);
      setShowPurchaseInvoiceDetailsModal(true);
    } catch (error) {
      console.error("Fetch purchase invoice details error:", error);
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

  const navItems = [
    { id: "products", label: t.products, icon: Package },
    { id: "analytics", label: t.analytics, icon: LayoutDashboard },
    { id: "quotations", label: t.quotations, icon: FileText, badge: notifications.quotations },
    { id: "procurements", label: t.procurements, icon: Truck },
    { id: "service", label: t.service, icon: Wrench, badge: notifications.service },
    { id: "stock_transfer", label: t.stock_transfer, icon: ArrowLeftRight, badge: notifications.transfers },
    { id: "purchase_invoices", label: t.purchase_invoices, icon: FileDown },
    { id: "sales_invoices", label: t.sales_invoices, icon: FileText },
    { id: "companies", label: t.companies, icon: Store },
    { id: "fleet", label: t.fleet, icon: Car, badge: notifications.fleet },
    { id: "pos", label: t.pos, icon: CreditCard, badge: notifications.sales },
    { id: "fast-pos", label: t.fastPos, icon: Scan },
    { id: "audit-logs", label: t.auditLogs, icon: History },
    { id: "settings", label: t.settings, icon: SettingsIcon },
  ];
  console.log("navItems:", navItems);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Zebra/Barcode Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none overflow-hidden select-none flex flex-wrap gap-8 p-8">
        {Array.from({ length: 150 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center rotate-12">
            <div className="w-16 h-1 bg-slate-900 mb-0.5" />
            <div className="w-16 h-2 bg-slate-900 mb-0.5" />
            <div className="w-16 h-0.5 bg-slate-900 mb-0.5" />
            <div className="w-16 h-3 bg-slate-900 mb-0.5" />
            <div className="text-[10px] font-mono mt-1 text-slate-900">LOOKPRICE BARCODE</div>
          </div>
        ))}
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Modern Rail */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <Logo size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  {branding.name || branding.store_name || "LookPrice"}
                </h1>
                {branding.parent_id ? (
                  <div className="flex items-center space-x-1 mt-1">
                    <Building2 className="h-2.5 w-2.5 text-indigo-600" />
                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">
                      {branding.parent_name || branding.parent_slug}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">System v4.2.0</p>
                )}
              </div>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 mb-2">Core Modules</div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  startTransition(() => {
                    setActiveTab(item.id);
                  });
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`h-4 w-4 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 mb-2">Public Access</div>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
                <span className="tracking-tight">{t.storeWebsite}</span>
              </a>
              <a
                href={scanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
              >
                <Scan className="h-4 w-4" />
                <span className="tracking-tight">{t.barcodeScanner}</span>
              </a>
            </div>
          </nav>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="bg-white rounded-xl p-4 mb-4 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Operational Status</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">All Systems Nominal</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all duration-200 border border-rose-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="uppercase tracking-wider">{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Sidebar Toggle (Floating) */}
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-300 active:scale-95 transition-all"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Analytical Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-6 md:mb-10 pb-6 md:pb-8 border-b border-slate-200">
              <div className="space-y-2 md:space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  <span>{lang === 'tr' ? 'MODÜL' : 'MODULE'}: {t[activeTab as keyof typeof t] || activeTab}</span>
                </div>
                <div className="flex items-center justify-between w-full md:block">
                  <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
                    {t[activeTab as keyof typeof t] || activeTab}
                  </h3>
                  
                  {/* Mobile Notification Center (Visible only on mobile) */}
                  <div className="flex md:hidden items-center space-x-2">
                    {(notifications.transfers + notifications.service + notifications.quotations + notifications.sales) > 0 && (
                      <div className="relative p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <Bell className="h-4 w-4 text-slate-400" />
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="hidden md:block text-sm text-slate-500 max-w-2xl leading-relaxed font-medium opacity-70">
                  {t.modulePrefix} {t.moduleDescriptions[activeTab as keyof typeof t.moduleDescriptions] || activeTab} {t.moduleDescSuffix}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {activeTab === 'products' && (
                  <>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                      <label className="flex items-center cursor-pointer gap-2">
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={includeBranches}
                            onChange={() => setIncludeBranches(!includeBranches)}
                          />
                          <div className="w-8 h-4 md:w-9 md:h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 md:after:h-4 md:after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-slate-600 whitespace-nowrap uppercase tracking-wider">
                          {t.allBranches}
                        </span>
                      </label>
                    </div>
                    <button onClick={() => setShowImportModal(true)} className="flex items-center space-x-2 px-3 md:px-4 py-2 md:py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-[10px] md:text-sm hover:bg-slate-50 transition-all shadow-sm uppercase tracking-wider">
                      <Upload className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      <span className="hidden xs:inline">{t.import}</span>
                    </button>
                    <button onClick={() => { setEditingProduct(null); setShowProductModal(true); }} className="flex items-center space-x-2 px-3 md:px-4 py-2 md:py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[10px] md:text-sm hover:bg-indigo-600 transition-all shadow-lg uppercase tracking-wider">
                      <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      <span>{t.addEntry}</span>
                    </button>
                  </>
                )}
                {activeTab === 'quotations' && (
                  <button onClick={() => { setEditingQuotation(null); setQuotationItems([]); setShowQuotationModal(true); }} className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg uppercase tracking-wider">
                    <Plus className="h-4 w-4" />
                    <span>{t.newQuotation}</span>
                  </button>
                )}
                {activeTab === 'companies' && (
                  <button onClick={() => { setEditingCompany(null); setShowCompanyModal(true); }} className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg uppercase tracking-wider">
                    <Plus className="h-4 w-4" />
                    <span>{t.registerCompany}</span>
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`transition-opacity duration-200 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
              >
                <ErrorBoundary lang={lang}>
                  {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 tech-grid">
                    <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="tech-label">Synchronizing_Data...</p>
                  </div>
                ) : (
                  <>
                    {activeTab === "products" && (
                      <ProductsTab 
                        products={products}
                        loading={loading}
                        isViewer={isViewer}
                        onDeleteAll={handleDeleteAllProducts}
                        onEdit={(p) => { setEditingProduct(p); setShowProductModal(true); }}
                        onDelete={handleDeleteProduct}
                        onExportReport={handleExportProducts}
                        onApplyTaxRule={handleApplyTaxRule}
                        onBulkPriceUpdate={() => setShowBulkPriceModal(true)}
                        onBulkRecalculatePrice2={handleBulkRecalculatePrice2}
                        onShowQr={() => setShowQrModal(true)}
                        branding={branding}
                        showStoreName={includeBranches}
                      />
                    )}
                    {activeTab === "analytics" && (
                      <AnalyticsTab analytics={analytics} branding={branding} />
                    )}
                    {activeTab === "quotations" && (
                      <QuotationsTab 
                        quotations={quotationList}
                        isViewer={isViewer}
                        onViewDetails={(q) => { setSelectedQuotationDetails(q); setShowQuotationDetailsModal(true); }}
                        onGeneratePDF={(q) => handleDownloadQuotationPDF(q)}
                        onApprove={handleApproveQuotation}
                        onCancel={handleCancelQuotation}
                        onConvertToSale={handleConvertToSale}
                        onEdit={(q) => { 
                          setEditingQuotation(q); 
                          setQuotationItems((q.items || []).map((item: any) => ({
                            ...item,
                            unit_price: Number(item.unit_price),
                            total_price: Number(item.total_price),
                            tax_rate: Math.round(Number(item.tax_rate) || 0)
                          }))); 
                          setShowQuotationModal(true); 
                        }}
                        onDelete={handleDeleteQuotation}
                        onSearchChange={setQuotationSearch}
                        onStatusFilterChange={setQuotationStatusFilter}
                        onExportReport={handleExportQuotations}
                        statusFilter={quotationStatusFilter}
                        onShowQr={() => setShowQrModal(true)}
                      />
                    )}
                    {activeTab === "purchase_invoices" && (
                      <PurchaseInvoices 
                        storeId={currentStoreId} 
                        role={user?.role} 
                        lang={lang} 
                        api={api} 
                        branding={branding}
                        onSave={fetchData}
                      />
                    )}
                    {activeTab === "sales_invoices" && (
                      <SalesInvoices 
                        storeId={currentStoreId} 
                        role={user?.role} 
                        lang={lang} 
                        api={api} 
                        branding={branding}
                        onSave={fetchData}
                      />
                    )}
                    {activeTab === "procurements" && (
                      <ProcurementTab 
                        storeId={currentStoreId}
                        isViewer={isViewer}
                      />
                    )}
                    {activeTab === "service" && (
                      <ServiceTab 
                        storeId={currentStoreId}
                        isViewer={isViewer}
                        products={products}
                        onTabChange={setActiveTab}
                      />
                    )}
                    {activeTab === "stock_transfer" && (
                      <StockTransferTab 
                        storeId={currentStoreId!}
                        products={products}
                        isViewer={isViewer}
                        includeBranches={includeBranches}
                        onUpdate={fetchNotifications}
                      />
                    )}
                    {activeTab === "fleet" && (
                      <FleetTab 
                        storeId={currentStoreId!}
                        isViewer={isViewer}
                      />
                    )}
                    {activeTab === "companies" && (
                      <CompaniesTab 
                        companies={companies}
                        isViewer={isViewer}
                        onViewTransactions={(c) => { setSelectedCompany(c); setShowTransactionModal(true); handleFetchTransactions(c.id); }}
                        onEdit={(c) => { setEditingCompany(c); setShowCompanyModal(true); }}
                        onDelete={handleDeleteCompany}
                        onExportReport={handleExportCompanies}
                        includeZero={includeZeroBalance}
                        onIncludeZeroChange={setIncludeZeroBalance}
                      />
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
                        onExportReport={() => { setShowDailyReportModal(true); fetchDailySalesReport(); }}
                      />
                    )}
                    {activeTab === "fast-pos" && (
                      <FastPosTab 
                        storeId={currentStoreId} 
                        onSaleComplete={fetchSales}
                        branding={branding}
                      />
                    )}
                    {activeTab === "audit-logs" && (
                      <AuditLogTab 
                        storeId={currentStoreId} 
                      />
                    )}
                    {activeTab === "settings" && (
                      <SettingsTab 
                        branding={branding}
                        onBrandingChange={(field, value) => setBranding({ ...branding, [field]: value })}
                        onSaveBranding={handleSaveBranding}
                        onLogoUpload={(e) => handleFileUpload(e, 'logo')}
                        onFaviconUpload={(e) => handleFileUpload(e, 'favicon')}
                        onBannerUpload={(e) => handleFileUpload(e, 'banner')}
                        onAddUser={() => setShowUserModal(true)}
                        onDeleteUser={handleDeleteUser}
                        users={users}
                        currentUser={user}
                        currentStoreId={currentStoreId}
                      />
                    )}
                  </>
                )}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>

      {/* Modals */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="flex justify-between items-center mb-8">
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-gray-900">{t.storeQR}</h3>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">{t.shareWithCustomers}</p>
                  </div>
                  <button onClick={() => setShowQrModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
                    <X className="h-6 w-6 text-gray-400" />
                  </button>
                </div>

                <div className="bg-gray-50 p-8 rounded-[2rem] inline-block mb-8 shadow-inner border border-gray-100">
                  <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <QRCodeSVG 
                      value={publicUrl}
                      size={200}
                      level="H"
                      includeMargin={true}
                      imageSettings={{
                        src: branding.logo_url || "",
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t.website?.toUpperCase() || 'WEBSITE'}</p>
                    <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <Globe className="h-5 w-5 text-indigo-500 shrink-0" />
                      <a 
                        href={publicUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-indigo-600 hover:underline truncate flex-1 text-left"
                      >
                        {publicUrl}
                      </a>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(publicUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"
                      >
                        {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t.barcodeScanner?.toUpperCase()}</p>
                    <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <Scan className="h-5 w-5 text-slate-500 shrink-0" />
                      <a 
                        href={scanUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-slate-600 hover:underline truncate flex-1 text-left"
                      >
                        {scanUrl}
                      </a>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(scanUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"
                      >
                        {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center justify-center space-x-2 p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <Printer className="h-5 w-5" />
                      <span>{t.print}</span>
                    </button>
                    <button 
                      onClick={() => {
                        const svg = document.querySelector('svg');
                        if (svg) {
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const canvas = document.createElement("canvas");
                          const ctx = canvas.getContext("2d");
                          const img = new Image();
                          img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx?.drawImage(img, 0, 0);
                            const pngFile = canvas.toDataURL("image/png");
                            const downloadLink = document.createElement("a");
                            downloadLink.download = "Store_QR.png";
                            downloadLink.href = pngFile;
                            downloadLink.click();
                          };
                          img.src = "data:image/svg+xml;base64," + btoa(svgData);
                        }
                      }}
                      className="flex items-center justify-center space-x-2 p-4 bg-indigo-600 rounded-2xl font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      <Download className="h-5 w-5" />
                      <span>{t.download}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showPurchaseInvoiceDetailsModal && selectedPurchaseInvoice && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{t.purchaseInvoiceDetails}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">#{selectedPurchaseInvoice.invoice_number}</p>
                </div>
                <button onClick={() => setShowPurchaseInvoiceDetailsModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t.invoiceDate}</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(selectedPurchaseInvoice.invoice_date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t.paymentMethod}</p>
                    <p className="text-sm font-bold text-gray-900 uppercase">{selectedPurchaseInvoice.payment_method || '-'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">{t.items}</p>
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.productName}</th>
                          <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.quantity}</th>
                          <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.unitPrice}</th>
                          <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.total}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(selectedPurchaseInvoice.items || []).map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-3 px-4 text-xs font-bold text-gray-700">{item.product_name}</td>
                            <td className="py-3 px-4 text-xs font-bold text-gray-700 text-right">{item.quantity}</td>
                            <td className="py-3 px-4 text-xs font-bold text-gray-700 text-right">{Number(item.unit_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}</td>
                            <td className="py-3 px-4 text-xs font-black text-gray-900 text-right">{Number(item.total_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold opacity-80 uppercase tracking-widest">{t.grandTotal?.toUpperCase() || 'GRAND TOTAL'}</span>
                    <span className="text-xl font-black">{Number(selectedPurchaseInvoice.grand_total).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedPurchaseInvoice.currency?.slice(0, 3)}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <button 
                  onClick={() => setShowPurchaseInvoiceDetailsModal(false)}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {t.close || 'Kapat'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSaleDetailsModal && selectedSale && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{t.saleDetails}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                    #{selectedSale.id} • {new Date(selectedSale.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePrint()} className="p-2 hover:bg-gray-200 rounded-full transition-colors" title={t.printShippingSlip}>
                    <Printer className="h-5 w-5 text-gray-400" />
                  </button>
                  <button onClick={() => setShowSaleDetailsModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div style={{ display: 'none' }}>
                  <ShippingSlip ref={shippingSlipRef} sale={selectedSale} store={branding} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.customer}</p>
                    <p className="font-bold text-gray-900 truncate">{selectedSale.customer_name || "-"}</p>
                    {selectedSale.customer_phone && (
                      <p className="text-xs text-gray-500 mt-1 font-medium">{selectedSale.customer_phone}</p>
                    )}
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t.amount}</p>
                    <p className="text-xl font-black text-indigo-600">{Number(selectedSale.total_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedSale.currency?.substring(0, 3)}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{t.paymentMethod}</p>
                    <p className="font-bold text-emerald-600 uppercase text-xs">
                      {selectedSale.payment_method === 'cash' ? t.cash :
                       selectedSale.payment_method === 'credit_card' ? t.credit_card :
                       selectedSale.payment_method === 'bank' ? t.bank :
                       selectedSale.payment_method === 'term' ? t.term :
                       selectedSale.payment_method || '-'}
                    </p>
                  </div>
                </div>

                {selectedSale.customer_address && (
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.deliveryAddress?.toUpperCase() || 'DELIVERY ADDRESS'}</p>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{selectedSale.customer_address}</p>
                  </div>
                )}

                {selectedSale.notes && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{t.notes || 'Notlar'}</p>
                    <p className="text-sm text-amber-900 font-medium leading-relaxed">{selectedSale.notes}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.items || 'Ürünler'}</h4>
                  
                  {/* Desktop Table View */}
                  <div className="hidden md:block border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 font-bold text-gray-600">{t.productName}</th>
                          <th className="px-4 py-2 font-bold text-gray-600 text-center">{t.quantity}</th>
                          <th className="px-4 py-2 font-bold text-gray-600 text-right">{t.total}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedSale.items?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-gray-900">
                              <div className="font-bold">{item.product_name}</div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                {item.barcode ? item.barcode.toString().padStart(13, '0').slice(-13) : `#${item.product_id}`}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {selectedSale.status === 'pending' ? (
                                <input 
                                  type="text" 
                                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center font-bold"
                                  value={item.quantity === 0 ? '' : item.quantity}
                                  onChange={(e) => handleUpdateSaleItem(idx, 'quantity', e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                />
                              ) : (
                                <span className="text-gray-600">{item.quantity}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {selectedSale.status === 'pending' ? (
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="text" 
                                      className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-right font-bold text-indigo-600"
                                      value={item.unit_price === 0 ? '' : item.unit_price}
                                      onChange={(e) => handleUpdateSaleItem(idx, 'unit_price', e.target.value)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                    <span className="text-[10px] font-bold text-gray-400">{item.currency?.slice(0, 3) || selectedSale.currency?.slice(0, 3)}</span>
                                  </div>
                                  <div className="text-[10px] font-black text-gray-900">
                                    {t.total}: {Number(item.total_price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.currency?.slice(0, 3) || selectedSale.currency?.slice(0, 3)}
                                  </div>
                                  <button 
                                    onClick={() => handleRemoveSaleItem(idx)}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="font-bold text-gray-900">{Number(item.total_price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.currency?.slice(0, 3) || selectedSale.currency?.slice(0, 3)}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile List View */}
                  <div className="md:hidden space-y-3">
                    {selectedSale.items?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-gray-900 leading-tight">{item.product_name}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                              {item.barcode ? item.barcode.toString().padStart(13, '0').slice(-13) : `#${item.product_id}`}
                            </div>
                          </div>
                          {selectedSale.status === 'pending' && (
                            <button 
                              onClick={() => handleRemoveSaleItem(idx)}
                              className="p-2 bg-rose-50 text-rose-500 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.quantity}</span>
                            {selectedSale.status === 'pending' ? (
                              <input 
                                type="text" 
                                className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-center font-bold text-sm"
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => handleUpdateSaleItem(idx, 'quantity', e.target.value)}
                                onFocus={(e) => e.target.select()}
                              />
                            ) : (
                              <span className="font-bold text-gray-900">{item.quantity}</span>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.total}</span>
                            {selectedSale.status === 'pending' ? (
                              <div className="flex items-center gap-1">
                                <input 
                                  type="text" 
                                  className="w-24 px-2 py-1 bg-white border border-gray-200 rounded-lg text-right font-bold text-sm text-indigo-600"
                                  value={item.unit_price === 0 ? '' : item.unit_price}
                                  onChange={(e) => handleUpdateSaleItem(idx, 'unit_price', e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                />
                                <span className="text-[10px] font-bold text-gray-400">{item.currency?.slice(0, 3) || selectedSale.currency?.slice(0, 3)}</span>
                              </div>
                            ) : (
                              <span className="font-bold text-gray-900">{Number(item.total_price).toLocaleString('tr-TR')} {item.currency?.slice(0, 3) || selectedSale.currency?.slice(0, 3)}</span>
                            )}
                          </div>
                        </div>
                        {selectedSale.status === 'pending' && (
                          <div className="text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            {t.total}: {Number(item.total_price).toLocaleString('tr-TR')} {item.currency?.slice(0, 3) || selectedSale.currency?.slice(0, 3)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Removed duplicate notes block */}

                {selectedSale.status === 'pending' && !isViewer && (
                  <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{t.paymentMethod}</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {[
                        { id: 'cash', label: t.cash, icon: "💵" },
                        { id: 'credit_card', label: t.credit_card, icon: "💳" },
                        { id: 'bank', label: t.bank, icon: "🏦" }
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setPosPaymentMethod(method.id as any)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all whitespace-nowrap flex-1 justify-center ${
                            posPaymentMethod === method.id 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                              : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-base">{method.icon}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                {selectedSale.status === 'pending' && !isViewer ? (
                  <>
                    <button 
                      onClick={() => handleCancelPendingSale(selectedSale.id)}
                      disabled={completingSale}
                      className="p-4 bg-white border border-rose-200 text-rose-600 rounded-2xl hover:bg-rose-50 transition-all disabled:opacity-50 shadow-sm"
                      title={t.cancelOrder || 'İptal Et'}
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                    <button 
                      onClick={() => handleCompletePendingSale(selectedSale.id)}
                      disabled={completingSale}
                      className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                    >
                      {completingSale ? (
                        <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-6 w-6" />
                          <span className="hidden sm:inline">{t.completeSale || 'Tamamla'}</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => window.print()}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                      <Printer className="h-5 w-5" /> {lang === 'tr' ? 'Yazdır' : 'Print'}
                    </button>
                    <button 
                      onClick={() => setShowSaleDetailsModal(false)}
                      className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      {t.close || 'Kapat'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showQuotationDetailsModal && selectedQuotationDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-auto overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900">{t.quotationDetails || "Teklif Detayları"}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDownloadQuotationPDF(selectedQuotationDetails)} 
                    className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 flex items-center gap-2 text-sm font-bold"
                  >
                    <Download className="h-4 w-4" />
                    {isTr ? 'İndir' : 'Download'}
                  </button>
                  <button 
                    onClick={() => setShowQuotationDetailsModal(false)} 
                    className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-[75vh] overflow-y-auto" ref={quotationPrintRef}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t.customer || "Müşteri"}</p>
                    <p className="text-lg font-bold text-slate-900">{selectedQuotationDetails.customer_name}</p>
                    {selectedQuotationDetails.customer_title && <p className="text-sm text-slate-500">{selectedQuotationDetails.customer_title}</p>}
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isTr ? 'Teklif Bilgileri' : 'Quotation Info'}</p>
                    <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Teklif No:' : 'Quote No:'}</span> #{selectedQuotationDetails.id}</p>
                    <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Tarih:' : 'Date:'}</span> {new Date(selectedQuotationDetails.created_at).toLocaleDateString('tr-TR')}</p>
                    <p className="text-sm text-slate-600">
                      <span className="font-bold">{t.validUntil || "Geçerlilik"}:</span> {
                        selectedQuotationDetails.expiry_date 
                          ? new Date(selectedQuotationDetails.expiry_date).toLocaleDateString('tr-TR')
                          : new Date(new Date(selectedQuotationDetails.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')
                      }
                    </p>
                    <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Para Birimi:' : 'Currency:'}</span> {selectedQuotationDetails.currency}</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t.product || "Ürün"}</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">{t.quantity || "Miktar"}</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">{t.unitPrice || "Birim Fiyat"}</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">{t.total || "Toplam"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedQuotationDetails.items || []).map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-slate-900">{item.product_name}</div>
                            <div className="text-xs text-slate-400">#{item.product_id}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 text-right">
                            {Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedQuotationDetails.currency?.slice(0, 3)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">
                            {Number(item.total_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedQuotationDetails.currency?.slice(0, 3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="flex-1">
                    {selectedQuotationDetails.notes && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t.notes || "Notlar"}</p>
                        <p className="text-sm text-slate-700">{selectedQuotationDetails.notes}</p>
                      </div>
                    )}
                    <div className="text-xs text-slate-400 font-bold italic">
                      {isTr ? 'Yalnızca:' : 'Only:'} {numberToTurkishWords(Number(selectedQuotationDetails.total_amount), selectedQuotationDetails.currency)}
                    </div>
                  </div>
                  <div className="w-full md:w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{t.subtotal || "Ara Toplam"}</span>
                      <span className="font-medium">{Number(selectedQuotationDetails.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedQuotationDetails.currency?.slice(0, 3)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                      <span>{t.grandTotal || "Genel Toplam"}</span>
                      <span className="text-indigo-600">{Number(selectedQuotationDetails.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedQuotationDetails.currency?.slice(0, 3)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showDailyReportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{t.dailySalesReport}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{branding.store_name}</p>
                </div>
                <button onClick={() => setShowDailyReportModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.startDate}</label>
                    <input 
                      type="date" 
                      value={reportStartDate} 
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-[16ch] px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.endDate}</label>
                    <input 
                      type="date" 
                      value={reportEndDate} 
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-[16ch] px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    />
                  </div>
                  <button 
                    onClick={fetchDailySalesReport}
                    disabled={reportLoading}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {reportLoading ? t.loading : t.getReport}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['cash', 'credit_card', 'bank', 'term'].map((method) => {
                    const data = (dailyReportData.summary || []).find(d => d.payment_method === method) || { total_amount: 0, transaction_count: 0 };
                    return (
                      <div key={method} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t[method] || method}</span>
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg">
                            {data.transaction_count} {t.transactionCount}
                          </span>
                        </div>
                        <p className="text-xl font-black text-gray-900">
                          {Number(data.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {branding.default_currency?.slice(0, 3)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">{lang === 'tr' ? 'TOPLAM GENEL' : 'GRAND TOTAL'}</p>
                      <p className="text-3xl font-black">
                        {(dailyReportData.summary || []).reduce((acc, curr) => acc + Number(curr.total_amount), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {branding.default_currency?.slice(0, 3)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">{t.transactionCount}</p>
                      <p className="text-xl font-black">
                        {(dailyReportData.summary || []).reduce((acc, curr) => acc + Number(curr.transaction_count), 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button 
                  onClick={handleDownloadDailyReportExcel}
                  disabled={!dailyReportData.details || dailyReportData.details.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <FileDown className="h-5 w-5" /> {lang === 'tr' ? 'Excel İndir' : 'Download Excel'}
                </button>
                <button 
                  onClick={() => setShowDailyReportModal(false)}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {t.close || 'Kapat'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showTransactionModal && selectedCompany && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedCompany.title}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t.accountTransactions}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowAddTransactionModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t.newTransaction}
                  </button>
                  <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white border-b border-gray-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Para Birimi' : 'Currency'}</label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.keys(selectedCompany.balances || {}).length > 0 ? (
                      Object.keys(selectedCompany.balances).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    ) : (
                      <option value={branding.default_currency || 'TRY'}>{branding.default_currency || 'TRY'}</option>
                    )}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.start}</label>
                  <input 
                    type="date" 
                    value={transactionStartDate}
                    onChange={(e) => setTransactionStartDate(e.target.value)}
                    className="w-[16ch] px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.end}</label>
                  <input 
                    type="date" 
                    value={transactionEndDate}
                    onChange={(e) => setTransactionEndDate(e.target.value)}
                    className="w-[16ch] px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button 
                  onClick={() => handleFetchTransactions(selectedCompany.id)}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
                  title={t.refresh}
                >
                  <History className={`h-4 w-4 ${transactionLoading ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={handleExportTransactionsPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all"
                >
                  <FileDown className="h-4 w-4" />
                  {t.pdfStatement}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {(() => {
                  const filteredTransactions = companyTransactions.filter(tx => (tx.currency || 'TRY') === selectedCurrency);
                  const currentBalance = Number((companies.find(c => c.id === selectedCompany.id) || selectedCompany).balances?.[selectedCurrency] || 0);
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                          <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">{t.statements.balance.toUpperCase()}</p>
                          <p className="text-2xl font-black">
                            {currentBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedCurrency.slice(0, 3)}
                          </p>
                        </div>
                        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t.statements.debt.toUpperCase()}</p>
                          <p className="text-2xl font-black text-red-600">
                            {filteredTransactions.filter(t => t.type === 'debt').reduce((acc, t) => acc + Number(t.amount), 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedCurrency.slice(0, 3)}
                          </p>
                        </div>
                        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t.statements.credit.toUpperCase()}</p>
                          <p className="text-2xl font-black text-green-600">
                            {filteredTransactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + Number(t.amount), 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedCurrency.slice(0, 3)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {transactionLoading ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
                            <p className="text-gray-500 font-medium">{t.loading}</p>
                          </div>
                        ) : filteredTransactions.length === 0 ? (
                          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">{lang === 'tr' ? 'Seçili tarihlerde hareket bulunmuyor' : (lang === 'de' ? 'Keine Transaktionen in ausgewählten Daten' : 'No transactions in selected dates')}</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-gray-100">
                                  <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.statements.date}</th>
                                  <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.statements.description}</th>
                                  <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.statements.debt}</th>
                                  <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.statements.credit}</th>
                                  <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.statements.balance}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  let runningBalance = openingBalances[selectedCurrency] || 0;
                                  return (
                                    <>
                                      {runningBalance !== 0 && (
                                        <tr className="border-b border-gray-100 bg-slate-50/50">
                                          <td className="py-4 px-4">
                                            <p className="text-xs font-bold text-slate-500">{new Date(transactionStartDate).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</p>
                                          </td>
                                          <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                              <p className="text-xs font-bold text-slate-600">{lang === 'tr' ? 'Devreden Bakiye' : 'Opening Balance'}</p>
                                            </div>
                                          </td>
                                          <td className="py-4 px-4 text-right">
                                            {runningBalance > 0 ? (
                                              <span className="text-xs font-black text-rose-600">
                                                {runningBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedCurrency.slice(0, 3)}
                                              </span>
                                            ) : '-'}
                                          </td>
                                          <td className="py-4 px-4 text-right">
                                            {runningBalance < 0 ? (
                                              <span className="text-xs font-black text-emerald-600">
                                                {Math.abs(runningBalance).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedCurrency.slice(0, 3)}
                                              </span>
                                            ) : '-'}
                                          </td>
                                          <td className="py-4 px-4 text-right">
                                            <span className={`text-xs font-black ${runningBalance >= 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                                              {runningBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                                            </span>
                                          </td>
                                        </tr>
                                      )}
                                      {filteredTransactions.map((tx: any) => {
                                        const amount = Number(tx.amount);
                                        if (tx.type === 'debt') runningBalance += amount;
                                        else runningBalance -= amount;

                                        return (
                                          <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-all group">
                                            <td className="py-4 px-4">
                                              <p className="text-xs font-bold text-gray-900">{new Date(tx.transaction_date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</p>
                                              {tx.due_date && (
                                                <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter">
                                                  {lang === 'tr' ? 'Vade: ' : 'Due: '} {new Date(tx.due_date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                                                </span>
                                              )}
                                            </td>
                                        <td className="py-4 px-4">
                                          <p className="text-xs font-bold text-gray-700">{tx.description}</p>
                                          <div className="flex gap-2 mt-1">
                                            {tx.sale_id && (
                                              <button 
                                                onClick={() => {
                                                  setSelectedSale({ id: tx.sale_id });
                                                  setShowSaleDetailsModal(true);
                                                }}
                                                className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest hover:underline"
                                              >
                                                #{tx.sale_id} {t.sources.pos}
                                              </button>
                                            )}
                                            {tx.purchase_invoice_id && (
                                              <button 
                                                onClick={() => handleFetchPurchaseInvoiceDetails(tx.purchase_invoice_id)}
                                                className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest hover:underline"
                                              >
                                                #{tx.purchase_invoice_number || tx.purchase_invoice_id} {t.sources.purchase_invoice}
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                          {tx.type === 'debt' ? (
                                            <div className="flex flex-col items-end">
                                              <span className="text-xs font-black text-red-600">
                                                {amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedCurrency.slice(0, 3)}
                                              </span>
                                            </div>
                                          ) : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                          {tx.type === 'credit' ? (
                                            <div className="flex flex-col items-end">
                                              <span className="text-xs font-black text-green-600">
                                                {amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedCurrency.slice(0, 3)}
                                              </span>
                                            </div>
                                          ) : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                          <span className={`text-xs font-black ${runningBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                            {runningBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                    </>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button 
                  onClick={() => setShowTransactionModal(false)}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {t.close || 'Kapat'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddTransactionModal && selectedCompany && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900">{t.addNewTransaction}</h3>
                  <p className="text-xs text-gray-500 font-medium">{selectedCompany.name}</p>
                </div>
                <button onClick={() => setShowAddTransactionModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Mevcut Bakiye' : 'Current Balance'}</span>
                  <span className={`font-black ${Number(selectedCompany.balances?.[newTransactionCurrency] || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {Math.abs(Number(selectedCompany.balances?.[newTransactionCurrency] || 0)).toLocaleString('tr-TR')} {newTransactionCurrency.slice(0, 3)}
                    {Number(selectedCompany.balances?.[newTransactionCurrency] || 0) < 0 ? (lang === 'tr' ? ' (Borçlu)' : ' (Debt)') : (lang === 'tr' ? ' (Alacaklı)' : ' (Credit)')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTransactionType('credit')}
                    className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                      newTransactionType === 'credit' 
                        ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-100' 
                        : 'bg-white border-gray-100 text-gray-600 hover:border-green-200'
                    }`}
                  >
                    {lang === 'tr' ? 'Tahsilat (Giriş)' : 'Collection (In)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTransactionType('debt')}
                    className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                      newTransactionType === 'debt' 
                        ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-100' 
                        : 'bg-white border-gray-100 text-gray-600 hover:border-red-200'
                    }`}
                  >
                    {lang === 'tr' ? 'Ödeme (Çıkış)' : 'Payment (Out)'}
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Tutar' : 'Amount'}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required 
                      value={newTransactionAmount}
                      onChange={(e) => setNewTransactionAmount(e.target.value)}
                      className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                      placeholder="0.00"
                    />
                    <select
                      value={newTransactionCurrency}
                      onChange={(e) => {
                        setNewTransactionCurrency(e.target.value);
                        if (e.target.value === (branding?.default_currency || 'TRY')) {
                          setNewTransactionExchangeRate('1');
                        }
                      }}
                      className="w-24 px-2 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-bold"
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                {newTransactionCurrency !== (branding?.default_currency || 'TRY') && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Döviz Kuru' : 'Exchange Rate'}</label>
                    <input 
                      type="text" 
                      required 
                      value={newTransactionExchangeRate}
                      onChange={(e) => setNewTransactionExchangeRate(e.target.value.replace(',', '.'))}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                      placeholder="1.00"
                    />
                  </div>
                )}

                {newTransactionType === 'credit' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.paymentMethod || 'Ödeme Yöntemi'}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['cash', 'credit_card', 'bank'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setNewTransactionPaymentMethod(method as any)}
                          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all border-2 ${
                            newTransactionPaymentMethod === method 
                              ? 'bg-indigo-600 border-indigo-600 text-white' 
                              : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'
                          }`}
                        >
                          {t[method] || method}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Açıklama' : 'Description'}</label>
                  <input 
                    type="text" 
                    required 
                    value={newTransactionDescription}
                    onChange={(e) => setNewTransactionDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder={lang === 'tr' ? 'İşlem açıklaması...' : 'Transaction description...'}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Tarih' : 'Date'}</label>
                  <input 
                    type="date" 
                    required 
                    value={newTransactionDate}
                    onChange={(e) => setNewTransactionDate(e.target.value)}
                    className="w-[16ch] px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                  >
                    {lang === 'tr' ? 'Kaydet' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showSaleModal && selectedQuotation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">{lang === 'tr' ? 'Satışa Dönüştür' : 'Convert to Sale'}</h3>
                <button onClick={() => setShowSaleModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleConfirmSale} className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">{t.customer}</span>
                    <span className="font-bold">{selectedQuotation.customer_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{t.amount}</span>
                    <span className="text-xl font-black text-indigo-600">
                      {Number(selectedQuotation.total_amount).toLocaleString('tr-TR')} {selectedQuotation.currency?.slice(0, 3)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.dueDate || 'Vade Tarihi'}</label>
                  <input 
                    type="date" 
                    required 
                    className="w-[16ch] px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.notes}</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all h-20 resize-none"
                    placeholder={lang === 'tr' ? 'Satış notları...' : 'Sale notes...'}
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                  />
                </div>

                {!selectedQuotation.company_id && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <input 
                      type="checkbox" 
                      id="createCompany"
                      checked={createCompanyFromSale}
                      onChange={(e) => setCreateCompanyFromSale(e.target.checked)}
                      className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="createCompany" className="text-sm font-bold text-amber-900 cursor-pointer">
                      {lang === 'tr' ? 'Müşteriyi Cari Hesap Olarak Kaydet' : 'Save Customer as Current Account'}
                    </label>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowSaleModal(false)} 
                    disabled={isConfirmingSale}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    type="submit" 
                    disabled={isConfirmingSale}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isConfirmingSale ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    {lang === 'tr' ? 'Satışı Onayla' : 'Confirm Sale'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        
        {showBulkPriceModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">
                  {lang === 'tr' ? 'Toplu Fiyat Güncelleme' : 'Bulk Price Update'}
                </h3>
                <button onClick={() => setShowBulkPriceModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleBulkPriceSubmit} className="p-6 space-y-5">
                {/* Target Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {lang === 'tr' ? 'Hedef Ürünler' : 'Target Products'}
                  </label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    value={bulkPriceForm.target}
                    onChange={e => setBulkPriceForm({...bulkPriceForm, target: e.target.value})}
                  >
                    <option value="all">{lang === 'tr' ? 'Tüm Ürünler' : 'All Products'}</option>
                    <option value="category">{lang === 'tr' ? 'Belirli Bir Kategori' : 'Specific Category'}</option>
                  </select>
                </div>

                {bulkPriceForm.target === 'category' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {lang === 'tr' ? 'Kategori Seçin' : 'Select Category'}
                    </label>
                    <select 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={bulkPriceForm.category}
                      onChange={e => setBulkPriceForm({...bulkPriceForm, category: e.target.value})}
                      required
                    >
                      <option value="">{lang === 'tr' ? 'Kategori Seçiniz...' : 'Select Category...'}</option>
                      {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Direction & Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {lang === 'tr' ? 'İşlem Yönü' : 'Direction'}
                    </label>
                    <select 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={bulkPriceForm.direction}
                      onChange={e => setBulkPriceForm({...bulkPriceForm, direction: e.target.value})}
                    >
                      <option value="increase">{lang === 'tr' ? 'Zam Yap (Artır)' : 'Increase'}</option>
                      <option value="decrease">{lang === 'tr' ? 'İndirim Yap (Düşür)' : 'Decrease'}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {lang === 'tr' ? 'Değer Tipi' : 'Value Type'}
                    </label>
                    <select 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={bulkPriceForm.type}
                      onChange={e => setBulkPriceForm({...bulkPriceForm, type: e.target.value})}
                    >
                      <option value="percentage">{lang === 'tr' ? 'Yüzde (%)' : 'Percentage (%)'}</option>
                      <option value="amount">{lang === 'tr' ? 'Tutar (₺)' : 'Amount (₺)'}</option>
                    </select>
                  </div>
                </div>

                {/* Value */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {bulkPriceForm.type === 'percentage' 
                      ? (lang === 'tr' ? 'Yüzde Oranı (%)' : 'Percentage (%)') 
                      : (lang === 'tr' ? 'Tutar Değeri' : 'Amount Value')}
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder={lang === 'tr' ? 'Örn: 15' : 'e.g. 15'}
                    value={bulkPriceForm.value}
                    onChange={e => setBulkPriceForm({...bulkPriceForm, value: e.target.value})}
                  />
                </div>

                {/* Rounding */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {lang === 'tr' ? 'Yuvarlama' : 'Rounding'}
                  </label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    value={bulkPriceForm.rounding}
                    onChange={e => setBulkPriceForm({...bulkPriceForm, rounding: e.target.value})}
                  >
                    <option value="none">{lang === 'tr' ? 'Kuruşlu Kalsın (Örn: 14.53 ₺)' : 'No Rounding (e.g. 14.53)'}</option>
                    <option value="round">{lang === 'tr' ? 'En Yakın Tam Sayıya Yuvarla (Örn: 15 ₺)' : 'Nearest Integer (e.g. 15)'}</option>
                    <option value="ceil">{lang === 'tr' ? 'Yukarı Yuvarla (Örn: 15 ₺)' : 'Round Up (e.g. 15)'}</option>
                    <option value="floor">{lang === 'tr' ? 'Aşağı Yuvarla (Örn: 14 ₺)' : 'Round Down (e.g. 14)'}</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowBulkPriceModal(false)} 
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    {lang === 'tr' ? 'İptal' : 'Cancel'}
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      lang === 'tr' ? 'Uygula' : 'Apply'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showProductModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingProduct ? t.editProduct : t.addManual}
                </h3>
                <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="flex flex-col overflow-hidden flex-1 min-h-0">
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Row 1: Barcode */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.barcode}</label>
                      <input 
                        name="barcode" 
                        required 
                        maxLength={13}
                        defaultValue={editingProduct?.barcode} 
                        placeholder="869..."
                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono" 
                      />
                    </div>

                    {/* Row 2: Product Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.productName}</label>
                      <input 
                        name="name" 
                        required 
                        defaultValue={editingProduct?.name} 
                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-semibold" 
                      />
                    </div>

                    {/* Row 2.5: Category & Sub-Category */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Tag className="h-2.5 w-2.5" /> {lang === 'tr' ? 'KATEGORİ' : 'CATEGORY'}
                        </label>
                        <input 
                          name="category" 
                          defaultValue={editingProduct?.category} 
                          onChange={(e) => {
                            const val = e.target.value.trim().toLocaleLowerCase('tr-TR');
                            const matchedRule = branding?.category_tax_rules?.find((r: any) => r.category.trim().toLocaleLowerCase('tr-TR') === val);
                            if (matchedRule) {
                              const taxInput = e.target.closest('form')?.querySelector('input[name="tax_rate"]') as HTMLInputElement;
                              if (taxInput) taxInput.value = String(matchedRule.taxRate);
                            } else if (val === 'kitap') {
                              const taxInput = e.target.closest('form')?.querySelector('input[name="tax_rate"]') as HTMLInputElement;
                              if (taxInput) taxInput.value = '0';
                            }
                          }}
                          placeholder={lang === 'tr' ? 'Örn: Ofis' : 'e.g. Office'}
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Tag className="h-2.5 w-2.5" /> {lang === 'tr' ? 'ALT KATEGORİ' : 'SUB-CATEGORY'}
                        </label>
                        <input 
                          name="sub_category" 
                          defaultValue={editingProduct?.sub_category} 
                          placeholder={lang === 'tr' ? 'Örn: Dosyalama' : 'e.g. Filing'}
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                        />
                      </div>
                    </div>

                    {/* Row 2.6: Brand & Author */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Globe className="h-2.5 w-2.5" /> {lang === 'tr' ? 'MARKA' : 'BRAND'}
                        </label>
                        <input 
                          name="brand" 
                          defaultValue={editingProduct?.brand} 
                          placeholder={lang === 'tr' ? 'Örn: Apple' : 'e.g. Apple'}
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <UserIcon className="h-2.5 w-2.5" /> {lang === 'tr' ? 'YAZAR' : 'AUTHOR'}
                        </label>
                        <input 
                          name="author" 
                          defaultValue={editingProduct?.author} 
                          placeholder={lang === 'tr' ? 'Örn: Sabahattin Ali' : 'e.g. Orwell'}
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Row 3: Price & Currency */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="space-y-1 col-span-8">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.price} (KDV Dahil)</label>
                        <input 
                          name="price" 
                          type="text" 
                          required 
                          defaultValue={editingProduct?.price} 
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const form = e.target.closest('form');
                            if (!form) return;
                            const taxRate = (form.querySelector('input[name="tax_rate"]') as HTMLInputElement)?.value || String(branding.default_tax_rate ?? 20);
                            const price2Input = form.querySelector('input[name="price_2"]') as HTMLInputElement;
                            if (price2Input) {
                              const p = Number(e.target.value.replace(',', '.'));
                              const t = Number(taxRate);
                              if (!isNaN(p) && !isNaN(t)) {
                                price2Input.value = (p / (1 + t / 100)).toFixed(2);
                              }
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 text-lg" 
                        />
                      </div>
                      <div className="space-y-1 col-span-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.currency}</label>
                        <select 
                          name="currency" 
                          defaultValue={editingProduct?.currency || branding.default_currency} 
                          onChange={(e) => {
                            const form = e.target.closest('form');
                            if (!form) return;
                            const price2CurrencySelect = form.querySelector('select[name="price_2_currency"]') as HTMLSelectElement;
                            if (price2CurrencySelect) {
                              price2CurrencySelect.value = e.target.value;
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                        >
                          <option value="TRY">TRY</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 3.5: Price 2 (KDV Hariç / Invoice Price) */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="space-y-1 col-span-8">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? '2. SATIŞ FİYATI (KDV HARİÇ)' : '2ND SALE PRICE (EXCL. TAX)'}</label>
                        <input 
                          name="price_2" 
                          type="text" 
                          defaultValue={editingProduct?.price_2 || 0} 
                          onFocus={(e) => e.target.select()}
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-emerald-600" 
                        />
                      </div>
                      <div className="space-y-1 col-span-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'PARA BİRİMİ' : 'CURRENCY'}</label>
                        <select 
                          name="price_2_currency" 
                          defaultValue={editingProduct?.price_2_currency || branding.default_currency} 
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                        >
                          <option value="TRY">TRY</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 4: Cost Price & Currency */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="space-y-1 col-span-8">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'MALİYET FİYATI' : 'COST PRICE'}</label>
                        <input 
                          name="cost_price" 
                          type="text" 
                          defaultValue={editingProduct?.cost_price} 
                          onFocus={(e) => e.target.select()}
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-600" 
                        />
                      </div>
                      <div className="space-y-1 col-span-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'PARA BİRİMİ' : 'CURRENCY'}</label>
                        <select 
                          name="cost_currency" 
                          defaultValue={editingProduct?.cost_currency || branding.default_currency} 
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                        >
                          <option value="TRY">TRY</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 5: Stock & Min Stock */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.stock}</label>
                        <input 
                          name="stock_quantity" 
                          type="text" 
                          defaultValue={editingProduct?.stock_quantity || 0} 
                          onFocus={(e) => e.target.select()}
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.minStock}</label>
                        <input 
                          name="min_stock_level" 
                          type="text" 
                          defaultValue={editingProduct?.min_stock_level ?? 5} 
                          onFocus={(e) => e.target.select()}
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold" 
                        />
                      </div>
                    </div>

                    {/* Row 6: Unit & Tax */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.unit}</label>
                        <input 
                          name="unit" 
                          defaultValue={editingProduct?.unit || 'Adet'} 
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KDV %</label>
                        <input 
                          name="tax_rate" 
                          type="text" 
                          defaultValue={editingProduct?.tax_rate !== undefined ? Math.floor(Number(editingProduct.tax_rate)) : (branding.default_tax_rate !== undefined ? Math.floor(Number(branding.default_tax_rate)) : 20)} 
                          onFocus={(e) => e.target.select()}
                          onInput={(e) => {
                            const target = e.target as HTMLInputElement;
                            target.value = target.value.replace(/[^0-9]/g, '').substring(0, 2);
                            
                            const form = target.closest('form');
                            if (!form) return;
                            const price = (form.querySelector('input[name="price"]') as HTMLInputElement)?.value || '0';
                            const price2Input = form.querySelector('input[name="price_2"]') as HTMLInputElement;
                            if (price2Input) {
                              const p = Number(price.replace(',', '.'));
                              const t = Number(target.value);
                              if (!isNaN(p) && !isNaN(t)) {
                                price2Input.value = (p / (1 + t / 100)).toFixed(2);
                              }
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold" 
                        />
                      </div>
                    </div>

                    {/* Row 7: Web Sale & Product Type */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          {lang === 'tr' ? 'ÜRÜN TİPİ' : 'PRODUCT TYPE'}
                        </label>
                        <select 
                          name="product_type" 
                          defaultValue={editingProduct?.product_type || 'product'} 
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        >
                          <option value="product">{lang === 'tr' ? 'Stoklu Ürün' : 'Inventory Product'}</option>
                          <option value="service">{lang === 'tr' ? 'Hizmet / Servis' : 'Service / Fee'}</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-3 pt-6">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="is_web_sale" 
                            defaultChecked={editingProduct?.is_web_sale !== false} 
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          <span className="ml-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                            {lang === 'tr' ? 'WEB SATIŞI' : 'WEB SALE'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Width Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-50">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" /> {lang === 'tr' ? 'ETİKETLER (VİRGÜLLE AYIRIN)' : 'LABELS (COMMA SEPARATED)'}
                    </label>
                    <input 
                      name="labels_input" 
                      defaultValue={Array.isArray(editingProduct?.labels) ? editingProduct.labels.join(', ') : ''} 
                      placeholder={lang === 'tr' ? 'Yeni, Çok Satanlar' : 'New, Bestseller'}
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                      onBlur={(e) => {
                        const labels = e.target.value.split(',').map(l => l.trim()).filter(l => l !== '');
                        const hiddenInput = e.target.closest('form')?.querySelector('input[name="labels"]') as HTMLInputElement;
                        if (hiddenInput) hiddenInput.value = JSON.stringify(labels);
                      }}
                    />
                    <input type="hidden" name="labels" defaultValue={JSON.stringify(editingProduct?.labels || [])} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <ImageIcon className="h-2.5 w-2.5" /> {lang === 'tr' ? 'GÖRSEL URL' : 'IMAGE URL'}
                    </label>
                    <input 
                      name="image_url" 
                      defaultValue={editingProduct?.image_url} 
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.description}</label>
                  <textarea 
                    name="description" 
                    rows={2}
                    defaultValue={editingProduct?.description} 
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm resize-none" 
                  />
                </div>

                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setShowProductModal(false)} 
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all text-sm"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    type="submit" 
                    className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-sm"
                  >
                    {editingProduct ? t.update : t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">{t.importTitle}</h3>
                <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportColumns([]); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleImport} className="p-6 space-y-6">
                {!importFile ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-sm text-indigo-700 font-medium mb-2">Excel Şablonu Gereksinimleri:</p>
                      <ul className="text-xs text-indigo-600 space-y-1 list-disc list-inside">
                        <li>Sütunlar: Barkod, Ürün Adı, Kategori, Alt Kategori, Marka, Fiyat, Açıklama, Stok Adedi</li>
                        <li>Dosya formatı: .xlsx veya .xls</li>
                      </ul>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" 
                        name="file" 
                        accept=".xlsx, .xls" 
                        required 
                        onChange={handleFileSelect}
                        className="w-full px-4 py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center cursor-pointer hover:border-indigo-400 transition-all" 
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <Upload className="h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.selectFile}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-6 w-6 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-900">{importFile.name}</span>
                      </div>
                      <button onClick={() => { setImportFile(null); setImportColumns([]); }} className="text-xs font-bold text-emerald-600 hover:underline">Değiştir</button>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.mapping}</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { key: 'barcode', label: t.barcode, required: true },
                          { key: 'name', label: t.productName, required: true },
                          { key: 'category', label: lang === 'tr' ? 'Kategori' : 'Category', required: false },
                          { key: 'sub_category', label: lang === 'tr' ? 'Alt Kategori' : 'Sub-Category', required: false },
                          { key: 'brand', label: lang === 'tr' ? 'Marka' : 'Brand', required: false },
                          { key: 'author', label: lang === 'tr' ? 'Yazar' : 'Author', required: false },
                          { key: 'price', label: t.price, required: true },
                          { key: 'description', label: t.description, required: false },
                          { key: 'stock_quantity', label: t.stock, required: false },
                          { key: 'unit', label: t.unit, required: false },
                          { key: 'currency', label: t.currency, required: false }
                        ].map((field) => (
                          <div key={field.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm font-bold text-gray-700">{field.label} {field.required && <span className="text-red-500">*</span>}</span>
                            <select 
                              required={field.required}
                              className="bg-white border-gray-200 rounded-lg text-sm focus:ring-indigo-500"
                              value={mapping[field.key]}
                              onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                            >
                              <option value="">{lang === 'tr' ? 'Sütun Seçin' : 'Select Column'}</option>
                              {importColumns.map((col, idx) => (
                                <option key={idx} value={col}>{col}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <input 
                        type="checkbox" 
                        id="convertCurrency"
                        checked={convertCurrency}
                        onChange={(e) => setConvertCurrency(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="convertCurrency" className="text-xs font-bold text-indigo-900">
                        {lang === 'tr' 
                          ? `Fiyatları mağaza varsayılan para birimine (${branding.default_currency}) dönüştür` 
                          : `Convert prices to store's default currency (${branding.default_currency})`}
                      </label>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    disabled={isImporting}
                    onClick={() => { setShowImportModal(false); setImportFile(null); setImportColumns([]); }} 
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    {t.cancel}
                  </button>
                  {importFile && (
                    <button 
                      type="submit" 
                      disabled={isImporting}
                      className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:bg-indigo-400 flex items-center justify-center space-x-2"
                    >
                      {isImporting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          <span>{lang === 'tr' ? 'İşleniyor...' : 'Processing...'}</span>
                        </>
                      ) : (
                        <span>{t.importBtn}</span>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showCompanyModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCompany ? (lang === 'tr' ? 'Şirketi Düzenle' : 'Edit Company') : (lang === 'tr' ? 'Yeni Şirket' : 'New Company')}
                </h3>
                <button onClick={() => setShowCompanyModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleAddCompany} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Şirket Ünvanı' : 'Company Title'}</label>
                  <input name="title" required defaultValue={editingCompany?.title} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Vergi Dairesi' : 'Tax Office'}</label>
                    <input name="tax_office" defaultValue={editingCompany?.tax_office} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Vergi No' : 'Tax Number'}</label>
                    <input name="tax_number" defaultValue={editingCompany?.tax_number} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Telefon' : 'Phone'}</label>
                    <input name="phone" defaultValue={editingCompany?.phone} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Firma Yetkilisi' : 'Company Representative'}</label>
                    <input name="representative" defaultValue={editingCompany?.representative} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'E-posta' : 'Email'}</label>
                  <input name="email" type="email" defaultValue={editingCompany?.email} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Adres' : 'Address'}</label>
                  <textarea name="address" defaultValue={editingCompany?.address} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all h-20 resize-none" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowCompanyModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">
                    {t.cancel}
                  </button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    {editingCompany ? t.update : t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showUserModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">{t.addUser}</h3>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.email}</label>
                  <input name="email" type="email" required className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.password}</label>
                  <input name="password" type="password" required className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.role}</label>
                  <select name="role" className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all">
                    <option value="editor">{t.editor}</option>
                    <option value="viewer">{t.viewer}</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">
                    {t.cancel}
                  </button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    {t.add}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showQuotationModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingQuotation ? (lang === 'tr' ? 'Teklifi Düzenle' : 'Edit Quotation') : (lang === 'tr' ? 'Yeni Teklif' : 'New Quotation')}
                </h3>
                <button onClick={() => setShowQuotationModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleAddQuotation} className="flex flex-col overflow-hidden flex-1 min-h-0">
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Firma İsmi' : 'Company Name'}</label>
                    <input 
                      name="customer_name" 
                      required 
                      list="company-list"
                      defaultValue={editingQuotation?.customer_name} 
                      onChange={(e) => {
                        const company = companies.find(c => c.title === e.target.value);
                        const companyIdInput = (e.target as HTMLInputElement).form?.elements.namedItem('company_id') as HTMLInputElement;
                        const taxOfficeInput = (e.target as HTMLInputElement).form?.elements.namedItem('tax_office') as HTMLInputElement;
                        const taxNumberInput = (e.target as HTMLInputElement).form?.elements.namedItem('tax_number') as HTMLInputElement;
                        
                        if (company) {
                          const titleInput = (e.target as HTMLInputElement).form?.elements.namedItem('customer_title') as HTMLInputElement;
                          if (titleInput) titleInput.value = company.representative || company.contact_person || '';
                          if (companyIdInput) companyIdInput.value = company.id.toString();
                          if (taxOfficeInput) taxOfficeInput.value = company.tax_office || '';
                          if (taxNumberInput) taxNumberInput.value = company.tax_number || '';
                        } else {
                          if (companyIdInput) companyIdInput.value = '';
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                      placeholder={lang === 'tr' ? 'Firma ismi yazın veya seçin...' : 'Type or select company name...'}
                    />
                    <input type="hidden" name="company_id" defaultValue={editingQuotation?.company_id} />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Vergi Dairesi' : 'Tax Office'}</label>
                        <input name="tax_office" defaultValue={editingQuotation?.tax_office} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Vergi No' : 'Tax Number'}</label>
                        <input name="tax_number" defaultValue={editingQuotation?.tax_number} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
                      </div>
                    </div>
                    <datalist id="company-list">
                      {companies.map(c => (
                        <option key={c.id} value={c.title} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Firma Yetkilisi' : 'Company Representative'}</label>
                    <input name="customer_title" defaultValue={editingQuotation?.customer_title} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" placeholder={lang === 'tr' ? 'Yetkili kişi...' : 'Representative...'} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.items || 'Ürünler'}</h4>
                  </div>
                  
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                          type="text"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                          placeholder={lang === 'tr' ? 'Ürün adı veya barkod ile ara...' : 'Search by product name or barcode...'}
                          value={quotationProductSearch}
                          onChange={(e) => {
                            const search = e.target.value;
                            setQuotationProductSearch(search);
                            const dropdown = document.getElementById('global-product-dropdown');
                            if (dropdown) {
                              dropdown.classList.toggle('hidden', search.length < 1);
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <div 
                      id="global-product-dropdown"
                      className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-64 overflow-y-auto hidden"
                    >
                      {products.filter(p => 
                        p.name.toLowerCase().includes(deferredQuotationProductSearch.toLowerCase()) || 
                        p.barcode.toLowerCase().includes(deferredQuotationProductSearch.toLowerCase())
                      ).map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className="product-option w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                          onClick={() => {
                            const existingIdx = quotationItems.findIndex(item => item.product_id === p.id);
                            const taxRate = Math.round(Number(p.tax_rate ?? branding.default_tax_rate ?? 20));
                            
                            let unitPrice: number;
                            if (p.price_2 && Number(p.price_2) > 0) {
                              // If price_2 is set, it's KDV Hariç. Convert to KDV Dahil for quotation display.
                              unitPrice = Number(p.price_2) * (1 + taxRate / 100);
                            } else {
                              unitPrice = Number(p.price);
                            }

                            if (existingIdx > -1) {
                              const newItems = [...quotationItems];
                              newItems[existingIdx].quantity += 1;
                              newItems[existingIdx].total_price = newItems[existingIdx].quantity * newItems[existingIdx].unit_price;
                              setQuotationItems(newItems);
                            } else {
                              setQuotationItems([...quotationItems, {
                                product_id: p.id,
                                product_name: p.name,
                                barcode: p.barcode,
                                quantity: 1,
                                unit_price: unitPrice,
                                tax_rate: taxRate,
                                total_price: unitPrice
                              }]);
                            }
                            setQuotationProductSearch("");
                            const dropdown = document.getElementById('global-product-dropdown');
                            if (dropdown) dropdown.classList.add('hidden');
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-gray-900">{p.name}</div>
                              <div className="text-xs text-gray-400">{p.barcode}</div>
                            </div>
                            <div className="text-sm font-black text-indigo-600">
                              {p.price} {p.currency?.slice(0, 3)}
                            </div>
                          </div>
                        </button>
                      ))}
                      
                      {quotationProductSearch.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickProductForm({ ...quickProductForm, name: quotationProductSearch, barcode: `M-${Date.now()}` });
                            setShowQuickProductModal(true);
                            const dropdown = document.getElementById('global-product-dropdown');
                            if (dropdown) dropdown.classList.add('hidden');
                          }}
                          className="w-full text-left px-4 py-4 bg-indigo-50 hover:bg-indigo-100 transition-colors border-t border-indigo-100"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-600 text-white rounded-lg">
                              <Plus className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-indigo-900">"{quotationProductSearch}" {lang === 'tr' ? 'Ürününü Ekle' : 'Add Product'}</div>
                              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{lang === 'tr' ? 'Yeni stok kartı oluştur' : 'Create new stock card'}</div>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                    {quotationItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{item.product_name}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.barcode || `#${item.product_id}`}</div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="flex-1 sm:w-24 space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Birim Fiyat' : 'Unit Price'}</label>
                            <input 
                              type="number" 
                              value={item.unit_price === 0 ? '' : item.unit_price}
                              onChange={(e) => {
                                const price = parseFloat(e.target.value) || 0;
                                const newItems = [...quotationItems];
                                newItems[idx] = { ...newItems[idx], unit_price: price, total_price: item.quantity * price };
                                setQuotationItems(newItems);
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 transition-all" 
                            />
                          </div>
                          <div className="w-16 space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'KDV %' : 'Tax %'}</label>
                            <input 
                              type="number" 
                              step="1"
                              min="0"
                              max="99"
                              value={item.tax_rate === 0 ? '' : Math.round(item.tax_rate)}
                              onChange={(e) => {
                                const tax = parseInt(e.target.value) || 0;
                                const newItems = [...quotationItems];
                                newItems[idx] = { ...newItems[idx], tax_rate: tax };
                                setQuotationItems(newItems);
                              }}
                              onKeyDown={(e) => { if (e.key === '.' || e.key === ',') e.preventDefault(); }}
                              onFocus={(e) => e.target.select()}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500 transition-all" 
                            />
                          </div>
                          <div className="w-20 space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t.quantity}</label>
                            <input 
                              type="number" 
                              min="1"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 0;
                                const newItems = [...quotationItems];
                                newItems[idx] = { ...newItems[idx], quantity: qty, total_price: qty * Number(item.unit_price) };
                                setQuotationItems(newItems);
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500 transition-all" 
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => setQuotationItems(quotationItems.filter((_, i) => i !== idx))}
                            className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors mt-4 sm:mt-0"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    type="button"
                    onClick={() => setShowNotes(!showNotes)}
                    className="flex items-center space-x-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${showNotes ? 'rotate-90' : ''}`} />
                    <span>{t.notes}</span>
                  </button>
                  
                  <div className={`${showNotes ? 'block' : 'hidden'}`}>
                    <textarea 
                      name="notes" 
                      defaultValue={editingQuotation?.notes || (lang === 'tr' ? '*Fiyatlarımıza Vergiler Dahildir!' : '*Prices Include Taxes!')} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none text-sm" 
                      placeholder={t.notesPlaceholder}
                    />
                  </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                  <button type="button" onClick={() => setShowQuotationModal(false)} className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all">
                    {t.cancel}
                  </button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    {editingQuotation ? (lang === 'tr' ? 'Güncelle' : 'Update') : t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showQuickProductModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">{lang === 'tr' ? 'Hızlı Ürün Ekle' : 'Quick Add Product'}</h3>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'Yeni stok kartı oluşturulacak' : 'New stock card will be created'}</p>
                  </div>
                  <button onClick={() => setShowQuickProductModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
                    <X className="h-6 w-6 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleQuickAddProduct} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.productName}</label>
                    <input 
                      required
                      value={quickProductForm.name}
                      onChange={(e) => setQuickProductForm({ ...quickProductForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.price}</label>
                      <input 
                        type="number"
                        required
                        value={quickProductForm.price}
                        onChange={(e) => setQuickProductForm({ ...quickProductForm, price: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'KDV %' : 'Tax %'}</label>
                      <input 
                        type="number"
                        step="1"
                        min="0"
                        max="99"
                        required
                        value={quickProductForm.tax_rate === '0' ? '0' : (quickProductForm.tax_rate ? Math.round(Number(quickProductForm.tax_rate)) : '')}
                        onChange={(e) => setQuickProductForm({ ...quickProductForm, tax_rate: e.target.value })}
                        onKeyDown={(e) => { if (e.key === '.' || e.key === ',') e.preventDefault(); }}
                        onFocus={(e) => e.target.select()}
                        className="w-[8ch] px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.barcode}</label>
                      <input 
                        value={quickProductForm.barcode}
                        onChange={(e) => setQuickProductForm({ ...quickProductForm, barcode: e.target.value })}
                        maxLength={13}
                        className="w-[22ch] px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowQuickProductModal(false)} className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">
                      {t.cancel}
                    </button>
                    <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                      {t.save}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
