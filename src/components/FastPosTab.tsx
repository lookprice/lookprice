import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  CheckCircle2,
  X,
  Barcode,
  Package,
  Printer,
  Calendar,
  TrendingUp,
  RefreshCw,
  FileText,
  ArrowLeft,
  Coffee,
  ArrowLeftRight,
  MessageSquare,
  QrCode,
  Clock,
  Flame,
  Scale,
  Split,
  Divide,
  Bell
} from "lucide-react";
import { translations } from "../translations";
import { useLanguage } from "../contexts/LanguageContext";
import { useNetwork } from "../contexts/NetworkContext";
import { translateText } from "../utils/translator";
import { TableGrid } from './TableGrid';
import { api } from "../services/api";
import { matchesSearch, normalizeSearch } from "../lib/searchUtils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { printThermalReceipt, printThermalZReport } from "../utils/thermalPrinter";

interface FastPosTabProps {
  storeId?: number;
  onSaleComplete?: () => void;
  branding?: any;
  activeStaffRole?: 'manager' | 'cashier' | 'waiter';
  setShowQuickProductModal?: (show: boolean) => void;
  setQuickProductForm?: (form: any) => void;
}

const FastPosTab = ({ storeId, onSaleComplete, branding, activeStaffRole = 'manager', setShowQuickProductModal, setQuickProductForm }: FastPosTabProps) => {
  const { lang } = useLanguage();
  const { isOnline } = useNetwork();
  const t = translations[lang].dashboard;
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOnline) {
      const pendingSales = JSON.parse(localStorage.getItem(`pendingSales_${storeId}`) || '[]');
      if (pendingSales.length > 0) {
        toast.info(lang === 'tr' ? "İnternet bağlantısı geri geldi, bekleyen satışlar senkronize ediliyor..." : "Internet connection restored, syncing pending sales...");
        pendingSales.forEach(async (sale: any) => {
          try {
            await api.createPosSale({
              items: sale.items,
              total: sale.total,
              paymentMethod: sale.paymentMethod,
              customerName: sale.customerName,
              notes: sale.notes
            }, storeId);
          } catch (e) {
            console.error("Sync error:", e);
          }
        });
        localStorage.removeItem(`pendingSales_${storeId}`);
      }
    }
  }, [isOnline, storeId]);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [lastFiscal, setLastFiscal] = useState<any>(null);
  const [lastCart, setLastCart] = useState<any[]>([]);
  const [posStatus, setPosStatus] = useState<'idle' | 'waiting' | 'approved' | 'failed'>('idle');
  const [posMessage, setPosMessage] = useState("");
  const [bridgeDetected, setBridgeDetected] = useState<boolean | null>(null);

  // Z-Report and End-of-Day / Period Report states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportPreset, setReportPreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportSortBy, setReportSortBy] = useState<'qty' | 'revenue' | 'name'>('qty');
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Printer Diagnostics & Auto-Print States
  const [showPrinterDiagnosticModal, setShowPrinterDiagnosticModal] = useState(false);
  const [printerDiagScenario, setPrinterDiagScenario] = useState<'success' | 'ip_conflict' | 'offline' | 'paper_jam'>('success');
  const [printerDiagStep, setPrinterDiagStep] = useState<'idle' | 'testing' | 'result'>('idle');

  const [autoPrintOnOrder, setAutoPrintOnOrder] = useState<boolean>(() => {
    const saved = localStorage.getItem(`pos_auto_print_order_${storeId}`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [autoPrintOnPay, setAutoPrintOnPay] = useState<boolean>(() => {
    const saved = localStorage.getItem(`pos_auto_print_pay_${storeId}`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleToggleAutoPrintOrder = () => {
    const nextVal = !autoPrintOnOrder;
    setAutoPrintOnOrder(nextVal);
    localStorage.setItem(`pos_auto_print_order_${storeId}`, JSON.stringify(nextVal));
    toast.info(nextVal ? "Sipariş kaydedildiğinde otomatik fiş yazdırılacak." : "Otomatik sipariş yazdırımı kapatıldı.");
  };

  const handleToggleAutoPrintPay = () => {
    const nextVal = !autoPrintOnPay;
    setAutoPrintOnPay(nextVal);
    localStorage.setItem(`pos_auto_print_pay_${storeId}`, JSON.stringify(nextVal));
    toast.info(nextVal ? "Ödeme alındığında otomatik fiş yazdırılacak." : "Otomatik ödeme fişi yazdırımı kapatıldı.");
  };

  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';

  // Happy Hours state and configuration
  const [showHappyHourModal, setShowHappyHourModal] = useState(false);
  const [happyHourConfig, setHappyHourConfig] = useState({
    startHour: 14,
    endHour: 18,
    isEnabled: true
  });
  const [happyHourActive, setHappyHourActive] = useState(false);
  const [forceHappyHour, setForceHappyHour] = useState<boolean | null>(null);

  // Automatically check for happy hour schedule
  useEffect(() => {
    if (!isCafeRestaurant || !happyHourConfig.isEnabled) {
      setHappyHourActive(false);
      return;
    }
    const checkHappyHour = () => {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= happyHourConfig.startHour && currentHour < happyHourConfig.endHour) {
        setHappyHourActive(true);
      } else {
        setHappyHourActive(false);
      }
    };
    checkHappyHour();
    const interval = setInterval(checkHappyHour, 10000); // Check every 10 seconds for instant feedback
    return () => clearInterval(interval);
  }, [happyHourConfig]);

  const isHappyHourActive = forceHappyHour !== null ? forceHappyHour : happyHourActive;

  // Cafe/Restaurant Table and Adisyon states
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenReport = () => setShowReportModal(true);
    const handleOpenTableQr = () => setShowQrModal(true);
    window.addEventListener('open-pos-report', handleOpenReport);
    window.addEventListener('open-table-qr', handleOpenTableQr);
    return () => {
      window.removeEventListener('open-pos-report', handleOpenReport);
      window.removeEventListener('open-table-qr', handleOpenTableQr);
    };
  }, []);
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [prevPendingCount, setPrevPendingCount] = useState<number | null>(null);
  const [tablesRefreshTrigger, setTablesRefreshTrigger] = useState(0);
  const [loadingPending, setLoadingPending] = useState(false);
  const lastSoundPlayedRef = useRef<number>(0);
  const [activeSaleId, setActiveSaleId] = useState<number | null>(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitPayments, setSplitPayments] = useState<Array<{ method: 'cash' | 'credit_card'; amount: string }>>([]);
  const [splitTab, setSplitTab] = useState<'item_split' | 'amount_split'>('item_split');
  const [selectedSplitItems, setSelectedSplitItems] = useState<Record<number, number>>({});
  const [partialPayMethod, setPartialPayMethod] = useState<'cash' | 'credit_card'>('cash');
  const [isChangingTable, setIsChangingTable] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalTab, setQrModalTab] = useState<'single' | 'all' | 'manage'>('single');
  const [newTableCount, setNewTableCount] = useState<number>(branding?.page_layout_settings?.table_count || 12);
  const [savingTableCount, setSavingTableCount] = useState(false);
  const [singleQrTable, setSingleQrTable] = useState<string>("1");

  useEffect(() => {
    if (selectedTable) {
      setSingleQrTable(selectedTable);
    } else if (allTables.length > 0) {
      setSingleQrTable(allTables[0].table_number);
    }
  }, [selectedTable, allTables]);

  useEffect(() => {
    if (branding?.page_layout_settings?.table_count) {
      setNewTableCount(branding.page_layout_settings.table_count);
    }
  }, [branding]);

  const [storeTableCalls, setStoreTableCalls] = useState<any[]>([]);
  useEffect(() => {
    const fetchTableCalls = () => {
      try {
        const calls = JSON.parse(localStorage.getItem(`storeTableCalls_${storeId}`) || '[]');
        setStoreTableCalls(Array.isArray(calls) ? calls.filter((c: any) => c.status === 'pending') : []);
      } catch (e) {
        console.error("Error reading storeTableCalls:", e);
      }
    };
    fetchTableCalls();
    const interval = setInterval(fetchTableCalls, 3000);
    return () => clearInterval(interval);
  }, [storeId]);

  const handleResolveTableCall = (callId: number) => {
    try {
      const calls = JSON.parse(localStorage.getItem(`storeTableCalls_${storeId}`) || '[]');
      const updated = calls.map((c: any) => c.id === callId ? { ...c, status: 'resolved' } : c);
      localStorage.setItem(`storeTableCalls_${storeId}`, JSON.stringify(updated));
      setStoreTableCalls(updated.filter((c: any) => c.status === 'pending'));
    } catch (e) {
      console.error("Error resolving call:", e);
    }
  };

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [variantModalProduct, setVariantModalProduct] = useState<any | null>(null);

  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach(p => {
      if (p.category) cats.add(p.category.trim());
      if (p.category_2) cats.add(p.category_2.trim());
    });
    return Array.from(cats);
  }, [allProducts]);

  const subCategories = React.useMemo(() => {
    if (selectedCategory === "all") return [];
    const subs = new Set<string>();
    allProducts.forEach(p => {
      if (p.category === selectedCategory || p.category_2 === selectedCategory) {
        if (p.category === selectedCategory && p.sub_category) subs.add(p.sub_category.trim());
        if (p.category_2 === selectedCategory && p.sub_category_2) subs.add(p.sub_category_2.trim());
      }
    });
    return Array.from(subs);
  }, [allProducts, selectedCategory]);

  const filteredProducts = React.useMemo(() => {
    const trimmed = searchTerm.trim();

    if (trimmed.length > 0) {
      const sourceList = allProducts.length > 0 ? allProducts : searchResults;
      let list = sourceList.filter((p) => {
        const basicMatch = matchesSearch(p, trimmed, [
          "name",
          "barcode",
          "category",
          "sub_category",
          "category_2",
          "sub_category_2",
          "description",
          "brand"
        ]);
        if (basicMatch) return true;

        if (Array.isArray(p.variants)) {
          const normTerm = normalizeSearch(trimmed);
          const varMatch = p.variants.some((v: any) => 
            normalizeSearch(v.name || '').includes(normTerm) || 
            normalizeSearch(v.barcode || '').includes(normTerm)
          );
          if (varMatch) return true;
        }

        if (Array.isArray(p.labels)) {
          const normTerm = normalizeSearch(trimmed);
          const labelMatch = p.labels.some((lbl: any) => normalizeSearch(String(lbl)).includes(normTerm));
          if (labelMatch) return true;
        }

        return false;
      });

      if (list.length === 0 && searchResults.length > 0) {
        list = searchResults;
      }

      return list;
    }

    let list = allProducts.length > 0 ? allProducts : searchResults;
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory || p.category_2 === selectedCategory);
      if (selectedSubCategory !== "all") {
        list = list.filter((p) => 
          (p.category === selectedCategory && p.sub_category === selectedSubCategory) ||
          (p.category_2 === selectedCategory && p.sub_category_2 === selectedSubCategory)
        );
      }
    }
    return list;
  }, [allProducts, searchResults, searchTerm, selectedCategory, selectedSubCategory]);

  const fetchPendingSales = async (isPoll: boolean = false) => {
    if (!isCafeRestaurant) return;
    try {
      if (!isPoll) setLoadingPending(true);
      const res = await api.getSales('pending', '', '', storeId);
      if (Array.isArray(res)) {
        setPendingSales(res);
        setTablesRefreshTrigger(prev => prev + 1);

        if (prevPendingCount !== null && res.length > prevPendingCount) {
          // Play a "bell" style alert sound
          const now = Date.now();
          if (now - lastSoundPlayedRef.current > 2000) {
            lastSoundPlayedRef.current = now;
            try {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContextClass) {
                const audioCtx = new AudioContextClass();
                const gainNode = audioCtx.createGain();
                gainNode.connect(audioCtx.destination);
                
                // Envelope: Instant attack, long decay
                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.5);

                // Harmonics (Bell synthesis)
                const baseFreq = 440; // A4
                const harmonics = [1, 2, 3, 4.1, 5.2]; // Fundamental + overtones
                
                harmonics.forEach((ratio) => {
                  const osc = audioCtx.createOscillator();
                  osc.connect(gainNode);
                  osc.type = 'sine'; // Sine waves are best for bell overtones
                  osc.frequency.setValueAtTime(baseFreq * ratio, audioCtx.currentTime);
                  osc.start();
                  osc.stop(audioCtx.currentTime + 2.5);
                });
              }
            } catch (soundErr) {
              console.log("Audio play blocked by browser policies:", soundErr);
            }
          }
          toast.success(lang === 'tr' ? "Yeni masa siparişi alındı!" : "New table order received!");
        }
        setPrevPendingCount(res.length);
      }
    } catch (e) {
      console.error("Error fetching pending sales:", e);
    } finally {
      if (!isPoll) setLoadingPending(false);
    }
  };

  useEffect(() => {
    if (!isCafeRestaurant) return;
    
    fetchPendingSales();
    
    // Poll for updates every 30 seconds to keep order state fresh
    const interval = setInterval(() => {
      fetchPendingSales(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [storeId, isCafeRestaurant]); // Removed prevPendingCount

  const fetchReport = async (startDateStr: string, endDateStr?: string) => {
    try {
      setReportLoading(true);
      const endStr = endDateStr || startDateStr;
      const data = await api.getPosDailyReport(startDateStr, storeId, endStr);
      if (data && data.success) {
        setReportData(data);
      } else {
        setReportData(null);
      }
    } catch (e) {
      console.error("Error fetching POS sales report:", e);
      setReportData(null);
    } finally {
      setReportLoading(false);
    }
  };

  const handleApplyPreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
    setReportPreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const d = formatDate(today);
      setReportStartDate(d);
      setReportEndDate(d);
      fetchReport(d, d);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const d = formatDate(y);
      setReportStartDate(d);
      setReportEndDate(d);
      fetchReport(d, d);
    } else if (preset === 'week') {
      const w = new Date(today);
      w.setDate(w.getDate() - 6);
      const start = formatDate(w);
      const end = formatDate(today);
      setReportStartDate(start);
      setReportEndDate(end);
      fetchReport(start, end);
    } else if (preset === 'month') {
      const m = new Date(today.getFullYear(), today.getMonth(), 1);
      const start = formatDate(m);
      const end = formatDate(today);
      setReportStartDate(start);
      setReportEndDate(end);
      fetchReport(start, end);
    }
  };

  useEffect(() => {
    if (showReportModal) {
      fetchReport(reportStartDate, reportEndDate);
    }
  }, [showReportModal, reportStartDate, reportEndDate]);

  // Isolated high-quality 80mm thermal slip printing
  const handlePrintReceipt = (overrideOptions?: any) => {
    if (overrideOptions && typeof overrideOptions === 'object' && !('target' in overrideOptions)) {
      printThermalReceipt({
        storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
        storePhone: branding?.phone || branding?.whatsapp_number,
        ...overrideOptions
      });
      return;
    }

    const itemsToPrint = cart.map(it => ({
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      note: it.note
    }));

    const calculatedTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0);

    printThermalReceipt({
      title: selectedTable ? "ADİSYON FİŞİ" : "SATIŞ FİŞİ",
      storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
      storePhone: branding?.phone || branding?.whatsapp_number,
      tableNo: selectedTable || "Hızlı Kasa",
      saleId: activeSaleId || undefined,
      items: itemsToPrint,
      totalAmount: calculatedTotal,
      paymentMethod: paymentMethod === 'cash' ? 'NAKİT' : (paymentMethod === 'credit_card' ? 'KREDİ KARTI' : 'SİPARİŞ')
    });
  };

  const handlePrintTableBill = (sale: any) => {
    if (!sale) return;
    const itemsToPrint = (sale.items || []).map((it: any) => ({
      name: it.product_name || it.name,
      quantity: Math.floor(Number(it.quantity)) || 1,
      price: it.unit_price || it.price || 0,
      note: it.note || ''
    }));

    printThermalReceipt({
      title: "ADİSYON FİŞİ",
      storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
      storePhone: branding?.phone || branding?.whatsapp_number,
      tableNo: sale.customer_name || "Masa",
      saleId: sale.id,
      items: itemsToPrint,
      totalAmount: parseFloat(sale.total_amount) || 0,
      paymentMethod: "SİPARİŞ / ÖDENMEDİ",
      notes: sale.notes || undefined
    });
  };

  const handlePrintReport = () => {
    if (!reportData) return;

    const cashAmount = reportData.payments?.filter((p: any) => ['cash', 'nakit'].includes(p.payment_method?.toLowerCase()))?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0) || 0;
    const cardAmount = reportData.payments?.filter((p: any) => ['credit_card', 'card', 'kredi_karti', 'pos'].includes(p.payment_method?.toLowerCase()))?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0) || 0;
    const otherAmount = reportData.payments?.filter((p: any) => !['cash', 'nakit', 'credit_card', 'card', 'kredi_karti', 'pos'].includes(p.payment_method?.toLowerCase()))?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0) || 0;
    const totalAmount = reportData.grand_total || (reportData.payments?.reduce((s: number, p: any) => s + (Number(p.total_amount) || 0), 0)) || 0;
    const isRange = reportStartDate !== reportEndDate;
    const dateLabel = isRange ? `${reportStartDate} - ${reportEndDate}` : reportStartDate;
    const totalItems = reportData.products?.reduce((sum: number, p: any) => sum + (Number(p.total_quantity) || 0), 0) || 0;

    printThermalZReport({
      title: isRange ? "SATIŞ & CİRO DÖNEM RAPORU" : "GÜN SONU Z RAPORU",
      storeName: branding?.store_name || branding?.name || 'LOOKPRICE HORECA',
      reportDate: dateLabel,
      isRange: isRange,
      cashTotal: cashAmount,
      cardTotal: cardAmount,
      otherTotal: otherAmount,
      grandTotal: totalAmount,
      saleCount: reportData.total_sales || 0,
      totalItemsSold: totalItems,
      products: reportData.products || []
    });
  };

  const handlePrintA4Report = () => {
    if (!reportData) return;
    const isRange = reportStartDate !== reportEndDate;
    const dateLabel = isRange ? `${reportStartDate} — ${reportEndDate}` : reportStartDate;
    const storeTitle = branding?.store_name || branding?.name || 'LOOKPRICE RESTORAN & POS';
    const cashAmount = reportData.payments?.filter((p: any) => ['cash', 'nakit'].includes(p.payment_method?.toLowerCase()))?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0) || 0;
    const cardAmount = reportData.payments?.filter((p: any) => ['credit_card', 'card', 'kredi_karti', 'pos'].includes(p.payment_method?.toLowerCase()))?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0) || 0;
    const grandTotal = reportData.grand_total || (reportData.payments?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0)) || 0;
    const totalItems = reportData.products?.reduce((sum: number, p: any) => sum + (Number(p.total_quantity) || 0), 0) || 0;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "100px";
    iframe.style.height = "100px";
    iframe.style.border = "none";
    iframe.style.opacity = "0.01";
    iframe.style.zIndex = "-999";
    document.body.appendChild(iframe);

    const productRows = (reportData.products || []).map((p: any, idx: number) => `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 8px 12px; font-weight: bold; color: #1e293b; text-align: left;">${idx + 1}. ${p.product_name}</td>
        <td style="padding: 8px 12px; text-align: center; font-weight: 700; color: #4f46e5;">${p.total_quantity} Adet</td>
        <td style="padding: 8px 12px; text-align: right; color: #64748b;">${(p.total_revenue / p.total_quantity).toFixed(2)} ₺</td>
        <td style="padding: 8px 12px; text-align: right; font-weight: 800; color: #0f172a;">${(p.total_revenue || 0).toFixed(2)} ₺</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${storeTitle} - ${isRange ? 'Dönem Satış Raporu' : 'Gün Sonu Raporu'}</title>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 12mm; }
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.4; margin: 0; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
            <div>
              <h1 style="font-size: 22px; margin: 0; color: #1e1b4b; font-weight: 900; text-transform: uppercase;">${storeTitle}</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #6366f1;">${isRange ? 'DÖNEMLİK SATIŞ & CİRO RAPORU' : 'GÜN SONU Z RAPORU'}</p>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 13px;">Tarih: ${dateLabel}</p>
              <p style="margin: 3px 0 0 0;">Yazdırma: ${new Date().toLocaleString('tr-TR')}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Toplam Ciro</span>
              <p style="font-size: 18px; font-weight: 900; color: #4f46e5; margin: 4px 0 0 0;">${grandTotal.toFixed(2)} ₺</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Nakit Tahsilat</span>
              <p style="font-size: 18px; font-weight: 900; color: #059669; margin: 4px 0 0 0;">${cashAmount.toFixed(2)} ₺</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Kredi Kartı / POS</span>
              <p style="font-size: 18px; font-weight: 900; color: #2563eb; margin: 4px 0 0 0;">${cardAmount.toFixed(2)} ₺</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Toplam Satılan Adet</span>
              <p style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 4px 0 0 0;">${totalItems} Adet</p>
            </div>
          </div>

          <h3 style="font-size: 14px; font-weight: 800; color: #334155; margin: 25px 0 5px 0; text-transform: uppercase;">Satılan Ürün Dağılımı ve Gelir Tablosu</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 45%;">Ürün Adı</th>
                <th style="width: 15%; text-align: center;">Satılan Adet</th>
                <th style="width: 20%; text-align: right;">Birim Fiyat (Ort.)</th>
                <th style="width: 20%; text-align: right;">Toplam Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${productRows || '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #94a3b8;">Kayıt bulunamadı.</td></tr>'}
            </tbody>
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: 900; border-top: 2px solid #94a3b8;">
                <td style="padding: 10px 12px;">GENEL TOPLAM</td>
                <td style="padding: 10px 12px; text-align: center; color: #4f46e5;">${totalItems} Adet</td>
                <td style="padding: 10px 12px; text-align: right;">—</td>
                <td style="padding: 10px 12px; text-align: right; color: #4f46e5; font-size: 15px;">${grandTotal.toFixed(2)} ₺</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
            <div>
              <p style="font-weight: 700; margin: 0 0 40px 0;">Kasiyer / Yetkili</p>
              <p style="margin: 0;">İmza: _______________________</p>
            </div>
            <div style="text-align: right;">
              <p style="font-weight: 700; margin: 0 0 40px 0;">Mağaza / İşletme Onayı</p>
              <p style="margin: 0;">İmza: _______________________</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("A4 print error:", e);
        }
        setTimeout(() => {
          try { iframe.remove(); } catch (e) {}
        }, 1000);
      }, 400);
    }
  };

  const handlePrintSingleQr = (tableNum: string) => {
    const cleanNum = tableNum.replace(/Masa/gi, '').trim();
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + "/digital-menu/" + storeId + "/" + cleanNum)}`;
    const storeTitle = branding?.store_name || branding?.name || 'Seçkin Restoran';
    
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "100px";
    iframe.style.height = "100px";
    iframe.style.border = "none";
    iframe.style.opacity = "0.01";
    iframe.style.zIndex = "-999";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Masa ${cleanNum} QR Kodu</title>
            <style>
              @media print {
                @page { margin: 0; size: auto; }
                html, body { background: white !important; color: black !important; margin: 0 !important; width: 100% !important; visibility: visible !important; }
              }
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                text-align: center; 
                padding: 40px; 
                color: #0f172a; 
                background: white;
              }
              .card { 
                border: 3px solid #e2e8f0; 
                border-radius: 24px; 
                padding: 40px; 
                max-width: 320px; 
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); 
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .logo { 
                font-size: 18px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 280px;
              }
              h2 { 
                font-size: 32px; 
                font-weight: 900; 
                color: #e11d48;
                margin: 6px 0; 
                text-transform: uppercase; 
                letter-spacing: -0.5px; 
              }
              p.menu-sub { 
                font-size: 12px; 
                color: #64748b; 
                margin: 0 0 20px 0; 
                font-weight: 700; 
                letter-spacing: 1.5px;
              }
              .qr-container {
                background: #f8fafc;
                padding: 16px;
                border-radius: 20px;
                border: 1px solid #e2e8f0;
                margin-bottom: 20px;
              }
              .qr-container img { 
                width: 200px; 
                height: 200px; 
                display: block;
              }
              p.instructions {
                font-size: 12px;
                color: #475569;
                font-weight: 600;
                line-height: 1.4;
                margin: 0 0 16px 0;
                max-width: 240px;
              }
              .footer { 
                font-size: 9px; 
                color: #94a3b8; 
                text-transform: uppercase; 
                font-weight: 800; 
                letter-spacing: 1px; 
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">${storeTitle}</div>
              <h2>MASA ${cleanNum}</h2>
              <p class="menu-sub">DİJİTAL MENÜ</p>
              <div class="qr-container">
                <img src="${qrUrl}" alt="Masa ${cleanNum}" />
              </div>
              <p class="instructions">
                ${lang === 'tr' ? 'Menüyü incelemek ve sipariş vermek için QR kodu cep telefonunuzla taratın.' : 'Scan the QR code with your phone to view menu and order.'}
              </p>
              <div class="footer">POWERED BY LOOKPRICE</div>
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Print error:", e);
        }
        setTimeout(() => {
          try { iframe.remove(); } catch (e) {}
        }, 1000);
      }, 500);
    }
  };

  const handlePrintAllQrs = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "100px";
    iframe.style.height = "100px";
    iframe.style.border = "none";
    iframe.style.opacity = "0.01";
    iframe.style.zIndex = "-999";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      
      const tablesHtml = allTables.map((table) => {
        const cleanNum = table.table_number.replace(/Masa/gi, '').trim();
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + "/digital-menu/" + storeId + "/" + cleanNum)}`;
        return `
          <div class="qr-card">
            <div class="logo-text">${branding?.store_name || branding?.name || 'Seçkin Restoran'}</div>
            <div class="table-title">MASA ${cleanNum}</div>
            <div class="subtitle">DİJİTAL MENÜ</div>
            <div class="qr-container">
              <img src="${qrUrl}" alt="Masa ${cleanNum}" />
            </div>
            <div class="instructions">
              ${lang === 'tr' ? 'Menüyü incelemek ve sipariş vermek için QR kodu cep telefonunuzla taratın.' : 'Scan the QR code with your phone to view menu and order.'}
            </div>
            <div class="footer-powered">POWERED BY LOOKPRICE</div>
          </div>
        `;
      }).join('');

      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tüm Masalar QR Kodları</title>
            <style>
              @media print {
                @page { margin: 0; size: auto; }
                html, body {
                  margin: 0;
                  padding: 0;
                  background: white;
                  visibility: visible !important;
                }
                .page {
                  page-break-after: always;
                }
              }
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                background-color: #f8fafc;
                margin: 0;
                padding: 20px;
                display: flex;
                flex-wrap: wrap;
                gap: 24px;
                justify-content: center;
              }
              .qr-card { 
                background: white;
                border: 3px solid #e2e8f0; 
                border-radius: 20px; 
                padding: 30px; 
                width: 280px; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                box-sizing: border-box;
                page-break-inside: avoid;
              }
              .logo-text { 
                font-size: 16px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 240px;
              }
              .table-title { 
                font-size: 26px; 
                font-weight: 900; 
                color: #e11d48;
                margin: 4px 0;
                letter-spacing: -0.5px; 
              }
              .subtitle {
                font-size: 11px;
                font-weight: 700;
                color: #64748b;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                margin-bottom: 12px;
              }
              .qr-container { 
                background-color: #f8fafc;
                padding: 12px;
                border-radius: 16px;
                border: 1px solid #f1f5f9;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .qr-container img {
                width: 180px; 
                height: 180px; 
                display: block;
              }
              .instructions { 
                font-size: 11px; 
                color: #475569; 
                margin: 0 0 12px 0; 
                font-weight: 600; 
                line-height: 1.4;
                max-width: 220px;
              }
              .footer-powered { 
                font-size: 8px; 
                color: #94a3b8; 
                text-transform: uppercase; 
                font-weight: 800; 
                letter-spacing: 1px; 
              }
            </style>
          </head>
          <body>
            ${tablesHtml}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Print error:", e);
        }
        setTimeout(() => {
          try { iframe.remove(); } catch (e) {}
        }, 1000);
      }, 600);
    }
  };

  const handleSaveTableCount = async () => {
    if (newTableCount < 1 || newTableCount > 200) {
      toast.error(lang === 'tr' ? "Lütfen 1 ile 200 arasında bir masa sayısı girin." : "Please enter a table count between 1 and 200.");
      return;
    }
    setSavingTableCount(true);
    try {
      const updatedBranding = {
        ...(branding || {}),
        page_layout_settings: {
          ...(branding?.page_layout_settings || {}),
          table_count: newTableCount
        }
      };
      await api.updateBranding(updatedBranding, storeId);
      toast.success(lang === 'tr' ? "Masa sayısı başarıyla güncellendi." : "Table count updated successfully.");
      
      // Refresh the table list from server
      const tablesRes = await api.getRestaurantTables(storeId!);
      if (Array.isArray(tablesRes)) {
        setAllTables(tablesRes);
        setTablesRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error("Error updating table count:", err);
      toast.error(lang === 'tr' ? "Masa sayısı güncellenirken hata oluştu." : "Error updating table count.");
    } finally {
      setSavingTableCount(false);
    }
  };

  const handlePrintQr = () => {
    handlePrintSingleQr(singleQrTable);
  };

  useEffect(() => {
    const checkBridge = async () => {
      try {
        const bridgeIp = branding?.pos_bridge_ip || '127.0.0.1';
        const bridgePort = branding?.pos_bridge_port || '1616';
        const res = await fetch(`http://${bridgeIp}:${bridgePort}/pos/sale`, { 
          method: 'OPTIONS',
          signal: AbortSignal.timeout(1000)
        }).catch(() => null);
        setBridgeDetected(!!res || res === null); // If it responds or at least doesn't throw immediately
      } catch (e) {
        setBridgeDetected(false);
      }
    };
    
    if (branding?.pos_bridge_enabled) {
      checkBridge();
      const interval = setInterval(checkBridge, 10000);
      return () => clearInterval(interval);
    } else {
      setBridgeDetected(null);
    }
  }, [branding?.pos_bridge_enabled, branding?.pos_bridge_ip, branding?.pos_bridge_port]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        const res = await api.getProducts("", storeId, false, true);
        const products = Array.isArray(res) ? res : [];
        setSearchResults(products);
        setAllProducts(products);
      } catch (error) {
        console.error("Fetch all products error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, [storeId]);

  useEffect(() => {
    const fetchProducts = async () => {
      const trimmed = searchTerm.trim();
      if (trimmed.length > 0) {
        // Check if scanned value is a table QR code
        const tableUrlMatch = trimmed.match(/\/digital-menu\/\d+\/(.+)/);
        if (tableUrlMatch) {
          const decodedTableNumber = decodeURIComponent(tableUrlMatch[1]);
          setSelectedTable(decodedTableNumber);
          setSearchTerm("");
          return;
        }

        try {
          const res = await api.getProducts(trimmed, storeId, false, true);
          const products = Array.isArray(res) ? res : [];
          setSearchResults(products);
          
          // If exact barcode match, add to cart immediately
          const exactMatch = (allProducts.length > 0 ? allProducts : products).find(
            (p: any) => p.barcode && p.barcode.toString().trim() === trimmed
          );
          if (exactMatch) {
            addToCart(exactMatch);
            setSearchTerm("");
          }
        } catch (error) {
          console.error("Search error:", error);
        }
      } else {
        if (allProducts.length > 0) {
          setSearchResults(allProducts);
        } else {
          try {
            const res = await api.getProducts("", storeId, false, true);
            const products = Array.isArray(res) ? res : [];
            setSearchResults(products);
            setAllProducts(products);
          } catch (error) {
            console.error("Fetch products reset error:", error);
          }
        }
      }
    };

    const delayDebounceFn = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, storeId, allProducts]);

  const getExchangeRate = (currency: string) => {
    if (!currency || currency === (branding?.default_currency || 'TRY')) return 1;
    if (branding?.currency_rates && branding.currency_rates[currency]) {
      return parseFloat(branding.currency_rates[currency]) || 1;
    }
    return 1;
  };

  const handleProductClick = (product: any) => {
    const pHasVars = !!product.has_variants || (Array.isArray(product.variants) && product.variants.length > 0);
    if (pHasVars && Array.isArray(product.variants) && product.variants.length > 0) {
      setVariantModalProduct(product);
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product: any, selectedVariant?: any) => {
    setCart(prev => {
      const variantName = selectedVariant ? selectedVariant.name : null;
      const existingIndex = prev.findIndex(item => 
        item.id === product.id && 
        ((!item.selectedVariant && !variantName) || (item.selectedVariant && item.selectedVariant.name === variantName))
      );

      const hasHappyHourPrice = isHappyHourActive && product.price_2 && parseFloat(product.price_2.toString()) > 0;
      const baseProductPrice = hasHappyHourPrice ? product.price_2 : product.price;

      const rawPrice = selectedVariant && selectedVariant.price && parseFloat(selectedVariant.price) > 0 
        ? selectedVariant.price 
        : baseProductPrice;

      const rate = getExchangeRate(product.currency || 'TRY');
      const convertedPrice = (parseFloat(rawPrice || 0) * rate).toFixed(2);

      if (existingIndex > -1) {
        return prev.map((item, idx) => 
          idx === existingIndex 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      
      const displayName = selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name;

      return [...prev, { 
        ...product, 
        name: displayName,
        base_name: product.name,
        quantity: 1,
        price: convertedPrice,
        currency: branding?.default_currency || 'TRY',
        selectedVariant: selectedVariant || null,
        selected_variant_name: selectedVariant ? selectedVariant.name : null
      }];
    });
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        const newQty = Math.max(1, Math.floor(item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (index: number, newPrice: string) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const updateNote = (index: number, note: string) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, note };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    
    if (!isOnline) {
      const pendingSale = {
        id: Date.now(),
        items: cart,
        total,
        paymentMethod,
        customerName: selectedTable || 'Hızlı Satış',
        notes: selectedTable ? `${selectedTable} Satışı` : 'Hızlı POS Modu',
        timestamp: new Date().toISOString()
      };
      const pendingSales = JSON.parse(localStorage.getItem(`pendingSales_${storeId}`) || '[]');
      localStorage.setItem(`pendingSales_${storeId}`, JSON.stringify([...pendingSales, pendingSale]));
      toast.info(lang === 'tr' ? "İnternet bağlantısı yok, satış yerel olarak kaydedildi." : "No internet connection, sale saved locally.");
      setCart([]);
      setSelectedTable(null);
      if (onSaleComplete) onSaleComplete();
      setCompleting(false);
      return;
    }

    try {
      setCompleting(true);

      // POS Integration Simulation
      if (paymentMethod === 'credit_card' && branding?.pos_bridge_enabled) {
        setPosStatus('waiting');
        setPosMessage(lang === 'tr' ? `Fiziksel POS Cihazına bağlanılıyor...` : `Connecting to Physical POS...`);
        
        // Real-world bridge attempt simulation
        try {
          // We attempt to call a local bridge service (e.g. using the configured IP/Port)
          // This is a common pattern for web-to-local hardware communication
          const bridgeIp = branding?.pos_bridge_ip || '127.0.0.1';
          const bridgePort = branding?.pos_bridge_port || '1616';
          const bridgeUrl = `http://${bridgeIp}:${bridgePort}/pos/sale`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const bridgeRes = await fetch(bridgeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: total,
              currency: branding.default_currency || 'TRY',
              ip: branding.fiscal_ip,
              port: branding.fiscal_port,
              brand: branding.fiscal_brand,
              terminalId: branding.fiscal_terminal_id
            }),
            signal: controller.signal
          }).catch(() => null);

          clearTimeout(timeoutId);

          if (!bridgeRes) {
            // If no bridge is found, we fall back to simulation but warn the user
            setPosMessage(lang === 'tr' ? "Yerel bağlantı köprüsü bulunamadı. Simülasyon modunda devam ediliyor..." : "Local bridge not found. Continuing in simulation mode...");
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            const data = await bridgeRes.json();
            if (data.status === 'approved') {
              setPosStatus('approved');
              setPosMessage(lang === 'tr' ? "İşlem Onaylandı!" : "Transaction Approved!");
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              throw new Error(data.message || "POS Error");
            }
          }
        } catch (e) {
          console.log("Bridge connection failed, using simulation.");
        }

        if (posStatus === 'waiting') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          setPosMessage(lang === 'tr' ? "Lütfen kartı takın veya yaklaştırın..." : "Please insert or tap card...");
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          setPosMessage(lang === 'tr' ? "Şifre bekleniyor..." : "Waiting for PIN...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setPosMessage(lang === 'tr' ? "İşlem onaylanıyor..." : "Authorizing transaction...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setPosStatus('approved');
          setPosMessage(lang === 'tr' ? "İşlem Onaylandı!" : "Transaction Approved!");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (activeSaleId !== null) {
        // Complete an existing active pending adisyon/sale
        const res = await api.completeSale(activeSaleId, {
          paymentMethod,
          items: cart.map(item => ({
            product_id: item.id,
            product_name: item.note ? `${item.name} (${item.note})` : item.name,
            unit_price: parseFloat(item.price) || 0,
            quantity: item.quantity
          }))
        }, storeId);

        if (res.success) {
          if (autoPrintOnPay) {
            handlePrintReceipt();
          }
          setLastSaleId(activeSaleId);
          setLastFiscal(res.fiscal);
          setLastCart(cart.map(item => ({ ...item, price: parseFloat(item.price) || 0, name: item.note ? `${item.name} (${item.note})` : item.name })));
          setShowSuccess(true);
          setCart([]);
          setActiveSaleId(null);
          setSelectedTable(null);
          fetchPendingSales(); // Refresh the active table grid!
          if (onSaleComplete) onSaleComplete();
          
          if (!res.fiscal) {
            setTimeout(() => {
              setShowSuccess(false);
            }, 3000);
          }
        }
      } else {
        // Direct cash register sale (can be standard or first-time immediately completed table)
        const currentCart = cart.map(item => ({
          ...item,
          name: item.note ? `${item.name} (${item.note})` : item.name,
          price: parseFloat(item.price) || 0
        }));
        const res = await api.createPosSale({
          items: currentCart,
          total,
          paymentMethod,
          customerName: selectedTable || 'Hızlı Satış',
          notes: selectedTable ? `${selectedTable} Satışı` : 'Hızlı POS Modu',
          currency: branding?.default_currency || 'TRY',
          exchangeRate: 1
        }, storeId);

        if (res.success) {
          if (autoPrintOnPay) {
            handlePrintReceipt();
          }
          setLastSaleId(res.saleId);
          setLastFiscal(res.fiscal);
          setLastCart(currentCart);
          setShowSuccess(true);
          setCart([]);
          setSelectedTable(null);
          if (onSaleComplete) onSaleComplete();
          
          if (!res.fiscal) {
            setTimeout(() => {
              setShowSuccess(false);
              if (searchInputRef.current) {
                searchInputRef.current.focus();
              }
            }, 3000);
          }
        }
      }
    } catch (error: any) {
      alert(error.message || "Satış tamamlanırken bir hata oluştu.");
    } finally {
      setCompleting(false);
      setPosStatus('idle');
    }
  };

  const openSplitPaymentModal = () => {
    if (cart.length === 0) return;
    const half = (total / 2).toFixed(2);
    setSplitPayments([
      { method: 'cash', amount: half },
      { method: 'credit_card', amount: (total - parseFloat(half)).toFixed(2) }
    ]);
    setSelectedSplitItems({});
    setSplitTab('item_split');
    setPartialPayMethod('cash');
    setShowSplitModal(true);
  };

  const handlePartialItemPayment = async () => {
    if (cart.length === 0) return;

    const paidItems: any[] = [];
    const remainingItems: any[] = [];

    cart.forEach((item, index) => {
      const payQty = selectedSplitItems[index] || 0;
      if (payQty > 0) {
        paidItems.push({
          ...item,
          id: item.id,
          product_id: item.id,
          quantity: payQty,
          name: item.note ? `${item.name} (${item.note})` : item.name,
          price: parseFloat(item.price) || 0
        });
      }
      const remQty = item.quantity - payQty;
      if (remQty > 0) {
        remainingItems.push({
          ...item,
          quantity: remQty
        });
      }
    });

    const paidTotal = paidItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const remainingTotal = remainingItems.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0);

    if (paidItems.length === 0 || paidTotal <= 0) {
      toast.error(lang === 'tr' ? "Lütfen ödenecek en az 1 ürün ve adet seçin!" : "Please select at least 1 item to pay!");
      return;
    }

    try {
      setCompleting(true);

      if (partialPayMethod === 'credit_card' && branding?.pos_bridge_enabled) {
        setPosStatus('waiting');
        setPosMessage(lang === 'tr' ? `Fiziksel POS Cihazına bağlanılıyor...` : `Connecting to Physical POS...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPosStatus('approved');
        setPosMessage(lang === 'tr' ? "POS Ödemesi Onaylandı!" : "POS Payment Approved!");
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const resCreate = await api.createPosSale({
        items: paidItems,
        total: paidTotal,
        paymentMethod: partialPayMethod,
        customerName: selectedTable ? `${selectedTable} (Kısmi Ödeme)` : 'Parçalı Satış',
        notes: selectedTable ? `${selectedTable} Alman Usulü / Parçalı Ödeme` : 'Parçalı POS Satışı',
        currency: branding?.default_currency || 'TRY',
        exchangeRate: 1
      }, storeId);

      if (!resCreate.success) {
        throw new Error(resCreate.error || "Kısmi ödeme kaydedilemedi.");
      }

      if (autoPrintOnPay) {
        printThermalReceipt({
          title: "PARÇALI ÖDEME FİŞİ",
          storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
          storePhone: branding?.phone || branding?.whatsapp_number,
          tableNo: selectedTable || "Hızlı Kasa",
          saleId: resCreate.saleId,
          items: paidItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          totalAmount: paidTotal,
          paymentMethod: partialPayMethod === 'cash' ? 'NAKİT' : 'KREDİ KARTI',
          notes: remainingItems.length > 0 ? `Masada Kalan Adisyon Tutarı: ${remainingTotal.toFixed(2)} ₺` : 'Adisyon Tamamen Kapatıldı'
        });
      }

      if (remainingItems.length > 0) {
        if (activeSaleId !== null) {
          await api.updatePendingSale(activeSaleId, {
            items: remainingItems.map(item => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: parseFloat(item.price) || 0,
              barcode: item.barcode || ''
            })),
            total: remainingTotal,
            customerName: selectedTable
          }, storeId);
        } else if (selectedTable !== null) {
          const resPending = await api.createPosSale({
            items: remainingItems,
            total: remainingTotal,
            paymentMethod: 'cash',
            customerName: selectedTable,
            notes: `${selectedTable} Adisyonu (Parçalı Ödeme Sonrası)`,
            currency: branding?.default_currency || 'TRY',
            exchangeRate: 1,
            status: 'pending'
          }, storeId);

          if (resPending.success && resPending.saleId) {
            setActiveSaleId(resPending.saleId);
          }
        }

        setCart(remainingItems);
        toast.success(
          lang === 'tr' 
            ? `✅ ${paidTotal.toFixed(2)} ₺ kısmi ödeme alındı! Adisyon ${remainingTotal.toFixed(2)} ₺ tutarla AÇIK tutuluyor.`
            : `✅ ${paidTotal.toFixed(2)} ₺ paid! Table remains open with ${remainingTotal.toFixed(2)} ₺ remaining.`
        );
      } else {
        if (activeSaleId !== null) {
          await api.completeSale(activeSaleId, {
            paymentMethod: partialPayMethod,
            items: paidItems
          }, storeId);
        }
        setCart([]);
        setActiveSaleId(null);
        setSelectedTable(null);
        toast.success(
          lang === 'tr'
            ? "🎉 Masanın tüm hesabı ödendi ve adisyon kapatıldı!"
            : "🎉 All items paid and table adisyon is closed!"
        );
      }

      setShowSplitModal(false);
      fetchPendingSales();
      if (onSaleComplete) onSaleComplete();
    } catch (err: any) {
      toast.error(err.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setCompleting(false);
      setPosStatus('idle');
    }
  };

  const handlePartialAmountPayment = async (amountToPay: number) => {
    if (amountToPay <= 0 || amountToPay >= total) return;
    const remainingAmount = total - amountToPay;

    try {
      setCompleting(true);

      if (partialPayMethod === 'credit_card' && branding?.pos_bridge_enabled) {
        setPosStatus('waiting');
        setPosMessage(lang === 'tr' ? `Fiziksel POS Cihazına bağlanılıyor...` : `Connecting to Physical POS...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPosStatus('approved');
        setPosMessage(lang === 'tr' ? "POS Ödemesi Onaylandı!" : "POS Payment Approved!");
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const partialItem = {
        name: `${selectedTable || 'Masa'} Parçalı Tahsilat`,
        quantity: 1,
        price: amountToPay
      };

      const resCreate = await api.createPosSale({
        items: [partialItem],
        total: amountToPay,
        paymentMethod: partialPayMethod,
        customerName: selectedTable ? `${selectedTable} (Kısmi Ödeme)` : 'Parçalı Satış',
        notes: selectedTable ? `${selectedTable} Parçalı Tutar Tahsilatı` : 'Parçalı Tutar Ödemesi',
        currency: branding?.default_currency || 'TRY',
        exchangeRate: 1
      }, storeId);

      if (!resCreate.success) {
        throw new Error(resCreate.error || "Kısmi ödeme kaydedilemedi.");
      }

      if (autoPrintOnPay) {
        printThermalReceipt({
          title: "PARÇALI ÖDEME FİŞİ",
          storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
          storePhone: branding?.phone || branding?.whatsapp_number,
          tableNo: selectedTable || "Hızlı Kasa",
          saleId: resCreate.saleId,
          items: [{ name: "Adisyondan Kısmi Tahsilat", quantity: 1, price: amountToPay }],
          totalAmount: amountToPay,
          paymentMethod: partialPayMethod === 'cash' ? 'NAKİT' : 'KREDİ KARTI',
          notes: `Masada Kalan Adisyon Tutarı: ${remainingAmount.toFixed(2)} ₺`
        });
      }

      if (activeSaleId !== null) {
        await api.updatePendingSale(activeSaleId, {
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price) || 0,
            barcode: item.barcode || ''
          })),
          total: remainingAmount,
          customerName: selectedTable
        }, storeId);
      }

      toast.success(
        lang === 'tr'
          ? `✅ ${amountToPay.toFixed(2)} ₺ ödeme alındı! Adisyon kalan ${remainingAmount.toFixed(2)} ₺ tutarla AÇIK tutuluyor.`
          : `✅ ${amountToPay.toFixed(2)} ₺ paid! Table remains open with ${remainingAmount.toFixed(2)} ₺ remaining.`
      );

      setShowSplitModal(false);
      fetchPendingSales();
      if (onSaleComplete) onSaleComplete();
    } catch (err: any) {
      toast.error(err.message || "İşlem sırasında hata oluştu.");
    } finally {
      setCompleting(false);
      setPosStatus('idle');
    }
  };

  const handleEqualSplit = (parts: number) => {
    if (parts <= 0) return;
    const partAmount = (total / parts).toFixed(2);
    const newPayments = [];
    for (let i = 0; i < parts; i++) {
      const isLast = i === parts - 1;
      const amt = isLast ? (total - (parseFloat(partAmount) * (parts - 1))).toFixed(2) : partAmount;
      newPayments.push({
        method: i % 2 === 0 ? 'cash' as const : 'credit_card' as const,
        amount: amt
      });
    }
    setSplitPayments(newPayments);
  };

  const handleFinalizeSplitSale = async () => {
    try {
      setCompleting(true);
      
      const payloadPayments = splitPayments.map(p => ({
        method: p.method,
        amount: parseFloat(p.amount) || 0
      }));

      // POS Integration simulation if they have Credit Card payments in the split
      const hasCc = splitPayments.some(p => p.method === 'credit_card');
      if (hasCc && branding?.pos_bridge_enabled) {
        setPosStatus('waiting');
        setPosMessage(lang === 'tr' ? `Fiziksel POS Cihazına bağlanılıyor...` : `Connecting to Physical POS...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPosStatus('approved');
        setPosMessage(lang === 'tr' ? "POS Ödemesi Onaylandı!" : "POS Payment Approved!");
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      if (activeSaleId !== null) {
        // Complete pending adisyon
        const res = await api.completeSale(activeSaleId, {
          paymentMethod: 'multiple',
          payments: payloadPayments,
          items: cart.map(item => ({
            product_id: item.id,
            product_name: item.note ? `${item.name} (${item.note})` : item.name,
            unit_price: parseFloat(item.price) || 0,
            quantity: item.quantity
          }))
        }, storeId);

        if (res.success) {
          setLastSaleId(activeSaleId);
          setLastFiscal(res.fiscal);
          setLastCart(cart.map(item => ({ ...item, price: parseFloat(item.price) || 0, name: item.note ? `${item.name} (${item.note})` : item.name })));
          setShowSuccess(true);
          setCart([]);
          setActiveSaleId(null);
          setSelectedTable(null);
          setShowSplitModal(false);
          fetchPendingSales();
          if (onSaleComplete) onSaleComplete();
        }
      } else {
        // Direct cash register sale with multiple payments
        const currentCart = cart.map(item => ({
          ...item,
          name: item.note ? `${item.name} (${item.note})` : item.name,
          price: parseFloat(item.price) || 0
        }));
        
        const resCreate = await api.createPosSale({
          items: currentCart,
          total,
          paymentMethod: 'multiple',
          customerName: selectedTable || 'Hızlı Satış',
          notes: selectedTable ? `${selectedTable} Satışı` : 'Hızlı POS Modu (Parçalı)',
          currency: branding?.default_currency || 'TRY',
          exchangeRate: 1,
          status: 'pending' // Create it as pending!
        }, storeId);

        if (resCreate.success && resCreate.saleId) {
          // Then immediately complete it with the payments array!
          const resComplete = await api.completeSale(resCreate.saleId, {
            paymentMethod: 'multiple',
            payments: payloadPayments
          }, storeId);

          if (resComplete.success) {
            setLastSaleId(resCreate.saleId);
            setLastFiscal(resComplete.fiscal);
            setLastCart(currentCart);
            setShowSuccess(true);
            setCart([]);
            setSelectedTable(null);
            setShowSplitModal(false);
            if (onSaleComplete) onSaleComplete();
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || (lang === 'tr' ? "Parçalı ödeme tamamlanırken hata oluştu." : "Error completing split payment."));
    } finally {
      setCompleting(false);
      setPosStatus('idle');
    }
  };

  const handleTableTransfer = async (targetTableNumber: string) => {
    if (!selectedTable || !targetTableNumber) return;
    if (selectedTable === targetTableNumber) {
      setIsChangingTable(false);
      return;
    }

    try {
      setTransferLoading(true);
      const toTable = allTables.find(t => t.table_number === targetTableNumber);

      if (!toTable) {
        toast.error(lang === 'tr' ? "Hedef masa bulunamadı." : "Target table not found.");
        return;
      }

      const fromTable = allTables.find(t => t.table_number === selectedTable);

      const res = await api.post("/api/store/restaurant/tables/transfer", {
        fromTableId: fromTable ? fromTable.id : null,
        toTableId: toTable.id,
        saleId: activeSaleId
      });

      if (res && res.success) {
        toast.success(lang === 'tr' ? `Adisyon ${targetTableNumber} masasına başarıyla taşındı.` : `Order transferred to table ${targetTableNumber} successfully.`);
        setIsChangingTable(false);
        setSelectedTable(null);
        setActiveSaleId(null);
        setCart([]);
        fetchPendingSales();
      } else {
        toast.error(res?.error || "Transfer failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Error");
    } finally {
      setTransferLoading(false);
    }
  };

  useEffect(() => {
    if (isChangingTable || showQrModal) {
      api.getRestaurantTables(storeId!).then(setAllTables).catch(console.error);
    }
  }, [isChangingTable, showQrModal, storeId]);

  const handleSaveToTable = async () => {
    if (cart.length === 0 || !selectedTable) return;
    try {
      setCompleting(true);
      const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0);
      const itemsToSave = cart.map(it => ({
        id: it.id,
        product_id: it.product_id || it.id,
        name: it.note ? `${it.name} (${it.note})` : it.name,
        price: it.price,
        quantity: it.quantity,
        barcode: it.barcode || '',
        selectedVariant: it.selectedVariant,
        selected_variant_name: it.selectedVariant ? it.selectedVariant.name : (it.selected_variant_name || null),
        variant: it.selectedVariant,
        variant_recipe_items: it.selectedVariant ? it.selectedVariant.recipe_items : null,
        recipe_items: it.selectedVariant ? it.selectedVariant.recipe_items : (it.recipe_items || null)
      }));

      if (activeSaleId !== null) {
        const res = await api.updatePendingSale(activeSaleId, {
          items: itemsToSave,
          total,
          customerName: selectedTable
        }, storeId);
        if (res.success) {
          if (autoPrintOnOrder) {
            handlePrintReceipt();
          }
          setCart([]);
          setActiveSaleId(null);
          setSelectedTable(null);
          fetchPendingSales();
        }
      } else {
        const res = await api.createPosSale({
          items: itemsToSave,
          total,
          paymentMethod: 'cash',
          customerName: selectedTable,
          notes: `${selectedTable} Adisyonu`,
          currency: branding?.default_currency || 'TRY',
          exchangeRate: 1,
          status: 'pending'
        }, storeId);
        if (res.success) {
          if (autoPrintOnOrder) {
            handlePrintReceipt();
          }
          setCart([]);
          setActiveSaleId(null);
          setSelectedTable(null);
          fetchPendingSales();
        }
      }
    } catch (e: any) {
      alert(e.message || "Adisyon kaydedilirken hata oluştu.");
    } finally {
      setCompleting(false);
    }
  };

  const handleChangeTable = async (newTableName: string) => {
    if (!selectedTable || activeSaleId === null) return;
    try {
      setCompleting(true);
      const res = await api.updatePendingSale(activeSaleId, {
        items: cart.map(it => ({
          id: it.id,
          name: it.note ? `${it.name} (${it.note})` : it.name,
          price: it.price,
          quantity: it.quantity,
          barcode: it.barcode || ''
        })),
        total,
        customerName: newTableName
      }, storeId);
      if (res.success) {
        setSelectedTable(newTableName);
        fetchPendingSales();
        setIsChangingTable(false);
      }
    } catch (e: any) {
      alert(e.message || "Masa değiştirilirken hata oluştu.");
    } finally {
      setCompleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col space-y-2 h-[calc(100vh-80px)] min-h-[600px]">
      {/* Customer Table Service Calls Notification Banner */}
      {storeTableCalls.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-rose-600 text-white p-3 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Bell className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">
                {lang === 'tr' ? `Müşteri Talep Bildirimi (${storeTableCalls.length} Bekleyen)` : `Customer Table Requests (${storeTableCalls.length} Pending)`}
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                {storeTableCalls.map(c => `${c.tableId}: ${c.type}`).join(' | ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto max-w-full">
            {storeTableCalls.map(call => {
              const saleForCall = pendingSales.find(s => 
                s.customer_name?.toLowerCase().includes(call.tableId.toString().toLowerCase()) || 
                s.restaurant_table_id?.toString() === call.tableId.toString()
              );
              return (
                <div key={call.id} className="bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-xl flex items-center gap-2 shrink-0 border border-white/20">
                  <span className="text-xs font-black">{call.tableId} - {call.type}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (saleForCall) {
                        handlePrintTableBill(saleForCall);
                      } else {
                        printThermalReceipt({
                          title: "HESAP TALEBİ FİŞİ",
                          storeName: branding?.store_name || branding?.name || 'TELOCA CAFE',
                          storePhone: branding?.phone || branding?.whatsapp_number,
                          tableNo: call.tableId,
                          items: [],
                          totalAmount: 0,
                          paymentMethod: "HESAP İSTENDİ"
                        });
                      }
                    }}
                    className="px-2 py-0.5 bg-indigo-900/80 hover:bg-indigo-900 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-1"
                    title={lang === 'tr' ? 'Masaya ait adisyon fişini yazdır' : 'Print bill for table'}
                  >
                    <Printer className="w-3 h-3 text-amber-300" />
                    {lang === 'tr' ? 'Fiş Yazdır' : 'Print Bill'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveTableCall(call.id)}
                    className="px-2 py-0.5 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shadow-xs"
                  >
                    {lang === 'tr' ? 'İlgilenildi' : 'Resolve'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sleek Ultra-Compact Header Bar */}
      <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          {isCafeRestaurant && selectedTable !== null && (
            <button
              onClick={() => {
                setSelectedTable(null);
                setActiveSaleId(null);
                setCart([]);
                fetchPendingSales();
              }}
              className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-all flex items-center justify-center border border-slate-200 shadow-2xs cursor-pointer"
              title={lang === 'tr' ? "Masalara Geri Dön" : "Back to Tables"}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="h-7 w-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
            {isCafeRestaurant && selectedTable !== null ? (
              <Coffee className="h-3.5 w-3.5 text-rose-500" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5" />
            )}
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">
              {isCafeRestaurant && selectedTable !== null ? (
                <span>{selectedTable} {activeSaleId !== null ? `(${lang === 'tr' ? 'Açık Adisyon' : 'Open Bill'})` : `(${lang === 'tr' ? 'Yeni Sipariş' : 'New Order'})`}</span>
              ) : (
                branding?.store_name || branding?.name || (lang === 'tr' ? "Seçkin Mağaza" : "Premium Store")
              )}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
              {isCafeRestaurant && selectedTable !== null ? (
                <span>{branding?.store_name || branding?.name || (lang === 'tr' ? "Seçkin Restoran" : "Premium Restaurant")}</span>
              ) : (
                lang === 'tr' ? "Hızlı Satış & POS Terminali" : "Quick Sales & POS Terminal"
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Cafe Restaurant Specific Tools */}
          {isCafeRestaurant && (
            <>
              <button
                onClick={() => setShowQrModal(true)}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                title={lang === 'tr' ? "Masalara Özel QR ve Barkodları Üret / Yazdır" : "Generate / Print Table QR & Barcodes"}
              >
                <QrCode className="h-3.5 w-3.5 text-rose-600" />
                <span>{lang === 'tr' ? 'Masa QR & Barkod' : 'Table QR & Barcodes'}</span>
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                <span>{lang === 'tr' ? 'Gün Sonu Raporu' : 'End of Day Report'}</span>
              </button>

              <button
                onClick={() => {
                  setPrinterDiagStep('idle');
                  setShowPrinterDiagnosticModal(true);
                }}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                title={lang === 'tr' ? "Mutfak/Bar Yazıcı Sorun Giderici ve Tanı Modülü" : "Kitchen/Bar Printer Troubleshooter & Diagnostics"}
              >
                <Printer className="h-3.5 w-3.5 text-amber-600" />
                <span>{lang === 'tr' ? 'Yazıcı Tanısı' : 'Printer Diagnosis'}</span>
              </button>

              <button
                onClick={() => setShowHappyHourModal(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer border ${
                  isHappyHourActive
                    ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                }`}
                title={lang === 'tr' ? "Happy Hour (Mutlu Saatler) Kampanya Yapılandırması" : "Happy Hour Campaign Config"}
              >
                <Flame className={`h-3.5 w-3.5 ${isHappyHourActive ? 'text-white font-bold' : 'text-indigo-600'}`} />
                <span>
                  {isHappyHourActive
                    ? (lang === 'tr' ? 'Happy Hour Aktif!' : 'Happy Hour Active!')
                    : (lang === 'tr' ? 'Happy Hour' : 'Happy Hour')}
                </span>
              </button>
            </>
          )}

          {/* Bridge Status Indicator */}
          {branding?.pos_bridge_enabled && (
            <div className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 ${
              bridgeDetected 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${bridgeDetected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              {bridgeDetected ? (lang === 'tr' ? 'POS Köprüsü' : 'POS Bridge') : (lang === 'tr' ? 'Köprü Yok' : 'Disconnected')}
            </div>
          )}
        </div>
      </div>

      {/* Main High-Density Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Tables or Product Selection */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col space-y-2 h-full min-h-0 overflow-hidden">
          {isCafeRestaurant && selectedTable === null ? (
            /* Cafe / Restaurant Main Table Grid View */
            <>
              {/* Ultra-compact single line summary bar */}
              <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                    <Coffee className="h-3 w-3 text-rose-600" />
                    <span className="text-slate-500 font-medium">{lang === 'tr' ? 'Dolu:' : 'Occupied:'}</span>
                    <span className="font-extrabold">{pendingSales.length} / {allTables.length > 0 ? allTables.length : (branding?.page_layout_settings?.table_count || 12)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span className="text-slate-500 font-medium">{lang === 'tr' ? 'Boş:' : 'Empty:'}</span>
                    <span className="font-extrabold">{(allTables.length > 0 ? allTables.length : (branding?.page_layout_settings?.table_count || 12)) - pendingSales.length} / {allTables.length > 0 ? allTables.length : (branding?.page_layout_settings?.table_count || 12)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-extrabold text-xs shadow-xs">
                  <TrendingUp className="h-3 w-3 text-indigo-200" />
                  <span className="text-indigo-100 font-medium">{lang === 'tr' ? 'Aktif Toplam:' : 'Active:'}</span>
                  <span>{pendingSales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0).toFixed(2)} ₺</span>
                </div>
              </div>

              {/* Table Grid container taking maximum height */}
              <div className="flex-1 overflow-y-auto bg-white/60 border border-slate-200 rounded-xl p-2 min-h-0 shadow-2xs">
                <TableGrid 
                  storeId={storeId!} 
                  refreshTrigger={tablesRefreshTrigger}
                  pendingSales={pendingSales}
                  onTableSelect={(table) => {
                    setSelectedTable(table.table_number);
                    if (table.status === 'occupied') {
                      const normalizeName = (str: string) => str ? str.toLowerCase().replace(/\s+/g, '') : '';
                      let sale = null;

                      if (table.isGarsonTable || table.id === -999 || (table.table_number === 'Garson Masası' || table.table_number === 'Waiter Table' || table.table_number === 'Τραπέζι Σερβιτόρου')) {
                        sale = pendingSales.find(s => 
                          s.restaurant_table_id === null || 
                          s.customer_name?.toLowerCase().includes('garson') || 
                          s.customer_name === 'Masa Siparişi' || 
                          s.notes?.toLowerCase().includes('garson')
                        );
                      } else {
                        sale = pendingSales.find(s => {
                          if (s.restaurant_table_id === table.id) return true;
                          const sName = normalizeName(s.customer_name);
                          const tNum = normalizeName(table.table_number);
                          return sName === tNum || sName === `masa${tNum}` || sName.includes(`masa${tNum}`) || sName === `table${tNum}`;
                        });
                      }

                      if (sale) {
                        setActiveSaleId(sale.id);
                        const mappedCart = sale.items.map((it: any) => {
                          const fullName = it.product_name || '';
                          const match = fullName.match(/(.+?)\s*\((.+?)\)$/);
                          const cleanName = match ? match[1].trim() : fullName;
                          const parsedNote = match ? match[2].trim() : '';
                          return {
                            id: it.product_id,
                            name: cleanName,
                            note: parsedNote,
                            price: it.unit_price.toString(),
                            quantity: it.quantity,
                            barcode: it.barcode || '',
                            currency: sale.currency || 'TRY'
                          };
                        });
                        setCart(mappedCart);
                      } else {
                        setActiveSaleId(null);
                        setCart([]);
                      }
                    } else {
                      setActiveSaleId(null);
                      setCart([]);
                    }
                  }}
                />
              </div>
            </>
          ) : (
            /* Product Selection View (When a table is selected or in standard POS mode) */
            <>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs shrink-0">
                <div className="relative">
                  <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder={lang === 'tr' ? "Barkod okutun veya ürün adı yazın..." : "Scan barcode or type product name..."}
                    className="w-full pl-10 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchTerm.trim()) {
                        const term = searchTerm.trim().toLowerCase();
                        let matchedProduct: any = null;
                        let matchedVariant: any = null;

                        for (const p of allProducts) {
                          if ((p.barcode && p.barcode.toLowerCase() === term) || (p.sku && p.sku.toLowerCase() === term)) {
                            matchedProduct = p;
                            break;
                          }
                          if (p.has_variants && Array.isArray(p.variants)) {
                            const vMatch = p.variants.find((v: any) => 
                              (v.barcode && v.barcode.toLowerCase() === term) || 
                              (v.sku && v.sku.toLowerCase() === term)
                            );
                            if (vMatch) {
                              matchedProduct = p;
                              matchedVariant = vMatch;
                              break;
                            }
                          }
                        }

                        if (!matchedProduct && filteredProducts.length > 0) {
                          matchedProduct = filteredProducts[0];
                        }

                        if (matchedProduct) {
                          if (matchedVariant) {
                            addToCart(matchedProduct, matchedVariant);
                          } else {
                            handleProductClick(matchedProduct);
                          }
                          setSearchTerm("");
                        } else if (setShowQuickProductModal && setQuickProductForm) {
                          setQuickProductForm({ name: term, price: '', tax_rate: '20', category: '', sub_category: '', type: 'product' });
                          setShowQuickProductModal(true);
                        }
                      }
                    }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                    onClick={() => {
                      setSearchTerm("");
                      if (searchInputRef.current) searchInputRef.current.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                    title={lang === 'tr' ? "Aramayı Temizle" : "Clear Search"}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            {categories.length > 0 && (
              <div className="flex flex-col gap-1.5 shrink-0">
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none px-0.5">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(selectedCategory === category ? "all" : category);
                        setSelectedSubCategory("all");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                        selectedCategory === category
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {subCategories.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none px-0.5">
                    {subCategories.map((subCategory) => (
                      <button
                        key={subCategory}
                        onClick={() => setSelectedSubCategory(selectedSubCategory === subCategory ? "all" : subCategory)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black tracking-wider uppercase transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                          selectedSubCategory === subCategory
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {subCategory}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-xs overflow-y-auto p-2.5 sm:p-3">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      title={product.name}
                      className="relative flex flex-col h-38 sm:h-42 w-full bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 hover:z-10 transition-all text-center group active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation cursor-pointer shadow-xs"
                    >
                      {/* Top Half: Image */}
                      <div className="w-full h-18 sm:h-20 bg-white flex items-center justify-center p-2 border-b border-slate-100 rounded-t-xl overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt="" 
                            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <Package className="h-7 w-7 sm:h-8 sm:w-8 text-slate-300 group-hover:scale-105 transition-transform duration-200" />
                        )}
                      </div>

                      {/* Bottom Half: Name & Price */}
                      <div className="w-full flex-1 p-2 flex flex-col justify-between items-center bg-slate-50 group-hover:bg-indigo-50/40 rounded-b-xl relative">
                        <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                          <span className="text-xs font-bold text-slate-800 line-clamp-2 px-0.5 text-center leading-tight">
                            {product.name}
                          </span>
                        </div>
                        {isHappyHourActive && product.price_2 && parseFloat(product.price_2.toString()) > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 line-through leading-none">
                              {product.price} {product.currency || 'TRY'}
                            </span>
                            <span className="text-xs font-extrabold text-rose-600 leading-tight">
                              {product.price_2} {product.currency || 'TRY'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-black text-indigo-600 mt-1 whitespace-nowrap">
                            {product.price} {product.currency || 'TRY'}
                          </span>
                        )}
                      </div>

                      {/* Full-card Elegant Overlay on Hover/Focus */}
                      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xs text-white flex flex-col items-center justify-center p-2.5 rounded-xl opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 pointer-events-none z-10 text-center">
                        <ShoppingCart className="h-4 w-4 text-indigo-400 mb-1 animate-bounce" />
                        <p className="text-xs font-extrabold line-clamp-2 px-1 leading-snug">{product.name}</p>
                        {isHappyHourActive && product.price_2 && parseFloat(product.price_2.toString()) > 0 ? (
                          <div className="text-center mt-1">
                            <span className="text-[10px] text-slate-300 line-through block leading-none">
                              {product.price} {product.currency || 'TRY'}
                            </span>
                            <span className="text-xs text-rose-400 font-extrabold leading-tight">
                              {product.price_2} {product.currency || 'TRY'}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-indigo-300 mt-1 font-black">{product.price} {product.currency || 'TRY'}</p>
                        )}
                        <span className="text-[9px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded mt-1 tracking-wider">
                          {lang === 'tr' ? 'SEPETE EKLE' : 'ADD TO CART'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm.length > 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
                  <Search className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-xs font-medium">{lang === 'tr' ? 'Ürün bulunamadı' : 'No products found'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
                  <Barcode className="h-12 w-12 mb-3 opacity-10" />
                  <p className="text-xs font-medium">{lang === 'tr' ? 'Satış yapmak için ürün seçin veya barkod okutun' : 'Select products or scan barcode to start sale'}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

          {/* Right Side: Cart or Open Bills Live Panel */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col h-full min-h-0 overflow-hidden">
            {isCafeRestaurant && selectedTable === null ? (
              /* Live Open Bills Panel when no table is selected */
              <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
                {/* Header */}
                <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-rose-500" />
                    <h3 className="font-extrabold text-sm text-slate-800">
                      {lang === 'tr' ? 'Açık Adisyonlar' : 'Open Bills'}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-md text-xs font-black">
                    {pendingSales.length} {lang === 'tr' ? 'Masa' : 'Tables'}
                  </span>
                </div>

                {/* Scrollable Live List of Open Bills */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {pendingSales.map((sale) => (
                    <div key={sale.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl flex items-center justify-between transition-all shadow-2xs">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{sale.customer_name || 'Masa'}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                            {sale.items.length} Kalem
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                          {sale.notes || (lang === 'tr' ? 'Sipariş bekliyor' : 'Order pending')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-black text-sm text-indigo-600">
                          {parseFloat(sale.total_amount).toFixed(2)} ₺
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePrintTableBill(sale)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1 border border-slate-200"
                          title={lang === 'tr' ? 'Termal Adisyon Fişi Yazdır' : 'Print Thermal Bill'}
                        >
                          <Printer className="h-3.5 w-3.5 text-slate-600" />
                        </button>
                        <button
                          onClick={() => {
                            const tableName = sale.customer_name || 'Masa';
                            setSelectedTable(tableName);
                            setActiveSaleId(sale.id);
                            const mappedCart = sale.items.map((it: any) => {
                              const fullName = it.product_name || '';
                              const match = fullName.match(/(.+?)\s*\((.+?)\)$/);
                              const cleanName = match ? match[1].trim() : fullName;
                              const parsedNote = match ? match[2].trim() : '';
                              return {
                                id: it.product_id,
                                name: cleanName,
                                note: parsedNote,
                                price: it.unit_price.toString(),
                                quantity: it.quantity,
                                barcode: it.barcode || '',
                                currency: sale.currency || 'TRY'
                              };
                            });
                            setCart(mappedCart);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          {lang === 'tr' ? 'Adisyona Git →' : 'View Bill →'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {pendingSales.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12 text-center px-4">
                      <Coffee className="h-10 w-10 mb-2 opacity-20 text-rose-500" />
                      <p className="text-xs font-bold text-slate-500">{lang === 'tr' ? 'Şu an açık adisyon yok' : 'No open bills currently'}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{lang === 'tr' ? 'Sol taraftan bir masa seçerek sipariş başlatabilirsiniz.' : 'Select a table on left to start order.'}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Garson Masası Quick Order trigger */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedTable(lang === 'tr' ? 'Garson Masası' : (lang === 'el' ? 'Τραπέζι Σερβιτόρου' : 'Waiter Table'));
                      const garsonSale = pendingSales.find(s => 
                        s.restaurant_table_id === null || 
                        s.customer_name?.toLowerCase().includes('garson') || 
                        s.customer_name === 'Masa Siparişi' || 
                        s.notes?.toLowerCase().includes('garson')
                      );
                      if (garsonSale) {
                        setActiveSaleId(garsonSale.id);
                        const mappedCart = garsonSale.items.map((it: any) => {
                          const fullName = it.product_name || '';
                          const match = fullName.match(/(.+?)\s*\((.+?)\)$/);
                          const cleanName = match ? match[1].trim() : fullName;
                          const parsedNote = match ? match[2].trim() : '';
                          return {
                            id: it.product_id,
                            name: cleanName,
                            note: parsedNote,
                            price: it.unit_price.toString(),
                            quantity: it.quantity,
                            barcode: it.barcode || '',
                            currency: garsonSale.currency || 'TRY'
                          };
                        });
                        setCart(mappedCart);
                      } else {
                        setActiveSaleId(null);
                        setCart([]);
                      }
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'tr' ? 'Garson Masası / Hızlı Ayakta Satış' : 'Quick Walk-up Order'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Active Cart / Checkout Panel */
              <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
              {/* Header */}
              <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-indigo-600" />
                  <h3 className="font-extrabold text-sm text-slate-800">
                    {isCafeRestaurant && selectedTable !== null ? `${selectedTable} ${lang === 'tr' ? 'Adisyonu' : 'Bill'}` : (lang === 'tr' ? 'Satış Sepeti' : 'Sales Cart')}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button 
                      onClick={() => setCart([])} 
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer" 
                      title={lang === 'tr' ? "Sepeti Temizle" : "Clear Cart"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{lang === 'tr' ? "Temizle" : "Clear"}</span>
                    </button>
                  )}
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-black">
                    {cart.length} {lang === 'tr' ? 'Kalem' : 'Items'}
                  </span>
                </div>
              </div>

              {/* Scrollable Cart Items */}
              <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 min-h-0">
                <AnimatePresence initial={false}>
                  {cart.map((item, index) => (
                    <motion.div 
                      key={item.cart_item_id || `${item.id}_${item.selected_variant_name || 'base'}_${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 flex flex-col shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{translateText(item.name, lang)}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updatePrice(index, e.target.value)}
                              className="w-18 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 transition-colors"
                            />
                            <span className="text-[11px] font-medium text-slate-500">{item.currency || 'TRY'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                            <button 
                              onClick={() => updateQuantity(index, -1)}
                              className="p-1 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(index, 1)}
                              className="p-1 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(index)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Item level special request/note input */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-2xs">
                        <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder={lang === 'tr' ? 'Özel istek / Mutfağa not (örn: Demli, Açık)' : 'Special note for kitchen (e.g. strong, light)'}
                          value={item.note || ''}
                          onChange={(e) => updateNote(index, e.target.value)}
                          className="w-full bg-transparent border-none text-[11px] font-medium text-slate-600 outline-none placeholder-slate-400"
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {cart.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                    <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-xs font-semibold">{lang === 'tr' ? 'Sepet henüz boş' : 'Cart is empty'}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{lang === 'tr' ? 'Soldaki ürünlere tıklayarak ekleyin' : 'Click products on left to add'}</p>
                  </div>
                )}
              </div>

              {/* Checkout Footer Pinned at Bottom */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2 shrink-0">
                {/* Total Amount & Payment Method Selection Row */}
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{lang === 'tr' ? 'TOPLAM TUTAR' : 'TOTAL AMOUNT'}</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">{total.toFixed(2)} ₺</span>
                  </div>

                  {activeStaffRole !== 'waiter' && (
                    <div className="flex items-center p-0.5 bg-slate-200/70 rounded-xl">
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          paymentMethod === 'cash' 
                            ? 'bg-white text-emerald-700 shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{lang === 'tr' ? 'Nakit' : 'Cash'}</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('credit_card')}
                        className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          paymentMethod === 'credit_card' 
                            ? 'bg-white text-blue-700 shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                        <span>{lang === 'tr' ? 'Kart' : 'Card'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {activeStaffRole === 'waiter' ? (
                  /* Waiter specific view */
                  <div className="space-y-1.5">
                    <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-200/60 text-amber-800 text-[10px] font-semibold flex items-center gap-1">
                      <span>⚠️ {lang === 'tr' ? 'Garson Modu: Sipariş masaya aktarılabilir.' : 'Waiter Mode: Send order to table.'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        disabled={cart.length === 0 || completing}
                        onClick={handleSaveToTable}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 disabled:opacity-50 cursor-pointer"
                      >
                        <Coffee className="h-3.5 w-3.5" />
                        {lang === 'tr' ? 'Masaya Kaydet' : 'Save to Table'}
                      </button>

                      {isCafeRestaurant && selectedTable !== null && (
                        <button
                          disabled={activeSaleId === null || completing}
                          onClick={() => setIsChangingTable(true)}
                          className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 disabled:opacity-50 cursor-pointer"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          {lang === 'tr' ? 'Masa Değiştir' : 'Change Table'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Manager & Cashier View */
                  <>
                    {/* Compact Toolbar Row for Table / Auxiliary Actions */}
                    {isCafeRestaurant && selectedTable !== null ? (
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          disabled={cart.length === 0 || completing}
                          onClick={handleSaveToTable}
                          className="py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 rounded-xl font-bold text-[11px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1 disabled:opacity-40 cursor-pointer active:scale-95"
                          title={lang === 'tr' ? "Siparişi masaya kaydet (Açık tut)" : "Save to table"}
                        >
                          <Coffee className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{lang === 'tr' ? 'Kaydet' : 'Save'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={cart.length === 0 || completing}
                          onClick={() => handlePrintReceipt()}
                          className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 rounded-xl font-bold text-[11px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1 disabled:opacity-40 cursor-pointer active:scale-95"
                          title={lang === 'tr' ? "Masanın güncel adisyon fişini yazdır" : "Print bill slip"}
                        >
                          <Printer className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                          <span className="truncate">{lang === 'tr' ? 'Fiş Yaz' : 'Print'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={activeSaleId === null || completing}
                          onClick={() => setIsChangingTable(true)}
                          className="py-2 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 rounded-xl font-bold text-[11px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1 disabled:opacity-40 cursor-pointer active:scale-95"
                          title={lang === 'tr' ? "Masa değiştir / siparişi başka masaya aktar" : "Transfer table"}
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{lang === 'tr' ? 'Masa Değiş' : 'Transfer'}</span>
                        </button>

                        <button 
                          type="button"
                          disabled={cart.length === 0 || completing}
                          onClick={openSplitPaymentModal}
                          className="py-2 px-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl font-bold text-[11px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1 disabled:opacity-40 cursor-pointer active:scale-95"
                          title={lang === 'tr' ? "Alman usulü veya parçalı ödeme yap" : "Split payment"}
                        >
                          <Split className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">{lang === 'tr' ? 'Parçalı' : 'Split'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5">
                        <button 
                          type="button"
                          disabled={cart.length === 0 || completing}
                          onClick={openSplitPaymentModal}
                          className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
                        >
                          <Split className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>{lang === 'tr' ? 'Alman Usulü / Parçalı Ödeme' : 'Split / Partial Payment'}</span>
                        </button>
                      </div>
                    )}

                    {/* Primary Big Checkout Button */}
                    <button 
                      disabled={cart.length === 0 || completing}
                      onClick={handleFinalizeSale}
                      className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      {completing ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>
                            {isCafeRestaurant && selectedTable !== null 
                              ? (lang === 'tr' ? 'Hesabı Kapat / Öde' : 'Close Table & Pay') 
                              : (lang === 'tr' ? 'Satışı Tamamla' : 'Complete Sale')}
                          </span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {posStatus !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100"
            >
              <div className="relative mb-8">
                <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto transition-all duration-500 ${
                  posStatus === 'waiting' ? 'bg-indigo-50 text-indigo-600' : 
                  posStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                  'bg-rose-50 text-rose-600'
                }`}>
                  {posStatus === 'waiting' && <CreditCard className="h-12 w-12 animate-pulse" />}
                  {posStatus === 'approved' && <CheckCircle2 className="h-12 w-12" />}
                  {posStatus === 'failed' && <X className="h-12 w-12" />}
                </div>
                {posStatus === 'waiting' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-24 w-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              
              <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">
                {posStatus === 'waiting' ? (lang === 'tr' ? 'POS İŞLEMİ' : 'POS TRANSACTION') : 
                 posStatus === 'approved' ? (lang === 'tr' ? 'ONAYLANDI' : 'APPROVED') : 
                 (lang === 'tr' ? 'HATA' : 'ERROR')}
              </h2>
              
              <p className="text-slate-500 font-bold text-sm leading-relaxed">
                {posMessage}
              </p>

              {posMessage.includes("Yerel bağlantı köprüsü") && (
                <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Kurulum Gerekli</h4>
                  <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                    Web tarayıcıları güvenlik nedeniyle yerel ağdaki cihazlara (192.168.x.x) doğrudan erişemez. 
                    İletişimi sağlamak için bilgisayarınızda bir <b>"LookPrice POS Bridge"</b> yazılımı çalışıyor olmalıdır.
                  </p>
                </div>
              )}

              {posStatus === 'failed' && (
                <button 
                  onClick={() => setPosStatus('idle')}
                  className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  {lang === 'tr' ? 'Kapat' : 'Close'}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div>
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">{lang === 'tr' ? 'Satış Başarılı!' : 'Sale Successful!'}</h2>
                <p className="text-slate-400 font-medium text-xs mb-4">
                  {lang === 'tr' ? `Satış #${lastSaleId} başarıyla kaydedildi.` : `Sale #${lastSaleId} recorded successfully.`}
                </p>
              </div>

              {/* Thermal Receipt Visual Preview (On Screen) */}
              <div className="mb-6 max-h-64 overflow-y-auto bg-amber-50/40 border border-amber-200/40 rounded-2xl p-5 text-left font-mono text-xs leading-relaxed text-slate-800 shadow-inner scrollbar-thin">
                <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
                  <h4 className="font-extrabold text-sm uppercase text-slate-900 tracking-tight">
                    {branding?.store_name || branding?.name || (lang === 'tr' ? "Seçkin Mağaza" : "Premium Store")}
                  </h4>
                  <p className="text-[10px] text-amber-800 font-bold mt-1 tracking-widest">{lang === 'tr' ? 'SİPARİŞ FİŞİ' : 'ORDER RECEIPT'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Mağaza ID: {storeId} | Fiş: #{lastSaleId}</p>
                  <p className="text-[10px] text-slate-400">{new Date().toLocaleString('tr-TR')}</p>
                </div>
                
                <div className="space-y-1.5 mb-3 text-[11px] text-slate-700">
                  {lastCart.map((item, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="truncate flex-1 font-semibold">{item.quantity}x {item.name}</span>
                      <span className="font-bold text-slate-900">{(parseFloat(item.price) * item.quantity).toFixed(2)} ₺</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-dashed border-slate-300 pt-3 font-bold text-xs">
                  <div className="flex justify-between text-slate-900 text-sm">
                    <span>TOPLAM</span>
                    <span>{lastCart.reduce((sum, i) => sum + ((parseFloat(i.price) || 0) * i.quantity), 0).toFixed(2)} ₺</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px] mt-1 font-medium">
                    <span>Ödeme Tipi</span>
                    <span className="uppercase text-slate-700 font-bold">{paymentMethod === 'cash' ? (lang === 'tr' ? 'NAKİT' : 'CASH') : (lang === 'tr' ? 'KREDİ KARTI' : 'CREDIT CARD')}</span>
                  </div>
                </div>

                {lastFiscal && (
                  <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-[9px] text-center text-slate-400">
                    <p>FİŞ NO: {lastFiscal.receiptNo}</p>
                    <p>Z NO: {lastFiscal.zNo}</p>
                    <p>CİHAZ: {lastFiscal.brand} - {lastFiscal.terminal}</p>
                    <p className="mt-1 font-bold">MALİ MÜHÜR</p>
                  </div>
                )}
                
                <div className="mt-4 text-center text-[9px] text-slate-400">
                  <p>Bizi tercih ettiğiniz için teşekkürler!</p>
                </div>
              </div>

              {/* Hidden Clean HTML for Thermal Printer Output */}
              <div id="pos-receipt-printable" className="hidden">
                <div className="text-center border-b">
                  <h3 className="font-bold" style={{ fontSize: '13px', margin: '0' }}>
                    {branding?.store_name || branding?.name || 'LOOKPRICE TERMINAL'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>SİPARİŞ FİŞİ</p>
                  <p style={{ margin: '2px 0 0 0' }}>Mağaza ID: {storeId} | Fiş No: #{lastSaleId}</p>
                  <p style={{ margin: '2px 0 0 0' }}>{new Date().toLocaleString('tr-TR')}</p>
                </div>
                
                <div style={{ margin: '8px 0' }}>
                  {lastCart.map((item, idx) => (
                    <div key={idx} className="flex-between" style={{ fontSize: '11px', marginBottom: '2px' }}>
                      <span>{item.quantity}x {item.name}</span>
                      <span>{(parseFloat(item.price) * item.quantity).toFixed(2)} ₺</span>
                    </div>
                  ))}
                </div>
                
                <div className="font-bold" style={{ borderTop: '1px dashed black', paddingTop: '6px', fontSize: '11px' }}>
                  <div className="flex-between">
                    <span>TOPLAM:</span>
                    <span>{lastCart.reduce((sum, i) => sum + ((parseFloat(i.price) || 0) * i.quantity), 0).toFixed(2)} ₺</span>
                  </div>
                  <div className="flex-between" style={{ fontWeight: 'normal', fontSize: '10px', marginTop: '4px' }}>
                    <span>Ödeme Yöntemi:</span>
                    <span>{paymentMethod === 'cash' ? 'NAKİT' : 'KREDİ KARTI'}</span>
                  </div>
                </div>

                {lastFiscal && (
                  <div style={{ marginTop: '12px', paddingTop: '6px', borderTop: '1px dashed black', fontSize: '9px', textAlign: 'center' }}>
                    <p style={{ margin: '2px 0' }}>FİŞ NO: {lastFiscal.receiptNo}</p>
                    <p style={{ margin: '2px 0' }}>Z NO: {lastFiscal.zNo}</p>
                    <p style={{ margin: '2px 0' }}>CİHAZ: {lastFiscal.brand} - {lastFiscal.terminal}</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>MALİ MÜHÜR</p>
                  </div>
                )}
                
                <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '9px', borderTop: '1px dashed black', paddingTop: '6px' }}>
                  <p style={{ margin: '0' }}>Bizi tercih ettiğiniz için teşekkürler!</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={handlePrintReceipt}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Printer className="h-5 w-5" />
                  {lang === 'tr' ? 'Fiş Yazdır' : 'Print Receipt'}
                </button>
                <button 
                  onClick={() => {
                    setShowSuccess(false);
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  {lang === 'tr' ? 'Devam Et' : 'Continue'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Happy Hour Campaign Modal */}
        {showHappyHourModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100">
                    <Flame className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">
                      {lang === 'tr' ? 'Happy Hour (Mutlu Saatler) Kampanyası' : 'Happy Hour Campaign'}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">
                      {lang === 'tr' ? 'Düşük talep saatlerini canlandırmak için özel fiyatlar' : 'Special prices to boost low-demand hours'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHappyHourModal(false)}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-5 overflow-y-auto pr-1 flex-1 min-h-0 text-slate-600">
                
                {/* Active Indicator status banner */}
                <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isHappyHourActive
                    ? 'bg-rose-50 border-rose-100 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${isHappyHourActive ? 'bg-rose-500 animate-ping' : 'bg-slate-300'}`} />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">
                        {lang === 'tr' ? 'KAMPANYA DURUMU' : 'CAMPAIGN STATUS'}
                      </span>
                      <span className="text-sm font-bold">
                        {isHappyHourActive
                          ? (lang === 'tr' ? 'Şu An Happy Hour Fiyatları Aktif!' : 'Happy Hour Prices Are Active Right Now!')
                          : (lang === 'tr' ? 'Kampanya Şu Anda Aktif Değil' : 'Campaign is Currently Inactive')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Countdown helper */}
                  {isHappyHourActive && !forceHappyHour && (
                    <span className="text-xs bg-rose-600 text-white font-extrabold px-2.5 py-1 rounded-full">
                      {lang === 'tr' ? `Saat ${happyHourConfig.endHour}:00'a kadar` : `Until ${happyHourConfig.endHour}:00`}
                    </span>
                  )}
                </div>

                {/* Configuration Controls */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    {lang === 'tr' ? 'Kampanya Zamanlama Ayarları' : 'Campaign Schedule Settings'}
                  </h4>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-xs font-bold text-slate-700">{lang === 'tr' ? 'Zamanlama Etkinleştir' : 'Enable Schedule'}</span>
                    <button
                      onClick={() => setHappyHourConfig(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
                      className={`w-11 h-6 rounded-full transition-all relative ${happyHourConfig.isEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-all ${happyHourConfig.isEnabled ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {happyHourConfig.isEnabled && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          {lang === 'tr' ? 'Başlangıç Saati' : 'Start Hour'}
                        </label>
                        <select
                          value={happyHourConfig.startHour}
                          onChange={(e) => setHappyHourConfig(prev => ({ ...prev, startHour: parseInt(e.target.value) }))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                        >
                          {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={i}>{i < 10 ? `0${i}` : i}:00</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          {lang === 'tr' ? 'Bitiş Saati' : 'End Hour'}
                        </label>
                        <select
                          value={happyHourConfig.endHour}
                          onChange={(e) => setHappyHourConfig(prev => ({ ...prev, endHour: parseInt(e.target.value) }))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                        >
                          {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={i}>{i < 10 ? `0${i}` : i}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual Override controls */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                    {lang === 'tr' ? 'Manuel Müdahale / Ezme Modu' : 'Manual Override / Force Mode'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setForceHappyHour(null)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${forceHappyHour === null ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      🕒 {lang === 'tr' ? 'Zamanlamaya Bırak' : 'Use Schedule'}
                    </button>
                    <button
                      onClick={() => setForceHappyHour(true)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${forceHappyHour === true ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      🔥 {lang === 'tr' ? 'Her Zaman Aktif Et' : 'Force Always On'}
                    </button>
                    <button
                      onClick={() => setForceHappyHour(false)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${forceHappyHour === false ? 'bg-slate-700 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      ❌ {lang === 'tr' ? 'Tamamen Devre Dışı' : 'Force Always Off'}
                    </button>
                  </div>
                </div>

                {/* Affected Products Quick list */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                    {lang === 'tr' ? 'Happy Hour Fiyatı Tanımlı Ürünler (Alternatif Fiyat 2)' : 'Happy Hour Priced Products (Alternative Price 2)'}
                  </span>

                  <div className="border border-slate-150 rounded-2xl overflow-hidden max-h-[160px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase border-b border-slate-150">
                          <th className="p-2.5">{lang === 'tr' ? 'Ürün Adı' : 'Product'}</th>
                          <th className="p-2.5 text-right">{lang === 'tr' ? 'Normal Fiyat' : 'Regular'}</th>
                          <th className="p-2.5 text-right text-rose-600">{lang === 'tr' ? 'Happy Hour' : 'Promo'}</th>
                          <th className="p-2.5 text-right">{lang === 'tr' ? 'İndirim' : 'Discount'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allProducts.filter(p => p.price_2 && parseFloat(p.price_2.toString()) > 0).length > 0 ? (
                          allProducts
                            .filter(p => p.price_2 && parseFloat(p.price_2.toString()) > 0)
                            .map((p) => {
                              const disc = (((parseFloat(p.price) - parseFloat(p.price_2)) / parseFloat(p.price)) * 100).toFixed(0);
                              return (
                                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 font-semibold text-slate-700">
                                  <td className="p-2.5 truncate max-w-[150px]">{p.name}</td>
                                  <td className="p-2.5 text-right line-through text-slate-400">{p.price} {p.currency}</td>
                                  <td className="p-2.5 text-right text-rose-600 font-bold">{p.price_2} {p.currency}</td>
                                  <td className="p-2.5 text-right text-emerald-600 font-extrabold">%{disc}</td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400 font-medium">
                              {lang === 'tr' ? 'Fiyat 2 (Alternatif Fiyat) girilmiş ürün bulunmamaktadır.' : 'No products have alternative price 2 configured.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => setShowHappyHourModal(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all active:scale-[0.98]"
                >
                  {lang === 'tr' ? 'Kaydet ve Kapat' : 'Save & Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Split / Partial Payment Modal */}
        {showSplitModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                    <Split className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                      {lang === 'tr' ? 'Alman Usulü / Parçalı Ödeme' : 'Split / Partial Payment'}
                      {selectedTable && (
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                          {selectedTable}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">
                      {lang === 'tr' ? 'Adisyondan erken kalkanın hesabını ödeyin veya tutarı bölüşün' : 'Pay early items or split the total bill'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSplitModal(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => setSplitTab('item_split')}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    splitTab === 'item_split'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Coffee className="h-3.5 w-3.5 text-amber-500" />
                  {lang === 'tr' ? '📦 Ürün Bazlı (Kişi Namına)' : '📦 Itemized Split'}
                </button>
                <button
                  type="button"
                  onClick={() => setSplitTab('amount_split')}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    splitTab === 'amount_split'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Divide className="h-3.5 w-3.5 text-indigo-500" />
                  {lang === 'tr' ? '⚖️ Tutar / Eşit Bölüşme' : '⚖️ Amount / Equal Split'}
                </button>
              </div>

              {/* Total Order Info */}
              <div className="bg-slate-50 rounded-2xl p-3.5 mb-4 flex items-center justify-between border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {lang === 'tr' ? 'Masa Adisyon Toplamı' : 'Total Table Order'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {total.toFixed(2)} ₺
                </span>
              </div>

              {/* TAB 1: ITEM-BASED PARÇALI ÖDEME */}
              {splitTab === 'item_split' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      {lang === 'tr' ? 'Ödenecek Ürünleri Seçin' : 'Select Items To Pay Now'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected: Record<number, number> = {};
                        cart.forEach((item, idx) => { allSelected[idx] = item.quantity; });
                        setSelectedSplitItems(allSelected);
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      {lang === 'tr' ? 'Tümünü Seç' : 'Select All'}
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4 scrollbar-thin">
                    {cart.map((item, idx) => {
                      const itemPrice = parseFloat(item.price) || 0;
                      const selectedQty = selectedSplitItems[idx] || 0;

                      return (
                        <div 
                          key={idx}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                            selectedQty > 0 
                              ? 'bg-amber-50/60 border-amber-300 shadow-xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-slate-800 truncate">{item.name}</h5>
                            <p className="text-[11px] text-slate-400 font-semibold">
                              {itemPrice.toFixed(2)} ₺ / adet (Toplam {item.quantity} adet)
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const newQty = Math.max(0, selectedQty - 1);
                                setSelectedSplitItems({ ...selectedSplitItems, [idx]: newQty });
                              }}
                              disabled={selectedQty <= 0}
                              className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <span className="w-8 text-center font-black text-xs text-slate-900">
                              {selectedQty} / {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                const newQty = Math.min(item.quantity, selectedQty + 1);
                                setSelectedSplitItems({ ...selectedSplitItems, [idx]: newQty });
                              }}
                              disabled={selectedQty >= item.quantity}
                              className="h-7 w-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-30 text-indigo-700 flex items-center justify-center font-bold text-sm cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calculations & Payment Method */}
                  {(() => {
                    let paidTotal = 0;
                    cart.forEach((item, idx) => {
                      const payQty = selectedSplitItems[idx] || 0;
                      paidTotal += payQty * (parseFloat(item.price) || 0);
                    });
                    const remainingTotal = total - paidTotal;

                    return (
                      <div className="border-t border-slate-100 pt-3 space-y-3">
                        {/* Summary Badges */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-emerald-50 border border-emerald-200/70 rounded-2xl p-2.5 text-center">
                            <span className="text-[10px] font-black uppercase text-emerald-700 block tracking-wider">
                              {lang === 'tr' ? 'Ödenecek Tutar' : 'Amount To Pay'}
                            </span>
                            <span className="text-lg font-black text-emerald-800">
                              {paidTotal.toFixed(2)} ₺
                            </span>
                          </div>
                          <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-2.5 text-center">
                            <span className="text-[10px] font-black uppercase text-amber-700 block tracking-wider">
                              {lang === 'tr' ? 'Masada Kalan Tutar' : 'Remaining On Table'}
                            </span>
                            <span className="text-lg font-black text-amber-800">
                              {remainingTotal.toFixed(2)} ₺
                            </span>
                          </div>
                        </div>

                        {/* Payment Method Selector for this Partial Payment */}
                        <div>
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                            {lang === 'tr' ? 'Erken Kalkanın Ödeme Yöntemi' : 'Payment Method'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPartialPayMethod('cash')}
                              className={`py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                partialPayMethod === 'cash'
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <Banknote className="h-4 w-4" />
                              {lang === 'tr' ? 'Nakit' : 'Cash'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPartialPayMethod('credit_card')}
                              className={`py-2 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                partialPayMethod === 'credit_card'
                                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <CreditCard className="h-4 w-4" />
                              {lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowSplitModal(false)}
                            className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
                          >
                            {lang === 'tr' ? 'İptal' : 'Cancel'}
                          </button>

                          {paidTotal > 0 && remainingTotal > 0 ? (
                            <button
                              type="button"
                              disabled={completing}
                              onClick={handlePartialItemPayment}
                              className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-98 disabled:opacity-50"
                            >
                              {completing ? (
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Coffee className="h-4 w-4 text-emerald-200" />
                                  {lang === 'tr' ? `Kısmi Öde & Açık Tut (${paidTotal.toFixed(2)} ₺)` : `Pay Partial & Keep Open (${paidTotal.toFixed(2)} ₺)`}
                                </>
                              )}
                            </button>
                          ) : paidTotal > 0 && remainingTotal <= 0 ? (
                            <button
                              type="button"
                              disabled={completing}
                              onClick={handlePartialItemPayment}
                              className="py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md active:scale-98 disabled:opacity-50"
                            >
                              {completing ? (
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  {lang === 'tr' ? `Tüm Hesabı Kapat (${paidTotal.toFixed(2)} ₺)` : `Close All (${paidTotal.toFixed(2)} ₺)`}
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={true}
                              className="py-3 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs text-center cursor-not-allowed"
                            >
                              {lang === 'tr' ? 'Ürün Seçiniz' : 'Select Items'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 2: EQUAL / AMOUNT-BASED SPLIT */}
              {splitTab === 'amount_split' && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Equal Split Quick Tools */}
                  <div className="mb-4">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      {lang === 'tr' ? 'Hızlı Eşit Bölüşme' : 'Quick Equal Split'}
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {[2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleEqualSplit(num)}
                          className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Divide className="h-3 w-3 text-slate-400" />
                          {num} {lang === 'tr' ? 'Kişi' : 'People'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Rows */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                        {lang === 'tr' ? 'Ödeme Kalemleri' : 'Payment Breakdowns'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setSplitPayments([...splitPayments, { method: 'cash', amount: '0' }])}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {lang === 'tr' ? 'Ödeme Satırı Ekle' : 'Add Payment Row'}
                      </button>
                    </div>

                    {splitPayments.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs font-medium">
                        {lang === 'tr' ? 'Henüz ödeme satırı eklenmedi.' : 'No payment rows added yet.'}
                      </div>
                    ) : (
                      splitPayments.map((p, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          {/* Payment Method */}
                          <select
                            value={p.method}
                            onChange={(e) => {
                              const newPayments = [...splitPayments];
                              newPayments[idx].method = e.target.value as 'cash' | 'credit_card';
                              setSplitPayments(newPayments);
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="cash">{lang === 'tr' ? '💵 Nakit' : '💵 Cash'}</option>
                            <option value="credit_card">{lang === 'tr' ? '💳 Kredi Kartı' : '💳 Credit Card'}</option>
                          </select>

                          {/* Amount input */}
                          <div className="relative w-36">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={p.amount}
                              onChange={(e) => {
                                const newPayments = [...splitPayments];
                                newPayments[idx].amount = e.target.value;
                                setSplitPayments(newPayments);
                              }}
                              className="w-full text-right bg-white border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                              placeholder="0.00"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₺</span>
                          </div>

                          {/* Delete Button */}
                          {splitPayments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newPayments = splitPayments.filter((_, i) => i !== idx);
                                setSplitPayments(newPayments);
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Status & Validation calculation */}
                  {(() => {
                    const paidAmount = splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                    const diff = total - paidAmount;
                    const isMatch = Math.abs(diff) < 0.01;
                    const isOverpaid = diff < -0.01;
                    const isPartialAmount = paidAmount > 0 && paidAmount < total;

                    return (
                      <div className="border-t border-slate-100 pt-4 mb-2">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-2">
                          <span>{lang === 'tr' ? 'Girilen Toplam' : 'Total Entered'}:</span>
                          <span>{paidAmount.toFixed(2)} ₺</span>
                        </div>

                        {isMatch ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 mb-3">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>{lang === 'tr' ? 'Tutar Tamamlandı! Tüm masanın ödemesini onaylayabilirsiniz.' : 'Total matches! You can confirm full payment.'}</span>
                          </div>
                        ) : isOverpaid ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 mb-3">
                            <X className="h-4 w-4 shrink-0 animate-bounce" />
                            <span>{lang === 'tr' ? `Fazla Ödeme: ${Math.abs(diff).toFixed(2)} ₺` : `Overpaid: ${Math.abs(diff).toFixed(2)} ₺`}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 mb-3">
                            <span className="flex items-center gap-1.5">
                              <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                              <span>{lang === 'tr' ? `Kalan Tutar:` : `Remaining:`}</span>
                            </span>
                            <span>{diff.toFixed(2)} ₺</span>
                          </div>
                        )}

                        {/* Footer Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowSplitModal(false)}
                            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
                          >
                            {lang === 'tr' ? 'İptal Et' : 'Cancel'}
                          </button>

                          {isMatch ? (
                            <button
                              type="button"
                              disabled={completing}
                              onClick={handleFinalizeSplitSale}
                              className="w-full py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 font-bold rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md"
                            >
                              {completing ? (
                                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                  {lang === 'tr' ? 'Tüm Hesabı Kapat' : 'Close All'}
                                </>
                              )}
                            </button>
                          ) : isPartialAmount ? (
                            <button
                              type="button"
                              disabled={completing}
                              onClick={() => handlePartialAmountPayment(paidAmount)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
                            >
                              {completing ? (
                                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Coffee className="h-3.5 w-3.5 text-emerald-200" />
                                  {lang === 'tr' ? `Kısmi Al & Açık Tut (${paidAmount.toFixed(2)} ₺)` : `Pay Partial (${paidAmount.toFixed(2)} ₺)`}
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={true}
                              className="w-full py-2.5 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs text-center cursor-not-allowed"
                            >
                              {lang === 'tr' ? 'Tutar Giriniz' : 'Enter Amount'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Printer Diagnostic Tool Modal */}
        {showPrinterDiagnosticModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">
                      {lang === 'tr' ? 'Yazıcı Durumu ve Ağ Tanı Aracı' : 'Printer Status & Diagnostics'}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">
                      {lang === 'tr' ? 'Yerel ağ ve donanım sorun gidericisi' : 'Local network & hardware troubleshooter'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPrinterDiagnosticModal(false)}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {printerDiagStep === 'idle' && (
                <div className="space-y-4 overflow-y-auto pr-1">
                  {/* Real Thermal Printer Test Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200/80 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                          <Printer className="w-4 h-4 text-amber-600" />
                          Teloca Termal Yazıcı Sınama Fişi (80mm)
                        </h4>
                        <p className="text-[11px] text-amber-800/80 font-medium">
                          Windows'a tanımlı termal yazıcıdan büyük ve okunaklı test çıktısı alın.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          printThermalReceipt({
                            title: "TERMAL YAZICI SINAMA SAYFASI",
                            storeName: branding?.store_name || branding?.name || "TELOCA CAFE",
                            storePhone: branding?.phone || branding?.whatsapp_number,
                            tableNo: "TEST MASA 1",
                            saleId: "9999",
                            items: [
                              { name: "Türk Kahvesi (Orta)", quantity: 1, price: 45 },
                              { name: "Demli Çay", quantity: 2, price: 30 },
                              { name: "Şekerli Çay", quantity: 1, price: 15 }
                            ],
                            totalAmount: 120,
                            paymentMethod: "WIN32 TEST OK",
                            notes: "Windows Sınama Sayfası Başarılı!"
                          });
                        }}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Printer className="w-4 h-4 text-amber-200" />
                        <span>Sınama Fişi Al</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 space-y-2">
                      <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                        Otomatik Adisyon & Ödeme Fişi Ayarları:
                      </span>
                      <label className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-50/50 transition-all">
                        <span className="text-xs font-bold text-slate-700">Adisyona Kaydet dediğimde otomatik yazdır</span>
                        <input
                          type="checkbox"
                          checked={autoPrintOnOrder}
                          onChange={handleToggleAutoPrintOrder}
                          className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-50/50 transition-all">
                        <span className="text-xs font-bold text-slate-700">Hesabı Kapat / Öde dediğimde otomatik yazdır</span>
                        <input
                          type="checkbox"
                          checked={autoPrintOnPay}
                          onChange={handleToggleAutoPrintPay}
                          className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {lang === 'tr' 
                      ? 'Aşağıdaki panel, mutfaktaki yazıcıların IP çakışmaları, kablo bağlantı hataları veya yazıcı çevrimdışı durumlarını tespit edip yönlendirme sunar.' 
                      : 'This panel detects printer IP conflicts, cable disconnected errors, or offline status and provides user-friendly instructions.'}
                  </p>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      {lang === 'tr' ? 'Simüle Edilecek Durumu Seçin:' : 'Select Scenario to Simulate:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button 
                        onClick={() => setPrinterDiagScenario('success')}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${printerDiagScenario === 'success' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                      >
                        ✅ {lang === 'tr' ? 'Her Şey Yolunda (Sorunsuz)' : 'All Good (Healthy)'}
                      </button>
                      <button 
                        onClick={() => setPrinterDiagScenario('ip_conflict')}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${printerDiagScenario === 'ip_conflict' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                      >
                        ⚠️ {lang === 'tr' ? 'IP Adresi Çakışması Hatası' : 'IP Address Conflict'}
                      </button>
                      <button 
                        onClick={() => setPrinterDiagScenario('offline')}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${printerDiagScenario === 'offline' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                      >
                        🔌 {lang === 'tr' ? 'Yazıcı Çevrimdışı / Kablo Yok' : 'Printer Offline / Cable Loose'}
                      </button>
                      <button 
                        onClick={() => setPrinterDiagScenario('paper_jam')}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${printerDiagScenario === 'paper_jam' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                      >
                        📄 {lang === 'tr' ? 'Kapak Açık / Kağıt Bitti' : 'Cover Open / Out of Paper'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPrinterDiagStep('testing');
                      setTimeout(() => {
                        setPrinterDiagStep('result');
                      }, 1500);
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4 animate-spin-slow" />
                    <span>{lang === 'tr' ? 'Tanılamayı Başlat (Ping & Durum)' : 'Start Diagnostics (Ping & Status)'}</span>
                  </button>
                </div>
              )}

              {printerDiagStep === 'testing' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold text-slate-600 animate-pulse">
                    {lang === 'tr' ? 'Yazıcıya Ping Gönderiliyor, Ağ Durumu Analiz Ediliyor...' : 'Pinging printer, analyzing network state...'}
                  </p>
                </div>
              )}

              {printerDiagStep === 'result' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">{lang === 'tr' ? 'Mutfak Yazıcı IP Adresi' : 'Kitchen Printer IP'}</span>
                      <span className="text-slate-700">192.168.1.102</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">{lang === 'tr' ? 'Print Server İletişimi' : 'Print Server Link'}</span>
                      <span className={printerDiagScenario === 'offline' ? 'text-rose-600' : 'text-emerald-600'}>
                        {printerDiagScenario === 'offline' ? 'FAILED' : 'OK'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">{lang === 'tr' ? 'Ağ Paket Kaybı (Loss)' : 'Packet Loss'}</span>
                      <span className={printerDiagScenario === 'offline' ? 'text-rose-600' : 'text-emerald-600'}>
                        {printerDiagScenario === 'offline' ? '100%' : '0%'}
                      </span>
                    </div>
                  </div>

                  {printerDiagScenario === 'success' && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-medium leading-relaxed">
                      <h4 className="font-bold text-sm mb-1">✅ {lang === 'tr' ? 'Yazıcı Sağlıklı Çalışıyor' : 'Printer is Healthy'}</h4>
                      {lang === 'tr' 
                        ? 'Yazıcınız yerel ağda başarıyla tespit edildi. Kağıt rulosu yeterli ve herhangi bir IP çakışması saptanmadı. Sipariş çıktısı alabilirsiniz.' 
                        : 'Your printer is successfully detected. Paper is sufficient and no IP conflict found. You can print orders.'}
                    </div>
                  )}

                  {printerDiagScenario === 'ip_conflict' && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-900 text-xs leading-relaxed">
                      <h4 className="font-bold text-sm mb-1 text-amber-800">⚠️ {lang === 'tr' ? 'IP Adresi Çakışması Tespit Edildi!' : 'IP Address Conflict Detected!'}</h4>
                      <p className="mb-2">
                        {lang === 'tr'
                          ? 'Mutfak Yazıcısının IP adresi (192.168.1.102) yerel ağdaki başka bir akıllı cihaz veya cep telefonu tarafından işgal edilmiş durumda!'
                          : 'The Kitchen Printer IP address (192.168.1.102) is being used by another device (like a smartphone or TV) on your network.'}
                      </p>
                      <span className="font-bold block mt-2 text-amber-900">{lang === 'tr' ? 'Çözüm Önerisi:' : 'Solution:'}</span>
                      <ul className="list-disc list-inside space-y-1 mt-1 font-semibold text-amber-800">
                        <li>{lang === 'tr' ? 'Mutfak yazıcısını kapatıp tekrar açın.' : 'Turn the printer off and on again.'}</li>
                        <li>{lang === 'tr' ? 'Yazıcınıza modem arayüzünden statik (sabit) bir IP adresi atayın.' : 'Assign a static IP address to the printer via your router settings.'}</li>
                        <li>{lang === 'tr' ? 'Yerel ağdaki diğer cihazların DHCP üzerinden çakışma yapmasını önlemek için modemi yeniden başlatın.' : 'Restart the router to clear DHCP IP allocation conflicts.'}</li>
                      </ul>
                    </div>
                  )}

                  {printerDiagScenario === 'offline' && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-900 text-xs leading-relaxed">
                      <h4 className="font-bold text-sm mb-1 text-rose-800">🔌 {lang === 'tr' ? 'Yazıcı Çevrimdışı / Bağlantı Koptu' : 'Printer Offline / Disconnected'}</h4>
                      <p className="mb-2">
                        {lang === 'tr'
                          ? 'Yazıcı ile yerel ağ üzerinden bağlantı kurulamadı. Print Server (Print-Daemon) çalışıyor ancak fiziksel yazıcıya erişemiyor.'
                          : 'Could not connect to the printer over the local network. The Print Server daemon is running but cannot reach the hardware.'}
                      </p>
                      <span className="font-bold block mt-2 text-rose-900">{lang === 'tr' ? 'Çözüm Önerisi:' : 'Solution:'}</span>
                      <ul className="list-disc list-inside space-y-1 mt-1 font-semibold text-rose-800">
                        <li>{lang === 'tr' ? 'Ethernet / LAN kablosunun yazıcının arkasına ve modeme tam oturduğundan emin olun.' : 'Ensure the Ethernet/LAN cable is plugged securely into the printer and router.'}</li>
                        <li>{lang === 'tr' ? 'Yazıcının güç ışığının yandığından emin olun.' : 'Check if the printer power light is green.'}</li>
                        <li>{lang === 'tr' ? 'Modemdeki yeşil LAN ışığının yanıp söndüğünü kontrol edin.' : 'Verify if the green LAN light is flashing on your router.'}</li>
                      </ul>
                    </div>
                  )}

                  {printerDiagScenario === 'paper_jam' && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-900 text-xs leading-relaxed">
                      <h4 className="font-bold text-sm mb-1 text-rose-800">📄 {lang === 'tr' ? 'Kağıt Sıkışması / Kapak Açık' : 'Paper Jam / Cover Open'}</h4>
                      <p className="mb-2">
                        {lang === 'tr'
                          ? 'Yazıcı ağda aktif ancak donanım hatası bildiriyor. Kağıt rulosu bitmiş, rulo sıkışmış veya üst kapak tam kapanmamış.'
                          : 'Printer is active on the network but reporting a hardware error. Paper is empty, jammed, or the top lid is not closed properly.'}
                      </p>
                      <span className="font-bold block mt-2 text-rose-900">{lang === 'tr' ? 'Çözüm Önerisi:' : 'Solution:'}</span>
                      <ul className="list-disc list-inside space-y-1 mt-1 font-semibold text-rose-800">
                        <li>{lang === 'tr' ? 'Yazıcının kapağını açıp kağıt rulosunu düzeltin veya yeni bir rulo takın.' : 'Open the lid, adjust the paper roll, or install a new paper roll.'}</li>
                        <li>{lang === 'tr' ? 'Kapağı sertçe bastırarak tam oturduğundan emin olun.' : 'Ensure the cover click-locks completely shut.'}</li>
                        <li>{lang === 'tr' ? 'Hata ışığının sönüp sönmediğini takip edin.' : 'Check if the red error LED goes off.'}</li>
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setPrinterDiagStep('idle')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                    >
                      {lang === 'tr' ? 'Yeniden Test Et' : 'Test Again'}
                    </button>
                    <button
                      onClick={() => setShowPrinterDiagnosticModal(false)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      {lang === 'tr' ? 'Kapat' : 'Close'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* End of Day & Period Sales Report Modal (Gün Sonu ve Tarih Aralıklı Satış Raporu) */}
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-xs">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">
                      {lang === 'tr' ? 'Gün Sonu & Dönem Satış Raporu' : 'End of Day & Period Sales Report'}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">
                      {branding?.store_name || branding?.name || 'LOOKPRICE RESTORAN & POS'}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Date Filter & Presets Bar */}
              <div className="px-6 py-3.5 border-b border-slate-100 bg-white space-y-3">
                {/* Presets */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                      {lang === 'tr' ? 'Hızlı Aralık:' : 'Quick Range:'}
                    </span>
                    {[
                      { id: 'today', label: lang === 'tr' ? 'Bugün' : 'Today' },
                      { id: 'yesterday', label: lang === 'tr' ? 'Dün' : 'Yesterday' },
                      { id: 'week', label: lang === 'tr' ? 'Son 7 Gün' : 'Last 7 Days' },
                      { id: 'month', label: lang === 'tr' ? 'Bu Ay' : 'This Month' },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => handleApplyPreset(btn.id as any)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                          reportPreset === btn.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] font-black px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                    {reportStartDate === reportEndDate 
                      ? (lang === 'tr' ? `📅 Günlük: ${reportStartDate}` : `📅 Daily: ${reportStartDate}`) 
                      : (lang === 'tr' ? `📅 ${reportStartDate} ➔ ${reportEndDate}` : `📅 ${reportStartDate} ➔ ${reportEndDate}`)}
                  </div>
                </div>

                {/* Custom Date Pickers */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="text-xs font-bold text-slate-500 shrink-0">
                      {lang === 'tr' ? 'Başlangıç:' : 'Start:'}
                    </span>
                    <div className="relative flex-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <input 
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => {
                          setReportPreset('custom');
                          setReportStartDate(e.target.value);
                        }}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="text-xs font-bold text-slate-500 shrink-0">
                      {lang === 'tr' ? 'Bitiş:' : 'End:'}
                    </span>
                    <div className="relative flex-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <input 
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => {
                          setReportPreset('custom');
                          setReportEndDate(e.target.value);
                        }}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => fetchReport(reportStartDate, reportEndDate)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    title={lang === 'tr' ? 'Raporu Yenile' : 'Refresh Report'}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${reportLoading ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>{lang === 'tr' ? 'Yenile' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {reportLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
                    <RefreshCw className="h-10 w-10 animate-spin mb-4" />
                    <p className="text-sm font-bold text-slate-500">
                      {lang === 'tr' ? 'Rapor verileri hazırlanıyor...' : 'Loading report data...'}
                    </p>
                  </div>
                ) : reportData ? (
                  <>
                    {/* 4 Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Cash Card */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                              <Banknote className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">
                              {lang === 'tr' ? 'Nakit Satış' : 'Cash'}
                            </span>
                          </div>
                          <p className="text-lg font-black text-slate-800">
                            {(
                              reportData.payments
                                ?.filter((p: any) => ['cash', 'nakit'].includes(p.payment_method?.toLowerCase()))
                                ?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || Number(p.total) || 0), 0) || 0
                            ).toFixed(2)} ₺
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold mt-1">
                          {reportData.payments
                            ?.filter((p: any) => ['cash', 'nakit'].includes(p.payment_method?.toLowerCase()))
                            ?.reduce((sum: number, p: any) => sum + (Number(p.transaction_count) || 0), 0) || 0} {lang === 'tr' ? 'İşlem' : 'Txn'}
                        </span>
                      </div>

                      {/* Card Card */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="h-6 w-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              <CreditCard className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">
                              {lang === 'tr' ? 'Kredi Kartı' : 'Card'}
                            </span>
                          </div>
                          <p className="text-lg font-black text-slate-800">
                            {(
                              reportData.payments
                                ?.filter((p: any) => ['credit_card', 'card', 'kredi_karti', 'pos'].includes(p.payment_method?.toLowerCase()))
                                ?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || Number(p.total) || 0), 0) || 0
                            ).toFixed(2)} ₺
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold mt-1">
                          {reportData.payments
                            ?.filter((p: any) => ['credit_card', 'card', 'kredi_karti', 'pos'].includes(p.payment_method?.toLowerCase()))
                            ?.reduce((sum: number, p: any) => sum + (Number(p.transaction_count) || 0), 0) || 0} {lang === 'tr' ? 'İşlem' : 'Txn'}
                        </span>
                      </div>

                      {/* Items Sold Card */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="h-6 w-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                              <Package className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">
                              {lang === 'tr' ? 'Satılan Ürün' : 'Items Sold'}
                            </span>
                          </div>
                          <p className="text-lg font-black text-purple-700">
                            {(reportData.products?.reduce((sum: number, p: any) => sum + (Number(p.total_quantity) || 0), 0)) || 0} Adet
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold mt-1">
                          {reportData.products?.length || 0} {lang === 'tr' ? 'Farklı Ürün' : 'Unique Items'}
                        </span>
                      </div>

                      {/* Total Grand Revenue Card */}
                      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-4 rounded-2xl shadow-md shadow-indigo-600/20 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="h-6 w-6 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold">
                              <TrendingUp className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[11px] font-black text-indigo-100 uppercase tracking-tight">
                              {reportStartDate === reportEndDate ? (lang === 'tr' ? 'Gün Toplamı' : 'Day Total') : (lang === 'tr' ? 'Dönem Toplamı' : 'Period Total')}
                            </span>
                          </div>
                          <p className="text-lg font-black tracking-tight">
                            {((reportData.grand_total || reportData.payments?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || Number(p.total) || 0), 0)) || 0).toFixed(2)} ₺
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-200 font-bold mt-1">
                          {reportData.total_sales || 0} {lang === 'tr' ? 'Toplam Satış' : 'Total Sales'}
                        </span>
                      </div>
                    </div>

                    {/* Product Quantities breakdown table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                            {lang === 'tr' ? 'Satılan Ürün Kalemleri' : 'Sold Product Breakdown'}
                          </span>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black">
                            {reportData.products?.length || 0} {lang === 'tr' ? 'Kalem' : 'Items'}
                          </span>
                        </div>

                        {/* Search & Sort Controls */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input 
                              type="text"
                              placeholder={lang === 'tr' ? 'Ürün ara...' : 'Search items...'}
                              value={reportSearchQuery}
                              onChange={(e) => setReportSearchQuery(e.target.value)}
                              className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 w-36 sm:w-44"
                            />
                            {reportSearchQuery && (
                              <button 
                                onClick={() => setReportSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600">
                            <button
                              onClick={() => setReportSortBy('qty')}
                              className={`px-2 py-0.5 rounded-md transition-all ${reportSortBy === 'qty' ? 'bg-white text-indigo-700 font-black shadow-2xs' : 'hover:text-slate-900'}`}
                            >
                              {lang === 'tr' ? 'Adet' : 'Qty'}
                            </button>
                            <button
                              onClick={() => setReportSortBy('revenue')}
                              className={`px-2 py-0.5 rounded-md transition-all ${reportSortBy === 'revenue' ? 'bg-white text-indigo-700 font-black shadow-2xs' : 'hover:text-slate-900'}`}
                            >
                              {lang === 'tr' ? 'Ciro' : 'Rev'}
                            </button>
                            <button
                              onClick={() => setReportSortBy('name')}
                              className={`px-2 py-0.5 rounded-md transition-all ${reportSortBy === 'name' ? 'bg-white text-indigo-700 font-black shadow-2xs' : 'hover:text-slate-900'}`}
                            >
                              {lang === 'tr' ? 'A-Z' : 'A-Z'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Products List */}
                      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                        {reportData.products && reportData.products.length > 0 ? (
                          (() => {
                            const filtered = reportData.products.filter((p: any) => 
                              !reportSearchQuery || p.product_name.toLowerCase().includes(reportSearchQuery.toLowerCase())
                            );

                            const sorted = [...filtered].sort((a: any, b: any) => {
                              if (reportSortBy === 'qty') return (b.total_quantity || 0) - (a.total_quantity || 0);
                              if (reportSortBy === 'revenue') return (b.total_revenue || 0) - (a.total_revenue || 0);
                              return (a.product_name || '').localeCompare(b.product_name || '');
                            });

                            const maxRev = Math.max(...reportData.products.map((p: any) => p.total_revenue || 1));

                            if (sorted.length === 0) {
                              return (
                                <div className="p-8 text-center text-slate-400">
                                  <p className="text-xs font-bold">{lang === 'tr' ? 'Aramaya uygun ürün bulunamadı.' : 'No matching products found.'}</p>
                                </div>
                              );
                            }

                            return sorted.map((p: any, idx: number) => {
                              const unitPrice = p.total_quantity ? (p.total_revenue / p.total_quantity) : 0;
                              const revPct = maxRev > 0 ? Math.min(100, Math.round((p.total_revenue / maxRev) * 100)) : 0;

                              return (
                                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                  <div className="min-w-0 flex-1 pr-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black text-slate-400 w-5">{idx + 1}.</span>
                                      <p className="text-xs font-black text-slate-800 truncate">{p.product_name}</p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 pl-7">
                                      <p className="text-[10px] text-slate-400 font-bold">
                                        {unitPrice.toFixed(2)} ₺ / {lang === 'tr' ? 'birim' : 'unit'}
                                      </p>
                                      {/* Mini bar */}
                                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${revPct}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-right shrink-0">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black min-w-16 text-center">
                                      {p.total_quantity} {lang === 'tr' ? 'Adet' : 'Qty'}
                                    </span>
                                    <span className="text-xs font-black text-slate-800 min-w-20">
                                      {p.total_revenue?.toFixed(2)} ₺
                                    </span>
                                  </div>
                                </div>
                              );
                            });
                          })()
                        ) : (
                          <div className="p-12 text-center text-slate-400">
                            <Package className="h-10 w-10 mx-auto mb-2 opacity-25" />
                            <p className="text-xs font-bold">
                              {lang === 'tr' ? 'Bu tarih aralığında ürün satışı bulunmuyor' : 'No products sold in this period'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-25 text-slate-500" />
                    <p className="text-sm font-bold text-slate-600 mb-1">
                      {lang === 'tr' ? 'Seçilen Tarih Aralığına Ait Satış Raporu Bulunamadı' : 'No sales report found for selected range'}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {lang === 'tr' ? 'Bu zaman aralığında tamamlanmış POS satışı gerçekleşmemiş.' : 'No completed POS sales recorded in this date range.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer with Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-wrap gap-2.5 bg-slate-50/80">
                <button 
                  disabled={reportLoading || !reportData}
                  onClick={handlePrintReport}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-xs cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>{lang === 'tr' ? '80mm Termal Fiş Yazdır' : 'Print 80mm Receipt'}</span>
                </button>

                <button 
                  disabled={reportLoading || !reportData}
                  onClick={handlePrintA4Report}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-xs cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>{lang === 'tr' ? 'A4 Detaylı Rapor Yazdır' : 'Print A4 PDF Report'}</span>
                </button>

                <button 
                  onClick={() => setShowReportModal(false)}
                  className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  {lang === 'tr' ? 'Kapat' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showQrModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100">
                    <Coffee className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">
                      {lang === 'tr' ? 'Masalar & Dijital Menü QR Kodları' : 'Tables & Digital Menu QR Codes'}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">{branding?.store_name || branding?.name || 'LOOKPRICE'}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowQrModal(false)}
                  className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/30 p-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQrModalTab('single')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    qrModalTab === 'single'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {lang === 'tr' ? 'Tek Masa QR' : 'Single Table QR'}
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalTab('all')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    qrModalTab === 'all'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {lang === 'tr' ? 'Tüm Masalar Kataloğu' : 'All Tables Catalogue'}
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalTab('manage')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    qrModalTab === 'manage'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {lang === 'tr' ? 'Masa Sayısı & Yönetimi' : 'Table Count & Management'}
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                {qrModalTab === 'single' && (
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-sm mb-6">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1 flex justify-between items-center">
                        <span>{lang === 'tr' ? 'Yazdırılacak Masayı Seçin' : 'Select Table to Print'}</span>
                        {allTables.length > 0 && (
                          <span className="text-[10px] text-rose-500 font-extrabold normal-case bg-rose-50 px-2 py-0.5 rounded-md">
                            {lang === 'tr' ? `${allTables.length} Masa` : `${allTables.length} Tables`}
                          </span>
                        )}
                      </label>
                      <select
                        value={singleQrTable}
                        onChange={(e) => setSingleQrTable(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer mb-3"
                      >
                        {allTables.map((t) => (
                          <option key={t.id} value={t.table_number}>
                            {lang === 'tr' ? `Masa ${t.table_number}` : `Table ${t.table_number}`}
                          </option>
                        ))}
                        {allTables.length === 0 && (
                          <option value="">{lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}</option>
                        )}
                      </select>

                      {/* Visual interactive table selection grid */}
                      {allTables.length > 0 && (
                        <div className="bg-slate-100/60 border border-slate-200/50 p-2 rounded-2xl">
                          <p className="text-[10px] text-slate-400 font-bold mb-1.5 px-1 uppercase tracking-wider">
                            {lang === 'tr' ? 'Hızlı Masa Seçimi:' : 'Quick Table Selection:'}
                          </p>
                          <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-100">
                            {allTables.map((t) => {
                              const cleanNum = t.table_number.replace(/Masa/gi, '').trim();
                              const isSelected = singleQrTable === t.table_number;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => setSingleQrTable(t.table_number)}
                                  className={`py-2 px-1 rounded-lg text-xs font-black transition-all text-center ${
                                    isSelected
                                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/10'
                                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                                  }`}
                                >
                                  {cleanNum}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div id="pos-qr-card-printable-content" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center max-w-xs w-full">
                      {branding?.logo_url ? (
                        <img src={branding.logo_url} alt="" className="max-h-12 max-w-full mb-3 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mb-3 font-black text-base">
                          {branding?.store_name?.[0] || branding?.name?.[0] || 'M'}
                        </div>
                      )}
                      <h4 className="text-base font-black text-slate-800 uppercase tracking-tight mb-1 text-center truncate max-w-full">
                        {branding?.store_name || branding?.name || 'Seçkin Restoran'}
                      </h4>
                      <h3 className="text-xl font-black text-rose-600 mb-2">
                        {lang === 'tr' ? `MASA ${singleQrTable.replace(/Masa/gi, '').trim()}` : `TABLE ${singleQrTable.replace(/Masa/gi, '').trim()}`}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold mb-4 text-center tracking-wide uppercase">
                        {lang === 'tr' ? 'DİJİTAL MENÜ' : 'DIGITAL MENU'}
                      </p>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 flex items-center justify-center">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + "/digital-menu/" + storeId + "/" + singleQrTable.replace(/Masa/gi, '').trim())}`} 
                          alt="Digital Menu QR" 
                          className="h-36 w-36 object-contain"
                        />
                      </div>

                      <p className="text-[11px] font-bold text-slate-500 leading-relaxed text-center">
                        {lang === 'tr' ? 'Sipariş vermek ve menüyü incelemek için cep telefonunuzla taratın.' : 'Scan with your phone to view menu and order.'}
                      </p>
                      
                      <span className="text-[8px] text-slate-300 font-black mt-4 tracking-widest uppercase">
                        POWERED BY LOOKPRICE
                      </span>
                    </div>
                  </div>
                )}

                {qrModalTab === 'all' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div>
                        <h4 className="text-sm font-bold text-slate-700">
                          {lang === 'tr' ? 'Tüm Masa QR Kartları' : 'All Table QR Cards'}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {lang === 'tr' ? `${allTables.length} masanın tamamına ait QR katalog çıktılarını alın.` : `Get QR catalogue printouts for all ${allTables.length} tables.`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handlePrintAllQrs}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm shadow-indigo-100 active:scale-95"
                      >
                        <Printer className="h-4 w-4" />
                        {lang === 'tr' ? 'Hepsini Yazdır (A4)' : 'Print All (A4)'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-1">
                      {allTables.map((table) => {
                        const cleanNum = table.table_number.replace(/Masa/gi, '').trim();
                        return (
                          <div 
                            key={table.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-rose-200 transition-all flex flex-col items-center text-center relative group"
                          >
                            <h5 className="font-extrabold text-xs text-slate-400 tracking-wider mb-1 uppercase">
                              {lang === 'tr' ? `MASA ${cleanNum}` : `TABLE ${cleanNum}`}
                            </h5>
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 mb-3 flex items-center justify-center">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + "/digital-menu/" + storeId + "/" + cleanNum)}`} 
                                alt="" 
                                className="h-20 w-20 object-contain"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePrintSingleQr(cleanNum)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 w-full justify-center"
                            >
                              <Printer className="h-3 w-3" />
                              {lang === 'tr' ? 'Yazdır' : 'Print'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {qrModalTab === 'manage' && (
                  <div className="flex flex-col items-center py-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center">
                      <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100 mx-auto mb-4">
                        <Coffee className="h-6 w-6" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-lg mb-2">
                        {lang === 'tr' ? 'Masa Sayısını Arttırın / Azaltın' : 'Increase / Decrease Table Count'}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                        {lang === 'tr' 
                          ? 'Masa sayısını güncellediğinizde sistem yeni masaları otomatik olarak ekler ve QR kodlarını anında oluşturur. Mevcut siparişi (doluluğu) olan masalar korunur.'
                          : 'When you update the table count, the system automatically adds new tables and creates QR codes instantly. Tables with active orders remain protected.'}
                      </p>

                      <div className="flex items-center justify-center gap-6 mb-8">
                        <button
                          type="button"
                          onClick={() => setNewTableCount(prev => Math.max(1, prev - 1))}
                          className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all font-black text-xl active:scale-95"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="text-4xl font-black text-slate-800 tracking-tight font-sans min-w-[80px]">
                          {newTableCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewTableCount(prev => Math.min(200, prev + 1))}
                          className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all font-black text-xl active:scale-95"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveTableCount}
                        disabled={savingTableCount}
                        className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 active:scale-95"
                      >
                        {savingTableCount ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            {lang === 'tr' ? 'Masalar Güncelleniyor...' : 'Updating Tables...'}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            {lang === 'tr' ? 'Masa Sayısını Güncelle & Kaydet' : 'Update & Save Table Count'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
                {qrModalTab === 'single' && (
                  <button 
                    type="button"
                    onClick={handlePrintQr}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Printer className="h-4 w-4" />
                    {lang === 'tr' ? 'Seçili Masayı Yazdır' : 'Print Selected Table'}
                  </button>
                )}
                {qrModalTab === 'all' && (
                  <button 
                    type="button"
                    onClick={handlePrintAllQrs}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Printer className="h-4 w-4" />
                    {lang === 'tr' ? 'Tüm Kataloğu Yazdır (A4)' : 'Print All Catalogue (A4)'}
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  {lang === 'tr' ? 'Kapat' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isChangingTable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <ArrowLeftRight className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{lang === 'tr' ? 'Masa Taşıma / Değiştirme' : 'Table Transfer / Change'}</h3>
                    <p className="text-xs text-slate-400 font-semibold">{lang === 'tr' ? `${selectedTable} masasındaki adisyonu taşıyın` : `Transfer bill from ${selectedTable}`}</p>
                  </div>
                </div>
                <button onClick={() => setIsChangingTable(false)} className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {allTables.map((table) => (
                    <button
                      key={table.id}
                      disabled={table.status === 'occupied' || table.table_number === selectedTable || transferLoading}
                      onClick={() => handleTableTransfer(table.table_number)}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 group relative ${
                        table.table_number === selectedTable ? 'border-indigo-600 bg-indigo-50 opacity-50' :
                        table.status === 'occupied' ? 'border-rose-100 bg-rose-50 opacity-50 cursor-not-allowed' :
                        'border-slate-100 bg-white hover:border-indigo-500 hover:bg-indigo-50/30'
                      }`}
                    >
                      <span className={`text-sm font-black ${table.status === 'occupied' ? 'text-rose-600' : 'text-slate-900'}`}>{table.table_number}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {table.status === 'occupied' ? (lang === 'tr' ? 'DOLU' : 'FULL') : (lang === 'tr' ? 'BOŞ' : 'EMPTY')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button 
                  onClick={() => setIsChangingTable(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  {lang === 'tr' ? 'İptal' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Variant Selection Modal */}
        {variantModalProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col border border-slate-100"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{variantModalProduct.name}</h3>
                    <p className="text-xs text-indigo-600 font-bold">
                      {lang === 'tr' ? 'Lütfen seçenek seçiniz' : 'Please select an option'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setVariantModalProduct(null)} 
                  className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {lang === 'tr' ? 'Seçenekler & Varyantlar' : 'Options & Variants'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(variantModalProduct.variants || []).map((v: any, idx: number) => {
                    const varPrice = v.price && parseFloat(v.price) > 0 ? v.price : variantModalProduct.price;
                    const vStock = v.stock_quantity !== undefined && v.stock_quantity !== null && v.stock_quantity !== "" ? Number(v.stock_quantity) : undefined;
                    const isOutOfStock = vStock !== undefined && vStock <= 0;

                    return (
                      <button
                        key={v.id || idx}
                        disabled={isOutOfStock}
                        onClick={() => {
                          addToCart(variantModalProduct, v);
                          setVariantModalProduct(null);
                        }}
                        className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center group cursor-pointer shadow-xs relative ${
                          isOutOfStock 
                            ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                            : 'bg-white border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 active:scale-95'
                        }`}
                      >
                        {/* Image or Color Badge if present */}
                        {v.image_url ? (
                          <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden mb-2 border border-slate-100 flex items-center justify-center">
                            <img src={v.image_url} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        ) : v.color_code ? (
                          <div 
                            className="w-7 h-7 rounded-full border border-slate-300 shadow-xs mb-2" 
                            style={{ backgroundColor: v.color_code }} 
                            title={v.color_name || v.name}
                          />
                        ) : null}

                        <span className="text-sm font-black text-slate-900 group-hover:text-indigo-700 leading-tight">
                          {translateText(v.name, lang)}
                        </span>

                        {v.barcode && (
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                            {v.barcode}
                          </span>
                        )}

                        <div className="mt-2 pt-2 border-t border-slate-100 w-full flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-indigo-600">
                            {varPrice} {variantModalProduct.currency || 'TRY'}
                          </span>
                          {vStock !== undefined && (
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                              {isOutOfStock ? (lang === 'tr' ? 'Tükendi' : 'Out') : `${vStock} ${lang === 'tr' ? 'stok' : 'qty'}`}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setVariantModalProduct(null)}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all text-xs cursor-pointer"
                >
                  {lang === 'tr' ? 'İptal' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FastPosTab;
