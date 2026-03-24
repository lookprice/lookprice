import React, { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { 
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
  Sparkles,
  ImageIcon,
  Tag,
  Key,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI, Type } from "@google/genai";
import { translations } from "../../translations";
import PurchaseInvoices from "../../components/PurchaseInvoices";
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../services/api";
import { User, Product, Store as StoreType } from "../../types";
import Logo from "../../components/Logo";
import * as XLSX from 'xlsx';

// Import Tabs
import ProductsTab from "./ProductsTab";
import AnalyticsTab from "./AnalyticsTab";
import QuotationsTab from "./QuotationsTab";
import CompaniesTab from "./CompaniesTab";
import PosTab from "./PosTab";
import SettingsTab from "./SettingsTab";

interface StoreDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StoreDashboard({ user, onLogout }: StoreDashboardProps) {
  const { slug } = useParams();
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStoreId, setCurrentStoreId] = useState<number | undefined>(user.store_id);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState({ current: 0, total: 0 });
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<any>({
    barcode: "",
    name: "",
    category: "",
    price: "",
    description: "",
    stock_quantity: "",
    unit: ""
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [branding, setBranding] = useState<any>({
    name: "LookPrice",
    store_name: "LookPrice",
    primary_color: "#4f46e5",
    logo_url: "",
    favicon_url: "",
    default_currency: "TRY",
    default_language: "tr"
  });
  const [quotations, setQuotations] = useState<any[]>([]);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [quotationProductSearch, setQuotationProductSearch] = useState("");
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({ name: "", price: "", barcode: "", tax_rate: "" });
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [isConfirmingSale, setIsConfirmingSale] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'bank' | 'term'>('cash');
  const [dueDate, setDueDate] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [editingQuotation, setEditingQuotation] = useState<any>(null);
  const [quotationSearch, setQuotationSearch] = useState("");
  const [quotationStatusFilter, setQuotationStatusFilter] = useState("all");
  const [companies, setCompanies] = useState<any[]>([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [includeZeroBalance, setIncludeZeroBalance] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesStatusFilter, setSalesStatusFilter] = useState("all");
  const [salesStartDate, setSalesStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [salesEndDate, setSalesEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showSaleDetailsModal, setShowSaleDetailsModal] = useState(false);
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState<any>(null);
  const [showPurchaseInvoiceDetailsModal, setShowPurchaseInvoiceDetailsModal] = useState(false);
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState<any>(null);
  const [showQuotationDetailsModal, setShowQuotationDetailsModal] = useState(false);
  const [quotationItems, setQuotationItems] = useState<any[]>([]);
  const [companyTransactions, setCompanyTransactions] = useState<any[]>([]);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionStartDate, setTransactionStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [transactionEndDate, setTransactionEndDate] = useState(new Date().toISOString().split('T')[0]);
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
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [completingSale, setCompletingSale] = useState(false);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'cash' | 'credit_card' | 'bank'>('cash');
  const [newTransactionType, setNewTransactionType] = useState<'debt' | 'credit'>('credit');
  const [newTransactionAmount, setNewTransactionAmount] = useState('');
  const [newTransactionDescription, setNewTransactionDescription] = useState('');
  const [newTransactionDate, setNewTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTransactionPaymentMethod, setNewTransactionPaymentMethod] = useState<'cash' | 'credit_card' | 'bank' | 'term'>('cash');
  const [createCompanyFromSale, setCreateCompanyFromSale] = useState(false);

  const isViewer = user.role === 'viewer';
  const publicUrl = `${window.location.origin}/s/${slug}`;
  const scanUrl = `${window.location.origin}/scan/${slug}`;

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
      
      setCurrentStoreId(targetStoreId);

      const [productsRes, analyticsRes, brandingRes, quotationsRes, companiesRes, usersRes] = await Promise.all([
        api.getProducts(targetStoreId),
        api.getAnalytics(targetStoreId),
        api.getBranding(targetStoreId),
        api.getQuotations(quotationSearch, quotationStatusFilter, targetStoreId),
        api.getCompanies(includeZeroBalance, targetStoreId),
        api.getUsers(targetStoreId)
      ]);
      setProducts(Array.isArray(productsRes) ? productsRes : []);
      setAnalytics(analyticsRes && !analyticsRes.error ? analyticsRes : null);
      if (brandingRes && !brandingRes.error) setBranding(brandingRes);
      setQuotations(Array.isArray(quotationsRes) ? quotationsRes : []);
      setCompanies(Array.isArray(companiesRes) ? companiesRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [quotationSearch, quotationStatusFilter, includeZeroBalance, user.role, user.store_id, slug]);

  const fetchSales = useCallback(async () => {
    try {
      setSalesLoading(true);
      const res = await api.getSales(salesStatusFilter, salesStartDate, salesEndDate, currentStoreId);
      setSales(res);
    } catch (error) {
      console.error("Fetch sales error:", error);
    } finally {
      setSalesLoading(false);
    }
  }, [salesStatusFilter, salesStartDate, salesEndDate, currentStoreId]);

  const fetchDailySalesReport = async () => {
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
    const isTr = lang === 'tr';
    if (!dailyReportData.details || dailyReportData.details.length === 0) {
      alert(isTr ? "İndirilecek veri bulunamadı" : "No data to download");
      return;
    }

    const data = dailyReportData.details.map(d => ({
      [isTr ? 'Tarih' : 'Date']: new Date(d.created_at).toLocaleString(isTr ? 'tr-TR' : 'en-US'),
      [isTr ? 'Müşteri' : 'Customer']: d.customer_name || '-',
      [isTr ? 'Tutar' : 'Amount']: d.amount,
      [isTr ? 'Ödeme Yöntemi' : 'Payment Method']: t[d.payment_method] || d.payment_method,
      [isTr ? 'Kaynak' : 'Source']: d.source === 'sale_payment' ? (isTr ? 'Satış Ödemesi' : 'Sale Payment') : 
                                  d.source === 'term_sale' ? (isTr ? 'Vadeli Satış' : 'Term Sale') : 
                                  (isTr ? 'Tahsilat' : 'Collection'),
      [isTr ? 'Satış ID' : 'Sale ID']: d.sale_id ? `#${d.sale_id}` : '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Kasa Raporu" : "Cash Report");
    XLSX.writeFile(wb, `Kasa_Raporu_${reportStartDate}_${reportEndDate}.xlsx`);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'pos') {
      fetchSales();
    }
  }, [activeTab, fetchSales]);

  const planLimits: Record<string, number> = {
    free: 50,
    basic: 100,
    pro: 500,
    enterprise: Infinity
  };

  // Handlers for Products
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    
    const amount = Number(newTransactionAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(lang === 'tr' ? "Lütfen geçerli bir tutar giriniz." : "Please enter a valid amount.");
      return;
    }

    try {
      await api.addCompanyTransaction(selectedCompany.id, {
        type: newTransactionType,
        amount: amount,
        description: newTransactionDescription,
        transaction_date: newTransactionDate,
        payment_method: newTransactionType === 'credit' ? newTransactionPaymentMethod : null
      }, currentStoreId);
      
      setShowAddTransactionModal(false);
      setNewTransactionAmount('');
      setNewTransactionDescription('');
      
      // Refresh transactions and companies
      handleFetchTransactions(selectedCompany.id);
      const companiesRes = await api.getCompanies(includeZeroBalance, currentStoreId);
      setCompanies(Array.isArray(companiesRes) ? companiesRes : []);
      
      // Update selected company balance locally if possible or just refetch
      const updatedCompany = Array.isArray(companiesRes) ? companiesRes.find((c: any) => c.id === selectedCompany.id) : null;
      if (updatedCompany) setSelectedCompany(updatedCompany);

    } catch (error) {
      console.error("Add transaction error:", error);
    }
  };

  const getConvertedPrice = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    const rates = branding?.currency_rates || { "USD": 45.0, "EUR": 48.5, "GBP": 56.2 };
    
    if (toCurrency === 'TRY') {
      const rate = rates[fromCurrency as keyof typeof rates] || 1;
      return amount * rate;
    }
    
    if (fromCurrency === 'TRY') {
      const rate = rates[toCurrency as keyof typeof rates] || 1;
      return amount / rate;
    }
    
    const fromRate = rates[fromCurrency as keyof typeof rates] || 1;
    const toRate = rates[toCurrency as keyof typeof rates] || 1;
    return (amount * fromRate) / toRate;
  };

  const handleUpdateSaleItem = (idx: number, field: 'quantity' | 'unit_price', value: string) => {
    if (!selectedSale) return;
    const newItems = [...(selectedSale.items || [])];
    
    // Allow empty string for better UX while typing, treat as 0 for calculations
    const val = value === '' ? 0 : Number(value);
    
    newItems[idx] = { 
      ...newItems[idx], 
      [field]: val,
      total_price: field === 'quantity' ? val * Number(newItems[idx].unit_price) : Number(newItems[idx].quantity) * val
    };
    
    const newTotal = newItems.reduce((acc, curr) => {
      const itemTotal = Number(curr.total_price);
      const converted = getConvertedPrice(itemTotal, curr.currency || selectedSale.currency, selectedSale.currency);
      return acc + converted;
    }, 0);
    setSelectedSale({ ...selectedSale, items: newItems, total_amount: newTotal });
  };

  const handleRemoveSaleItem = (idx: number) => {
    if (!selectedSale) return;
    const newItems = (selectedSale.items || []).filter((_: any, i: number) => i !== idx);
    const newTotal = newItems.reduce((acc, curr) => {
      const itemTotal = Number(curr.total_price);
      const converted = getConvertedPrice(itemTotal, curr.currency || selectedSale.currency, selectedSale.currency);
      return acc + converted;
    }, 0);
    setSelectedSale({ ...selectedSale, items: newItems, total_amount: newTotal });
  };

  const handleCancelPendingSale = async (saleId: number) => {
    if (!window.confirm(t.cancelOrderConfirm)) return;
    try {
      setCompletingSale(true);
      const res = await api.cancelSale(saleId, currentStoreId);
      if (res.success) {
        setShowSaleDetailsModal(false);
        fetchSales();
      } else {
        alert(res.error || "Error cancelling sale");
      }
    } catch (error: any) {
      alert(error.message || "Error cancelling sale");
    } finally {
      setCompletingSale(false);
    }
  };

  const handleCompletePendingSale = async (saleId: number) => {
    try {
      setCompletingSale(true);
      const res = await api.completeSale(saleId, {
        paymentMethod: posPaymentMethod,
        items: selectedSale.items // Send updated items
      }, currentStoreId);
      
      if (res.success) {
        alert(t.saleCompleted);
        if (res.fiscal) {
          alert(`${t.fiscalReceiptGenerated}\n${t.receiptNo}: ${res.fiscal.receiptNo}\nZ No: ${res.fiscal.zNo}`);
        }
        setShowSaleDetailsModal(false);
        fetchSales();
      } else {
        alert(res.error || "Error completing sale");
      }
    } catch (error: any) {
      alert(error.message || "Error completing sale");
    } finally {
      setCompletingSale(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    
    // Plan limit check
    const currentPlan = branding.plan || 'free';
    const limit = planLimits[currentPlan];
    if (!editingProduct && products.length >= limit) {
      alert(lang === 'tr' 
        ? `Hesap planı limitine ulaştınız (${limit} ürün). Lütfen planınızı yükseltin.` 
        : `You have reached your plan limit (${limit} products). Please upgrade your plan.`);
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    // Validation
    const barcode = String(data.barcode || '').trim();
    if (!barcode) {
      alert(lang === 'tr' ? "Lütfen geçerli bir barkod giriniz." : "Please enter a valid barcode.");
      return;
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, data, targetStoreId);
      } else {
        await api.addProduct(data, targetStoreId);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setEnrichedData(null);
      setShowDescription(false);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(t.confirmDelete)) {
      try {
        await api.deleteProduct(id, targetStoreId);
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleDeleteAllProducts = async () => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Tüm ürünleri silmek istediğinize emin misiniz?" : "Are you sure you want to delete all products?")) {
      try {
        await api.deleteAllProducts(targetStoreId);
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleBulkEnrichAI = async () => {
    const productsToEnrich = products.filter(p => !p.description || !p.image_url);
    if (productsToEnrich.length === 0) {
      alert(lang === 'tr' ? "Zenginleştirilecek ürün bulunamadı (tüm ürünlerin açıklaması ve görseli var)." : "No products found to enrich (all products have descriptions and images).");
      return;
    }

    const confirmBulk = window.confirm(lang === 'tr' 
      ? `${productsToEnrich.length} ürün AI ile zenginleştirilecek. Bu işlem biraz zaman alabilir. Devam etmek istiyor musunuz?` 
      : `${productsToEnrich.length} products will be enriched with AI. This may take some time. Do you want to continue?`);
    
    if (!confirmBulk) return;

    let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        apiKey = process.env.API_KEY;
      } else {
        apiKey = process.env.API_KEY;
      }
    }

    if (!apiKey) {
      alert(lang === 'tr' ? "API Key bulunamadı. Lütfen bir anahtar seçin." : "API Key not found. Please select a key.");
      return;
    }

    setIsEnriching(true);
    setEnrichProgress({ current: 0, total: productsToEnrich.length });

    const ai = new GoogleGenAI({ apiKey });

    for (let i = 0; i < productsToEnrich.length; i++) {
      const p = productsToEnrich[i];
      setEnrichProgress({ current: i + 1, total: productsToEnrich.length });

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Sen bir e-ticaret uzmanısın. Ürün: ${p.name}, Barkod: ${p.barcode}. 
          Bu ürün için profesyonel bir açıklama, kategori ve GERÇEK bir görsel URL'si bul.
          Yanıtı JSON formatında ver: {"description": "...", "category": "...", "image_url": "..."}`,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
          }
        });

        const result = JSON.parse(response.text || "{}");
        if (result.description || result.image_url || result.category) {
          await api.updateProduct(p.id, {
            ...p,
            description: p.description || result.description,
            category: p.category || result.category,
            image_url: p.image_url || result.image_url
          }, user.role === 'superadmin' ? currentStoreId : undefined);
        }
      } catch (err) {
        console.error(`Error enriching product ${p.id}:`, err);
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsEnriching(false);
    setEnrichProgress({ current: 0, total: 0 });
    fetchData();
    alert(lang === 'tr' ? "Toplu zenginleştirme tamamlandı!" : "Bulk enrichment completed!");
  };

  const enrichProductWithAI = async (name: string, barcode: string, formElement?: HTMLFormElement) => {
    if (!name && !barcode) {
      alert(lang === 'tr' ? "Lütfen en azından bir ürün adı veya barkod girin." : "Please enter at least a product name or barcode.");
      return;
    }

    setIsEnriching(true);
    try {
      let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      
      if (!apiKey && typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
          // The platform will inject it into process.env.API_KEY.
          // We'll try to get it again after the dialog opens.
          apiKey = process.env.API_KEY;
        } else {
          apiKey = process.env.API_KEY;
        }
      }

      if (!apiKey) {
        const confirmSelect = window.confirm(lang === 'tr' 
          ? "AI zenginleştirme için bir API anahtarı gerekiyor. Şimdi seçmek ister misiniz?" 
          : "An API key is required for AI enrichment. Would you like to select one now?");
        
        if (confirmSelect && (window as any).aistudio) {
          await (window as any).aistudio.openSelectKey();
          return;
        }
        throw new Error(lang === 'tr' ? "API Key bulunamadı. Lütfen sistem ayarlarını kontrol edin." : "API Key not found. Please check system settings.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sen bir e-ticaret ve ürün uzmanısın. Aşağıdaki ürün bilgilerini kullanarak ürün için profesyonel bir açıklama, kategori ve GERÇEK bir ürün görseli URL'si bul.
        
        Ürün Adı: ${name}
        Barkod: ${barcode}
        
        GÖREVLERİN:
        1. Ürün için 2-3 cümlelik profesyonel ve ikna edici bir açıklama yaz.
        2. Ürün için en uygun ana kategoriyi belirle.
        3. Google Search kullanarak bu ürünün GERÇEK, yüksek çözünürlüklü ve temiz (beyaz arka planlı tercih edilir) bir görsel URL'sini (image_url) bul.
        
        Yanıtı MUTLAKA şu JSON formatında ver:
        {
          "description": "...",
          "category": "...",
          "image_url": "https://..."
        }`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              image_url: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      setEnrichedData(result);
      
      // Update form fields if they are empty
      const form = formElement || document.querySelector('form') as HTMLFormElement;
      if (form) {
        const descInput = form.querySelector('[name="description"]') as HTMLTextAreaElement;
        const catInput = form.querySelector('[name="category"]') as HTMLInputElement;
        const imgInput = form.querySelector('[name="image_url"]') as HTMLInputElement;
        
        if (descInput && !descInput.value) descInput.value = result.description || "";
        if (catInput && !catInput.value) catInput.value = result.category || "";
        if (imgInput && !imgInput.value) imgInput.value = result.image_url || "";
      }
      
      setShowDescription(true);
    } catch (error: any) {
      console.error("AI Enrichment error:", error);
      alert((lang === 'tr' ? "AI zenginleştirme sırasında bir hata oluştu: " : "An error occurred during AI enrichment: ") + (error?.message || "Bilinmeyen hata"));
    } finally {
      setIsEnriching(false);
    }
  };

  // Handlers for Import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (data.length > 0) {
        setImportColumns(data[0] as string[]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    // Plan limit check
    const currentPlan = branding.plan || 'free';
    const limit = planLimits[currentPlan];
    if (products.length >= limit) {
      alert(lang === 'tr' 
        ? `Hesap planı limitine ulaştınız (${limit} ürün). Lütfen planınızı yükseltin.` 
        : `You have reached your plan limit (${limit} products). Please upgrade your plan.`);
      return;
    }

    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('mapping', JSON.stringify(mapping));
    if (targetStoreId) formData.append('storeId', targetStoreId.toString());
    
    try {
      setIsImporting(true);
      await api.importProducts(formData, targetStoreId);
      setShowImportModal(false);
      setImportFile(null);
      setImportColumns([]);
      fetchData();
      alert(lang === 'tr' ? "İçe aktarma tamamlandı" : "Import completed");
    } catch (error) {
      alert(lang === 'tr' ? "Hata oluştu" : "An error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportProducts = () => {
    const isTr = lang === 'tr';
    const data = products.map(p => ({
      [isTr ? 'Barkod' : 'Barcode']: p.barcode,
      [isTr ? 'Ürün Adı' : 'Product Name']: p.name,
      [isTr ? 'Kategori' : 'Category']: p.category,
      [isTr ? 'Fiyat' : 'Price']: p.price,
      [isTr ? 'Para Birimi' : 'Currency']: p.currency,
      [isTr ? 'Stok' : 'Stock']: p.stock_quantity,
      [isTr ? 'Açıklama' : 'Description']: p.description
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Ürünler" : "Products");
    XLSX.writeFile(wb, `Urun_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Handlers for Branding
  const handleSaveBranding = async () => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    try {
      await api.updateBranding(branding, targetStoreId);
      alert(t.saveSuccess || (lang === 'tr' ? "Başarıyla kaydedildi" : "Saved successfully"));
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.uploadFile(formData);
      setBranding({ ...branding, [type === 'logo' ? 'logo_url' : 'favicon_url']: res.url });
    } catch (error) {
      alert("Yükleme hatası");
    }
  };

  // Handlers for Quotations
  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    try {
      const newProduct = await api.addProduct({
        name: quickProductForm.name,
        price: Number(quickProductForm.price),
        barcode: quickProductForm.barcode || `M-${Date.now()}`,
        currency: branding.default_currency || 'TRY',
        tax_rate: Number(quickProductForm.tax_rate) || branding.default_tax_rate || 20,
        stock: 0,
        status: 'active'
      }, targetStoreId);

      setQuotationItems([...quotationItems, {
        product_id: newProduct.id,
        product_name: newProduct.name,
        barcode: newProduct.barcode,
        quantity: 1,
        unit_price: Number(newProduct.price),
        tax_rate: Number(newProduct.tax_rate),
        total_price: Number(newProduct.price)
      }]);

      setShowQuickProductModal(false);
      setQuotationProductSearch("");
      fetchData(); // Refresh products list
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleAddQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    if (quotationItems.length === 0) {
      alert(lang === 'tr' ? "En az bir ürün eklemelisiniz" : "You must add at least one product");
      return;
    }

    if (quotationItems.some(item => !item.quantity || item.quantity <= 0)) {
      alert(lang === 'tr' ? "Lütfen tüm ürünler için geçerli bir adet girin" : "Please enter a valid quantity for all products");
      return;
    }

    // Find company_id if it exists
    const matchingCompany = companies.find(c => c.title.toLowerCase().trim() === (data.customer_name as string).toLowerCase().trim());

    const totalAmount = quotationItems.reduce((sum, item) => sum + Number(item.total_price), 0);

    const quotationData = {
      ...data,
      company_id: matchingCompany?.id || null,
      items: quotationItems,
      total_amount: totalAmount,
      currency: branding.default_currency || 'TRY'
    };

    try {
      if (editingQuotation) {
        await api.updateQuotation(editingQuotation.id, quotationData, targetStoreId);
      } else {
        await api.addQuotation(quotationData, targetStoreId);
      }
      setShowQuotationModal(false);
      setEditingQuotation(null);
      setQuotationItems([]);
      fetchData();
      alert(lang === 'tr' ? "Teklif başarıyla kaydedildi" : "Quotation saved successfully");
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleApproveQuotation = async (id: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    try {
      await api.approveQuotation(id, {}, targetStoreId);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleCancelQuotation = async (id: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Bu teklifi iptal etmek istediğinize emin misiniz?" : "Are you sure you want to cancel this quotation?")) {
      try {
        await api.cancelQuotation(id, targetStoreId);
        fetchData();
        alert(lang === 'tr' ? "Teklif iptal edildi" : "Quotation cancelled");
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleConvertToSale = (quotation: any) => {
    setSelectedQuotation(quotation);
    setPaymentMethod('cash');
    setDueDate('');
    setSaleNotes('');
    setShowSaleModal(true);
  };

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotation) return;
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;

    setIsConfirmingSale(true);
    try {
      let companyId = selectedQuotation.company_id;

      // Create company if requested and not already linked
      if (createCompanyFromSale && !companyId) {
        const newCompany = await api.addCompany({
          title: selectedQuotation.customer_title || selectedQuotation.customer_name,
          email: selectedQuotation.customer_email || '',
          phone: selectedQuotation.customer_phone || '',
          address: selectedQuotation.customer_address || '',
          tax_office: '',
          tax_number: ''
        }, targetStoreId);
        companyId = newCompany.id;
        
        // Update quotation with new company_id
        await api.updateQuotation(selectedQuotation.id, {
          ...selectedQuotation,
          company_id: companyId
        }, targetStoreId);
      }

      const saleData = {
        payment_method: paymentMethod,
        due_date: paymentMethod === 'term' ? dueDate : null,
        notes: saleNotes
      };

      await api.approveQuotation(selectedQuotation.id, saleData, targetStoreId);
      
      setShowSaleModal(false);
      setSelectedQuotation(null);
      setCreateCompanyFromSale(false);
      fetchData();
      alert(lang === 'tr' ? "Satış başarıyla kaydedildi" : "Sale recorded successfully");
    } catch (error: any) {
      alert(error.response?.data?.error || (lang === 'tr' ? "Hata oluştu" : "An error occurred"));
    } finally {
      setIsConfirmingSale(false);
    }
  };

  const handleDeleteQuotation = async (id: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(t.deleteQuotationConfirm || "Bu teklifi silmek istediğinize emin misiniz?")) {
      try {
        await api.deleteQuotation(id, targetStoreId);
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  // Handlers for Companies
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    try {
      if (editingCompany) {
        await api.updateCompany(editingCompany.id, data, targetStoreId);
      } else {
        await api.addCompany(data, targetStoreId);
      }
      setShowCompanyModal(false);
      setEditingCompany(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || (lang === 'tr' ? "Hata oluştu" : "An error occurred"));
    }
  };

  const handleDeleteCompany = async (id: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Bu cari hesabı silmek istediğinize emin misiniz?" : "Are you sure you want to delete this company?")) {
      try {
        await api.deleteCompany(id, targetStoreId);
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  // Handlers for Users
  const handleGenerateQuotationPDF = async (quotation: any) => {
    const doc = new jsPDF();
    const isTr = lang === 'tr';
    
    // Helper to fix Turkish characters for jsPDF default fonts
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
      const storeName = fixTr(branding.name || branding.store_name || "LookPrice");
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
      doc.text(fixTr(`${branding.name || "LookPrice"} - ${isTr ? "Teklif Formu" : "Quotation Form"}`), 14, 290);
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

    // Items Table
    const tableData = quotation.items.map((item: any) => [
      fixTr(`${item.product_name}\n(${item.barcode || `#${item.product_id}`})`),
      item.quantity,
      `${Number(item.unit_price).toLocaleString('tr-TR')} ${quotation.currency}`,
      `${Number(item.total_price).toLocaleString('tr-TR')} ${quotation.currency}`
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
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2, font: "helvetica" },
      columnStyles: {
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 }
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
    if (finalY > 270) {
      doc.addPage();
      addHeader(doc);
      finalY = 35;
    }

    // Summary Section
    doc.setDrawColor(230);
    doc.line(130, finalY, 196, finalY);
    finalY += 6;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(fixTr(isTr ? "Ara Toplam" : "Subtotal"), 130, finalY);
    doc.text(`${Number(quotation.total_amount).toLocaleString('tr-TR')} ${quotation.currency}`, 196, finalY, { align: 'right' });
    
    finalY += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(fixTr(isTr ? "GENEL TOPLAM" : "GRAND TOTAL"), 130, finalY);
    doc.text(`${Number(quotation.total_amount).toLocaleString('tr-TR')} ${quotation.currency}`, 196, finalY, { align: 'right' });

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
      doc.text(fixTr(isTr ? "Notlar ve Koşullar:" : "Notes & Terms:"), 14, finalY);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      const splitNotes = doc.splitTextToSize(fixTr(quotation.notes), 180);
      doc.text(splitNotes, 14, finalY + 5);
    }

    // Add page numbers to all pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(doc, i, totalPages);
    }

    doc.save(`Teklif_${quotation.id}_${quotation.customer_name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDeleteSale = async (id: number) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await api.deleteSale(id, currentStoreId);
        fetchSales();
        fetchData(); // Refresh analytics too
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleExportSales = () => {
    const isTr = lang === 'tr';
    const data = sales.map(s => ({
      [isTr ? 'Sipariş Kodu' : 'Order Code']: `#${s.id}`,
      [isTr ? 'Tarih' : 'Date']: new Date(s.created_at).toLocaleString(isTr ? 'tr-TR' : 'en-US'),
      [isTr ? 'Müşteri' : 'Customer']: s.customer_name || '-',
      [isTr ? 'Tutar' : 'Amount']: s.total_amount,
      [isTr ? 'Para Birimi' : 'Currency']: s.currency,
      [isTr ? 'Ödeme Yöntemi' : 'Payment Method']: s.payment_method,
      [isTr ? 'Durum' : 'Status']: s.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Satışlar" : "Sales");
    XLSX.writeFile(wb, `Satis_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportCompanies = () => {
    const isTr = lang === 'tr';
    const filteredCompanies = includeZeroBalance ? companies : companies.filter(c => parseFloat(c.balance) !== 0);
    const data = filteredCompanies.map(c => ({
      [isTr ? 'Şirket Ünvanı' : 'Company Name']: c.title,
      [isTr ? 'Vergi Dairesi' : 'Tax Office']: c.tax_office || '-',
      [isTr ? 'Vergi No' : 'Tax Number']: c.tax_number || '-',
      [isTr ? 'Telefon' : 'Phone']: c.phone || '-',
      [isTr ? 'E-posta' : 'Email']: c.email || '-',
      [isTr ? 'Bakiye' : 'Balance']: c.balance,
      [isTr ? 'Vade' : 'Due Date']: ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Şirketler" : "Companies");
    XLSX.writeFile(wb, `Sirket_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportQuotations = () => {
    const isTr = lang === 'tr';
    const data = quotations.map(q => ({
      [isTr ? 'Teklif No' : 'Quotation No']: q.id,
      [isTr ? 'Tarih' : 'Date']: new Date(q.created_at).toLocaleDateString('tr-TR'),
      [isTr ? 'Müşteri' : 'Customer']: q.customer_name,
      [isTr ? 'Tutar' : 'Amount']: `${Number(q.total_amount).toLocaleString('tr-TR')} ${q.currency}`,
      [isTr ? 'Durum' : 'Status']: q.status === 'approved' || q.status === 'completed' ? (isTr ? 'Tamamlandı' : 'Completed') : q.status === 'cancelled' ? (isTr ? 'İptal Edildi' : 'Cancelled') : (isTr ? 'Beklemede' : 'Pending')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Teklifler" : "Quotations");
    XLSX.writeFile(wb, `Teklif_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const handleFetchTransactions = async (companyId: number) => {
    try {
      setTransactionLoading(true);
      const storeQuery = currentStoreId ? `&storeId=${currentStoreId}` : '';
      const res = await api.get(`/api/store/companies/${companyId}/transactions?startDate=${transactionStartDate}&endDate=${transactionEndDate}${storeQuery}`);
      setCompanyTransactions(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Fetch transactions error:", error);
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleExportTransactionsPDF = async () => {
    if (!selectedCompany) return;
    const isTr = lang === 'tr';
    const doc = new jsPDF();

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

    let yPos = 20;

    // Logo (if exists) - Larger and positioned better
    if (branding.logo_url) {
      try {
        const logoBase64 = await getBase64Image(branding.logo_url);
        // Larger logo: 40x20 or similar
        doc.addImage(logoBase64, 'PNG', 14, 10, 40, 15);
        yPos = 30;
      } catch (e) {
        console.error("Logo addImage error:", e);
      }
    }

    // Store Branding Info - Using branding.name or store_name
    const storeTitle = branding.name || branding.store_name || "LookPrice";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0);
    // If logo exists, we might want to move the title or keep it if it's different
    doc.text(fixTr(storeTitle), 14, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    yPos += 5;
    
    const addressLines = doc.splitTextToSize(fixTr(branding.address || ""), 80);
    doc.text(addressLines, 14, yPos);
    yPos += (addressLines.length * 4);
    
    if (branding.phone) {
      doc.text(fixTr(branding.phone), 14, yPos);
      yPos += 4;
    }
    
    // Separator
    doc.setDrawColor(230);
    doc.line(14, yPos + 2, 196, yPos + 2);
    yPos += 12;
    
    // Centered Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    const titleText = fixTr(isTr ? "Cari Hesap Ekstresi" : "Account Statement");
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (210 - titleWidth) / 2, yPos);
    yPos += 12;
    
    // Customer Info Box
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, yPos, 182, 22, 1, 1, 'F');
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(fixTr(isTr ? "Cari Bilgileri" : "Account Information"), 18, yPos + 6);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    doc.setFontSize(10);
    doc.text(fixTr(selectedCompany.title), 18, yPos + 12);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`${isTr ? "Tarih Aralığı:" : "Date Range:"} ${new Date(transactionStartDate).toLocaleDateString('tr-TR')} - ${new Date(transactionEndDate).toLocaleDateString('tr-TR')}`, 18, yPos + 18);
    yPos += 30;

    let runningBalance = 0;
    const tableData = companyTransactions.map((t: any) => {
      const amount = Number(t.amount);
      if (t.type === 'debt') runningBalance += amount;
      else runningBalance -= amount;

      return [
        new Date(t.transaction_date).toLocaleDateString('tr-TR'),
        fixTr(t.description),
        t.type === 'debt' ? amount.toLocaleString('tr-TR') : "",
        t.type === 'credit' ? amount.toLocaleString('tr-TR') : "",
        runningBalance.toLocaleString('tr-TR')
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [[
        fixTr(isTr ? "Tarih" : "Date"),
        fixTr(isTr ? "Açıklama" : "Description"),
        fixTr(isTr ? "Borç" : "Debt"),
        fixTr(isTr ? "Alacak" : "Credit"),
        fixTr(isTr ? "Bakiye" : "Balance")
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, font: "helvetica", cellPadding: 2 },
      columnStyles: {
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 25 }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY || yPos;
    
    // Summary Box
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(130, finalY + 5, 66, 12, 1, 1, 'F');
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(fixTr(isTr ? "Güncel Bakiye" : "Current Balance"), 134, finalY + 10);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`${runningBalance.toLocaleString('tr-TR')} ${branding.default_currency}`, 192, finalY + 14, { align: 'right' });

    finalY += 25;

    // Notes Section
    if (finalY > 260) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50);
    doc.text(fixTr(isTr ? "Notlar ve Açıklamalar:" : "Notes & Remarks:"), 14, finalY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    const notes = isTr ? [
      "1. Bu ekstre bilgilendirme amacli hazirlanmistir.",
      "2. Mutabakat icin lutfen 7 is gunu icerisinde itiraz ediniz.",
      "3. Itiraz edilmeyen ekstreler taraflarca kabul edilmis sayilir.",
      "4. Odemelerinizi banka hesaplarimiza aciklama belirterek yapabilirsiniz."
    ] : [
      "1. This statement is for informational purposes only.",
      "2. Please object within 7 business days for reconciliation.",
      "3. Statements not objected to are considered accepted.",
      "4. You can make payments to our bank accounts with a description."
    ];

    notes.forEach((note, index) => {
      doc.text(fixTr(note), 14, finalY + 6 + (index * 4));
    });

    doc.save(`${selectedCompany.title}_Ekstre_${new Date().toISOString().split('T')[0]}.pdf`);
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
    } catch (error) {
      alert("Hata oluştu");
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
    { id: "quotations", label: lang === 'tr' ? 'Teklifler / Satış' : 'Quotations / Sales', icon: FileText },
    { id: "purchase_invoices", label: lang === 'tr' ? 'Alış Faturaları' : 'Purchase Invoices', icon: FileDown },
    { id: "companies", label: lang === 'tr' ? 'Cari Hesaplar' : 'Current Accounts', icon: Store },
    { id: "pos", label: lang === 'tr' ? 'Satışlar' : 'Sales', icon: CreditCard },
    { id: "settings", label: t.settings, icon: SettingsIcon },
  ];

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
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">LookPrice</h1>
                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">System v4.2.0</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 mb-2">Core Modules</div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`h-4 w-4 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="tracking-tight">{item.label}</span>
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
                <span className="tracking-tight">{lang === 'tr' ? 'Mağaza Web Sitesi' : 'Store Website'}</span>
              </a>
              <a
                href={scanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
              >
                <Scan className="h-4 w-4" />
                <span className="tracking-tight">{lang === 'tr' ? 'Barkod Okuyucu' : 'Barcode Scanner'}</span>
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
        {/* Header - Modern Control Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden md:flex flex-col">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                {branding.store_name || branding.name}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Store ID:</span>
                <span className="text-[10px] font-medium text-slate-600">{currentStoreId}</span>
                <span className="text-slate-200">•</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operator:</span>
                <span className="text-[10px] font-medium text-slate-600">{user.email}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-1.5 space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Plan Tier</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">{branding.plan || 'Free'}</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Inventory Load</span>
                <span className="text-[10px] font-bold text-slate-700">{products.length} / {planLimits[branding.plan || 'free']}</span>
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(true)}
              className="tech-button flex items-center space-x-2 bg-indigo-600 text-white hover:bg-indigo-700 border-none"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">{lang === 'tr' ? 'Mağaza Linki' : 'Store Link'}</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Analytical Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-slate-200">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  <span>Module: {activeTab.toUpperCase()}</span>
                </div>
                <h3 className="text-4xl font-bold text-slate-900 tracking-tight">
                  {t[activeTab as keyof typeof t] || activeTab}
                </h3>
                <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                  Bu modül, mağazanızın {activeTab === 'products' ? 'envanter verilerini' : 
                                       activeTab === 'pos' ? 'satış ve ödeme işlemlerini' :
                                       activeTab === 'quotations' ? 'teklif ve proforma süreçlerini' :
                                       activeTab === 'purchase_invoices' ? 'alış faturalarını ve tedarik işlemlerini' :
                                       activeTab === 'companies' ? 'cari hesap ve finansal ilişkilerini' :
                                       activeTab === 'analytics' ? 'performans metriklerini' : 'sistem yapılandırmasını'} 
                  yönetmenize olanak tanır. Veriler gerçek zamanlı olarak senkronize edilir ve operasyonel verimlilik için optimize edilmiştir.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {activeTab === 'products' && (
                  <>
                    <button onClick={() => setShowImportModal(true)} className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all shadow-sm">
                      <Upload className="h-4 w-4" />
                      <span>Import Data</span>
                    </button>
                    <button onClick={() => { setEditingProduct(null); setShowProductModal(true); }} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                      <Plus className="h-4 w-4" />
                      <span>Add Entry</span>
                    </button>
                  </>
                )}
                {activeTab === 'quotations' && (
                  <button onClick={() => { setEditingQuotation(null); setQuotationItems([]); setShowQuotationModal(true); }} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    <Plus className="h-4 w-4" />
                    <span>New Quotation</span>
                  </button>
                )}
                {activeTab === 'companies' && (
                  <button onClick={() => { setEditingCompany(null); setShowCompanyModal(true); }} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    <Plus className="h-4 w-4" />
                    <span>Register Company</span>
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
              >
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
                        onShowQr={() => setShowQrModal(true)}
                        onEnrichAI={(p) => {
                          setEditingProduct(p);
                          setShowProductModal(true);
                          setTimeout(() => {
                            const form = document.querySelector('form') as HTMLFormElement;
                            if (form) {
                              enrichProductWithAI(p.name, p.barcode, form);
                            }
                          }, 100);
                        }}
                        onBulkEnrichAI={handleBulkEnrichAI}
                        isEnriching={isEnriching}
                        enrichProgress={enrichProgress}
                        branding={branding}
                      />
                    )}
                    {activeTab === "analytics" && (
                      <AnalyticsTab analytics={analytics} branding={branding} />
                    )}
                    {activeTab === "quotations" && (
                      <QuotationsTab 
                        quotations={quotations}
                        isViewer={isViewer}
                        onViewDetails={(q) => { setSelectedQuotationDetails(q); setShowQuotationDetailsModal(true); }}
                        onGeneratePDF={handleGenerateQuotationPDF}
                        onApprove={handleApproveQuotation}
                        onCancel={handleCancelQuotation}
                        onConvertToSale={handleConvertToSale}
                        onEdit={(q) => { 
                          setEditingQuotation(q); 
                          setQuotationItems((q.items || []).map((item: any) => ({
                            ...item,
                            unit_price: Number(item.unit_price),
                            total_price: Number(item.total_price)
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
                    {activeTab === "settings" && (
                      <SettingsTab 
                        branding={branding}
                        onBrandingChange={(field, value) => setBranding({ ...branding, [field]: value })}
                        onSaveBranding={handleSaveBranding}
                        onLogoUpload={(e) => handleFileUpload(e, 'logo')}
                        onFaviconUpload={(e) => handleFileUpload(e, 'favicon')}
                        onAddUser={() => setShowUserModal(true)}
                        onDeleteUser={handleDeleteUser}
                        users={users}
                        currentUser={user}
                      />
                    )}
                  </>
                )}
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
                    <h3 className="text-2xl font-black text-gray-900">Mağaza QR Kodu</h3>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Müşterileriniz için paylaşın</p>
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
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{lang === 'tr' ? 'MAĞAZA WEB SİTESİ' : 'STORE WEBSITE'}</p>
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
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{lang === 'tr' ? 'BARKOD OKUYUCU' : 'BARCODE SCANNER'}</p>
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
                      <span>Yazdır</span>
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
                      <span>İndir</span>
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
                  <h3 className="text-xl font-bold text-gray-900">{lang === 'tr' ? 'Alış Faturası Detayı' : 'Purchase Invoice Details'}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">#{selectedPurchaseInvoice.invoice_number}</p>
                </div>
                <button onClick={() => setShowPurchaseInvoiceDetailsModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'Fatura Tarihi' : 'Invoice Date'}</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(selectedPurchaseInvoice.invoice_date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'Ödeme Yöntemi' : 'Payment Method'}</p>
                    <p className="text-sm font-bold text-gray-900 uppercase">{selectedPurchaseInvoice.payment_method || '-'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">{lang === 'tr' ? 'Ürünler' : 'Products'}</p>
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Ürün' : 'Product'}</th>
                          <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{lang === 'tr' ? 'Adet' : 'Qty'}</th>
                          <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{lang === 'tr' ? 'Birim' : 'Unit'}</th>
                          <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{lang === 'tr' ? 'Toplam' : 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(selectedPurchaseInvoice.items || []).map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-3 px-4 text-xs font-bold text-gray-700">{item.product_name}</td>
                            <td className="py-3 px-4 text-xs font-bold text-gray-700 text-right">{item.quantity}</td>
                            <td className="py-3 px-4 text-xs font-bold text-gray-700 text-right">{Number(item.unit_price).toLocaleString('tr-TR')}</td>
                            <td className="py-3 px-4 text-xs font-black text-gray-900 text-right">{Number(item.total_price).toLocaleString('tr-TR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold opacity-80 uppercase tracking-widest">{lang === 'tr' ? 'GENEL TOPLAM' : 'GRAND TOTAL'}</span>
                    <span className="text-xl font-black">{Number(selectedPurchaseInvoice.grand_total).toLocaleString('tr-TR')} {selectedPurchaseInvoice.currency}</span>
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
                  <h3 className="text-xl font-bold text-gray-900">{lang === 'tr' ? 'Satış Detayı' : 'Sale Details'}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">#{selectedSale.id} • {new Date(selectedSale.created_at).toLocaleString('tr-TR')}</p>
                </div>
                <button onClick={() => setShowSaleDetailsModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.customer}</p>
                    <p className="font-bold text-gray-900">{selectedSale.customer_name || "-"}</p>
                    {selectedSale.customer_phone && (
                      <p className="text-xs text-gray-500 mt-1 font-medium">{selectedSale.customer_phone}</p>
                    )}
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t.amount}</p>
                    <p className="text-xl font-black text-indigo-600">{Number(selectedSale.total_amount).toLocaleString('tr-TR')} {selectedSale.currency}</p>
                  </div>
                </div>

                {selectedSale.customer_address && (
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'TESLİMAT ADRESİ' : 'DELIVERY ADDRESS'}</p>
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
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.barcode || `#${item.product_id}`}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {selectedSale.status === 'pending' ? (
                                <input 
                                  type="number" 
                                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center font-bold"
                                  value={item.quantity === 0 ? '' : item.quantity}
                                  onChange={(e) => handleUpdateSaleItem(idx, 'quantity', e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  min="1"
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
                                      type="number" 
                                      className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-right font-bold text-indigo-600"
                                      value={item.unit_price === 0 ? '' : item.unit_price}
                                      onChange={(e) => handleUpdateSaleItem(idx, 'unit_price', e.target.value)}
                                      onFocus={(e) => e.target.select()}
                                    />
                                    <span className="text-[10px] font-bold text-gray-400">{item.currency || selectedSale.currency}</span>
                                  </div>
                                  <div className="text-[10px] font-black text-gray-900">
                                    {t.total}: {Number(item.total_price).toLocaleString('tr-TR')} {item.currency || selectedSale.currency}
                                  </div>
                                  <button 
                                    onClick={() => handleRemoveSaleItem(idx)}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="font-bold text-gray-900">{Number(item.total_price).toLocaleString('tr-TR')} {item.currency || selectedSale.currency}</span>
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
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.barcode || `#${item.product_id}`}</div>
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
                                type="number" 
                                className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-center font-bold text-sm"
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => handleUpdateSaleItem(idx, 'quantity', e.target.value)}
                                onFocus={(e) => e.target.select()}
                                min="1"
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
                                  type="number" 
                                  className="w-24 px-2 py-1 bg-white border border-gray-200 rounded-lg text-right font-bold text-sm text-indigo-600"
                                  value={item.unit_price === 0 ? '' : item.unit_price}
                                  onChange={(e) => handleUpdateSaleItem(idx, 'unit_price', e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                />
                                <span className="text-[10px] font-bold text-gray-400">{item.currency || selectedSale.currency}</span>
                              </div>
                            ) : (
                              <span className="font-bold text-gray-900">{Number(item.total_price).toLocaleString('tr-TR')} {item.currency || selectedSale.currency}</span>
                            )}
                          </div>
                        </div>
                        {selectedSale.status === 'pending' && (
                          <div className="text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            {t.total}: {Number(item.total_price).toLocaleString('tr-TR')} {item.currency || selectedSale.currency}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSale.notes && (
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">{t.notes}</p>
                    <p className="text-sm text-orange-700">{selectedSale.notes}</p>
                  </div>
                )}

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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{lang === 'tr' ? 'Teklif Detayı' : 'Quotation Details'}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">#{selectedQuotationDetails.id} • {new Date(selectedQuotationDetails.created_at).toLocaleString('tr-TR')}</p>
                </div>
                <button onClick={() => setShowQuotationDetailsModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.customer}</p>
                    <p className="font-bold text-gray-900">{selectedQuotationDetails.customer_name}</p>
                    {selectedQuotationDetails.customer_title && <p className="text-xs text-gray-500 mt-1">{selectedQuotationDetails.customer_title}</p>}
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t.amount}</p>
                    <p className="text-xl font-black text-indigo-600">{Number(selectedQuotationDetails.total_amount).toLocaleString('tr-TR')} {selectedQuotationDetails.currency}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.items || 'Ürünler'}</h4>
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 font-bold text-gray-600">{t.productName}</th>
                          <th className="px-4 py-2 font-bold text-gray-600 text-center">{t.quantity}</th>
                          <th className="px-4 py-2 font-bold text-gray-600 text-right">{t.total}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedQuotationDetails.items?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-900">{item.product_name}</div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.barcode || `#${item.product_id}`}</div>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">{Number(item.total_price).toLocaleString('tr-TR')} {selectedQuotationDetails.currency}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedQuotationDetails.notes && (
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">{t.notes}</p>
                    <p className="text-sm text-orange-700">{selectedQuotationDetails.notes}</p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button 
                  onClick={() => handleGenerateQuotationPDF(selectedQuotationDetails)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  <FileDown className="h-5 w-5" /> {lang === 'tr' ? 'PDF İndir' : 'Download PDF'}
                </button>
                {selectedQuotationDetails.status === 'pending' && !isViewer && (
                  <button 
                    onClick={() => { setShowQuotationDetailsModal(false); handleConvertToSale(selectedQuotationDetails); }}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    {lang === 'tr' ? 'Satışa Dönüştür' : 'Convert to Sale'}
                  </button>
                )}
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
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.endDate}</label>
                    <input 
                      type="date" 
                      value={reportEndDate} 
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
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
                          {Number(data.total_amount).toLocaleString('tr-TR')} {branding.default_currency}
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
                        {(dailyReportData.summary || []).reduce((acc, curr) => acc + Number(curr.total_amount), 0).toLocaleString('tr-TR')} {branding.default_currency}
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
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'Cari Hesap Hareketleri' : 'Account Transactions'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowAddTransactionModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {lang === 'tr' ? 'Yeni İşlem' : 'New Transaction'}
                  </button>
                  <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white border-b border-gray-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Başlangıç' : 'Start'}</label>
                  <input 
                    type="date" 
                    value={transactionStartDate}
                    onChange={(e) => setTransactionStartDate(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Bitiş' : 'End'}</label>
                  <input 
                    type="date" 
                    value={transactionEndDate}
                    onChange={(e) => setTransactionEndDate(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button 
                  onClick={() => handleFetchTransactions(selectedCompany.id)}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
                  title={lang === 'tr' ? 'Yenile' : 'Refresh'}
                >
                  <History className={`h-4 w-4 ${transactionLoading ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={handleExportTransactionsPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all"
                >
                  <FileDown className="h-4 w-4" />
                  {lang === 'tr' ? 'PDF Ekstre' : 'PDF Statement'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">{lang === 'tr' ? 'GÜNCEL BAKİYE' : 'CURRENT BALANCE'}</p>
                    <p className="text-2xl font-black">
                      {Number((companies.find(c => c.id === selectedCompany.id) || selectedCompany).balance).toLocaleString('tr-TR')} {branding.default_currency}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'TOPLAM BORÇ' : 'TOTAL DEBT'}</p>
                    <p className="text-2xl font-black text-red-600">
                      {companyTransactions.filter(t => t.type === 'debt').reduce((acc, t) => acc + Number(t.amount), 0).toLocaleString('tr-TR')} {branding.default_currency}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'TOPLAM ALACAK' : 'TOTAL CREDIT'}</p>
                    <p className="text-2xl font-black text-green-600">
                      {companyTransactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + Number(t.amount), 0).toLocaleString('tr-TR')} {branding.default_currency}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {transactionLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
                      <p className="text-gray-500 font-medium">{t.loading}</p>
                    </div>
                  ) : companyTransactions.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">{lang === 'tr' ? 'Seçili tarihlerde hareket bulunmuyor' : 'No transactions in selected dates'}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Tarih' : 'Date'}</th>
                            <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Açıklama' : 'Description'}</th>
                            <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{lang === 'tr' ? 'Borç' : 'Debt'}</th>
                            <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{lang === 'tr' ? 'Alacak' : 'Credit'}</th>
                            <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{lang === 'tr' ? 'Bakiye' : 'Balance'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            let runningBalance = 0;
                            return companyTransactions.map((t: any) => {
                              const amount = Number(t.amount);
                              if (t.type === 'debt') runningBalance += amount;
                              else runningBalance -= amount;

                              return (
                                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-all group">
                                  <td className="py-4 px-4">
                                    <p className="text-xs font-bold text-gray-900">{new Date(t.transaction_date).toLocaleDateString('tr-TR')}</p>
                                    {t.due_date && (
                                      <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter">
                                        {lang === 'tr' ? 'Vade: ' : 'Due: '} {new Date(t.due_date).toLocaleDateString('tr-TR')}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-4 px-4">
                                    <p className="text-xs font-bold text-gray-700">{t.description}</p>
                                    <div className="flex gap-2 mt-1">
                                      {t.sale_id && (
                                        <button 
                                          onClick={() => {
                                            setSelectedSale({ id: t.sale_id });
                                            setShowSaleDetailsModal(true);
                                          }}
                                          className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest hover:underline"
                                        >
                                          #{t.sale_id} {lang === 'tr' ? 'Satış' : 'Sale'}
                                        </button>
                                      )}
                                      {t.purchase_invoice_id && (
                                        <button 
                                          onClick={() => handleFetchPurchaseInvoiceDetails(t.purchase_invoice_id)}
                                          className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest hover:underline"
                                        >
                                          #{t.purchase_invoice_number || t.purchase_invoice_id} {lang === 'tr' ? 'Alış' : 'Purchase'}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    {t.type === 'debt' ? (
                                      <span className="text-xs font-black text-red-600">{amount.toLocaleString('tr-TR')}</span>
                                    ) : '-'}
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    {t.type === 'credit' ? (
                                      <span className="text-xs font-black text-green-600">{amount.toLocaleString('tr-TR')}</span>
                                    ) : '-'}
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <span className={`text-xs font-black ${runningBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                      {runningBalance.toLocaleString('tr-TR')}
                                    </span>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
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
                  <h3 className="text-xl font-bold text-gray-900">{lang === 'tr' ? 'Yeni İşlem Ekle' : 'Add New Transaction'}</h3>
                  <p className="text-xs text-gray-500 font-medium">{selectedCompany.name}</p>
                </div>
                <button onClick={() => setShowAddTransactionModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'tr' ? 'Mevcut Bakiye' : 'Current Balance'}</span>
                  <span className={`font-black ${Number(selectedCompany.balance) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {Math.abs(Number(selectedCompany.balance)).toLocaleString('tr-TR')} {branding.default_currency}
                    {Number(selectedCompany.balance) < 0 ? (lang === 'tr' ? ' (Borçlu)' : ' (Debt)') : (lang === 'tr' ? ' (Alacaklı)' : ' (Credit)')}
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
                  <input 
                    type="number" 
                    required 
                    value={newTransactionAmount}
                    onChange={(e) => setNewTransactionAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder="0.00"
                  />
                </div>

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
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
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
                      {Number(selectedQuotation.total_amount).toLocaleString('tr-TR')} {selectedQuotation.currency}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.paymentMethod || 'Ödeme Yöntemi'}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['cash', 'credit_card', 'bank', 'term'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method as any)}
                        className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                          paymentMethod === method 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                            : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'
                        }`}
                      >
                        {t[method] || method}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'term' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.dueDate || 'Vade Tarihi'}</label>
                    <input 
                      type="date" 
                      required 
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </motion.div>
                )}

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
        {showProductModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingProduct ? t.editProduct : t.addManual}
                </h3>
                <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                {/* Row 1: Barcode */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.barcode}</label>
                  <input 
                    name="barcode" 
                    required 
                    defaultValue={editingProduct?.barcode} 
                    placeholder="869..."
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono" 
                  />
                </div>

                {/* Row 2: Product Name */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.productName}</label>
                    <div className="flex items-center gap-2">
                      {!(process.env.GEMINI_API_KEY || process.env.API_KEY) && (window as any).aistudio && (
                        <button
                          type="button"
                          onClick={() => (window as any).aistudio.openSelectKey()}
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
                        >
                          <Key className="h-3 w-3" />
                          {lang === 'tr' ? 'KEY SEÇ' : 'SELECT KEY'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          const form = e.currentTarget.closest('form') as HTMLFormElement;
                          const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value;
                          const barcode = (form.querySelector('[name="barcode"]') as HTMLInputElement)?.value;
                          enrichProductWithAI(name, barcode, form);
                        }}
                        disabled={isEnriching}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {isEnriching ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {lang === 'tr' ? 'AI SİHİRBAZI' : 'AI MAGIC'}
                      </button>
                    </div>
                  </div>
                  <input 
                    name="name" 
                    required 
                    defaultValue={editingProduct?.name} 
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-semibold" 
                  />
                </div>

                {/* Row 2.5: Category & Image URL */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" /> {lang === 'tr' ? 'KATEGORİ' : 'CATEGORY'}
                    </label>
                    <input 
                      name="category" 
                      defaultValue={editingProduct?.category} 
                      placeholder={lang === 'tr' ? 'Örn: Elektronik' : 'e.g. Electronics'}
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                    />
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

                {/* Row 3: Price & Currency */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="space-y-1 col-span-8">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.price}</label>
                    <input 
                      name="price" 
                      type="number" 
                      step="0.01" 
                      required 
                      defaultValue={editingProduct?.price} 
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-600 text-lg" 
                    />
                  </div>
                  <div className="space-y-1 col-span-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.currency}</label>
                    <select 
                      name="currency" 
                      defaultValue={editingProduct?.currency || branding.default_currency} 
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                {/* Row 3.5: Cost Price & Currency */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="space-y-1 col-span-8">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Maliyet' : 'Cost Price'}</label>
                    <input 
                      name="cost_price" 
                      type="number" 
                      step="0.01" 
                      defaultValue={editingProduct?.cost_price || 0} 
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-600 text-lg" 
                    />
                  </div>
                  <div className="space-y-1 col-span-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Maliyet Para Birimi' : 'Cost Currency'}</label>
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

                {/* Row 3.7: Tax Rate */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'KDV ORANI (%)' : 'TAX RATE (%)'}</label>
                  <input 
                    name="tax_rate" 
                    type="number" 
                    step="0.1"
                    defaultValue={editingProduct?.tax_rate !== undefined ? editingProduct.tax_rate : (branding?.default_tax_rate || 20)} 
                    onFocus={(e) => e.target.select()}
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" 
                  />
                </div>

                {/* Row 4: Stock, Unit, Min Stock */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="space-y-1 col-span-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.stock || 'Stok'}</label>
                    <input 
                      name="stock_quantity" 
                      type="number" 
                      max={999999}
                      defaultValue={editingProduct?.stock_quantity || 0} 
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono" 
                    />
                  </div>
                  <div className="space-y-1 col-span-5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.unit || 'Birim'}</label>
                    <select 
                      name="unit" 
                      defaultValue={editingProduct?.unit || 'Adet'} 
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="Adet">{lang === 'tr' ? 'Adet' : 'Pcs'}</option>
                      <option value="Kg">Kg</option>
                      <option value="Gr">Gr</option>
                      <option value="L">L</option>
                      <option value="Ml">Ml</option>
                      <option value="Metre">Metre (m)</option>
                      <option value="Paket">{lang === 'tr' ? 'Paket' : 'Pkg'}</option>
                      <option value="Koli">{lang === 'tr' ? 'Koli' : 'Box'}</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.minStock || 'Min'}</label>
                    <input 
                      name="min_stock_level" 
                      type="number" 
                      max={999}
                      defaultValue={editingProduct?.min_stock_level || 5} 
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    type="button"
                    onClick={() => setShowDescription(!showDescription)}
                    className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                  >
                    {t.description}
                    {showDescription ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  
                  <AnimatePresence>
                    {showDescription && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <textarea 
                          name="description" 
                          defaultValue={editingProduct?.description} 
                          className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none" 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowProductModal(false)} 
                    className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
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
                        <li>Sütunlar: Barkod, Ürün Adı, Kategori, Fiyat, Açıklama, Stok Adedi</li>
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
                          { key: 'price', label: t.price, required: true },
                          { key: 'description', label: t.description, required: false },
                          { key: 'stock_quantity', label: t.stock, required: false },
                          { key: 'unit', label: t.unit, required: false }
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
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
                  <input name="username" type="email" required className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-30">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingQuotation ? (lang === 'tr' ? 'Teklifi Düzenle' : 'Edit Quotation') : (lang === 'tr' ? 'Yeni Teklif' : 'New Quotation')}
                </h3>
                <button onClick={() => setShowQuotationModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleAddQuotation} className="flex flex-col h-full max-h-[90vh]">
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
                        if (company) {
                          const titleInput = (e.target as HTMLInputElement).form?.elements.namedItem('customer_title') as HTMLInputElement;
                          if (titleInput) titleInput.value = company.representative || company.contact_person || '';
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                      placeholder={lang === 'tr' ? 'Firma ismi yazın veya seçin...' : 'Type or select company name...'}
                    />
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
                        p.name.toLowerCase().includes(quotationProductSearch.toLowerCase()) || 
                        p.barcode.toLowerCase().includes(quotationProductSearch.toLowerCase())
                      ).map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className="product-option w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                          onClick={() => {
                            const existingIdx = quotationItems.findIndex(item => item.product_id === p.id);
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
                                unit_price: Number(p.price),
                                tax_rate: Number(p.tax_rate) || branding.default_tax_rate || 20,
                                total_price: Number(p.price)
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
                              {p.price} {p.currency}
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
                              value={item.tax_rate === 0 ? '' : item.tax_rate}
                              onChange={(e) => {
                                const tax = parseFloat(e.target.value) || 0;
                                const newItems = [...quotationItems];
                                newItems[idx] = { ...newItems[idx], tax_rate: tax };
                                setQuotationItems(newItems);
                              }}
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

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 sticky bottom-0 z-30">
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
                        required
                        value={quickProductForm.tax_rate}
                        onChange={(e) => setQuickProductForm({ ...quickProductForm, tax_rate: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.barcode}</label>
                      <input 
                        value={quickProductForm.barcode}
                        onChange={(e) => setQuickProductForm({ ...quickProductForm, barcode: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all" 
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
